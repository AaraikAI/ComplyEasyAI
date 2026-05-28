/**
 * Contract Analysis Routes
 *
 * Backend route to match the frontend ContractAnalyzer.tsx POST /api/contracts/extract-text
 * (audit COV-12 finding §3.5). Extracts plain text from uploaded PDF/Word documents.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

const router = Router();

// Documents-only: PDF and Word formats. Audio/video/images are rejected.
const CONTRACT_ALLOWED_MIMES = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (_req, file, cb) => {
    if (CONTRACT_ALLOWED_MIMES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new AppError(`Unsupported file type: ${file.mimetype}`, 415));
    }
  },
});

router.use(authenticate);

router.post(
  '/extract-text',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    const user = (req as AuthRequest).user!;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    try {
      let extractedText = '';
      const mime = file.mimetype.toLowerCase();

      if (mime === 'application/pdf') {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
        try {
          const result = await parser.getText();
          extractedText = (result as any).text || '';
        } finally {
          await parser.destroy().catch(() => {});
        }
      } else if (
        mime === 'application/msword' ||
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        // Best-effort docx/doc handling. The mammoth library would be ideal here;
        // for now we fall back to letting the client know we couldn't extract.
        try {
          const mammoth = await import('mammoth' as any).catch(() => null as any);
          if (mammoth && typeof mammoth.extractRawText === 'function') {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            extractedText = result.value || '';
          } else {
            throw new AppError('Word document extraction not available on this server', 501);
          }
        } catch (err) {
          if (err instanceof AppError) throw err;
          throw new AppError('Failed to extract text from Word document', 500);
        }
      } else if (mime === 'text/plain') {
        extractedText = file.buffer.toString('utf8');
      } else {
        throw new AppError(`Cannot extract text from ${mime}`, 415);
      }

      logger.info(`[Contracts] Extracted ${extractedText.length} chars from ${file.originalname}`, {
        userId: user.id,
        organizationId: user.organizationId,
        size: file.size,
        mime,
      });

      res.json({ text: extractedText });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('[Contracts] Text extraction failed', error);
      throw new AppError('Failed to extract text from file', 500);
    }
  }),
);

export default router;
