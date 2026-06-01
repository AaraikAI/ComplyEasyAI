/**
 * Multi-tenant ownership guards.
 *
 * Centralizes the "does this record belong to the caller's organization?" check so
 * service/controller handlers can scope reads, updates, and deletes by organizationId
 * without copy-pasting findFirst guards. Mirrors the AND-scoping pattern used in
 * controlMappingsController.listAllMappings (both relation sides must belong to the org).
 *
 * Usage — direct model that carries organizationId:
 *   await assertOrgOwned('breachIncident', id, organizationId);
 *
 * Usage — child entity scoped through a parent relation:
 *   await assertOwnedByOrg('controlMapping', id, {
 *     sourceControl: { framework: { organizationId } },
 *   });
 *
 * Fetch-and-verify in one call:
 *   const incident = await getOwnedOrThrow('breachIncident', id, { organizationId }, { include: { tasks: true } });
 *
 * Each guard throws AppError(404) on a miss so cross-tenant ids cannot be read or mutated.
 */
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface FindFirstDelegate {
  findFirst: (args: Record<string, unknown>) => Promise<unknown>;
}

function getDelegate(model: string): FindFirstDelegate {
  const delegate = (prisma as unknown as Record<string, FindFirstDelegate>)[model];
  if (!delegate || typeof delegate.findFirst !== 'function') {
    throw new AppError(`Unknown Prisma model for ownership check: ${model}`, 500);
  }
  return delegate;
}

/**
 * Throw AppError(404) unless a record matching { id, ...orgWhere } exists.
 * `orgWhere` is the organization-scoping fragment of a Prisma where clause — either
 * a direct `{ organizationId }` or a parent-relation path for child entities.
 */
export async function assertOwnedByOrg(
  model: string,
  id: string,
  orgWhere: Record<string, unknown>,
): Promise<void> {
  const delegate = getDelegate(model);
  const found = await delegate.findFirst({ where: { id, ...orgWhere }, select: { id: true } });
  if (!found) {
    throw new AppError('Resource not found', 404);
  }
}

/** Convenience for the common case where the model itself carries an organizationId column. */
export async function assertOrgOwned(
  model: string,
  id: string,
  organizationId: string,
): Promise<void> {
  return assertOwnedByOrg(model, id, { organizationId });
}

/**
 * Fetch a record scoped to the caller's organization (with optional include/select) or
 * throw AppError(404). Returns the full record so handlers can act on it directly.
 */
export async function getOwnedOrThrow<T = unknown>(
  model: string,
  id: string,
  orgWhere: Record<string, unknown>,
  args: Record<string, unknown> = {},
): Promise<T> {
  const delegate = getDelegate(model) as unknown as {
    findFirst: (a: Record<string, unknown>) => Promise<T | null>;
  };
  const found = await delegate.findFirst({ where: { id, ...orgWhere }, ...args });
  if (!found) {
    throw new AppError('Resource not found', 404);
  }
  return found;
}

export default { assertOwnedByOrg, assertOrgOwned, getOwnedOrThrow };
