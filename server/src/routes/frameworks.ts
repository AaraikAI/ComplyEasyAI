import { Router, Request, Response } from 'express';
import multer from 'multer';
import frameworksController from '../controllers/frameworksController';
import { authenticate, authorize } from '../middleware/auth';
import { enforceLimit } from '../middleware/tierMiddleware';
import { asyncHandler } from '../types/express';
import { frameworkLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';
import {
  createFrameworkSchema,
  updateFrameworkSchema,
  applyTemplateSchema,
  createControlSchema,
  updateControlSchema,
  bulkUpdateControlsSchema,
  rejectSuggestionSchema,
} from '../validators/frameworkSchemas';
import frameworkTemplateService from '../services/frameworkTemplateService';
import { AppError } from '../middleware/errorHandler';
import prisma from '../config/database';
import logger from '../config/logger';

interface AuthRequest extends Request {
  user?: { id: string; organizationId: string; role: string; email: string; name: string };
}

const router = Router();
// Framework control evidence is documents-only (audit reports, screenshots,
// policies, attestations). Audio/video isn't accepted on this route. Per audit
// COV-17 §5.5.17.
const FRAMEWORK_EVIDENCE_ALLOWED_MIMES = new Set<string>([
  'application/pdf',
  'application/json',
  'application/xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/zip',
  'text/plain',
  'text/csv',
  'text/xml',
  'text/markdown',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max for evidence files
  fileFilter: (_req, file, cb) => {
    if (FRAMEWORK_EVIDENCE_ALLOWED_MIMES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new AppError(`Unsupported file type: ${file.mimetype}`, 415));
    }
  },
});

router.use(authenticate);
router.use(frameworkLimiter); // Apply rate limiting to all framework routes

// ──── Historical Compliance Score Endpoint ────
// GET /api/frameworks/scores/history?months=6
// Returns monthly compliance score snapshots for dashboard trend charts.
// Scores are derived from historical audit-log snapshots when available,
// falling back to a linear projection from current framework progress.
router.get('/scores/history', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const organizationId = authReq.user!.organizationId;
  const monthsParam = parseInt(req.query.months as string, 10);
  const months = (!isNaN(monthsParam) && monthsParam > 0 && monthsParam <= 24) ? monthsParam : 6;

  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 1. Try to find historical score snapshots stored in audit logs
  const historicalLogs = await prisma.auditLog.findMany({
    where: {
      organizationId,
      action: 'compliance_score_snapshot',
    },
    orderBy: { timestamp: 'desc' },
    take: months,
  });

  if (historicalLogs.length >= months) {
    // We have enough stored snapshots — use them directly
    const scores = historicalLogs
      .reverse()
      .map(log => {
        let details: any = {};
        try {
          details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        } catch (err) { logger.warn('Failed to parse framework log details', err); }
        const date = new Date(log.timestamp);
        return {
          name: monthNames[date.getMonth()],
          score: details.score ?? 0,
          date: log.timestamp,
        };
      });
    res.json({ scores, source: 'historical' });
    return;
  }

  // 2. Compute current score from live framework data
  const frameworks = await prisma.complianceFramework.findMany({
    where: { organizationId },
    include: { controls: { select: { status: true } } },
  });

  let totalControls = 0;
  let compliantControls = 0;
  for (const fw of frameworks) {
    if (fw.controls && fw.controls.length > 0) {
      totalControls += fw.controls.length;
      compliantControls += fw.controls.filter(
        (c: any) => c.status === 'Implemented' || c.status === 'Compliant'
      ).length;
    } else {
      totalControls += 100;
      compliantControls += (fw as any).progress || 0;
    }
  }
  const currentScore = totalControls > 0 ? Math.round((compliantControls / totalControls) * 100) : 0;

  // 3. Build the trend, preferring any real snapshots that already exist for a
  //    given month and only synthesizing months with no persisted snapshot.
  //    Synthesized points are individually flagged so callers can distinguish
  //    real history from a back-projection.
  const snapshotByMonth = new Map<string, number>();
  for (const log of historicalLogs) {
    let details: any = {};
    try {
      details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
    } catch (err) { logger.warn('Failed to parse framework log details', err); }
    const d = new Date(log.timestamp);
    if (typeof details.score === 'number') {
      snapshotByMonth.set(`${d.getFullYear()}_${d.getMonth()}`, details.score);
    }
  }

  const scores = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}_${date.getMonth()}`;
    const realScore = snapshotByMonth.get(monthKey);
    if (typeof realScore === 'number') {
      scores.push({
        name: monthNames[date.getMonth()],
        score: Math.max(0, Math.min(100, realScore)),
        date,
        projected: false,
      });
      continue;
    }
    // No persisted snapshot for this month — back-project a smooth ramp toward
    // the current score so the chart renders, and tag the point as projected.
    const progressFactor = 1 - (i / months);
    const baseScore = Math.max(0, currentScore - 30);
    const score = Math.round(baseScore + (currentScore - baseScore) * progressFactor);
    scores.push({
      name: monthNames[date.getMonth()],
      score: Math.max(0, Math.min(100, score)),
      date,
      projected: true,
    });
  }

  // 4. Persist the current month's score as a snapshot for future queries
  const snapshotHash = `score_${organizationId}_${now.getFullYear()}_${now.getMonth()}`;
  await prisma.auditLog.upsert({
    where: { id: snapshotHash },
    create: {
      id: snapshotHash,
      action: 'compliance_score_snapshot',
      organizationId,
      userId: authReq.user!.id,
      hash: snapshotHash,
      details: JSON.stringify({ score: currentScore, totalControls, compliantControls }),
    },
    update: {
      details: JSON.stringify({ score: currentScore, totalControls, compliantControls }),
    },
  });

  res.json({ scores, source: 'projected', currentScore });
}));

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
    throw new AppError(`No template found for framework type: ${decodedType}`, 404);
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
router.post('/:id/apply-template', authorize('admin', 'editor'), validateBody(applyTemplateSchema), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;
  const { frameworkType } = req.body;

  if (!frameworkType) {
    throw new AppError('frameworkType is required in request body', 400);
  }

  if (!frameworkTemplateService.hasTemplate(frameworkType)) {
    throw new AppError(`No template found for framework type: ${frameworkType}`, 404);
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

// POST /api/frameworks/:id/regenerate-mappings - Regenerate control mappings for a framework
router.post('/:id/regenerate-mappings', authorize('admin', 'editor'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;

  const result = await frameworkTemplateService.regenerateControlMappings(
    authReq.user!.organizationId,
    id
  );

  res.json({
    message: `Control mappings regenerated: ${result.created} created, ${result.deleted} deleted`,
    ...result,
  });
}));

router.get('/', asyncHandler(frameworksController.list.bind(frameworksController)));
router.get('/:id', asyncHandler(frameworksController.getById.bind(frameworksController)));
router.post('/', authorize('admin', 'editor'), enforceLimit('maxFrameworks'), validateBody(createFrameworkSchema), asyncHandler(frameworksController.create.bind(frameworksController)));
router.patch('/:id', authorize('admin', 'editor'), validateBody(updateFrameworkSchema), asyncHandler(frameworksController.update.bind(frameworksController)));
router.delete('/:id', authorize('admin'), asyncHandler(frameworksController.delete.bind(frameworksController)));
router.get('/:frameworkId/controls/:controlId/export', authorize('admin', 'editor'), asyncHandler(frameworksController.exportControl.bind(frameworksController)));

// Control management
router.post('/:frameworkId/controls', authorize('admin', 'editor'), validateBody(createControlSchema), asyncHandler(frameworksController.createControl.bind(frameworksController)));
router.patch('/:frameworkId/controls/:controlId', authorize('admin', 'editor'), validateBody(updateControlSchema), asyncHandler(frameworksController.updateControl.bind(frameworksController)));
router.post('/:frameworkId/controls/bulk-update', authorize('admin', 'editor'), validateBody(bulkUpdateControlsSchema), asyncHandler(frameworksController.bulkUpdateControls.bind(frameworksController)));
router.delete('/:frameworkId/controls/:controlId', authorize('admin', 'editor'), asyncHandler(frameworksController.deleteControl.bind(frameworksController)));

// Evidence upload
router.post('/:frameworkId/controls/:controlId/evidence', authorize('admin', 'editor'), upload.single('file'), asyncHandler(frameworksController.uploadEvidence.bind(frameworksController)));
router.get('/:frameworkId/controls/:controlId/evidence/url', authenticate, asyncHandler(frameworksController.getEvidenceUrl.bind(frameworksController)));

// Smart upload
router.post('/:frameworkId/smart-upload', authorize('admin', 'editor'), upload.single('file'), asyncHandler(frameworksController.smartUpload.bind(frameworksController)));

// AI Suggestions
router.get('/:frameworkId/suggestions', authenticate, asyncHandler(frameworksController.getSuggestions.bind(frameworksController)));
router.post('/suggestions/:suggestionId/accept', authorize('admin', 'editor'), asyncHandler(frameworksController.acceptSuggestion.bind(frameworksController)));
router.post('/suggestions/:suggestionId/reject', authorize('admin', 'editor'), validateBody(rejectSuggestionSchema), asyncHandler(frameworksController.rejectSuggestion.bind(frameworksController)));

export default router;
