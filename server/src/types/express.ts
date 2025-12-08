import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async route handler type for Express
 * Properly types async/await handlers and error handling
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Authenticated request with user context
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    organizationId: string;
    role: string;
    email: string;
    name: string;
  };
}

/**
 * Async route handler with authenticated request
 */
export type AuthenticatedAsyncHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps async route handlers to catch errors automatically
 * Supports both controller methods (RequestHandler) and custom async functions
 */
export const asyncHandler = (
  fn: RequestHandler | ((req: Request, res: Response, next?: NextFunction) => Promise<unknown>)
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wraps authenticated async route handlers
 */
export const authAsyncHandler = (
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};
