import fs from 'fs';
import path from 'path';
import winston from 'winston';
import config from './index';
import elasticsearch from './elasticsearch';
import { sanitizeForLogging } from '../utils/logSanitizer';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for console
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${stack || message} ${metaStr}`;
});

// Sanitization format - removes sensitive data before logging
const sanitizationFormat = winston.format((info) => {
  // Sanitize all metadata
  if (info.metadata) {
    info.metadata = sanitizeForLogging(info.metadata);
  }

  // Sanitize message if it's an object
  if (typeof info.message === 'object') {
    info.message = sanitizeForLogging(info.message);
  }

  // Sanitize any additional fields
  if (info.error) {
    info.error = sanitizeForLogging(info.error);
  }

  return info;
})();

// JSON format for structured logging (file/Elasticsearch)
const jsonFormat = combine(
  sanitizationFormat, // Apply sanitization first
  errors({ stack: true }),
  timestamp(),
  json()
);

/**
 * Resolve the directory for file-based logs, or null to log to stdout only.
 *
 * Containers get stdout: the filesystem is ephemeral, the app runs as a non-root
 * user that owns no writable directory, and the platform's log driver (awslogs on
 * ECS) already ships stdout/stderr to CloudWatch. Winston creates a File
 * transport's directory eagerly at construction, so an unwritable path aborts
 * process start before any application code — or any diagnostic message — runs.
 *
 * File logging is therefore on by default only outside production, and even when
 * requested it degrades to stdout rather than taking the process down.
 * LOG_FILE=true forces it on, LOG_FILE=false forces it off, LOG_DIR overrides
 * the location.
 */
function resolveLogDir(): string | null {
  if (process.env.LOG_FILE === 'false') return null;
  if (process.env.LOG_FILE !== 'true' && process.env.NODE_ENV === 'production') return null;

  const dir = path.resolve(process.env.LOG_DIR || path.join(process.cwd(), 'logs'));
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch {
    // Config loads before the logger exists, so write directly to stdout — the
    // same approach config/index.ts uses for its startup warnings.
    process.stdout.write(
      `File logging disabled: ${dir} is not writable. Using stdout only.\n`
    );
    return null;
  }
}

const logDir = resolveLogDir();

// Build transports array
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (process.env.NODE_ENV !== 'production' || process.env.LOG_CONSOLE !== 'false') {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
    })
  );
}

// File transports
if (logDir) {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: jsonFormat,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: jsonFormat,
    })
  );

  // Access log file (for HTTP requests)
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'info',
      format: jsonFormat,
    })
  );
}

// Elasticsearch transport (optional)
if (process.env.ELASTICSEARCH_ENABLED === 'true') {
  const esTransport = elasticsearch.createElasticsearchTransport();
  if (esTransport) {
    transports.push(esTransport);
  }
}

// A logger with no transports discards every line silently. If the environment
// turned off both console and file sinks, fall back to stdout so production is
// never blind.
if (transports.length === 0) {
  transports.push(new winston.transports.Console({ format: jsonFormat }));
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  // sanitizationFormat is applied at the logger level so every transport
  // (console, file, Elasticsearch) inherits sensitive-data redaction.
  format: combine(
    sanitizationFormat,
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports,
  // Handle exceptions and rejections. These mirror the transports above: a file
  // when one is writable, otherwise stdout so crashes still reach the platform's
  // log driver instead of vanishing.
  exceptionHandlers: logDir
    ? [new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })]
    : [new winston.transports.Console({ format: jsonFormat })],
  rejectionHandlers: logDir
    ? [new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })]
    : [new winston.transports.Console({ format: jsonFormat })],
});

export default logger;
