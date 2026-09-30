import { describe, it, expect, jest, afterEach } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import {
  createPrivateTempDir,
  removePrivateTempDir,
  safeMediaExtension,
  PRIVATE_TEMP_FILE_OPTIONS,
} from '../../../utils/privateTempDir';

const isPosix = process.platform !== 'win32';

describe('privateTempDir', () => {
  const created: string[] = [];

  afterEach(() => {
    for (const dir of created.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('creates a fresh owner-only directory directly under the OS temp dir', async () => {
    const a = await createPrivateTempDir('media');
    const b = await createPrivateTempDir('media');
    created.push(a, b);

    expect(a).not.toBe(b);
    expect(path.dirname(a)).toBe(path.resolve(os.tmpdir()));
    expect(path.basename(a).startsWith('complyeasy-media-')).toBe(true);
    if (isPosix) {
      expect(fs.statSync(a).mode & 0o777).toBe(0o700);
    }
  });

  it('strips separators from the prefix so the directory stays in the temp dir', async () => {
    const dir = await createPrivateTempDir('../../etc/evil');
    created.push(dir);
    expect(path.dirname(dir)).toBe(path.resolve(os.tmpdir()));
    expect(path.basename(dir).startsWith('complyeasy-etcevil-')).toBe(true);
  });

  it('writes owner-only files and never overwrites or follows an existing path', async () => {
    const dir = await createPrivateTempDir('write');
    created.push(dir);
    const file = path.join(dir, 'input.mp4');

    await fs.promises.writeFile(file, Buffer.from('first'), PRIVATE_TEMP_FILE_OPTIONS);
    if (isPosix) {
      expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    }
    await expect(
      fs.promises.writeFile(file, Buffer.from('second'), PRIVATE_TEMP_FILE_OPTIONS)
    ).rejects.toMatchObject({ code: 'EEXIST' });
    expect(fs.readFileSync(file, 'utf8')).toBe('first');

    if (isPosix) {
      const target = path.join(dir, 'target.txt');
      const link = path.join(dir, 'link.mp4');
      fs.writeFileSync(target, 'untouched');
      fs.symlinkSync(target, link);
      await expect(
        fs.promises.writeFile(link, Buffer.from('redirected'), PRIVATE_TEMP_FILE_OPTIONS)
      ).rejects.toMatchObject({ code: 'EEXIST' });
      expect(fs.readFileSync(target, 'utf8')).toBe('untouched');
    }
  });

  it('removes the directory and its contents, and tolerates null', async () => {
    const dir = await createPrivateTempDir('cleanup');
    fs.writeFileSync(path.join(dir, 'frame_0.jpg'), 'x');

    await removePrivateTempDir(dir);
    expect(fs.existsSync(dir)).toBe(false);
    await expect(removePrivateTempDir(null)).resolves.toBeUndefined();
    await expect(removePrivateTempDir(undefined)).resolves.toBeUndefined();
  });

  it('refuses to remove a directory it did not create', async () => {
    const other = fs.mkdtempSync(path.join(os.tmpdir(), 'not-ours-'));
    created.push(other);

    await removePrivateTempDir(other);
    expect(fs.existsSync(other)).toBe(true);
  });

  it.each([
    ['video/mp4', 'mp4'],
    ['video/quicktime', 'quicktime'],
    ['video/x-matroska', 'x-matroska'],
    ['video/webm; codecs=vp9', 'webm'],
    ['VIDEO/MP4', 'mp4'],
  ])('derives the extension %s -> %s', (mime, ext) => {
    expect(safeMediaExtension(mime, 'bin')).toBe(ext);
  });

  it.each([undefined, null, '', 'video', 'video/', 'video/../../x', 'video/a.b', 'video/-x', 'x/y\\z'])(
    'falls back for %p',
    (mime) => {
      expect(safeMediaExtension(mime as string | undefined | null, 'mp4')).toBe('mp4');
    }
  );
});
