import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'NIST CSF Compliance Software: Assess, Measure & Improve Your Posture | ComplyEasy AI';
const SEO_DESCRIPTION =
  'NIST CSF compliance software that maps your environment to the CSF 2.0 functions — Govern, Identify, Protect, Detect, Respond, and Recover — and tracks maturity continuously instead of through periodic spreadsheets.';
const SEO_KEYWORDS =
  'NIST CSF compliance software, NIST Cybersecurity Framework, NIST CSF 2.0, NIST CSF assessment, Govern function, cybersecurity posture management, NIST CSF maturity, security framework mapping';

/** NIST CSF framework pillar page (Signal design; content from data/frameworkPillarContent). */
const NISTCSFPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="nist-csf"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default NISTCSFPillar;
export { NISTCSFPillar };
