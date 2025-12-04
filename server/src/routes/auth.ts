import { Router } from 'express';
import authController from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/magic-link', authLimiter, authController.requestMagicLink);
router.post('/verify', authLimiter, authController.verifyMagicLink);
router.post('/2fa/complete', authLimiter, authController.completeTwoFactorLogin);
router.post('/register', authLimiter, authController.register);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
