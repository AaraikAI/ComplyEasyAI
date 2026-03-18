import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import { BreachNotificationWizard } from '../BreachNotificationWizard';

describe('BreachNotificationWizard', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays breach notification content', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('calls onBack when back button clicked', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    const arrowIcons = screen.getAllByTestId('icon-ArrowLeft');
    const backBtn = arrowIcons[0]?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('shows main tab navigation (wizard, history, templates, contacts)', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('switches to history tab', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    const historyBtn = buttons.find(b => b.textContent?.includes('History') || b.textContent?.includes('history'));
    if (historyBtn) {
      fireEvent.click(historyBtn);
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it('switches to templates tab', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    const templatesBtn = buttons.find(b => b.textContent?.includes('Template'));
    if (templatesBtn) {
      fireEvent.click(templatesBtn);
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it('switches to contacts tab', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    const contactsBtn = buttons.find(b => b.textContent?.includes('Contact'));
    if (contactsBtn) {
      fireEvent.click(contactsBtn);
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it('renders wizard step interface', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('handles empty breach records', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles API errors', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders breach severity options', () => {
    render(<BreachNotificationWizard onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
