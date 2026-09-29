/**
 * Sanitizer for organization-supplied custom CSS (white-label branding).
 *
 * The stylesheet is injected into a <style> element, so two things matter:
 *
 * 1. It must not be able to close that element or open a new tag. Every `<` is
 *    removed. Inside <style> the HTML parser only ends the element at `</style`,
 *    and no tag can start without `<`, so `>` stays (it is the CSS child
 *    combinator, e.g. `.nav > li`). The pattern is a single character, so the
 *    removal itself can never assemble a new tag (unlike stripping `<...>`
 *    spans, where `<scr<x>ipt>` collapses into `<script>`).
 * 2. Constructs that run script or load unsanitized styles are neutralized:
 *    `javascript:`, `vbscript:` and `data:` URL schemes, legacy `expression(`
 *    and `-moz-binding`, and `@import`. A scheme is only matched where a URL
 *    value can start (after `(`, a quote or whitespace), so selectors such as
 *    `.user-data:hover` are left alone. Each match is replaced with `_` rather
 *    than deleted, so the text on either side of a match is never spliced into
 *    a new token: `url(data data::` becomes `url(data _:`, whereas deleting the
 *    match would leave `url(data :`. A single pass is therefore complete.
 *
 * Every pattern is linear: no nested or overlapping quantifiers.
 */

const OPEN_ANGLE_BRACKET = /</g;

const BLOCKED_CSS_CONSTRUCTS =
  /(?<=[(\s'"])(?:javascript|vbscript|data)\s*:|\bexpression\s*\(|@import|-moz-binding/gi;

export function sanitizeCustomCss(input: string): string {
  return input.replace(OPEN_ANGLE_BRACKET, '').replace(BLOCKED_CSS_CONSTRUCTS, '_');
}
