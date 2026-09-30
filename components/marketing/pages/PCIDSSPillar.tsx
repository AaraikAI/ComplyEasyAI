import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE = 'PCI DSS v4.0.1 Compliance Software | ComplyEasyAI';
const SEO_DESCRIPTION =
  'PCI DSS v4.0.1 compliance software that scopes your cardholder data environment, maps the 12 requirements and monitors in-scope systems for drift continuously.';
const SEO_KEYWORDS =
  'PCI DSS compliance software, PCI DSS v4.0.1, cardholder data environment, PCI DSS requirements, PCI DSS automation, SAQ scoping, continuous compliance monitoring, payment card security';

/** PCI DSS framework pillar page (Signal design; content from data/frameworkPillarContent). */
const PCIDSSPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="pci-dss"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default PCIDSSPillar;
export { PCIDSSPillar };
