/**
 * White-Label Branding Routes
 *
 * Endpoints for managing organization branding configuration:
 * colors, logos, favicons, custom CSS, email templates, and login page.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { upsertBrandingSchema } from '../validators/coreModulesSchemas';
import { asyncHandler } from '../types/express';
import { AppError } from '../middleware/errorHandler';
import prisma from '../config/database';
import logger from '../config/logger';
import multer from 'multer';
import DOMPurify from 'isomorphic-dompurify';

const router = Router();
router.use(authenticate);

// Configure multer for in-memory file uploads (logos, favicons)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PNG, JPEG, SVG, ICO, WebP`));
    }
  },
});

// ============================================================================
// HELPERS
// ============================================================================

/** Validate a hex color string */
function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

// ============================================================================
// GET BRANDING CONFIG
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const branding = await prisma.brandingConfig.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (!branding) {
        // Return defaults when no config exists
        res.json({
          status: 'success',
          data: {
            organizationId: user.organizationId,
            logoUrl: null,
            faviconUrl: null,
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            accentColor: '#10B981',
            companyName: null,
            customDomain: null,
            customCSS: null,
            emailTemplate: null,
            loginPageHtml: null,
            footerText: null,
            isDefault: true,
          },
        });
        return;
      }

      res.json({ status: 'success', data: { ...branding, isDefault: false } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching branding config:', error);
      throw new AppError('Failed to fetch branding configuration', 500);
    }
  })
);

// ============================================================================
// CREATE/UPDATE BRANDING CONFIG (Admin only)
// ============================================================================

router.post(
  '/',
  authorize('admin'),
  validateBody(upsertBrandingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const {
        primaryColor,
        secondaryColor,
        accentColor,
        companyName,
        customDomain,
        customCSS,
        emailTemplate,
        loginPageHtml,
        footerText,
      } = req.body;

      // Joi schema validates hex colors and domain format via regex patterns
      // Sanitize HTML/CSS fields to prevent stored XSS
      const sanitizeHtml = (input: string | null | undefined): string | null => {
        if (input === undefined || input === null) return null;
        return DOMPurify.sanitize(input, {
          ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'a', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'span', 'div', 'img', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel'],
          ALLOW_DATA_ATTR: false,
        });
      };
      const sanitizeCss = (input: string | null | undefined): string | null => {
        if (input === undefined || input === null) return null;
        // Strip any HTML tags and JavaScript from CSS — only allow CSS declarations
        return input.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/expression\s*\(/gi, '');
      };
      const sanitizeText = (input: string | null | undefined): string | null => {
        if (input === undefined || input === null) return null;
        return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
      };

      const data: any = {};
      if (primaryColor !== undefined) data.primaryColor = primaryColor;
      if (secondaryColor !== undefined) data.secondaryColor = secondaryColor;
      if (accentColor !== undefined) data.accentColor = accentColor;
      if (companyName !== undefined) data.companyName = sanitizeText(companyName);
      if (customDomain !== undefined) data.customDomain = customDomain || null;
      if (customCSS !== undefined) data.customCSS = sanitizeCss(customCSS);
      if (emailTemplate !== undefined) data.emailTemplate = sanitizeHtml(emailTemplate);
      if (loginPageHtml !== undefined) data.loginPageHtml = sanitizeHtml(loginPageHtml);
      if (footerText !== undefined) data.footerText = sanitizeHtml(footerText);

      const branding = await prisma.brandingConfig.upsert({
        where: { organizationId: user.organizationId },
        update: data,
        create: {
          organizationId: user.organizationId,
          primaryColor: primaryColor || '#3B82F6',
          secondaryColor: secondaryColor || '#1E40AF',
          accentColor: accentColor || '#10B981',
          companyName: companyName || null,
          customDomain: customDomain || null,
          customCSS: customCSS || null,
          emailTemplate: emailTemplate || null,
          loginPageHtml: loginPageHtml || null,
          footerText: footerText || null,
        },
      });

      res.json({ status: 'success', data: branding });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error saving branding config:', error);
      throw new AppError('Failed to save branding configuration', 500);
    }
  })
);

// ============================================================================
// RESET BRANDING TO DEFAULTS (Admin only)
// ============================================================================

router.delete(
  '/',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.brandingConfig.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (!existing) {
        res.json({ status: 'success', data: { message: 'Branding is already at defaults' } });
        return;
      }

      await prisma.brandingConfig.delete({
        where: { organizationId: user.organizationId },
      });

      res.json({ status: 'success', data: { message: 'Branding reset to defaults' } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error resetting branding config:', error);
      throw new AppError('Failed to reset branding configuration', 500);
    }
  })
);

// ============================================================================
// UPLOAD LOGO (Admin only, multipart/form-data)
// ============================================================================

router.post(
  '/logo',
  authorize('admin'),
  upload.single('logo'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      if (!req.file) {
        throw new AppError('logo file is required (field name: "logo")', 400);
      }

      // Uploads to S3/CloudStorage when AWS_S3_BUCKET is configured.
      // For now, store as a data URI or use the S3 service if available.
      let logoUrl: string;

      try {
        const s3Service = await import('../services/s3Service');
        const result = await s3Service.default.uploadFile({
          file: req.file,
          userId: user.id,
          organizationId: user.organizationId,
          folder: 'branding',
        });
        logoUrl = result.url;
      } catch {
        // Fallback: store as base64 data URI
        const base64 = req.file.buffer.toString('base64');
        logoUrl = `data:${req.file.mimetype};base64,${base64}`;
      }

      const branding = await prisma.brandingConfig.upsert({
        where: { organizationId: user.organizationId },
        update: { logoUrl },
        create: {
          organizationId: user.organizationId,
          logoUrl,
        },
      });

      res.json({
        status: 'success',
        data: {
          logoUrl: branding.logoUrl,
          message: 'Logo uploaded successfully',
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error uploading logo:', error);
      throw new AppError('Failed to upload logo', 500);
    }
  })
);

// ============================================================================
// UPLOAD FAVICON (Admin only, multipart/form-data)
// ============================================================================

router.post(
  '/favicon',
  authorize('admin'),
  upload.single('favicon'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      if (!req.file) {
        throw new AppError('favicon file is required (field name: "favicon")', 400);
      }

      let faviconUrl: string;

      try {
        const s3Service = await import('../services/s3Service');
        const result = await s3Service.default.uploadFile({
          file: req.file,
          userId: user.id,
          organizationId: user.organizationId,
          folder: 'branding',
        });
        faviconUrl = result.url;
      } catch {
        // Fallback: store as base64 data URI
        const base64 = req.file.buffer.toString('base64');
        faviconUrl = `data:${req.file.mimetype};base64,${base64}`;
      }

      const branding = await prisma.brandingConfig.upsert({
        where: { organizationId: user.organizationId },
        update: { faviconUrl },
        create: {
          organizationId: user.organizationId,
          faviconUrl,
        },
      });

      res.json({
        status: 'success',
        data: {
          faviconUrl: branding.faviconUrl,
          message: 'Favicon uploaded successfully',
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error uploading favicon:', error);
      throw new AppError('Failed to upload favicon', 500);
    }
  })
);

export default router;
