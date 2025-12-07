import { Router } from 'express';
import aiController from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../types/express';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post('/report', asyncHandler(aiController.generateReport.bind(aiController)));
router.post('/policy', asyncHandler(aiController.generatePolicy.bind(aiController)));
router.post('/contract', asyncHandler(aiController.analyzeContract.bind(aiController)));
router.post('/gap-analysis', asyncHandler(aiController.performGapAnalysis.bind(aiController)));
router.post('/rfp', asyncHandler(aiController.generateRFPResponse.bind(aiController)));
router.post('/phishing', asyncHandler(aiController.generatePhishing.bind(aiController)));
router.post('/vendor-score', asyncHandler(aiController.scoreVendor.bind(aiController)));
router.post('/data-map', asyncHandler(aiController.generateDataMap.bind(aiController)));
router.post('/bcp', asyncHandler(aiController.generateBCP.bind(aiController)));
router.post('/chat', asyncHandler(aiController.chat.bind(aiController)));

export default router;
