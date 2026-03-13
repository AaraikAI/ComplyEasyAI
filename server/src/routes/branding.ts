/**
 * White-Label Branding Routes
 *
 * Endpoints for managing organization branding configuration:
 * colors, logos, favicons, custom CSS, email templates, and login page.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';
import multer from 'multer';

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
      logger.error('Error fetching branding config:', error);
      res.status(500).json({ error: 'Failed to fetch branding configuration' });
    }
  })
);

// ============================================================================
// CREATE/UPDATE BRANDING CONFIG (Admin only)
// ============================================================================

router.post(
  '/',
  authorize('admin'),
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

      // Validate color values if provided
      if (primaryColor && !isValidHexColor(primaryColor)) {
        res.status(400).json({ error: 'primaryColor must be a valid hex color (e.g., #3B82F6)' });
        return;
      }
      if (secondaryColor && !isValidHexColor(secondaryColor)) {
        res.status(400).json({ error: 'secondaryColor must be a valid hex color' });
        return;
      }
      if (accentColor && !isValidHexColor(accentColor)) {
        res.status(400).json({ error: 'accentColor must be a valid hex color' });
        return;
      }

      // Validate custom domain format if provided
      if (customDomain) {
        const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        if (!domainRegex.test(customDomain)) {
          res.status(400).json({ error: 'customDomain must be a valid domain name' });
          return;
        }
      }

      const data: any = {};
      if (primaryColor !== undefined) data.primaryColor = primaryColor;
      if (secondaryColor !== undefined) data.secondaryColor = secondaryColor;
      if (accentColor !== undefined) data.accentColor = accentColor;
      if (companyName !== undefined) data.companyName = companyName || null;
      if (customDomain !== undefined) data.customDomain = customDomain || null;
      if (customCSS !== undefined) data.customCSS = customCSS || null;
      if (emailTemplate !== undefined) data.emailTemplate = emailTemplate || null;
      if (loginPageHtml !== undefined) data.loginPageHtml = loginPageHtml || null;
      if (footerText !== undefined) data.footerText = footerText || null;

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
      logger.error('Error saving branding config:', error);
      res.status(500).json({ error: 'Failed to save branding configuration' });
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
      logger.error('Error resetting branding config:', error);
      res.status(500).json({ error: 'Failed to reset branding configuration' });
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
        res.status(400).json({ error: 'logo file is required (field name: "logo")' });
        return;
      }

      // Uploads to S3/CloudStorage when AWS_S3_BUCKET is configured.
      // For now, store as a data URI or use the S3 service if available.
      let logoUrl: string;

      try {
        const s3Service = await import('../services/s3Service');
        const key = `branding/${user.organizationId}/logo-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
        const result = await s3Service.default.uploadBuffer(req.file.buffer, key, req.file.mimetype);
        logoUrl = result.url || result.location || key;
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
      logger.error('Error uploading logo:', error);
      res.status(500).json({ error: 'Failed to upload logo' });
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
        res.status(400).json({ error: 'favicon file is required (field name: "favicon")' });
        return;
      }

      let faviconUrl: string;

      try {
        const s3Service = await import('../services/s3Service');
        const key = `branding/${user.organizationId}/favicon-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
        const result = await s3Service.default.uploadBuffer(req.file.buffer, key, req.file.mimetype);
        faviconUrl = result.url || result.location || key;
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
      logger.error('Error uploading favicon:', error);
      res.status(500).json({ error: 'Failed to upload favicon' });
    }
  })
);

export default router;
