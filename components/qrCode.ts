/**
 * Self-contained QR Code generator (byte mode, ECC level M).
 *
 * Produces a boolean module matrix for an arbitrary UTF-8 string, plus helpers
 * to render that matrix to an SVG string or a PNG data URL. Kept dependency-free
 * so the Digital Product Passport can emit real, scannable QR codes for product
 * labelling without pulling in an external package.
 *
 * Algorithm adapted from the public-domain QR Code generator reference design
 * (Project Nayuki), reduced to the byte-mode path used here.
 */

// ── Reed–Solomon / Galois field arithmetic ────────────────────────────────

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // primitive polynomial 0x11d
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], GF_EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < ecLen; i++) res[i] ^= gfMul(gen[i], factor);
  }
  return res;
}

// ── Version / capacity tables (ECC level M, byte mode) ─────────────────────
// For each version 1..10: [totalCodewords, ecCodewordsPerBlock, numBlocks].
// Byte-mode data capacity is derived from these. This covers passport URLs
// comfortably; longer payloads throw so the caller can shorten them.
const ECC_M: Record<number, [number, number, number]> = {
  1: [26, 10, 1],
  2: [44, 16, 1],
  3: [70, 26, 1],
  4: [100, 18, 2],
  5: [134, 24, 2],
  6: [172, 16, 4],
  7: [196, 18, 4],
  8: [242, 22, 4],
  9: [292, 22, 5],
  10: [346, 26, 5],
};

function charCountBits(version: number): number {
  return version <= 9 ? 8 : 16;
}

function dataCodewordsForVersion(version: number): number {
  const [total, ecPerBlock, blocks] = ECC_M[version];
  return total - ecPerBlock * blocks;
}

// ── Bit buffer ─────────────────────────────────────────────────────────────
class BitBuffer {
  bits: number[] = [];
  append(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
}

// ── Module matrix construction ──────────────────────────────────────────────
type Grid = (boolean | null)[][];

function sizeForVersion(version: number): number {
  return version * 4 + 17;
}

function setFunctionPatterns(grid: Grid, version: number): boolean[][] {
  const size = sizeForVersion(version);
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        isFunction[rr][cc] = true;
        const inRing = r >= 0 && r <= 6 && c >= 0 && c <= 6 &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        grid[rr][cc] = inRing;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 0; i < size; i++) {
    if (!isFunction[6][i]) { grid[6][i] = i % 2 === 0; isFunction[6][i] = true; }
    if (!isFunction[i][6]) { grid[i][6] = i % 2 === 0; isFunction[i][6] = true; }
  }

  // Alignment patterns (versions 2..10)
  if (version >= 2) {
    const centres = alignmentCentres(version);
    for (const r of centres) {
      for (const c of centres) {
        // Skip those overlapping finder patterns
        if ((r <= 7 && c <= 7) || (r <= 7 && c >= size - 8) || (r >= size - 8 && c <= 7)) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
            isFunction[rr][cc] = true;
            grid[rr][cc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          }
        }
      }
    }
  }

  // Dark module
  grid[size - 8][8] = true;
  isFunction[size - 8][8] = true;

  // Reserve format-info areas
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  return isFunction;
}

function alignmentCentres(version: number): number[] {
  if (version === 1) return [];
  // For versions 2..6 the single alignment centre table:
  const table: Record<number, number[]> = {
    2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
    7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  };
  return table[version] || [];
}

// ── Data placement ──────────────────────────────────────────────────────────
function placeData(grid: Grid, isFunction: boolean[][], data: number[], size: number): void {
  let bitIndex = 0;
  const totalBits = data.length * 8;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5; // skip the timing column
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (isFunction[row][cc]) continue;
        let bit = false;
        if (bitIndex < totalBits) {
          bit = ((data[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1) === 1;
          bitIndex++;
        }
        grid[row][cc] = bit;
      }
    }
    upward = !upward;
  }
}

// ── Masking + format info ────────────────────────────────────────────────────
function applyMask(grid: Grid, isFunction: boolean[][], maskPattern: number, size: number): void {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFunction[r][c]) continue;
      let invert = false;
      switch (maskPattern) {
        case 0: invert = (r + c) % 2 === 0; break;
        case 1: invert = r % 2 === 0; break;
        case 2: invert = c % 3 === 0; break;
        case 3: invert = (r + c) % 3 === 0; break;
        case 4: invert = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
        case 5: invert = ((r * c) % 2) + ((r * c) % 3) === 0; break;
        case 6: invert = (((r * c) % 2) + ((r * c) % 3)) % 2 === 0; break;
        case 7: invert = (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; break;
        default: invert = false;
      }
      if (invert) grid[r][c] = !grid[r][c];
    }
  }
}

function drawFormatInfo(grid: Grid, maskPattern: number, size: number): void {
  // ECC level M = 0b00; combine with mask, BCH(15,5) encode.
  const data = (0b00 << 3) | maskPattern;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;

  for (let i = 0; i <= 5; i++) grid[8][i] = ((bits >> i) & 1) === 1;
  grid[8][7] = ((bits >> 6) & 1) === 1;
  grid[8][8] = ((bits >> 7) & 1) === 1;
  grid[7][8] = ((bits >> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) grid[14 - i][8] = ((bits >> i) & 1) === 1;

  for (let i = 0; i < 8; i++) grid[size - 1 - i][8] = ((bits >> i) & 1) === 1;
  for (let i = 8; i < 15; i++) grid[8][size - 15 + i] = ((bits >> i) & 1) === 1;
  grid[size - 8][8] = true; // dark module stays set
}

// ── Public API ────────────────────────────────────────────────────────────

/** Encode `text` (UTF-8, byte mode) into a square boolean module matrix. */
export function generateQrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));

  // Choose the smallest version (1..10) that fits.
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const capacityBits = dataCodewordsForVersion(v) * 8;
    const needed = 4 + charCountBits(v) + bytes.length * 8;
    if (needed <= capacityBits) { version = v; break; }
  }
  if (version === 0) throw new Error('QR payload too large for supported versions');

  const dataCodewords = dataCodewordsForVersion(version);

  // Build the bit stream: mode (byte=0100), length, payload, terminator, pad.
  const bb = new BitBuffer();
  bb.append(0b0100, 4);
  bb.append(bytes.length, charCountBits(version));
  for (const b of bytes) bb.append(b, 8);
  const capacityBits = dataCodewords * 8;
  const remaining = capacityBits - bb.bits.length;
  bb.append(0, Math.min(4, remaining));
  while (bb.bits.length % 8 !== 0) bb.bits.push(0);
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bb.bits.length < capacityBits) {
    bb.append(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Pack into codewords.
  const dataBytes: number[] = [];
  for (let i = 0; i < bb.bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bb.bits[i + j];
    dataBytes.push(byte);
  }

  // Split into blocks, compute EC, interleave.
  const [, ecPerBlock, numBlocks] = ECC_M[version];
  const shortBlockLen = Math.floor(dataBytes.length / numBlocks);
  const numLongBlocks = dataBytes.length % numBlocks;
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const len = shortBlockLen + (b >= numBlocks - numLongBlocks ? 1 : 0);
    const block = dataBytes.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
  }

  const finalBytes: number[] = [];
  const maxData = Math.max(...dataBlocks.map(b => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) finalBytes.push(block[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) finalBytes.push(block[i]);
  }

  // Render matrix.
  const size = sizeForVersion(version);
  const grid: Grid = Array.from({ length: size }, () => new Array(size).fill(null));
  const isFunction = setFunctionPatterns(grid, version);
  placeData(grid, isFunction, finalBytes, size);

  // Use a fixed mask pattern (0); format info encodes it for decoders.
  const maskPattern = 0;
  applyMask(grid, isFunction, maskPattern, size);
  drawFormatInfo(grid, maskPattern, size);

  return grid.map(row => row.map(cell => cell === true));
}

/** Render a module matrix as an SVG string with a quiet zone. */
export function matrixToSvg(matrix: boolean[][], moduleSize = 8, quiet = 4): string {
  const n = matrix.length;
  const dim = (n + quiet * 2) * moduleSize;
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        const x = (c + quiet) * moduleSize;
        const y = (r + quiet) * moduleSize;
        rects += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}">` +
    `<rect width="${dim}" height="${dim}" fill="#ffffff"/>` +
    `<g fill="#000000">${rects}</g></svg>`;
}

/** Rasterise a module matrix to a PNG data URL via an offscreen canvas. */
export function matrixToPngDataUrl(matrix: boolean[][], moduleSize = 8, quiet = 4): string {
  const n = matrix.length;
  const dim = (n + quiet * 2) * moduleSize;
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) ctx.fillRect((c + quiet) * moduleSize, (r + quiet) * moduleSize, moduleSize, moduleSize);
    }
  }
  return canvas.toDataURL('image/png');
}
