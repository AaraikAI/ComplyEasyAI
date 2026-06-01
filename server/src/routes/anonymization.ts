/**
 * Data Anonymization Routes (GDPR Recital 26)
 * Admin-only endpoints for data anonymization jobs
 */
import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import { previewAnonymizationSchema, dsarExportAnonymizationSchema } from '../validators/anonymizationSchemas';
import { AppError } from '../middleware/errorHandler';
import dataAnonymizationService from '../services/dataAnonymizationService';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// Preview anonymization (dry run)
router.post('/preview', authorize('Admin', 'Owner'), validateBody(previewAnonymizationSchema), asyncHandler(async (req: Request, res: Response) => {
  const { records, fieldConfig } = req.body;
  if (!records || !fieldConfig) {
    throw new AppError('records and fieldConfig are required', 400);
  }
  const anonymized = await dataAnonymizationService.anonymizeBatch(records, fieldConfig);
  return res.json({ original: records, anonymized, count: records.length });
}));

// Anonymize DSAR export data
router.post('/dsar-export', authorize('Admin', 'Owner'), validateBody(dsarExportAnonymizationSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const orgId = user.organizationId;
  const { dsarId, fieldConfig } = req.body;
  if (!dsarId) throw new AppError('dsarId is required', 400);

  // Default field config for DSAR exports
  const defaultConfig = fieldConfig || {
    email: { method: 'masking' as const },
    phone: { method: 'masking' as const },
    name: { method: 'masking' as const },
    firstName: { method: 'masking' as const },
    lastName: { method: 'masking' as const },
    address: { method: 'suppression' as const },
    ssn: { method: 'suppression' as const },
    dateOfBirth: { method: 'generalization' as const },
    ipAddress: { method: 'pseudonymization' as const },
  };

  // Resolve the DSAR within the caller's organization. The org filter ensures a
  // request can never reach another tenant's record even if ids collide.
  const dsar = await prisma.dSARRequest.findFirst({
    where: { id: dsarId, organizationId: orgId },
  });

  if (!dsar) {
    // No matching record to operate on in this organization. Return the planned
    // field configuration so callers can confirm the intended treatment.
    return res.json({ message: 'No matching DSAR record found for this organization', dsarId, anonymized: null, fieldConfig: defaultConfig });
  }

  // Build the personal-data record from the DSAR and any captured subject data,
  // then run the configured anonymization treatment over it.
  const dataFound = (dsar.dataFound && typeof dsar.dataFound === 'object' && !Array.isArray(dsar.dataFound))
    ? (dsar.dataFound as Record<string, unknown>)
    : {};
  const subjectRecord: Record<string, unknown> = {
    name: dsar.dataSubjectName,
    email: dsar.dataSubjectEmail,
    phone: dsar.dataSubjectPhone ?? null,
    ...dataFound,
  };

  const anonymized = await dataAnonymizationService.anonymizeRecord(subjectRecord, defaultConfig);

  // Persist the anonymized snapshot so the export reflects the redacted values.
  await prisma.dSARRequest.update({
    where: { id: dsar.id },
    data: { dataFound: anonymized as any },
  });

  logger.info(`Anonymization completed for DSAR ${dsarId} in org ${orgId}`);
  return res.json({ message: 'Anonymization job completed', dsarId, anonymized, fieldConfig: defaultConfig });
}));

// Get supported anonymization methods
router.get('/methods', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    methods: [
      { id: 'pseudonymization', name: 'Pseudonymization', description: 'Replace with HMAC-SHA256 derived token (FIPS-compliant, reversible with key)' },
      { id: 'masking', name: 'Data Masking', description: 'Partially obscure data while preserving format (e.g., j***@e***.com)' },
      { id: 'generalization', name: 'Generalization', description: 'Replace with broader category (e.g., age 32 -> 25-34)' },
      { id: 'suppression', name: 'Suppression', description: 'Complete removal, replaced with [REDACTED]' },
      { id: 'kAnonymity', name: 'K-Anonymity', description: 'Ensure at least k records share same quasi-identifiers' },
    ],
  });
}));

export default router;
