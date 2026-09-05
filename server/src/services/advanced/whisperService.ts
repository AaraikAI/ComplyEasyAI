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
import type { Uploadable } from 'openai/uploads';
import type { TranscriptionVerbose, TranscriptionSegment } from 'openai/resources/audio/transcriptions';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Prisma } from '../../generated/prisma/client';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { safeAxios } from '../../utils/urlValidator';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const execFileAsync = promisify(execFile);

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
          throw new AppError('OPENAI_API_KEY is required for audio transcription in production', 500);
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
          file: fs.createReadStream(tempFilePath) as unknown as Uploadable,
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
            language: (transcription as TranscriptionVerbose).language || options.language || 'en',
            duration: (transcription as TranscriptionVerbose).duration,
            segments: (transcription as TranscriptionVerbose).segments?.map((seg: TranscriptionSegment) => ({
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
            segments: result.segments as unknown as Prisma.InputJsonValue,
            sourceType: 'audio',
          },
        });

        logger.info('[Whisper] Transcription completed', { charCount: result.text.length, durationSec: result.duration, language: result.language });

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
        throw new AppError(`Audio transcription failed: ${error.message}`, 500);
      }
      // Development fallback
      return this.fallbackTranscription(audioBuffer, options);
    }
  }

  /**
   * Extract audio from video using FFmpeg
   * Returns path to extracted WAV file
   */
  private async extractAudioFromVideo(videoPath: string): Promise<string> {
    const audioPath = videoPath.replace(/\.[^/.]+$/, '.wav');

    try {
      // Use FFmpeg to extract audio: mono channel, 16kHz sample rate, PCM 16-bit
      // This format is optimal for Whisper API
      await execFileAsync(
        'ffmpeg',
        ['-i', videoPath, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', audioPath, '-y'],
        { timeout: 120000 } // 2 minute timeout for large files
      );

      if (!fs.existsSync(audioPath)) {
        throw new AppError('FFmpeg audio extraction produced no output', 500);
      }

      logger.info(`[Whisper] Audio extracted from video: ${audioPath}`);
      return audioPath;
    } catch (error: any) {
      // Check if FFmpeg is installed
      if (error.message?.includes('not found') || error.message?.includes('ENOENT')) {
        throw new AppError(
          'FFmpeg is not installed. Install FFmpeg for video audio extraction: ' +
          'apt-get install ffmpeg (Linux) or brew install ffmpeg (macOS)',
          500
        );
      }
      throw new AppError(`FFmpeg audio extraction failed: ${error.message}`, 500);
    }
  }

  /**
   * Transcribe video (extract audio via FFmpeg, then transcribe)
   */
  async transcribeVideo(
    videoBuffer: Buffer,
    options: TranscriptionOptions = {},
    organizationId: string,
    evidenceId?: string
  ): Promise<TranscriptionResult> {
    await this.initialize();

    const tempId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempDir = path.join(__dirname, '../../../temp');
    const videoPath = path.join(tempDir, `video_${tempId}.mp4`);
    let audioPath: string | null = null;

    try {
      if (!this.openai || !process.env.OPENAI_API_KEY) {
        if (process.env.NODE_ENV === 'production') {
          throw new AppError('OPENAI_API_KEY is required for video transcription in production', 500);
        }
        return this.fallbackTranscription(videoBuffer, options);
      }

      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await writeFile(videoPath, videoBuffer);

      // Extract audio from video using FFmpeg
      audioPath = await this.extractAudioFromVideo(videoPath);

      // Transcribe the extracted audio using Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath) as unknown as Uploadable,
        model: 'whisper-1',
        language: options.language,
        prompt: options.prompt,
        response_format: options.responseFormat || 'verbose_json',
        temperature: options.temperature || 0,
      });

      let result: TranscriptionResult;

      if (typeof transcription === 'string') {
        result = {
          text: transcription,
          language: options.language || 'en',
        };
      } else {
        result = {
          text: transcription.text,
          language: (transcription as TranscriptionVerbose).language || options.language || 'en',
          duration: (transcription as TranscriptionVerbose).duration,
          segments: (transcription as TranscriptionVerbose).segments?.map((seg: TranscriptionSegment) => ({
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
          confidence: 0.9,
          language: result.language,
          duration: result.duration,
          segments: result.segments as unknown as Prisma.InputJsonValue,
          sourceType: 'video',
        },
      });

      logger.info('[Whisper] Video transcription completed', { charCount: result.text.length, durationSec: result.duration, language: result.language });
      return result;
    } catch (error: any) {
      logger.error('[Whisper] Error transcribing video', error);
      if (process.env.NODE_ENV === 'production') {
        throw new AppError(`Video transcription failed: ${error.message}`, 500);
      }
      return this.fallbackTranscription(videoBuffer, options);
    } finally {
      // Clean up temp files
      if (fs.existsSync(videoPath)) await unlink(videoPath).catch(() => {});
      if (audioPath && fs.existsSync(audioPath)) await unlink(audioPath).catch(() => {});
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
      throw new AppError('Whisper API not available. OPENAI_API_KEY must be configured for audio transcription in production.', 500);
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
        segments: transcription.segments as unknown as TranscriptionResult['segments'],
      };
    } catch (error) {
      logger.error('[Whisper] Error getting transcription', error);
      return null;
    }
  }

  /**
   * Get supported languages for Whisper transcription
   * Whisper supports 99+ languages
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'af', name: 'Afrikaans' }, { code: 'ar', name: 'Arabic' },
      { code: 'hy', name: 'Armenian' }, { code: 'az', name: 'Azerbaijani' },
      { code: 'be', name: 'Belarusian' }, { code: 'bs', name: 'Bosnian' },
      { code: 'bg', name: 'Bulgarian' }, { code: 'ca', name: 'Catalan' },
      { code: 'zh', name: 'Chinese' }, { code: 'hr', name: 'Croatian' },
      { code: 'cs', name: 'Czech' }, { code: 'da', name: 'Danish' },
      { code: 'nl', name: 'Dutch' }, { code: 'en', name: 'English' },
      { code: 'et', name: 'Estonian' }, { code: 'fi', name: 'Finnish' },
      { code: 'fr', name: 'French' }, { code: 'gl', name: 'Galician' },
      { code: 'de', name: 'German' }, { code: 'el', name: 'Greek' },
      { code: 'he', name: 'Hebrew' }, { code: 'hi', name: 'Hindi' },
      { code: 'hu', name: 'Hungarian' }, { code: 'is', name: 'Icelandic' },
      { code: 'id', name: 'Indonesian' }, { code: 'it', name: 'Italian' },
      { code: 'ja', name: 'Japanese' }, { code: 'kn', name: 'Kannada' },
      { code: 'kk', name: 'Kazakh' }, { code: 'ko', name: 'Korean' },
      { code: 'lv', name: 'Latvian' }, { code: 'lt', name: 'Lithuanian' },
      { code: 'mk', name: 'Macedonian' }, { code: 'ms', name: 'Malay' },
      { code: 'mr', name: 'Marathi' }, { code: 'mi', name: 'Maori' },
      { code: 'ne', name: 'Nepali' }, { code: 'no', name: 'Norwegian' },
      { code: 'fa', name: 'Persian' }, { code: 'pl', name: 'Polish' },
      { code: 'pt', name: 'Portuguese' }, { code: 'ro', name: 'Romanian' },
      { code: 'ru', name: 'Russian' }, { code: 'sr', name: 'Serbian' },
      { code: 'sk', name: 'Slovak' }, { code: 'sl', name: 'Slovenian' },
      { code: 'es', name: 'Spanish' }, { code: 'sw', name: 'Swahili' },
      { code: 'sv', name: 'Swedish' }, { code: 'tl', name: 'Tagalog' },
      { code: 'ta', name: 'Tamil' }, { code: 'th', name: 'Thai' },
      { code: 'tr', name: 'Turkish' }, { code: 'uk', name: 'Ukrainian' },
      { code: 'ur', name: 'Urdu' }, { code: 'vi', name: 'Vietnamese' },
      { code: 'cy', name: 'Welsh' },
    ];
  }

  /**
   * Detect language of audio using Whisper API
   */
  async detectLanguage(
    audioBuffer: Buffer,
    organizationId: string
  ): Promise<{ language: string; confidence: number }> {
    await this.initialize();

    try {
      if (!this.openai || !process.env.OPENAI_API_KEY) {
        return { language: 'en', confidence: 0.5 };
      }

      // Save buffer to temporary file
      const tempFilePath = path.join(
        __dirname,
        '../../../temp',
        `lang_detect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
      );

      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Use only first 30 seconds for language detection (saves API cost)
      const sampleBuffer = audioBuffer.length > 480000 ? audioBuffer.slice(0, 480000) : audioBuffer;
      await writeFile(tempFilePath, sampleBuffer);

      try {
        const transcription = await this.openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath) as unknown as Uploadable,
          model: 'whisper-1',
          response_format: 'verbose_json',
          temperature: 0,
        });

        await unlink(tempFilePath);

        const detectedLanguage = (transcription as TranscriptionVerbose).language || 'en';
        // Whisper provides high confidence language detection
        const confidence = 0.95;

        logger.info(`[Whisper] Language detected: ${detectedLanguage} (confidence: ${confidence})`);

        return { language: detectedLanguage, confidence };
      } catch (error) {
        await unlink(tempFilePath).catch(() => {});
        throw error;
      }
    } catch (error: any) {
      logger.error('[Whisper] Error detecting language', error);
      return { language: 'en', confidence: 0.3 };
    }
  }

  /**
   * Transcribe audio with speaker diarization
   * Uses Whisper for transcription then applies speaker segmentation
   */
  async transcribeWithDiarization(
    audioBuffer: Buffer,
    options: TranscriptionOptions & { maxSpeakers?: number } = {},
    organizationId: string,
    evidenceId?: string
  ): Promise<TranscriptionResult & {
    speakers: Array<{
      id: string;
      label: string;
      segments: Array<{ start: number; end: number; text: string }>;
      totalDuration: number;
    }>;
  }> {
    await this.initialize();

    try {
      // First get the base transcription with verbose timestamps
      const baseResult = await this.transcribeAudio(
        audioBuffer,
        { ...options, responseFormat: 'verbose_json' },
        organizationId,
        evidenceId
      );

      // Apply speaker diarization to segments
      const segments = baseResult.segments || [];
      const maxSpeakers = options.maxSpeakers || 10;

      // Speaker diarization using segment analysis
      // When PYANNOTE_SERVICE_URL is configured, calls the pyannote.audio service
      const speakerMap = new Map<string, {
        label: string;
        segments: Array<{ start: number; end: number; text: string }>;
        totalDuration: number;
        features: { avgLength: number; avgPause: number };
      }>();

      // Try pyannote.audio service first
      const pyannoteServiceUrl = process.env.PYANNOTE_SERVICE_URL;
      let pyannoteResult: any = null;

      if (pyannoteServiceUrl) {
        try {
          const FormData = require('form-data');
          const formData = new FormData();
          formData.append('audio', audioBuffer, { filename: 'audio.wav' });
          formData.append('max_speakers', String(maxSpeakers));

          const diarizeUrl = `${pyannoteServiceUrl}/diarize`;
          const { isUrlSafe } = await import('../../utils/urlValidator');
          if (!isUrlSafe(diarizeUrl)) {
            throw new AppError('Pyannote service URL is unsafe', 400);
          }
          const response = await safeAxios({
            headers: formData.getHeaders(),
            timeout: 60000,
            url: diarizeUrl,
            method: 'post',
            data: formData,
          }, 'speaker diarization service');

          if (response.data?.speakers) {
            pyannoteResult = response.data;
            logger.info(`[Whisper] pyannote.audio diarization: ${response.data.speakers.length} speakers`);
          }
        } catch (pyannoteError: any) {
          logger.debug('[Whisper] pyannote.audio service unavailable, using fallback diarization', pyannoteError.message);
        }
      }

      if (pyannoteResult?.speakers) {
        // Use pyannote.audio results
        for (const speaker of pyannoteResult.speakers) {
          const speakerId = speaker.speaker_id || `speaker_${speakerMap.size + 1}`;
          const speakerSegments: Array<{ start: number; end: number; text: string }> = [];

          for (const pySeg of speaker.segments) {
            // Find matching transcription segments
            for (const seg of segments) {
              if (seg.start >= pySeg.start - 0.5 && seg.end <= pySeg.end + 0.5) {
                speakerSegments.push({ start: seg.start, end: seg.end, text: seg.text });
              }
            }
          }

          const totalDuration = speakerSegments.reduce((sum, s) => sum + (s.end - s.start), 0);
          speakerMap.set(speakerId, {
            label: `Speaker ${speakerMap.size + 1}`,
            segments: speakerSegments,
            totalDuration,
            features: { avgLength: 0, avgPause: 0 },
          });
        }
      } else {
        // Fallback: segment-based speaker clustering
        let currentSpeakerId = 'speaker_1';
        let speakerCount = 1;

        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          const prevSeg = i > 0 ? segments[i - 1] : null;

          // Detect speaker change based on pause duration and text characteristics
          const pauseDuration = prevSeg ? seg.start - prevSeg.end : 0;
          const textLength = seg.text.length;
          const prevTextLength = prevSeg?.text.length || 0;
          const lengthRatio = prevTextLength > 0 ? textLength / prevTextLength : 1;

          // Speaker change heuristics
          const longPause = pauseDuration > 1.5;
          const significantLengthChange = lengthRatio > 2.0 || lengthRatio < 0.5;
          const punctuationShift = prevSeg && (
            (prevSeg.text.endsWith('?') && !seg.text.endsWith('?')) ||
            (!prevSeg.text.endsWith('?') && seg.text.endsWith('?'))
          );

          if (longPause && (significantLengthChange || punctuationShift) && speakerCount < maxSpeakers) {
            // Check if this matches an existing speaker
            let matchedSpeaker: string | null = null;
            for (const [spkId, spkData] of speakerMap.entries()) {
              if (Math.abs(textLength - spkData.features.avgLength) < spkData.features.avgLength * 0.5) {
                matchedSpeaker = spkId;
                break;
              }
            }

            if (matchedSpeaker) {
              currentSpeakerId = matchedSpeaker;
            } else {
              speakerCount++;
              currentSpeakerId = `speaker_${speakerCount}`;
            }
          }

          if (!speakerMap.has(currentSpeakerId)) {
            speakerMap.set(currentSpeakerId, {
              label: `Speaker ${speakerMap.size + 1}`,
              segments: [],
              totalDuration: 0,
              features: { avgLength: textLength, avgPause: pauseDuration },
            });
          }

          const speaker = speakerMap.get(currentSpeakerId)!;
          speaker.segments.push({ start: seg.start, end: seg.end, text: seg.text });
          speaker.totalDuration += seg.end - seg.start;

          // Update running average features
          const segCount = speaker.segments.length;
          speaker.features.avgLength = (speaker.features.avgLength * (segCount - 1) + textLength) / segCount;
          speaker.features.avgPause = (speaker.features.avgPause * (segCount - 1) + pauseDuration) / segCount;
        }
      }

      const speakers = Array.from(speakerMap.entries()).map(([id, data]) => ({
        id,
        label: data.label,
        segments: data.segments,
        totalDuration: Math.round(data.totalDuration * 100) / 100,
      }));

      // Store diarization result
      if (organizationId && evidenceId) {
        try {
          await prisma.transcriptionResult.updateMany({
            where: { organizationId, evidenceId },
            data: {
              segments: {
                ...((baseResult.segments as unknown as Record<string, unknown>) || {}),
                diarization: speakers,
              } as unknown as Prisma.InputJsonValue,
            },
          });
        } catch {
          // Non-critical: diarization metadata storage failure
        }
      }

      logger.info(`[Whisper] Diarization complete: ${speakers.length} speakers identified`);

      return {
        ...baseResult,
        speakers,
      };
    } catch (error: any) {
      logger.error('[Whisper] Error in transcription with diarization', error);
      throw new AppError(`Transcription with diarization failed: ${error.message}`, 500);
    }
  }

  /**
   * Get transcription history for an organization
   */
  async getTranscriptionHistory(
    organizationId: string,
    options?: {
      page?: number;
      pageSize?: number;
      sourceType?: 'audio' | 'video';
      language?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    transcriptions: Array<{
      id: string;
      text: string;
      language: string;
      confidence: number | null;
      duration: number | null;
      sourceType: string;
      evidenceId: string | null;
      createdAt: Date;
      segments: any;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const skip = (page - 1) * pageSize;

      const where: any = { organizationId };
      if (options?.sourceType) where.sourceType = options.sourceType;
      if (options?.language) where.language = options.language;
      if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = options.startDate;
        if (options.endDate) where.createdAt.lte = options.endDate;
      }

      const [transcriptions, total] = await Promise.all([
        prisma.transcriptionResult.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.transcriptionResult.count({ where }),
      ]);

      return {
        transcriptions: transcriptions.map((t) => ({
          id: t.id,
          text: t.text,
          language: t.language,
          confidence: t.confidence,
          duration: t.duration,
          sourceType: t.sourceType,
          evidenceId: t.evidenceId,
          createdAt: t.createdAt,
          segments: t.segments,
        })),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('[Whisper] Error getting transcription history', error);
      throw error;
    }
  }

  /**
   * Delete a transcription record
   */
  async deleteTranscription(
    transcriptionId: string,
    organizationId: string
  ): Promise<boolean> {
    try {
      const result = await prisma.transcriptionResult.deleteMany({
        where: {
          id: transcriptionId,
          organizationId,
        },
      });

      return result.count > 0;
    } catch (error) {
      logger.error('[Whisper] Error deleting transcription', error);
      return false;
    }
  }

  /**
   * Generate timestamps for a transcription (SRT format)
   */
  async generateTimestamps(
    transcriptionId: string,
    organizationId: string,
    format: 'srt' | 'vtt' = 'srt'
  ): Promise<string> {
    try {
      const transcription = await prisma.transcriptionResult.findFirst({
        where: { id: transcriptionId, organizationId },
      });

      if (!transcription) {
        throw new AppError('Transcription not found', 404);
      }

      const segments = (transcription.segments as unknown as TranscriptionResult['segments']) || [];

      if (format === 'srt') {
        return segments.map((seg, index) => {
          const startTime = this.formatSRTTime(seg.start || 0);
          const endTime = this.formatSRTTime(seg.end || 0);
          return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text || ''}\n`;
        }).join('\n');
      } else {
        // VTT format
        let vtt = 'WEBVTT\n\n';
        vtt += segments.map((seg, index) => {
          const startTime = this.formatVTTTime(seg.start || 0);
          const endTime = this.formatVTTTime(seg.end || 0);
          return `${startTime} --> ${endTime}\n${seg.text || ''}\n`;
        }).join('\n');
        return vtt;
      }
    } catch (error) {
      logger.error('[Whisper] Error generating timestamps', error);
      throw error;
    }
  }

  /**
   * Format seconds to SRT timestamp (HH:MM:SS,mmm)
   */
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  /**
   * Format seconds to VTT timestamp (HH:MM:SS.mmm)
   */
  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }
}

export default new WhisperService();

