/**
 * Pick only allowed keys from an object.
 * Used to whitelist updatable fields on PATCH routes so that
 * clients cannot set arbitrary columns (e.g. organizationId, createdAt).
 */
export function pick<T extends Record<string, unknown>>(
  source: T,
  keys: readonly string[],
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in source && source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result as Partial<T>;
}
