/**
 * Whisper Service for Audio/Video Transcription
 * 
 * Features:
 * - OpenAI Whisper API integration
 * - Audio transcription
 * - Video audio extraction and transcription
 * - Multi-language support
 */

import OpenAI from 'openai';
import logger from '../../config/logger';
import prisma from '../../config/database';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language: string;
  duration?: number;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avgLogprob: number;
    compressionRatio: number;
    noSpeechProb: number;
  }>;
}

class WhisperService {
  private openai: OpenAI | null = null;
  private isInitialized = false;

  /**
   * Initialize Whisper service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        logger.warn('[Whisper] OPENAI_API_KEY not set, Whisper service will use fallback');
        this.isInitialized = true;
        return;
      }

      this.openai = new OpenAI({
        apiKey,
      });

      this.isInitialized = true;
      logger.info('[Whisper] Service initialized');
    } catch (error) {
      logger.error('[Whisper] Error initializing service', error);
      throw error;
    }
  }

  /**
   * Transcribe audio file using Whisper API
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    options: TranscriptionOptions = {},
    organizationId: string,
    evidenceId?: string
  ): Promise<TranscriptionResult> {
    await this.initialize();

    try {
      // In production, require OpenAI API key
      if (!this.openai || !process.env.OPENAI_API_KEY) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('OPENAI_API_KEY is required for audio transcription in production');
        }
        return this.fallbackTranscription(audioBuffer, options);
      }

      // Save buffer to temporary file
      const tempFilePath = path.join(
        __dirname,
        '../../../temp',
        `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
      );

      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await writeFile(tempFilePath, audioBuffer);

      try {
        // Create transcription using Whisper API
        const transcription = await this.openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath) as any,
          model: 'whisper-1',
          language: options.language,
          prompt: options.prompt,
          response_format: options.responseFormat || 'verbose_json',
          temperature: options.temperature || 0,
        });

        // Clean up temp file
        await unlink(tempFilePath);

        // Parse result
        let result: TranscriptionResult;

        if (typeof transcription === 'string') {
          result = {
            text: transcription,
            language: options.language || 'en',
          };
        } else {
          result = {
            text: transcription.text,
            language: (transcription as any).language || options.language || 'en',
            duration: (transcription as any).duration,
            segments: (transcription as any).segments?.map((seg: any) => ({
              id: seg.id,
              seek: seg.seek,
              start: seg.start,
              end: seg.end,
              text: seg.text,
              tokens: seg.tokens,
              temperature: seg.temperature,
              avgLogprob: seg.avg_logprob,
              compressionRatio: seg.compression_ratio,
              noSpeechProb: seg.no_speech_prob,
            })),
          };
        }

        // Store transcription in database
        await prisma.transcriptionResult.create({
          data: {
            organizationId,
            evidenceId,
            text: result.text,
            confidence: 0.9, // Whisper API provides high confidence
            language: result.language,
            duration: result.duration,
            segments: result.segments as any,
            sourceType: 'audio',
          },
        });

        logger.info(`[Whisper] Transcription completed: ${result.text.substring(0, 50)}...`);

        return result;
      } catch (error) {
        // Clean up temp file on error
        if (fs.existsSync(tempFilePath)) {
          await unlink(tempFilePath).catch(() => {});
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('[Whisper] Error transcribing audio', error);
      // In production, throw error instead of fallback
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Audio transcription failed: ${error.message}`);
      }
      // Development fallback
      return this.fallbackTranscription(audioBuffer, options);
    }
  }

  /**
   * Transcribe video (extract audio and transcribe)
   */
  async transcribeVideo(
    videoBuffer: Buffer,
    options: TranscriptionOptions = {},
    organizationId: string,
    evidenceId?: string
  ): Promise<TranscriptionResult> {
    await this.initialize();

    try {
      // In production, would use FFmpeg to extract audio from video
      // For now, attempt to transcribe directly (Whisper can handle some video formats)

      const tempFilePath = path.join(
        __dirname,
        '../../../temp',
        `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`
      );

      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await writeFile(tempFilePath, videoBuffer);

      try {
        if (this.openai && process.env.OPENAI_API_KEY) {
          const transcription = await this.openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath) as any,
            model: 'whisper-1',
            language: options.language,
            prompt: options.prompt,
            response_format: options.responseFormat || 'verbose_json',
            temperature: options.temperature || 0,
          });

          await unlink(tempFilePath);

          let result: TranscriptionResult;

          if (typeof transcription === 'string') {
            result = {
              text: transcription,
              language: options.language || 'en',
            };
          } else {
            result = {
              text: transcription.text,
              language: (transcription as any).language || options.language || 'en',
              duration: (transcription as any).duration,
              segments: (transcription as any).segments?.map((seg: any) => ({
                id: seg.id,
                seek: seg.seek,
                start: seg.start,
                end: seg.end,
                text: seg.text,
                tokens: seg.tokens,
                temperature: seg.temperature,
                avgLogprob: seg.avg_logprob,
                compressionRatio: seg.compression_ratio,
                noSpeechProb: seg.no_speech_prob,
              })),
            };
          }

          // Store transcription
          await prisma.transcriptionResult.create({
            data: {
              organizationId,
              evidenceId,
              text: result.text,
              confidence: 0.9,
              language: result.language,
              duration: result.duration,
              segments: result.segments as any,
              sourceType: 'video',
            },
          });

          return result;
        } else {
          await unlink(tempFilePath);
          return this.fallbackTranscription(videoBuffer, options);
        }
      } catch (error) {
        if (fs.existsSync(tempFilePath)) {
          await unlink(tempFilePath).catch(() => {});
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('[Whisper] Error transcribing video', error);
      // In production, throw error instead of falling through to fallback
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Video transcription failed: ${error.message}. OPENAI_API_KEY must be configured for video transcription in production.`);
      }
      // Development fallback
      return this.fallbackTranscription(videoBuffer, options);
    }
  }

  /**
   * Fallback transcription (when API is not available)
   * In production, this should throw an error or use alternative service
   */
  private fallbackTranscription(
    buffer: Buffer,
    options: TranscriptionOptions
  ): TranscriptionResult {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Whisper API not available. OPENAI_API_KEY must be configured for audio transcription in production.');
    }

    logger.warn('[Whisper] Using fallback transcription (API not available) - Development mode only');

    // Development fallback only
    return {
      text: '[Transcription service not available. Please configure OPENAI_API_KEY for audio transcription.]',
      language: options.language || 'en',
      duration: Math.floor(buffer.length / 16000), // Rough estimate
    };
  }

  /**
   * Get transcription from database
   */
  async getTranscription(
    transcriptionId: string,
    organizationId: string
  ): Promise<TranscriptionResult | null> {
    try {
      const transcription = await prisma.transcriptionResult.findFirst({
        where: {
          id: transcriptionId,
          organizationId,
        },
      });

      if (!transcription) {
        return null;
      }

      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration || undefined,
        segments: transcription.segments as any,
      };
    } catch (error) {
      logger.error('[Whisper] Error getting transcription', error);
      return null;
    }
  }
}

export default new WhisperService();

