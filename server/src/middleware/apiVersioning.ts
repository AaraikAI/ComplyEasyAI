/**
 * API Versioning Middleware
 *
 * Supports URL path versioning (/api/v1/..., /api/v2/...) and
 * header-based versioning (X-API-Version header). Provides version
 * detection, deprecation warnings, and per-version route restriction.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import logger from '../config/logger';

// ============================================================================
// TYPES
// ============================================================================

export type ApiVersion = 'v1' | 'v2';

export interface VersionedRequest extends Request {
  apiVersion: ApiVersion;
  apiVersionSource: 'url' | 'header' | 'default';
}

export interface VersionConfig {
  /** Currently supported versions */
  supported: ApiVersion[];
  /** Default version when none specified */
  default: ApiVersion;
  /** Deprecated versions that still work but emit warnings */
  deprecated: ApiVersion[];
  /** Sunset date for deprecated versions (ISO string) */
  sunsetDates: Partial<Record<ApiVersion, string>>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const VERSION_CONFIG: VersionConfig = {
  supported: ['v1', 'v2'],
  default: 'v1',
  deprecated: [],
  sunsetDates: {},
};

const VALID_VERSIONS = new Set<string>(VERSION_CONFIG.supported);
const DEPRECATED_VERSIONS = new Set<string>(VERSION_CONFIG.deprecated);

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Main API versioning middleware.
 *
 * Detects the API version from:
 * 1. URL path prefix (/api/v1/..., /api/v2/...)
 * 2. X-API-Version header
 * 3. Falls back to default version (v1)
 *
 * Attaches `req.apiVersion` and `req.apiVersionSource` to the request.
 * Adds deprecation warnings for deprecated versions.
 */
export function apiVersioningMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const versionedReq = req as VersionedRequest;
    let version: ApiVersion | undefined;
    let source: 'url' | 'header' | 'default' = 'default';

    // 1. Check URL path for version prefix
    const pathMatch = req.path.match(/^\/v([12])\//);
    if (pathMatch) {
      const urlVersion = `v${pathMatch[1]}` as ApiVersion;
      if (VALID_VERSIONS.has(urlVersion)) {
        version = urlVersion;
        source = 'url';
      }
    }

    // 2. Check X-API-Version header (overrides URL if provided)
    if (!version) {
      const headerVersion = req.headers['x-api-version'] as string | undefined;
      if (headerVersion) {
        const normalizedHeader = headerVersion.toLowerCase().startsWith('v')
          ? headerVersion.toLowerCase()
          : `v${headerVersion}`;
        if (VALID_VERSIONS.has(normalizedHeader)) {
          version = normalizedHeader as ApiVersion;
          source = 'header';
        } else {
          logger.warn(`[APIVersioning] Invalid version in header: "${headerVersion}", falling back to default`);
        }
      }
    }

    // 3. Fall back to default
    if (!version) {
      version = VERSION_CONFIG.default;
      source = 'default';
    }

    // Attach to request
    versionedReq.apiVersion = version;
    versionedReq.apiVersionSource = source;

    // Set response header to indicate active version
    res.setHeader('X-API-Version', version);

    // Add deprecation warning if applicable
    if (DEPRECATED_VERSIONS.has(version)) {
      const sunsetDate = VERSION_CONFIG.sunsetDates[version];
      res.setHeader('Deprecation', 'true');
      if (sunsetDate) {
        res.setHeader('Sunset', sunsetDate);
      }
      res.setHeader(
        'X-API-Deprecation-Notice',
        `API ${version} is deprecated. Please migrate to ${VERSION_CONFIG.supported[VERSION_CONFIG.supported.length - 1]}.`
      );
      logger.info(`[APIVersioning] Deprecated version ${version} used by ${req.ip} for ${req.method} ${req.path}`);
    }

    next();
  };
}

/**
 * Middleware factory that restricts an endpoint to specific API versions.
 *
 * Usage:
 * ```typescript
 * router.get('/new-feature', requireVersion('v2'), handler);
 * router.get('/legacy', requireVersion('v1', 'v2'), handler);
 * ```
 */
export function requireVersion(...versions: ApiVersion[]): RequestHandler {
  const allowedVersions = new Set(versions);

  return (req: Request, res: Response, next: NextFunction): void => {
    const versionedReq = req as VersionedRequest;
    const currentVersion = versionedReq.apiVersion || VERSION_CONFIG.default;

    if (!allowedVersions.has(currentVersion)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VERSION_NOT_SUPPORTED',
          message: `This endpoint requires API version ${versions.join(' or ')}. Current version: ${currentVersion}`,
          supportedVersions: versions,
          currentVersion,
        },
      });
      return;
    }

    next();
  };
}

/**
 * V2 response envelope middleware.
 * Wraps responses in the standardized v2 format:
 * { success: true, data: T, meta: { version, timestamp, requestId } }
 */
export function v2ResponseEnvelope(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const versionedReq = req as VersionedRequest;

    if (versionedReq.apiVersion !== 'v2') {
      next();
      return;
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to wrap in v2 envelope
    res.json = function (body: any) {
      // Don't double-wrap if already in envelope format
      if (body && body.meta && body.meta.version === 'v2') {
        return originalJson(body);
      }

      // Don't wrap error responses (they have their own format)
      if (body && body.success === false && body.error) {
        return originalJson(body);
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const envelope = {
        success: true,
        data: body?.data !== undefined ? body.data : body,
        ...(body?.pagination && { pagination: body.pagination }),
        meta: {
          version: 'v2',
          timestamp: new Date().toISOString(),
          requestId,
          ...(body?.pagination && {
            page: body.pagination.page,
            pageSize: body.pagination.pageSize,
            totalItems: body.pagination.totalItems,
            totalPages: body.pagination.totalPages,
          }),
        },
      };

      return originalJson(envelope);
    } as any;

    next();
  };
}

/**
 * Extracts the path after the version prefix.
 * /api/v1/vendors -> /vendors
 * /api/v2/risks -> /risks
 */
export function stripVersionPrefix(path: string): string {
  return path.replace(/^\/v[12]/, '');
}

export default {
  apiVersioningMiddleware,
  requireVersion,
  v2ResponseEnvelope,
  stripVersionPrefix,
  VERSION_CONFIG,
};
