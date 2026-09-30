import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'NIST AI RMF: Govern, Map, Measure, Manage | ComplyEasyAI';
const SEO_DESCRIPTION =
  'A practical guide to the NIST AI Risk Management Framework (AI RMF 1.0): the four functions, the trustworthiness characteristics and the Generative AI Profile.';
const SEO_KEYWORDS =
  'NIST AI RMF, NIST AI Risk Management Framework, AI RMF 1.0, Govern Map Measure Manage, trustworthy AI, AI governance framework, NIST AI 600-1, generative AI profile, AI risk management';

/** NIST AI RMF framework pillar page (Signal design; content from data/frameworkPillarContent). */
const NISTAIRMFPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="nist-ai-rmf"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default NISTAIRMFPillar;
export { NISTAIRMFPillar };
