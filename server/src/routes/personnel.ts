import { Router } from 'express';
import personnelService from '../services/personnelService';
import { authenticate } from '../middleware/auth';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create personnel record
router.post(
  '/',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const personnel = await personnelService.createPersonnel({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(personnel);
  })
);

// Complete onboarding
router.post(
  '/:id/complete-onboarding',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const personnel = await personnelService.completeOnboarding(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(personnel);
  })
);

// Start offboarding
router.post(
  '/:id/start-offboarding',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const personnel = await personnelService.startOffboarding(
      req.params.id,
      req.body.reason,
      req.user.id,
      req.user.organizationId
    );
    res.json(personnel);
  })
);

// Create access review
router.post(
  '/access-reviews',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const review = await personnelService.createAccessReview({
      ...req.body,
      reviewerId: req.user.id,
      organizationId: req.user.organizationId,
    });
    res.status(201).json(review);
  })
);

// Complete access review
router.post(
  '/access-reviews/:id/complete',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const review = await personnelService.completeAccessReview(
      req.params.id,
      req.body,
      req.user.id,
      req.user.organizationId
    );
    res.json(review);
  })
);

// Get all personnel
router.get(
  '/',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const personnel = await personnelService.getPersonnelByOrganization(
      req.user.organizationId
    );
    res.json(personnel);
  })
);

// Get pending access reviews
router.get(
  '/access-reviews/pending',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const reviews = await personnelService.getPendingAccessReviews(
      req.user.organizationId,
      req.query.reviewerId as string
    );
    res.json(reviews);
  })
);

// Get compliance summary
router.get(
  '/compliance-summary',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const summary = await personnelService.getComplianceSummary(
      req.user.organizationId
    );
    res.json(summary);
  })
);

export default router;
