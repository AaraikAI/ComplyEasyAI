import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'DSA Compliance Software: Transparency & Content Moderation Duties | ComplyEasy AI';
const SEO_DESCRIPTION =
  'DSA compliance software that structures Digital Services Act duties — notice-and-action records, transparency reporting, trusted-flagger handling, ad disclosures, and systemic-risk assessments for very large platforms.';
const SEO_KEYWORDS =
  'DSA compliance software, Digital Services Act, content moderation compliance, transparency reporting, VLOP obligations, notice and action, systemic risk assessment, EU platform regulation';

/** DSA framework pillar page (Signal design; content from data/frameworkPillarContent). */
const DSAPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="dsa"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default DSAPillar;
export { DSAPillar };
