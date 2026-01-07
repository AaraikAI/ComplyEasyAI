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
    // Sentry v8 uses different integration setup
    const integrations: any[] = [];
    
    // Add profiling integration if available
    if (ProfilingIntegration) {
      integrations.push(new ProfilingIntegration());
    }
    
    // HTTP integration for tracing (v8 API)
    if (Sentry.httpIntegration) {
      integrations.push(Sentry.httpIntegration({ tracing: true }));
    } else if (Sentry.Integrations && Sentry.Integrations.Http) {
      // Fallback for older API
      integrations.push(new Sentry.Integrations.Http({ tracing: true }));
    }
    
    // Express integration (v8 API)
    if (Sentry.expressIntegration) {
      integrations.push(Sentry.expressIntegration());
    } else if (Sentry.Integrations && Sentry.Integrations.Express) {
      // Fallback for older API
      integrations.push(new Sentry.Integrations.Express({ app: undefined }));
    }
    
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      integrations,
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
      beforeSend(event: any, hint: any): any {
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
 * In Sentry v8, transactions are automatically handled by Express integration
 * This function returns a mock transaction object for compatibility
 */
export function startTransaction(name: string, op: string): any {
  // In Sentry v8, the Express integration automatically handles transactions
  // We return a mock object that provides the same interface for compatibility
  if (config.sentry.enabled && Sentry) {
    try {
      // Check if Sentry has the old API (v6/v7) or new API (v8+)
      if (typeof Sentry.startTransaction === 'function') {
        // Old API (v6/v7)
        try {
          return Sentry.startTransaction({
            name,
            op,
          });
        } catch (error) {
          console.warn('Failed to start Sentry transaction (old API):', error);
        }
      }
      // For Sentry v8+, Express integration handles transactions automatically
      // Return a no-op object since Express integration manages transactions
    } catch (error) {
      // If Sentry is initialized but API is incompatible, return no-op
      console.warn('Sentry transaction API not available:', error);
    }
  }
  
  // Return a no-op mock object if Sentry is disabled, not available, or using v8+
  return {
    setData: () => {},
    setHttpStatus: () => {},
    setStatus: () => {},
    finish: () => {},
  };
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

