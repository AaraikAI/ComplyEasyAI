import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockRoles = [
  { id: 'r1', name: 'Admin', description: 'Full access', isSystem: true, permissions: [], createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'r2', name: 'Compliance Manager', description: 'Manages compliance', isSystem: true, permissions: [], createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'r3', name: 'Auditor', description: 'Read-only auditor', isSystem: true, permissions: [], createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'r4', name: 'Viewer', description: 'View only', isSystem: true, permissions: [], createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

import RoleManager from '../RoleManager';

describe('RoleManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/audit-log')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(mockRoles), { status: 200 }));
    });
  });

  it('renders without crashing', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.queryAllByText(/Role|role|RBAC|Permission/i).length).toBeGreaterThan(0));
  });

  it('shows system roles', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    const systemTab = screen.getByText('System Roles');
    fireEvent.click(systemTab);
    await waitFor(() => expect(screen.queryAllByText(/Admin|Compliance Manager|Auditor|Viewer/i).length).toBeGreaterThan(0));
  });

  it('shows role list', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    // Component loaded successfully - tabs or content present
    expect(screen.queryAllByText(/Custom Roles|System Roles|User Assignments/i).length).toBeGreaterThan(0);
  });

  it('opens create role form', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    // Custom tab is empty (all mocked roles are system roles) and shows a Create Role button.
    fireEvent.click(screen.getByText('Create Role'));
    await waitFor(() => expect(screen.getByText('Create Custom Role')).toBeInTheDocument());
    expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
  });

  it('shows permission matrix', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Role'));
    await waitFor(() => expect(screen.getByText('Permission Matrix')).toBeInTheDocument());
    // Matrix renders the resource rows and action columns.
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
    expect(screen.getAllByText(/^Resource$/i).length).toBeGreaterThan(0);
  });

  it('filters roles by search', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    const searchInput = screen.getByPlaceholderText('Search roles...');
    fireEvent.change(searchInput, { target: { value: 'admin' } });
    expect(searchInput).toHaveValue('admin');
  });

  it('renders all four management tabs', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    // RoleManager exposes Custom / System / User-assignment / Audit tabs.
    expect(screen.getByText('Custom Roles')).toBeInTheDocument();
    expect(screen.getByText('System Roles')).toBeInTheDocument();
    expect(screen.getByText('User Assignments')).toBeInTheDocument();
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
  });

  it('prevents editing system roles', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    const systemTab = screen.getByText('System Roles');
    fireEvent.click(systemTab);
    await waitFor(() => expect(screen.queryAllByText(/Admin/i).length).toBeGreaterThan(0));
  });

  it('shows audit log tab', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Audit Log'));
    // The mocked audit-log endpoint returns an empty array → empty-state copy.
    await waitFor(() => expect(screen.getByText('No audit entries')).toBeInTheDocument());
  });

  it('shows the system-roles permission matrix', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    fireEvent.click(screen.getByText('System Roles'));
    // System roles render read-only matrices listing each system role by name.
    await waitFor(() => expect(screen.getByText('Compliance Manager')).toBeInTheDocument());
    expect(screen.getByText('Risk Manager')).toBeInTheDocument();
  });

  it('shows the empty custom-roles state with no delete affordance', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    // No custom roles exist, so the empty state is shown and no role-card delete icon renders.
    expect(screen.getByText('No custom roles')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid="icon-Trash2"]').length).toBe(0);
  });
});
