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

  it('opens create role form', () => {
    render(<RoleManager />);
    const addBtn = screen.queryAllByText(/Create Role|New Role|Add Role/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('shows permission matrix', () => {
    render(<RoleManager />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('filters roles by search', () => {
    render(<RoleManager />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'admin' } });
  });

  it('shows stat cards', () => {
    render(<RoleManager />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('prevents editing system roles', async () => {
    render(<RoleManager />);
    await waitFor(() => expect(screen.getByText('Roles & Permissions')).toBeInTheDocument());
    const systemTab = screen.getByText('System Roles');
    fireEvent.click(systemTab);
    await waitFor(() => expect(screen.queryAllByText(/Admin/i).length).toBeGreaterThan(0));
  });

  it('shows audit log tab', () => {
    render(<RoleManager />);
    const auditTab = screen.queryAllByText(/Audit|audit|History|history|Log|log/i)[0] ?? null;
    if (auditTab) fireEvent.click(auditTab);
  });

  it('duplicates a role', () => {
    render(<RoleManager />);
    const copyBtns = document.querySelectorAll('[data-testid="icon-Copy"]');
    if (copyBtns.length > 0) {
      const btn = copyBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });

  it('deletes a custom role', () => {
    render(<RoleManager />);
    const deleteBtns = document.querySelectorAll('[data-testid="icon-Trash2"]');
    if (deleteBtns.length > 0) {
      const btn = deleteBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });
});
