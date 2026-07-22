import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'CCPA Compliance Software: Automate Consumer Privacy Rights | ComplyEasy AI';
const SEO_DESCRIPTION =
  'CCPA compliance software that routes and tracks consumer requests — know, delete, correct, and opt out of sale or sharing — keeps privacy notices aligned with what you actually collect, and maintains evidence for CPRA obligations.';
const SEO_KEYWORDS =
  'CCPA compliance software, CPRA compliance, California Consumer Privacy Act, consumer rights requests, opt out of sale, sensitive personal information, privacy notice management, CCPA automation';

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
