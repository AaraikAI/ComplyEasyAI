import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'AIUC-1 Compliance Software: Certify Your AI Agents | ComplyEasy AI';
const SEO_DESCRIPTION =
  'AIUC-1 compliance software that maps your AI agents to the six pillars of the AI Underwriting Company standard — data and privacy, security, safety, reliability, accountability and society — with evidence kept continuously audit-ready.';
const SEO_KEYWORDS =
  'AIUC-1 compliance, AIUC-1 certification, AI agent standard, AI Underwriting Company, AI agent security, AI agent governance, prompt injection defence, AI insurance readiness';

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
