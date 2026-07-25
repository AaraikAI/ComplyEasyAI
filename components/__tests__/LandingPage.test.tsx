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

    it('renders the split headline', () => {
      renderPage();
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Compliance that');
      expect(h1).toHaveTextContent('runs itself.');
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

    it('scrolls to the comparison matrix when "See it in motion" is clicked', () => {
      renderPage();
      fireEvent.click(screen.getByText('See it in motion'));
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  // ---- "Three jobs" cards ----

  it('renders the "three jobs" section', () => {
    renderPage();
    expect(screen.getByText('Three jobs it takes off your plate')).toBeInTheDocument();
    expect(screen.getByText('Audit-ready, continuously')).toBeInTheDocument();
    expect(screen.getByText('It runs itself')).toBeInTheDocument();
  });

  // ---- ROI calculator ----

  describe('ROI calculator', () => {
    it('renders the three sliders and the reclaimed-hours output', () => {
      renderPage();
      expect(screen.getByText('What could you reclaim?')).toBeInTheDocument();
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

  // ---- Comparison matrix ----

  describe('comparison matrix', () => {
    it('renders the matrix with the ComplyEasyAI column and competitors', () => {
      renderPage();
      expect(
        screen.getByRole('table', { name: /Capability comparison/i }),
      ).toBeInTheDocument();
      expect(screen.getByText('Vanta')).toBeInTheDocument();
      expect(screen.getByText('OneTrust')).toBeInTheDocument();
    });

    it('renders the category chips with "All" active by default', () => {
      renderPage();
      for (const cat of ['All', 'EU & Regulatory', 'Autonomy', 'Economics']) {
        expect(screen.getByRole('button', { name: cat })).toBeInTheDocument();
      }
      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('filters the matrix rows by category chip', () => {
      renderPage();
      // "All" shows rows from every category.
      expect(screen.getByText('DMA + DSA')).toBeInTheDocument(); // EU & Regulatory
      expect(screen.getByText('Predictive gap detection')).toBeInTheDocument(); // Autonomy
      expect(screen.getByText('Transparent pricing')).toBeInTheDocument(); // Economics

      // Filter to Economics.
      fireEvent.click(screen.getByRole('button', { name: 'Economics' }));
      expect(screen.getByRole('button', { name: 'Economics' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Transparent pricing')).toBeInTheDocument();
      expect(screen.getByText('Cross-framework evidence reuse')).toBeInTheDocument();
      expect(screen.queryByText('Predictive gap detection')).not.toBeInTheDocument();
      expect(screen.queryByText('DMA + DSA')).not.toBeInTheDocument();

      // Filter to EU & Regulatory.
      fireEvent.click(screen.getByRole('button', { name: 'EU & Regulatory' }));
      expect(screen.getByText('DMA + DSA')).toBeInTheDocument();
      expect(screen.queryByText('Transparent pricing')).not.toBeInTheDocument();

      // Back to All.
      fireEvent.click(screen.getByRole('button', { name: 'All' }));
      expect(screen.getByText('Predictive gap detection')).toBeInTheDocument();
      expect(screen.getByText('Transparent pricing')).toBeInTheDocument();
    });
  });

  // ---- Pricing teaser (no numbers) ----

  describe('pricing teaser', () => {
    it('renders the outcomes-based headline with no dollar figures', () => {
      renderPage();
      expect(screen.getByText('Priced for outcomes, not seats.')).toBeInTheDocument();
    });

    it('links "Talk to us about pricing" at /pricing', () => {
      renderPage();
      const link = screen.getByText(/Talk to us about pricing/);
      expect(link.closest('a')).toHaveAttribute('href', '/pricing');
    });
  });

  // ---- Closing CTA ----

  describe('closing CTA', () => {
    it('renders the closing headline and CTAs', () => {
      renderPage();
      expect(screen.getByRole('heading', { name: /See compliance/i })).toBeInTheDocument();
      expect(screen.getByText('Talk to sales').closest('a')).toHaveAttribute('href', '/demo');
    });
  });

  // ---- Legacy UI intentionally removed ----

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
