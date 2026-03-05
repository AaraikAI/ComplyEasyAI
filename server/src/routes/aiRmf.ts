import { Router } from 'express';
import aiRmfController from '../controllers/aiRmfController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { requireVisionaryFeature } from '../middleware/tierMiddleware';
import { validateBody } from '../middleware/validate';
import { createAISystemSchema, updateAISystemSchema } from '../validators/aiRmfSchemas';

const router = Router();

// All routes require authentication + Visionary tier for NIST AI RMF
router.use(authenticate);
router.use(...requireVisionaryFeature('nistAiRmf'));

// ============================================================================
// AI System Management
// ============================================================================

router.post('/systems', authorize('admin', 'editor'), validateBody(createAISystemSchema), asyncHandler(aiRmfController.createAISystem.bind(aiRmfController)));
router.get('/systems', asyncHandler(aiRmfController.getAISystems.bind(aiRmfController)));
router.get('/systems/:id', asyncHandler(aiRmfController.getAISystemById.bind(aiRmfController)));
router.patch('/systems/:id', authorize('admin', 'editor'), validateBody(updateAISystemSchema), asyncHandler(aiRmfController.updateAISystem.bind(aiRmfController)));
router.delete('/systems/:id', authorize('admin'), asyncHandler(aiRmfController.deleteAISystem.bind(aiRmfController)));

// ============================================================================
// Core Functions
// ============================================================================

router.patch('/systems/:aiSystemId/functions/:functionName', authorize('admin', 'editor'), asyncHandler(aiRmfController.updateCoreFunction.bind(aiRmfController)));

// ============================================================================
// Categories and Subcategories
// ============================================================================

router.patch('/categories/:categoryId', authorize('admin', 'editor'), asyncHandler(aiRmfController.updateCategory.bind(aiRmfController)));
router.patch('/subcategories/:subcategoryId', authorize('admin', 'editor'), asyncHandler(aiRmfController.updateSubcategory.bind(aiRmfController)));

// ============================================================================
// Trustworthiness Characteristics
// ============================================================================

router.patch('/systems/:aiSystemId/trustworthiness/:characteristic', authorize('admin', 'editor'), asyncHandler(aiRmfController.updateTrustworthinessCharacteristic.bind(aiRmfController)));

// ============================================================================
// Lifecycle Stages
// ============================================================================

router.patch('/systems/:aiSystemId/lifecycle/:stage', authorize('admin', 'editor'), asyncHandler(aiRmfController.updateLifecycleStage.bind(aiRmfController)));

// ============================================================================
// AI Actors
// ============================================================================

router.post('/systems/:aiSystemId/actors', authorize('admin', 'editor'), asyncHandler(aiRmfController.addActor.bind(aiRmfController)));
router.delete('/actors/:actorId', authorize('admin', 'editor'), asyncHandler(aiRmfController.removeActor.bind(aiRmfController)));

// ============================================================================
// Assessments
// ============================================================================

router.post('/systems/:aiSystemId/assessments', authorize('admin', 'editor'), asyncHandler(aiRmfController.createAssessment.bind(aiRmfController)));
router.get('/systems/:aiSystemId/assessments', asyncHandler(aiRmfController.getAssessments.bind(aiRmfController)));
router.delete('/assessments/:assessmentId', authorize('admin', 'editor'), asyncHandler(aiRmfController.deleteAssessment.bind(aiRmfController)));

// ============================================================================
// Profiles
// ============================================================================

router.post('/systems/:aiSystemId/profiles', authorize('admin', 'editor'), asyncHandler(aiRmfController.createProfile.bind(aiRmfController)));

// ============================================================================
// Risk Activities
// ============================================================================

router.post('/systems/:aiSystemId/risk-activities', authorize('admin', 'editor'), asyncHandler(aiRmfController.createRiskActivity.bind(aiRmfController)));
router.patch('/risk-activities/:riskActivityId', authorize('admin', 'editor'), asyncHandler(aiRmfController.updateRiskActivity.bind(aiRmfController)));

// ============================================================================
// Analytics and Reporting
// ============================================================================

router.post('/systems/:aiSystemId/calculate-trustworthiness', authorize('admin', 'editor'), asyncHandler(aiRmfController.calculateTrustworthinessScore.bind(aiRmfController)));
router.get('/dashboard', asyncHandler(aiRmfController.getDashboardData.bind(aiRmfController)));

export default router;

