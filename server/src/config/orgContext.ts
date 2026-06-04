import { AsyncLocalStorage } from 'async_hooks';

/**
 * Per-request organization context.
 *
 * The authenticated organization id is carried implicitly through the async
 * call tree using Node's AsyncLocalStorage, so any downstream Prisma call can
 * recover it without threading it through every function signature. The Prisma
 * client extension in config/database.ts reads this via getCurrentOrg() and
 * injects it into the database session GUC ("app.current_org") so PostgreSQL
 * row-level-security policies can scope every query to the caller's org.
 *
 * For unauthenticated/public routes the store is either absent or holds an
 * undefined organizationId; getCurrentOrg() then returns undefined and no GUC
 * is set, preserving existing behavior.
 */
export interface OrgContext {
  organizationId?: string;
}

const storage = new AsyncLocalStorage<OrgContext>();

/**
 * Run `fn` (and everything it awaits) with the given organization context
 * bound to the current async execution. Used by the auth middleware to scope
 * the remainder of the request lifecycle.
 */
export function runWithOrg<T>(organizationId: string | undefined, fn: () => T): T {
  return storage.run({ organizationId }, fn);
}

/**
 * Returns the organization id bound to the current async context, or undefined
 * when running outside a request (background jobs, startup) or on a public
 * route where no org has been resolved.
 */
export function getCurrentOrg(): string | undefined {
  return storage.getStore()?.organizationId;
}

export default { runWithOrg, getCurrentOrg };
