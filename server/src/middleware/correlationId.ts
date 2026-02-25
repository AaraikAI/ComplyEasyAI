/**
 * Correlation ID Middleware
 *
 * Adds a unique correlation ID to each request for distributed tracing.
 * The ID is passed through to all downstream services and included in logs.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Header name for correlation ID (standard headers)
export const CORRELATION_ID_HEADER = 'X-Correlation-ID';
export const REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * Extended request type with correlation ID
 */
export interface CorrelatedRequest extends Request {
  correlationId: string;
  requestId: string;
}

/**
 * Middleware that attaches correlation and request IDs to incoming requests.
 *
 * - correlationId: Identifies the full trace across services (passed from upstream or generated)
 * - requestId: Unique identifier for this specific request
 *
 * Usage:
 * ```typescript
 * app.use(correlationIdMiddleware());
 *
 * // In route handlers
 * const handler = (req: CorrelatedRequest, res: Response) => {
 *   logger.info('Processing request', { correlationId: req.correlationId });
 * };
 * ```
 */
export function correlationIdMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const correlatedReq = req as CorrelatedRequest;

    // Use existing correlation ID from upstream service or generate new one
    const correlationId = (req.headers[CORRELATION_ID_HEADER.toLowerCase()] as string)
      || (req.headers['x-correlation-id'] as string)
      || uuidv4();

    // Always generate a new request ID for this specific request
    const requestId = uuidv4();

    // Attach to request object
    correlatedReq.correlationId = correlationId;
    correlatedReq.requestId = requestId;

    // Set response headers for client tracing
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    res.setHeader(REQUEST_ID_HEADER, requestId);

    // Add to response locals for use in templates/views
    res.locals.correlationId = correlationId;
    res.locals.requestId = requestId;

    next();
  };
}

/**
 * Helper function to get correlation ID from a request
 */
export function getCorrelationId(req: Request): string {
  return (req as CorrelatedRequest).correlationId || 'unknown';
}

/**
 * Helper function to get request ID from a request
 */
export function getRequestId(req: Request): string {
  return (req as CorrelatedRequest).requestId || 'unknown';
}

/**
 * Creates headers object with correlation ID for outgoing HTTP requests
 */
export function getTracingHeaders(req: Request): Record<string, string> {
  const correlatedReq = req as CorrelatedRequest;
  return {
    [CORRELATION_ID_HEADER]: correlatedReq.correlationId || 'unknown',
    [REQUEST_ID_HEADER]: correlatedReq.requestId || 'unknown',
  };
}

export default correlationIdMiddleware;
