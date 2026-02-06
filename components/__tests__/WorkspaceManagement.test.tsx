import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WorkspaceManagement } from '../WorkspaceManagement';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn().mockReturnValue({ user: { id: '1', name: 'Test', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth' } }, isAuthenticated: true }) }));
vi.mock('@/services/api', () => ({ api: { enterprise: { getWorkspaces: vi.fn().mockResolvedValue([]) } }, getAuthToken: vi.fn().mockReturnValue('token') }));
vi.mock('@/constants/tierLimits', () => ({ getLimit: vi.fn().mockReturnValue(25), isAtLimit: vi.fn().mockReturnValue(false), getUpgradeMessage: vi.fn().mockReturnValue(''), UPGRADE_LINK: '/settings?tab=billing' }));
vi.mock('@/constants/tierFeatures', () => ({ normalizePlan: vi.fn().mockReturnValue('Growth'), hasFeature: vi.fn().mockReturnValue(true) }));

describe('WorkspaceManagement', () => {
  it('should render', async () => { render(<WorkspaceManagement />); await waitFor(() => { expect(screen.getByText(/workspace/i)).toBeTruthy(); }); });
  it('should handle loading state', () => { render(<WorkspaceManagement />); expect(document.body.textContent).toBeTruthy(); });
  it('should render with empty data', async () => { render(<WorkspaceManagement />); await waitFor(() => { expect(document.body.textContent!.length).toBeGreaterThan(0); }); });
});
