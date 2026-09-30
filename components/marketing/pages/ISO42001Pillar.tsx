import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'ISO 42001 AI Management System Software | ComplyEasyAI';
const SEO_DESCRIPTION =
  'ISO 42001 software for your AI management system (AIMS): AI risk and impact assessment, Annex A controls and lifecycle evidence, kept certification-ready.';
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
