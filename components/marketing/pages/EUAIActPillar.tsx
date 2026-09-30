import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'EU AI Act Compliance: Timeline & Requirements | ComplyEasyAI';
const SEO_DESCRIPTION =
  'EU AI Act compliance after the 2026 Digital Omnibus: prohibitions, GPAI duties, transparency from August 2026, and high-risk deadlines in December 2027 and August 2028.';
const SEO_KEYWORDS =
  'EU AI Act compliance, EU AI Act timeline, Digital Omnibus on AI, high-risk AI systems, AI Act conformity assessment, GPAI obligations, prohibited AI practices, AI transparency, AI risk classification';

/** EU AI Act framework pillar page (Signal design; content from data/frameworkPillarContent). */
const EUAIActPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="eu-ai-act"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default EUAIActPillar;
export { EUAIActPillar };
