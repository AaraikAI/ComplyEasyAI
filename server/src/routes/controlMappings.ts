import { Router } from 'express';
import controlMappingsController from '../controllers/controlMappingsController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';

const router = Router();

router.use(authenticate);

router.post('/', authorize('admin', 'editor'), asyncHandler(controlMappingsController.createMapping.bind(controlMappingsController)));
router.get('/control/:controlId', authenticate, asyncHandler(controlMappingsController.getMappings.bind(controlMappingsController)));
router.patch('/:mappingId', authorize('admin', 'editor'), asyncHandler(controlMappingsController.updateMapping.bind(controlMappingsController)));
router.delete('/:mappingId', authorize('admin', 'editor'), asyncHandler(controlMappingsController.deleteMapping.bind(controlMappingsController)));
router.get('/export/csv', authenticate, asyncHandler(controlMappingsController.exportMappings.bind(controlMappingsController)));

export default router;

