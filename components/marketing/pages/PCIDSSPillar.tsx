import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'PCI DSS Compliance Software: Protect Cardholder Data Continuously | ComplyEasy AI';
const SEO_DESCRIPTION =
  'PCI DSS compliance software that maps your cardholder data environment to the 12 requirements, automates evidence collection, and continuously monitors in-scope systems — so drift surfaces before your assessor finds it.';
const SEO_KEYWORDS =
  'PCI DSS compliance software, PCI DSS 4.0, cardholder data environment, PCI DSS requirements, PCI DSS automation, SAQ scoping, continuous compliance monitoring, payment card security';

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
