/**
 * PCI-DSS v4.0 Workflow Routes
 *
 * REST surface over pciDssService:
 *   - Cardholder Data Environment scope and SAQ determination (/scopes)
 *   - Per-requirement control implementation tracking (/requirements)
 *   - Evidence collection tagged to requirements (/evidence)
 *   - QSA findings and remediation workflow (/findings)
 *   - Compensating Control Worksheets per Appendix B (/ccws)
 *   - Report on Compliance + Attestation of Compliance (/rocs, /aoc)
 *
 * All routes authenticated, org-scoped via req.user.organizationId. Mutating
 * routes are restricted by role (admin / compliance_admin / control_owner /
 * qsa / security_admin).
 */

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';
import { validateBody, validateQuery } from '../middleware/validate';
import pciDssService from '../services/pciDssService';
import {
  createScopeSchema,
  updateScopeSchema,
  scopesQuerySchema,
  upsertRequirementSchema,
  updateRequirementSchema,
  requirementsQuerySchema,
  createEvidenceSchema,
  evidenceQuerySchema,
  rejectEvidenceSchema,
  createQSAFindingSchema,
  updateQSAFindingSchema,
  qsaFindingsQuerySchema,
  createCCWSchema,
  createROCSchema,
  generateAOCSchema,
} from '../validators/pciDssSchemas';

const router = Router();
router.use(authenticate);

// ── Dashboard ───────────────────────────────────────────────────────────

router.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.getDashboard(req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

// ── Scopes ──────────────────────────────────────────────────────────────

router.post(
  '/scopes',
  authorize('admin', 'compliance_admin'),
  validateBody(createScopeSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.createScope({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof pciDssService.createScope>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.patch(
  '/scopes/:id',
  authorize('admin', 'compliance_admin'),
  validateBody(updateScopeSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.updateScope(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      req.body as Parameters<typeof pciDssService.updateScope>[3]
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/scopes',
  validateQuery(scopesQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query as Parameters<typeof pciDssService.listScopes>[1];
    const data = await pciDssService.listScopes(req.user.organizationId, q);
    res.json({ status: 'success', data });
  })
);

router.get(
  '/scopes/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.getScope(req.params.id as string, req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

router.post(
  '/scopes/:id/seed-requirements',
  authorize('admin', 'compliance_admin'),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.bulkSeedRequirements(
      req.params.id as string,
      req.user.organizationId,
      req.user.id
    );
    res.status(201).json({ status: 'success', data });
  })
);

// ── Requirements ────────────────────────────────────────────────────────

router.get(
  '/scopes/:id/requirements',
  validateQuery(requirementsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query as Parameters<typeof pciDssService.listRequirements>[2];
    const data = await pciDssService.listRequirements(
      req.user.organizationId,
      req.params.id as string,
      q
    );
    res.json({ status: 'success', data });
  })
);

router.post(
  '/requirements',
  authorize('admin', 'compliance_admin', 'control_owner'),
  validateBody(upsertRequirementSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.upsertRequirement({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof pciDssService.upsertRequirement>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.patch(
  '/requirements/:id',
  authorize('admin', 'compliance_admin', 'control_owner'),
  validateBody(updateRequirementSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const existing = await pciDssService.getRequirement(req.params.id as string, req.user.organizationId);
    const data = await pciDssService.upsertRequirement({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      scopeId: existing.scopeId,
      requirementRef: existing.requirementRef,
      title: existing.title,
      description: existing.description,
      ...(req.body as Record<string, unknown>),
    } as Parameters<typeof pciDssService.upsertRequirement>[0]);
    res.json({ status: 'success', data });
  })
);

router.get(
  '/requirements/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.getRequirement(
      req.params.id as string,
      req.user.organizationId
    );
    res.json({ status: 'success', data });
  })
);

// ── Evidence ────────────────────────────────────────────────────────────

router.post(
  '/evidence',
  authorize('admin', 'compliance_admin', 'control_owner'),
  validateBody(createEvidenceSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.createEvidence({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof pciDssService.createEvidence>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.get(
  '/evidence',
  validateQuery(evidenceQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query as Parameters<typeof pciDssService.listEvidence>[1];
    const data = await pciDssService.listEvidence(req.user.organizationId, q);
    res.json({ status: 'success', data });
  })
);

router.post(
  '/evidence/:id/approve',
  authorize('qsa', 'admin', 'compliance_admin'),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.approveEvidence(
      req.params.id as string,
      req.user.organizationId,
      req.user.id
    );
    res.json({ status: 'success', data });
  })
);

router.post(
  '/evidence/:id/reject',
  authorize('qsa', 'admin', 'compliance_admin'),
  validateBody(rejectEvidenceSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.rejectEvidence(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      (req.body as { reason: string }).reason
    );
    res.json({ status: 'success', data });
  })
);

// ── QSA Findings ────────────────────────────────────────────────────────

router.post(
  '/findings',
  authorize('qsa', 'admin', 'compliance_admin'),
  validateBody(createQSAFindingSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.createQSAFinding({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof pciDssService.createQSAFinding>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.patch(
  '/findings/:id',
  authorize('admin', 'compliance_admin'),
  validateBody(updateQSAFindingSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { status: Parameters<typeof pciDssService.updateQSAFindingStatus>[3]; remediationEvidence?: Record<string, unknown> };
    const data = await pciDssService.updateQSAFindingStatus(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      body.status,
      body.remediationEvidence
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/findings',
  validateQuery(qsaFindingsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query as Parameters<typeof pciDssService.listQSAFindings>[1];
    const data = await pciDssService.listQSAFindings(req.user.organizationId, q);
    res.json({ status: 'success', data });
  })
);

// ── Compensating Control Worksheets ─────────────────────────────────────

router.post(
  '/ccws',
  authorize('admin', 'compliance_admin'),
  validateBody(createCCWSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.createCCW({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof pciDssService.createCCW>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.post(
  '/ccws/:id/approve',
  authorize('qsa', 'admin'),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.approveCCW(
      req.params.id as string,
      req.user.organizationId,
      req.user.id
    );
    res.json({ status: 'success', data });
  })
);

// ── ROC / AOC ───────────────────────────────────────────────────────────

router.post(
  '/rocs',
  authorize('admin', 'compliance_admin'),
  validateBody(createROCSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.createROC({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof pciDssService.createROC>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.post(
  '/rocs/:id/finalize',
  authorize('qsa', 'admin'),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await pciDssService.finalizeROC(
      req.params.id as string,
      req.user.organizationId,
      req.user.id
    );
    res.json({ status: 'success', data });
  })
);

router.post(
  '/rocs/:id/aoc',
  authorize('qsa', 'admin'),
  validateBody(generateAOCSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as Parameters<typeof pciDssService.generateAOC>[3];
    const data = await pciDssService.generateAOC(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      body
    );
    res.status(201).json({ status: 'success', data });
  })
);

export default router;
