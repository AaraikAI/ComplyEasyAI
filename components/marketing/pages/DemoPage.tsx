import React from 'react';
import { Check } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema } from '../../seo/siteSchema';
import { Eyebrow } from '../signal';
import DemoBookingForm from '../../DemoBookingForm';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE = 'Book a Demo: See AI Compliance Automation Live | ComplyEasy AI';
const SEO_DESCRIPTION =
  'Book a 30-minute ComplyEasy AI demo tailored to your frameworks. See autonomous evidence collection, control monitoring, and remediation live — with a pricing and ROI estimate for your team.';
const SEO_KEYWORDS =
  'compliance automation demo, ComplyEasy AI demo, SOC 2 automation demo, compliance software walkthrough, GRC platform demo, book a compliance demo';

// Left-column proof points from the Signal design handoff.
const demoBenefits = [
  'Tailored to your framework mix, not a canned deck',
  'A live look at autonomous evidence & remediation',
  'A tailored pricing & ROI estimate for your team',
];

const DemoPage: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/demo"
        keywords={SEO_KEYWORDS}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'Book a demo', url: 'https://complyeasyai.com/demo' },
        ])}
      />

      <section className="bg-signal-glow px-6 pb-20 pt-10 md:px-10">
        <div className="mx-auto grid max-w-[1140px] items-start gap-10 md:grid-cols-[0.9fr_1.1fr]">
          {/* ===================== Left — value prop ===================== */}
          <div className="pt-5">
            <Eyebrow className="mb-3.5">Book a demo</Eyebrow>
            <h1 className="font-display text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-signal-ink md:text-[44px]">
              See compliance run itself.
            </h1>
            <p className="mt-[18px] max-w-[440px] text-[17px] leading-relaxed text-signal-sub">
              A 30-minute walkthrough tailored to your frameworks. We&rsquo;ll map your stack live and
              show the ROI for your team.
            </p>
            <div className="mt-[30px] flex flex-col gap-3.5">
              {demoBenefits.map((line) => (
                <div key={line} className="flex items-start gap-3">
                  <Check size={16} className="mt-0.5 flex-none text-signal-green" aria-hidden="true" />
                  <span className="text-[15px] text-signal-body">{line}</span>
                </div>
              ))}
            </div>
            <div className="mt-[34px] border-t border-white/[0.08] pt-6 font-mono text-[11px] tracking-[0.12em] text-signal-muted">
              TYPICALLY RESPONDS WITHIN 24 HOURS
            </div>
          </div>

          {/* ===================== Right — booking form ===================== */}
          <DemoBookingForm variant="inline" source="demo_page" />
        </div>
      </section>
    </MarketingLayout>
  );
};

export default DemoPage;
export { DemoPage };
