import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'HIPAA Compliance Software for PHI | ComplyEasyAI';
const SEO_DESCRIPTION =
  'HIPAA compliance software for covered entities and business associates: map the Security, Privacy and Breach Notification Rules and keep the risk analysis current.';
const SEO_KEYWORDS =
  'HIPAA compliance software, HIPAA Security Rule, HIPAA Privacy Rule, HIPAA risk analysis, ePHI safeguards, business associate agreement, HIPAA audit readiness, healthcare compliance automation';

/** HIPAA framework pillar page (Signal design; content from data/frameworkPillarContent). */
const HIPAAPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="hipaa"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default HIPAAPillar;
export { HIPAAPillar };
