import { Router } from 'express';
import auditController from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';

const router = Router();

router.use(authenticate);

// List audit logs (admin and editor only)
router.get('/', authorize('admin', 'editor'), asyncHandler(auditController.list.bind(auditController)));

// Create audit log entry (all authenticated users)
router.post('/', asyncHandler(auditController.log.bind(auditController)));

export default router;

