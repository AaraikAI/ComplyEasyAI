import { Router } from 'express';
import frameworksController from '../controllers/frameworksController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', frameworksController.list);
router.get('/:id', frameworksController.getById);
router.post('/', authorize('admin', 'editor'), frameworksController.create);
router.patch('/:id', authorize('admin', 'editor'), frameworksController.update);
router.delete('/:id', authorize('admin'), frameworksController.delete);

export default router;
