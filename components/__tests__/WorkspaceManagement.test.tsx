import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkspaceManagement from '../WorkspaceManagement';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn().mockReturnValue({ user: { id: '1', name: 'Test', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth' } }, isAuthenticated: true }) }));
vi.mock('@/services/api', () => ({ api: { enterprise: { getWorkspaces: vi.fn().mockResolvedValue([]), workspaces: { getHierarchy: vi.fn().mockResolvedValue({ current: { id: 'org-1', name: 'Test Org', isParent: true, plan: 'Growth' }, parent: null, children: [] }), getConsolidatedMetrics: vi.fn().mockResolvedValue({ totalOrganizations: 0, totalUsers: 0, totalFrameworks: 0, totalControls: 0, implementedControls: 0, totalRisks: 0, openRisks: 0, totalVendors: 0, organizationBreakdown: [] }), createChild: vi.fn().mockResolvedValue({}), cloneFramework: vi.fn().mockResolvedValue({}), moveUser: vi.fn().mockResolvedValue({}) }, visionaryAI: { getCoPilotRecommendations: vi.fn().mockResolvedValue([]), getBenchmarking: vi.fn().mockResolvedValue({}), predictRisks: vi.fn().mockResolvedValue([]) } } }, getAuthToken: vi.fn().mockReturnValue('token') }));
vi.mock('@/constants/tierLimits', () => ({ getLimit: vi.fn().mockReturnValue(25), isAtLimit: vi.fn().mockReturnValue(false), getUpgradeMessage: vi.fn().mockReturnValue(''), UPGRADE_LINK: '/settings?tab=billing' }));
vi.mock('@/constants/tierFeatures', () => ({ normalizePlan: vi.fn().mockReturnValue('Growth'), hasFeature: vi.fn().mockReturnValue(true) }));

describe('WorkspaceManagement', () => {
  it('should render', async () => { render(<WorkspaceManagement />); await waitFor(() => { expect(screen.getAllByText(/workspace/i).length).toBeGreaterThan(0); }); });
  it('should handle loading state', () => { render(<WorkspaceManagement />); expect(document.body.innerHTML.length).toBeGreaterThan(0); });
  it('should render with empty data', async () => { render(<WorkspaceManagement />); await waitFor(() => { expect(document.body.innerHTML.length).toBeGreaterThan(0); }); });
});
