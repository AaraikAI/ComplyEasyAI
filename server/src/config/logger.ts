import winston from 'winston';
import config from './index';
import elasticsearch from './elasticsearch';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for console
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${stack || message} ${metaStr}`;
});

// JSON format for structured logging (file/Elasticsearch)
const jsonFormat = combine(
  errors({ stack: true }),
  timestamp(),
  json()
);

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
if (process.env.LOG_FILE !== 'false') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: jsonFormat,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: jsonFormat,
    })
  );

  // Access log file (for HTTP requests)
  transports.push(
    new winston.transports.File({
      filename: 'logs/access.log',
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

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

export default logger;
