/**
 * Feature Modules Routes
 * Routes for all feature module CRUD operations
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import * as fm from '../controllers/featureModulesController';

const router = Router();

router.use(authenticate);

// ============================================================================
// GOVERNANCE MANAGER
// ============================================================================
router.get('/governance/bodies', asyncHandler(fm.listGovernanceBodies));
router.post('/governance/bodies', authorize('admin', 'editor'), asyncHandler(fm.createGovernanceBody));
router.patch('/governance/bodies/:id', authorize('admin', 'editor'), asyncHandler(fm.updateGovernanceBody));
router.delete('/governance/bodies/:id', authorize('admin'), asyncHandler(fm.deleteGovernanceBody));

router.post('/governance/meetings', authorize('admin', 'editor'), asyncHandler(fm.createMeeting));
router.patch('/governance/meetings/:id', authorize('admin', 'editor'), asyncHandler(fm.updateMeeting));
router.delete('/governance/meetings/:id', authorize('admin'), asyncHandler(fm.deleteMeeting));

router.post('/governance/decisions', authorize('admin', 'editor'), asyncHandler(fm.createDecision));
router.patch('/governance/decisions/:id', authorize('admin', 'editor'), asyncHandler(fm.updateDecision));

router.post('/governance/escalation-paths', authorize('admin', 'editor'), asyncHandler(fm.createEscalationPath));
router.patch('/governance/escalation-paths/:id', authorize('admin', 'editor'), asyncHandler(fm.updateEscalationPath));
router.delete('/governance/escalation-paths/:id', authorize('admin'), asyncHandler(fm.deleteEscalationPath));

router.get('/governance/dpo', asyncHandler(fm.getDPOProfile));
router.put('/governance/dpo', authorize('admin', 'editor'), asyncHandler(fm.upsertDPOProfile));

// ============================================================================
// BREACH NOTIFICATION
// ============================================================================
router.get('/breach/incidents', asyncHandler(fm.listBreachIncidents));
router.post('/breach/incidents', authorize('admin', 'editor'), asyncHandler(fm.createBreachIncident));
router.get('/breach/incidents/:id', asyncHandler(fm.getBreachIncident));
router.patch('/breach/incidents/:id', authorize('admin', 'editor'), asyncHandler(fm.updateBreachIncident));
router.delete('/breach/incidents/:id', authorize('admin'), asyncHandler(fm.deleteBreachIncident));

router.post('/breach/notifications', authorize('admin', 'editor'), asyncHandler(fm.createBreachNotification));
router.patch('/breach/notifications/:id', authorize('admin', 'editor'), asyncHandler(fm.updateBreachNotification));

router.get('/breach/templates', asyncHandler(fm.listBreachTemplates));
router.post('/breach/templates', authorize('admin', 'editor'), asyncHandler(fm.createBreachTemplate));
router.patch('/breach/templates/:id', authorize('admin', 'editor'), asyncHandler(fm.updateBreachTemplate));
router.delete('/breach/templates/:id', authorize('admin'), asyncHandler(fm.deleteBreachTemplate));

router.get('/breach/contacts', asyncHandler(fm.listRegulatoryContacts));
router.post('/breach/contacts', authorize('admin', 'editor'), asyncHandler(fm.createRegulatoryContact));
router.patch('/breach/contacts/:id', authorize('admin', 'editor'), asyncHandler(fm.updateRegulatoryContact));
router.delete('/breach/contacts/:id', authorize('admin'), asyncHandler(fm.deleteRegulatoryContact));

// ============================================================================
// CE MARKING WORKFLOW
// ============================================================================
router.get('/ce-marking/products', asyncHandler(fm.listCEProducts));
router.post('/ce-marking/products', authorize('admin', 'editor'), asyncHandler(fm.createCEProduct));
router.get('/ce-marking/products/:id', asyncHandler(fm.getCEProduct));
router.patch('/ce-marking/products/:id', authorize('admin', 'editor'), asyncHandler(fm.updateCEProduct));
router.delete('/ce-marking/products/:id', authorize('admin'), asyncHandler(fm.deleteCEProduct));

// ============================================================================
// DIGITAL PRODUCT PASSPORT
// ============================================================================
router.get('/dpp/passports', asyncHandler(fm.listDPPs));
router.post('/dpp/passports', authorize('admin', 'editor'), asyncHandler(fm.createDPP));
router.get('/dpp/passports/:id', asyncHandler(fm.getDPP));
router.patch('/dpp/passports/:id', authorize('admin', 'editor'), asyncHandler(fm.updateDPP));
router.delete('/dpp/passports/:id', authorize('admin'), asyncHandler(fm.deleteDPP));

// ============================================================================
// ESG REPORTING
// ============================================================================
router.get('/esg/metrics', asyncHandler(fm.listESGMetrics));
router.post('/esg/metrics', authorize('admin', 'editor'), asyncHandler(fm.createESGMetric));
router.get('/esg/metrics/:id', asyncHandler(fm.getESGMetric));
router.patch('/esg/metrics/:id', authorize('admin', 'editor'), asyncHandler(fm.updateESGMetric));
router.delete('/esg/metrics/:id', authorize('admin'), asyncHandler(fm.deleteESGMetric));

router.get('/esg/materiality', asyncHandler(fm.listMaterialityAssessments));
router.post('/esg/materiality', authorize('admin', 'editor'), asyncHandler(fm.createMaterialityAssessment));
router.get('/esg/materiality/:id', asyncHandler(fm.getMaterialityAssessment));
router.patch('/esg/materiality/:id', authorize('admin', 'editor'), asyncHandler(fm.updateMaterialityAssessment));
router.delete('/esg/materiality/:id', authorize('admin'), asyncHandler(fm.deleteMaterialityAssessment));

// ============================================================================
// SBOM MANAGER
// ============================================================================
router.get('/sbom/entries', asyncHandler(fm.listSBOMEntries));
router.post('/sbom/entries', authorize('admin', 'editor'), asyncHandler(fm.createSBOMEntry));
router.post('/sbom/entries/bulk', authorize('admin', 'editor'), asyncHandler(fm.bulkCreateSBOMEntries));
router.patch('/sbom/entries/:id', authorize('admin', 'editor'), asyncHandler(fm.updateSBOMEntry));
router.delete('/sbom/entries/:id', authorize('admin'), asyncHandler(fm.deleteSBOMEntry));

router.get('/sbom/repositories', asyncHandler(fm.listSBOMRepositories));
router.post('/sbom/repositories', authorize('admin', 'editor'), asyncHandler(fm.createSBOMRepository));
router.patch('/sbom/repositories/:id', authorize('admin', 'editor'), asyncHandler(fm.updateSBOMRepository));
router.delete('/sbom/repositories/:id', authorize('admin'), asyncHandler(fm.deleteSBOMRepository));

// ============================================================================
// POST-MARKET SURVEILLANCE
// ============================================================================
router.get('/surveillance/plans', asyncHandler(fm.listSurveillancePlans));
router.post('/surveillance/plans', authorize('admin', 'editor'), asyncHandler(fm.createSurveillancePlan));
router.patch('/surveillance/plans/:id', authorize('admin', 'editor'), asyncHandler(fm.updateSurveillancePlan));
router.delete('/surveillance/plans/:id', authorize('admin'), asyncHandler(fm.deleteSurveillancePlan));

router.post('/surveillance/incidents', authorize('admin', 'editor'), asyncHandler(fm.createSurveillanceIncident));
router.patch('/surveillance/incidents/:id', authorize('admin', 'editor'), asyncHandler(fm.updateSurveillanceIncident));

router.get('/surveillance/recalls', asyncHandler(fm.listProductRecalls));
router.post('/surveillance/recalls', authorize('admin', 'editor'), asyncHandler(fm.createProductRecall));
router.patch('/surveillance/recalls/:id', authorize('admin', 'editor'), asyncHandler(fm.updateProductRecall));

// ============================================================================
// PRODUCT DECOMMISSIONING
// ============================================================================
router.get('/decommission/products', asyncHandler(fm.listProductDecommissions));
router.post('/decommission/products', authorize('admin', 'editor'), asyncHandler(fm.createProductDecommission));
router.patch('/decommission/products/:id', authorize('admin', 'editor'), asyncHandler(fm.updateProductDecommission));
router.delete('/decommission/products/:id', authorize('admin'), asyncHandler(fm.deleteProductDecommission));

// ============================================================================
// ENVIRONMENTAL LIFECYCLE
// ============================================================================
router.get('/lifecycle/assessments', asyncHandler(fm.listLifecycleAssessments));
router.post('/lifecycle/assessments', authorize('admin', 'editor'), asyncHandler(fm.createLifecycleAssessment));
router.get('/lifecycle/assessments/:id', asyncHandler(fm.getLifecycleAssessment));
router.patch('/lifecycle/assessments/:id', authorize('admin', 'editor'), asyncHandler(fm.updateLifecycleAssessment));
router.delete('/lifecycle/assessments/:id', authorize('admin'), asyncHandler(fm.deleteLifecycleAssessment));

// ============================================================================
// PRODUCT LIFECYCLE TRACKER
// ============================================================================
router.get('/product-lifecycle/products', asyncHandler(fm.listProductLifecycles));
router.post('/product-lifecycle/products', authorize('admin', 'editor'), asyncHandler(fm.createProductLifecycle));
router.get('/product-lifecycle/products/:id', asyncHandler(fm.getProductLifecycle));
router.patch('/product-lifecycle/products/:id', authorize('admin', 'editor'), asyncHandler(fm.updateProductLifecycle));
router.delete('/product-lifecycle/products/:id', authorize('admin'), asyncHandler(fm.deleteProductLifecycle));

// ============================================================================
// PROCESS MAPPER
// ============================================================================
router.get('/process-maps', asyncHandler(fm.listProcessMaps));
router.post('/process-maps', authorize('admin', 'editor'), asyncHandler(fm.createProcessMap));
router.get('/process-maps/:id', asyncHandler(fm.getProcessMap));
router.patch('/process-maps/:id', authorize('admin', 'editor'), asyncHandler(fm.updateProcessMap));
router.delete('/process-maps/:id', authorize('admin'), asyncHandler(fm.deleteProcessMap));

// ============================================================================
// INTER-MODULE DATA SYNC
// ============================================================================
router.post('/sync/sbom', authorize('admin', 'editor'), asyncHandler(fm.syncSBOMToModules));
router.post('/sync/breach', authorize('admin', 'editor'), asyncHandler(fm.syncBreachToModules));

// ============================================================================
// CONNECTION TESTING
// ============================================================================
router.get('/integrations/:provider/test', asyncHandler(fm.testIntegrationConnection));

// ============================================================================
// REGULATION MODULE DATA (NIS2, US Privacy, Ecodesign, EU CRA, CSRD)
// ============================================================================
router.get('/regulation-data/:module', asyncHandler(fm.getAllRegulationModuleData));
router.get('/regulation-data/:module/:dataType', asyncHandler(fm.getRegulationModuleData));
router.put('/regulation-data/:module/:dataType', authorize('admin', 'editor'), asyncHandler(fm.upsertRegulationModuleData));
router.delete('/regulation-data/:module/:dataType', authorize('admin'), asyncHandler(fm.deleteRegulationModuleData));

// ============================================================================
// METRICS HISTORY
// ============================================================================
router.post('/metrics', authorize('admin', 'editor'), asyncHandler(fm.recordMetric));
router.get('/metrics/latest', asyncHandler(fm.getLatestMetrics));
router.get('/metrics/:metricType', asyncHandler(fm.getMetricsHistory));

export default router;
