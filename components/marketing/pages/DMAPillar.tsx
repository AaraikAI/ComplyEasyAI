import React from 'react';
import SignalFrameworkPillar from './SignalFrameworkPillar';

const SEO_TITLE =
  'DMA Compliance Software: Manage Gatekeeper Obligations | ComplyEasy AI';
const SEO_DESCRIPTION =
  'DMA compliance software that tracks Digital Markets Act obligations for designated gatekeepers — interoperability, self-preferencing limits, and data-use rules — and structures the compliance reporting the European Commission expects.';
const SEO_KEYWORDS =
  'DMA compliance software, Digital Markets Act, gatekeeper obligations, core platform services, DMA compliance reporting, interoperability requirements, self-preferencing, EU digital markets regulation';

/** DMA framework pillar page (Signal design; content from data/frameworkPillarContent). */
const DMAPillar: React.FC = () => (
  <SignalFrameworkPillar
    slug="dma"
    seoTitle={SEO_TITLE}
    seoDescription={SEO_DESCRIPTION}
    seoKeywords={SEO_KEYWORDS}
  />
);

export default DMAPillar;
export { DMAPillar };
