import { Router } from 'express';
import vendorRiskService from '../services/vendorRiskService';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Create vendor
router.post('/', async (req, res) => {
  try {
    const vendor = await vendorRiskService.createVendor({
      ...req.body,
      userId: (req as any).user.id,
    });
    res.status(201).json(vendor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create vendor assessment
router.post('/:id/assessments', async (req, res) => {
  try {
    const assessment = await vendorRiskService.createVendorAssessment({
      vendorId: req.params.id,
      ...req.body,
      organizationId: (req as any).user.organizationId,
      userId: (req as any).user.id,
    });
    res.status(201).json(assessment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Complete vendor assessment
router.post('/assessments/:id/complete', async (req, res) => {
  try {
    const assessment = await vendorRiskService.completeVendorAssessment(
      req.params.id,
      req.body,
      (req as any).user.id,
      (req as any).user.organizationId
    );
    res.json(assessment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get vendor scorecard
router.get('/:id/scorecard', async (req, res) => {
  try {
    const scorecard = await vendorRiskService.getVendorScorecard(req.params.id);
    res.json(scorecard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get vendor risk dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await vendorRiskService.getVendorRiskDashboard(
      (req as any).user.organizationId
    );
    res.json(dashboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await vendorRiskService.getVendorsByOrganization(
      (req as any).user.organizationId,
      req.query as any
    );
    res.json(vendors);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
