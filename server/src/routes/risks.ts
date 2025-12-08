import { Router } from 'express';
import risksController from '../controllers/risksController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(risksController.list.bind(risksController)));
router.get('/:id', asyncHandler(risksController.getById.bind(risksController)));
router.post('/', authorize('admin', 'editor'), asyncHandler(risksController.create.bind(risksController)));
router.patch('/:id', authorize('admin', 'editor'), asyncHandler(risksController.update.bind(risksController)));
router.delete('/:id', authorize('admin'), asyncHandler(risksController.delete.bind(risksController)));
router.post('/prioritize', authorize('admin', 'editor'), asyncHandler(risksController.prioritize.bind(risksController)));
router.post('/:id/remediation', authorize('admin', 'editor'), asyncHandler(risksController.generateRemediation.bind(risksController)));
router.post('/scan', authorize('admin', 'editor'), asyncHandler(risksController.scan.bind(risksController)));

export default router;
