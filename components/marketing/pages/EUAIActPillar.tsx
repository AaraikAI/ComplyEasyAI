import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'EU AI Act Compliance: Requirements, Risk Tiers & Checklist | ComplyEasy AI';
const SEO_DESCRIPTION =
  'A practical guide to EU AI Act compliance: risk classification, obligations for high-risk and GPAI systems, conformity assessment, transparency, and how ComplyEasy AI automates the work.';
const SEO_KEYWORDS =
  'EU AI Act compliance, EU AI Act requirements, high-risk AI systems, AI Act conformity assessment, GPAI obligations, AI governance, prohibited AI practices, AI transparency, AI risk classification';

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
