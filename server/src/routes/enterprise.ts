import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { enforceLimit } from '../middleware/tierMiddleware';
import { authAsyncHandler, asyncHandler, AuthenticatedRequest } from '../types/express';

// Import all enterprise services
import riskManagementService from '../services/riskManagementService';
import questionnaireService from '../services/questionnaireService';
import policyLibraryService from '../services/policyLibraryService';
import trustCenterService from '../services/trustCenterService';
import multiWorkspaceService from '../services/multiWorkspaceService';
import reportingService from '../services/reportingService';
import monitoringService from '../services/monitoringService';
import issueManagementService from '../services/issueManagementService';
import visionaryAIService from '../services/visionaryAIService';

const router = Router();

/**
 * ═══════════════════════════════════════════════════════════════
 * RISK MANAGEMENT ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const riskRouter = Router();
riskRouter.use(authenticate);

riskRouter.post(
  '/assessments',
  enforceLimit('maxRiskAssessments'),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const assessment = await riskManagementService.createRiskAssessment({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(assessment);
  })
);

riskRouter.get(
  '/register',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const risks = await riskManagementService.getRiskRegister(
      req.user.organizationId,
      req.query as any
    );
    res.json(risks);
  })
);

riskRouter.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const dashboard = await riskManagementService.getRiskDashboard(
      req.user.organizationId
    );
    res.json(dashboard);
  })
);

riskRouter.get(
  '/heatmap',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const heatmap = await riskManagementService.getRiskHeatMap(
      req.user.organizationId
    );
    res.json(heatmap);
  })
);

/**
 * ═══════════════════════════════════════════════════════════════
 * QUESTIONNAIRE AUTOMATION ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const questionnaireRouter = Router();
questionnaireRouter.use(authenticate);

questionnaireRouter.post(
  '/',
  enforceLimit('maxQuestionnairesPerMonth'),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const questionnaire = await questionnaireService.createQuestionnaire({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(questionnaire);
  })
);

questionnaireRouter.post(
  '/:id/ai-generate',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await questionnaireService.generateAIResponses(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(result);
  })
);

questionnaireRouter.post(
  '/:id/complete',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const questionnaire = await questionnaireService.completeQuestionnaire(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(questionnaire);
  })
);

questionnaireRouter.get(
  '/',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const questionnaires = await questionnaireService.getQuestionnairesByOrganization(
      req.user.organizationId,
      req.query as any
    );
    res.json(questionnaires);
  })
);

questionnaireRouter.get(
  '/metrics',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const metrics = await questionnaireService.getQuestionnaireMetrics(
      req.user.organizationId
    );
    res.json(metrics);
  })
);

/**
 * ═══════════════════════════════════════════════════════════════
 * POLICY LIBRARY ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const policyRouter = Router();
policyRouter.use(authenticate);

policyRouter.post(
  '/',
  enforceLimit('maxPolicies'),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policy = await policyLibraryService.createPolicy({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(policy);
  })
);

policyRouter.post(
  '/bulk-import',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policies = await policyLibraryService.bulkImportPolicies(
      req.user.organizationId,
      req.body.policies,
      req.user.id
    );
    res.json(policies);
  })
);

policyRouter.get(
  '/templates',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const templates = await policyLibraryService.getPolicyTemplates(
      req.query.category as string
    );
    res.json(templates);
  })
);

// Get policy metrics (before /:id to avoid matching "metrics" as ID)
policyRouter.get(
  '/metrics',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const metrics = await policyLibraryService.getPolicyMetrics(
      req.user.organizationId
    );
    res.json(metrics);
  })
);

policyRouter.get(
  '/',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policies = await policyLibraryService.getPoliciesByOrganization(
      req.user.organizationId,
      req.query as any
    );
    res.json(policies);
  })
);

// Get single policy
policyRouter.get(
  '/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policy = await policyLibraryService.getPolicyById(
      req.params.id,
      req.user.organizationId
    );
    res.json(policy);
  })
);

// Update policy
policyRouter.put(
  '/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policy = await policyLibraryService.updatePolicy(
      req.params.id,
      req.body,
      req.user.id,
      req.user.organizationId
    );
    res.json(policy);
  })
);

// Archive policy
policyRouter.delete(
  '/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policy = await policyLibraryService.archivePolicy(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(policy);
  })
);

// Approve policy
policyRouter.post(
  '/:id/approve',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policy = await policyLibraryService.approvePolicy(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(policy);
  })
);

// Submit policy for review
policyRouter.post(
  '/:id/submit-review',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policy = await policyLibraryService.submitForReview(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(policy);
  })
);

// Duplicate policy
policyRouter.post(
  '/:id/duplicate',
  enforceLimit('maxPolicies'),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policy = await policyLibraryService.duplicatePolicy(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.status(201).json(policy);
  })
);

/**
 * ═══════════════════════════════════════════════════════════════
 * TRUST CENTER ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const trustCenterRouter = Router();

// Public route - no auth required
trustCenterRouter.get(
  '/public/:organizationId',
  asyncHandler(async (req: Request, res: Response) => {
    const trustCenter = await trustCenterService.getPublicTrustCenter(
      req.params.organizationId
    );
    res.json(trustCenter);
  })
);

// Protected routes
trustCenterRouter.use(authenticate);

trustCenterRouter.post(
  '/certificates',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const certificate = await trustCenterService.createCertificate({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(certificate);
  })
);

trustCenterRouter.post(
  '/generate-certificate',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const certificate = await trustCenterService.generateComplianceCertificate(
      req.user.organizationId,
      req.body.frameworkId,
      req.user.id
    );
    res.json(certificate);
  })
);

/**
 * ═══════════════════════════════════════════════════════════════
 * MULTI-WORKSPACE ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const workspaceRouter = Router();
workspaceRouter.use(authenticate);

workspaceRouter.post(
  '/child-organizations',
  enforceLimit('maxWorkspaces'),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const child = await multiWorkspaceService.createChildOrganization(
      req.user.organizationId,
      req.body,
      req.user.id
    );
    res.status(201).json(child);
  })
);

workspaceRouter.get(
  '/hierarchy',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const hierarchy = await multiWorkspaceService.getOrganizationHierarchy(
      req.user.organizationId
    );
    res.json(hierarchy);
  })
);

workspaceRouter.get(
  '/consolidated-metrics',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const metrics = await multiWorkspaceService.getConsolidatedMetrics(
      req.user.organizationId
    );
    res.json(metrics);
  })
);

/**
 * ═══════════════════════════════════════════════════════════════
 * REPORTING ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const reportRouter = Router();
reportRouter.use(authenticate);

reportRouter.post(
  '/',
  enforceLimit('maxCustomReports'),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const report = await reportingService.createReport({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(report);
  })
);

reportRouter.get(
  '/compliance',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const report = await reportingService.generateComplianceReport(
      req.user.organizationId,
      req.query.frameworkId as string
    );
    res.json(report);
  })
);

reportRouter.get(
  '/risk',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const report = await reportingService.generateRiskReport(
      req.user.organizationId
    );
    res.json(report);
  })
);

reportRouter.get(
  '/vendor-risk',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const report = await reportingService.generateVendorRiskReport(
      req.user.organizationId
    );
    res.json(report);
  })
);

reportRouter.get(
  '/executive-summary',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const report = await reportingService.generateExecutiveSummary(
      req.user.organizationId
    );
    res.json(report);
  })
);

/**
 * ═══════════════════════════════════════════════════════════════
 * MONITORING ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const monitorRouter = Router();
monitorRouter.use(authenticate);

monitorRouter.post(
  '/',
  enforceLimit('maxMonitors'),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const monitor = await monitoringService.createMonitor({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(monitor);
  })
);

monitorRouter.post(
  '/:id/execute',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await monitoringService.executeMonitor(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(result);
  })
);

monitorRouter.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const dashboard = await monitoringService.getMonitoringDashboard(
      req.user.organizationId
    );
    res.json(dashboard);
  })
);

monitorRouter.get(
  '/',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const monitors = await monitoringService.getMonitorsByOrganization(
      req.user.organizationId,
      req.query as any
    );
    res.json(monitors);
  })
);

// Get single monitor
monitorRouter.get(
  '/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const monitor = await monitoringService.getMonitorById(
      req.params.id,
      req.user.organizationId
    );
    res.json(monitor);
  })
);

// Update monitor
monitorRouter.patch(
  '/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const monitor = await monitoringService.updateMonitor(
      req.params.id,
      req.body,
      req.user.id,
      req.user.organizationId
    );
    res.json(monitor);
  })
);

// Delete monitor
monitorRouter.delete(
  '/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await monitoringService.deleteMonitor(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(result);
  })
);

// Get monitor results
monitorRouter.get(
  '/:id/results',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const results = await monitoringService.getMonitorResults(
      req.params.id,
      Number(req.query.limit) || 30
    );
    res.json(results);
  })
);

// Toggle monitor active status
monitorRouter.patch(
  '/:id/toggle',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const monitor = await monitoringService.toggleMonitorActive(
      req.params.id,
      req.body.active,
      req.user.id,
      req.user.organizationId
    );
    res.json(monitor);
  })
);

// AI: Suggest monitors
monitorRouter.post(
  '/ai-suggest',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const suggestions = await monitoringService.suggestMonitors(
      req.user.organizationId,
      req.user.id
    );
    res.json(suggestions);
  })
);

// AI: Analyze monitor trends
monitorRouter.post(
  '/:id/ai-analyze',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const analysis = await monitoringService.analyzeMonitorTrends(
      req.params.id,
      req.user.id,
      req.user.organizationId
    );
    res.json(analysis);
  })
);

// AI: Triage alerts
monitorRouter.post(
  '/ai-triage',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const triage = await monitoringService.triageAlerts(
      req.user.organizationId,
      req.user.id
    );
    res.json(triage);
  })
);

/**
 * ═══════════════════════════════════════════════════════════════
 * ISSUE MANAGEMENT ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const issueRouter = Router();
issueRouter.use(authenticate);

issueRouter.post(
  '/',
  enforceLimit('maxIssues'),
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const issue = await issueManagementService.createIssue({
      ...req.body,
      createdById: req.user.id,
    });
    res.status(201).json(issue);
  })
);

issueRouter.post(
  '/:id/assign',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const issue = await issueManagementService.assignIssue(
      req.params.id,
      req.body.assignedToId,
      req.user.id,
      req.user.organizationId
    );
    res.json(issue);
  })
);

issueRouter.post(
  '/:id/comments',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const comment = await issueManagementService.addComment(
      req.params.id,
      {
        ...req.body,
        userId: req.user.id,
      },
      req.user.organizationId
    );
    res.json(comment);
  })
);

issueRouter.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const dashboard = await issueManagementService.getIssueDashboard(
      req.user.organizationId
    );
    res.json(dashboard);
  })
);

issueRouter.get(
  '/',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const issues = await issueManagementService.getIssuesByOrganization(
      req.user.organizationId,
      req.query as any
    );
    res.json(issues);
  })
);

/**
 * ═══════════════════════════════════════════════════════════════
 * VISIONARY AI ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const aiRouter = Router();
aiRouter.use(authenticate);

// Feature 1: AI Compliance Co-Pilot
aiRouter.get(
  '/copilot/recommendations',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const recommendations = await visionaryAIService.getComplianceCoPilotRecommendations(
      req.user.organizationId,
      req.user.id
    );
    res.json(recommendations);
  })
);

// Feature 2: Predictive Risk Intelligence
aiRouter.post(
  '/predict-risks',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const predictions = await visionaryAIService.predictFutureRisks(
      req.user.organizationId,
      req.body.timeHorizonDays || 90,
      req.user.id
    );
    res.json(predictions);
  })
);

// Feature 3: Automated Policy Generation
aiRouter.post(
  '/generate-policy',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const policy = await visionaryAIService.generatePolicyFromNaturalLanguage(
      req.user.organizationId,
      req.body,
      req.user.id
    );
    res.json(policy);
  })
);

// Feature 4: Intelligent Compliance Autopilot
aiRouter.post(
  '/autopilot/run',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await visionaryAIService.runComplianceAutopilot(
      req.user.organizationId,
      req.body.options || {},
      req.user.id
    );
    res.json(result);
  })
);

// Feature 5: Cross-Organization Benchmarking
aiRouter.get(
  '/benchmarking',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const benchmarking = await visionaryAIService.getComplianceBenchmarking(
      req.user.organizationId,
      req.query.industry as string || 'Technology',
      req.user.id
    );
    res.json(benchmarking);
  })
);

// Export all routers
router.use('/risk-management', riskRouter);
router.use('/questionnaires', questionnaireRouter);
router.use('/policies', policyRouter);
router.use('/trust-center', trustCenterRouter);
router.use('/workspace', workspaceRouter);
router.use('/reports', reportRouter);
router.use('/monitoring', monitorRouter);
router.use('/issues', issueRouter);
router.use('/visionary-ai', aiRouter);

export default router;
