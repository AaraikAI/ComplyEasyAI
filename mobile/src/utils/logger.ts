/**
 * Mobile logger
 *
 * A React Native-safe logging shim kept inside the mobile/ package so the app
 * never imports the browser-oriented root frontend logger across the package
 * boundary (Metro's default resolver scopes to the mobile project root, so a
 * relative import that climbs above it is not reliably bundleable).
 *
 * Forwards to the global console (always available in the RN runtime). In a
 * production build it suppresses debug/info noise but always surfaces warnings
 * and errors. If @sentry/react-native is wired later, route error() to it here.
 */

// React Native global — true in dev builds, false in production
declare const __DEV__: boolean;

type LogPayload = Record<string, unknown>;

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
}

export const logger = {
  debug(message: string, payload?: LogPayload): void {
    if (isDev()) console.debug(message, payload ?? '');
  },
  info(message: string, payload?: LogPayload): void {
    if (isDev()) console.info(message, payload ?? '');
  },
  warn(message: string, payload?: LogPayload, error?: unknown): void {
    console.warn(message, payload ?? '', error ?? '');
  },
  error(message: string, errorOrPayload?: unknown, payload?: LogPayload): void {
    console.error(message, errorOrPayload ?? '', payload ?? '');
  },
};

export default logger;
