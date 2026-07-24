import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'DORA Compliance Software: ICT Risk & Operational Resilience | ComplyEasy AI';
const SEO_DESCRIPTION =
  'DORA compliance software for EU financial entities — ICT risk management, major-incident classification and reporting, resilience testing, and third-party ICT registers, structured in one continuously monitored program.';
const SEO_KEYWORDS =
  'DORA compliance software, Digital Operational Resilience Act, ICT risk management, DORA incident reporting, operational resilience testing, third-party ICT risk, register of information, EU financial services compliance';

/** DORA framework pillar page (Signal design; content from data/frameworkPillarContent). */
const DORAPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="dora"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default DORAPillar;
export { DORAPillar };
