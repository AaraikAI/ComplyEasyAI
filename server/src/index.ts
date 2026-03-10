import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import crypto from 'crypto';
import config, { validateConfig } from './config';
import logger from './config/logger';
import prisma, { testConnection } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { authenticate } from './middleware/auth';
import websocketService from './services/websocketService';
import swaggerSpec from './config/swagger';
import monitoring, { initializeSentry, initializeAPM } from './config/monitoring';
import { monitoringMiddleware, errorTrackingMiddleware } from './middleware/monitoring';

// Routes
import authRoutes from './routes/auth';
import twoFactorRoutes from './routes/twoFactor';
import risksRoutes from './routes/risks';
import frameworksRoutes from './routes/frameworks';
import aiRoutes from './routes/ai';
import billingRoutes from './routes/billing';
import integrationsRoutes from './routes/integrations';
import teamRoutes from './routes/team';
import auditRoutes from './routes/audit';
import organizationRoutes from './routes/organization';

// Enterprise Module Routes
import personnelRoutes from './routes/personnel';
import vendorRoutes from './routes/vendors';
import enterpriseRoutes from './routes/enterprise';

// aCOS Routes
import acosRoutes from './routes/acos';

// Security Routes
import securityRoutes from './routes/security';

// Webhook Routes
import webhooksRoutes from './routes/webhooks';

// Demo Routes
import demoRoutes from './routes/demo';

// Control Mappings & Evidence Versioning Routes
import controlMappingsRoutes from './routes/controlMappings';
import evidenceVersionsRoutes from './routes/evidenceVersions';

// NIST AI RMF Routes
import aiRmfRoutes from './routes/aiRmf';

// Onboarding Routes
import onboardingRoutes from './routes/onboarding';

// EU Regulations Routes
import euRegulationsRoutes from './routes/euRegulations';

// Export Routes
import exportRoutes from './routes/export';

// Feature Modules Routes
import featureModulesRoutes from './routes/featureModules';

// DORA Routes
import doraRoutes from './routes/dora';

// Auditor Hub Routes
import auditorRoutes from './routes/auditor';

// SOX Compliance Routes
import soxRoutes from './routes/sox';

// SoD Analysis Routes
import sodRoutes from './routes/sod';

// MDM Routes
import mdmRoutes from './routes/mdm';

// Workflow Builder Routes
import workflowRoutes from './routes/workflow';

// Privacy Management Routes
import privacyRoutes from './routes/privacy';

// DPIA Routes (GDPR Art. 35)
import dpiaRoutes from './routes/dpia';

// RoPA Routes (GDPR Art. 30)
import ropaRoutes from './routes/ropa';

// Cookie Consent Routes (ePrivacy Directive)
import cookieConsentRoutes from './routes/cookieConsent';

// DPO Designation Routes (GDPR Art. 37-39)
import dpoRoutes from './routes/dpo';

// Security Training Routes (SOC 2 CC1.4)
import securityTrainingRoutes from './routes/securityTraining';

// Data Anonymization Routes (GDPR Recital 26)
import anonymizationRoutes from './routes/anonymization';

// Enhancement Module Routes
import incidentRoutes from './routes/incidents';
import assetRoutes from './routes/assets';
import calendarRoutes from './routes/calendar';
import maturityRoutes from './routes/maturity';
import biaRoutes from './routes/bia';
import exceptionRoutes from './routes/exceptions';
import certificationRoutes from './routes/certifications';
import costRoutes from './routes/costs';
import executiveRoutes from './routes/executive';
import controlEffectivenessRoutes from './routes/controlEffectiveness';
import regulatoryChangeRoutes from './routes/regulatoryChanges';
import evidenceCollectionRoutes from './routes/evidenceCollection';
import auditPrepRoutes from './routes/auditPrep';
import controlTestingRoutes from './routes/controlTesting';
import vendorMonitoringRoutes from './routes/vendorMonitoring';
import cicdGateRoutes from './routes/cicdGates';
import ssoRoutes from './routes/sso';
import scimRoutes from './routes/scim';
import roleRoutes from './routes/roles';
import brandingRoutes from './routes/branding';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboards';
import reportRoutes from './routes/reports';
import bulkRoutes from './routes/bulk';
import ticketingRoutes from './routes/ticketing';

// API Versioning
import v1Router from './routes/v1';
import v2Router from './routes/v2';
import { apiVersioningMiddleware } from './middleware/apiVersioning';

// GraphQL
import { graphqlMiddleware, graphqlPlayground } from './graphql';

// Marketplace
import marketplaceRoutes from './routes/marketplace/marketplaceRoutes';

// CSRF protection for state-changing API routes (session/cookie-based)
import { csrfProtection, generateCsrfToken } from './middleware/csrf';

// FIPS 140-3 (ISO 19790) Cryptographic Module Self-Tests
import { runPreOperationalSelfTests } from './utils/fipsSelfTests';
import { verifyModuleIntegrity } from './utils/fipsIntegrityCheck';
import { startPeriodicHealthMonitoring } from './utils/fipsEntropyHealthTest';
import { destroyKey } from './utils/credentialEncryption';

// Background Job Queue
import jobQueueService from './services/queue/jobQueue';

// Redis Cache
import cacheService from './services/cache/redisCacheService';

// Multi-Region
import multiRegionService from './config/regions/multiRegionConfig';

// aCOS Services
import mqttService from './services/advanced/mqttService';

const app = express();

// Trust first proxy (required for correct client IP in rate limiting and audit logs)
app.set('trust proxy', 1);

// Initialize monitoring (Sentry, APM)
try {
  initializeSentry();
  initializeAPM();
  logger.info('Monitoring initialized');
} catch (error) {
  logger.warn('Monitoring initialization failed:', error);
}

// Validate configuration on startup
try {
  logger.info('Validating environment configuration...');
  validateConfig();
  logger.info('✓ Environment configuration validated successfully');
} catch (error) {
  logger.error('❌ Configuration validation failed:', error);
  logger.error('\nPlease run "npm run validate:env" for detailed validation.');
  logger.error('See ENVIRONMENT_VARIABLES.md for setup instructions.\n');
  process.exit(1);
}

// FIPS 140-3 pre-operational self-tests (must pass before any cryptographic operations)
try {
  logger.info('Running FIPS 140-3 software integrity verification...');
  verifyModuleIntegrity();
  logger.info('Running FIPS 140-3 pre-operational self-tests (KATs)...');
  runPreOperationalSelfTests();
  logger.info('✓ FIPS 140-3 cryptographic module self-tests PASSED');
} catch (error) {
  logger.error('❌ FIPS 140-3 self-tests FAILED — cryptographic module entering error state:', error);
  process.exit(1);
}

// Start periodic entropy health monitoring (SP 800-90B)
let entropyMonitorInterval: ReturnType<typeof setInterval> | null = null;
if (config.server.env === 'production') {
  entropyMonitorInterval = startPeriodicHealthMonitoring(3600000); // 1 hour
  logger.info('✓ FIPS 140-3 entropy health monitoring started (hourly)');
}

// Production deployment guard — prevent NODE_ENV=development from running in cloud environments
if (config.server.env === 'development') {
  const deploymentEnv = process.env.DEPLOYMENT_ENV
    || process.env.RAILWAY_ENVIRONMENT
    || process.env.FLY_APP_NAME
    || process.env.ECS_CONTAINER_METADATA_URI
    || process.env.AWS_EXECUTION_ENV
    || process.env.RENDER_SERVICE_ID
    || process.env.HEROKU_APP_NAME
    || process.env.VERCEL_ENV;
  if (deploymentEnv) {
    logger.error(
      'FATAL: NODE_ENV=development detected in a cloud/production deployment environment. ' +
      `Detected deployment indicator: ${deploymentEnv}. ` +
      'Set NODE_ENV=production in your deployment configuration. Exiting to prevent insecure operation.'
    );
    process.exit(1);
  }
}

// Security middleware with enhanced headers and CSP nonces
// Generate nonce per request for stricter CSP (replaces 'unsafe-inline')
app.use((req: Request, res: Response, next: NextFunction) => {
  // Generate cryptographically secure nonce for this request
  const nonce = crypto.randomBytes(16).toString('base64');
  (req as any).nonce = nonce;
  res.locals.nonce = nonce;
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      // Use nonces for inline styles (stricter than 'unsafe-inline')
      styleSrc: [
        "'self'",
        (req: any) => `'nonce-${req.nonce}'`,
        // Allow Tailwind CDN in development (consider self-hosting in production)
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-inline'", "https://cdn.tailwindcss.com"] : []),
      ],
      // Use nonces for inline scripts (stricter than 'unsafe-inline')
      scriptSrc: [
        "'self'",
        (req: any) => `'nonce-${req.nonce}'`,
        // Allow Vite HMR and Tailwind CDN in development
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'", "https://cdn.tailwindcss.com"] : []),
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        config.server.apiUrl,
        // Allow Vite HMR in development
        ...(process.env.NODE_ENV === 'development' ? ["ws://localhost:*", "http://localhost:*"] : []),
      ],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));

app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-API-Version', 'X-CSRF-Token', 'X-Webhook-Signature', 'X-Webhook-Timestamp', 'X-Webhook-Event'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Page', 'X-Page-Size', 'X-Total-Pages', 'X-Has-Next-Page', 'X-Has-Previous-Page', 'X-API-Version', 'Deprecation', 'Sunset'],
  maxAge: 86400, // 24 hours
}));

// Body parsing middleware
// Special handling for Stripe webhooks (requires raw body)
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CSRF protection for state-changing API routes (POST, PUT, PATCH, DELETE)
// Skips GET/HEAD/OPTIONS and webhook paths; requires x-csrf-token header + cookie for mutating requests
app.use('/api', csrfProtection);

// Monitoring middleware (must be early in the stack)
app.use(monitoringMiddleware);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API Documentation (Swagger UI)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ComplyEasy AI API Docs',
}));

// CSRF token endpoint (must be before other /api routes; GET is skipped by csrfProtection)
app.get('/api/csrf-token', (req: Request, res: Response) => {
  generateCsrfToken(req, res);
});

// OpenAPI spec endpoint
app.get('/api/docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root endpoint - provide API information
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'ComplyEasy AI Backend API',
    version: '2.0.0',
    status: 'running',
    environment: config.server.env,
    endpoints: {
      health: '/health',
      apiDocs: '/api/docs',
      apiSpec: '/api/docs.json',
    },
    message: 'ComplyEasy AI Enterprise Backend Server is running. Visit /api/docs for API documentation.',
  });
});

// Health check endpoint - comprehensive system status
app.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const healthStatus: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.server.env,
    version: '2.0.0',
    checks: {},
  };

  try {
    // 1. Database connectivity check with timeout
    const dbCheck = Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);

    await dbCheck;
    healthStatus.checks.database = { status: 'connected', responseTime: Date.now() - startTime };
  } catch (error: any) {
    healthStatus.checks.database = { status: 'disconnected', error: error.message };
    healthStatus.status = 'unhealthy';
  }

  // 2. WebSocket service check
  try {
    const wsConnected = websocketService.getIO() !== null;
    healthStatus.checks.websocket = { status: wsConnected ? 'connected' : 'disconnected' };
    if (!wsConnected) {
      healthStatus.status = 'degraded';
    }
  } catch (error: any) {
    healthStatus.checks.websocket = { status: 'error', error: error.message };
    healthStatus.status = 'degraded';
  }

  // 3. Memory usage check
  const memUsage = process.memoryUsage();
  const memoryMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
  };
  healthStatus.checks.memory = {
    status: memoryMB.heapUsed < 512 ? 'ok' : 'warning',
    usage: memoryMB,
    unit: 'MB'
  };

  // 4. Job Queue check
  try {
    const queueStats = jobQueueService.getQueueStats();
    healthStatus.checks.jobQueue = { status: 'ok', mode: queueStats.mode, stats: queueStats.global };
  } catch (error: any) {
    healthStatus.checks.jobQueue = { status: 'unavailable', error: error.message };
  }

  // 5. Cache check
  try {
    const cacheStats = cacheService.getStats();
    healthStatus.checks.cache = { status: 'ok', mode: cacheStats.mode, hitRate: cacheStats.hitRate, size: cacheStats.size };
  } catch (error: any) {
    healthStatus.checks.cache = { status: 'unavailable', error: error.message };
  }

  // 6. Multi-Region check
  try {
    const currentRegion = multiRegionService.getCurrentRegion();
    healthStatus.checks.region = { status: 'ok', current: currentRegion.code, name: currentRegion.name };
  } catch (error: any) {
    healthStatus.checks.region = { status: 'unavailable', error: error.message };
  }

  // 7. Response time check
  healthStatus.responseTime = Date.now() - startTime;

  // Determine final status code
  const statusCode = healthStatus.status === 'unhealthy' ? 503 : 200;

  if (healthStatus.status !== 'healthy') {
    logger.warn('Health check: System is not fully healthy:', healthStatus);
  }

  res.status(statusCode).json(healthStatus);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/risks', apiLimiter, risksRoutes);
app.use('/api/frameworks', apiLimiter, frameworksRoutes);
app.use('/api/ai', aiRoutes); // Has its own rate limiter
app.use('/api/billing', billingRoutes);
app.use('/api/integrations', apiLimiter, integrationsRoutes);
app.use('/api/eu-regulations', apiLimiter, euRegulationsRoutes);
app.use('/api/team', apiLimiter, teamRoutes);
app.use('/api/audit', apiLimiter, auditRoutes);
app.use('/api/organization', apiLimiter, organizationRoutes);
app.use('/api/control-mappings', apiLimiter, controlMappingsRoutes);
app.use('/api/evidence-versions', apiLimiter, evidenceVersionsRoutes);

// Enterprise Module routes
app.use('/api/personnel', apiLimiter, personnelRoutes);
app.use('/api/vendors', apiLimiter, vendorRoutes);
app.use('/api/enterprise', apiLimiter, enterpriseRoutes);

// aCOS routes
app.use('/api/acos', apiLimiter, acosRoutes);

// NIST AI RMF routes
app.use('/api/ai-rmf', apiLimiter, aiRmfRoutes);

// Security routes (Zero Trust, ZKP, BYOK, Compliance-as-Code)
app.use('/api/security', apiLimiter, securityRoutes);

// Webhook routes (Zapier, automation)
app.use('/api/webhooks', apiLimiter, webhooksRoutes);
app.use('/api/demo', apiLimiter, demoRoutes);

// Onboarding routes
app.use('/api/onboarding', apiLimiter, onboardingRoutes);

// Export routes (CSV exports for all entities)
app.use('/api/export', apiLimiter, exportRoutes);

// Marketplace routes (third-party integrations)
app.use('/api/marketplace', apiLimiter, marketplaceRoutes);

// Feature modules routes (governance, breach, CE marking, DPP, ESG, SBOM, surveillance, decommission, lifecycle, process maps)
app.use('/api/modules', apiLimiter, featureModulesRoutes);

// DORA (Digital Operational Resilience Act) routes
app.use('/api/dora', apiLimiter, doraRoutes);

// Auditor Collaboration Hub routes
app.use('/api/auditor', apiLimiter, auditorRoutes);

// SOX Compliance routes
app.use('/api/sox', apiLimiter, soxRoutes);

// Separation of Duties routes
app.use('/api/sod', apiLimiter, sodRoutes);

// Mobile Device Management routes
app.use('/api/mdm', apiLimiter, mdmRoutes);

// Workflow Builder routes
app.use('/api/workflows', apiLimiter, workflowRoutes);

// Privacy Management routes
app.use('/api/privacy', apiLimiter, privacyRoutes);

// DPIA routes (GDPR Art. 35 — Data Protection Impact Assessment)
app.use('/api/dpia', apiLimiter, dpiaRoutes);

// RoPA routes (GDPR Art. 30 — Records of Processing Activities)
app.use('/api/ropa', apiLimiter, ropaRoutes);

// Cookie Consent routes (ePrivacy Directive)
app.use('/api/cookie-consent', apiLimiter, cookieConsentRoutes);

// DPO Designation routes (GDPR Art. 37-39)
app.use('/api/dpo', apiLimiter, dpoRoutes);

// Security Training routes (SOC 2 CC1.4)
app.use('/api/security-training', apiLimiter, securityTrainingRoutes);

// Data Anonymization routes (GDPR Recital 26)
app.use('/api/anonymization', apiLimiter, anonymizationRoutes);

// Enhancement Module routes
app.use('/api/incidents', apiLimiter, incidentRoutes);
app.use('/api/assets', apiLimiter, assetRoutes);
app.use('/api/calendar', apiLimiter, calendarRoutes);
app.use('/api/maturity', apiLimiter, maturityRoutes);
app.use('/api/bia', apiLimiter, biaRoutes);
app.use('/api/exceptions', apiLimiter, exceptionRoutes);
app.use('/api/certifications', apiLimiter, certificationRoutes);
app.use('/api/costs', apiLimiter, costRoutes);
app.use('/api/executive', apiLimiter, executiveRoutes);
app.use('/api/control-effectiveness', apiLimiter, controlEffectivenessRoutes);
app.use('/api/regulatory-changes', apiLimiter, regulatoryChangeRoutes);
app.use('/api/evidence-collection', apiLimiter, evidenceCollectionRoutes);
app.use('/api/audit-prep', apiLimiter, auditPrepRoutes);
app.use('/api/control-testing', apiLimiter, controlTestingRoutes);
app.use('/api/vendor-monitoring', apiLimiter, vendorMonitoringRoutes);
app.use('/api/cicd-gates', apiLimiter, cicdGateRoutes);
app.use('/api/sso', ssoRoutes); // No rate limiter - SSO callbacks need to work
app.use('/api/scim', scimRoutes); // SCIM has its own auth
app.use('/api/roles', apiLimiter, roleRoutes);
app.use('/api/branding', apiLimiter, brandingRoutes);
app.use('/api/search', apiLimiter, searchRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/dashboards', apiLimiter, dashboardRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);
app.use('/api/bulk', apiLimiter, bulkRoutes);
app.use('/api/ticketing', apiLimiter, ticketingRoutes);

// GraphQL endpoint (authenticated + rate limited)
app.post('/api/graphql', authenticate, apiLimiter, graphqlMiddleware());
app.get('/api/graphql', authenticate, apiLimiter, graphqlMiddleware());
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/graphql/playground', graphqlPlayground());
}

// API Versioned routes (v1, v2)
app.use('/api/v1', apiVersioningMiddleware(), v1Router);
app.use('/api/v2', apiVersioningMiddleware(), v2Router);

// 404 handler
app.use(notFound);

// Error tracking middleware (captures errors to Sentry before errorHandler)
app.use(errorTrackingMiddleware);

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
websocketService.initialize(httpServer);

// Initialize Job Queue
(async () => {
  try {
    await jobQueueService.initialize();
    logger.info('✓ Job queue service initialized');
  } catch (error) {
    logger.warn('⚠️  Job queue initialization failed (optional):', error);
  }
})();

// Initialize Cache Service
(async () => {
  try {
    await cacheService.initialize();
    logger.info('✓ Cache service initialized');
  } catch (error) {
    logger.warn('⚠️  Cache service initialization failed (optional):', error);
  }
})();

// Initialize Multi-Region Service
(async () => {
  try {
    await multiRegionService.initialize();
    logger.info('✓ Multi-region service initialized');
  } catch (error) {
    logger.warn('⚠️  Multi-region initialization failed (optional):', error);
  }
})();

// Initialize Session Management (async initialization)
(async () => {
  try {
    const sessionManagement = await import('./services/sessionManagementService');
    if (sessionManagement.default) {
      await sessionManagement.default.initialize();
      logger.info('✓ Session management initialized');
    }
  } catch (error) {
    logger.warn('⚠️  Session management initialization failed (optional):', error);
  }
})();

// Initialize VR Collaborative Review Service (async initialization)
(async () => {
  try {
    const vrService = await import('./services/advanced/vrCollaborativeReviewService');
    if (vrService.default) {
      await vrService.default.initialize();
      logger.info('✓ VR Collaborative Review Service initialized');
    }
  } catch (error) {
    logger.warn('⚠️  VR Collaborative Review Service initialization failed (optional):', error);
  }
})();

// Test database connection before starting server (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  testConnection().then((connected) => {
    if (!connected) {
      logger.warn('⚠️  Starting server without database connection - some features may not work');
    }
  }).catch((error) => {
    logger.warn('⚠️  Database connection test failed:', error.message);
  });
}

// Initialize MQTT connection (optional)
if (config.mqtt.brokerUrl && config.mqtt.brokerUrl !== 'mqtt://localhost:1883') {
  mqttService.connect({
    brokerUrl: config.mqtt.brokerUrl,
    username: config.mqtt.username,
    password: config.mqtt.password,
    clientId: config.mqtt.clientId,
  }).then(() => {
    logger.info('✓ MQTT broker connected');
  }).catch((error) => {
    logger.warn('⚠️  MQTT connection failed (optional):', error.message);
  });
} else {
  logger.info('ℹ️  MQTT not configured (set MQTT_BROKER_URL to enable)');
}

// Set HTTP server timeouts for production hardening
httpServer.keepAliveTimeout = 65 * 1000; // 65s (> typical ALB 60s idle timeout)
httpServer.headersTimeout = 66 * 1000; // slightly above keepAliveTimeout
httpServer.requestTimeout = 30 * 1000; // 30s max for receiving the full request
httpServer.timeout = 120 * 1000; // 120s overall socket timeout

// Start server - bind to all interfaces (IPv4 and IPv6)
httpServer.listen(config.server.port, '0.0.0.0', () => {
  logger.info(`
    ╔════════════════════════════════════════╗
    ║   ComplyEasy AI Backend Server         ║
    ║   Version: 2.0.0 - ENTERPRISE          ║
    ║   Environment: ${config.server.env.padEnd(27)} ║
    ║   Port: ${String(config.server.port).padEnd(31)} ║
    ║   Database: Connected                  ║
    ║   WebSocket: Enabled (/ws)             ║
    ║                                        ║
    ║   Enterprise Features:                 ║
    ║   ✓ Personnel & Access Management      ║
    ║   ✓ Vendor Risk Management             ║
    ║   ✓ Full Risk Management               ║
    ║   ✓ Questionnaire Automation           ║
    ║   ✓ Policy Library                     ║
    ║   ✓ Trust Center                       ║
    ║   ✓ Multi-Workspace                    ║
    ║   ✓ Reporting Engine                   ║
    ║   ✓ Continuous Monitoring              ║
    ║   ✓ Issue Management                   ║
    ║                                        ║
    ║   Visionary AI Features:               ║
    ║   ✓ AI Compliance Co-Pilot             ║
    ║   ✓ Predictive Risk Intelligence       ║
    ║   ✓ Automated Policy Generation        ║
    ║   ✓ Intelligent Autopilot              ║
    ║   ✓ Compliance Benchmarking            ║
    ║                                        ║
    ║   Documentation:                       ║
    ║   → API Docs: /api/docs                ║
    ║   → OpenAPI Spec: /api/docs.json       ║
    ╚════════════════════════════════════════╝
  `);
}).on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${config.server.port} is already in use. Please stop the other process or use a different port.`);
  } else {
    logger.error(`❌ Failed to start server on port ${config.server.port}:`, error);
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  httpServer.close(async () => {
    logger.info('HTTP server closed');

    // Close WebSocket connections
    const io = websocketService.getIO();
    if (io) {
      io.close(() => {
        logger.info('WebSocket server closed');
      });
    }

    try {
      // Shutdown session management
      try {
        const sessionManagement = await import('./services/sessionManagementService');
        if (sessionManagement.default) {
          sessionManagement.default.shutdown();
        }
      } catch (error) {
        logger.warn('Session management shutdown error', error);
      }

      // Shutdown job queue
      try {
        await jobQueueService.shutdown();
      } catch (error) {
        logger.warn('Job queue shutdown error', error);
      }

      // Shutdown cache
      try {
        await cacheService.shutdown();
      } catch (error) {
        logger.warn('Cache shutdown error', error);
      }

      // Shutdown multi-region
      try {
        multiRegionService.shutdown();
      } catch (error) {
        logger.warn('Multi-region shutdown error', error);
      }

      // Disconnect MQTT
      mqttService.disconnect();

      // FIPS 140-3 key zeroization: destroy cached encryption key material
      try {
        destroyKey();
        if (entropyMonitorInterval) {
          clearInterval(entropyMonitorInterval);
        }
        logger.info('FIPS 140-3 key zeroization complete');
      } catch (error) {
        logger.warn('Key zeroization error', error);
      }

      await prisma.$disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default app;
