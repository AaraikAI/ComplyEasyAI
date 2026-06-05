import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import logger from './logger';
import {
  encryptField,
  decryptField,
  encryptConfigFields,
  decryptConfigFields,
} from '../utils/credentialEncryption';
import { getCurrentOrg } from './orgContext';

// Append connection pool parameters to DATABASE_URL if not already present.
// Prisma uses these URL params to configure the internal connection pool.
function buildDatabaseUrl(): string {
  const base = process.env.DATABASE_URL || '';
  if (!base) return base;
  const url = new URL(base);
  // Default pool size: 10 connections (overridable via DB_POOL_SIZE env var)
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', process.env.DB_POOL_SIZE || '10');
  }
  // Default pool timeout: 20 seconds
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', process.env.DB_POOL_TIMEOUT || '20');
  }
  // Enforce SSL in production unless explicitly disabled
  if (process.env.NODE_ENV === 'production' && !url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require');
  }
  return url.toString();
}

// ============================================================================
// CREDENTIAL ENCRYPTION HELPERS
// ============================================================================

function encryptData(data: any): any {
  if (!data) return data;
  if (data.accessToken && typeof data.accessToken === 'string') {
    data.accessToken = encryptField(data.accessToken);
  }
  if (data.refreshToken && typeof data.refreshToken === 'string') {
    data.refreshToken = encryptField(data.refreshToken);
  }
  if (data.config && typeof data.config === 'object') {
    data.config = encryptConfigFields(data.config);
  }
  return data;
}

function decryptRecord(record: any): any {
  if (!record) return record;
  if (record.accessToken && typeof record.accessToken === 'string') {
    record.accessToken = decryptField(record.accessToken);
  }
  if (record.refreshToken && typeof record.refreshToken === 'string') {
    record.refreshToken = decryptField(record.refreshToken);
  }
  if (record.config && typeof record.config === 'object') {
    record.config = decryptConfigFields(record.config);
  }
  return record;
}

// ============================================================================
// PRISMA CLIENT WITH ENCRYPTION EXTENSION
// Uses $extends (replacing deprecated $use middleware) for transparent
// encryption/decryption of Integration credential fields.
//
// This extension is a convenience for the high-traffic Integration model only.
// It is NOT the sole protection: every other credential-bearing model encrypts
// (or one-way hashes) at its own write site — SSO SAML certs and OAuth
// access/refresh tokens and client secrets via encryptField (routes/sso.ts,
// services/integrations/*), webhook signing secrets via encryptField
// (services/webhookService.ts), and SCIM bearer tokens via SHA-256
// (routes/scim.ts). No credential-bearing model relies on this extension to
// avoid plaintext-at-rest.
// ============================================================================

// Set DATABASE_URL with pool params for Prisma v5
const databaseUrl = buildDatabaseUrl();
if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

// pg v8.20+ parses sslmode from the URL and treats 'require' as 'verify-full',
// which fails with Supabase's self-signed certs. Also, pg doesn't understand
// Prisma-specific params (connection_limit, pool_timeout) — they get misinterpreted
// as part of the database name. Use proper URL parsing to strip both.
function buildPoolUrl(url: string): { connectionString: string; ssl: pg.PoolConfig['ssl'] } {
  const parsed = new URL(url);
  const needsSsl = parsed.searchParams.get('sslmode') === 'require'
    || parsed.searchParams.get('sslmode') === 'prefer';
  // Remove params that pg doesn't understand
  const prismaOnlyParams = ['sslmode', 'connection_limit', 'pool_timeout', 'pgbouncer', 'statement_cache_size'];
  for (const param of prismaOnlyParams) {
    parsed.searchParams.delete(param);
  }
  const isProduction = process.env.NODE_ENV === 'production';
  const caCert = process.env.DB_CA_CERT
    ? Buffer.from(process.env.DB_CA_CERT, 'base64').toString()
    : undefined;

  // In production with TLS required, certificate verification (rejectUnauthorized)
  // is enabled. Managed providers that present a self-signed/private-CA
  // certificate (e.g. Supabase) require their CA bundle to be supplied via
  // DB_CA_CERT (base64-encoded PEM) — otherwise the TLS handshake fails with
  // a self-signed-certificate error. Surface this clearly at startup so the
  // misconfiguration is obvious instead of presenting as an opaque connect failure.
  if (isProduction && needsSsl && !caCert) {
    logger.warn(
      '[Database] Production TLS is enabled (rejectUnauthorized=true) but DB_CA_CERT is not set. ' +
        'If your database presents a self-signed or private-CA certificate (e.g. Supabase), ' +
        'set DB_CA_CERT to the base64-encoded CA bundle or the connection will fail verification.',
    );
  }

  return {
    connectionString: parsed.toString(),
    ssl: needsSsl ? {
      rejectUnauthorized: isProduction,
      ca: caCert,
    } : undefined,
  };
}

const { connectionString: poolUrl, ssl: poolSsl } = buildPoolUrl(databaseUrl);
const pool = new pg.Pool({
  connectionString: poolUrl,
  ssl: poolSsl,
});
const adapter = new PrismaPg(pool as any);

const basePrisma = new PrismaClient({
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// ============================================================================
// ORG-CONTEXT (ROW-LEVEL SECURITY) EXTENSION
// Binds the per-request organization (carried in AsyncLocalStorage by the auth
// middleware via config/orgContext.ts) to the PostgreSQL session so RLS
// policies can scope every query to the caller's org.
//
// Mechanism: when an org id is present in the async context, the operation is
// wrapped in an interactive transaction. The transaction first issues
// `SELECT set_config('app.current_org', $org, true)` — the `true` makes the
// setting transaction-local, so it cannot leak across pooled connections — and
// then runs the actual query inside that same transaction. PostgreSQL's
// org_isolation policies read the GUC via public.get_current_organization_id().
//
// When no org is bound (background jobs, startup, public/unauthenticated
// routes), the operation runs as before with no GUC set; under FORCE RLS such
// connections simply match no tenant rows, which is the safe default.
//
// This extension is applied to the base client BEFORE the encryption
// extension so that the integration model's encrypt/decrypt query handlers run
// inside the org-scoped transaction as well.
// ============================================================================
const orgScopedPrisma = basePrisma.$extends({
  query: {
    async $allOperations({ operation, model, args, query }: {
      operation: string;
      model?: string;
      args: any;
      query: (args: any) => Promise<any>;
    }) {
      const org = getCurrentOrg();

      // No org context, or the operation is itself a transaction/raw control
      // call (which must not be re-wrapped): run unchanged.
      if (
        !org ||
        operation === '$transaction' ||
        operation === '$executeRaw' ||
        operation === '$executeRawUnsafe' ||
        operation === '$queryRaw' ||
        operation === '$queryRawUnsafe'
      ) {
        return query(args);
      }

      // Wrap the single operation in an interactive transaction that first
      // binds the org GUC (transaction-local), then executes the query on the
      // transactional connection so the policy sees the correct org.
      // Note: this adds a BEGIN + set_config round-trip per op and pins a pooled
      // connection for the query's duration; size connection_limit accordingly
      // under load. The GUC name 'app.current_org' is the contract read by
      // public.get_current_organization_id() in the RLS policy SQL — keep them in
      // sync. App-layer organizationId filters remain the primary tenant boundary.
      return basePrisma.$transaction(async (tx: any) => {
        await tx.$executeRaw`SELECT set_config('app.current_org', ${org}, true)`;
        const delegate = model ? (tx as any)[lowerFirst(model)] : tx;
        return delegate[operation](args);
      });
    },
  },
});

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

const prisma = orgScopedPrisma.$extends({
  query: {
    integration: {
      async create({ args, query }: { args: any; query: any }) {
        if (args.data) args.data = encryptData(args.data);
        const result = await query(args);
        return decryptRecord(result);
      },
      async update({ args, query }: { args: any; query: any }) {
        if (args.data) args.data = encryptData(args.data);
        const result = await query(args);
        return decryptRecord(result);
      },
      async upsert({ args, query }: { args: any; query: any }) {
        if (args.create) args.create = encryptData(args.create);
        if (args.update) args.update = encryptData(args.update);
        const result = await query(args);
        return decryptRecord(result);
      },
      async findUnique({ args, query }: { args: any; query: any }) {
        const result = await query(args);
        return decryptRecord(result);
      },
      async findFirst({ args, query }: { args: any; query: any }) {
        const result = await query(args);
        return decryptRecord(result);
      },
      async findMany({ args, query }: { args: any; query: any }) {
        const result = await query(args);
        if (Array.isArray(result)) {
          result.forEach(decryptRecord);
        }
        return result;
      },
    },
  },
}) as unknown as PrismaClient;

// Test connection on startup with retry logic
let connectionTested = false;
export async function testConnection(retries = 3, delay = 2000): Promise<boolean> {
  if (connectionTested) return true;

  for (let i = 0; i < retries; i++) {
    try {
      await basePrisma.$queryRaw`SELECT 1`;
      connectionTested = true;
      logger.info('✅ Database connection established');
      return true;
    } catch (error: any) {
      if (i < retries - 1) {
        logger.warn(`Database connection attempt ${i + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('❌ Database connection failed after retries:', error.message);
        return false;
      }
    }
  }
  return false;
}

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  basePrisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await basePrisma.$disconnect();
  logger.info('Database connection closed');
});

export default prisma;
