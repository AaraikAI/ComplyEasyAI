import React from 'react';
import SignalCompetitorPage from './SignalCompetitorPage';

// Per-page SEO strings, carried over verbatim from the previous page version.
const SEO_TITLE = 'ComplyEasy AI vs Secureframe: The Best Secureframe Alternative';
const SEO_DESCRIPTION =
  "Comparing Secureframe alternatives? See how ComplyEasy AI's AI-native agentic automation, SOC 2 / ISO 27001 / HIPAA coverage, and EU AI Act and NIST AI RMF support stack up against Secureframe — feature by feature.";
const SEO_KEYWORDS =
  'Secureframe alternative, ComplyEasy AI vs Secureframe, compliance automation, SOC 2, ISO 27001, HIPAA, EU AI Act, NIST AI RMF';

const SecureframeAlternative: React.FC = () => (
  <SignalCompetitorPage
    slug="secureframe"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default SecureframeAlternative;
export { SecureframeAlternative };
