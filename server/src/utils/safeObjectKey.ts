/**
 * Guards for property names that come from request data.
 *
 * Writing `target[key] = value` with a caller-supplied key can overwrite members
 * every plain object inherits (`__proto__`, `constructor`, `toString`,
 * `hasOwnProperty`, ...). Assigning to `__proto__` swaps the target's prototype,
 * and shadowing a built-in method breaks later code that relies on it. Callers
 * that copy or aggregate request-supplied keys must skip any key rejected here.
 */

/** Longest property name accepted from request data. */
export const MAX_OBJECT_KEY_LENGTH = 256;

/**
 * Whether `key` is safe to use as a dynamic property name on a plain object:
 * a non-empty string of bounded length that `Object.prototype` does not already
 * define, and not `prototype`.
 */
export function isSafeObjectKey(key: unknown): key is string {
  if (typeof key !== 'string' || key.length === 0 || key.length > MAX_OBJECT_KEY_LENGTH) {
    return false;
  }
  if (key === 'prototype') {
    return false;
  }
  return !Object.prototype.hasOwnProperty.call(Object.prototype, key);
}

/** Identifier shape accepted for a database sort column (no dots, no operators). */
const SORT_FIELD_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

/**
 * Whether `field` may be used as a key in a Prisma `orderBy` clause: a plain
 * identifier that is also a safe object key. Route-specific allowlists still
 * decide which columns a caller may sort by; this only rejects values that are
 * never valid column names.
 */
export function isSafeSortField(field: unknown): field is string {
  return isSafeObjectKey(field) && SORT_FIELD_PATTERN.test(field);
}
