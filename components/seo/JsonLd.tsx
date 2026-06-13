import React from 'react';

export interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Renders a schema.org JSON-LD block. Safe to render multiple times on a page;
 * each instance emits its own <script type="application/ld+json"> element.
 */
const JsonLd: React.FC<JsonLdProps> = ({ data }) => (
  <script
    type="application/ld+json"
    // Escape every '<' as its < JSON escape so a value containing a
    // literal </script> can never break out of the element (defense-in-depth;
    // the browser still parses it back to valid JSON-LD).
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
  />
);

export default JsonLd;
export { JsonLd };
