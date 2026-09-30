import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'AIUC-1 Certification for AI Agents | ComplyEasyAI';
const SEO_DESCRIPTION =
  'AIUC-1 compliance software that maps your AI agents to the 51 requirements of the Artificial Intelligence Underwriting Company standard, with evidence kept audit-ready.';
const SEO_KEYWORDS =
  'AIUC-1 compliance, AIUC-1 certification, AI agent standard, Artificial Intelligence Underwriting Company, AI agent security, AI agent governance, prompt injection defence, AI insurance readiness';

/** AIUC-1 framework pillar page (Signal design; content from data/frameworkPillarContent). */
const AIUC1Pillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="aiuc-1"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default AIUC1Pillar;
export { AIUC1Pillar };
