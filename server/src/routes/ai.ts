import { Router } from 'express';
import aiController from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post('/report', aiController.generateReport);
router.post('/policy', aiController.generatePolicy);
router.post('/contract', aiController.analyzeContract);
router.post('/gap-analysis', aiController.performGapAnalysis);
router.post('/rfp', aiController.generateRFPResponse);
router.post('/phishing', aiController.generatePhishing);
router.post('/vendor-score', aiController.scoreVendor);
router.post('/data-map', aiController.generateDataMap);
router.post('/bcp', aiController.generateBCP);
router.post('/chat', aiController.chat);

export default router;
