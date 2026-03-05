/**
 * DORA (Digital Operational Resilience Act) Routes
 *
 * Regulation (EU) 2022/2554 — comprehensive routes covering:
 * - ICT Risk Management (Articles 6-16)
 * - ICT Incident Management (Articles 17-23)
 * - Digital Operational Resilience Testing (Articles 24-27)
 * - Managing ICT Third-Party Risk (Articles 28-44)
 * - Information Register (Article 28(3))
 * - Dashboard & Compliance Scoring
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import * as doraService from '../services/doraService';

const router = Router();

// All DORA routes require authentication
router.use(authenticate);

// ============================================================================
// DASHBOARD & COMPLIANCE
// ============================================================================

router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const dashboard = await doraService.getDORADashboard(user.organizationId);
    res.json(dashboard);
  })
);

router.get(
  '/compliance-score',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const score = await doraService.calculateDORAComplianceScore(
      user.organizationId
    );
    res.json(score);
  })
);

// ============================================================================
// ICT RISK ASSESSMENTS (Articles 6-16)
// ============================================================================

router.get(
  '/risk-assessments',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.listICTRiskAssessments(
      user.organizationId,
      {
        status: req.query.status as doraService.ICTRiskStatus | undefined,
        assessmentType: req.query.assessmentType as doraService.ICTRiskAssessmentType | undefined,
        riskLevel: req.query.riskLevel as doraService.ICTRiskLevel | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      }
    );
    res.json(result);
  })
);

router.get(
  '/risk-assessments/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const assessment = await doraService.getICTRiskAssessment(
      user.organizationId,
      req.params.id
    );
    res.json(assessment);
  })
);

router.post(
  '/risk-assessments',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const assessment = await doraService.createICTRiskAssessment({
      organizationId: user.organizationId,
      ...req.body,
      assessedBy: user.id,
    });
    res.status(201).json(assessment);
  })
);

router.patch(
  '/risk-assessments/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const assessment = await doraService.updateICTRiskAssessment(
      user.organizationId,
      req.params.id,
      req.body
    );
    res.json(assessment);
  })
);

router.delete(
  '/risk-assessments/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.deleteICTRiskAssessment(
      user.organizationId,
      req.params.id
    );
    res.json(result);
  })
);

router.post(
  '/risk-assessments/:id/score',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.scoreICTRiskAssessment(
      user.organizationId,
      req.params.id
    );
    res.json(result);
  })
);

// ============================================================================
// ICT INCIDENTS (Articles 17-23)
// ============================================================================

router.get(
  '/incidents',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.listICTIncidents(user.organizationId, {
      status: req.query.status as doraService.ICTIncidentStatus | undefined,
      severity: req.query.severity as doraService.ICTIncidentSeverity | undefined,
      classification: req.query.classification as doraService.ICTIncidentClassification | undefined,
      incidentType: req.query.incidentType as doraService.ICTIncidentType | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json(result);
  })
);

router.get(
  '/incidents/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const incident = await doraService.getICTIncident(
      user.organizationId,
      req.params.id
    );
    res.json(incident);
  })
);

router.post(
  '/incidents',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const incident = await doraService.createICTIncident({
      organizationId: user.organizationId,
      ...req.body,
      reportedBy: user.id,
    });
    res.status(201).json(incident);
  })
);

router.patch(
  '/incidents/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const incident = await doraService.updateICTIncident(
      user.organizationId,
      req.params.id,
      req.body
    );
    res.json(incident);
  })
);

router.post(
  '/incidents/:id/escalate',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const incident = await doraService.escalateIncident(
      user.organizationId,
      req.params.id,
      {
        escalationLevel: req.body.escalationLevel,
        reason: req.body.reason,
        escalatedBy: user.id,
      }
    );
    res.json(incident);
  })
);

router.delete(
  '/incidents/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.deleteICTIncident(
      user.organizationId,
      req.params.id,
      user.id
    );
    res.json(result);
  })
);

// ============================================================================
// THIRD-PARTY ICT PROVIDERS (Articles 28-44)
// ============================================================================

router.get(
  '/third-party-providers',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.listThirdPartyProviders(
      user.organizationId,
      {
        criticality: req.query.criticality as doraService.ThirdPartyCriticality | undefined,
        providerType: req.query.providerType as doraService.ThirdPartyProviderType | undefined,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      }
    );
    res.json(result);
  })
);

router.get(
  '/third-party-providers/concentration-risk',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.assessConcentrationRisk(
      user.organizationId
    );
    res.json(result);
  })
);

router.get(
  '/third-party-providers/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const provider = await doraService.getThirdPartyProvider(
      user.organizationId,
      req.params.id
    );
    res.json(provider);
  })
);

router.post(
  '/third-party-providers',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const provider = await doraService.createThirdPartyProvider({
      organizationId: user.organizationId,
      ...req.body,
    });
    res.status(201).json(provider);
  })
);

router.patch(
  '/third-party-providers/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const provider = await doraService.updateThirdPartyProvider(
      user.organizationId,
      req.params.id,
      req.body
    );
    res.json(provider);
  })
);

router.delete(
  '/third-party-providers/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.deleteThirdPartyProvider(
      user.organizationId,
      req.params.id
    );
    res.json(result);
  })
);

// ============================================================================
// RESILIENCE TESTING (Articles 24-27)
// ============================================================================

router.get(
  '/resilience-tests',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.listResilienceTests(
      user.organizationId,
      {
        testType: req.query.testType as doraService.ResilienceTestType | undefined,
        status: req.query.status as doraService.ResilienceTestStatus | undefined,
        priority: req.query.priority as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      }
    );
    res.json(result);
  })
);

router.get(
  '/resilience-tests/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const test = await doraService.getResilienceTest(
      user.organizationId,
      req.params.id
    );
    res.json(test);
  })
);

router.post(
  '/resilience-tests',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const test = await doraService.createResilienceTest({
      organizationId: user.organizationId,
      ...req.body,
      conductedBy: req.body.conductedBy || user.id,
    });
    res.status(201).json(test);
  })
);

router.patch(
  '/resilience-tests/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const test = await doraService.updateResilienceTest(
      user.organizationId,
      req.params.id,
      req.body
    );
    res.json(test);
  })
);

router.delete(
  '/resilience-tests/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.deleteResilienceTest(
      user.organizationId,
      req.params.id
    );
    res.json(result);
  })
);

router.post(
  '/resilience-tests/:id/execute',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const test = await doraService.executeResilienceTest(
      user.organizationId,
      req.params.id,
      {
        executedBy: user.id,
        threatIntelligence: req.body.threatIntelligence,
        testScenarios: req.body.testScenarios,
      }
    );
    res.json(test);
  })
);

// ============================================================================
// INFORMATION REGISTER (Article 28(3))
// ============================================================================

router.get(
  '/information-register',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.listInformationRegister(
      user.organizationId,
      {
        assetType: req.query.assetType as doraService.AssetType | undefined,
        criticality: req.query.criticality as string,
        status: req.query.status as string,
        classification: req.query.classification as string,
        complianceStatus: req.query.complianceStatus as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      }
    );
    res.json(result);
  })
);

router.get(
  '/information-register/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const entry = await doraService.getInformationRegisterEntry(
      user.organizationId,
      req.params.id
    );
    res.json(entry);
  })
);

router.post(
  '/information-register',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const entry = await doraService.createInformationRegisterEntry({
      organizationId: user.organizationId,
      ...req.body,
    });
    res.status(201).json(entry);
  })
);

router.patch(
  '/information-register/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const entry = await doraService.updateInformationRegisterEntry(
      user.organizationId,
      req.params.id,
      req.body
    );
    res.json(entry);
  })
);

router.delete(
  '/information-register/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await doraService.deleteInformationRegisterEntry(
      user.organizationId,
      req.params.id
    );
    res.json(result);
  })
);

export default router;
