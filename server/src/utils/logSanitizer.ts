/**
 * Log Sanitization Utility
 * Prevents sensitive data from being logged
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'apiKey',
  'authorization',
  'auth',
  'cookie',
  'session',
  'jwt',
  'privatekey',
  'private_key',
  'privateKey',
  'accesstoken',
  'access_token',
  'accessToken',
  'refreshtoken',
  'refresh_token',
  'refreshToken',
  'ssn',
  'credit_card',
  'creditCard',
  'cvv',
  'pin',
  'otp',
];

/**
 * Sanitize sensitive data from any object
 * @param obj - Object to sanitize
 * @param depth - Maximum recursion depth (prevents circular references)
 * @returns Sanitized object
 */
export function sanitizeForLogging(obj: any, depth: number = 5): any {
  // Prevent infinite recursion
  if (depth <= 0) {
    return '[Max Depth Reached]';
  }

  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Error objects specially
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: process.env.NODE_ENV === 'development' ? obj.stack : '[Redacted in production]',
    };
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, depth - 1));
  }

  // Handle objects
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive data
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
      lowerKey.includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value, depth - 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create a safe logger wrapper that automatically sanitizes all arguments
 * @param logger - Winston or similar logger instance
 * @returns Safe logger with same interface
 */
export function createSafeLogger(logger: any) {
  return {
    debug: (message: string, ...args: any[]) =>
      logger.debug(message, ...args.map(arg => sanitizeForLogging(arg))),

    info: (message: string, ...args: any[]) =>
      logger.info(message, ...args.map(arg => sanitizeForLogging(arg))),

    warn: (message: string, ...args: any[]) =>
      logger.warn(message, ...args.map(arg => sanitizeForLogging(arg))),

    error: (message: string, ...args: any[]) =>
      logger.error(message, ...args.map(arg => sanitizeForLogging(arg))),
  };
}

/**
 * Sanitize request object for logging
 * @param req - Express request object
 * @returns Sanitized request data
 */
export function sanitizeRequest(req: any) {
  return {
    method: req.method,
    url: req.url,
    ip: req.ip,
    headers: sanitizeForLogging({
      ...req.headers,
      authorization: req.headers?.authorization ? '[REDACTED]' : undefined,
      cookie: req.headers?.cookie ? '[REDACTED]' : undefined,
    }),
    body: sanitizeForLogging(req.body),
    query: sanitizeForLogging(req.query),
    params: sanitizeForLogging(req.params),
  };
}
