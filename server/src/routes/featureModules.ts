/**
 * Feature Modules Routes
 * Routes for all feature module CRUD operations
 *
 * Tier Gating:
 * - Governance Manager, Breach Management: Essentials+ (governanceManager, breachManagement)
 * - ESG, SBOM, Process Mapper, Product Lifecycle: Growth+ (esgReporting, sbomManager, processMapper, productLifecycle)
 * - CE Marking, DPP, Surveillance, Decommission, Environmental: Visionary (ceMarking, digitalProductPassport, etc.)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { requireFeature } from '../middleware/tierMiddleware';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import {
  createGovernanceBodySchema,
  updateGovernanceBodySchema,
  createMeetingSchema,
  updateMeetingSchema,
  createDecisionSchema,
  updateDecisionSchema,
  createEscalationPathSchema,
  updateEscalationPathSchema,
  upsertDPOProfileSchema,
  createBreachIncidentSchema,
  updateBreachIncidentSchema,
  createBreachNotificationSchema,
  updateBreachNotificationSchema,
  createBreachTemplateSchema,
  updateBreachTemplateSchema,
  createRegulatoryContactSchema,
  updateRegulatoryContactSchema,
  createCEProductSchema,
  updateCEProductSchema,
  createDPPSchema,
  updateDPPSchema,
  createESGMetricSchema,
  updateESGMetricSchema,
  createMaterialityAssessmentSchema,
  updateMaterialityAssessmentSchema,
  createSBOMEntrySchema,
  bulkCreateSBOMEntriesSchema,
  updateSBOMEntrySchema,
  createSBOMRepositorySchema,
  updateSBOMRepositorySchema,
  createSurveillancePlanSchema,
  updateSurveillancePlanSchema,
  createSurveillanceIncidentSchema,
  updateSurveillanceIncidentSchema,
  createProductRecallSchema,
  updateProductRecallSchema,
  createProductDecommissionSchema,
  updateProductDecommissionSchema,
  createLifecycleAssessmentSchema,
  updateLifecycleAssessmentSchema,
  createProductLifecycleSchema,
  updateProductLifecycleSchema,
  createProcessMapSchema,
  updateProcessMapSchema,
  syncSBOMSchema,
  syncBreachSchema,
  upsertRegulationModuleDataSchema,
  recordMetricSchema,
} from '../validators/featureModulesSchemas';
import * as fm from '../controllers/featureModulesController';

const router = Router();

router.use(authenticate);

// ============================================================================
// GOVERNANCE MANAGER (Essentials+)
// ============================================================================
router.get('/governance/bodies', requireFeature('governanceManager'), asyncHandler(fm.listGovernanceBodies));
router.post('/governance/bodies', requireFeature('governanceManager'), authorize('admin', 'editor'), validateBody(createGovernanceBodySchema), asyncHandler(fm.createGovernanceBody));
router.patch('/governance/bodies/:id', requireFeature('governanceManager'), authorize('admin', 'editor'), validateBody(updateGovernanceBodySchema), asyncHandler(fm.updateGovernanceBody));
router.delete('/governance/bodies/:id', requireFeature('governanceManager'), authorize('admin'), asyncHandler(fm.deleteGovernanceBody));

router.post('/governance/meetings', requireFeature('governanceManager'), authorize('admin', 'editor'), validateBody(createMeetingSchema), asyncHandler(fm.createMeeting));
router.patch('/governance/meetings/:id', requireFeature('governanceManager'), authorize('admin', 'editor'), validateBody(updateMeetingSchema), asyncHandler(fm.updateMeeting));
router.delete('/governance/meetings/:id', requireFeature('governanceManager'), authorize('admin'), asyncHandler(fm.deleteMeeting));

router.post('/governance/decisions', requireFeature('governanceManager'), authorize('admin', 'editor'), validateBody(createDecisionSchema), asyncHandler(fm.createDecision));
router.patch('/governance/decisions/:id', requireFeature('governanceManager'), authorize('admin', 'editor'), validateBody(updateDecisionSchema), asyncHandler(fm.updateDecision));

router.post('/governance/escalation-paths', requireFeature('governanceManager'), authorize('admin', 'editor'), validateBody(createEscalationPathSchema), asyncHandler(fm.createEscalationPath));
router.patch('/governance/escalation-paths/:id', requireFeature('governanceManager'), authorize('admin', 'editor'), validateBody(updateEscalationPathSchema), asyncHandler(fm.updateEscalationPath));
router.delete('/governance/escalation-paths/:id', requireFeature('governanceManager'), authorize('admin'), asyncHandler(fm.deleteEscalationPath));

router.get('/governance/dpo', requireFeature('governanceManager'), asyncHandler(fm.getDPOProfile));
router.put('/governance/dpo', requireFeature('governanceManager'), authorize('admin', 'editor'), validateBody(upsertDPOProfileSchema), asyncHandler(fm.upsertDPOProfile));

// ============================================================================
// BREACH NOTIFICATION (Essentials+)
// ============================================================================
router.get('/breach/incidents', requireFeature('breachManagement'), asyncHandler(fm.listBreachIncidents));
router.post('/breach/incidents', requireFeature('breachManagement'), authorize('admin', 'editor'), validateBody(createBreachIncidentSchema), asyncHandler(fm.createBreachIncident));
router.get('/breach/incidents/:id', requireFeature('breachManagement'), asyncHandler(fm.getBreachIncident));
router.patch('/breach/incidents/:id', requireFeature('breachManagement'), authorize('admin', 'editor'), validateBody(updateBreachIncidentSchema), asyncHandler(fm.updateBreachIncident));
router.delete('/breach/incidents/:id', requireFeature('breachManagement'), authorize('admin'), asyncHandler(fm.deleteBreachIncident));

router.post('/breach/notifications', requireFeature('breachManagement'), authorize('admin', 'editor'), validateBody(createBreachNotificationSchema), asyncHandler(fm.createBreachNotification));
router.patch('/breach/notifications/:id', requireFeature('breachManagement'), authorize('admin', 'editor'), validateBody(updateBreachNotificationSchema), asyncHandler(fm.updateBreachNotification));

router.get('/breach/templates', requireFeature('breachManagement'), asyncHandler(fm.listBreachTemplates));
router.post('/breach/templates', requireFeature('breachManagement'), authorize('admin', 'editor'), validateBody(createBreachTemplateSchema), asyncHandler(fm.createBreachTemplate));
router.patch('/breach/templates/:id', requireFeature('breachManagement'), authorize('admin', 'editor'), validateBody(updateBreachTemplateSchema), asyncHandler(fm.updateBreachTemplate));
router.delete('/breach/templates/:id', requireFeature('breachManagement'), authorize('admin'), asyncHandler(fm.deleteBreachTemplate));

router.get('/breach/contacts', requireFeature('breachManagement'), asyncHandler(fm.listRegulatoryContacts));
router.post('/breach/contacts', requireFeature('breachManagement'), authorize('admin', 'editor'), validateBody(createRegulatoryContactSchema), asyncHandler(fm.createRegulatoryContact));
router.patch('/breach/contacts/:id', requireFeature('breachManagement'), authorize('admin', 'editor'), validateBody(updateRegulatoryContactSchema), asyncHandler(fm.updateRegulatoryContact));
router.delete('/breach/contacts/:id', requireFeature('breachManagement'), authorize('admin'), asyncHandler(fm.deleteRegulatoryContact));

// ============================================================================
// CE MARKING WORKFLOW (Visionary)
// ============================================================================
router.get('/ce-marking/products', requireFeature('ceMarking'), asyncHandler(fm.listCEProducts));
router.post('/ce-marking/products', requireFeature('ceMarking'), authorize('admin', 'editor'), validateBody(createCEProductSchema), asyncHandler(fm.createCEProduct));
router.get('/ce-marking/products/:id', requireFeature('ceMarking'), asyncHandler(fm.getCEProduct));
router.patch('/ce-marking/products/:id', requireFeature('ceMarking'), authorize('admin', 'editor'), validateBody(updateCEProductSchema), asyncHandler(fm.updateCEProduct));
router.delete('/ce-marking/products/:id', requireFeature('ceMarking'), authorize('admin'), asyncHandler(fm.deleteCEProduct));
router.get('/ce-marking/notified-bodies', requireFeature('ceMarking'), asyncHandler(fm.listCENotifiedBodies));
router.get('/ce-marking/requirements', requireFeature('ceMarking'), asyncHandler(fm.listCERequirements));
router.get('/ce-marking/documents', requireFeature('ceMarking'), asyncHandler(fm.listCEDocuments));
router.get('/ce-marking/risk-items', requireFeature('ceMarking'), asyncHandler(fm.listCERiskItems));
router.get('/ce-marking/surveillance-checks', requireFeature('ceMarking'), asyncHandler(fm.listCESurveillanceChecks));

// ============================================================================
// DIGITAL PRODUCT PASSPORT (Visionary)
// ============================================================================
router.get('/dpp/passports', requireFeature('digitalProductPassport'), asyncHandler(fm.listDPPs));
router.post('/dpp/passports', requireFeature('digitalProductPassport'), authorize('admin', 'editor'), validateBody(createDPPSchema), asyncHandler(fm.createDPP));
router.get('/dpp/passports/:id', requireFeature('digitalProductPassport'), asyncHandler(fm.getDPP));
router.patch('/dpp/passports/:id', requireFeature('digitalProductPassport'), authorize('admin', 'editor'), validateBody(updateDPPSchema), asyncHandler(fm.updateDPP));
router.delete('/dpp/passports/:id', requireFeature('digitalProductPassport'), authorize('admin'), asyncHandler(fm.deleteDPP));

router.get('/dpp/passports/:id/materials', requireFeature('digitalProductPassport'), asyncHandler(fm.getDPPMaterials));
router.get('/dpp/passports/:id/carbon', requireFeature('digitalProductPassport'), asyncHandler(fm.getDPPCarbon));
router.get('/dpp/passports/:id/supply-chain', requireFeature('digitalProductPassport'), asyncHandler(fm.getDPPSupplyChain));
router.get('/dpp/passports/:id/sustainability', requireFeature('digitalProductPassport'), asyncHandler(fm.getDPPSustainability));
router.get('/dpp/passports/:id/certifications', requireFeature('digitalProductPassport'), asyncHandler(fm.getDPPCertifications));

// ============================================================================
// ESG REPORTING (Growth+)
// ============================================================================
router.get('/esg/metrics', requireFeature('esgReporting'), asyncHandler(fm.listESGMetrics));
router.post('/esg/metrics', requireFeature('esgReporting'), authorize('admin', 'editor'), validateBody(createESGMetricSchema), asyncHandler(fm.createESGMetric));
router.get('/esg/metrics/:id', requireFeature('esgReporting'), asyncHandler(fm.getESGMetric));
router.patch('/esg/metrics/:id', requireFeature('esgReporting'), authorize('admin', 'editor'), validateBody(updateESGMetricSchema), asyncHandler(fm.updateESGMetric));
router.delete('/esg/metrics/:id', requireFeature('esgReporting'), authorize('admin'), asyncHandler(fm.deleteESGMetric));

router.get('/esg/materiality', requireFeature('esgReporting'), asyncHandler(fm.listMaterialityAssessments));
router.post('/esg/materiality', requireFeature('esgReporting'), authorize('admin', 'editor'), validateBody(createMaterialityAssessmentSchema), asyncHandler(fm.createMaterialityAssessment));
router.get('/esg/materiality/:id', requireFeature('esgReporting'), asyncHandler(fm.getMaterialityAssessment));
router.patch('/esg/materiality/:id', requireFeature('esgReporting'), authorize('admin', 'editor'), validateBody(updateMaterialityAssessmentSchema), asyncHandler(fm.updateMaterialityAssessment));
router.delete('/esg/materiality/:id', requireFeature('esgReporting'), authorize('admin'), asyncHandler(fm.deleteMaterialityAssessment));

router.post('/esg/reports', requireFeature('esgReporting'), authorize('admin', 'editor'), asyncHandler(fm.generateESGReport));
router.get('/esg/reports', requireFeature('esgReporting'), asyncHandler(fm.listESGReports));

// ============================================================================
// SBOM MANAGER (Growth+)
// ============================================================================
router.get('/sbom/entries', requireFeature('sbomManager'), asyncHandler(fm.listSBOMEntries));
router.post('/sbom/entries', requireFeature('sbomManager'), authorize('admin', 'editor'), validateBody(createSBOMEntrySchema), asyncHandler(fm.createSBOMEntry));
router.post('/sbom/entries/bulk', requireFeature('sbomManager'), authorize('admin', 'editor'), validateBody(bulkCreateSBOMEntriesSchema), asyncHandler(fm.bulkCreateSBOMEntries));
router.patch('/sbom/entries/:id', requireFeature('sbomManager'), authorize('admin', 'editor'), validateBody(updateSBOMEntrySchema), asyncHandler(fm.updateSBOMEntry));
router.delete('/sbom/entries/:id', requireFeature('sbomManager'), authorize('admin'), asyncHandler(fm.deleteSBOMEntry));

router.get('/sbom/repositories', requireFeature('sbomManager'), asyncHandler(fm.listSBOMRepositories));
router.post('/sbom/repositories', requireFeature('sbomManager'), authorize('admin', 'editor'), validateBody(createSBOMRepositorySchema), asyncHandler(fm.createSBOMRepository));
router.patch('/sbom/repositories/:id', requireFeature('sbomManager'), authorize('admin', 'editor'), validateBody(updateSBOMRepositorySchema), asyncHandler(fm.updateSBOMRepository));
router.delete('/sbom/repositories/:id', requireFeature('sbomManager'), authorize('admin'), asyncHandler(fm.deleteSBOMRepository));

router.get('/sbom/licenses', requireFeature('sbomManager'), asyncHandler(fm.listSBOMLicenses));

// ============================================================================
// POST-MARKET SURVEILLANCE (Visionary)
// ============================================================================
router.get('/surveillance/plans', requireFeature('postMarketSurveillance'), asyncHandler(fm.listSurveillancePlans));
router.post('/surveillance/plans', requireFeature('postMarketSurveillance'), authorize('admin', 'editor'), validateBody(createSurveillancePlanSchema), asyncHandler(fm.createSurveillancePlan));
router.patch('/surveillance/plans/:id', requireFeature('postMarketSurveillance'), authorize('admin', 'editor'), validateBody(updateSurveillancePlanSchema), asyncHandler(fm.updateSurveillancePlan));
router.delete('/surveillance/plans/:id', requireFeature('postMarketSurveillance'), authorize('admin'), asyncHandler(fm.deleteSurveillancePlan));

router.post('/surveillance/incidents', requireFeature('postMarketSurveillance'), authorize('admin', 'editor'), validateBody(createSurveillanceIncidentSchema), asyncHandler(fm.createSurveillanceIncident));
router.patch('/surveillance/incidents/:id', requireFeature('postMarketSurveillance'), authorize('admin', 'editor'), validateBody(updateSurveillanceIncidentSchema), asyncHandler(fm.updateSurveillanceIncident));

router.get('/surveillance/recalls', requireFeature('postMarketSurveillance'), asyncHandler(fm.listProductRecalls));
router.post('/surveillance/recalls', requireFeature('postMarketSurveillance'), authorize('admin', 'editor'), validateBody(createProductRecallSchema), asyncHandler(fm.createProductRecall));
router.patch('/surveillance/recalls/:id', requireFeature('postMarketSurveillance'), authorize('admin', 'editor'), validateBody(updateProductRecallSchema), asyncHandler(fm.updateProductRecall));

// ============================================================================
// PRODUCT DECOMMISSIONING (Visionary)
// ============================================================================
router.get('/decommission/products', requireFeature('productDecommissioning'), asyncHandler(fm.listProductDecommissions));
router.post('/decommission/products', requireFeature('productDecommissioning'), authorize('admin', 'editor'), validateBody(createProductDecommissionSchema), asyncHandler(fm.createProductDecommission));
router.patch('/decommission/products/:id', requireFeature('productDecommissioning'), authorize('admin', 'editor'), validateBody(updateProductDecommissionSchema), asyncHandler(fm.updateProductDecommission));
router.delete('/decommission/products/:id', requireFeature('productDecommissioning'), authorize('admin'), asyncHandler(fm.deleteProductDecommission));

// ============================================================================
// ENVIRONMENTAL LIFECYCLE (Visionary)
// ============================================================================
router.get('/lifecycle/assessments', requireFeature('environmentalLifecycle'), asyncHandler(fm.listLifecycleAssessments));
router.post('/lifecycle/assessments', requireFeature('environmentalLifecycle'), authorize('admin', 'editor'), validateBody(createLifecycleAssessmentSchema), asyncHandler(fm.createLifecycleAssessment));
router.get('/lifecycle/assessments/:id', requireFeature('environmentalLifecycle'), asyncHandler(fm.getLifecycleAssessment));
router.patch('/lifecycle/assessments/:id', requireFeature('environmentalLifecycle'), authorize('admin', 'editor'), validateBody(updateLifecycleAssessmentSchema), asyncHandler(fm.updateLifecycleAssessment));
router.delete('/lifecycle/assessments/:id', requireFeature('environmentalLifecycle'), authorize('admin'), asyncHandler(fm.deleteLifecycleAssessment));

// ============================================================================
// PRODUCT LIFECYCLE TRACKER (Growth+)
// ============================================================================
router.get('/product-lifecycle/products', requireFeature('productLifecycle'), asyncHandler(fm.listProductLifecycles));
router.post('/product-lifecycle/products', requireFeature('productLifecycle'), authorize('admin', 'editor'), validateBody(createProductLifecycleSchema), asyncHandler(fm.createProductLifecycle));
router.get('/product-lifecycle/products/:id', requireFeature('productLifecycle'), asyncHandler(fm.getProductLifecycle));
router.patch('/product-lifecycle/products/:id', requireFeature('productLifecycle'), authorize('admin', 'editor'), validateBody(updateProductLifecycleSchema), asyncHandler(fm.updateProductLifecycle));
router.delete('/product-lifecycle/products/:id', requireFeature('productLifecycle'), authorize('admin'), asyncHandler(fm.deleteProductLifecycle));

// ============================================================================
// PROCESS MAPPER (Growth+)
// ============================================================================
router.get('/process-maps', requireFeature('processMapper'), asyncHandler(fm.listProcessMaps));
router.post('/process-maps', requireFeature('processMapper'), authorize('admin', 'editor'), validateBody(createProcessMapSchema), asyncHandler(fm.createProcessMap));
router.get('/process-maps/:id', requireFeature('processMapper'), asyncHandler(fm.getProcessMap));
router.patch('/process-maps/:id', requireFeature('processMapper'), authorize('admin', 'editor'), validateBody(updateProcessMapSchema), asyncHandler(fm.updateProcessMap));
router.delete('/process-maps/:id', requireFeature('processMapper'), authorize('admin'), asyncHandler(fm.deleteProcessMap));

// ============================================================================
// INTER-MODULE DATA SYNC
// ============================================================================
router.post('/sync/sbom', authorize('admin', 'editor'), validateBody(syncSBOMSchema), asyncHandler(fm.syncSBOMToModules));
router.post('/sync/breach', authorize('admin', 'editor'), validateBody(syncBreachSchema), asyncHandler(fm.syncBreachToModules));

// ============================================================================
// CONNECTION TESTING
// ============================================================================
router.get('/integrations/:provider/test', asyncHandler(fm.testIntegrationConnection));

// ============================================================================
// REGULATION MODULE DATA (NIS2, US Privacy, Ecodesign, EU CRA, CSRD)
// ============================================================================
router.get('/regulation-data/:module', asyncHandler(fm.getAllRegulationModuleData));
router.get('/regulation-data/:module/:dataType', asyncHandler(fm.getRegulationModuleData));
router.put('/regulation-data/:module/:dataType', authorize('admin', 'editor'), validateBody(upsertRegulationModuleDataSchema), asyncHandler(fm.upsertRegulationModuleData));
router.delete('/regulation-data/:module/:dataType', authorize('admin'), asyncHandler(fm.deleteRegulationModuleData));

// ============================================================================
// METRICS HISTORY
// ============================================================================
router.post('/metrics', authorize('admin', 'editor'), validateBody(recordMetricSchema), asyncHandler(fm.recordMetric));
router.get('/metrics/latest', asyncHandler(fm.getLatestMetrics));
router.get('/metrics/:metricType', asyncHandler(fm.getMetricsHistory));

export default router;
