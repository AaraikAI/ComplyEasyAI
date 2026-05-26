import { Router } from 'express';
import vendorRiskService from '../services/vendorRiskService';
import { authenticate } from '../middleware/auth';
import { enforceLimit } from '../middleware/tierMiddleware';
import { validateBody } from '../middleware/validate';
import {
  createVendorSchema,
  createVendorAssessmentSchema,
  completeVendorAssessmentSchema,
  updateVendorSchema,
} from '../validators/vendorSchemas';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';

const router = Router();
router.use(authenticate);

// Create vendor
router.post(
  '/',
  enforceLimit('maxVendors'),
  validateBody(createVendorSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const vendor = await vendorRiskService.createVendor({
      ...req.body,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.status(201).json(vendor);
  })
);

// Create vendor assessment
router.post(
  '/:id/assessments',
  validateBody(createVendorAssessmentSchema),
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
  validateBody(completeVendorAssessmentSchema),
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

// Get vendor risk dashboard (must be before /:id to avoid matching "dashboard" as ID)
router.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const dashboard = await vendorRiskService.getVendorRiskDashboard(
      req.user.organizationId
    );
    res.json(dashboard);
  })
);

// Get vendor assessment queue (active assessments scoped to caller's org)
// Must be before /:id to avoid matching "assessments" as ID.
router.get(
  '/assessments/queue',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const queue = await vendorRiskService.getAssessmentQueue(
      req.user.organizationId
    );
    res.json({ queue });
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

// Get vendor scorecard
router.get(
  '/:id/scorecard',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const scorecard = await vendorRiskService.getVendorScorecard(req.params.id, req.user.organizationId);
    res.json(scorecard);
  })
);

// Get single vendor
router.get(
  '/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const vendor = await vendorRiskService.getVendorById(
      req.params.id,
      req.user.organizationId
    );
    res.json(vendor);
  })
);

// Update vendor
router.put(
  '/:id',
  validateBody(updateVendorSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const vendor = await vendorRiskService.updateVendor(
      req.params.id,
      req.body,
      req.user.id,
      req.user.organizationId
    );
    res.json(vendor);
  })
);

// Archive vendor (soft-delete)
router.delete(
  '/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const vendor = await vendorRiskService.archiveVendor(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(vendor);
  })
);

export default router;
