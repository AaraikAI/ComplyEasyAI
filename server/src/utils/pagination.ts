/**
 * Pagination Utilities
 * Production-ready pagination helpers for database queries and API responses
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PrismaFindManyArgs {
  skip: number;
  take: number;
  orderBy?: any;
}

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

/**
 * Validates and normalizes pagination parameters
 * Ensures page and pageSize are within acceptable bounds
 */
export function validatePaginationParams(params: PaginationParams): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  orderBy?: any;
} {
  // Validate and normalize page number (0-indexed)
  const page = Math.max(0, Math.floor(params.page ?? 0));

  // Validate and normalize page size
  let pageSize = Math.floor(params.pageSize ?? DEFAULT_PAGE_SIZE);
  pageSize = Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, pageSize));

  // Calculate skip and take for Prisma
  const skip = page * pageSize;
  const take = pageSize;

  // Build orderBy if sortBy is provided
  let orderBy: any = undefined;
  if (params.sortBy) {
    orderBy = {
      [params.sortBy]: params.sortOrder || 'desc',
    };
  }

  return {
    page,
    pageSize,
    skip,
    take,
    orderBy,
  };
}

/**
 * Builds a paginated response object
 * Calculates pagination metadata from total count
 */
export function buildPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages - 1,
      hasPreviousPage: page > 0,
    },
  };
}

/**
 * Extracts pagination parameters from Express request query
 * Usage: const params = getPaginationFromQuery(req.query);
 */
export function getPaginationFromQuery(query: any): PaginationParams {
  return {
    page: query.page !== undefined ? parseInt(query.page, 10) : undefined,
    pageSize: query.pageSize !== undefined ? parseInt(query.pageSize, 10) : undefined,
    sortBy: query.sortBy as string,
    sortOrder: query.sortOrder === 'asc' || query.sortOrder === 'desc' ? query.sortOrder : undefined,
  };
}

/**
 * Helper function to perform paginated Prisma query with count
 * Automatically handles skip/take and total count
 *
 * Example usage:
 * ```typescript
 * const result = await paginatedQuery(
 *   prisma.vendor.findMany,
 *   prisma.vendor.count,
 *   { where: { organizationId } },
 *   req.query
 * );
 * res.json(result);
 * ```
 */
export async function paginatedQuery<T>(
  findManyFn: (args: any) => Promise<T[]>,
  countFn: (args: any) => Promise<number>,
  baseArgs: any,
  queryParams: any
): Promise<PaginatedResponse<T>> {
  const paginationParams = getPaginationFromQuery(queryParams);
  const { page, pageSize, skip, take, orderBy } = validatePaginationParams(paginationParams);

  // Build Prisma query args
  const queryArgs = {
    ...baseArgs,
    skip,
    take,
    ...(orderBy && { orderBy }),
  };

  // Count args (same as query args but without pagination)
  const countArgs = {
    where: baseArgs.where,
  };

  // Execute queries in parallel
  const [data, totalItems] = await Promise.all([
    findManyFn(queryArgs),
    countFn(countArgs),
  ]);

  return buildPaginatedResponse(data, totalItems, page, pageSize);
}

/**
 * Cursor-based pagination helper (for very large datasets)
 * More efficient than offset-based pagination for large datasets
 *
 * Example usage:
 * ```typescript
 * const result = await cursorPaginatedQuery(
 *   prisma.auditLog.findMany,
 *   prisma.auditLog.count,
 *   { where: { organizationId }, orderBy: { createdAt: 'desc' } },
 *   req.query.cursor,
 *   req.query.pageSize
 * );
 * ```
 */
export async function cursorPaginatedQuery<T extends { id: string }>(
  findManyFn: (args: any) => Promise<T[]>,
  countFn: (args: any) => Promise<number>,
  baseArgs: any,
  cursor?: string,
  pageSizeParam?: number
): Promise<{
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalItems: number;
}> {
  const pageSize = Math.min(pageSizeParam || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  // Build query args with cursor
  const queryArgs = {
    ...baseArgs,
    take: pageSize + 1, // Fetch one extra to check if there are more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor itself
    }),
  };

  const countArgs = {
    where: baseArgs.where,
  };

  const [allData, totalItems] = await Promise.all([
    findManyFn(queryArgs),
    countFn(countArgs),
  ]);

  const hasMore = allData.length > pageSize;
  const data = hasMore ? allData.slice(0, pageSize) : allData;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return {
    data,
    nextCursor,
    hasMore,
    totalItems,
  };
}

/**
 * Sets pagination response headers (for HTTP header-based pagination)
 * Usage: setPaginationHeaders(res, totalItems, page, pageSize);
 */
export function setPaginationHeaders(
  res: any,
  totalItems: number,
  page: number,
  pageSize: number
): void {
  const totalPages = Math.ceil(totalItems / pageSize);

  res.setHeader('X-Total-Count', totalItems.toString());
  res.setHeader('X-Page', page.toString());
  res.setHeader('X-Page-Size', pageSize.toString());
  res.setHeader('X-Total-Pages', totalPages.toString());
}

export default {
  validatePaginationParams,
  buildPaginatedResponse,
  getPaginationFromQuery,
  paginatedQuery,
  cursorPaginatedQuery,
  setPaginationHeaders,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
};
