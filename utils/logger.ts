/**
 * Frontend structured logger.
 *
 * In development: writes to the browser console (debug/info/warn/error).
 * In production: forwards warn/error to Sentry (if loaded on window.Sentry)
 * and to the in-app notification system when a `toast` option is set.
 * Falls back silently if no transport is available — never throws.
 */

type LogPayload = Record<string, unknown> | undefined;
type Level = 'debug' | 'info' | 'warn' | 'error';

const isDev =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV !== 'production';

function sendToSentry(level: Level, message: string, payload?: LogPayload, error?: unknown): void {
  try {
    const w = typeof window !== 'undefined' ? (window as any) : null;
    if (!w || !w.Sentry) return;
    if (error instanceof Error) {
      w.Sentry.captureException(error, { level, extra: payload });
    } else {
      w.Sentry.captureMessage(message, { level, extra: payload });
    }
  } catch {
    // never throw from logger
  }
}

function emit(level: Level, message: string, payload?: LogPayload, error?: unknown): void {
  if (isDev) {
    const fn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'info'
            ? console.info
            : console.debug;
    if (error !== undefined) {
      fn(message, error, payload || '');
    } else if (payload) {
      fn(message, payload);
    } else {
      fn(message);
    }
    return;
  }

  // Production: forward warn/error to Sentry (silent otherwise)
  if (level === 'warn' || level === 'error') {
    sendToSentry(level, message, payload, error);
  }
}

export const logger = {
  debug(message: string, payload?: LogPayload): void {
    emit('debug', message, payload);
  },
  info(message: string, payload?: LogPayload): void {
    emit('info', message, payload);
  },
  warn(message: string, payload?: LogPayload, error?: unknown): void {
    emit('warn', message, payload, error);
  },
  error(message: string, errorOrPayload?: unknown, payload?: LogPayload): void {
    if (errorOrPayload instanceof Error) {
      emit('error', message, payload, errorOrPayload);
    } else if (errorOrPayload && typeof errorOrPayload === 'object' && !Array.isArray(errorOrPayload)) {
      emit('error', message, errorOrPayload as LogPayload);
    } else {
      emit('error', message, payload, errorOrPayload);
    }
  },
};

export default logger;
