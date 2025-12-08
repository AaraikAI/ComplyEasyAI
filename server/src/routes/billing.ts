import { Router } from 'express';
import billingController from '../controllers/billingController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';

const router = Router();

router.post('/webhook', asyncHandler(billingController.webhook.bind(billingController))); // Public webhook endpoint
router.use(authenticate);

router.post('/checkout', authorize('admin'), asyncHandler(billingController.createCheckout.bind(billingController)));
router.post('/portal', authorize('admin'), asyncHandler(billingController.createPortalSession.bind(billingController)));
router.get('/subscription', asyncHandler(billingController.getSubscription.bind(billingController)));

export default router;
