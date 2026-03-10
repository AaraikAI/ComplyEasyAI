/**
 * Cookie Consent Routes — ePrivacy Directive / GDPR
 *
 * Endpoints for managing cookie banner configuration, user consent
 * preferences, and consent event recording.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// HELPERS
// ============================================================================

function paginate(query: any): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

/** Map cookie category to consentType string */
function categoryToConsentType(category: string): string {
  const mapping: Record<string, string> = {
    essential: 'Essential',
    functional: 'Functional',
    analytics: 'Analytics',
    targeting: 'Targeting',
    marketing: 'Marketing',
  };
  return mapping[category] || category;
}

// ============================================================================
// GET COOKIE BANNER CONFIGURATION
// ============================================================================

router.get(
  '/banner',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const banner = await prisma.jITPrivacyNotice.findFirst({
        where: {
          organizationId: user.organizationId,
          triggerContext: 'CookieBanner',
          status: 'Active',
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (!banner) {
        res.json({
          configured: false,
          message: 'No active cookie banner configured',
        });
        return;
      }

      res.json({
        configured: true,
        id: banner.id,
        bannerText: banner.noticeContent,
        shortText: banner.shortNotice,
        categories: banner.dataCollected,
        purposes: banner.purposes,
        legalBasis: banner.legalBasis,
        retentionPeriod: banner.retentionPeriod,
        thirdPartyRecipients: banner.thirdPartyRecipients,
        dataSubjectRights: banner.dataSubjectRights,
        displayType: banner.displayType,
        position: banner.position,
        requiresAction: banner.requiresAction,
        version: banner.version,
        language: banner.language,
        translations: banner.translations,
        contactInfo: banner.contactInfo,
        statistics: {
          impressions: banner.impressions,
          acceptances: banner.acceptances,
          dismissals: banner.dismissals,
        },
      });
    } catch (error) {
      logger.error('Error fetching cookie banner:', error);
      res.status(500).json({ error: 'Failed to fetch cookie banner configuration' });
    }
  })
);

// ============================================================================
// SAVE COOKIE CONSENT PREFERENCES
// ============================================================================

router.post(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const { subjectIdentifier, categories, consentMethod } = req.body;

      if (!subjectIdentifier) {
        res.status(400).json({ error: 'subjectIdentifier is required' });
        return;
      }

      if (!categories || typeof categories !== 'object') {
        res.status(400).json({ error: 'categories object is required' });
        return;
      }

      // Upsert consent preference
      const preference = await prisma.consentPreference.upsert({
        where: {
          organizationId_dataSubjectId: {
            organizationId: user.organizationId,
            dataSubjectId: subjectIdentifier,
          },
        },
        update: {
          preferences: {
            essential: true, // Essential cookies are always enabled
            functional: categories.functional ?? false,
            analytics: categories.analytics ?? false,
            targeting: categories.targeting ?? false,
          },
          lastUpdated: new Date(),
        },
        create: {
          organizationId: user.organizationId,
          dataSubjectId: subjectIdentifier,
          preferences: {
            essential: true,
            functional: categories.functional ?? false,
            analytics: categories.analytics ?? false,
            targeting: categories.targeting ?? false,
          },
          lastUpdated: new Date(),
        },
      });

      // Create consent records for each category
      const consentRecordPromises = Object.entries(categories).map(
        async ([category, consented]) => {
          return prisma.consentRecord.create({
            data: {
              organizationId: user.organizationId,
              dataSubjectId: subjectIdentifier,
              consentType: categoryToConsentType(category),
              purpose: `Cookie consent - ${category}`,
              legalBasis: 'Consent',
              channel: 'Web',
              consentGiven: consented as boolean,
              consentDate: new Date(),
              source: consentMethod || 'CookieBanner',
              proofOfConsent: {
                method: consentMethod || 'CookieBanner',
                timestamp: new Date().toISOString(),
                categories,
              },
            },
          });
        }
      );

      await Promise.all(consentRecordPromises);

      res.status(201).json({
        message: 'Cookie preferences saved',
        preference,
      });
    } catch (error) {
      logger.error('Error saving cookie preferences:', error);
      res.status(500).json({ error: 'Failed to save cookie preferences' });
    }
  })
);

// ============================================================================
// GET COOKIE PREFERENCES FOR A SUBJECT
// ============================================================================

router.get(
  '/preferences/:subjectId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const preference = await prisma.consentPreference.findUnique({
        where: {
          organizationId_dataSubjectId: {
            organizationId: user.organizationId,
            dataSubjectId: req.params.subjectId,
          },
        },
      });

      if (!preference) {
        res.status(404).json({ error: 'No cookie preferences found for this subject' });
        return;
      }

      res.json(preference);
    } catch (error) {
      logger.error('Error fetching cookie preferences:', error);
      res.status(500).json({ error: 'Failed to fetch cookie preferences' });
    }
  })
);

// ============================================================================
// UPDATE COOKIE PREFERENCES (PARTIAL)
// ============================================================================

router.patch(
  '/preferences/:subjectId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.consentPreference.findUnique({
        where: {
          organizationId_dataSubjectId: {
            organizationId: user.organizationId,
            dataSubjectId: req.params.subjectId,
          },
        },
      });

      if (!existing) {
        res.status(404).json({ error: 'No cookie preferences found for this subject' });
        return;
      }

      const { categories } = req.body;
      if (!categories || typeof categories !== 'object') {
        res.status(400).json({ error: 'categories object is required' });
        return;
      }

      // Merge with existing preferences
      const existingPrefs = (existing.preferences as Record<string, any>) || {};
      const updatedPrefs = {
        ...existingPrefs,
        ...categories,
        essential: true, // Essential is always true
      };

      const preference = await prisma.consentPreference.update({
        where: {
          organizationId_dataSubjectId: {
            organizationId: user.organizationId,
            dataSubjectId: req.params.subjectId,
          },
        },
        data: {
          preferences: updatedPrefs,
          lastUpdated: new Date(),
        },
      });

      res.json(preference);
    } catch (error) {
      logger.error('Error updating cookie preferences:', error);
      res.status(500).json({ error: 'Failed to update cookie preferences' });
    }
  })
);

// ============================================================================
// RECORD CONSENT EVENT
// ============================================================================

router.post(
  '/record',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const { subjectIdentifier, action, categories } = req.body;

      if (!subjectIdentifier || !action) {
        res.status(400).json({ error: 'subjectIdentifier and action are required' });
        return;
      }

      // Determine consent type based on action
      let consentType: string;
      let consentGiven: boolean;

      switch (action) {
        case 'accept_all':
          consentType = 'CookieAcceptAll';
          consentGiven = true;
          break;
        case 'reject_all':
          consentType = 'CookieRejectAll';
          consentGiven = false;
          break;
        case 'customize':
          consentType = 'CookieCustomize';
          consentGiven = true; // Partial consent
          break;
        default:
          consentType = action;
          consentGiven = true;
      }

      const record = await prisma.consentRecord.create({
        data: {
          organizationId: user.organizationId,
          dataSubjectId: subjectIdentifier,
          consentType,
          purpose: `Cookie consent event: ${action}`,
          legalBasis: 'Consent',
          channel: 'Web',
          consentGiven,
          consentDate: new Date(),
          source: 'CookieBanner',
          proofOfConsent: {
            ipAddress: req.ip || 'unknown',
            timestamp: new Date().toISOString(),
            consentChoices: categories || {},
            action,
            userAgent: req.headers['user-agent'] || 'unknown',
          },
          granularity: categories || null,
        },
      });

      res.status(201).json(record);
    } catch (error) {
      logger.error('Error recording consent event:', error);
      res.status(500).json({ error: 'Failed to record consent event' });
    }
  })
);

// ============================================================================
// LIST CONSENT RECORDS
// ============================================================================

router.get(
  '/records',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const consentType = req.query.consentType as string | undefined;

    try {
      const where: any = { organizationId: user.organizationId };

      // Filter to cookie-related consent types
      if (consentType) {
        where.consentType = consentType;
      } else {
        where.consentType = {
          in: [
            'Essential',
            'Functional',
            'Analytics',
            'Targeting',
            'Marketing',
            'CookieAcceptAll',
            'CookieRejectAll',
            'CookieCustomize',
          ],
        };
      }

      const [records, total] = await Promise.all([
        prisma.consentRecord.findMany({
          where,
          orderBy: { consentDate: 'desc' },
          skip,
          take,
        }),
        prisma.consentRecord.count({ where }),
      ]);

      res.json({ records, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      logger.error('Error fetching cookie consent records:', error);
      res.status(500).json({ error: 'Failed to fetch consent records' });
    }
  })
);

// ============================================================================
// WITHDRAW ALL COOKIE CONSENT
// ============================================================================

router.delete(
  '/preferences/:subjectId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.consentPreference.findUnique({
        where: {
          organizationId_dataSubjectId: {
            organizationId: user.organizationId,
            dataSubjectId: req.params.subjectId,
          },
        },
      });

      if (!existing) {
        res.status(404).json({ error: 'No cookie preferences found for this subject' });
        return;
      }

      const now = new Date();
      const existingPrefs = (existing.preferences as Record<string, any>) || {};

      // Create withdrawal consent records for each previously granted category
      const withdrawalPromises: Promise<any>[] = [];
      for (const [category, consented] of Object.entries(existingPrefs)) {
        if (consented && category !== 'essential') {
          withdrawalPromises.push(
            prisma.consentRecord.create({
              data: {
                organizationId: user.organizationId,
                dataSubjectId: req.params.subjectId,
                consentType: categoryToConsentType(category),
                purpose: `Cookie consent withdrawal - ${category}`,
                legalBasis: 'Consent',
                channel: 'Web',
                consentGiven: false,
                consentDate: now,
                withdrawnAt: now,
                withdrawalMethod: 'UserRequest',
                source: 'CookieBanner',
                proofOfConsent: {
                  timestamp: now.toISOString(),
                  action: 'withdrawal',
                  category,
                },
              },
            })
          );
        }
      }

      // Reset preferences to essential-only
      await Promise.all([
        ...withdrawalPromises,
        prisma.consentPreference.update({
          where: {
            organizationId_dataSubjectId: {
              organizationId: user.organizationId,
              dataSubjectId: req.params.subjectId,
            },
          },
          data: {
            preferences: { essential: true, functional: false, analytics: false, targeting: false },
            lastUpdated: now,
          },
        }),
      ]);

      res.json({ message: 'All cookie consent withdrawn', subjectId: req.params.subjectId });
    } catch (error) {
      logger.error('Error withdrawing cookie consent:', error);
      res.status(500).json({ error: 'Failed to withdraw cookie consent' });
    }
  })
);

export default router;
