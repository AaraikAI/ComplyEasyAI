import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'India DPDP Act & Rules 2025 Compliance | ComplyEasyAI';
const SEO_DESCRIPTION =
  'India DPDPA compliance for the DPDP Act, 2023 and DPDP Rules, 2025: consent, security, breach notice and Data Principal rights, with most duties from 13 May 2027.';
const SEO_KEYWORDS =
  'India DPDPA compliance, DPDP Act 2023, DPDP Rules 2025, Digital Personal Data Protection Act, DPDP timeline, Data Fiduciary, Significant Data Fiduciary, Data Principal rights';

/** India DPDPA framework pillar page (Signal design; content from data/frameworkPillarContent). */
const IndiaDPDPAPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="india-dpdpa"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default IndiaDPDPAPillar;
export { IndiaDPDPAPillar };
