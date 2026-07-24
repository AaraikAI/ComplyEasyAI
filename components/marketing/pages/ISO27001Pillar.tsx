import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'ISO 27001 Software: Automate ISMS Certification & Annex A Controls | ComplyEasy AI';
const SEO_DESCRIPTION =
  'ISO 27001 software that automates your ISMS — Annex A control mapping, Statement of Applicability, risk treatment, and continuous evidence collection. Get certification-ready faster with ComplyEasy AI.';
const SEO_KEYWORDS =
  'ISO 27001 software, ISO 27001 compliance, ISMS software, ISO 27001 certification, Annex A controls, Statement of Applicability, ISO 27001:2022, risk treatment plan, ISO 27001 automation';

/** ISO 27001 framework pillar page (Signal design; content from data/frameworkPillarContent). */
const ISO27001Pillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="iso-27001"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default ISO27001Pillar;
export { ISO27001Pillar };
