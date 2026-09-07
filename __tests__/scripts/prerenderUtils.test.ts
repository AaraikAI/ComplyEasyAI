import { describe, expect, it } from 'vitest';
import { referencesOrigin, relativizeOrigin } from '../../scripts/prerenderUtils.mjs';

const ORIGIN = 'http://127.0.0.1:5050';

describe('relativizeOrigin', () => {
  it('rewrites modulepreload and script URLs captured under the local origin', () => {
    const html =
      '<link rel="modulepreload" href="http://127.0.0.1:5050/assets/StatusPage-0We7lXaP.js">' +
      '<script type="module" src="http://127.0.0.1:5050/assets/index-abc.js"></script>' +
      '<link rel="stylesheet" href="/assets/index-IayS71PT.css">';
    const out = relativizeOrigin(html, ORIGIN);
    expect(out).toBe(
      '<link rel="modulepreload" href="/assets/StatusPage-0We7lXaP.js">' +
        '<script type="module" src="/assets/index-abc.js"></script>' +
        '<link rel="stylesheet" href="/assets/index-IayS71PT.css">',
    );
    expect(referencesOrigin(out, ORIGIN)).toBe(false);
  });

  it('leaves the production canonical and unrelated absolute URLs alone', () => {
    const html =
      '<link rel="canonical" href="https://www.complyeasyai.com/soc2-compliance">' +
      '<a href="https://github.com/AaraikAI">x</a>';
    expect(relativizeOrigin(html, ORIGIN)).toBe(html);
  });

  it('collapses a bare origin reference to the site root', () => {
    expect(relativizeOrigin('<a href="http://127.0.0.1:5050">home</a>', ORIGIN)).toBe('<a href="/">home</a>');
  });

  it('referencesOrigin detects a leftover localhost URL', () => {
    expect(referencesOrigin('<img src="http://127.0.0.1:5050/x.png">', ORIGIN)).toBe(true);
    expect(referencesOrigin('<img src="/x.png">', ORIGIN)).toBe(false);
  });
});
