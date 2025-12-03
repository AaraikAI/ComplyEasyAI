import { Router } from 'express';
import billingController from '../controllers/billingController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/webhook', billingController.webhook); // Public webhook endpoint
router.use(authenticate);

router.post('/checkout', authorize('admin'), billingController.createCheckout);
router.post('/portal', authorize('admin'), billingController.createPortalSession);
router.get('/subscription', billingController.getSubscription);

export default router;
