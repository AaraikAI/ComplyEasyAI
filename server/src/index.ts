import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
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

// aCOS v3.0 Routes
import acosRoutes from './routes/acos';

// aCOS v3.0 Services
import mqttService from './services/advanced/mqttService';
import config from './config';

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

// Security middleware with enhanced headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.server.apiUrl],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
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
  allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use('/api/team', apiLimiter, teamRoutes);
app.use('/api/audit', apiLimiter, auditRoutes);
app.use('/api/organization', apiLimiter, organizationRoutes);

// Enterprise Module routes
app.use('/api/personnel', apiLimiter, personnelRoutes);
app.use('/api/vendors', apiLimiter, vendorRoutes);
app.use('/api/enterprise', apiLimiter, enterpriseRoutes);

// aCOS v3.0 routes
app.use('/api/acos', apiLimiter, acosRoutes);

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

// Test database connection before starting server
testConnection().then((connected) => {
  if (!connected) {
    logger.warn('⚠️  Starting server without database connection - some features may not work');
  }
}).catch((error) => {
  logger.warn('⚠️  Database connection test failed:', error.message);
});

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

// Start server
httpServer.listen(config.server.port, () => {
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
