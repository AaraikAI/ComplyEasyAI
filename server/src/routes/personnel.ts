import { Router } from 'express';
import personnelService from '../services/personnelService';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create personnel record
router.post('/', async (req, res) => {
  try {
    const personnel = await personnelService.createPersonnel({
      ...req.body,
      userId: (req as any).user.id,
    });
    res.status(201).json(personnel);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Complete onboarding
router.post('/:id/complete-onboarding', async (req, res) => {
  try {
    const personnel = await personnelService.completeOnboarding(
      req.params.id,
      (req as any).user.id,
      (req as any).user.organizationId
    );
    res.json(personnel);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Start offboarding
router.post('/:id/start-offboarding', async (req, res) => {
  try {
    const personnel = await personnelService.startOffboarding(
      req.params.id,
      req.body.reason,
      (req as any).user.id,
      (req as any).user.organizationId
    );
    res.json(personnel);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create access review
router.post('/access-reviews', async (req, res) => {
  try {
    const review = await personnelService.createAccessReview({
      ...req.body,
      reviewerId: (req as any).user.id,
      organizationId: (req as any).user.organizationId,
    });
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Complete access review
router.post('/access-reviews/:id/complete', async (req, res) => {
  try {
    const review = await personnelService.completeAccessReview(
      req.params.id,
      req.body,
      (req as any).user.id,
      (req as any).user.organizationId
    );
    res.json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get all personnel
router.get('/', async (req, res) => {
  try {
    const personnel = await personnelService.getPersonnelByOrganization(
      (req as any).user.organizationId
    );
    res.json(personnel);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get pending access reviews
router.get('/access-reviews/pending', async (req, res) => {
  try {
    const reviews = await personnelService.getPendingAccessReviews(
      (req as any).user.organizationId,
      req.query.reviewerId as string
    );
    res.json(reviews);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get compliance summary
router.get('/compliance-summary', async (req, res) => {
  try {
    const summary = await personnelService.getComplianceSummary(
      (req as any).user.organizationId
    );
    res.json(summary);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
