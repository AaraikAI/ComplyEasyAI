import React from 'react';
import SignalCompetitorPage from './SignalCompetitorPage';

// Per-page SEO strings, carried over verbatim from the previous page version.
const SEO_TITLE = 'ComplyEasy AI vs OneTrust: The Best OneTrust Alternative | ComplyEasy AI';
const SEO_DESCRIPTION =
  'Comparing ComplyEasy AI and OneTrust as a OneTrust alternative: an AI-native, agentic platform that unifies security-framework automation, privacy management, and AI governance in one place. See a fair, capability-focused feature comparison.';
const SEO_KEYWORDS =
  'OneTrust alternative, ComplyEasy AI vs OneTrust, AI compliance automation, agentic compliance, privacy management, RoPA DPIA, AI governance, EU AI Act compliance, NIST AI RMF, GDPR automation';

const OneTrustAlternative: React.FC = () => (
  <SignalCompetitorPage
    slug="onetrust"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
    seoOgType="article"
  />
);

export default OneTrustAlternative;
export { OneTrustAlternative };
