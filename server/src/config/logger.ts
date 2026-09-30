import fs from 'fs';
import path from 'path';
import winston from 'winston';
import config from './index';
import elasticsearch from './elasticsearch';
import { jsonFormat, sanitizationFormat, textFormat } from './logFormats';

const { combine, timestamp, colorize, errors } = winston.format;

// The formats live in ./logFormats. Both the readable text format and jsonFormat
// escape CR, LF and other control characters, so a request-derived value in a
// log statement cannot start a forged entry in any transport.

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

const isProduction = process.env.NODE_ENV === 'production';

// Console transport (always enabled outside production)
if (!isProduction || process.env.LOG_CONSOLE !== 'false') {
  transports.push(
    new winston.transports.Console({
      // Production stdout is forwarded to CloudWatch one line per event, so it
      // carries one structured JSON document per entry. Elsewhere the console
      // stays a readable, colorized single line.
      format: isProduction
        ? jsonFormat
        : combine(
          colorize(),
          textFormat
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
    ? [new winston.transports.File({ filename: path.join(logDir, 'exceptions.log'), format: jsonFormat })]
    : [new winston.transports.Console({ format: jsonFormat })],
  rejectionHandlers: logDir
    ? [new winston.transports.File({ filename: path.join(logDir, 'rejections.log'), format: jsonFormat })]
    : [new winston.transports.Console({ format: jsonFormat })],
});

export default logger;
