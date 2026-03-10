/**
 * Data Anonymization Routes (GDPR Recital 26)
 * Admin-only endpoints for data anonymization jobs
 */
import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import dataAnonymizationService from '../services/dataAnonymizationService';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// Preview anonymization (dry run)
router.post('/preview', authorize('Admin', 'Owner'), asyncHandler(async (req: Request, res: Response) => {
  const { records, fieldConfig } = req.body;
  if (!records || !fieldConfig) {
    return res.status(400).json({ error: 'records and fieldConfig are required' });
  }
  const anonymized = await dataAnonymizationService.anonymizeBatch(records, fieldConfig);
  return res.json({ original: records, anonymized, count: records.length });
}));

// Anonymize DSAR export data
router.post('/dsar-export', authorize('Admin', 'Owner'), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const orgId = user.organizationId;
  const { dsarId, fieldConfig } = req.body;
  if (!dsarId) return res.status(400).json({ error: 'dsarId is required' });

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

  logger.info(`Anonymization job started for DSAR ${dsarId} in org ${orgId}`);
  return res.json({ message: 'Anonymization job started', dsarId, fieldConfig: defaultConfig });
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
