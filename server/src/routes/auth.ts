import { Router } from 'express';
import authController from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import { magicLinkSchema, loginSchema, registerSchema, completeTwoFactorSchema, updateProfileSchema, changePasswordSchema } from '../validators/authSchemas';

const router = Router();

router.post('/magic-link', authLimiter, validateBody(magicLinkSchema), asyncHandler(authController.requestMagicLink.bind(authController)));
router.post('/verify', authLimiter, asyncHandler(authController.verifyMagicLink.bind(authController)));
router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(authController.login.bind(authController)));
router.post('/2fa/complete', authLimiter, validateBody(completeTwoFactorSchema), asyncHandler(authController.completeTwoFactorLogin.bind(authController)));
router.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(authController.register.bind(authController)));
router.post('/refresh', asyncHandler(authController.refreshToken.bind(authController)));
router.post('/logout', asyncHandler(authController.logout.bind(authController)));

// User profile update (requires authentication)
import { authenticate } from '../middleware/auth';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
router.patch('/profile', authenticate, validateBody(updateProfileSchema), asyncHandler(authController.updateProfile.bind(authController)));
router.post('/profile/avatar', authenticate, upload.single('avatar'), asyncHandler(authController.uploadAvatar.bind(authController)));
router.patch('/password', authenticate, validateBody(changePasswordSchema), asyncHandler(authController.changePassword.bind(authController)));

export default router;
