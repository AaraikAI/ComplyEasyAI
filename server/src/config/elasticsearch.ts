/**
 * Elasticsearch Configuration and Winston Transport
 *
 * This module provides a production-ready Elasticsearch transport for Winston
 * using @elastic/elasticsearch and winston-elasticsearch. It is fully
 * controlled via environment variables and is designed to fail gracefully:
 * if configuration or dependencies are missing, logging continues via other
 * transports without crashing the application.
 *
 * Required runtime dependencies (in server/package.json):
 * - "@elastic/elasticsearch"
 * - "winston-elasticsearch"
 */

interface ElasticsearchConfig {
  enabled: boolean;
  node: string;
  username?: string;
  password?: string;
  indexPrefix: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
  level: string;
}

const config: ElasticsearchConfig = {
  enabled: process.env.ELASTICSEARCH_ENABLED === 'true',
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  username: process.env.ELASTICSEARCH_USERNAME,
  password: process.env.ELASTICSEARCH_PASSWORD,
  indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'complyeasy',
  ssl: {
    // In production you typically want this true; allow overriding for self‑signed
    rejectUnauthorized: process.env.ELASTICSEARCH_SSL_REJECT_UNAUTHORIZED !== 'false',
  },
  level: process.env.ELASTICSEARCH_LOG_LEVEL || 'info',
};

/**
 * Create Elasticsearch transport for Winston.
 *
 * - Returns a winston-elasticsearch transport when enabled and properly
 *   configured.
 * - Returns null when disabled or when dependencies/config are missing.
 * - Never throws: all errors are caught and logged to console to avoid
 *   breaking application startup.
 */
export function createElasticsearchTransport(): any {
  if (!config.enabled) {
    return null;
  }

  try {
    // Use require to avoid hard TypeScript dependency on these packages
    // if they have not been installed yet.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Client } = require('@elastic/elasticsearch');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ElasticsearchTransport } = require('winston-elasticsearch');

    const clientOptions: any = {
      node: config.node,
      ssl: config.ssl,
    };

    if (config.username && config.password) {
      clientOptions.auth = {
        username: config.username,
        password: config.password,
      };
    }

    const client = new Client(clientOptions);

    const indexPrefix = config.indexPrefix.replace(/-+$/, '');

    const esTransportOptions: any = {
      level: config.level,
      client,
      indexPrefix,
      // Ensure index template exists; winston-elasticsearch will manage this
      ensureIndexTemplate: true,
      // Buffer logs in memory when ES is temporarily unavailable
      buffering: true,
      bufferLimit: 1000,
      // Add basic meta for easier querying
      transformer: (logData: any) => {
        const { message, level, timestamp, ...meta } = logData;
        return {
          '@timestamp': timestamp || new Date().toISOString(),
          message,
          level,
          meta,
        };
      },
    };

    const transport = new ElasticsearchTransport(esTransportOptions);

    // Lightweight health check; do not block startup if it fails
    client
      .ping()
      .then(() => {
        // eslint-disable-next-line no-console
        console.log(
          `Elasticsearch transport configured: ${config.node} (indexPrefix=${indexPrefix})`,
        );
      })
      .catch((err: any) => {
        // eslint-disable-next-line no-console
        console.error(
          'Elasticsearch ping failed; logs will still be buffered and retried:',
          err?.message || err,
        );
      });

    return transport;
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error(
      'Failed to create Elasticsearch transport. Ensure @elastic/elasticsearch and winston-elasticsearch are installed:',
      error?.message || error,
    );
    return null;
  }
}

/**
 * Get Elasticsearch configuration
 */
export function getElasticsearchConfig(): ElasticsearchConfig {
  return config;
}

export default {
  createElasticsearchTransport,
  getElasticsearchConfig,
};

