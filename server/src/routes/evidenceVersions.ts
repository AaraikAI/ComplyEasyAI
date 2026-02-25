import { Router } from 'express';
import evidenceVersioningController from '../controllers/evidenceVersioningController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';

const router = Router();

router.use(authenticate);

router.get('/control/:controlId', authenticate, asyncHandler(evidenceVersioningController.getVersions.bind(evidenceVersioningController)));
router.get('/control/:controlId/:versionId', authenticate, asyncHandler(evidenceVersioningController.getVersion.bind(evidenceVersioningController)));
router.post('/control/:controlId', authorize('admin', 'editor'), asyncHandler(evidenceVersioningController.createVersion.bind(evidenceVersioningController)));
router.post('/control/:controlId/restore/:versionId', authorize('admin', 'editor'), asyncHandler(evidenceVersioningController.restoreVersion.bind(evidenceVersioningController)));
router.delete('/control/:controlId/:versionId', authorize('admin', 'editor'), asyncHandler(evidenceVersioningController.deleteVersion.bind(evidenceVersioningController)));

export default router;

