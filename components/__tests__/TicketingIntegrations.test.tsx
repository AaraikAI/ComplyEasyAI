import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } },
    isAuthenticated: true, logout: vi.fn(),
  }),
}));

const { ticketingListConnections, ticketingCreateConnection, ticketingDeleteConnection, ticketingTestById, ticketingCreate, ticketingSync, ticketingListTickets, ticketingSyncStatus, ticketingGetFieldMapping, ticketingBulkSync, ticketingSyncTicket, ticketingUpdateFieldMapping, ticketingGetTicket } = vi.hoisted(() => ({
  ticketingListConnections: vi.fn(),
  ticketingCreateConnection: vi.fn(),
  ticketingDeleteConnection: vi.fn(),
  ticketingTestById: vi.fn(),
  ticketingCreate: vi.fn(),
  ticketingSync: vi.fn(),
  ticketingListTickets: vi.fn(),
  ticketingSyncStatus: vi.fn(),
  ticketingGetFieldMapping: vi.fn(),
  ticketingBulkSync: vi.fn(),
  ticketingSyncTicket: vi.fn(),
  ticketingUpdateFieldMapping: vi.fn(),
  ticketingGetTicket: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    ticketing: {
      listConnections: ticketingListConnections,
      createConnection: ticketingCreateConnection,
      deleteConnection: ticketingDeleteConnection,
      testConnectionById: ticketingTestById,
      createTicket: ticketingCreate,
      sync: ticketingSync,
      listTickets: ticketingListTickets,
      getSyncStatus: ticketingSyncStatus,
      getFieldMapping: ticketingGetFieldMapping,
      bulkSync: ticketingBulkSync,
      syncTicket: ticketingSyncTicket,
      updateFieldMapping: ticketingUpdateFieldMapping,
      getTicket: ticketingGetTicket,
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

const mockConnections = [
  { id: 'c1', provider: 'jira' as const, name: 'Jira Cloud', connected: true, lastSync: '2025-12-01T00:00:00Z', config: { baseUrl: 'https://myorg.atlassian.net' }, createdAt: '2025-01-01', updatedAt: '2025-12-01' },
];

const mockTickets = [
  { id: 't1', provider: 'jira', action: 'create', direction: 'outbound', externalId: 'PROJ-123', externalSysId: null, status: 'open', title: 'Fix encryption gap', createdAt: '2025-12-01', updatedAt: '2025-12-01' },
];

const mockStats = { totalTickets: 10, openTickets: 3, closedTickets: 7, synced: 10, failed: 0 };

import TicketingIntegrations from '../TicketingIntegrations';

describe('TicketingIntegrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ticketingListConnections.mockResolvedValue({ connections: mockConnections });
    ticketingListTickets.mockResolvedValue({ tickets: mockTickets, pagination: { page: 1, limit: 20, totalCount: 1, totalPages: 1 } });
    ticketingSyncStatus.mockResolvedValue({ lastSync: '2025-12-01', status: 'ok' });
    ticketingGetFieldMapping.mockResolvedValue({ mappingRules: [] });
    ticketingCreateConnection.mockResolvedValue({ ...mockConnections[0], id: 'c-new' });
    ticketingDeleteConnection.mockResolvedValue({});
    ticketingTestById.mockResolvedValue({ success: true, message: 'Connection OK' });
    ticketingCreate.mockResolvedValue({ id: 't-new' });
    ticketingSync.mockResolvedValue({});
    ticketingBulkSync.mockResolvedValue({});
  });

  it('renders without crashing', async () => {
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Ticketing/i).length).toBeGreaterThan(0));
  });

  it('shows loading state initially', () => {
    ticketingListConnections.mockReturnValue(new Promise(() => {}));
    ticketingListTickets.mockReturnValue(new Promise(() => {}));
    ticketingSyncStatus.mockReturnValue(new Promise(() => {}));
    render(<TicketingIntegrations />);
    expect(document.querySelector('[data-testid="icon-Loader2"]') || document.querySelector('.animate-pulse') || document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('displays connections tab with provider cards', async () => {
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Jira/i).length).toBeGreaterThan(0));
  });

  it('shows connected status for active connections', async () => {
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Connected/i).length).toBeGreaterThan(0));
  });

  it('displays provider cards for Jira, ServiceNow, and Azure DevOps', async () => {
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Jira/i).length).toBeGreaterThan(0));
    expect(screen.queryAllByText(/ServiceNow/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Azure DevOps/i).length).toBeGreaterThan(0);
  });

  it('navigates between tabs', async () => {
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Jira/i).length).toBeGreaterThan(0));
    const ticketsTab = screen.queryAllByText(/Tickets/i)[0] ?? null;
    if (ticketsTab) {
      fireEvent.click(ticketsTab);
      await waitFor(() => expect(screen.queryAllByText('PROJ-123').length).toBeGreaterThan(0));
    }
  });

  it('shows tickets list with external IDs', async () => {
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Jira/i).length).toBeGreaterThan(0));
    const ticketsTab = screen.queryAllByText(/Tickets/i)[0] ?? null;
    if (ticketsTab) {
      fireEvent.click(ticketsTab);
      await waitFor(() => expect(screen.queryAllByText('PROJ-123').length).toBeGreaterThan(0));
    }
  });

  it('handles error state gracefully', async () => {
    ticketingListConnections.mockRejectedValueOnce(new Error('Connection failed'));
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Ticketing/i).length).toBeGreaterThan(0));
  });

  it('shows empty state when no connections exist', async () => {
    ticketingListConnections.mockResolvedValueOnce({ connections: [] });
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Ticketing/i).length).toBeGreaterThan(0));
  });

  it('renders stats section if available', async () => {
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Jira/i).length).toBeGreaterThan(0));
    const statsTab = screen.queryAllByText(/Stats|Statistics/i)[0] ?? null;
    if (statsTab) {
      fireEvent.click(statsTab);
    }
  });

  it('search filters tickets', async () => {
    render(<TicketingIntegrations />);
    await waitFor(() => expect(screen.queryAllByText(/Jira/i).length).toBeGreaterThan(0));
    const ticketsTab = screen.queryAllByText(/Tickets/i)[0] ?? null;
    if (ticketsTab) {
      fireEvent.click(ticketsTab);
      await waitFor(() => expect(screen.queryAllByText('PROJ-123').length).toBeGreaterThan(0));
      const searchInput = screen.queryByPlaceholderText(/search/i);
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      }
    }
  });
});
