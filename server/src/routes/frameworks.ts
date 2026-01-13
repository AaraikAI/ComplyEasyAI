import { Router } from 'express';
import multer from 'multer';
import frameworksController from '../controllers/frameworksController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { frameworkLimiter } from '../middleware/rateLimiter';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(frameworkLimiter); // Apply rate limiting to all framework routes

router.get('/', asyncHandler(frameworksController.list.bind(frameworksController)));
router.get('/:id', asyncHandler(frameworksController.getById.bind(frameworksController)));
router.post('/', authorize('admin', 'editor'), asyncHandler(frameworksController.create.bind(frameworksController)));
router.patch('/:id', authorize('admin', 'editor'), asyncHandler(frameworksController.update.bind(frameworksController)));
router.delete('/:id', authorize('admin'), asyncHandler(frameworksController.delete.bind(frameworksController)));
router.get('/:frameworkId/controls/:controlId/export', authorize('admin', 'editor'), asyncHandler(frameworksController.exportControl.bind(frameworksController)));

// Control management
router.post('/:frameworkId/controls', authorize('admin', 'editor'), asyncHandler(frameworksController.createControl.bind(frameworksController)));
router.patch('/:frameworkId/controls/:controlId', authorize('admin', 'editor'), asyncHandler(frameworksController.updateControl.bind(frameworksController)));
router.post('/:frameworkId/controls/bulk-update', authorize('admin', 'editor'), asyncHandler(frameworksController.bulkUpdateControls.bind(frameworksController)));
router.delete('/:frameworkId/controls/:controlId', authorize('admin', 'editor'), asyncHandler(frameworksController.deleteControl.bind(frameworksController)));

// Evidence upload
router.post('/:frameworkId/controls/:controlId/evidence', authorize('admin', 'editor'), upload.single('file'), asyncHandler(frameworksController.uploadEvidence.bind(frameworksController)));
router.get('/:frameworkId/controls/:controlId/evidence/url', authenticate, asyncHandler(frameworksController.getEvidenceUrl.bind(frameworksController)));

// Smart upload
router.post('/:frameworkId/smart-upload', authorize('admin', 'editor'), upload.single('file'), asyncHandler(frameworksController.smartUpload.bind(frameworksController)));

// AI Suggestions
router.get('/:frameworkId/suggestions', authenticate, asyncHandler(frameworksController.getSuggestions.bind(frameworksController)));
router.post('/suggestions/:suggestionId/accept', authorize('admin', 'editor'), asyncHandler(frameworksController.acceptSuggestion.bind(frameworksController)));
router.post('/suggestions/:suggestionId/reject', authorize('admin', 'editor'), asyncHandler(frameworksController.rejectSuggestion.bind(frameworksController)));

export default router;
