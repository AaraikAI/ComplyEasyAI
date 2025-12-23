import { Router } from 'express';
import multer from 'multer';
import frameworksController from '../controllers/frameworksController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/', asyncHandler(frameworksController.list.bind(frameworksController)));
router.get('/:id', asyncHandler(frameworksController.getById.bind(frameworksController)));
router.post('/', authorize('admin', 'editor'), asyncHandler(frameworksController.create.bind(frameworksController)));
router.patch('/:id', authorize('admin', 'editor'), asyncHandler(frameworksController.update.bind(frameworksController)));
router.delete('/:id', authorize('admin'), asyncHandler(frameworksController.delete.bind(frameworksController)));
router.get('/:frameworkId/controls/:controlId/export', authorize('admin', 'editor'), asyncHandler(frameworksController.exportControl.bind(frameworksController)));

// Control management
router.post('/:frameworkId/controls', authorize('admin', 'editor'), asyncHandler(frameworksController.createControl.bind(frameworksController)));
router.patch('/:frameworkId/controls/:controlId', authorize('admin', 'editor'), asyncHandler(frameworksController.updateControl.bind(frameworksController)));

// Evidence upload
router.post('/:frameworkId/controls/:controlId/evidence', authorize('admin', 'editor'), upload.single('file'), asyncHandler(frameworksController.uploadEvidence.bind(frameworksController)));

// Smart upload
router.post('/:frameworkId/smart-upload', authorize('admin', 'editor'), upload.single('file'), asyncHandler(frameworksController.smartUpload.bind(frameworksController)));

export default router;
