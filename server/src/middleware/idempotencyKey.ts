/**
 * Idempotency-Key Middleware
 *
 * Caches the first successful response for a given `Idempotency-Key` header and
 * replays it on subsequent identical requests so side-effect operations
 * (notice creation, retention job runs, deletion execution) are safe to retry.
 *
 * Scope key:   userId + route + key  (so two users can reuse the same key)
 * Storage:     cacheService (Redis-backed, in-memory fallback)
 * TTL:         24h by default — long enough to cover client retries
 * Replay:      only 2xx responses are cached. Errors are NOT cached so a failed
 *              attempt can be retried with the same key.
 */
import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cache/redisCacheService';
import logger from '../config/logger';

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;
const KEY_MAX_LENGTH = 255;

interface CachedResponse {
  statusCode: number;
  body: unknown;
}

interface IdempotencyOptions {
  /** TTL in seconds for the cached response. Defaults to 24 hours. */
  ttl?: number;
  /** When true (default), absence of the header is allowed and the handler runs normally. When false, missing header → 400. */
  optional?: boolean;
}

export function idempotencyKey(options: IdempotencyOptions = {}) {
  const ttl = options.ttl ?? DEFAULT_TTL_SECONDS;
  const optional = options.optional ?? true;

  return async function idempotencyKeyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const headerValue = req.headers['idempotency-key'];
    const key = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!key) {
      if (!optional) {
        res.status(400).json({ error: 'Idempotency-Key header is required for this endpoint' });
        return;
      }
      next();
      return;
    }

    if (typeof key !== 'string' || key.length === 0 || key.length > KEY_MAX_LENGTH) {
      res.status(400).json({ error: 'Idempotency-Key must be a non-empty string under 256 chars' });
      return;
    }

    const authReq = req as Request & { user?: { id?: string } };
    const userScope = authReq.user?.id ?? 'anonymous';
    const routeKey = `${req.method}:${req.baseUrl}${req.path}`;
    const cacheKey = `idempotency:${userScope}:${routeKey}:${key}`;

    try {
      const cached = await cacheService.get<CachedResponse>(cacheKey);
      if (cached) {
        res.setHeader('Idempotent-Replay', 'true');
        res.status(cached.statusCode).json(cached.body);
        return;
      }
    } catch (err) {
      logger.warn('[Idempotency] cache lookup failed; proceeding without replay', err);
    }

    // Intercept res.json so we can cache the successful response body
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown): Response {
      const status = res.statusCode;
      if (status >= 200 && status < 300) {
        cacheService
          .set(cacheKey, { statusCode: status, body }, { ttl })
          .catch((err) => logger.warn('[Idempotency] cache write failed', err));
      }
      return originalJson(body);
    };

    next();
  };
}

export default idempotencyKey;
