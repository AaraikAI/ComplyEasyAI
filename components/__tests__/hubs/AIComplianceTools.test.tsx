import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.unmock('react-router-dom');

vi.mock('../../AIFeatures/DataMapper', () => ({
  DataMapper: (props: any) => <div data-testid="data-mapper">DataMapper</div>,
}));
vi.mock('../../AIFeatures/CrossFrameworkMapper', () => ({
  CrossFrameworkMapper: (props: any) => <div data-testid="cross-framework-mapper">CrossFrameworkMapper</div>,
}));
vi.mock('../../AIFeatures/RegulatoryAutoRemediation', () => ({
  RegulatoryAutoRemediation: (props: any) => <div data-testid="auto-remediation">RegulatoryAutoRemediation</div>,
}));
vi.mock('../../AIFeatures/NaturalLanguageQuery', () => ({
  NaturalLanguageQuery: (props: any) => <div data-testid="nl-query">NaturalLanguageQuery</div>,
}));
vi.mock('../../AIFeatures/PhishingGenerator', () => ({
  PhishingGenerator: (props: any) => <div data-testid="phishing-generator">PhishingGenerator</div>,
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    Database: (props: any) => <svg data-testid="icon-database" {...props} />,
    GitGraph: (props: any) => <svg data-testid="icon-git-graph" {...props} />,
    Bot: (props: any) => <svg data-testid="icon-bot" {...props} />,
    MessageSquare: (props: any) => <svg data-testid="icon-message-square" {...props} />,
    Mail: (props: any) => <svg data-testid="icon-mail" {...props} />,
  };
});

import AIComplianceTools from '../../hubs/AIComplianceTools';

const renderWithRouter = (initialEntry = '/ai-compliance') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AIComplianceTools />
    </MemoryRouter>
  );
};

describe('AIComplianceTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Data Mapper')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Data Mapper')).toBeInTheDocument();
    expect(screen.getByText('Cross-Framework Mapper')).toBeInTheDocument();
    expect(screen.getByText('Auto-Remediation')).toBeInTheDocument();
    expect(screen.getByText('Compliance Query')).toBeInTheDocument();
    expect(screen.getByText('Phishing Simulator')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['Data Mapper', 'Cross-Framework Mapper', 'Auto-Remediation', 'Compliance Query', 'Phishing Simulator'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('data-mapper')).toBeInTheDocument();
    });
  });

  it('switches to Cross-Framework Mapper tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Cross-Framework Mapper'));
    await waitFor(() => {
      expect(screen.getByTestId('cross-framework-mapper')).toBeInTheDocument();
    });
  });

  it('switches to Auto-Remediation tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Auto-Remediation'));
    await waitFor(() => {
      expect(screen.getByTestId('auto-remediation')).toBeInTheDocument();
    });
  });

  it('switches to Compliance Query tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Compliance Query'));
    await waitFor(() => {
      expect(screen.getByTestId('nl-query')).toBeInTheDocument();
    });
  });

  it('switches to Phishing Simulator tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Phishing Simulator'));
    await waitFor(() => {
      expect(screen.getByTestId('phishing-generator')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Phishing Simulator'));
    await waitFor(() => {
      expect(screen.getByTestId('phishing-generator')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Data Mapper'));
    await waitFor(() => {
      expect(screen.getByTestId('data-mapper')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('data-mapper')).toBeInTheDocument();
    });
  });

  it('renders tab navigation container with correct aria label', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    expect(nav).toBeInTheDocument();
  });

  it('renders exactly 5 tab buttons', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    const buttons = nav.querySelectorAll('button');
    expect(buttons).toHaveLength(5);
  });
});
