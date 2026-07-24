import React from 'react';
import SignalCompetitorPage from './SignalCompetitorPage';

// Per-page SEO strings, carried over verbatim from the previous page version.
const SEO_TITLE = 'ComplyEasy AI vs Sprinto: The Best Sprinto Alternative';
const SEO_DESCRIPTION =
  'Comparing ComplyEasy AI and Sprinto? See a fair, capability-focused breakdown. ComplyEasy AI is an AI-native Sprinto alternative with agentic automation and native EU AI Act and NIST AI RMF coverage, alongside SOC 2, ISO 27001, GDPR, and HIPAA.';
const SEO_KEYWORDS =
  'Sprinto alternative, ComplyEasy AI vs Sprinto, compliance automation, AI compliance, SOC 2, ISO 27001, EU AI Act, NIST AI RMF';

const SprintoAlternative: React.FC = () => (
  <SignalCompetitorPage
    slug="sprinto"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default SprintoAlternative;
export { SprintoAlternative };
