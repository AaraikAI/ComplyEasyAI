import { Router } from 'express';
import { authenticate } from '../middleware/auth';

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

riskRouter.post('/assessments', async (req, res) => {
  try {
    const assessment = await riskManagementService.createRiskAssessment({
      ...req.body,
      userId: (req as any).user.id,
    });
    res.status(201).json(assessment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

riskRouter.get('/register', async (req, res) => {
  try {
    const risks = await riskManagementService.getRiskRegister(
      (req as any).user.organizationId,
      req.query as any
    );
    res.json(risks);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

riskRouter.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await riskManagementService.getRiskDashboard(
      (req as any).user.organizationId
    );
    res.json(dashboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

riskRouter.get('/heatmap', async (req, res) => {
  try {
    const heatmap = await riskManagementService.getRiskHeatMap(
      (req as any).user.organizationId
    );
    res.json(heatmap);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * QUESTIONNAIRE AUTOMATION ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const questionnaireRouter = Router();
questionnaireRouter.use(authenticate);

questionnaireRouter.post('/', async (req, res) => {
  try {
    const questionnaire = await questionnaireService.createQuestionnaire({
      ...req.body,
      userId: (req as any).user.id,
    });
    res.status(201).json(questionnaire);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

questionnaireRouter.post('/:id/ai-generate', async (req, res) => {
  try {
    const result = await questionnaireService.generateAIResponses(
      req.params.id,
      (req as any).user.id,
      (req as any).user.organizationId
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

questionnaireRouter.post('/:id/complete', async (req, res) => {
  try {
    const questionnaire = await questionnaireService.completeQuestionnaire(
      req.params.id,
      (req as any).user.id,
      (req as any).user.organizationId
    );
    res.json(questionnaire);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

questionnaireRouter.get('/', async (req, res) => {
  try {
    const questionnaires = await questionnaireService.getQuestionnairesByOrganization(
      (req as any).user.organizationId,
      req.query as any
    );
    res.json(questionnaires);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

questionnaireRouter.get('/metrics', async (req, res) => {
  try {
    const metrics = await questionnaireService.getQuestionnaireMetrics(
      (req as any).user.organizationId
    );
    res.json(metrics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * POLICY LIBRARY ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const policyRouter = Router();
policyRouter.use(authenticate);

policyRouter.post('/', async (req, res) => {
  try {
    const policy = await policyLibraryService.createPolicy({
      ...req.body,
      userId: (req as any).user.id,
    });
    res.status(201).json(policy);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

policyRouter.post('/bulk-import', async (req, res) => {
  try {
    const policies = await policyLibraryService.bulkImportPolicies(
      (req as any).user.organizationId,
      req.body.policies,
      (req as any).user.id
    );
    res.json(policies);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

policyRouter.get('/templates', async (req, res) => {
  try {
    const templates = await policyLibraryService.getPolicyTemplates(
      req.query.category as string
    );
    res.json(templates);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

policyRouter.get('/', async (req, res) => {
  try {
    const policies = await policyLibraryService.getPoliciesByOrganization(
      (req as any).user.organizationId,
      req.query as any
    );
    res.json(policies);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * TRUST CENTER ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const trustCenterRouter = Router();

// Public route - no auth required
trustCenterRouter.get('/public/:organizationId', async (req, res) => {
  try {
    const trustCenter = await trustCenterService.getPublicTrustCenter(
      req.params.organizationId
    );
    res.json(trustCenter);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Protected routes
trustCenterRouter.use(authenticate);

trustCenterRouter.post('/certificates', async (req, res) => {
  try {
    const certificate = await trustCenterService.createCertificate({
      ...req.body,
      userId: (req as any).user.id,
    });
    res.status(201).json(certificate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

trustCenterRouter.post('/generate-certificate', async (req, res) => {
  try {
    const certificate = await trustCenterService.generateComplianceCertificate(
      (req as any).user.organizationId,
      req.body.frameworkId,
      (req as any).user.id
    );
    res.json(certificate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * MULTI-WORKSPACE ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const workspaceRouter = Router();
workspaceRouter.use(authenticate);

workspaceRouter.post('/child-organizations', async (req, res) => {
  try {
    const child = await multiWorkspaceService.createChildOrganization(
      (req as any).user.organizationId,
      req.body,
      (req as any).user.id
    );
    res.status(201).json(child);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

workspaceRouter.get('/hierarchy', async (req, res) => {
  try {
    const hierarchy = await multiWorkspaceService.getOrganizationHierarchy(
      (req as any).user.organizationId
    );
    res.json(hierarchy);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

workspaceRouter.get('/consolidated-metrics', async (req, res) => {
  try {
    const metrics = await multiWorkspaceService.getConsolidatedMetrics(
      (req as any).user.organizationId
    );
    res.json(metrics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * REPORTING ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const reportRouter = Router();
reportRouter.use(authenticate);

reportRouter.post('/', async (req, res) => {
  try {
    const report = await reportingService.createReport({
      ...req.body,
      userId: (req as any).user.id,
    });
    res.status(201).json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

reportRouter.get('/compliance', async (req, res) => {
  try {
    const report = await reportingService.generateComplianceReport(
      (req as any).user.organizationId,
      req.query.frameworkId as string
    );
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

reportRouter.get('/risk', async (req, res) => {
  try {
    const report = await reportingService.generateRiskReport(
      (req as any).user.organizationId
    );
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

reportRouter.get('/vendor-risk', async (req, res) => {
  try {
    const report = await reportingService.generateVendorRiskReport(
      (req as any).user.organizationId
    );
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

reportRouter.get('/executive-summary', async (req, res) => {
  try {
    const report = await reportingService.generateExecutiveSummary(
      (req as any).user.organizationId
    );
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * MONITORING ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const monitorRouter = Router();
monitorRouter.use(authenticate);

monitorRouter.post('/', async (req, res) => {
  try {
    const monitor = await monitoringService.createMonitor({
      ...req.body,
      userId: (req as any).user.id,
    });
    res.status(201).json(monitor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

monitorRouter.post('/:id/execute', async (req, res) => {
  try {
    const result = await monitoringService.executeMonitor(
      req.params.id,
      (req as any).user.id,
      (req as any).user.organizationId
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

monitorRouter.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await monitoringService.getMonitoringDashboard(
      (req as any).user.organizationId
    );
    res.json(dashboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

monitorRouter.get('/', async (req, res) => {
  try {
    const monitors = await monitoringService.getMonitorsByOrganization(
      (req as any).user.organizationId,
      req.query as any
    );
    res.json(monitors);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * ISSUE MANAGEMENT ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const issueRouter = Router();
issueRouter.use(authenticate);

issueRouter.post('/', async (req, res) => {
  try {
    const issue = await issueManagementService.createIssue({
      ...req.body,
      createdById: (req as any).user.id,
    });
    res.status(201).json(issue);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

issueRouter.post('/:id/assign', async (req, res) => {
  try {
    const issue = await issueManagementService.assignIssue(
      req.params.id,
      req.body.assignedToId,
      (req as any).user.id,
      (req as any).user.organizationId
    );
    res.json(issue);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

issueRouter.post('/:id/comments', async (req, res) => {
  try {
    const comment = await issueManagementService.addComment(
      req.params.id,
      {
        ...req.body,
        userId: (req as any).user.id,
      },
      (req as any).user.organizationId
    );
    res.json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

issueRouter.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await issueManagementService.getIssueDashboard(
      (req as any).user.organizationId
    );
    res.json(dashboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

issueRouter.get('/', async (req, res) => {
  try {
    const issues = await issueManagementService.getIssuesByOrganization(
      (req as any).user.organizationId,
      req.query as any
    );
    res.json(issues);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * VISIONARY AI ROUTES
 * ═══════════════════════════════════════════════════════════════
 */
const aiRouter = Router();
aiRouter.use(authenticate);

// Feature 1: AI Compliance Co-Pilot
aiRouter.get('/copilot/recommendations', async (req, res) => {
  try {
    const recommendations = await visionaryAIService.getComplianceCoPilotRecommendations(
      (req as any).user.organizationId,
      (req as any).user.id
    );
    res.json(recommendations);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Feature 2: Predictive Risk Intelligence
aiRouter.post('/predict-risks', async (req, res) => {
  try {
    const predictions = await visionaryAIService.predictFutureRisks(
      (req as any).user.organizationId,
      req.body.timeHorizonDays || 90,
      (req as any).user.id
    );
    res.json(predictions);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Feature 3: Automated Policy Generation
aiRouter.post('/generate-policy', async (req, res) => {
  try {
    const policy = await visionaryAIService.generatePolicyFromNaturalLanguage(
      (req as any).user.organizationId,
      req.body,
      (req as any).user.id
    );
    res.json(policy);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Feature 4: Intelligent Compliance Autopilot
aiRouter.post('/autopilot/run', async (req, res) => {
  try {
    const result = await visionaryAIService.runComplianceAutopilot(
      (req as any).user.organizationId,
      req.body.options || {},
      (req as any).user.id
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Feature 5: Cross-Organization Benchmarking
aiRouter.get('/benchmarking', async (req, res) => {
  try {
    const benchmarking = await visionaryAIService.getComplianceBenchmarking(
      (req as any).user.organizationId,
      req.query.industry as string || 'Technology',
      (req as any).user.id
    );
    res.json(benchmarking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

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
