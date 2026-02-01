import { Router, Request, Response } from 'express';
import multer from 'multer';
import frameworksController from '../controllers/frameworksController';
import { authenticate, authorize } from '../middleware/auth';
import { enforceLimit } from '../middleware/tierMiddleware';
import { asyncHandler } from '../types/express';
import { frameworkLimiter } from '../middleware/rateLimiter';
import frameworkTemplateService from '../services/frameworkTemplateService';

interface AuthRequest extends Request {
  user?: { id: string; organizationId: string; role: string; email: string; name: string };
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(frameworkLimiter); // Apply rate limiting to all framework routes

// ──── Template Routes (must be before /:id to avoid param conflicts) ────
// GET /api/frameworks/templates - List all available framework templates with control counts
router.get('/templates', asyncHandler(async (_req: Request, res: Response) => {
  const templates = frameworkTemplateService.getAvailableTemplates();
  res.json({ templates });
}));

// GET /api/frameworks/templates/:frameworkType - Get all controls for a specific framework template
router.get('/templates/:frameworkType', asyncHandler(async (req: Request, res: Response) => {
  const { frameworkType } = req.params;
  const decodedType = decodeURIComponent(frameworkType);
  const controls = frameworkTemplateService.getTemplatesForFramework(decodedType);

  if (controls.length === 0) {
    res.status(404).json({ error: `No template found for framework type: ${decodedType}` });
    return;
  }

  const categories = frameworkTemplateService.getTemplateCategories(decodedType);
  res.json({
    frameworkType: decodedType,
    controlCount: controls.length,
    categories,
    controls,
  });
}));

// POST /api/frameworks/:id/apply-template - Apply template controls to an existing framework
router.post('/:id/apply-template', authorize('admin', 'editor'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;
  const { frameworkType } = req.body;

  if (!frameworkType) {
    res.status(400).json({ error: 'frameworkType is required in request body' });
    return;
  }

  if (!frameworkTemplateService.hasTemplate(frameworkType)) {
    res.status(404).json({ error: `No template found for framework type: ${frameworkType}` });
    return;
  }

  const result = await frameworkTemplateService.applyTemplateToFramework(
    authReq.user!.organizationId,
    id,
    frameworkType,
    authReq.user!.id
  );

  res.json({
    message: `Template applied successfully: ${result.applied} controls added, ${result.skipped} skipped`,
    ...result,
  });
}));

router.get('/', asyncHandler(frameworksController.list.bind(frameworksController)));
router.get('/:id', asyncHandler(frameworksController.getById.bind(frameworksController)));
router.post('/', authorize('admin', 'editor'), enforceLimit('maxFrameworks'), asyncHandler(frameworksController.create.bind(frameworksController)));
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
