import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'CSRD Compliance Software After Omnibus I | ComplyEasyAI';
const SEO_DESCRIPTION =
  'CSRD compliance software for the post-Omnibus I scope: double-materiality assessment, ESRS disclosure evidence and limited-assurance readiness for companies still in scope.';
const SEO_KEYWORDS =
  'CSRD compliance software, Corporate Sustainability Reporting Directive, Omnibus I, ESRS reporting, double materiality assessment, sustainability reporting software, CSRD limited assurance, climate disclosures';

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
