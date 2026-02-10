/**
 * Pagination Applier
 *
 * High-level utilities for applying pagination to Prisma model delegates
 * and in-memory collections. Builds on top of the core pagination utilities
 * to provide a single-call interface for paginated queries.
 */

import {
  PaginationParams,
  PaginatedResponse,
  validatePaginationParams,
  getPaginationFromQuery,
  buildPaginatedResponse,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from './pagination';
import logger from '../config/logger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents the minimum interface of a Prisma model delegate
 * that supports findMany and count operations. This is compatible
 * with any Prisma model (e.g., prisma.user, prisma.vendor, etc.).
 */
export interface PrismaModelDelegate {
  findMany(args?: any): Promise<any[]>;
  count(args?: any): Promise<number>;
}

/**
 * Options for applyPaginationToModel that control query behavior
 * beyond the basic where clause and pagination params.
 */
export interface PaginationModelOptions {
  /**
   * Prisma include clause for eager-loading relations.
   * Example: { assessments: true, reviews: { take: 5 } }
   */
  include?: Record<string, any>;

  /**
   * Prisma select clause for field selection.
   * Cannot be used together with include (Prisma limitation).
   * Example: { id: true, name: true, email: true }
   */
  select?: Record<string, any>;

  /**
   * Override the orderBy derived from pagination params.
   * When provided, this takes precedence over sortBy/sortOrder
   * from the query parameters. Useful for enforcing a default sort.
   * Example: { createdAt: 'desc' } or [{ priority: 'desc' }, { createdAt: 'asc' }]
   */
  orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;

  /**
   * Default sort field to use when no sortBy is provided in query params.
   * Only used if orderBy override is not set.
   */
  defaultSortBy?: string;

  /**
   * Default sort order to use when no sortOrder is provided in query params.
   * Only used if orderBy override is not set. Defaults to 'desc'.
   */
  defaultSortOrder?: 'asc' | 'desc';

  /**
   * Allowed sort fields. If provided, sortBy values not in this list
   * will be silently ignored and the default sort will be used instead.
   * Prevents clients from sorting on arbitrary or non-indexed fields.
   */
  allowedSortFields?: string[];

  /**
   * Additional Prisma query arguments to spread into the findMany call.
   * Useful for passing things like `distinct`, `cursor`, etc.
   */
  additionalArgs?: Record<string, any>;
}

/**
 * Options for in-memory pagination of already-fetched data.
 */
export interface RawPaginationOptions {
  /**
   * Sort comparator function for in-memory sorting.
   * If not provided, data is paginated in its existing order.
   */
  sortFn?: (a: any, b: any) => number;

  /**
   * A custom filter function applied before pagination.
   * Useful for applying filters that were not part of the original query.
   */
  filterFn?: (item: any) => boolean;
}

// ============================================================================
// MODEL PAGINATION
// ============================================================================

/**
 * Applies pagination to a Prisma model delegate, executing both findMany
 * and count in parallel and returning a standardized PaginatedResponse.
 *
 * This is the primary function for paginating database queries. It:
 * 1. Parses and validates pagination params from query string or PaginationParams
 * 2. Builds Prisma findMany args with skip, take, orderBy, include/select
 * 3. Executes findMany and count in parallel for optimal performance
 * 4. Returns a PaginatedResponse with data and pagination metadata
 *
 * @param model - A Prisma model delegate (e.g., prisma.vendor, prisma.user)
 * @param where - Prisma where clause for filtering
 * @param queryParams - Express req.query object or PaginationParams
 * @param options - Optional configuration for includes, selects, and sorting
 * @returns PaginatedResponse containing data array and pagination metadata
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await applyPaginationToModel(
 *   prisma.vendor,
 *   { organizationId: 'org-123' },
 *   req.query
 * );
 *
 * // With includes and sorting
 * const result = await applyPaginationToModel(
 *   prisma.vendor,
 *   { organizationId: 'org-123', status: 'Active' },
 *   req.query,
 *   {
 *     include: { assessments: { take: 1, orderBy: { createdAt: 'desc' } } },
 *     defaultSortBy: 'riskScore',
 *     defaultSortOrder: 'desc',
 *     allowedSortFields: ['name', 'riskScore', 'createdAt', 'status'],
 *   }
 * );
 *
 * // With select (field selection)
 * const result = await applyPaginationToModel(
 *   prisma.user,
 *   { organizationId: 'org-123' },
 *   req.query,
 *   { select: { id: true, name: true, email: true, role: true } }
 * );
 *
 * // With a forced orderBy (ignores client sortBy/sortOrder)
 * const result = await applyPaginationToModel(
 *   prisma.auditLog,
 *   { organizationId: 'org-123' },
 *   req.query,
 *   { orderBy: { createdAt: 'desc' } }
 * );
 * ```
 */
export async function applyPaginationToModel<T = any>(
  model: PrismaModelDelegate,
  where: Record<string, any>,
  queryParams: Record<string, any> | PaginationParams,
  options?: PaginationModelOptions
): Promise<PaginatedResponse<T>> {
  // Step 1: Parse and validate pagination parameters
  const rawParams = isPaginationParams(queryParams)
    ? queryParams
    : getPaginationFromQuery(queryParams);

  // Apply defaults from options
  if (!rawParams.sortBy && options?.defaultSortBy) {
    rawParams.sortBy = options.defaultSortBy;
  }
  if (!rawParams.sortOrder && options?.defaultSortOrder) {
    rawParams.sortOrder = options.defaultSortOrder;
  }

  // Validate sortBy against allowed fields
  if (rawParams.sortBy && options?.allowedSortFields && options.allowedSortFields.length > 0) {
    if (!options.allowedSortFields.includes(rawParams.sortBy)) {
      logger.debug(
        `[PaginationApplier] sortBy "${rawParams.sortBy}" not in allowed fields, falling back to default`
      );
      rawParams.sortBy = options.defaultSortBy;
    }
  }

  const validated = validatePaginationParams(rawParams);

  // Step 2: Determine orderBy
  // Priority: options.orderBy override > validated.orderBy from params > undefined
  let orderBy: any = options?.orderBy ?? validated.orderBy;

  // Step 3: Build findMany args
  const findManyArgs: Record<string, any> = {
    where,
    skip: validated.skip,
    take: validated.take,
    ...(options?.additionalArgs || {}),
  };

  // Prisma does not allow include and select at the same time
  if (options?.select) {
    findManyArgs.select = options.select;
  } else if (options?.include) {
    findManyArgs.include = options.include;
  }

  if (orderBy) {
    findManyArgs.orderBy = orderBy;
  }

  // Step 4: Build count args (only needs where)
  const countArgs: Record<string, any> = { where };

  // Step 5: Execute queries in parallel
  let data: T[];
  let totalItems: number;

  try {
    [data, totalItems] = await Promise.all([
      model.findMany(findManyArgs) as Promise<T[]>,
      model.count(countArgs),
    ]);
  } catch (error) {
    logger.error('[PaginationApplier] Database query failed', error);
    throw error;
  }

  // Step 6: Build and return paginated response
  return buildPaginatedResponse(data, totalItems, validated.page, validated.pageSize);
}

// ============================================================================
// RAW / IN-MEMORY PAGINATION
// ============================================================================

/**
 * Applies pagination to an already-fetched array of items (in-memory pagination).
 *
 * Use this when you already have the full dataset in memory and need to
 * return a paginated slice. This is useful for:
 * - Aggregated data that was computed in application code
 * - Results from external APIs that don't support pagination
 * - Complex queries where the data was already fetched for processing
 * - Transformed datasets that don't map directly to a single model
 *
 * @param items - The complete array of items to paginate
 * @param queryParams - Express req.query object or PaginationParams
 * @param options - Optional sorting and filtering configuration
 * @returns PaginatedResponse containing the paginated slice and metadata
 *
 * @example
 * ```typescript
 * // Basic in-memory pagination
 * const allItems = await fetchFromExternalApi();
 * const result = applyPaginationToRawQuery(allItems, req.query);
 *
 * // With custom sort and filter
 * const result = applyPaginationToRawQuery(allItems, req.query, {
 *   sortFn: (a, b) => b.riskScore - a.riskScore,
 *   filterFn: (item) => item.status === 'active',
 * });
 *
 * // With explicit PaginationParams
 * const result = applyPaginationToRawQuery(items, { page: 0, pageSize: 10 });
 * ```
 */
export function applyPaginationToRawQuery<T = any>(
  items: T[],
  queryParams: Record<string, any> | PaginationParams,
  options?: RawPaginationOptions
): PaginatedResponse<T> {
  // Handle null/undefined items gracefully
  if (!items || !Array.isArray(items)) {
    logger.warn('[PaginationApplier] applyPaginationToRawQuery called with non-array items, returning empty result');
    const validated = validatePaginationParams(
      isPaginationParams(queryParams) ? queryParams : getPaginationFromQuery(queryParams)
    );
    return buildPaginatedResponse<T>([], 0, validated.page, validated.pageSize);
  }

  // Step 1: Apply optional filter
  let filtered: T[] = items;
  if (options?.filterFn) {
    try {
      filtered = items.filter(options.filterFn);
    } catch (error) {
      logger.error('[PaginationApplier] Filter function threw an error, using unfiltered items', error);
      filtered = items;
    }
  }

  // Step 2: Apply optional sort
  if (options?.sortFn) {
    try {
      // Sort a copy to avoid mutating the original array
      filtered = [...filtered].sort(options.sortFn);
    } catch (error) {
      logger.error('[PaginationApplier] Sort function threw an error, using unsorted items', error);
    }
  }

  // Step 3: Parse and validate pagination params
  const rawParams = isPaginationParams(queryParams)
    ? queryParams
    : getPaginationFromQuery(queryParams);

  const validated = validatePaginationParams(rawParams);

  // Step 4: Slice the data
  const totalItems = filtered.length;
  const start = Math.min(validated.skip, totalItems);
  const end = Math.min(start + validated.take, totalItems);
  const paginatedData = filtered.slice(start, end);

  // Step 5: Build response
  return buildPaginatedResponse(paginatedData, totalItems, validated.page, validated.pageSize);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates a reusable paginator bound to a specific Prisma model.
 * Useful when you frequently paginate the same model across multiple handlers.
 *
 * @param model - A Prisma model delegate
 * @param defaultOptions - Default options applied to every query (can be overridden per-call)
 * @returns A function that takes (where, queryParams, options?) and returns PaginatedResponse
 *
 * @example
 * ```typescript
 * // In a service file
 * const paginateVendors = createModelPaginator(prisma.vendor, {
 *   include: { assessments: { take: 1, orderBy: { createdAt: 'desc' } } },
 *   defaultSortBy: 'riskScore',
 *   defaultSortOrder: 'desc',
 *   allowedSortFields: ['name', 'riskScore', 'createdAt'],
 * });
 *
 * // In a route handler
 * const result = await paginateVendors(
 *   { organizationId: 'org-123', status: 'Active' },
 *   req.query
 * );
 * ```
 */
export function createModelPaginator<T = any>(
  model: PrismaModelDelegate,
  defaultOptions?: PaginationModelOptions
): (
  where: Record<string, any>,
  queryParams: Record<string, any> | PaginationParams,
  options?: PaginationModelOptions
) => Promise<PaginatedResponse<T>> {
  return (
    where: Record<string, any>,
    queryParams: Record<string, any> | PaginationParams,
    options?: PaginationModelOptions
  ) => {
    // Merge default options with per-call options (per-call takes precedence)
    const mergedOptions: PaginationModelOptions = {
      ...defaultOptions,
      ...options,
      // Deep merge include/select if both are provided
      include: options?.include ?? defaultOptions?.include,
      select: options?.select ?? defaultOptions?.select,
      additionalArgs: {
        ...(defaultOptions?.additionalArgs || {}),
        ...(options?.additionalArgs || {}),
      },
    };

    return applyPaginationToModel<T>(model, where, queryParams, mergedOptions);
  };
}

/**
 * Applies pagination to a Prisma model and also sets standard pagination
 * HTTP headers on the response. Combines applyPaginationToModel with
 * setPaginationHeaders for routes that want both JSON body and header-based
 * pagination info.
 *
 * @param model - A Prisma model delegate
 * @param where - Prisma where clause
 * @param queryParams - Express req.query or PaginationParams
 * @param res - Express Response object for setting headers
 * @param options - Optional model pagination options
 * @returns PaginatedResponse
 *
 * @example
 * ```typescript
 * const result = await applyPaginationWithHeaders(
 *   prisma.vendor,
 *   { organizationId },
 *   req.query,
 *   res,
 *   { include: { monitors: true } }
 * );
 * res.json(result);
 * ```
 */
export async function applyPaginationWithHeaders<T = any>(
  model: PrismaModelDelegate,
  where: Record<string, any>,
  queryParams: Record<string, any> | PaginationParams,
  res: { setHeader(name: string, value: string): void },
  options?: PaginationModelOptions
): Promise<PaginatedResponse<T>> {
  const result = await applyPaginationToModel<T>(model, where, queryParams, options);

  // Set pagination headers
  const { pagination } = result;
  res.setHeader('X-Total-Count', pagination.totalItems.toString());
  res.setHeader('X-Page', pagination.page.toString());
  res.setHeader('X-Page-Size', pagination.pageSize.toString());
  res.setHeader('X-Total-Pages', pagination.totalPages.toString());
  res.setHeader('X-Has-Next-Page', pagination.hasNextPage.toString());
  res.setHeader('X-Has-Previous-Page', pagination.hasPreviousPage.toString());

  return result;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is already a PaginationParams
 * (has numeric page/pageSize) vs. a raw query object (has string values).
 */
function isPaginationParams(obj: any): obj is PaginationParams {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // If page or pageSize are already numbers (not strings), it is PaginationParams.
  // Query params from Express are always strings.
  const hasNumericPage = typeof obj.page === 'number';
  const hasNumericPageSize = typeof obj.pageSize === 'number';
  const hasUndefinedPage = obj.page === undefined;
  const hasUndefinedPageSize = obj.pageSize === undefined;

  // It is PaginationParams if either:
  // - page/pageSize are numbers
  // - page/pageSize are undefined (empty PaginationParams)
  // But NOT if they are strings (query params)
  return (
    (hasNumericPage || hasUndefinedPage) &&
    (hasNumericPageSize || hasUndefinedPageSize) &&
    typeof obj.page !== 'string' &&
    typeof obj.pageSize !== 'string'
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  applyPaginationToModel,
  applyPaginationToRawQuery,
  applyPaginationWithHeaders,
  createModelPaginator,
};
