import React from 'react';
import SignalCompetitorPage from './SignalCompetitorPage';

// Per-page SEO strings, carried over verbatim from the previous page version.
const SEO_TITLE = 'ComplyEasy AI vs Drata: The Best Drata Alternative';
const SEO_DESCRIPTION =
  'Compare ComplyEasy AI and Drata for compliance automation. See how an AI-native, agentic platform with broad AI-regulation coverage (EU AI Act, NIST AI RMF) stacks up against Drata across continuous monitoring, frameworks, and pricing transparency.';
const SEO_KEYWORDS =
  'Drata alternative, ComplyEasy AI vs Drata, compliance automation, AI-native compliance, EU AI Act, NIST AI RMF, SOC 2 automation';

const DrataAlternative: React.FC = () => (
  <SignalCompetitorPage
    slug="drata"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default DrataAlternative;
export { DrataAlternative };
