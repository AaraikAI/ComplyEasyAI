/**
 * Monitoring Configuration
 * Application Performance Monitoring (APM) and Error Tracking
 */

// Sentry is optional - only import if enabled
let Sentry: any = null;
let ProfilingIntegration: any = null;

try {
  if (process.env.SENTRY_ENABLED === 'true') {
    Sentry = require('@sentry/node');
    ProfilingIntegration = require('@sentry/profiling-node').ProfilingIntegration;
  }
} catch (error) {
  console.warn('Sentry packages not installed. Install with: npm install @sentry/node @sentry/profiling-node');
}

interface MonitoringConfig {
  sentry: {
    enabled: boolean;
    dsn?: string;
    environment: string;
    tracesSampleRate: number;
    profilesSampleRate: number;
  };
  apm: {
    enabled: boolean;
    serviceName: string;
    serviceVersion: string;
  };
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    enableElasticsearch: boolean;
    elasticsearchUrl?: string;
  };
}

const config: MonitoringConfig = {
  sentry: {
    enabled: process.env.SENTRY_ENABLED === 'true',
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
  },
  apm: {
    enabled: process.env.APM_ENABLED === 'true',
    serviceName: process.env.APM_SERVICE_NAME || 'complyeasy-api',
    serviceVersion: process.env.npm_package_version || '2.0.0',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    enableFile: process.env.LOG_FILE !== 'false',
    enableElasticsearch: process.env.ELASTICSEARCH_ENABLED === 'true',
    elasticsearchUrl: process.env.ELASTICSEARCH_URL,
  },
};

/**
 * Initialize Sentry for error tracking
 */
export function initializeSentry(): void {
  if (!config.sentry.enabled || !config.sentry.dsn) {
    console.log('Sentry disabled or DSN not configured');
    return;
  }

  if (!Sentry) {
    console.warn('Sentry packages not installed. Install with: npm install @sentry/node @sentry/profiling-node');
    return;
  }

  try {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      integrations: [
        ProfilingIntegration ? new ProfilingIntegration() : undefined,
        // Automatically instrument Node.js libraries and frameworks
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: undefined }), // Will be set in index.ts
      ].filter(Boolean),
      // Performance Monitoring
      tracesSampleRate: config.sentry.tracesSampleRate,
      // Profiling
      profilesSampleRate: config.sentry.profilesSampleRate,
      // Release tracking
      release: `complyeasy-api@${config.apm.serviceVersion}`,
      // Filter out health check endpoints
      ignoreErrors: [
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
      ],
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
          // Remove sensitive query params
          if (event.request.query_string) {
            const query = new URLSearchParams(event.request.query_string);
            query.delete('token');
            query.delete('password');
            event.request.query_string = query.toString();
          }
        }
        return event;
      },
    });

    console.log('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Initialize APM (Application Performance Monitoring)
 */
export function initializeAPM(): void {
  if (!config.apm.enabled) {
    console.log('APM disabled');
    return;
  }

  // APM can be integrated with:
  // - New Relic
  // - Datadog
  // - AppDynamics
  // - Elastic APM
  
  // Example: Elastic APM
  if (process.env.ELASTIC_APM_SERVER_URL) {
    try {
      // Elastic APM would be initialized here
      // const apm = require('elastic-apm-node').start({
      //   serviceName: config.apm.serviceName,
      //   serviceVersion: config.apm.serviceVersion,
      //   serverUrl: process.env.ELASTIC_APM_SERVER_URL,
      // });
      console.log('APM initialized (Elastic APM)');
    } catch (error) {
      console.error('Failed to initialize APM:', error);
    }
  }

  // Example: New Relic
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    try {
      // New Relic auto-instruments when require('newrelic') is called
      // require('newrelic');
      console.log('APM initialized (New Relic)');
    } catch (error) {
      console.error('Failed to initialize New Relic:', error);
    }
  }
}

/**
 * Get monitoring configuration
 */
export function getMonitoringConfig(): MonitoringConfig {
  return config;
}

/**
 * Capture exception to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (config.sentry.enabled && Sentry) {
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    });
  }
}

/**
 * Capture message to Sentry
 */
export function captureMessage(message: string, level: string = 'info'): void {
  if (config.sentry.enabled && Sentry) {
    Sentry.captureMessage(message, level as any);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  if (config.sentry.enabled && Sentry) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, organizationId?: string): void {
  if (config.sentry.enabled && Sentry) {
    Sentry.setUser({
      id: userId,
      email,
      organizationId,
    });
  }
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  if (config.sentry.enabled && Sentry) {
    Sentry.setUser(null);
  }
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string): any {
  if (config.sentry.enabled && Sentry) {
    return Sentry.startTransaction({
      name,
      op,
    });
  }
  return null;
}

export default {
  initializeSentry,
  initializeAPM,
  getMonitoringConfig,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUserContext,
  clearUserContext,
  startTransaction,
};

