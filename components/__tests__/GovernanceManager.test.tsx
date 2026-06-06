import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

const {
  apiGet, apiPost, apiPut, apiDelete,
  listBodies, getDPO, createBody, updateBody, deleteBody,
  createEscalationPath, updateEscalationPath, deleteEscalationPath, upsertDPO,
} = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  listBodies: vi.fn(),
  getDPO: vi.fn(),
  createBody: vi.fn(),
  updateBody: vi.fn(),
  deleteBody: vi.fn(),
  createEscalationPath: vi.fn(),
  updateEscalationPath: vi.fn(),
  deleteEscalationPath: vi.fn(),
  upsertDPO: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
    dpo: { list: apiGet, create: apiPost, update: apiPut, delete: apiDelete },
    modules: {
      governance: {
        listBodies, getDPO, createBody, updateBody, deleteBody,
        createEscalationPath, updateEscalationPath, deleteEscalationPath, upsertDPO,
      },
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import GovernanceManager from '../GovernanceManager';

describe('GovernanceManager', () => {
  const onBack = vi.fn();

  // Governance bodies as returned by the API. The component no longer embeds
  // demo governance data; committees, decisions and escalation paths are all
  // hydrated from api.modules.governance.listBodies(). These fixtures mirror
  // the shape the component maps (b.name -> committee type, b.decisions[].title,
  // b.escalationPaths[].name).
  const governanceBodies = [
    {
      id: 'body-privacy',
      name: 'Privacy Committee',
      status: 'active',
      charter: 'Oversee privacy program',
      meetingFrequency: 'Monthly',
      members: [
        { id: 'm1', name: 'Alice Stone', role: 'Chair', department: 'Legal', email: 'alice@example.com', joinDate: '2025-01-01', status: 'Active' },
      ],
      meetings: [],
      decisions: [
        { id: 'd1', createdAt: '2025-05-01', title: 'AI Chatbot DPIA Approval', description: 'Approved DPIA', status: 'approved', rationale: 'Low residual risk' },
      ],
      escalationPaths: [
        { id: 'esc-breach', name: 'Data Breach Escalation', status: 'active', levels: [], triggerCriteria: [], updatedAt: '2025-05-10' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'new1' } });
    apiPut.mockResolvedValue({ data: {} });
    apiDelete.mockResolvedValue({ data: {} });
    // Governance module API: by default the org has the seeded bodies above.
    listBodies.mockResolvedValue(governanceBodies);
    getDPO.mockResolvedValue(null);
    createBody.mockResolvedValue({ id: 'body-new' });
    updateBody.mockResolvedValue({});
    deleteBody.mockResolvedValue({});
    createEscalationPath.mockResolvedValue({ id: 'esc-new' });
    updateEscalationPath.mockResolvedValue({});
    deleteEscalationPath.mockResolvedValue({});
    upsertDPO.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<GovernanceManager onBack={onBack} />);
    // The page title is always rendered.
    expect(screen.getByRole('heading', { name: /Governance Manager/i })).toBeInTheDocument();
  });

  it('shows tab navigation', () => {
    render(<GovernanceManager onBack={onBack} />);
    // The three top-level tabs render unconditionally.
    expect(screen.getByRole('button', { name: /DPO Management/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Committees/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Escalation Paths/i })).toBeInTheDocument();
  });

  it('displays the DPO profile by default', () => {
    render(<GovernanceManager onBack={onBack} />);
    // DPO tab is active on mount and shows the DPO designation + sub-tabs.
    expect(screen.getByText('Data Protection Officer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Profile$/i })).toBeInTheDocument();
  });

  it('shows committees section when the Committees tab is opened', () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Committees/i }));
    // The committees overview renders the consolidated members table.
    expect(screen.getByText('All Governance Members')).toBeInTheDocument();
  });

  it('shows a committee detail with members and meetings sub-tabs', async () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Committees/i }));
    // The committee comes from the API (api.modules.governance.listBodies),
    // not from embedded demo data, so wait for the async hydration first.
    const committeeCard = await screen.findByText('Privacy Committee');
    // Selecting a committee card opens its detail with sub-tabs.
    fireEvent.click(committeeCard);
    expect(screen.getByRole('button', { name: /^Members$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Meetings$/i }));
    expect(screen.getByText(/Next Meeting:/i)).toBeInTheDocument();
  });

  it('opens the create DPO task form', () => {
    render(<GovernanceManager onBack={onBack} />);
    // Navigate to the DPO Tasks sub-tab and open the add-task modal.
    fireEvent.click(screen.getByRole('button', { name: /^Tasks$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Add Task/i }));
    expect(screen.getByRole('heading', { name: /New DPO Task/i })).toBeInTheDocument();
  });

  it('shows decision records for a committee', async () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Committees/i }));
    fireEvent.click(await screen.findByText('Privacy Committee'));
    fireEvent.click(screen.getByRole('button', { name: /^Decisions$/i }));
    // The decision is mapped from the API body's decisions[].title.
    expect(screen.getByText('AI Chatbot DPIA Approval')).toBeInTheDocument();
  });

  it('shows the DPO activity log', () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /^Activity$/i }));
    expect(screen.getByRole('heading', { name: /DPO Activity Log/i })).toBeInTheDocument();
  });

  it('renders the escalation paths tab', async () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Escalation Paths/i }));
    // The escalation list is hydrated from the API (body.escalationPaths),
    // not from embedded demo data.
    expect(await screen.findByText('Data Breach Escalation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Path/i })).toBeInTheDocument();
  });

  it('does not show any embedded demo governance data when the API returns nothing', async () => {
    // Finding 43: committees/decisions/escalation paths must come from the API,
    // never from hardcoded demo data baked into the component. With an empty
    // API response the previously-seeded names must be absent.
    listBodies.mockResolvedValue([]);
    getDPO.mockResolvedValue(null);
    render(<GovernanceManager onBack={onBack} />);

    await waitFor(() => expect(listBodies).toHaveBeenCalled());

    // Committees tab: the consolidated table renders but no seeded committee.
    fireEvent.click(screen.getByRole('button', { name: /Committees/i }));
    expect(screen.getByText('All Governance Members')).toBeInTheDocument();
    expect(screen.queryByText('Privacy Committee')).not.toBeInTheDocument();

    // Escalation tab: no seeded path, only the empty/create affordance.
    fireEvent.click(screen.getByRole('button', { name: /Escalation Paths/i }));
    expect(screen.queryByText('Data Breach Escalation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Path/i })).toBeInTheDocument();
  });
});
