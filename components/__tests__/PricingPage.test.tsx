import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { PricingPage } from '../marketing/pages/PricingPage';

// react-router, lucide-react and the marketing contexts are mocked globally
// in setupTests.ts (Link -> <a href>). MemoryRouter is a passthrough there,
// matching LandingPage.test.tsx.
const renderPage = () => render(<MemoryRouter><PricingPage /></MemoryRouter>);

const COMPETITOR_NAMES = /vanta|drata|secureframe|sprinto|onetrust/i;

/** Parses every JSON-LD block the page emitted. */
const readJsonLd = (): Array<Record<string, unknown>> =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((node) =>
    JSON.parse(node.textContent ?? '{}')
  );

describe('PricingPage', () => {
  it('names the brand and the plan structure in the H1 and answers it in the lede', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ComplyEasyAI pricing:');
    expect(
      screen.getByText(/ComplyEasyAI has four annual plans: Foundation \(3 frameworks, 10 users\)/)
    ).toBeInTheDocument();
  });

  it('states the price positioning without naming another vendor', () => {
    renderPage();
    expect(
      screen.getByText(/Pricing is positioned ≈10–15% lower as compared to the other providers\./)
    ).toBeInTheDocument();
  });

  it('names no competitor in the rendered page or its structured data', () => {
    renderPage();
    expect(document.documentElement.innerHTML).not.toMatch(COMPETITOR_NAMES);
    expect(document.documentElement.innerHTML).not.toMatch(/comparable/i);
  });

  it('ends the exact-price FAQ answer at the tailored quote, on the page and in the FAQ JSON-LD', () => {
    renderPage();
    const answer =
      'Your number depends on which frameworks you pursue and your team size. A 30-minute call gets you an exact, tailored quote.';
    expect(screen.getByText(answer)).toBeInTheDocument();

    const faqPage = readJsonLd().find((block) => block['@type'] === 'FAQPage') as
      | { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> }
      | undefined;
    expect(faqPage).toBeDefined();
    const entry = faqPage?.mainEntity.find((q) => q.name === "Why don't you list exact prices?");
    expect(entry?.acceptedAnswer.text).toBe(answer);
  });

  it('renders the Foundation card without an empty note row, and keeps the other tier notes', () => {
    renderPage();
    const noteRows = (tierName: string) => {
      const card = screen.getByRole('heading', { level: 3, name: tierName }).parentElement;
      expect(card).not.toBeNull();
      return Array.from(card!.querySelectorAll('div')).filter((el) =>
        el.className.includes('min-h-[32px]')
      );
    };

    expect(noteRows('Foundation')).toHaveLength(0);
    expect(screen.getByText('Trust Center & VRM included — often paid extras elsewhere')).toBeInTheDocument();
    for (const tierName of ['Essentials', 'Growth', 'Visionary']) {
      const rows = noteRows(tierName);
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent?.trim()).not.toBe('');
    }
  });
});
