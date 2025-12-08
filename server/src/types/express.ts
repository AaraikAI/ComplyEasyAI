import { Request, Response, NextFunction } from 'express';

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
 * Supports both 2-param (controller) and 3-param (middleware) signatures
 */
export const asyncHandler = (
  fn: ((req: any, res: Response, next?: NextFunction) => Promise<any>) | ((req: any, res: Response) => Promise<any>)
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wraps authenticated async route handlers
 */
export const authAsyncHandler = (
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};
