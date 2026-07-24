import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'CSRD Compliance Software: ESRS Reporting & Double Materiality | ComplyEasy AI';
const SEO_DESCRIPTION =
  'CSRD compliance software that structures your double-materiality assessment, organizes ESRS disclosure evidence, and prepares sustainability reporting for limited — then reasonable — assurance.';
const SEO_KEYWORDS =
  'CSRD compliance software, Corporate Sustainability Reporting Directive, ESRS reporting, double materiality assessment, sustainability reporting software, ESG compliance, CSRD assurance readiness, climate disclosures';

/** CSRD framework pillar page (Signal design; content from data/frameworkPillarContent). */
const CSRDPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="csrd"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default CSRDPillar;
export { CSRDPillar };
