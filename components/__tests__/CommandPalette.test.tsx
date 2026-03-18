import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

import { CommandPalette } from '../CommandPalette';

describe('CommandPalette', () => {
  const mockOnClose = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CommandPalette isOpen={false} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders when open', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    expect(screen.getByPlaceholderText(/commandPalette.placeholder/i)).toBeInTheDocument();
  });

  it('shows navigation commands', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Risk Management')).toBeInTheDocument();
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
  });

  it('shows AI Tools commands', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    expect(screen.getByText('AI Policy Generator')).toBeInTheDocument();
    expect(screen.getByText('AI Contract Analyzer')).toBeInTheDocument();
  });

  it('shows Enterprise commands', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    expect(screen.getByText('aCOS Dashboard')).toBeInTheDocument();
  });

  it('filters commands by search query', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    const input = screen.getByPlaceholderText(/commandPalette.placeholder/i);
    fireEvent.change(input, { target: { value: 'risk' } });
    expect(screen.getByText('Risk Management')).toBeInTheDocument();
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();
  });

  it('shows no results for non-matching query', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    const input = screen.getByPlaceholderText(/commandPalette.placeholder/i);
    fireEvent.change(input, { target: { value: 'zzzznonexistent' } });
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('navigates on Enter key', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles ArrowDown key navigation', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockOnNavigate).toHaveBeenCalledWith('risks');
  });

  it('handles ArrowUp key navigation', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');
  });

  it('closes on backdrop click', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    const backdrop = document.querySelector('.absolute.inset-0');
    if (backdrop) fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('navigates when command item is clicked', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    fireEvent.click(screen.getByText('Reports'));
    expect(mockOnNavigate).toHaveBeenCalledWith('reports');
  });

  it('shows category headers', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('AI Tools')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('searches by keywords', () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} onNavigate={mockOnNavigate} />);
    const input = screen.getByPlaceholderText(/commandPalette.placeholder/i);
    fireEvent.change(input, { target: { value: 'soc2' } });
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
  });
});
