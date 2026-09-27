import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { PlatformPage } from '../marketing/pages/PlatformPage';
import { FrameworksIndexPage } from '../marketing/pages/FrameworksIndexPage';
import { DemoPage } from '../marketing/pages/DemoPage';
import { FaqHubPage } from '../marketing/pages/FaqHubPage';

// react-router, lucide-react and the marketing contexts are mocked globally in
// setupTests.ts (Link -> <a href>). MemoryRouter is a passthrough there.
const renderPage = (page: React.ReactElement) => render(<MemoryRouter>{page}</MemoryRouter>);

const COMPETITOR_NAMES = /vanta|drata|secureframe|sprinto|onetrust/i;

/** Parses every JSON-LD block the page emitted. */
const readJsonLd = (): Array<Record<string, any>> =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((node) =>
    JSON.parse(node.textContent ?? '{}')
  );

/** Asserts every FAQPage pair is also rendered visibly on the page. */
const expectFaqRendered = () => {
  const faqPage = readJsonLd().find((block) => block['@type'] === 'FAQPage');
  expect(faqPage).toBeDefined();
  for (const entry of faqPage!.mainEntity) {
    expect(screen.getByText(entry.name)).toBeInTheDocument();
    expect(screen.getByText(entry.acceptedAnswer.text)).toBeInTheDocument();
  }
  return faqPage!;
};

describe('PlatformPage', () => {
  it('names the category in the H1 and answers what aCOS is under it', () => {
    renderPage(<PlatformPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'The compliance automation platform'
    );
    expect(screen.getByText(/runs a five-stage loop/)).toBeInTheDocument();
  });

  it('keeps all five loop stages in the markup so crawlers see the whole loop', () => {
    renderPage(<PlatformPage />);
    for (const stage of ['Observe', 'Predict', 'Act', 'Verify', 'Learn']) {
      expect(screen.getByRole('heading', { level: 3, name: stage, hidden: true })).toBeInTheDocument();
    }
    expect(screen.getByText(/Feeds every outcome back into the loop/)).toBeInTheDocument();
  });

  it('emits its FAQ, with aCOS on the Growth and Visionary plans, and no duplicate app schema', () => {
    renderPage(<PlatformPage />);
    const faqPage = expectFaqRendered();
    const plans = faqPage.mainEntity.find((q: any) => q.name === 'Which plans include aCOS?');
    expect(plans.acceptedAnswer.text).toContain('Growth and Visionary');
    expect(readJsonLd().map((block) => block['@type'])).not.toContain('SoftwareApplication');
  });
});

describe('FrameworksIndexPage', () => {
  it('states the framework count in the H1 and lists every guide in the lede', () => {
    renderPage(<FrameworksIndexPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('16 compliance frameworks');
    const lede = screen.getByText(/compliance frameworks with dedicated guides:/);
    for (const name of ['SOC 2', 'NIST CSF', 'India DPDPA', 'AIUC-1', 'CSRD']) {
      expect(lede.textContent).toContain(name);
    }
  });

  it('uses the ISO 27001:2022 control numbering in the mapping example', () => {
    renderPage(<FrameworksIndexPage />);
    expect(screen.getByText('ISO 27001 · A.5.15')).toBeInTheDocument();
    expect(screen.queryByText('ISO 27001 · A.9')).not.toBeInTheDocument();
  });

  it('shows a guide count per category and emits its FAQ', () => {
    renderPage(<FrameworksIndexPage />);
    for (const category of ['Security', 'Privacy', 'AI Governance', 'EU Digital']) {
      expect(screen.getByText(`${category} · 4`)).toBeInTheDocument();
    }
    expectFaqRendered();
  });
});

describe('DemoPage', () => {
  it('names the action in the H1 and emits its FAQ', () => {
    renderPage(<DemoPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ComplyEasyAI demo.');
    expectFaqRendered();
  });
});

describe('FaqHubPage', () => {
  it('phrases every topic heading as a question and keeps short jump links', () => {
    renderPage(<FaqHubPage />);
    const topicHeadings = screen.getAllByRole('heading', { level: 2 }).slice(0, 11);
    for (const heading of topicHeadings) expect(heading.textContent).toMatch(/\?$/);
    expect(screen.getByRole('link', { name: 'Getting started' })).toHaveAttribute(
      'href',
      '#getting-started'
    );
  });

  it('names no competitor on the page or in its structured data', () => {
    renderPage(<FaqHubPage />);
    expect(document.documentElement.innerHTML).not.toMatch(COMPETITOR_NAMES);
  });

  it('matches the plan gating: aCOS on Growth and Visionary, the EU stack on Visionary', () => {
    renderPage(<FaqHubPage />);
    expect(screen.getByText(/The full aCOS loop is included in Growth and Visionary/)).toBeInTheDocument();
    expect(screen.queryByText(/Essentials tier and above, or as a separately billed add-on/)).toBeNull();
    expect(screen.queryByText(/Growth-tier add-on/)).toBeNull();
    expect(screen.getByText(/2 December 2027 \(Annex III systems\)/)).toBeInTheDocument();
  });
});
