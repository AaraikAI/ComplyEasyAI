/**
 * CSV Export Utilities
 * Production-ready CSV generation for exporting data
 */

import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

export interface CsvExportOptions {
  filename?: string;
  headers?: string[];
  includeTimestamp?: boolean;
  delimiter?: string;
  escapeQuotes?: boolean;
}

/**
 * Neutralize CSV formula injection (CWE-1236). A cell whose first character is one of
 * = + - @ (or a leading tab / carriage return) can be interpreted as a formula by
 * spreadsheet software; prefixing a single quote forces it to be treated as text.
 */
export function neutralizeCsvFormula(value: string): string {
  if (value && /^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

/**
 * Escape a single value for safe CSV output: neutralizes formula injection, then applies
 * RFC 4180 quoting (double internal quotes; wrap when the cell contains the delimiter,
 * a quote, or a newline). Use this in handlers that assemble CSV rows by hand.
 */
export function escapeCsvCell(value: unknown, delimiter = ','): string {
  if (value === null || value === undefined) return '';
  let cell: string;
  if (typeof value === 'object') {
    cell = value instanceof Date ? value.toISOString() : JSON.stringify(value);
  } else {
    cell = String(value);
  }
  cell = neutralizeCsvFormula(cell);
  if (
    cell.includes('"') ||
    cell.includes(delimiter) ||
    cell.includes('\n') ||
    cell.includes('\r')
  ) {
    cell = `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

/**
 * Converts an array of objects to CSV format
 * Handles nested objects, arrays, nulls, and special characters
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  options: CsvExportOptions = {}
): string {
  const {
    headers,
    delimiter = ',',
    escapeQuotes = true,
  } = options;

  if (!data || data.length === 0) {
    return '';
  }

  try {
    // Determine headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);

    // Escape and format cell value
    const formatCell = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }

      // Handle objects and arrays
      if (typeof value === 'object') {
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (Array.isArray(value)) {
          return value.map(v => formatCell(v)).join('; ');
        }
        return JSON.stringify(value);
      }

      // Convert to string
      let cellValue = String(value);

      // Neutralize spreadsheet formula injection before any quoting
      cellValue = neutralizeCsvFormula(cellValue);

      // Escape quotes if needed
      if (escapeQuotes && cellValue.includes('"')) {
        cellValue = cellValue.replace(/"/g, '""');
      }

      // Wrap in quotes if contains delimiter, newline, or quotes
      if (
        cellValue.includes(delimiter) ||
        cellValue.includes('\n') ||
        cellValue.includes('\r') ||
        cellValue.includes('"')
      ) {
        cellValue = `"${cellValue}"`;
      }

      return cellValue;
    };

    // Build CSV header row
    const headerRow = csvHeaders.map(formatCell).join(delimiter);

    // Build data rows
    const dataRows = data.map((row) => {
      return csvHeaders
        .map((header) => formatCell(row[header]))
        .join(delimiter);
    });

    // Combine header and data
    return [headerRow, ...dataRows].join('\n');
  } catch (error) {
    logger.error('CSV conversion error:', error);
    throw new AppError('Failed to convert data to CSV format', 500);
  }
}

/**
 * Generates CSV download response for Express
 * Sets proper headers and sends CSV file
 *
 * Usage:
 * ```typescript
 * const vendors = await vendorService.getVendors(organizationId);
 * sendCsvResponse(res, vendors, {
 *   filename: 'vendors',
 *   headers: ['name', 'email', 'riskLevel', 'status']
 * });
 * ```
 */
export function sendCsvResponse(
  res: any,
  data: any[],
  options: CsvExportOptions = {}
): void {
  const {
    filename = 'export',
    includeTimestamp = true,
  } = options;

  try {
    const csv = convertToCSV(data, options);

    // Generate filename with timestamp
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().split('T')[0]}`
      : '';
    const fullFilename = `${filename}${timestamp}.csv`;

    // Set response headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fullFilename}"`
    );
    // Prepend a UTF-8 BOM for Excel compatibility and declare the byte length of
    // the full payload (BOM included) so strict HTTP clients do not see a body
    // longer than the advertised Content-Length.
    const body = '\ufeff' + csv;
    res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
    res.end(body);

    logger.info(`CSV export generated: ${fullFilename} (${data.length} rows)`);
  } catch (error) {
    logger.error('CSV export error:', error);
    // If the response stream is already open (BOM/headers flushed), terminate it
    // cleanly; otherwise defer to the global error handler/Sentry.
    if (res.headersSent) {
      res.end();
      return;
    }
    throw new AppError('CSV export failed', 500);
  }
}

/**
 * Flattens nested objects for CSV export
 * Converts { user: { name: 'John' } } to { 'user.name': 'John' }
 */
export function flattenObject(
  obj: Record<string, any>,
  prefix = '',
  maxDepth = 3
): Record<string, any> {
  if (maxDepth <= 0) {
    return { [prefix]: JSON.stringify(obj) };
  }

  const flattened: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = null;
    } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(
        flattened,
        flattenObject(value, newKey, maxDepth - 1)
      );
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
}

/**
 * Prepares data for CSV export by flattening nested structures
 */
export function prepareDataForCsv<T extends Record<string, any>>(
  data: T[],
  maxDepth = 2
): Record<string, any>[] {
  return data.map((item) => flattenObject(item, '', maxDepth));
}

/**
 * Generate CSV from Prisma query results
 * Automatically handles relations and nested data
 *
 * Example:
 * ```typescript
 * router.get('/vendors/export', authenticate, async (req, res) => {
 *   const vendors = await prisma.vendor.findMany({
 *     where: { organizationId: req.user.organizationId },
 *     include: { assessments: true }
 *   });
 *
 *   exportToCsv(res, vendors, {
 *     filename: 'vendors',
 *     excludeFields: ['id', 'organizationId', 'passwordHash']
 *   });
 * });
 * ```
 */
export function exportToCsv(
  res: any,
  data: any[],
  options: CsvExportOptions & { excludeFields?: string[] } = {}
): void {
  const { excludeFields = [] } = options;

  try {
    // Flatten nested structures
    const flattenedData = prepareDataForCsv(data);

    // Remove excluded fields
    const cleanedData = flattenedData.map((item) => {
      const cleaned = { ...item };
      excludeFields.forEach((field) => {
        delete cleaned[field];
      });
      return cleaned;
    });

    // Send CSV response
    sendCsvResponse(res, cleanedData, options);
  } catch (error) {
    logger.error('Export to CSV error:', error);
    // Re-raise AppError as-is so the originating status is preserved; otherwise
    // surface a 500 through the global error handler/Sentry.
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('CSV export failed', 500);
  }
}

/**
 * Stream large datasets to CSV
 * More memory-efficient for exports > 10,000 rows
 *
 * Example:
 * ```typescript
 * const stream = streamToCsv(vendors, {
 *   filename: 'large-vendor-export',
 *   headers: ['name', 'email', 'riskLevel']
 * });
 * stream.pipe(res);
 * ```
 */
export function streamToCsv<T extends Record<string, any>>(
  data: AsyncIterable<T> | T[],
  options: CsvExportOptions = {}
): NodeJS.ReadableStream {
  const { Readable } = require('stream');

  return new Readable({
    async read() {
      try {
        const { headers, delimiter = ',' } = options;
        let headerWritten = false;

        for await (const item of data as any) {
          // Write header on first item
          if (!headerWritten) {
            const csvHeaders = headers || Object.keys(item);
            this.push(
              csvHeaders.map((h: unknown) => escapeCsvCell(h, delimiter)).join(delimiter) + '\n'
            );
            headerWritten = true;
          }

          // Write data row — same RFC 4180 quoting + formula-injection guard as convertToCSV.
          const values = headers
            ? headers.map((h) => (item as Record<string, unknown>)[h])
            : Object.values(item as Record<string, unknown>);
          const row = values.map((v) => escapeCsvCell(v, delimiter)).join(delimiter);
          this.push(row + '\n');
        }

        this.push(null); // End stream
      } catch (error) {
        this.destroy(error as Error);
      }
    },
  });
}

/**
 * Validate CSV export data
 * Ensures data is safe for export (no sensitive info, reasonable size)
 */
export function validateExportData(
  data: any[],
  options: {
    maxRows?: number;
    sensitiveFields?: string[];
    requireAuth?: boolean;
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxRows = 50000,
    sensitiveFields = ['password', 'passwordHash', 'secret', 'apiKey', 'token'],
  } = options;

  // Check row limit
  if (data.length > maxRows) {
    return {
      valid: false,
      error: `Export exceeds maximum of ${maxRows} rows. Please use filters to reduce the dataset.`,
    };
  }

  // Check for sensitive fields
  if (data.length > 0) {
    const firstRow = data[0];
    const fields = Object.keys(firstRow);
    const foundSensitive = fields.filter((field) =>
      sensitiveFields.some((sensitive) =>
        field.toLowerCase().includes(sensitive.toLowerCase())
      )
    );

    if (foundSensitive.length > 0) {
      logger.warn('Attempted export with sensitive fields:', foundSensitive);
      return {
        valid: false,
        error: `Export contains sensitive fields: ${foundSensitive.join(', ')}. Please exclude these fields.`,
      };
    }
  }

  return { valid: true };
}

export default {
  convertToCSV,
  sendCsvResponse,
  flattenObject,
  prepareDataForCsv,
  exportToCsv,
  streamToCsv,
  validateExportData,
};
