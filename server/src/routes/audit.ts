import { Router } from 'express';
import auditController from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import { createAuditLogSchema, archiveAuditLogsSchema } from '../validators/auditSchemas';

const router = Router();

router.use(authenticate);

// List audit logs (admin and editor only)
router.get('/', authorize('admin', 'editor'), asyncHandler(auditController.list.bind(auditController)));

// Export audit logs (admin and auditor only)
router.get('/export', authorize('admin', 'editor'), asyncHandler(auditController.exportLogs.bind(auditController)));

// Archive old audit logs (admin only)
router.post('/archive', authorize('admin'), validateBody(archiveAuditLogsSchema), asyncHandler(auditController.archiveLogs.bind(auditController)));

// Create audit log entry (all authenticated users)
router.post('/', validateBody(createAuditLogSchema), asyncHandler(auditController.log.bind(auditController)));

export default router;

