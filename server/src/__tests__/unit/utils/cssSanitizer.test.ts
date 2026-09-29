import { describe, it, expect } from '@jest/globals';
import { sanitizeCustomCss } from '../../../utils/cssSanitizer';

const BLOCKED_SCHEME = /\b(?:javascript|vbscript|data)\s*:/;
const BLOCKED_EXPRESSION = /\bexpression\s*\(/;

describe('sanitizeCustomCss', () => {
  it('keeps ordinary declarations intact', () => {
    const css =
      '.btn { color: #fff; scroll-behavior: smooth; content: "\\201C"; background: url(https://cdn.example.com/a.png); }';
    expect(sanitizeCustomCss(css)).toBe(css);
  });

  it('removes every angle bracket so the style element cannot be closed', () => {
    const out = sanitizeCustomCss('a{}</style><script>alert(1)</script><scr<x>ipt>');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
  });

  it.each([
    ['url(javascript:alert(1))'],
    ['url( JavaScript :alert(1))'],
    ['url(vbscript:msgbox(1))'],
    ['url(data:text/css;base64,QUJD)'],
    ['width: expression(alert(1))'],
    ['@import url(https://evil.example/x.css);'],
    ['-moz-binding: url(x.xml#xss)'],
  ])('neutralises %s', (css) => {
    const out = sanitizeCustomCss(css).toLowerCase();
    expect(out).not.toMatch(BLOCKED_SCHEME);
    expect(out).not.toMatch(BLOCKED_EXPRESSION);
    expect(out).not.toContain('@import');
    expect(out).not.toContain('-moz-binding');
  });

  it('cannot be tricked into reassembling a blocked token', () => {
    for (const css of ['data data::', 'javajavascript:script:', 'expexpression(ression(', '@im@importport']) {
      const out = sanitizeCustomCss(css).toLowerCase();
      expect(out).not.toMatch(BLOCKED_SCHEME);
      expect(out).not.toMatch(BLOCKED_EXPRESSION);
      expect(out).not.toContain('@import');
    }
  });

  it('runs in linear time on a long run of angle brackets', () => {
    const start = process.hrtime.bigint();
    sanitizeCustomCss('<'.repeat(50000));
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    expect(elapsedMs).toBeLessThan(500);
  });
});
