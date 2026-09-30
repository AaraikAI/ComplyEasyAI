import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'SOC 2 Compliance Software: Type I & II | ComplyEasyAI';
const SEO_DESCRIPTION =
  'SOC 2 compliance software that maps your controls to the Trust Services Criteria, collects evidence continuously and prepares you for Type I and Type II audits.';
const SEO_KEYWORDS =
  'SOC 2 compliance software, SOC 2 automation, SOC 2 Type II, SOC 2 Type I, Trust Services Criteria, SOC 2 readiness, continuous control monitoring, SOC 2 audit preparation, SOC 2 evidence collection';

/** SOC 2 framework pillar page (Signal design; content from data/frameworkPillarContent). */
const SOC2Pillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="soc-2"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default SOC2Pillar;
export { SOC2Pillar };
