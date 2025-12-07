import { Router } from 'express';
import frameworksController from '../controllers/frameworksController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(frameworksController.list.bind(frameworksController)));
router.get('/:id', asyncHandler(frameworksController.getById.bind(frameworksController)));
router.post('/', authorize('admin', 'editor'), asyncHandler(frameworksController.create.bind(frameworksController)));
router.patch('/:id', authorize('admin', 'editor'), asyncHandler(frameworksController.update.bind(frameworksController)));
router.delete('/:id', authorize('admin'), asyncHandler(frameworksController.delete.bind(frameworksController)));

export default router;
