import { Router } from 'express';
import vendorRiskService from '../services/vendorRiskService';
import { authenticate } from '../middleware/auth';
import { enforceLimit } from '../middleware/tierMiddleware';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';

const router = Router();
router.use(authenticate);

// Create vendor
router.post(
  '/',
  enforceLimit('maxVendors'),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const vendor = await vendorRiskService.createVendor({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(vendor);
  })
);

// Create vendor assessment
router.post(
  '/:id/assessments',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const assessment = await vendorRiskService.createVendorAssessment({
      vendorId: req.params.id,
      ...req.body,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.status(201).json(assessment);
  })
);

// Complete vendor assessment
router.post(
  '/assessments/:id/complete',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const assessment = await vendorRiskService.completeVendorAssessment(
      req.params.id,
      req.body,
      req.user.id,
      req.user.organizationId
    );
    res.json(assessment);
  })
);

// Get vendor scorecard
router.get(
  '/:id/scorecard',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const scorecard = await vendorRiskService.getVendorScorecard(req.params.id);
    res.json(scorecard);
  })
);

// Get vendor risk dashboard
router.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const dashboard = await vendorRiskService.getVendorRiskDashboard(
      req.user.organizationId
    );
    res.json(dashboard);
  })
);

// Get all vendors
router.get(
  '/',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const vendors = await vendorRiskService.getVendorsByOrganization(
      req.user.organizationId,
      req.query as any
    );
    res.json(vendors);
  })
);

export default router;
