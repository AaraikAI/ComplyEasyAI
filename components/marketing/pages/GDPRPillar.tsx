import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'GDPR Compliance Software: RoPA, DPIAs & DSARs | ComplyEasyAI';
const SEO_DESCRIPTION =
  'GDPR compliance software that keeps your records of processing, DPIAs, data-subject requests and 72-hour breach response current as your product changes.';
const SEO_KEYWORDS =
  'GDPR compliance software, GDPR automation, data subject access request software, RoPA tool, DPIA software, GDPR data privacy platform, GDPR breach notification, consent management';

/** GDPR framework pillar page (Signal design; content from data/frameworkPillarContent). */
const GDPRPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="gdpr"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default GDPRPillar;
export { GDPRPillar };
