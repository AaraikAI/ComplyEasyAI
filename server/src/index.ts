import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import config, { validateConfig } from './config';
import logger from './config/logger';
import prisma from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import websocketService from './services/websocketService';
import swaggerSpec from './config/swagger';

// Routes
import authRoutes from './routes/auth';
import twoFactorRoutes from './routes/twoFactor';
import risksRoutes from './routes/risks';
import frameworksRoutes from './routes/frameworks';
import aiRoutes from './routes/ai';
import billingRoutes from './routes/billing';
import integrationsRoutes from './routes/integrations';

// Enterprise Module Routes
import personnelRoutes from './routes/personnel';
import vendorRoutes from './routes/vendors';
import enterpriseRoutes from './routes/enterprise';

const app = express();

// Validate configuration
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration validation failed', error);
  process.exit(1);
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.security.corsOrigin || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
// Special handling for Stripe webhooks (requires raw body)
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    await prisma.$queryRaw`SELECT 1`;
    const wsConnected = websocketService.getIO() !== null;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.env,
      websocket: wsConnected ? 'connected' : 'disconnected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
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

// Enterprise Module routes
app.use('/api/personnel', apiLimiter, personnelRoutes);
app.use('/api/vendors', apiLimiter, vendorRoutes);
app.use('/api/enterprise', apiLimiter, enterpriseRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
websocketService.initialize(httpServer);

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
