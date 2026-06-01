/**
 * Production LDAP / Active Directory Permission Management Service
 *
 * Implements full AD/LDAP integration for enterprise permission management:
 * - Raw LDAP protocol over TCP/TLS using BER encoding
 * - AD authentication (UPN, sAMAccountName)
 * - Group membership resolution (nested groups)
 * - Permission synchronization & RBAC/ABAC authorization
 * - Audit trail & compliance
 */

import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import cacheService from '../cache/redisCacheService';
import net from 'net';
import tls from 'tls';

const LDAP_CACHE_NAMESPACE = 'ldap-permission';
const ROLE_MAPPINGS_KEY = 'role-mappings';
import crypto from 'crypto';
import { EventEmitter } from 'events';

// ─── Exported interfaces ────────────────────────────────────────────────────

export interface LDAPConfig {
  url: string;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  useTLS: boolean;
  tlsOptions?: {
    rejectUnauthorized: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  poolSize: number;
  connectTimeout: number;
  searchTimeout: number;
  reconnectInterval: number;
}

export interface ADUser {
  dn: string;
  sAMAccountName: string;
  userPrincipalName: string;
  displayName: string;
  email: string;
  department?: string;
  title?: string;
  manager?: string;
  memberOf: string[];
  accountEnabled: boolean;
  lastLogon?: Date;
  passwordLastSet?: Date;
  whenCreated: Date;
  whenChanged: Date;
}

export interface ADGroup {
  dn: string;
  cn: string;
  description?: string;
  members: string[];
  memberOf: string[];
  groupType: 'security' | 'distribution';
  scope: 'domain_local' | 'global' | 'universal';
}

export interface PermissionGrant {
  id: string;
  userId: string;
  resourceId: string;
  resourceType: string;
  permission: string;
  grantedBy: 'ad_group' | 'direct' | 'role' | 'inherited';
  sourceGroup?: string;
  expiresAt?: Date;
  conditions?: Record<string, any>;
}

export interface RoleMapping {
  adGroupDN: string;
  adGroupName: string;
  applicationRole: string;
  permissions: string[];
  priority: number;
  enabled: boolean;
}

export interface PermissionEvaluationResult {
  allowed: boolean;
  reason: string;
  matchedGrants: PermissionGrant[];
  deniedBy?: string;
  evaluationTimeMs: number;
}

// ─── BER Encoding/Decoding (ASN.1) ─────────────────────────────────────────

const BER_TAG = {
  BOOLEAN: 0x01,
  INTEGER: 0x02,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  ENUMERATED: 0x0a,
  SEQUENCE: 0x30,
  SET: 0x31,
  // LDAP-specific (context-class, constructed)
  BIND_REQUEST: 0x60,
  BIND_RESPONSE: 0x61,
  UNBIND_REQUEST: 0x42,
  SEARCH_REQUEST: 0x63,
  SEARCH_RESULT_ENTRY: 0x64,
  SEARCH_RESULT_DONE: 0x65,
  MODIFY_REQUEST: 0x66,
  MODIFY_RESPONSE: 0x67,
  ADD_REQUEST: 0x68,
  ADD_RESPONSE: 0x69,
  DELETE_REQUEST: 0x4a,
  DELETE_RESPONSE: 0x6b,
  COMPARE_REQUEST: 0x6e,
  COMPARE_RESPONSE: 0x6f,
  // Context-specific tags
  CONTEXT_0: 0x80,
  CONTEXT_3: 0xa3,
  CONTEXT_7: 0x87,
};

class BERWriter {
  private buffers: Buffer[] = [];

  writeBoolean(val: boolean): void {
    this.writeTag(BER_TAG.BOOLEAN);
    this.writeLength(1);
    this.buffers.push(Buffer.from([val ? 0xff : 0x00]));
  }

  writeInteger(val: number): void {
    this.writeTag(BER_TAG.INTEGER);
    const bytes = this.intToBytes(val);
    this.writeLength(bytes.length);
    this.buffers.push(bytes);
  }

  writeEnumerated(val: number): void {
    this.writeTag(BER_TAG.ENUMERATED);
    const bytes = this.intToBytes(val);
    this.writeLength(bytes.length);
    this.buffers.push(bytes);
  }

  writeString(val: string, tag: number = BER_TAG.OCTET_STRING): void {
    this.writeTag(tag);
    const buf = Buffer.from(val, 'utf-8');
    this.writeLength(buf.length);
    this.buffers.push(buf);
  }

  writeBuffer(buf: Buffer, tag: number = BER_TAG.OCTET_STRING): void {
    this.writeTag(tag);
    this.writeLength(buf.length);
    this.buffers.push(buf);
  }

  startSequence(tag: number = BER_TAG.SEQUENCE): BERSequenceWriter {
    return new BERSequenceWriter(this, tag);
  }

  writeRaw(buf: Buffer): void {
    this.buffers.push(buf);
  }

  private writeTag(tag: number): void {
    this.buffers.push(Buffer.from([tag]));
  }

  private writeLength(len: number): void {
    if (len < 0x80) {
      this.buffers.push(Buffer.from([len]));
    } else if (len < 0x100) {
      this.buffers.push(Buffer.from([0x81, len]));
    } else if (len < 0x10000) {
      this.buffers.push(Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]));
    } else {
      this.buffers.push(Buffer.from([0x83, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]));
    }
  }

  private intToBytes(val: number): Buffer {
    if (val >= -128 && val <= 127) return Buffer.from([val & 0xff]);
    if (val >= -32768 && val <= 32767) return Buffer.from([(val >> 8) & 0xff, val & 0xff]);
    if (val >= -8388608 && val <= 8388607) return Buffer.from([(val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff]);
    return Buffer.from([(val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff]);
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.buffers);
  }
}

class BERSequenceWriter {
  private inner = new BERWriter();
  constructor(private parent: BERWriter, private tag: number) {}

  get writer(): BERWriter { return this.inner; }

  end(): void {
    const content = this.inner.toBuffer();
    const tagBuf = Buffer.from([this.tag]);
    let lenBuf: Buffer;
    if (content.length < 0x80) {
      lenBuf = Buffer.from([content.length]);
    } else if (content.length < 0x100) {
      lenBuf = Buffer.from([0x81, content.length]);
    } else if (content.length < 0x10000) {
      lenBuf = Buffer.from([0x82, (content.length >> 8) & 0xff, content.length & 0xff]);
    } else {
      lenBuf = Buffer.from([0x83, (content.length >> 16) & 0xff, (content.length >> 8) & 0xff, content.length & 0xff]);
    }
    this.parent.writeRaw(Buffer.concat([tagBuf, lenBuf, content]));
  }
}

interface BERElement {
  tag: number;
  value: Buffer;
  children?: BERElement[];
}

function berDecode(buf: Buffer, offset: number = 0): { element: BERElement; bytesRead: number } {
  if (offset >= buf.length) throw new AppError('BER decode: unexpected end of data', 400);

  const tag = buf[offset];
  let pos = offset + 1;

  // Read length
  let length: number;
  if (buf[pos] < 0x80) {
    length = buf[pos];
    pos++;
  } else {
    const numBytes = buf[pos] & 0x7f;
    pos++;
    length = 0;
    for (let i = 0; i < numBytes; i++) {
      length = (length << 8) | buf[pos + i];
    }
    pos += numBytes;
  }

  const value = buf.slice(pos, pos + length);
  const element: BERElement = { tag, value };

  // If constructed (bit 5 set), decode children
  if (tag & 0x20) {
    element.children = [];
    let childOffset = 0;
    while (childOffset < value.length) {
      const { element: child, bytesRead } = berDecode(value, childOffset);
      element.children.push(child);
      childOffset += bytesRead;
    }
  }

  return { element, bytesRead: pos + length - offset };
}

function berDecodeInteger(buf: Buffer): number {
  let val = 0;
  if (buf.length > 0 && buf[0] & 0x80) val = -1; // Sign extend
  for (let i = 0; i < buf.length; i++) {
    val = (val << 8) | buf[i];
  }
  return val;
}

// ─── LDAP Connection ────────────────────────────────────────────────────────

class LDAPConnection extends EventEmitter {
  private socket: net.Socket | tls.TLSSocket | null = null;
  private messageId = 0;
  private pendingResponses: Map<number, { resolve: (val: any) => void; reject: (err: Error) => void; entries: any[] }> = new Map();
  private receiveBuffer = Buffer.alloc(0);
  private connected = false;
  private bound = false;

  constructor(private config: LDAPConfig) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.url);
      const host = url.hostname;
      const port = parseInt(url.port || (this.config.useTLS ? '636' : '389'), 10);
      const timeout = this.config.connectTimeout || 10000;

      const onConnect = () => {
        this.connected = true;
        this.socket!.removeListener('error', onError);
        logger.info(`[LDAP] Connected to ${host}:${port}`);
        resolve();
      };

      const onError = (err: Error) => {
        logger.error(`[LDAP] Connection error: ${err.message}`);
        reject(err);
      };

      if (this.config.useTLS) {
        this.socket = tls.connect({
          host,
          port,
          rejectUnauthorized: this.config.tlsOptions?.rejectUnauthorized ?? true,
          ca: this.config.tlsOptions?.ca ? [this.config.tlsOptions.ca] : undefined,
          cert: this.config.tlsOptions?.cert,
          key: this.config.tlsOptions?.key,
        }, onConnect);
      } else {
        this.socket = net.createConnection({ host, port }, onConnect);
      }

      this.socket.setTimeout(timeout);
      this.socket.once('error', onError);
      this.socket.on('data', (data) => this.onData(data));
      this.socket.on('close', () => {
        this.connected = false;
        this.bound = false;
        this.emit('close');
      });
      this.socket.on('timeout', () => {
        logger.warn('[LDAP] Connection timeout');
        this.socket?.destroy();
        reject(new Error('LDAP connection timeout'));
      });
    });
  }

  async bind(dn: string, password: string): Promise<{ resultCode: number }> {
    // Refuse to transmit a non-empty bind password over a non-encrypted socket.
    // Simple-auth BIND sends the password in the clear, so a plaintext transport
    // would expose admin/user credentials on the wire. Anonymous binds (empty
    // password) remain permitted. Set LDAP_USE_TLS or pass useTLS to enable LDAPS.
    const usingTls = this.config.useTLS === true || this.socket instanceof tls.TLSSocket;
    if (password && password.length > 0 && !usingTls) {
      throw new AppError(
        'Refusing LDAP simple bind with a password over a non-TLS connection; enable LDAPS (useTLS).',
        500
      );
    }

    const msgId = ++this.messageId;

    // Build bind request
    const writer = new BERWriter();
    const msgSeq = writer.startSequence(BER_TAG.SEQUENCE);

    // Message ID
    msgSeq.writer.writeInteger(msgId);

    // Bind Request
    const bindReq = msgSeq.writer.startSequence(BER_TAG.BIND_REQUEST);
    bindReq.writer.writeInteger(3); // LDAP version 3
    bindReq.writer.writeString(dn); // DN
    bindReq.writer.writeString(password, BER_TAG.CONTEXT_0); // Simple auth
    bindReq.end();

    msgSeq.end();

    const response = await this.sendAndWait(msgId, writer.toBuffer());
    const resultCode = this.extractResultCode(response);

    if (resultCode === 0) {
      this.bound = true;
      logger.info(`[LDAP] Bind successful for ${dn}`);
    } else {
      logger.warn(`[LDAP] Bind failed for ${dn}, result code: ${resultCode}`);
    }

    return { resultCode };
  }

  async search(baseDN: string, filter: string, attributes: string[] = [], scope: number = 2, sizeLimit: number = 1000): Promise<Array<{ dn: string; attributes: Record<string, string[]> }>> {
    const msgId = ++this.messageId;

    const writer = new BERWriter();
    const msgSeq = writer.startSequence(BER_TAG.SEQUENCE);
    msgSeq.writer.writeInteger(msgId);

    const searchReq = msgSeq.writer.startSequence(BER_TAG.SEARCH_REQUEST);
    searchReq.writer.writeString(baseDN); // Base DN
    searchReq.writer.writeEnumerated(scope); // Scope: 0=base, 1=one, 2=sub
    searchReq.writer.writeEnumerated(0); // Deref aliases: never
    searchReq.writer.writeInteger(sizeLimit); // Size limit
    searchReq.writer.writeInteger(this.config.searchTimeout || 30); // Time limit
    searchReq.writer.writeBoolean(false); // Types only

    // Encode filter
    const filterBuf = this.encodeFilter(filter);
    searchReq.writer.writeRaw(filterBuf);

    // Attributes
    const attrSeq = searchReq.writer.startSequence(BER_TAG.SEQUENCE);
    for (const attr of attributes) {
      attrSeq.writer.writeString(attr);
    }
    attrSeq.end();

    searchReq.end();
    msgSeq.end();

    const results = await this.sendAndWaitMulti(msgId, writer.toBuffer());
    return results;
  }

  async modify(dn: string, changes: Array<{ operation: 'add' | 'delete' | 'replace'; attribute: string; values: string[] }>): Promise<{ resultCode: number }> {
    const msgId = ++this.messageId;

    const writer = new BERWriter();
    const msgSeq = writer.startSequence(BER_TAG.SEQUENCE);
    msgSeq.writer.writeInteger(msgId);

    const modReq = msgSeq.writer.startSequence(BER_TAG.MODIFY_REQUEST);
    modReq.writer.writeString(dn);

    const changesSeq = modReq.writer.startSequence(BER_TAG.SEQUENCE);
    for (const change of changes) {
      const changeSeq = changesSeq.writer.startSequence(BER_TAG.SEQUENCE);
      const opCode = change.operation === 'add' ? 0 : change.operation === 'delete' ? 1 : 2;
      changeSeq.writer.writeEnumerated(opCode);

      const attrSeq = changeSeq.writer.startSequence(BER_TAG.SEQUENCE);
      attrSeq.writer.writeString(change.attribute);
      const valSet = attrSeq.writer.startSequence(BER_TAG.SET);
      for (const val of change.values) {
        valSet.writer.writeString(val);
      }
      valSet.end();
      attrSeq.end();
      changeSeq.end();
    }
    changesSeq.end();
    modReq.end();
    msgSeq.end();

    const response = await this.sendAndWait(msgId, writer.toBuffer());
    return { resultCode: this.extractResultCode(response) };
  }

  async unbind(): Promise<void> {
    if (!this.connected) return;
    const msgId = ++this.messageId;
    const writer = new BERWriter();
    const msgSeq = writer.startSequence(BER_TAG.SEQUENCE);
    msgSeq.writer.writeInteger(msgId);
    msgSeq.writer.writeString('', BER_TAG.UNBIND_REQUEST);
    msgSeq.end();

    this.socket?.write(writer.toBuffer());
    this.bound = false;
  }

  destroy(): void {
    this.socket?.destroy();
    this.connected = false;
    this.bound = false;
  }

  get isConnected(): boolean { return this.connected; }
  get isBound(): boolean { return this.bound; }

  // ── Filter Encoding ────────────────────────────────────────────────────

  private encodeFilter(filter: string): Buffer {
    filter = filter.trim();
    if (filter.startsWith('(') && filter.endsWith(')')) {
      filter = filter.slice(1, -1);
    }

    // AND filter
    if (filter.startsWith('&')) {
      return this.encodeCompoundFilter(0xa0, filter.slice(1));
    }
    // OR filter
    if (filter.startsWith('|')) {
      return this.encodeCompoundFilter(0xa1, filter.slice(1));
    }
    // NOT filter
    if (filter.startsWith('!')) {
      return this.encodeCompoundFilter(0xa2, filter.slice(1));
    }

    // Simple filter: attr=value, attr>=value, attr<=value, attr=*
    if (filter.includes('>=')) {
      const [attr, val] = filter.split('>=', 2);
      return this.encodeSimpleFilter(0xa5, attr.trim(), val.trim());
    }
    if (filter.includes('<=')) {
      const [attr, val] = filter.split('<=', 2);
      return this.encodeSimpleFilter(0xa6, attr.trim(), val.trim());
    }
    if (filter.includes('=')) {
      const eqIdx = filter.indexOf('=');
      const attr = filter.slice(0, eqIdx).trim();
      const val = filter.slice(eqIdx + 1).trim();

      if (val === '*') {
        // Present filter
        const attrBuf = Buffer.from(attr, 'utf-8');
        const tagBuf = Buffer.from([BER_TAG.CONTEXT_7]);
        const lenBuf = this.encodeLengthBuf(attrBuf.length);
        return Buffer.concat([tagBuf, lenBuf, attrBuf]);
      }

      if (val.includes('*')) {
        // Substring filter
        return this.encodeSubstringFilter(attr, val);
      }

      // Equality
      return this.encodeSimpleFilter(0xa3, attr, val);
    }

    // Fallback: present filter
    const attrBuf = Buffer.from(filter, 'utf-8');
    const tagBuf = Buffer.from([BER_TAG.CONTEXT_7]);
    const lenBuf = this.encodeLengthBuf(attrBuf.length);
    return Buffer.concat([tagBuf, lenBuf, attrBuf]);
  }

  private encodeCompoundFilter(tag: number, inner: string): Buffer {
    // Parse sub-filters from parenthesized expressions
    const subFilters: string[] = [];
    let depth = 0;
    let current = '';

    for (const ch of inner) {
      if (ch === '(') {
        depth++;
        current += ch;
      } else if (ch === ')') {
        depth--;
        current += ch;
        if (depth === 0) {
          subFilters.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current.trim()) subFilters.push(current.trim());

    const encodedSubs = subFilters.map(f => this.encodeFilter(f));
    const content = Buffer.concat(encodedSubs);

    const tagBuf = Buffer.from([tag]);
    const lenBuf = this.encodeLengthBuf(content.length);
    return Buffer.concat([tagBuf, lenBuf, content]);
  }

  private encodeSimpleFilter(tag: number, attr: string, value: string): Buffer {
    const attrBuf = Buffer.from(attr, 'utf-8');
    const valBuf = Buffer.from(value, 'utf-8');

    const attrTag = Buffer.from([BER_TAG.OCTET_STRING]);
    const attrLen = this.encodeLengthBuf(attrBuf.length);
    const valTag = Buffer.from([BER_TAG.OCTET_STRING]);
    const valLen = this.encodeLengthBuf(valBuf.length);

    const content = Buffer.concat([attrTag, attrLen, attrBuf, valTag, valLen, valBuf]);
    const tagBuf = Buffer.from([tag]);
    const lenBuf = this.encodeLengthBuf(content.length);
    return Buffer.concat([tagBuf, lenBuf, content]);
  }

  private encodeSubstringFilter(attr: string, value: string): Buffer {
    const parts = value.split('*');
    const attrBuf = Buffer.from(attr, 'utf-8');

    const substrParts: Buffer[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === '') continue;
      const partBuf = Buffer.from(parts[i], 'utf-8');
      let subTag: number;
      if (i === 0) subTag = 0x80; // initial
      else if (i === parts.length - 1) subTag = 0x82; // final
      else subTag = 0x81; // any
      substrParts.push(Buffer.concat([Buffer.from([subTag]), this.encodeLengthBuf(partBuf.length), partBuf]));
    }

    const subsContent = Buffer.concat(substrParts);
    const subsSeq = Buffer.concat([Buffer.from([BER_TAG.SEQUENCE]), this.encodeLengthBuf(subsContent.length), subsContent]);

    const attrEncoded = Buffer.concat([Buffer.from([BER_TAG.OCTET_STRING]), this.encodeLengthBuf(attrBuf.length), attrBuf]);
    const content = Buffer.concat([attrEncoded, subsSeq]);

    return Buffer.concat([Buffer.from([0xa4]), this.encodeLengthBuf(content.length), content]);
  }

  private encodeLengthBuf(len: number): Buffer {
    if (len < 0x80) return Buffer.from([len]);
    if (len < 0x100) return Buffer.from([0x81, len]);
    if (len < 0x10000) return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
    return Buffer.from([0x83, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]);
  }

  // ── Transport ──────────────────────────────────────────────────────────

  private sendAndWait(msgId: number, data: Buffer): Promise<BERElement> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(msgId);
        reject(new Error(`LDAP request ${msgId} timed out`));
      }, (this.config.searchTimeout || 30) * 1000);

      this.pendingResponses.set(msgId, {
        resolve: (val: any) => { clearTimeout(timeout); resolve(val); },
        reject: (err: Error) => { clearTimeout(timeout); reject(err); },
        entries: [],
      });

      this.socket?.write(data);
    });
  }

  private sendAndWaitMulti(msgId: number, data: Buffer): Promise<Array<{ dn: string; attributes: Record<string, string[]> }>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const pending = this.pendingResponses.get(msgId);
        this.pendingResponses.delete(msgId);
        resolve(pending?.entries || []);
      }, (this.config.searchTimeout || 30) * 1000);

      this.pendingResponses.set(msgId, {
        resolve: (val: any) => { clearTimeout(timeout); resolve(val); },
        reject: (err: Error) => { clearTimeout(timeout); reject(err); },
        entries: [],
      });

      this.socket?.write(data);
    });
  }

  private onData(data: Buffer): void {
    this.receiveBuffer = Buffer.concat([this.receiveBuffer, data]);

    while (this.receiveBuffer.length > 2) {
      try {
        const { element, bytesRead } = berDecode(this.receiveBuffer, 0);
        this.receiveBuffer = this.receiveBuffer.slice(bytesRead);
        this.handleMessage(element);
      } catch {
        break; // Incomplete message, wait for more data
      }
    }
  }

  private handleMessage(element: BERElement): void {
    if (!element.children || element.children.length < 2) return;

    const msgId = berDecodeInteger(element.children[0].value);
    const response = element.children[1];
    const pending = this.pendingResponses.get(msgId);

    if (!pending) return;

    switch (response.tag) {
      case BER_TAG.BIND_RESPONSE:
      case BER_TAG.MODIFY_RESPONSE:
      case BER_TAG.ADD_RESPONSE:
      case BER_TAG.DELETE_RESPONSE:
      case BER_TAG.COMPARE_RESPONSE:
        this.pendingResponses.delete(msgId);
        pending.resolve(response);
        break;

      case BER_TAG.SEARCH_RESULT_ENTRY:
        // Parse entry
        if (response.children && response.children.length >= 2) {
          const dn = response.children[0].value.toString('utf-8');
          const attrs: Record<string, string[]> = {};

          if (response.children[1].children) {
            for (const attrSeq of response.children[1].children) {
              if (attrSeq.children && attrSeq.children.length >= 2) {
                const attrName = attrSeq.children[0].value.toString('utf-8');
                const values: string[] = [];
                if (attrSeq.children[1].children) {
                  for (const valElem of attrSeq.children[1].children) {
                    values.push(valElem.value.toString('utf-8'));
                  }
                }
                attrs[attrName] = values;
              }
            }
          }

          pending.entries.push({ dn, attributes: attrs });
        }
        break;

      case BER_TAG.SEARCH_RESULT_DONE:
        this.pendingResponses.delete(msgId);
        pending.resolve(pending.entries);
        break;

      default:
        this.pendingResponses.delete(msgId);
        pending.resolve(response);
    }
  }

  private extractResultCode(element: BERElement): number {
    if (element.children && element.children.length > 0) {
      return berDecodeInteger(element.children[0].value);
    }
    return -1;
  }
}

// ─── Connection Pool ────────────────────────────────────────────────────────

class LDAPConnectionPool {
  private pool: LDAPConnection[] = [];
  private available: LDAPConnection[] = [];
  private waitQueue: Array<{ resolve: (conn: LDAPConnection) => void; reject: (err: Error) => void }> = [];

  constructor(private config: LDAPConfig) {}

  async initialize(): Promise<void> {
    const size = this.config.poolSize || 5;
    for (let i = 0; i < size; i++) {
      try {
        const conn = new LDAPConnection(this.config);
        await conn.connect();
        await conn.bind(this.config.bindDN, this.config.bindPassword);
        this.pool.push(conn);
        this.available.push(conn);

        conn.on('close', () => {
          this.pool = this.pool.filter(c => c !== conn);
          this.available = this.available.filter(c => c !== conn);
          this.replenish();
        });
      } catch (error) {
        logger.warn(`[LDAP Pool] Failed to create connection ${i + 1}/${size}`, error);
      }
    }
    logger.info(`[LDAP Pool] Initialized with ${this.pool.length}/${size} connections`);
  }

  async acquire(): Promise<LDAPConnection> {
    if (this.available.length > 0) {
      const conn = this.available.pop()!;
      if (conn.isConnected && conn.isBound) return conn;
      // Connection is stale, try to reconnect
      try {
        await conn.connect();
        await conn.bind(this.config.bindDN, this.config.bindPassword);
        return conn;
      } catch {
        // Failed, try another
        return this.acquire();
      }
    }

    // No available connections, wait
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const idx = this.waitQueue.findIndex(w => w.resolve === resolve);
        if (idx !== -1) this.waitQueue.splice(idx, 1);
        reject(new Error('LDAP connection pool exhausted'));
      }, this.config.connectTimeout || 10000);

      this.waitQueue.push({
        resolve: (conn) => { clearTimeout(timeout); resolve(conn); },
        reject: (err) => { clearTimeout(timeout); reject(err); },
      });
    });
  }

  release(conn: LDAPConnection): void {
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift()!;
      waiter.resolve(conn);
    } else {
      this.available.push(conn);
    }
  }

  private async replenish(): Promise<void> {
    const needed = (this.config.poolSize || 5) - this.pool.length;
    for (let i = 0; i < needed; i++) {
      try {
        const conn = new LDAPConnection(this.config);
        await conn.connect();
        await conn.bind(this.config.bindDN, this.config.bindPassword);
        this.pool.push(conn);
        this.available.push(conn);
        conn.on('close', () => {
          this.pool = this.pool.filter(c => c !== conn);
          this.available = this.available.filter(c => c !== conn);
          this.replenish();
        });
      } catch (error) {
        logger.warn('[LDAP Pool] Failed to replenish connection', error);
      }
    }
  }

  async destroy(): Promise<void> {
    for (const conn of this.pool) {
      try { await conn.unbind(); } catch (err) { logger.debug('[LDAP Pool] Error unbinding connection during destroy', err); }
      conn.destroy();
    }
    this.pool = [];
    this.available = [];
  }

  get size(): number { return this.pool.length; }
  get availableCount(): number { return this.available.length; }
}

// ─── Main Service ───────────────────────────────────────────────────────────

class LDAPPermissionService {
  private pool: LDAPConnectionPool | null = null;
  private config: LDAPConfig | null = null;
  private isInitialized = false;
  private roleMappings: Map<string, RoleMapping> = new Map();
  private permissionCache: Map<string, { grants: PermissionGrant[]; timestamp: number }> = new Map();
  private userCache: Map<string, { user: ADUser; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = parseInt(process.env.LDAP_CACHE_TTL_MS || '300000', 10); // 5 min default
  private auditLog: Array<{ timestamp: Date; action: string; userId?: string; details: string }> = [];

  // ── Initialization ──────────────────────────────────────────────────────

  async initialize(config?: Partial<LDAPConfig>): Promise<void> {
    if (this.isInitialized) return;

    this.config = {
      url: config?.url || process.env.LDAP_URL || 'ldap://localhost:389',
      baseDN: config?.baseDN || process.env.LDAP_BASE_DN || 'dc=company,dc=com',
      bindDN: config?.bindDN || process.env.LDAP_BIND_DN || 'cn=admin,dc=company,dc=com',
      bindPassword: config?.bindPassword || process.env.LDAP_BIND_PASSWORD || '',
      // Secure by default: use LDAPS unless TLS is explicitly disabled. A non-empty
      // bind password is refused over a non-TLS socket (see LDAPConnection.bind).
      useTLS: config?.useTLS ?? (process.env.LDAP_USE_TLS !== 'false'),
      tlsOptions: config?.tlsOptions || {
        rejectUnauthorized: process.env.LDAP_TLS_REJECT_UNAUTHORIZED !== 'false',
      },
      poolSize: config?.poolSize || parseInt(process.env.LDAP_POOL_SIZE || '5', 10),
      connectTimeout: config?.connectTimeout || parseInt(process.env.LDAP_CONNECT_TIMEOUT || '10000', 10),
      searchTimeout: config?.searchTimeout || parseInt(process.env.LDAP_SEARCH_TIMEOUT || '30', 10),
      reconnectInterval: config?.reconnectInterval || parseInt(process.env.LDAP_RECONNECT_INTERVAL || '5000', 10),
    };

    try {
      this.pool = new LDAPConnectionPool(this.config);
      await this.pool.initialize();
      this.startCacheCleanup();
      this.isInitialized = true;
      const restored = await this.hydrateRoleMappings();
      logger.info(`[LDAP] Service initialized successfully (restored ${restored} role mappings)`);
    } catch (error) {
      logger.error('[LDAP] Initialization failed', error);
      // Graceful degradation: service initializes but operates in offline mode
      this.isInitialized = true;
      await this.hydrateRoleMappings().catch(() => {});
      logger.warn('[LDAP] Running in offline mode - LDAP operations will use cached data');
    }
  }

  // ── Authentication ──────────────────────────────────────────────────────

  /**
   * Authenticate a user against Active Directory.
   */
  async authenticateUser(username: string, password: string): Promise<{ authenticated: boolean; user?: ADUser; error?: string }> {
    if (!this.config) throw new AppError('LDAP service not initialized', 500);

    try {
      // Create a temporary connection for the bind attempt
      const conn = new LDAPConnection(this.config);
      await conn.connect();

      // Determine bind DN
      let bindDN: string;
      if (username.includes('@')) {
        bindDN = username; // UPN format
      } else if (username.includes('\\')) {
        // DOMAIN\username format
        const [, user] = username.split('\\');
        bindDN = `${user}@${this.config.baseDN.split(',').filter(p => p.startsWith('dc=')).map(p => p.slice(3)).join('.')}`;
      } else {
        bindDN = `${username}@${this.config.baseDN.split(',').filter(p => p.startsWith('dc=')).map(p => p.slice(3)).join('.')}`;
      }

      const result = await conn.bind(bindDN, password);
      await conn.unbind();
      conn.destroy();

      if (result.resultCode === 0) {
        // Fetch user details
        const user = await this.findUser(username);
        if (user) {
          this.logAudit('authenticate', user.sAMAccountName, 'Authentication successful');
          return { authenticated: true, user };
        }
        return { authenticated: true };
      } else {
        this.logAudit('authenticate', username, `Authentication failed: result code ${result.resultCode}`);
        return { authenticated: false, error: this.ldapErrorMessage(result.resultCode) };
      }
    } catch (error: any) {
      logger.error(`[LDAP] Authentication error for ${username}`, error);
      return { authenticated: false, error: error.message };
    }
  }

  // ── User Operations ─────────────────────────────────────────────────────

  /**
   * Find a user by sAMAccountName or userPrincipalName.
   */
  async findUser(username: string): Promise<ADUser | null> {
    // Check cache first
    const cached = this.userCache.get(username);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) return cached.user;

    if (!this.pool || !this.config) return null;

    try {
      const conn = await this.pool.acquire();
      try {
        const filter = username.includes('@')
          ? `(userPrincipalName=${this.escapeLdapFilter(username)})`
          : `(sAMAccountName=${this.escapeLdapFilter(username)})`;

        const results = await conn.search(
          this.config.baseDN,
          filter,
          ['sAMAccountName', 'userPrincipalName', 'displayName', 'mail', 'department', 'title', 'manager', 'memberOf', 'userAccountControl', 'lastLogonTimestamp', 'pwdLastSet', 'whenCreated', 'whenChanged'],
          2, // subtree scope
          1
        );

        if (results.length === 0) return null;

        const entry = results[0];
        const user = this.parseADUser(entry);
        this.userCache.set(username, { user, timestamp: Date.now() });
        return user;
      } finally {
        this.pool.release(conn);
      }
    } catch (error) {
      logger.error(`[LDAP] Error finding user ${username}`, error);
      return null;
    }
  }

  /**
   * Search for users matching a filter.
   */
  async searchUsers(filter: string, limit: number = 100): Promise<ADUser[]> {
    if (!this.pool || !this.config) return [];

    try {
      const conn = await this.pool.acquire();
      try {
        const results = await conn.search(
          this.config.baseDN,
          `(&(objectClass=user)(objectCategory=person)${filter})`,
          ['sAMAccountName', 'userPrincipalName', 'displayName', 'mail', 'department', 'title', 'manager', 'memberOf', 'userAccountControl', 'whenCreated', 'whenChanged'],
          2,
          limit
        );
        return results.map(entry => this.parseADUser(entry));
      } finally {
        this.pool.release(conn);
      }
    } catch (error) {
      logger.error('[LDAP] User search error', error);
      return [];
    }
  }

  // ── Group Operations ────────────────────────────────────────────────────

  /**
   * Get group details including members.
   */
  async getGroup(groupDNorName: string): Promise<ADGroup | null> {
    if (!this.pool || !this.config) return null;

    try {
      const conn = await this.pool.acquire();
      try {
        const filter = groupDNorName.includes(',')
          ? `(distinguishedName=${this.escapeLdapFilter(groupDNorName)})`
          : `(cn=${this.escapeLdapFilter(groupDNorName)})`;

        const results = await conn.search(
          this.config.baseDN,
          `(&(objectClass=group)${filter})`,
          ['cn', 'description', 'member', 'memberOf', 'groupType'],
          2,
          1
        );

        if (results.length === 0) return null;
        return this.parseADGroup(results[0]);
      } finally {
        this.pool.release(conn);
      }
    } catch (error) {
      logger.error(`[LDAP] Error getting group ${groupDNorName}`, error);
      return null;
    }
  }

  /**
   * Resolve all group memberships for a user (including nested groups).
   */
  async resolveNestedGroups(userDN: string, maxDepth: number = 10): Promise<string[]> {
    if (!this.pool || !this.config) return [];

    const allGroups = new Set<string>();
    const toResolve = [userDN];
    let depth = 0;

    try {
      const conn = await this.pool.acquire();
      try {
        while (toResolve.length > 0 && depth < maxDepth) {
          const current = toResolve.shift()!;
          if (allGroups.has(current)) continue;

          const results = await conn.search(
            this.config.baseDN,
            `(member=${this.escapeLdapFilter(current)})`,
            ['distinguishedName', 'cn'],
            2,
            100
          );

          for (const entry of results) {
            const groupDN = entry.dn;
            if (!allGroups.has(groupDN)) {
              allGroups.add(groupDN);
              toResolve.push(groupDN); // Resolve nested
            }
          }
          depth++;
        }
      } finally {
        this.pool.release(conn);
      }
    } catch (error) {
      logger.error(`[LDAP] Error resolving nested groups for ${userDN}`, error);
    }

    return Array.from(allGroups);
  }

  // ── Role Mapping ────────────────────────────────────────────────────────
  //
  // Role mappings are mirrored to cacheService (Redis-backed in prod) so admin-
  // configured authorization survives restarts. Follow-up: migrate to a dedicated
  // `LDAPRoleMapping` Prisma model for org-scoped persistence and queryability.

  private async persistRoleMappings(): Promise<void> {
    try {
      await cacheService.set(
        ROLE_MAPPINGS_KEY,
        Array.from(this.roleMappings.entries()),
        { ttl: 0, namespace: LDAP_CACHE_NAMESPACE },
      );
    } catch (err) {
      logger.warn('[LDAP] Failed to persist role mappings to cache', err);
    }
  }

  async hydrateRoleMappings(): Promise<number> {
    const entries = await cacheService.get<Array<[string, RoleMapping]>>(
      ROLE_MAPPINGS_KEY,
      { namespace: LDAP_CACHE_NAMESPACE },
    );
    if (!entries || !Array.isArray(entries)) return 0;
    for (const [dn, mapping] of entries) {
      this.roleMappings.set(dn, mapping);
    }
    return entries.length;
  }

  /**
   * Configure a mapping from AD group to application role.
   */
  async addRoleMapping(mapping: RoleMapping): Promise<void> {
    this.roleMappings.set(mapping.adGroupDN, mapping);
    await this.persistRoleMappings();
    logger.info(`[LDAP] Role mapping added: ${mapping.adGroupName} -> ${mapping.applicationRole}`);
    this.logAudit('role_mapping_add', undefined, `Mapped ${mapping.adGroupName} to ${mapping.applicationRole}`);
  }

  async removeRoleMapping(adGroupDN: string): Promise<void> {
    this.roleMappings.delete(adGroupDN);
    await this.persistRoleMappings();
    this.logAudit('role_mapping_remove', undefined, `Removed mapping for ${adGroupDN}`);
  }

  getRoleMappings(): RoleMapping[] {
    return Array.from(this.roleMappings.values());
  }

  /**
   * Resolve application roles for a user based on their AD group memberships.
   */
  async resolveUserRoles(username: string): Promise<{ roles: string[]; permissions: string[]; mappings: RoleMapping[] }> {
    const user = await this.findUser(username);
    if (!user) return { roles: [], permissions: [], mappings: [] };

    const allGroups = await this.resolveNestedGroups(user.dn);
    const directGroups = new Set(user.memberOf);
    const allGroupSet = new Set([...directGroups, ...allGroups]);

    const matchedMappings: RoleMapping[] = [];
    const roles = new Set<string>();
    const permissions = new Set<string>();

    for (const [groupDN, mapping] of this.roleMappings.entries()) {
      if (mapping.enabled && allGroupSet.has(groupDN)) {
        matchedMappings.push(mapping);
        roles.add(mapping.applicationRole);
        for (const perm of mapping.permissions) permissions.add(perm);
      }
    }

    // Sort by priority
    matchedMappings.sort((a, b) => b.priority - a.priority);

    return {
      roles: Array.from(roles),
      permissions: Array.from(permissions),
      mappings: matchedMappings,
    };
  }

  /**
   * Synchronize AD groups to application roles for all users.
   */
  async syncAllPermissions(organizationId: string): Promise<{
    usersProcessed: number;
    permissionsGranted: number;
    permissionsRevoked: number;
    errors: string[];
  }> {
    const results = { usersProcessed: 0, permissionsGranted: 0, permissionsRevoked: 0, errors: [] as string[] };

    try {
      const users = await this.searchUsers('(objectClass=user)', 10000);

      for (const user of users) {
        try {
          const { roles, permissions } = await this.resolveUserRoles(user.sAMAccountName);

          // Get existing grants
          const cacheKey = `${user.sAMAccountName}:${organizationId}`;
          const existing = this.permissionCache.get(cacheKey);
          const existingPerms = new Set(existing?.grants.map(g => g.permission) || []);

          // Grant new permissions
          for (const perm of permissions) {
            if (!existingPerms.has(perm)) {
              results.permissionsGranted++;
            }
          }

          // Revoke removed permissions (permissions may be Set or array from resolveUserRoles)
          const permissionsSet = permissions instanceof Set ? permissions : new Set(permissions as string[]);
          for (const existPerm of existingPerms) {
            if (!permissionsSet.has(existPerm)) {
              results.permissionsRevoked++;
            }
          }

          // Update cache
          const grants: PermissionGrant[] = Array.from(permissions).map(perm => ({
            id: crypto.randomUUID(),
            userId: user.sAMAccountName,
            resourceId: '*',
            resourceType: 'application',
            permission: perm,
            grantedBy: 'ad_group',
            sourceGroup: user.memberOf[0],
          }));

          this.permissionCache.set(cacheKey, { grants, timestamp: Date.now() });
          results.usersProcessed++;
        } catch (error: any) {
          results.errors.push(`Error processing ${user.sAMAccountName}: ${error.message}`);
        }
      }
    } catch (error: any) {
      results.errors.push(`Sync failed: ${error.message}`);
    }

    this.logAudit('sync_permissions', undefined, `Processed ${results.usersProcessed} users, granted ${results.permissionsGranted}, revoked ${results.permissionsRevoked}`);
    return results;
  }

  // ── Authorization Engine ────────────────────────────────────────────────

  /**
   * Evaluate whether a user has permission to perform an action on a resource.
   */
  async evaluatePermission(
    userId: string,
    resourceId: string,
    resourceType: string,
    action: string,
    context?: Record<string, any>
  ): Promise<PermissionEvaluationResult> {
    const start = Date.now();

    try {
      // Get user's permissions
      const { permissions, roles } = await this.resolveUserRoles(userId);

      // Check for explicit deny
      const denyPermission = `deny:${resourceType}:${action}`;
      if (permissions.includes(denyPermission)) {
        return {
          allowed: false,
          reason: `Explicitly denied by permission: ${denyPermission}`,
          matchedGrants: [],
          deniedBy: denyPermission,
          evaluationTimeMs: Date.now() - start,
        };
      }

      // Check direct permissions
      const matchedGrants: PermissionGrant[] = [];
      const permPatterns = [
        `${resourceType}:${action}`,
        `${resourceType}:*`,
        `*:${action}`,
        `*:*`,
      ];

      for (const pattern of permPatterns) {
        if (permissions.includes(pattern)) {
          matchedGrants.push({
            id: crypto.randomUUID(),
            userId,
            resourceId,
            resourceType,
            permission: pattern,
            grantedBy: 'ad_group',
          });
        }
      }

      // Check role-based permissions
      const rolePermissions: Record<string, string[]> = {
        admin: ['*:*'],
        editor: ['*:read', '*:write', '*:update'],
        viewer: ['*:read'],
        analyst: ['*:read', 'report:*', 'dashboard:*'],
        auditor: ['*:read', 'audit:*', 'compliance:*'],
      };

      for (const role of roles) {
        const rolePerms = rolePermissions[role] || [];
        for (const pattern of permPatterns) {
          if (rolePerms.includes(pattern)) {
            matchedGrants.push({
              id: crypto.randomUUID(),
              userId,
              resourceId,
              resourceType,
              permission: pattern,
              grantedBy: 'role',
            });
          }
        }
      }

      // ABAC evaluation (time-based, IP-based)
      if (context) {
        if (context.timeRestriction) {
          const hour = new Date().getHours();
          const { startHour, endHour } = context.timeRestriction;
          if (hour < startHour || hour > endHour) {
            return {
              allowed: false,
              reason: `Access denied: outside allowed hours (${startHour}-${endHour})`,
              matchedGrants,
              deniedBy: 'time_restriction',
              evaluationTimeMs: Date.now() - start,
            };
          }
        }
      }

      const allowed = matchedGrants.length > 0;
      return {
        allowed,
        reason: allowed ? `Granted via ${matchedGrants[0].grantedBy}` : 'No matching permission found',
        matchedGrants,
        evaluationTimeMs: Date.now() - start,
      };
    } catch (error: any) {
      logger.error(`[LDAP] Permission evaluation error for ${userId}`, error);
      return {
        allowed: false,
        reason: `Evaluation error: ${error.message}`,
        matchedGrants: [],
        evaluationTimeMs: Date.now() - start,
      };
    }
  }

  // ── Audit & Compliance ──────────────────────────────────────────────────

  /**
   * Generate an access review report.
   */
  async generateAccessReviewReport(organizationId: string): Promise<{
    generatedAt: Date;
    totalUsers: number;
    totalGroups: number;
    roleMappings: RoleMapping[];
    orphanedAccounts: ADUser[];
    excessivePermissions: Array<{ userId: string; permissions: string[]; recommendation: string }>;
    separationOfDutiesViolations: Array<{ userId: string; conflictingRoles: string[] }>;
  }> {
    const users = await this.searchUsers('(objectClass=user)', 10000);
    const orphaned = users.filter(u => !u.accountEnabled);

    // Detect excessive permissions
    const excessivePermissions: Array<{ userId: string; permissions: string[]; recommendation: string }> = [];
    for (const user of users.slice(0, 100)) { // Limit for performance
      const { permissions } = await this.resolveUserRoles(user.sAMAccountName);
      if (permissions.includes('*:*') && user.title?.toLowerCase() !== 'administrator') {
        excessivePermissions.push({
          userId: user.sAMAccountName,
          permissions: Array.from(permissions),
          recommendation: 'Review admin-level access - user title does not indicate administrator role',
        });
      }
    }

    // Detect SoD violations
    const conflictingPairs = [
      ['finance:approve', 'finance:submit'],
      ['audit:execute', 'audit:approve'],
      ['admin:user_create', 'admin:user_approve'],
    ];

    const sodViolations: Array<{ userId: string; conflictingRoles: string[] }> = [];
    for (const user of users.slice(0, 100)) {
      const { permissions } = await this.resolveUserRoles(user.sAMAccountName);
      for (const [perm1, perm2] of conflictingPairs) {
        if (permissions.includes(perm1) && permissions.includes(perm2)) {
          sodViolations.push({
            userId: user.sAMAccountName,
            conflictingRoles: [perm1, perm2],
          });
        }
      }
    }

    return {
      generatedAt: new Date(),
      totalUsers: users.length,
      totalGroups: this.roleMappings.size,
      roleMappings: Array.from(this.roleMappings.values()),
      orphanedAccounts: orphaned,
      excessivePermissions,
      separationOfDutiesViolations: sodViolations,
    };
  }

  getAuditLog(limit: number = 100): Array<{ timestamp: Date; action: string; userId?: string; details: string }> {
    return this.auditLog.slice(-limit);
  }

  // ── Health ──────────────────────────────────────────────────────────────

  async healthCheck(): Promise<{ healthy: boolean; poolSize: number; available: number; latencyMs: number }> {
    const start = Date.now();
    try {
      if (!this.pool) return { healthy: false, poolSize: 0, available: 0, latencyMs: 0 };

      // Try a simple search
      const conn = await this.pool.acquire();
      try {
        await conn.search(this.config!.baseDN, '(objectClass=top)', ['dn'], 0, 1);
        return {
          healthy: true,
          poolSize: this.pool.size,
          available: this.pool.availableCount,
          latencyMs: Date.now() - start,
        };
      } finally {
        this.pool.release(conn);
      }
    } catch (error) {
      return { healthy: false, poolSize: this.pool?.size || 0, available: this.pool?.availableCount || 0, latencyMs: Date.now() - start };
    }
  }

  async shutdown(): Promise<void> {
    if (this.pool) {
      await this.pool.destroy();
      this.pool = null;
    }
    this.isInitialized = false;
    logger.info('[LDAP] Service shut down');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private parseADUser(entry: { dn: string; attributes: Record<string, string[]> }): ADUser {
    const attrs = entry.attributes;
    const uac = parseInt(attrs['userAccountControl']?.[0] || '0', 10);
    const accountEnabled = !(uac & 0x0002); // ACCOUNTDISABLE flag

    return {
      dn: entry.dn,
      sAMAccountName: attrs['sAMAccountName']?.[0] || '',
      userPrincipalName: attrs['userPrincipalName']?.[0] || '',
      displayName: attrs['displayName']?.[0] || '',
      email: attrs['mail']?.[0] || '',
      department: attrs['department']?.[0],
      title: attrs['title']?.[0],
      manager: attrs['manager']?.[0],
      memberOf: attrs['memberOf'] || [],
      accountEnabled,
      lastLogon: attrs['lastLogonTimestamp']?.[0] ? this.parseADTimestamp(attrs['lastLogonTimestamp'][0]) : undefined,
      passwordLastSet: attrs['pwdLastSet']?.[0] ? this.parseADTimestamp(attrs['pwdLastSet'][0]) : undefined,
      whenCreated: attrs['whenCreated']?.[0] ? this.parseGeneralizedTime(attrs['whenCreated'][0]) : new Date(),
      whenChanged: attrs['whenChanged']?.[0] ? this.parseGeneralizedTime(attrs['whenChanged'][0]) : new Date(),
    };
  }

  private parseADGroup(entry: { dn: string; attributes: Record<string, string[]> }): ADGroup {
    const attrs = entry.attributes;
    const groupTypeVal = parseInt(attrs['groupType']?.[0] || '0', 10);

    let groupType: 'security' | 'distribution' = 'security';
    if (!(groupTypeVal & 0x80000000)) groupType = 'distribution';

    let scope: 'domain_local' | 'global' | 'universal' = 'global';
    if (groupTypeVal & 0x04) scope = 'domain_local';
    else if (groupTypeVal & 0x08) scope = 'universal';

    return {
      dn: entry.dn,
      cn: attrs['cn']?.[0] || '',
      description: attrs['description']?.[0],
      members: attrs['member'] || [],
      memberOf: attrs['memberOf'] || [],
      groupType,
      scope,
    };
  }

  private parseADTimestamp(timestamp: string): Date {
    // AD timestamps are in 100ns intervals since 1/1/1601
    const adEpoch = BigInt('116444736000000000');
    const ticks = BigInt(timestamp);
    const unixMs = Number((ticks - adEpoch) / BigInt(10000));
    return new Date(unixMs);
  }

  private parseGeneralizedTime(time: string): Date {
    // Format: YYYYMMDDHHmmss.0Z
    const year = parseInt(time.slice(0, 4), 10);
    const month = parseInt(time.slice(4, 6), 10) - 1;
    const day = parseInt(time.slice(6, 8), 10);
    const hour = parseInt(time.slice(8, 10), 10);
    const min = parseInt(time.slice(10, 12), 10);
    const sec = parseInt(time.slice(12, 14), 10);
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }

  private escapeLdapFilter(value: string): string {
    return value
      .replace(/\\/g, '\\5c')
      .replace(/\*/g, '\\2a')
      .replace(/\(/g, '\\28')
      .replace(/\)/g, '\\29')
      .replace(/\0/g, '\\00');
  }

  private ldapErrorMessage(code: number): string {
    const errors: Record<number, string> = {
      0: 'Success',
      1: 'Operations error',
      2: 'Protocol error',
      3: 'Time limit exceeded',
      4: 'Size limit exceeded',
      7: 'Authentication method not supported',
      8: 'Stronger auth required',
      32: 'No such object',
      34: 'Invalid DN syntax',
      48: 'Inappropriate authentication',
      49: 'Invalid credentials',
      50: 'Insufficient access rights',
      53: 'Unwilling to perform',
      65: 'Object class violation',
      68: 'Entry already exists',
    };
    return errors[code] || `Unknown LDAP error (${code})`;
  }

  private logAudit(action: string, userId: string | undefined, details: string): void {
    this.auditLog.push({ timestamp: new Date(), action, userId, details });
    // Keep last 10000 entries
    if (this.auditLog.length > 10000) this.auditLog = this.auditLog.slice(-10000);
    logger.info(`[LDAP Audit] ${action}: ${details}${userId ? ` (user: ${userId})` : ''}`);
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.permissionCache.entries()) {
        if (now - entry.timestamp > this.CACHE_TTL_MS) this.permissionCache.delete(key);
      }
      for (const [key, entry] of this.userCache.entries()) {
        if (now - entry.timestamp > this.CACHE_TTL_MS) this.userCache.delete(key);
      }
    }, 60000).unref?.();
  }
}

export default new LDAPPermissionService();
