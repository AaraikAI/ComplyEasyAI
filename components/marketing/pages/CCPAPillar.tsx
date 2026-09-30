import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'CCPA/CPRA Compliance Software | ComplyEasyAI';
const SEO_DESCRIPTION =
  "CCPA and CPRA compliance software: route consumer requests, keep privacy notices accurate, and prepare for the CPPA's 2026 risk-assessment, audit and ADMT rules.";
const SEO_KEYWORDS =
  'CCPA compliance software, CPRA compliance, California Consumer Privacy Act, consumer rights requests, opt out of sale, ADMT regulations, CPPA risk assessment, CCPA cybersecurity audit';

/** CCPA framework pillar page (Signal design; content from data/frameworkPillarContent). */
const CCPAPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="ccpa"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default CCPAPillar;
export { CCPAPillar };
