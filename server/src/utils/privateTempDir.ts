/**
 * Private per-call scratch directories for uploaded media.
 *
 * Media processing (FFmpeg frame and audio extraction) needs the uploaded
 * bytes on disk. Writing them to a shared, predictable location is unsafe:
 * concurrent requests can collide on the same file names (one tenant's frame
 * read while processing another tenant's upload), other local users can read
 * the files, and a pre-created symlink at a guessable path redirects the write.
 *
 * createPrivateTempDir() gives every call its own directory under the OS temp
 * dir. fs.mkdtemp picks an unpredictable name and creates the directory with
 * mode 0700, so nothing else can list, read or pre-create files inside it.
 * Files written with PRIVATE_TEMP_FILE_OPTIONS are 0600 and use the exclusive
 * 'wx' flag, so an existing file or symlink at that path is never followed.
 * removePrivateTempDir() deletes the directory and everything in it; call it
 * from a `finally` block.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import logger from '../config/logger';

/** Options for writing a file into a private temp dir: owner-only, never overwrite. */
export const PRIVATE_TEMP_FILE_OPTIONS: Readonly<{ mode: number; flag: string }> = Object.freeze({
  mode: 0o600,
  flag: 'wx',
});

/**
 * Create a fresh private directory under os.tmpdir(). The prefix is reduced to
 * [A-Za-z0-9_-] so it can never contribute a path separator.
 */
export function createPrivateTempDir(prefix: string): Promise<string> {
  const safePrefix = String(prefix).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'tmp';
  const template = path.join(os.tmpdir(), `complyeasy-${safePrefix}-`);
  return new Promise((resolve, reject) => {
    fs.mkdtemp(template, (error, dir) => (error ? reject(error) : resolve(dir)));
  });
}

/**
 * Remove a directory created by createPrivateTempDir, including its contents.
 * Accepts null/undefined so it can be called unconditionally from `finally`.
 * Only directories created by createPrivateTempDir (under os.tmpdir() with the
 * `complyeasy-` prefix) are removed; anything else is left alone and logged.
 */
export async function removePrivateTempDir(dir: string | null | undefined): Promise<void> {
  if (!dir) {
    return;
  }
  const tmpRoot = path.resolve(os.tmpdir());
  const resolved = path.resolve(dir);
  if (
    path.dirname(resolved) !== tmpRoot ||
    !path.basename(resolved).startsWith('complyeasy-')
  ) {
    logger.warn('Refusing to remove a directory that is not a private temp dir');
    return;
  }
  try {
    await new Promise<void>((resolve, reject) => {
      fs.rm(resolved, { recursive: true, force: true }, (error) => (error ? reject(error) : resolve()));
    });
  } catch (error) {
    logger.warn('Failed to remove private temp directory', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * File extension derived from a MIME type such as `video/mp4`: the subtype,
 * limited to lowercase alphanumerics and inner hyphens (at most 20 characters).
 * Anything else (missing subtype, dots, separators) falls back to the given
 * extension, so the result can never change the directory of the file.
 */
export function safeMediaExtension(mimeType: string | undefined | null, fallback: string): string {
  const subtype = String(mimeType ?? '')
    .split('/')[1]
    ?.split(/[;+]/)[0]
    ?.trim()
    .toLowerCase();
  return subtype && /^[a-z0-9][a-z0-9-]{0,19}$/.test(subtype) ? subtype : fallback;
}
