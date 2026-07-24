import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'ISO 42001 Software: Certify Your AI Management System | ComplyEasy AI';
const SEO_DESCRIPTION =
  'ISO 42001 software that operationalizes your AI Management System (AIMS) — AI risk and impact assessment, lifecycle controls, and data governance — with evidence kept continuously certification-ready.';
const SEO_KEYWORDS =
  'ISO 42001 software, ISO 42001 compliance, AI management system, AIMS certification, ISO/IEC 42001, responsible AI governance, AI lifecycle controls, AI risk and impact assessment';

/** ISO 42001 framework pillar page (Signal design; content from data/frameworkPillarContent). */
const ISO42001Pillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="iso-42001"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default ISO42001Pillar;
export { ISO42001Pillar };
