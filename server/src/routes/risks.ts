import { Router } from 'express';
import risksController from '../controllers/risksController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', risksController.list);
router.get('/:id', risksController.getById);
router.post('/', authorize('admin', 'editor'), risksController.create);
router.patch('/:id', authorize('admin', 'editor'), risksController.update);
router.delete('/:id', authorize('admin'), risksController.delete);
router.post('/prioritize', authorize('admin', 'editor'), risksController.prioritize);
router.post('/:id/remediation', authorize('admin', 'editor'), risksController.generateRemediation);
router.post('/scan', authorize('admin', 'editor'), risksController.scan);

export default router;
