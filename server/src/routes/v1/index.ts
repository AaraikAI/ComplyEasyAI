/**
 * API V1 Router
 *
 * Re-exports all existing routes under the /v1/ prefix.
 * V1 represents the current stable API and is the default version.
 * All existing endpoints are available unchanged under /api/v1/...
 */

import { Router } from 'express';
import { apiLimiter } from '../../middleware/rateLimiter';

// Import all existing route modules
import authRoutes from '../auth';
import twoFactorRoutes from '../twoFactor';
import risksRoutes from '../risks';
import frameworksRoutes from '../frameworks';
import aiRoutes from '../ai';
import billingRoutes from '../billing';
import integrationsRoutes from '../integrations';
import teamRoutes from '../team';
import auditRoutes from '../audit';
import organizationRoutes from '../organization';
import personnelRoutes from '../personnel';
import vendorRoutes from '../vendors';
import enterpriseRoutes from '../enterprise';
import acosRoutes from '../acos';
import securityRoutes from '../security';
import webhooksRoutes from '../webhooks';
import demoRoutes from '../demo';
import controlMappingsRoutes from '../controlMappings';
import evidenceVersionsRoutes from '../evidenceVersions';
import aiRmfRoutes from '../aiRmf';
import onboardingRoutes from '../onboarding';
import euRegulationsRoutes from '../euRegulations';
import exportRoutes from '../export';
import notificationRoutes from '../notifications';

const v1Router = Router();

// Authentication routes (have their own rate limiters)
v1Router.use('/auth', authRoutes);
v1Router.use('/2fa', twoFactorRoutes);

// Core API routes with standard rate limiting
v1Router.use('/risks', apiLimiter, risksRoutes);
v1Router.use('/frameworks', apiLimiter, frameworksRoutes);
v1Router.use('/ai', aiRoutes); // Has its own rate limiter
v1Router.use('/billing', billingRoutes);
v1Router.use('/integrations', apiLimiter, integrationsRoutes);
v1Router.use('/eu-regulations', apiLimiter, euRegulationsRoutes);
v1Router.use('/team', apiLimiter, teamRoutes);
v1Router.use('/audit', apiLimiter, auditRoutes);
v1Router.use('/organization', apiLimiter, organizationRoutes);
v1Router.use('/control-mappings', apiLimiter, controlMappingsRoutes);
v1Router.use('/evidence-versions', apiLimiter, evidenceVersionsRoutes);

// Enterprise Module routes
v1Router.use('/personnel', apiLimiter, personnelRoutes);
v1Router.use('/vendors', apiLimiter, vendorRoutes);
v1Router.use('/enterprise', apiLimiter, enterpriseRoutes);

// aCOS routes
v1Router.use('/acos', apiLimiter, acosRoutes);

// NIST AI RMF routes
v1Router.use('/ai-rmf', apiLimiter, aiRmfRoutes);

// Security routes
v1Router.use('/security', apiLimiter, securityRoutes);

// Webhook routes
v1Router.use('/webhooks', apiLimiter, webhooksRoutes);
v1Router.use('/demo', apiLimiter, demoRoutes);

// Onboarding routes
v1Router.use('/onboarding', apiLimiter, onboardingRoutes);

// Export routes
v1Router.use('/export', apiLimiter, exportRoutes);

// Notification routes
v1Router.use('/notifications', apiLimiter, notificationRoutes);

export default v1Router;
