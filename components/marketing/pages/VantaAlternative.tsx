import React from 'react';
import SignalCompetitorPage from './SignalCompetitorPage';

// Per-page SEO strings, carried over verbatim from the previous page version.
const SEO_TITLE = 'ComplyEasy AI vs Vanta: The Best Vanta Alternative | ComplyEasy AI';
const SEO_DESCRIPTION =
  'Comparing ComplyEasy AI and Vanta as a Vanta alternative: an AI-native, agentic compliance platform with first-class EU AI Act and NIST AI RMF coverage alongside SOC 2 and ISO 27001. See a fair, capability-focused feature comparison.';
const SEO_KEYWORDS =
  'Vanta alternative, ComplyEasy AI vs Vanta, AI compliance automation, agentic compliance, EU AI Act compliance, NIST AI RMF, SOC 2 automation, ISO 27001 automation';

const VantaAlternative: React.FC = () => (
  <SignalCompetitorPage
    slug="vanta"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
    seoOgType="article"
  />
);

export default VantaAlternative;
export { VantaAlternative };
