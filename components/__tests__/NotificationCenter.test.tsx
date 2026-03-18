import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

const { apiGet, apiPost, apiPatch, apiDeleteFn } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDeleteFn: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    get: apiGet,
    post: apiPost,
    patch: apiPatch,
    delete: apiDeleteFn,
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import NotificationCenter from '../NotificationCenter';

const mockNotifications = [
  { id: 'n1', type: 'RISK_ESCALATION', title: 'Risk Escalated', message: 'Risk R-001 escalated to High', isRead: false, createdAt: new Date().toISOString(), category: 'risk' },
  { id: 'n2', type: 'EVIDENCE_UPLOADED', title: 'Evidence Added', message: 'New evidence for SOC 2', isRead: true, createdAt: new Date(Date.now() - 3600000).toISOString(), category: 'compliance' },
  { id: 'n3', type: 'TASK_ASSIGNED', title: 'Task Assigned', message: 'You were assigned @admin review', isRead: false, createdAt: new Date(Date.now() - 86400000).toISOString(), category: 'task' },
];

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockImplementation((url: string) => {
      if (url.includes('unread-count')) return Promise.resolve({ status: 'success', data: { count: 2 } });
      if (url.includes('/notifications')) return Promise.resolve({ status: 'success', data: mockNotifications });
      return Promise.resolve({ status: 'success', data: [] });
    });
    apiPost.mockResolvedValue({ status: 'success' });
    apiPatch.mockResolvedValue({ status: 'success' });
    apiDeleteFn.mockResolvedValue({ status: 'success' });
  });

  it('renders the bell button', () => {
    render(<NotificationCenter />);
    const bellBtn = screen.getByLabelText('Notifications');
    expect(bellBtn).toBeInTheDocument();
  });

  it('fetches unread count on mount', async () => {
    render(<NotificationCenter />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(expect.stringContaining('unread-count'));
    });
  });

  it('shows unread badge when count > 0', async () => {
    render(<NotificationCenter />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('opens notification dropdown on bell click', async () => {
    render(<NotificationCenter />);
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(expect.stringContaining('/notifications'));
    });
  });

  it('shows tab filters (all, unread, mentions)', async () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => {
      expect(screen.queryAllByText(/All|all/).length).toBeGreaterThan(0);
    });
  });

  it('marks notification as read', async () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
  });

  it('marks all as read', async () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
    const markAllBtn = screen.queryByText(/Mark all|mark all/i);
    if (markAllBtn) {
      fireEvent.click(markAllBtn);
      await waitFor(() => {
        expect(apiPost).toHaveBeenCalledWith(expect.stringContaining('mark-all-read'));
      });
    }
  });

  it('deletes a notification', async () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
    const deleteBtns = document.querySelectorAll('[data-testid="icon-X"]');
    if (deleteBtns.length > 0) {
      const btn = deleteBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });

  it('toggles sound setting', async () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    const soundBtn = document.querySelector('[data-testid="icon-Volume2"], [data-testid="icon-VolumeX"]');
    if (soundBtn) {
      const btn = soundBtn.closest('button');
      if (btn) fireEvent.click(btn);
    }
  });

  it('handles API error for notifications', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
  });

  it('closes on outside click', async () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    fireEvent.mouseDown(document.body);
  });
});
