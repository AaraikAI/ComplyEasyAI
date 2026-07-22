import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'GDPR Compliance Software: Automate Data Privacy & DSARs | ComplyEasy AI';
const SEO_DESCRIPTION =
  'ComplyEasy AI is GDPR compliance software that automates records of processing (RoPA), DPIAs, data-subject request workflows, consent tracking, and breach notification — helping teams achieve and maintain GDPR readiness.';
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
