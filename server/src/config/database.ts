import { PrismaClient } from '@prisma/client';
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
  return url.toString();
}

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
  datasources: {
    db: {
      url: buildDatabaseUrl(),
    },
  },
});

// Test connection on startup with retry logic
let connectionTested = false;
export async function testConnection(retries = 3, delay = 2000): Promise<boolean> {
  if (connectionTested) return true;
  
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
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

// ============================================================================
// CREDENTIAL ENCRYPTION MIDDLEWARE
// Transparently encrypts accessToken, refreshToken, and sensitive config
// fields on Integration writes, and decrypts on reads.
// ============================================================================

prisma.$use(async (params, next) => {
  // Only apply to Integration model
  if (params.model !== 'Integration') {
    return next(params);
  }

  // Encrypt on write operations
  if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
    const encryptData = (data: any) => {
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
    };

    if (params.args.data) {
      params.args.data = encryptData(params.args.data);
    }
    if (params.action === 'upsert') {
      if (params.args.create) params.args.create = encryptData(params.args.create);
      if (params.args.update) params.args.update = encryptData(params.args.update);
    }
  }

  const result = await next(params);

  // Decrypt on read operations
  if (result && (params.action === 'findUnique' || params.action === 'findFirst' ||
      params.action === 'findMany' || params.action === 'create' ||
      params.action === 'update' || params.action === 'upsert')) {
    const decryptRecord = (record: any) => {
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
    };

    if (Array.isArray(result)) {
      result.forEach(decryptRecord);
    } else {
      decryptRecord(result);
    }
  }

  return result;
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
});

export default prisma;
