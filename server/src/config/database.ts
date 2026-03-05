import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import logger from './logger';
import {
  encryptField,
  decryptField,
  encryptConfigFields,
  decryptConfigFields,
} from '../utils/credentialEncryption';

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
// ============================================================================

const adapter = new PrismaPg({ connectionString: buildDatabaseUrl() });

const basePrisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
  adapter,
});

const prisma = basePrisma.$extends({
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
