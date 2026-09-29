/**
 * Sanitizer for organization-supplied custom CSS (white-label branding).
 *
 * The stylesheet is injected into a <style> element, so two things matter:
 *
 * 1. It must not be able to close that element. Every `<` and `>` is removed.
 *    The pattern is a single-character class, so the removal itself can never
 *    assemble a new tag (unlike stripping `<...>` spans, where `<scr<x>ipt>`
 *    collapses into `<script>`).
 * 2. Constructs that run script or load unsanitized styles are neutralized:
 *    `javascript:`, `vbscript:` and `data:` URL schemes, legacy `expression(`
 *    and `-moz-binding`, and `@import`. Each match is replaced with `_` rather
 *    than deleted, so the text on either side of a match is never spliced into
 *    a new token: `data data::` becomes `data _:`, whereas deleting the match
 *    would leave `data :`, itself a `data:` scheme. A single pass is therefore
 *    complete.
 *
 * Every pattern is linear: no nested or overlapping quantifiers.
 */

const ANGLE_BRACKETS = /[<>]/g;

const BLOCKED_CSS_CONSTRUCTS = /\b(?:javascript|vbscript|data)\s*:|\bexpression\s*\(|@import|-moz-binding/gi;

export function sanitizeCustomCss(input: string): string {
  return input.replace(ANGLE_BRACKETS, '').replace(BLOCKED_CSS_CONSTRUCTS, '_');
}
