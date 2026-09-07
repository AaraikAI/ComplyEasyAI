import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'India DPDPA Compliance Software: DPDP Act 2023 & Rules 2025 | ComplyEasy AI';
const SEO_DESCRIPTION =
  "India DPDPA compliance software that maps your processing to the Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025 — notice and consent, Data Fiduciary duties, breach notification, children's data and Data Principal rights — kept continuously audit-ready.";
const SEO_KEYWORDS =
  'India DPDPA compliance, DPDP Act 2023, DPDP Rules 2025, Digital Personal Data Protection Act, Data Fiduciary, Significant Data Fiduciary, Data Principal rights, India data protection software';

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
