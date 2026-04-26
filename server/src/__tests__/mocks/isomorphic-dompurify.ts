/**
 * isomorphic-dompurify Mock for Jest tests
 * Avoids loading the full jsdom + @csstools ESM dependency chain in tests.
 * Tests don't exercise actual XSS sanitization — they just need the API surface.
 */

const sanitize = (input: string, _config?: unknown): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
};

const isValidAttribute = (_tag: string, _attr: string, _value: string): boolean => true;
const addHook = (_hook: string, _cb: unknown): void => undefined;
const removeHook = (_hook: string): void => undefined;
const removeAllHooks = (): void => undefined;
const setConfig = (_config: unknown): void => undefined;
const clearConfig = (): void => undefined;
const isSupported = true;
const version = '3.10.0-mock';

const DOMPurify = {
  sanitize,
  isValidAttribute,
  addHook,
  removeHook,
  removeAllHooks,
  setConfig,
  clearConfig,
  isSupported,
  version,
};

export { sanitize, isValidAttribute, addHook, removeHook, removeAllHooks, setConfig, clearConfig, isSupported, version };
export default DOMPurify;
