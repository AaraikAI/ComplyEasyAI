import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import crypto from 'crypto';
import config, { validateConfig } from './config';
import logger from './config/logger';
import prisma, { testConnection } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
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

// EU Regulations Routes
import euRegulationsRoutes from './routes/euRegulations';

// aCOS Services
import mqttService from './services/advanced/mqttService';

const app = express();

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
  origin: config.security.corsOrigin || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Webhook-Signature', 'X-Webhook-Timestamp', 'X-Webhook-Event'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
}));

// Body parsing middleware
// Special handling for Stripe webhooks (requires raw body)
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Try database connection with timeout
    const dbCheck = Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    
    await dbCheck;
    const wsConnected = websocketService.getIO() !== null;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.env,
      websocket: wsConnected ? 'connected' : 'disconnected',
      database: 'connected',
    });
  } catch (error: any) {
    // Log error but don't fail completely - allow server to start
    logger.warn('Health check: Database connection issue:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message || 'Database connection failed',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
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

      // Disconnect MQTT
      mqttService.disconnect();
      
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
