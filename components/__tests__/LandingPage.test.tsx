import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { LandingPage } from '../LandingPage';

// react-router, lucide-react and the marketing contexts are mocked globally
// in setupTests.ts (Link -> <a href>, useLocation -> '/'). MemoryRouter is a
// passthrough there, matching the other marketing-page tests.
const renderPage = () => render(<MemoryRouter><LandingPage /></MemoryRouter>);

describe('LandingPage', () => {
  beforeEach(() => {
    // Reset Element.prototype.scrollIntoView (a vi.fn from setupTests) between tests.
    vi.clearAllMocks();
  });

  // ---- Hero ----

  describe('hero', () => {
    it('renders the mono eyebrow pill', () => {
      renderPage();
      expect(screen.getByText('Autonomous Compliance OS')).toBeInTheDocument();
    });

    it('renders a headline that names the category', () => {
      renderPage();
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('AI compliance automation');
      expect(h1).toHaveTextContent('that runs itself.');
    });

    it('answers "what is it" directly under the headline', () => {
      renderPage();
      const lede = screen.getByText(/identity and vendors, collects audit evidence continuously/);
      expect(lede.textContent).toMatch(/^ComplyEasyAI is an AI compliance automation platform\./);
      expect(lede.textContent).toContain('across 16 frameworks');
    });

    it('renders the aCOS status card', () => {
      renderPage();
      expect(screen.getByText('aCOS · operating')).toBeInTheDocument();
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('renders the framework chips', () => {
      renderPage();
      for (const name of ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'EU AI Act', 'DORA']) {
        expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
      }
    });

    it('points the "Book a demo" CTA at /demo', () => {
      renderPage();
      const demoLinks = screen.getAllByText('Book a demo');
      expect(demoLinks.length).toBeGreaterThanOrEqual(1);
      demoLinks.forEach((link) => {
        expect(link.closest('a')).toHaveAttribute('href', '/demo');
      });
    });

    it('scrolls to the platform section when "See it in motion" is clicked', () => {
      renderPage();
      fireEvent.click(screen.getByText('See it in motion'));
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  // ---- "Three jobs" cards ----

  it('renders the "three jobs" section', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'What does ComplyEasyAI do?' })).toBeInTheDocument();
    expect(screen.getByText('Audit-ready, continuously')).toBeInTheDocument();
    expect(screen.getByText('It runs itself')).toBeInTheDocument();
  });

  // ---- ROI calculator ----

  describe('ROI calculator', () => {
    it('renders the three sliders and the reclaimed-hours output', () => {
      renderPage();
      expect(screen.getByText('How much time could you reclaim?')).toBeInTheDocument();
      expect(screen.getAllByRole('slider')).toHaveLength(3);
      expect(screen.getByLabelText('Team size')).toBeInTheDocument();
      expect(screen.getByLabelText('Frameworks pursued')).toBeInTheDocument();
      expect(screen.getByLabelText('Point tools today')).toBeInTheDocument();
      expect(screen.getByText('hours / year reclaimed')).toBeInTheDocument();
    });

    it('updates the reclaimed-hours output when a slider moves', () => {
      renderPage();
      // Defaults (team 60, frameworks 3, tools 5, automation 80%) -> 660 hrs/year.
      expect(screen.getByText('660')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Team size'), { target: { value: '500' } });

      // team 500 -> round(0.8 * (18 + 200 + 27)) * 12 = 2,352 hrs/year.
      expect(screen.getByText('2,352')).toBeInTheDocument();
      expect(screen.queryByText('660')).not.toBeInTheDocument();
    });
  });

  // ---- Competitor comparison (removed 2026-09-07; must not come back) ----

  it('does not render a competitor comparison matrix', () => {
    renderPage();
    expect(screen.queryByRole('table', { name: /Capability comparison/i })).not.toBeInTheDocument();
    expect(screen.queryByText('How the platforms stack up')).not.toBeInTheDocument();
    expect(screen.queryByText('See the full comparison →')).not.toBeInTheDocument();
    for (const competitor of ['Vanta', 'Drata', 'Sprinto', 'OneTrust']) {
      expect(screen.queryByText(competitor)).not.toBeInTheDocument();
    }
  });

  // ---- Pricing teaser (no numbers) ----

  describe('pricing teaser', () => {
    it('renders the outcomes-based pricing answer with no dollar figures', () => {
      renderPage();
      const heading = screen.getByRole('heading', { name: 'How is ComplyEasyAI priced?' });
      expect(screen.getByText(/Priced for outcomes, not seats/)).toBeInTheDocument();
      expect(heading.closest('section')?.textContent).not.toMatch(/\$\d/);
    });

    it('links "Talk to us about pricing" at /pricing', () => {
      renderPage();
      const link = screen.getByText(/Talk to us about pricing/);
      expect(link.closest('a')).toHaveAttribute('href', '/pricing');
    });
  });

  // ---- Common questions ----

  describe('common questions', () => {
    it('renders each question and emits the same pairs as FAQPage structured data', () => {
      renderPage();
      const faqPage = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((node) => JSON.parse(node.textContent ?? '{}'))
        .find((block) => block['@type'] === 'FAQPage');
      expect(faqPage).toBeDefined();
      expect(faqPage.mainEntity.length).toBe(4);
      for (const entry of faqPage.mainEntity) {
        expect(screen.getByText(entry.name)).toBeInTheDocument();
        expect(screen.getByText(entry.acceptedAnswer.text)).toBeInTheDocument();
      }
    });

    it('lists every framework guide in the frameworks answer', () => {
      renderPage();
      const answer = screen.getByText(/frameworks have in-depth guides:/);
      for (const name of ['SOC 2', 'India DPDPA', 'AIUC-1', 'CSRD']) {
        expect(answer.textContent).toContain(name);
      }
    });
  });

  it('caps the frameworks slider at the number of framework guides', () => {
    renderPage();
    expect(screen.getByLabelText('Frameworks pursued')).toHaveAttribute('max', '16');
  });

  it('emits no page-level duplicates of the site-wide Organization or SoftwareApplication data', () => {
    renderPage();
    const types = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (node) => JSON.parse(node.textContent ?? '{}')['@type']
    );
    expect(types).not.toContain('Organization');
    expect(types).not.toContain('SoftwareApplication');
  });

  // ---- Closing CTA ----

  describe('closing CTA', () => {
    it('renders the closing headline and CTAs', () => {
      renderPage();
      expect(screen.getByRole('heading', { name: /See compliance/i })).toBeInTheDocument();
      expect(screen.getByText('Request a trial').closest('a')).toHaveAttribute('href', '/demo');
    });
  });

  // ---- Legacy UI intentionally removed ----

  it('opens with TL;DR bullets that use the verified counts and the security posture', () => {
    renderPage();
    const tldr = screen.getByRole('region', { name: 'TL;DR' });
    expect(tldr).toHaveTextContent('26 verified integrations');
    expect(tldr).toHaveTextContent('16 in-depth framework guides and 150+ frameworks in the catalogue');
    expect(tldr).toHaveTextContent('SOC 2 Type I audit in progress');
    expect(tldr).toHaveTextContent('trials are available on request');
  });

  it('describes what sets it apart without comparing itself to other tools', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'What makes ComplyEasyAI different?' })).toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/mid-market tools|Coverage others|at a fraction of/i);
    expect(screen.getByText(/26 integrations/)).toBeInTheDocument();
  });

  it('no longer renders the auth modal, embedded pricing, or embedded demo form', () => {
    // The redesign made this a pure marketing page wrapped in MarketingLayout:
    // the login/signup modal, embedded PricingSection, and embedded
    // DemoBookingForm were all removed in favor of /demo and /pricing routes.
    renderPage();
    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('name@company.com')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pricing-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('demo-form')).not.toBeInTheDocument();
    expect(screen.queryByText('Start Your Free Trial')).not.toBeInTheDocument();
  });
});
