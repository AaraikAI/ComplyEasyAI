/**
 * ComplianceRegistry Contract Interaction Service
 *
 * TypeScript helper for interacting with deployed ComplianceRegistry contracts.
 * Provides typed wrappers for every contract function, event listener setup,
 * transaction retry logic with gas price bumping, batch transaction support,
 * and receipt verification with confirmation waiting.
 *
 * Usage:
 *   import { ContractInteraction } from './contractInteraction';
 *   const ci = new ContractInteraction({ providerUrl, contractAddress, privateKey });
 *   await ci.connect();
 *   await ci.issueCertificate({ ... });
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Certificate lifecycle status (mirrors the Solidity enum). */
export enum CertificateStatus {
  None = 0,
  Issued = 1,
  Active = 2,
  Revoked = 3,
  Expired = 4,
  Renewed = 5,
}

/** Parameters for issuing a certificate. */
export interface IssueCertificateParams {
  certId: string;
  orgId: string;
  framework: string;
  score: number;
  expiresAt: number;
  dataHash: string;
  metadataHash: string;
}

/** Parameters for renewing a certificate. */
export interface RenewCertificateParams {
  oldCertId: string;
  newCertId: string;
  newScore: number;
  newExpiresAt: number;
  newDataHash: string;
  newMetadataHash: string;
}

/** Parameters for submitting evidence. */
export interface SubmitEvidenceParams {
  evidenceId: string;
  certId: string;
  evidenceHash: string;
  evidenceType: string;
}

/** Parameters for recording a framework score. */
export interface RecordScoreParams {
  orgId: string;
  framework: string;
  score: number;
  evidenceHash: string;
}

/** Parameters for recording a policy change. */
export interface RecordPolicyChangeParams {
  orgId: string;
  policyId: string;
  oldHash: string;
  newHash: string;
  diffHash: string;
}

/** On-chain certificate representation. */
export interface CertificateData {
  orgId: string;
  framework: string;
  issuer: string;
  status: CertificateStatus;
  score: number;
  issuedAt: number;
  expiresAt: number;
  renewedFrom: string;
  dataHash: string;
  metadataHash: string;
}

/** On-chain evidence node representation. */
export interface EvidenceData {
  certId: string;
  evidenceHash: string;
  submitter: string;
  timestamp: number;
  prevNodeId: string;
  evidenceType: string;
}

/** On-chain framework score representation. */
export interface FrameworkScoreData {
  score: number;
  assessor: string;
  timestamp: number;
  historyLen: number;
}

/** On-chain policy change representation. */
export interface PolicyChangeData {
  policyId: string;
  author: string;
  timestamp: number;
  oldHash: string;
  newHash: string;
  diffHash: string;
}

/** Verification result from verifyCertificate. */
export interface VerificationResult {
  valid: boolean;
  status: CertificateStatus;
  score: number;
  expiresAt: number;
}

/** Transaction result with receipt metadata. */
export interface TxResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  effectiveGasPrice: string;
  status: number;
  events: ethers.Log[];
}

/** Configuration for the interaction service. */
export interface ContractInteractionConfig {
  providerUrl: string;
  contractAddress: string;
  privateKey: string;
  /** Number of block confirmations to wait for. Default: 1. */
  confirmations?: number;
  /** Maximum number of retry attempts for failed transactions. Default: 3. */
  maxRetries?: number;
  /** Gas price bump percentage per retry (e.g. 15 means +15%). Default: 15. */
  gasBumpPercent?: number;
  /** Transaction timeout in milliseconds. Default: 120000 (2 min). */
  txTimeoutMs?: number;
}

/** Callback type for event listeners. */
export type EventCallback = (...args: any[]) => void;

// ---------------------------------------------------------------------------
// Artifact Loading
// ---------------------------------------------------------------------------

function loadContractABI(): any[] {
  const artifactPath = path.resolve(__dirname, '../artifacts/ComplianceRegistry.json');
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`ComplianceRegistry artifact not found at ${artifactPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  return raw.abi;
}

// ---------------------------------------------------------------------------
// ContractInteraction Class
// ---------------------------------------------------------------------------

export class ContractInteraction {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private abi: any[];

  private readonly confirmations: number;
  private readonly maxRetries: number;
  private readonly gasBumpPercent: number;
  private readonly txTimeoutMs: number;

  private activeListeners: Map<string, EventCallback[]> = new Map();

  constructor(config: ContractInteractionConfig) {
    this.confirmations = config.confirmations ?? 1;
    this.maxRetries = config.maxRetries ?? 3;
    this.gasBumpPercent = config.gasBumpPercent ?? 15;
    this.txTimeoutMs = config.txTimeoutMs ?? 120_000;

    this.abi = loadContractABI();
    this.provider = new ethers.JsonRpcProvider(config.providerUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(config.contractAddress, this.abi, this.wallet);
  }

  // -----------------------------------------------------------------------
  // Connection Helpers
  // -----------------------------------------------------------------------

  /** Verify the connection and contract existence. */
  async connect(): Promise<{ chainId: bigint; blockNumber: number; contractCodeSize: number }> {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    const code = await this.provider.getCode(await this.contract.getAddress());
    const contractCodeSize = (code.length - 2) / 2; // hex string without 0x prefix, 2 hex chars = 1 byte

    if (code === '0x' || code === '0x0') {
      throw new Error(
        `No contract found at ${await this.contract.getAddress()} on chain ${network.chainId}`,
      );
    }

    return { chainId: network.chainId, blockNumber, contractCodeSize };
  }

  /** Return the deployer/signer address. */
  getSignerAddress(): string {
    return this.wallet.address;
  }

  /** Return the contract address. */
  async getContractAddress(): Promise<string> {
    return this.contract.getAddress();
  }

  // -----------------------------------------------------------------------
  // Transaction Execution with Retry Logic
  // -----------------------------------------------------------------------

  /**
   * Execute a contract write transaction with retry logic and gas bumping.
   *
   * On each retry the gas price is bumped by `gasBumpPercent`. The original
   * nonce is reused so the bumped transaction replaces the stuck one.
   */
  private async executeWithRetry(
    method: string,
    args: any[],
    overrides?: ethers.Overrides,
  ): Promise<TxResult> {
    let lastError: Error | null = null;
    let nonce: number | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Build transaction overrides
        const txOverrides: ethers.Overrides = { ...overrides };

        if (attempt === 0) {
          // First attempt: fetch nonce
          nonce = await this.wallet.getNonce('pending');
          txOverrides.nonce = nonce;
        } else {
          // Retry: reuse nonce, bump gas price
          txOverrides.nonce = nonce;
          const feeData = await this.provider.getFeeData();
          const bumpMultiplier = BigInt(100 + this.gasBumpPercent * attempt);

          if (feeData.maxFeePerGas) {
            txOverrides.maxFeePerGas = (feeData.maxFeePerGas * bumpMultiplier) / 100n;
            txOverrides.maxPriorityFeePerGas =
              ((feeData.maxPriorityFeePerGas ?? 0n) * bumpMultiplier) / 100n;
          } else if (feeData.gasPrice) {
            txOverrides.gasPrice = (feeData.gasPrice * bumpMultiplier) / 100n;
          }

          logger.warn(
            `[retry ${attempt}/${this.maxRetries}] Bumping gas ${this.gasBumpPercent * attempt}% for ${method}`,
          );
        }

        // Send transaction
        const tx = await this.contract[method](...args, txOverrides);

        // Wait for confirmations with timeout
        const receipt = await this.waitForReceipt(tx);

        return {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: (receipt.gasPrice ?? 0n).toString(),
          status: receipt.status ?? 0,
          events: [...(receipt.logs ?? [])],
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Only retry on transient failures (timeout, underpriced, network errors)
        const retryable =
          lastError.message.includes('timeout') ||
          lastError.message.includes('replacement fee too low') ||
          lastError.message.includes('transaction underpriced') ||
          lastError.message.includes('nonce has already been used') ||
          lastError.message.includes('ETIMEDOUT') ||
          lastError.message.includes('ECONNRESET') ||
          lastError.message.includes('SERVER_ERROR');

        if (!retryable || attempt === this.maxRetries) {
          break;
        }

        // Back off before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt), 30_000);
        logger.warn(`[retry] Waiting ${delay}ms before retry...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw lastError ?? new Error(`Transaction ${method} failed after ${this.maxRetries} retries`);
  }

  /**
   * Wait for a transaction receipt with a configurable timeout.
   */
  private async waitForReceipt(
    tx: ethers.ContractTransactionResponse,
  ): Promise<ethers.TransactionReceipt> {
    return new Promise<ethers.TransactionReceipt>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Transaction ${tx.hash} timed out after ${this.txTimeoutMs}ms`));
      }, this.txTimeoutMs);

      tx.wait(this.confirmations)
        .then((receipt) => {
          clearTimeout(timeout);
          if (!receipt) {
            reject(new Error(`No receipt returned for ${tx.hash}`));
            return;
          }
          if (receipt.status === 0) {
            reject(new Error(`Transaction ${tx.hash} reverted (status=0)`));
            return;
          }
          resolve(receipt);
        })
        .catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
    });
  }

  // -----------------------------------------------------------------------
  // Role Management
  // -----------------------------------------------------------------------

  async hasRole(role: string, account: string): Promise<boolean> {
    return this.contract.hasRole(role, account);
  }

  async grantRole(role: string, account: string): Promise<TxResult> {
    return this.executeWithRetry('grantRole', [role, account]);
  }

  async revokeRole(role: string, account: string): Promise<TxResult> {
    return this.executeWithRetry('revokeRole', [role, account]);
  }

  /** Well-known role hashes. */
  static readonly ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));
  static readonly AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_ROLE'));
  static readonly OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('OPERATOR_ROLE'));

  // -----------------------------------------------------------------------
  // Pause / Unpause
  // -----------------------------------------------------------------------

  async pause(): Promise<TxResult> {
    return this.executeWithRetry('pause', []);
  }

  async unpause(): Promise<TxResult> {
    return this.executeWithRetry('unpause', []);
  }

  async isPaused(): Promise<boolean> {
    return this.contract.paused();
  }

  // -----------------------------------------------------------------------
  // Certificate Lifecycle
  // -----------------------------------------------------------------------

  async issueCertificate(params: IssueCertificateParams): Promise<TxResult> {
    return this.executeWithRetry('issueCertificate', [
      params.certId,
      params.orgId,
      params.framework,
      params.score,
      params.expiresAt,
      params.dataHash,
      params.metadataHash,
    ]);
  }

  async activateCertificate(certId: string): Promise<TxResult> {
    return this.executeWithRetry('activateCertificate', [certId]);
  }

  async revokeCertificate(certId: string, reason: string): Promise<TxResult> {
    return this.executeWithRetry('revokeCertificate', [certId, reason]);
  }

  async renewCertificate(params: RenewCertificateParams): Promise<TxResult> {
    return this.executeWithRetry('renewCertificate', [
      params.oldCertId,
      params.newCertId,
      params.newScore,
      params.newExpiresAt,
      params.newDataHash,
      params.newMetadataHash,
    ]);
  }

  /**
   * Read a certificate's verification result (valid / status / score / expiry).
   *
   * `verifyCertificate` is declared state-mutating on-chain only for a lazy-expiry
   * optimisation (it may flip an Active-but-expired certificate to Expired). The
   * `staticCall` simulation evaluates that same logic, so the returned status and
   * validity already reflect current expiry. Reading via `staticCall` therefore
   * yields correct values without spending gas and without a read-after-write race.
   *
   * If the on-chain Expired flag must be persisted, drive it through a normal write
   * path (e.g. the certificate lifecycle methods); a read does not pay to persist it.
   */
  async verifyCertificate(certId: string): Promise<VerificationResult> {
    const result = await this.contract.verifyCertificate.staticCall(certId);
    return {
      valid: result[0],
      status: Number(result[1]) as CertificateStatus,
      score: Number(result[2]),
      expiresAt: Number(result[3]),
    };
  }

  async getCertificate(certId: string): Promise<CertificateData> {
    const result = await this.contract.getCertificate(certId);
    return {
      orgId: result[0],
      framework: result[1],
      issuer: result[2],
      status: Number(result[3]) as CertificateStatus,
      score: Number(result[4]),
      issuedAt: Number(result[5]),
      expiresAt: Number(result[6]),
      renewedFrom: result[7],
      dataHash: result[8],
      metadataHash: result[9],
    };
  }

  async certificateExists(certId: string): Promise<boolean> {
    return this.contract.certificateExists(certId);
  }

  async getOrgCertificates(orgId: string): Promise<string[]> {
    return this.contract.getOrgCertificates(orgId);
  }

  async getOrgCertificateCount(orgId: string): Promise<number> {
    const count = await this.contract.getOrgCertificateCount(orgId);
    return Number(count);
  }

  async getCertificateCount(): Promise<number> {
    const count = await this.contract.certificateCount();
    return Number(count);
  }

  // -----------------------------------------------------------------------
  // Evidence Chain-of-Custody
  // -----------------------------------------------------------------------

  async submitEvidence(params: SubmitEvidenceParams): Promise<TxResult> {
    return this.executeWithRetry('submitEvidence', [
      params.evidenceId,
      params.certId,
      params.evidenceHash,
      params.evidenceType,
    ]);
  }

  async getEvidence(evidenceId: string): Promise<EvidenceData> {
    const result = await this.contract.getEvidence(evidenceId);
    return {
      certId: result[0],
      evidenceHash: result[1],
      submitter: result[2],
      timestamp: Number(result[3]),
      prevNodeId: result[4],
      evidenceType: result[5],
    };
  }

  async getEvidenceChain(
    certId: string,
    limit: number = 0,
  ): Promise<{ hashes: string[]; nodeIds: string[] }> {
    const result = await this.contract.getEvidenceChain(certId, limit);
    return {
      hashes: result[0] as string[],
      nodeIds: result[1] as string[],
    };
  }

  async getEvidenceCount(): Promise<number> {
    const count = await this.contract.evidenceCount();
    return Number(count);
  }

  async getCertificateEvidenceCount(certId: string): Promise<number> {
    const count = await this.contract.certificateEvidenceCount(certId);
    return Number(count);
  }

  // -----------------------------------------------------------------------
  // Framework Compliance Scoring
  // -----------------------------------------------------------------------

  async recordFrameworkScore(params: RecordScoreParams): Promise<TxResult> {
    return this.executeWithRetry('recordFrameworkScore', [
      params.orgId,
      params.framework,
      params.score,
      params.evidenceHash,
    ]);
  }

  async getLatestFrameworkScore(
    orgId: string,
    framework: string,
  ): Promise<FrameworkScoreData> {
    const result = await this.contract.getLatestFrameworkScore(orgId, framework);
    return {
      score: Number(result[0]),
      assessor: result[1],
      timestamp: Number(result[2]),
      historyLen: Number(result[3]),
    };
  }

  async getFrameworkScoreHistory(
    orgId: string,
    framework: string,
    offset: number = 0,
    limit: number = 50,
  ): Promise<{
    assessors: string[];
    scores: number[];
    timestamps: number[];
    evidenceHashes: string[];
  }> {
    const result = await this.contract.getFrameworkScoreHistory(orgId, framework, offset, limit);
    return {
      assessors: result[0] as string[],
      scores: (result[1] as bigint[]).map(Number),
      timestamps: (result[2] as bigint[]).map(Number),
      evidenceHashes: result[3] as string[],
    };
  }

  async getLatestScoreByKey(scoreKey: string): Promise<number> {
    const score = await this.contract.latestScore(scoreKey);
    return Number(score);
  }

  async computeScoreKey(orgId: string, framework: string): Promise<string> {
    return this.contract.computeScoreKey(orgId, framework);
  }

  // -----------------------------------------------------------------------
  // Policy Change Audit Trail
  // -----------------------------------------------------------------------

  async recordPolicyChange(params: RecordPolicyChangeParams): Promise<TxResult> {
    return this.executeWithRetry('recordPolicyChange', [
      params.orgId,
      params.policyId,
      params.oldHash,
      params.newHash,
      params.diffHash,
    ]);
  }

  async getPolicyChangeCount(orgId: string): Promise<number> {
    const count = await this.contract.getPolicyChangeCount(orgId);
    return Number(count);
  }

  async getPolicyChange(orgId: string, index: number): Promise<PolicyChangeData> {
    const result = await this.contract.getPolicyChange(orgId, index);
    return {
      policyId: result[0],
      author: result[1],
      timestamp: Number(result[2]),
      oldHash: result[3],
      newHash: result[4],
      diffHash: result[5],
    };
  }

  async getPolicyChanges(
    orgId: string,
    offset: number = 0,
    limit: number = 50,
  ): Promise<{
    policyIds: string[];
    authors: string[];
    timestamps: number[];
    diffHashes: string[];
  }> {
    const result = await this.contract.getPolicyChanges(orgId, offset, limit);
    return {
      policyIds: result[0] as string[],
      authors: result[1] as string[],
      timestamps: (result[2] as bigint[]).map(Number),
      diffHashes: result[3] as string[],
    };
  }

  async getTotalPolicyChangeCount(): Promise<number> {
    const count = await this.contract.policyChangeCount();
    return Number(count);
  }

  // -----------------------------------------------------------------------
  // Batch Operations
  // -----------------------------------------------------------------------

  async batchIssueCertificates(
    certs: IssueCertificateParams[],
  ): Promise<TxResult> {
    return this.executeWithRetry('batchIssueCertificates', [
      certs.map((c) => c.certId),
      certs.map((c) => c.orgId),
      certs.map((c) => c.framework),
      certs.map((c) => c.score),
      certs.map((c) => c.expiresAt),
      certs.map((c) => c.dataHash),
      certs.map((c) => c.metadataHash),
    ]);
  }

  async batchSubmitEvidence(
    evidence: SubmitEvidenceParams[],
  ): Promise<TxResult> {
    return this.executeWithRetry('batchSubmitEvidence', [
      evidence.map((e) => e.evidenceId),
      evidence.map((e) => e.certId),
      evidence.map((e) => e.evidenceHash),
      evidence.map((e) => e.evidenceType),
    ]);
  }

  async batchRecordScores(
    scores: RecordScoreParams[],
  ): Promise<TxResult> {
    return this.executeWithRetry('batchRecordScores', [
      scores.map((s) => s.orgId),
      scores.map((s) => s.framework),
      scores.map((s) => s.score),
      scores.map((s) => s.evidenceHash),
    ]);
  }

  // -----------------------------------------------------------------------
  // Event Listeners
  // -----------------------------------------------------------------------

  /**
   * Subscribe to a contract event. Returns an unsubscribe function.
   * Uses ethers v6 event subscription API.
   */
  on(eventName: string, callback: EventCallback): () => void {
    this.contract.on(eventName, callback);

    // Track for cleanup
    if (!this.activeListeners.has(eventName)) {
      this.activeListeners.set(eventName, []);
    }
    this.activeListeners.get(eventName)!.push(callback);

    return () => {
      this.contract.off(eventName, callback);
      const listeners = this.activeListeners.get(eventName);
      if (listeners) {
        const idx = listeners.indexOf(callback);
        if (idx !== -1) listeners.splice(idx, 1);
      }
    };
  }

  /** Subscribe to CertificateIssued events. */
  onCertificateIssued(
    callback: (
      certId: string,
      orgId: string,
      framework: string,
      issuer: string,
      score: number,
      issuedAt: number,
      expiresAt: number,
      event: ethers.EventLog,
    ) => void,
  ): () => void {
    return this.on('CertificateIssued', (certId, orgId, framework, issuer, score, issuedAt, expiresAt, event) => {
      callback(certId, orgId, framework, issuer, Number(score), Number(issuedAt), Number(expiresAt), event);
    });
  }

  /** Subscribe to CertificateRevoked events. */
  onCertificateRevoked(
    callback: (certId: string, revoker: string, reason: string, event: ethers.EventLog) => void,
  ): () => void {
    return this.on('CertificateRevoked', callback);
  }

  /** Subscribe to CertificateRenewed events. */
  onCertificateRenewed(
    callback: (
      oldCertId: string,
      newCertId: string,
      renewer: string,
      event: ethers.EventLog,
    ) => void,
  ): () => void {
    return this.on('CertificateRenewed', callback);
  }

  /** Subscribe to EvidenceSubmitted events. */
  onEvidenceSubmitted(
    callback: (
      evidenceId: string,
      certId: string,
      evidenceHash: string,
      evidenceType: string,
      submitter: string,
      event: ethers.EventLog,
    ) => void,
  ): () => void {
    return this.on('EvidenceSubmitted', callback);
  }

  /** Subscribe to FrameworkScoreRecorded events. */
  onFrameworkScoreRecorded(
    callback: (
      orgId: string,
      framework: string,
      score: number,
      assessor: string,
      event: ethers.EventLog,
    ) => void,
  ): () => void {
    return this.on('FrameworkScoreRecorded', (orgId, framework, score, assessor, event) => {
      callback(orgId, framework, Number(score), assessor, event);
    });
  }

  /** Subscribe to PolicyChangeRecorded events. */
  onPolicyChangeRecorded(
    callback: (
      orgId: string,
      policyId: string,
      diffHash: string,
      author: string,
      event: ethers.EventLog,
    ) => void,
  ): () => void {
    return this.on('PolicyChangeRecorded', callback);
  }

  /** Subscribe to Paused / Unpaused events. */
  onPauseStateChanged(
    callback: (paused: boolean, account: string, event: ethers.EventLog) => void,
  ): () => void {
    const unsub1 = this.on('Paused', (account: string, event: ethers.EventLog) => {
      callback(true, account, event);
    });
    const unsub2 = this.on('Unpaused', (account: string, event: ethers.EventLog) => {
      callback(false, account, event);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }

  /** Subscribe to RoleGranted / RoleRevoked events. */
  onRoleChanged(
    callback: (
      role: string,
      account: string,
      sender: string,
      granted: boolean,
      event: ethers.EventLog,
    ) => void,
  ): () => void {
    const unsub1 = this.on('RoleGranted', (role: string, account: string, grantor: string, event: ethers.EventLog) => {
      callback(role, account, grantor, true, event);
    });
    const unsub2 = this.on('RoleRevoked', (role: string, account: string, revoker: string, event: ethers.EventLog) => {
      callback(role, account, revoker, false, event);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }

  // -----------------------------------------------------------------------
  // Historical Event Queries
  // -----------------------------------------------------------------------

  /**
   * Query past events by name within a block range.
   */
  async queryEvents(
    eventName: string,
    fromBlock: number | 'earliest' = 'earliest',
    toBlock: number | 'latest' = 'latest',
  ): Promise<ethers.EventLog[]> {
    const filter = this.contract.filters[eventName]?.();
    if (!filter) {
      throw new Error(`Unknown event: ${eventName}`);
    }
    const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
    return events.filter((e: any): e is ethers.EventLog => e instanceof ethers.EventLog);
  }

  /**
   * Query CertificateIssued events filtered by orgId.
   */
  async queryCertificateIssuedByOrg(
    orgId: string,
    fromBlock: number | 'earliest' = 'earliest',
    toBlock: number | 'latest' = 'latest',
  ): Promise<ethers.EventLog[]> {
    const filter = this.contract.filters.CertificateIssued(null, orgId);
    const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
    return events.filter((e: any): e is ethers.EventLog => e instanceof ethers.EventLog);
  }

  // -----------------------------------------------------------------------
  // Receipt Verification
  // -----------------------------------------------------------------------

  /**
   * Verify that a transaction was confirmed and successful.
   * Waits for the specified number of confirmations.
   */
  async verifyReceipt(
    txHash: string,
    requiredConfirmations?: number,
  ): Promise<{
    confirmed: boolean;
    blockNumber: number;
    confirmations: number;
    status: number;
    gasUsed: string;
  }> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { confirmed: false, blockNumber: 0, confirmations: 0, status: 0, gasUsed: '0' };
    }

    const currentBlock = await this.provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber + 1;
    const minConfirmations = requiredConfirmations ?? this.confirmations;
    const confirmed = confirmations >= minConfirmations && receipt.status === 1;

    return {
      confirmed,
      blockNumber: receipt.blockNumber,
      confirmations,
      status: receipt.status ?? 0,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Wait for a specific number of confirmations for an already-mined transaction.
   */
  async waitForConfirmations(txHash: string, requiredConfirmations: number): Promise<void> {
    while (true) {
      const result = await this.verifyReceipt(txHash, requiredConfirmations);
      if (result.confirmed) return;
      if (result.status === 0 && result.blockNumber > 0) {
        throw new Error(`Transaction ${txHash} was reverted`);
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  /**
   * Remove all active event listeners and clean up resources.
   */
  async removeAllListeners(): Promise<void> {
    for (const [eventName, callbacks] of this.activeListeners.entries()) {
      for (const cb of callbacks) {
        this.contract.off(eventName, cb);
      }
    }
    this.activeListeners.clear();
    await this.contract.removeAllListeners();
  }

  /**
   * Destroy the provider connection.
   */
  async disconnect(): Promise<void> {
    await this.removeAllListeners();
    this.provider.destroy();
  }
}

// ---------------------------------------------------------------------------
// Helper: Convert human-readable identifiers to bytes32
// ---------------------------------------------------------------------------

/** Hash a string identifier to bytes32 using keccak256. */
export function toBytes32(value: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(value));
}

/** Pad a hex string (with 0x prefix) to 32 bytes. */
export function padToBytes32(hexValue: string): string {
  return ethers.zeroPadValue(hexValue, 32);
}

/** Convert a Date or epoch-seconds to a uint64-compatible Solidity timestamp. */
export function toSolidityTimestamp(date: Date | number): number {
  if (date instanceof Date) {
    return Math.floor(date.getTime() / 1000);
  }
  return date;
}

/** Convert a basis-point score (0-10000) to a percentage string. */
export function scoreToPercent(bps: number): string {
  return (bps / 100).toFixed(2) + '%';
}

export default ContractInteraction;
