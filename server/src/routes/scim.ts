/**
 * SCIM 2.0 Provisioning Routes
 *
 * Implements SCIM 2.0 endpoints for automated user and group provisioning
 * from identity providers (Okta, Azure AD, OneLogin, etc.).
 * Uses bearer token authentication from SCIMConfiguration instead of JWT.
 *
 * Spec: https://datatracker.ietf.org/doc/html/rfc7644
 */

import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import {
  scimCreateUserSchema,
  scimReplaceUserSchema,
  scimPatchUserSchema,
  scimCreateGroupSchema,
} from '../validators/scimSchemas';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { authenticate as cookieAuthenticate, authorize as roleAuthorize } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// ============================================================================
// SCIM TOKEN HASHING MIGRATION
// ============================================================================
// Ensures all stored bearer tokens are SHA-256 hashed.
// Runs once on module load. Plaintext tokens (those NOT matching a 64-char
// hex string) are hashed in-place so that all future comparisons use hashes.
// This is idempotent — already-hashed tokens are left unchanged.

const SHA256_HEX_RE = /^[0-9a-f]{64}$/i;

async function migrateScimTokensToHashed(): Promise<void> {
  try {
    const configs = await prisma.sCIMConfiguration.findMany({
      where: { bearerToken: { not: null } },
      select: { id: true, bearerToken: true },
    });

    let migrated = 0;
    for (const cfg of configs) {
      if (!cfg.bearerToken || SHA256_HEX_RE.test(cfg.bearerToken)) continue;
      // Token is plaintext — hash it
      const hashed = crypto.createHash('sha256').update(cfg.bearerToken).digest('hex');
      await prisma.sCIMConfiguration.update({
        where: { id: cfg.id },
        data: { bearerToken: hashed },
      });
      migrated++;
    }

    if (migrated > 0) {
      logger.info(`[SCIM] Migrated ${migrated} bearer token(s) from plaintext to SHA-256 hash`);
    }
  } catch (err) {
    logger.warn('[SCIM] Token migration check skipped — table may not exist yet', { cause: err });
  }
}

// Fire migration on import (non-blocking)
migrateScimTokensToHashed();

// ============================================================================
// SCIM BEARER TOKEN AUTH MIDDLEWARE
// ============================================================================

interface SCIMAuthRequest extends Request {
  scimOrgId?: string;
  scimConfigId?: string;
}

/**
 * Authenticate SCIM requests using bearer tokens stored in SCIMConfiguration.
 * This replaces JWT auth for SCIM endpoints.
 */
const scimAuthenticate: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'Bearer token is required',
        status: '401',
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'Invalid bearer token',
        status: '401',
      });
      return;
    }

    // Hash the incoming token and compare against stored hashes.
    // Migration to SHA-256 hashed storage runs automatically on module load (see above).
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Query all enabled SCIM configs with a token and use timing-safe comparison
    const enabledConfigs = await prisma.sCIMConfiguration.findMany({
      where: { enabled: true, bearerToken: { not: null } },
    });

    const hashedTokenBuffer = Buffer.from(hashedToken, 'utf-8');
    let matchedConfig: typeof enabledConfigs[0] | null = null;

    for (const cfg of enabledConfigs) {
      if (!cfg.bearerToken) continue;
      const storedBuffer = Buffer.from(cfg.bearerToken, 'utf-8');
      // Timing-safe comparison requires equal-length buffers
      if (storedBuffer.length === hashedTokenBuffer.length &&
          crypto.timingSafeEqual(storedBuffer, hashedTokenBuffer)) {
        matchedConfig = cfg;
        break;
      }
    }

    if (!matchedConfig) {
      res.status(401).json({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'Invalid or expired bearer token',
        status: '401',
      });
      return;
    }

    (req as SCIMAuthRequest).scimOrgId = matchedConfig.organizationId;
    (req as SCIMAuthRequest).scimConfigId = matchedConfig.id;

    // Update last sync timestamp
    const scimReq = req as SCIMAuthRequest;
    await prisma.sCIMConfiguration.update({
      where: { id: scimReq.scimConfigId },
      data: { lastSyncAt: new Date() },
    });

    next();
  } catch (error) {
    logger.error('SCIM auth failed', {
      err: error,
      endpoint: req.path,
      method: req.method,
      scimId: req.params?.id,
      ip: req.ip,
    });
    const wrapped = new AppError('SCIM authentication failed', 500);
    (wrapped as any).cause = error;
    return next(wrapped);
  }
};

// ============================================================================
// HELPERS
// ============================================================================

/** Convert a database User to SCIM User resource */
function toSCIMUser(user: any, baseUrl: string): any {
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    id: user.id,
    externalId: user.employeeId || user.id,
    userName: user.email,
    name: {
      formatted: user.name,
      givenName: user.name?.split(' ')[0] || '',
      familyName: user.name?.split(' ').slice(1).join(' ') || '',
    },
    emails: [
      {
        value: user.email,
        type: 'work',
        primary: true,
      },
    ],
    displayName: user.name,
    active: user.active,
    title: user.jobTitle || undefined,
    department: user.department || undefined,
    meta: {
      resourceType: 'User',
      created: user.createdAt,
      lastModified: user.updatedAt,
      location: `${baseUrl}/scim/v2/Users/${user.id}`,
    },
  };
}

/** Build the base URL for SCIM resource locations */
function getBaseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}/api`;
}

// ============================================================================
// SERVICE PROVIDER CONFIG (no auth required)
// ============================================================================

router.get(
  '/v2/ServiceProviderConfig',
  asyncHandler(async (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);

    res.json({
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
      documentationUri: `${baseUrl}/docs/scim`,
      patch: {
        supported: true,
      },
      bulk: {
        supported: false,
        maxOperations: 0,
        maxPayloadSize: 0,
      },
      filter: {
        supported: true,
        maxResults: 200,
      },
      changePassword: {
        supported: false,
      },
      sort: {
        supported: false,
      },
      etag: {
        supported: false,
      },
      authenticationSchemes: [
        {
          name: 'OAuth Bearer Token',
          description: 'Authentication scheme using the OAuth Bearer Token standard',
          specUri: 'https://www.rfc-editor.org/info/rfc6750',
          type: 'oauthbearertoken',
          primary: true,
        },
      ],
      meta: {
        resourceType: 'ServiceProviderConfig',
        location: `${baseUrl}/scim/v2/ServiceProviderConfig`,
      },
    });
  })
);

// ============================================================================
// ADMIN UI ROUTES (session-cookie auth, NOT bearer)
// These match the frontend SCIMSettings.tsx admin actions.
// ============================================================================

router.post(
  '/sync',
  cookieAuthenticate,
  roleAuthorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const organizationId = user?.organizationId as string | undefined;
    if (!organizationId) {
      throw new AppError('Missing organization context', 400);
    }

    const cfg = await prisma.sCIMConfiguration.findUnique({ where: { organizationId } });
    if (!cfg || !cfg.enabled) {
      throw new AppError('SCIM is not enabled for this organization', 400);
    }

    await prisma.sCIMConfiguration.update({
      where: { organizationId },
      data: { lastSyncAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        action: 'scim.sync_triggered',
        userId: user.id,
        organizationId,
        // AuditLog.hash is the table's @unique dedupe key (see schema.prisma);
        // a random UUID satisfies that uniqueness constraint per the project convention.
        hash: crypto.randomUUID(),
        details: JSON.stringify({ triggeredBy: user.id, triggeredAt: new Date().toISOString() }),
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      },
    });

    res.status(202).json({ status: 'accepted', lastSyncAt: new Date().toISOString() });
  }),
);

router.delete(
  '/group-mappings/:id',
  cookieAuthenticate,
  roleAuthorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const organizationId = user?.organizationId as string | undefined;
    if (!organizationId) {
      throw new AppError('Missing organization context', 400);
    }

    const role = await prisma.customRole.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!role) {
      throw new AppError('Group mapping not found', 404);
    }
    if (role.isSystem) {
      throw new AppError('Cannot delete a system role', 403);
    }

    await prisma.userRole.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.customRole.delete({ where: { id: role.id } });

    await prisma.auditLog.create({
      data: {
        action: 'scim.group_mapping_deleted',
        userId: user.id,
        organizationId,
        hash: crypto.randomUUID(),
        details: JSON.stringify({ roleId: role.id, roleName: role.name }),
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      },
    });

    res.json({ status: 'success', data: { id: role.id, deleted: true } });
  }),
);

// ============================================================================
// AUTHENTICATED SCIM ROUTES
// ============================================================================

// All routes below require SCIM bearer token auth
router.use('/v2/Users', scimAuthenticate);
router.use('/v2/Groups', scimAuthenticate);

// ============================================================================
// LIST USERS
// ============================================================================

router.get(
  '/v2/Users',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const scimReq = req as SCIMAuthRequest;
    const orgId = scimReq.scimOrgId!;
    const baseUrl = getBaseUrl(req);

    try {
      const startIndex = Math.max(1, parseInt(req.query.startIndex as string, 10) || 1);
      const count = Math.min(200, Math.max(1, parseInt(req.query.count as string, 10) || 100));

      // Basic SCIM filter support (e.g., userName eq "john@example.com")
      const filter = req.query.filter as string | undefined;
      const where: any = { organizationId: orgId };

      if (filter) {
        const eqMatch = filter.match(/userName\s+eq\s+"([^"]+)"/i);
        const coMatch = filter.match(/userName\s+co\s+"([^"]+)"/i);
        const swMatch = filter.match(/userName\s+sw\s+"([^"]+)"/i);
        const emailEqMatch = filter.match(/emails\.value\s+eq\s+"([^"]+)"/i);

        if (eqMatch) {
          where.email = eqMatch[1];
        } else if (coMatch) {
          where.email = { contains: coMatch[1], mode: 'insensitive' };
        } else if (swMatch) {
          where.email = { startsWith: swMatch[1], mode: 'insensitive' };
        } else if (emailEqMatch) {
          where.email = emailEqMatch[1];
        }
      }

      const [users, totalResults] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: startIndex - 1,
          take: count,
          orderBy: { createdAt: 'asc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults,
        startIndex,
        itemsPerPage: users.length,
        Resources: users.map((u) => toSCIMUser(u, baseUrl)),
      });
    } catch (error) {
      logger.error('SCIM list users failed', {
        err: error,
        endpoint: req.path,
        method: req.method,
        userId: req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to list users', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// CREATE USER
// ============================================================================

router.post(
  '/v2/Users',
  validateBody(scimCreateUserSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const scimReq = req as SCIMAuthRequest;
    const orgId = scimReq.scimOrgId!;
    const baseUrl = getBaseUrl(req);

    try {
      const { userName, name, emails, active, externalId, title, department } = req.body;

      const email = userName || (emails && emails[0]?.value);

      // Check for existing user
      const existing = await prisma.user.findFirst({
        where: { email, organizationId: orgId },
      });

      if (existing) {
        res.status(409).json({
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: `User with userName "${email}" already exists`,
          scimType: 'uniqueness',
          status: '409',
        });
        return;
      }

      const displayName = name
        ? `${name.givenName || ''} ${name.familyName || ''}`.trim()
        : email.split('@')[0];

      const user = await prisma.user.create({
        data: {
          email,
          name: displayName || email,
          passwordHash: null, // SCIM-provisioned users do not have passwords
          role: 'viewer',
          organizationId: orgId,
          emailVerified: true,
          active: active !== undefined ? active : true,
          employeeId: externalId || null,
          jobTitle: title || null,
          department: department || null,
        },
      });

      res.status(201).json(toSCIMUser(user, baseUrl));
    } catch (error) {
      logger.error('SCIM create user failed', {
        err: error,
        endpoint: req.path,
        method: req.method,
        userId: req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to create user', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// GET USER
// ============================================================================

router.get(
  '/v2/Users/:id',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const scimReq = req as SCIMAuthRequest;
    const orgId = scimReq.scimOrgId!;
    const baseUrl = getBaseUrl(req);

    try {
      const user = await prisma.user.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!user) {
        res.status(404).json({
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'User not found',
          status: '404',
        });
        return;
      }

      res.json(toSCIMUser(user, baseUrl));
    } catch (error) {
      logger.error('SCIM get user failed', {
        err: error,
        endpoint: req.path,
        method: req.method,
        userId: req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to get user', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// REPLACE USER (PUT)
// ============================================================================

router.put(
  '/v2/Users/:id',
  validateBody(scimReplaceUserSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const scimReq = req as SCIMAuthRequest;
    const orgId = scimReq.scimOrgId!;
    const baseUrl = getBaseUrl(req);

    try {
      const existing = await prisma.user.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        res.status(404).json({
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'User not found',
          status: '404',
        });
        return;
      }

      const { userName, name, emails, active, externalId, title, department } = req.body;

      const email = userName || (emails && emails[0]?.value) || existing.email;
      const displayName = name
        ? `${name.givenName || ''} ${name.familyName || ''}`.trim()
        : existing.name;

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          email,
          name: displayName || existing.name,
          active: active !== undefined ? active : existing.active,
          employeeId: externalId || existing.employeeId,
          jobTitle: title || existing.jobTitle,
          department: department || existing.department,
        },
      });

      res.json(toSCIMUser(user, baseUrl));
    } catch (error) {
      logger.error('SCIM replace user failed', {
        err: error,
        endpoint: req.path,
        method: req.method,
        userId: req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to replace user', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// PATCH USER (partial update - SCIM PATCH operations)
// ============================================================================

router.patch(
  '/v2/Users/:id',
  validateBody(scimPatchUserSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const scimReq = req as SCIMAuthRequest;
    const orgId = scimReq.scimOrgId!;
    const baseUrl = getBaseUrl(req);

    try {
      const existing = await prisma.user.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        res.status(404).json({
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'User not found',
          status: '404',
        });
        return;
      }

      const { Operations } = req.body;

      if (!Operations || !Array.isArray(Operations)) {
        res.status(400).json({
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'Operations array is required for PATCH',
          scimType: 'invalidValue',
          status: '400',
        });
        return;
      }

      const updateData: any = {};

      for (const op of Operations) {
        const operation = (op.op || op.Op || '').toLowerCase();
        const path = op.path || op.Path || '';
        const value = op.value !== undefined ? op.value : op.Value;

        if (operation === 'replace' || operation === 'add') {
          if (path === 'active' || path === 'urn:ietf:params:scim:schemas:core:2.0:User:active') {
            updateData.active = typeof value === 'boolean' ? value : value === 'true';
          } else if (path === 'userName') {
            updateData.email = value;
          } else if (path === 'name.givenName') {
            const parts = (existing.name || '').split(' ');
            parts[0] = value;
            updateData.name = parts.join(' ');
          } else if (path === 'name.familyName') {
            const parts = (existing.name || '').split(' ');
            if (parts.length > 1) {
              parts[parts.length - 1] = value;
            } else {
              parts.push(value);
            }
            updateData.name = parts.join(' ');
          } else if (path === 'displayName') {
            updateData.name = value;
          } else if (path === 'title') {
            updateData.jobTitle = value;
          } else if (path === 'department') {
            updateData.department = value;
          } else if (path === 'externalId') {
            updateData.employeeId = value;
          } else if (!path && typeof value === 'object') {
            // Bulk replace without path
            if (value.active !== undefined) updateData.active = value.active;
            if (value.userName) updateData.email = value.userName;
            if (value.displayName) updateData.name = value.displayName;
            if (value.title) updateData.jobTitle = value.title;
            if (value.department) updateData.department = value.department;
            if (value.externalId) updateData.employeeId = value.externalId;
          }
        }
        // 'remove' operations are handled as setting to null/false
        if (operation === 'remove') {
          if (path === 'title') updateData.jobTitle = null;
          if (path === 'department') updateData.department = null;
          if (path === 'externalId') updateData.employeeId = null;
        }
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(toSCIMUser(user, baseUrl));
    } catch (error) {
      logger.error('SCIM patch user failed', {
        err: error,
        endpoint: req.path,
        method: req.method,
        userId: req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to update user', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// DEACTIVATE USER (DELETE in SCIM = deactivate, not hard delete)
// ============================================================================

router.delete(
  '/v2/Users/:id',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const scimReq = req as SCIMAuthRequest;
    const orgId = scimReq.scimOrgId!;

    try {
      const existing = await prisma.user.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        res.status(404).json({
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'User not found',
          status: '404',
        });
        return;
      }

      // SCIM DELETE = deactivate, not hard delete
      await prisma.user.update({
        where: { id: req.params.id },
        data: { active: false },
      });

      res.status(204).send();
    } catch (error) {
      logger.error('SCIM deactivate user failed', {
        err: error,
        endpoint: req.path,
        method: req.method,
        userId: req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to deactivate user', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// LIST GROUPS (mapped to user roles)
// ============================================================================

router.get(
  '/v2/Groups',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const scimReq = req as SCIMAuthRequest;
    const orgId = scimReq.scimOrgId!;
    const baseUrl = getBaseUrl(req);

    try {
      const startIndex = Math.max(1, parseInt(req.query.startIndex as string, 10) || 1);
      const count = Math.min(200, Math.max(1, parseInt(req.query.count as string, 10) || 100));

      const filter = req.query.filter as string | undefined;
      const where: any = { organizationId: orgId };

      if (filter) {
        const nameMatch = filter.match(/displayName\s+eq\s+"([^"]+)"/i);
        if (nameMatch) {
          where.name = nameMatch[1];
        }
      }

      const [roles, totalResults] = await Promise.all([
        prisma.customRole.findMany({
          where,
          skip: startIndex - 1,
          take: count,
          include: {
            userRoles: {
              include: {
                user: { select: { id: true, email: true, name: true } },
              },
            },
          },
        }),
        prisma.customRole.count({ where }),
      ]);

      const resources = roles.map((role) => ({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: role.id,
        displayName: role.name,
        members: role.userRoles.map((ur) => ({
          value: ur.user.id,
          display: ur.user.name || ur.user.email,
          $ref: `${baseUrl}/scim/v2/Users/${ur.user.id}`,
        })),
        meta: {
          resourceType: 'Group',
          created: role.createdAt,
          lastModified: role.updatedAt,
          location: `${baseUrl}/scim/v2/Groups/${role.id}`,
        },
      }));

      res.json({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults,
        startIndex,
        itemsPerPage: resources.length,
        Resources: resources,
      });
    } catch (error) {
      logger.error('SCIM list groups failed', {
        err: error,
        endpoint: req.path,
        method: req.method,
        userId: req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to list groups', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// CREATE GROUP
// ============================================================================

router.post(
  '/v2/Groups',
  validateBody(scimCreateGroupSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const scimReq = req as SCIMAuthRequest;
    const orgId = scimReq.scimOrgId!;
    const baseUrl = getBaseUrl(req);

    try {
      const { displayName, members } = req.body;

      if (!displayName) {
        res.status(400).json({
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'displayName is required',
          scimType: 'invalidValue',
          status: '400',
        });
        return;
      }

      // Check for existing role with the same name
      const existing = await prisma.customRole.findFirst({
        where: { organizationId: orgId, name: displayName },
      });

      if (existing) {
        res.status(409).json({
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: `Group with displayName "${displayName}" already exists`,
          scimType: 'uniqueness',
          status: '409',
        });
        return;
      }

      const role = await prisma.customRole.create({
        data: {
          organizationId: orgId,
          name: displayName,
          description: `SCIM-provisioned group: ${displayName}`,
          isSystem: false,
        },
      });

      // Add members if provided. Member userIds come from the IdP payload and
      // are NOT trusted: restrict to users that belong to this SCIM config's
      // organization so a misconfigured/malicious IdP cannot assign roles to
      // users in another tenant.
      if (members && Array.isArray(members) && members.length > 0) {
        const memberIds = members.map((m: any) => m.value).filter(Boolean);
        if (memberIds.length > 0) {
          const orgUsers = await prisma.user.findMany({
            where: { id: { in: memberIds }, organizationId: orgId },
            select: { id: true },
          });
          const validUserIds = orgUsers.map((u) => u.id);
          if (validUserIds.length > 0) {
            await Promise.allSettled(
              validUserIds.map((userId: string) =>
                prisma.userRole.create({
                  data: { userId, roleId: role.id },
                })
              )
            );
          }
        }
      }

      // Fetch the created group with members
      const createdRole = await prisma.customRole.findUnique({
        where: { id: role.id },
        include: {
          userRoles: {
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
          },
        },
      });

      res.status(201).json({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: createdRole!.id,
        displayName: createdRole!.name,
        members: (createdRole!.userRoles || []).map((ur) => ({
          value: ur.user.id,
          display: ur.user.name || ur.user.email,
          $ref: `${baseUrl}/scim/v2/Users/${ur.user.id}`,
        })),
        meta: {
          resourceType: 'Group',
          created: createdRole!.createdAt,
          lastModified: createdRole!.updatedAt,
          location: `${baseUrl}/scim/v2/Groups/${createdRole!.id}`,
        },
      });
    } catch (error) {
      logger.error('SCIM create group failed', {
        err: error,
        endpoint: req.path,
        method: req.method,
        userId: req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to create group', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

export default router;
