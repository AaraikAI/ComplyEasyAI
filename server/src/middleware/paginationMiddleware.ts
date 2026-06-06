/**
 * Pagination Middleware
 *
 * Express middleware that parses, validates, and attaches pagination parameters
 * from request query strings. Provides a consistent pagination interface for
 * all route handlers via req.pagination.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  PaginationParams,
  PaginatedResponse,
  validatePaginationParams,
  getPaginationFromQuery,
  buildPaginatedResponse,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from '../utils/pagination';
import logger from '../config/logger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Validated pagination parameters attached to the request object.
 * All values are guaranteed to be safe integers within acceptable bounds.
 */
export interface ValidatedPagination {
  /** Zero-indexed page number (always >= 0) */
  page: number;
  /** Number of items per page (always between MIN_PAGE_SIZE and MAX_PAGE_SIZE) */
  pageSize: number;
  /** Number of items to skip for Prisma queries */
  skip: number;
  /** Number of items to take for Prisma queries */
  take: number;
  /** Sort field name, if provided */
  sortBy?: string;
  /** Sort direction, defaults to 'desc' when sortBy is present */
  sortOrder: 'asc' | 'desc';
  /** Prisma-compatible orderBy clause, or undefined if no sortBy was specified */
  orderBy?: Record<string, 'asc' | 'desc'>;
  /** Raw parsed params before validation (useful for forwarding) */
  raw: PaginationParams;
}

/**
 * Extended Express Request with pagination parameters attached.
 */
export interface PaginatedRequest extends Request {
  pagination: ValidatedPagination;
}

/**
 * Configuration options for the pagination middleware.
 */
export interface PaginationMiddlewareOptions {
  /** Default page size when none is provided (clamped to MAX_PAGE_SIZE). Defaults to DEFAULT_PAGE_SIZE (20). */
  defaultPageSize?: number;
  /** Maximum allowed page size for this route. Clamped to global MAX_PAGE_SIZE (100). */
  maxPageSize?: number;
  /** Allowed sort fields. If provided, sortBy values not in this list are rejected. */
  allowedSortFields?: string[];
  /** Default sort field when none is provided. */
  defaultSortBy?: string;
  /** Default sort order when none is provided. Defaults to 'desc'. */
  defaultSortOrder?: 'asc' | 'desc';
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Safely parses a query parameter string to a non-negative integer.
 * Returns undefined if the value is missing, empty, NaN, or negative.
 */
function safeParseInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const str = String(value).trim();
  const parsed = Number(str);

  // Reject NaN, Infinity, non-integer values
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return undefined;
  }

  return parsed;
}

/**
 * Validates that a sortBy field is in the allowed list.
 * Returns the field name if valid, or undefined if not allowed.
 */
function validateSortField(
  sortBy: string | undefined,
  allowedFields: string[] | undefined
): string | undefined {
  if (!sortBy) {
    return undefined;
  }

  // Prevent injection: sortBy must be a simple alphanumeric field name
  // (may include underscores and dots for nested fields)
  if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(sortBy)) {
    logger.warn(`[PaginationMiddleware] Rejected invalid sortBy field: "${sortBy}"`);
    return undefined;
  }

  // Deny-all by default: without an explicit allowlist no sortBy value is
  // permitted to reach Prisma's orderBy. Routes that support sorting must
  // opt in by passing allowedSortFields.
  if (!allowedFields || allowedFields.length === 0) {
    if (sortBy) {
      logger.debug(
        `[PaginationMiddleware] Ignoring sortBy "${sortBy}": no allowedSortFields configured for this route`
      );
    }
    return undefined;
  }

  if (!allowedFields.includes(sortBy)) {
    logger.debug(
      `[PaginationMiddleware] sortBy "${sortBy}" not in allowed fields: [${allowedFields.join(', ')}]`
    );
    return undefined;
  }

  return sortBy;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Express middleware that parses pagination query parameters and attaches
 * validated pagination data to `req.pagination`.
 *
 * Supports the following query parameters:
 *   - page (number, 0-indexed, defaults to 0)
 *   - pageSize (number, defaults to 20, capped at 100)
 *   - sortBy (string, optional field name)
 *   - sortOrder ('asc' | 'desc', defaults to 'desc')
 *
 * Usage:
 * ```typescript
 * // Apply to all routes in a router
 * router.use(paginationMiddleware());
 *
 * // Apply to a specific route with custom options
 * router.get('/users', paginationMiddleware({
 *   defaultPageSize: 25,
 *   maxPageSize: 50,
 *   allowedSortFields: ['name', 'email', 'createdAt'],
 *   defaultSortBy: 'createdAt',
 * }), userController.list);
 *
 * // In the route handler
 * const handler = (req: PaginatedRequest, res: Response) => {
 *   const { skip, take, orderBy } = req.pagination;
 *   // Use with Prisma...
 * };
 * ```
 */
export function paginationMiddleware(options?: PaginationMiddlewareOptions): RequestHandler {
  const opts: Required<PaginationMiddlewareOptions> = {
    defaultPageSize: Math.min(options?.defaultPageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    maxPageSize: Math.min(options?.maxPageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE),
    allowedSortFields: options?.allowedSortFields ?? [],
    defaultSortBy: options?.defaultSortBy ?? '',
    defaultSortOrder: options?.defaultSortOrder ?? 'desc',
  };

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Parse raw query parameters
      const rawPage = safeParseInt(req.query.page);
      const rawPageSize = safeParseInt(req.query.pageSize);
      const rawSortBy = req.query.sortBy as string | undefined;
      const rawSortOrder = req.query.sortOrder as string | undefined;

      // Validate page: must be >= 0, default to 0
      const page = Math.max(0, Math.floor(rawPage ?? 0));

      // Validate pageSize: clamp between MIN_PAGE_SIZE and the route's maxPageSize
      let pageSize: number;
      if (rawPageSize !== undefined) {
        pageSize = Math.max(MIN_PAGE_SIZE, Math.min(opts.maxPageSize, rawPageSize));
      } else {
        pageSize = opts.defaultPageSize;
      }

      // Validate sortBy: check against allowed fields and sanitize
      const sortBy = validateSortField(rawSortBy, opts.allowedSortFields) || opts.defaultSortBy || undefined;

      // Validate sortOrder: must be 'asc' or 'desc'
      let sortOrder: 'asc' | 'desc';
      if (rawSortOrder === 'asc' || rawSortOrder === 'desc') {
        sortOrder = rawSortOrder;
      } else {
        sortOrder = opts.defaultSortOrder;
      }

      // Calculate Prisma skip/take
      const skip = page * pageSize;
      const take = pageSize;

      // Build orderBy clause for Prisma
      let orderBy: Record<string, 'asc' | 'desc'> | undefined;
      if (sortBy) {
        orderBy = { [sortBy]: sortOrder };
      }

      // Build the raw params object (for forwarding to paginatedQuery)
      const raw: PaginationParams = {
        page: rawPage,
        pageSize: rawPageSize,
        sortBy: rawSortBy,
        sortOrder: rawSortOrder === 'asc' || rawSortOrder === 'desc' ? rawSortOrder : undefined,
      };

      // Attach to request
      const paginatedReq = req as PaginatedRequest;
      paginatedReq.pagination = {
        page,
        pageSize,
        skip,
        take,
        sortBy,
        sortOrder,
        orderBy,
        raw,
      };

      next();
    } catch (error) {
      // If something unexpected happens, fall back to safe defaults
      logger.error('[PaginationMiddleware] Error parsing pagination params, using defaults', error);

      const paginatedReq = req as PaginatedRequest;
      paginatedReq.pagination = {
        page: 0,
        pageSize: DEFAULT_PAGE_SIZE,
        skip: 0,
        take: DEFAULT_PAGE_SIZE,
        sortOrder: 'desc',
        raw: {},
      };

      next();
    }
  };
}

// ============================================================================
// RESPONSE HELPER
// ============================================================================

/**
 * Helper function that route handlers can use to build a standardized
 * paginated response from the request's pagination params and query results.
 *
 * Usage:
 * ```typescript
 * const handler = async (req: PaginatedRequest, res: Response) => {
 *   const { skip, take, orderBy } = req.pagination;
 *
 *   const [items, total] = await Promise.all([
 *     prisma.user.findMany({ where, skip, take, orderBy }),
 *     prisma.user.count({ where }),
 *   ]);
 *
 *   res.json(buildPaginatedResult(req, items, total));
 * };
 * ```
 */
export function buildPaginatedResult<T>(
  req: PaginatedRequest,
  data: T[],
  totalItems: number
): PaginatedResponse<T> {
  return buildPaginatedResponse(data, totalItems, req.pagination.page, req.pagination.pageSize);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default paginationMiddleware;
