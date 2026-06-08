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
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

export default JsonLd;
export { JsonLd };
