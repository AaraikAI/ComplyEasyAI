/**
 * Role Manager - Custom Role Builder with Permission Matrix
 *
 * Enterprise RBAC management:
 * - Role CRUD (name, description)
 * - Permission matrix: resources x actions with scope selectors
 * - Pre-built system roles (Admin, Compliance Manager, Risk Manager, Auditor, Viewer)
 * - Role assignment to users
 * - Permission inheritance visualization
 * - Audit log of permission changes
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  X,
  Search,
  RefreshCw,
  CheckCircle,
  Shield,
  Edit,
  Trash2,
  Loader2,
  Clock,
  AlertTriangle,
  Users,
  Eye,
  Lock,
  Copy,
  Save,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Check,
  FileText,
  Settings,
  History,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type Scope = 'own' | 'team' | 'department' | 'org';
type Action = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export';

interface Permission {
  resource: string;
  action: Action;
  scope: Scope;
  granted: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  inheritsFrom: string | null;
}

interface RoleUser {
  id: string;
  name: string;
  email: string;
  department: string;
  assignedAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  roleName: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

interface RoleManagerProps {
  onBack?: () => void;
}

const API_BASE = '/api/roles';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const RESOURCES = [
  'frameworks',
  'risks',
  'controls',
  'policies',
  'vendors',
  'evidence',
  'incidents',
  'assets',
  'reports',
  'settings',
];

const ACTIONS: Action[] = ['create', 'read', 'update', 'delete', 'approve', 'export'];

const SCOPES: { value: Scope; label: string; color: string }[] = [
  { value: 'own', label: 'Own', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  { value: 'team', label: 'Team', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  { value: 'department', label: 'Dept', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  { value: 'org', label: 'Org', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
];

const RESOURCE_LABELS: Record<string, string> = {
  frameworks: 'Frameworks',
  risks: 'Risks',
  controls: 'Controls',
  policies: 'Policies',
  vendors: 'Vendors',
  evidence: 'Evidence',
  incidents: 'Incidents',
  assets: 'Assets',
  reports: 'Reports',
  settings: 'Settings',
};

const SYSTEM_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Admin',
    description: 'Full access to all resources and settings',
    isSystem: true,
    userCount: 0,
    inheritsFrom: null,
    permissions: RESOURCES.flatMap(r => ACTIONS.map(a => ({ resource: r, action: a, scope: 'org' as Scope, granted: true }))),
  },
  {
    name: 'Compliance Manager',
    description: 'Manage frameworks, controls, policies, and evidence',
    isSystem: true,
    userCount: 0,
    inheritsFrom: null,
    permissions: RESOURCES.flatMap(r =>
      ACTIONS.map(a => ({
        resource: r,
        action: a,
        scope: 'org' as Scope,
        granted: ['frameworks', 'controls', 'policies', 'evidence', 'reports'].includes(r) ||
                 (r !== 'settings' && a === 'read'),
      }))
    ),
  },
  {
    name: 'Risk Manager',
    description: 'Manage risks, vendors, incidents, and assets',
    isSystem: true,
    userCount: 0,
    inheritsFrom: null,
    permissions: RESOURCES.flatMap(r =>
      ACTIONS.map(a => ({
        resource: r,
        action: a,
        scope: 'org' as Scope,
        granted: ['risks', 'vendors', 'incidents', 'assets'].includes(r) ||
                 (a === 'read' && r !== 'settings'),
      }))
    ),
  },
  {
    name: 'Auditor',
    description: 'Read-only access with export capabilities',
    isSystem: true,
    userCount: 0,
    inheritsFrom: null,
    permissions: RESOURCES.flatMap(r =>
      ACTIONS.map(a => ({
        resource: r,
        action: a,
        scope: 'org' as Scope,
        granted: a === 'read' || a === 'export',
      }))
    ),
  },
  {
    name: 'Viewer',
    description: 'Read-only access to assigned resources',
    isSystem: true,
    userCount: 0,
    inheritsFrom: null,
    permissions: RESOURCES.flatMap(r =>
      ACTIONS.map(a => ({
        resource: r,
        action: a,
        scope: 'own' as Scope,
        granted: a === 'read',
      }))
    ),
  },
];

// ── Component ───────────────────────────────────────────────────────────────

const RoleManager: React.FC<RoleManagerProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'system' | 'users' | 'audit'>('custom');
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleUsers, setRoleUsers] = useState<Record<string, RoleUser[]>>({});
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Role editor state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [roleInheritsFrom, setRoleInheritsFrom] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // User assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRoleId, setAssignRoleId] = useState<string>('');
  const [assignEmail, setAssignEmail] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Selected role for detail view
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // ── Data Loading ──────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rolesData, auditData] = await Promise.all([
        apiFetch<Role[]>(`${API_BASE}`),
        apiFetch<AuditEntry[]>(`${API_BASE}/audit-log`),
      ]);
      setRoles(rolesData);
      setAuditLog(auditData);
    } catch {
      setError('Failed to load roles.');
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Role CRUD ─────────────────────────────────────────────────────────

  const initPermissions = (): Permission[] =>
    RESOURCES.flatMap(r => ACTIONS.map(a => ({ resource: r, action: a, scope: 'own' as Scope, granted: false })));

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRolePermissions(initPermissions());
    setRoleInheritsFrom('');
    setShowRoleModal(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setRolePermissions([...role.permissions]);
    setRoleInheritsFrom(role.inheritsFrom || '');
    setShowRoleModal(true);
  };

  const togglePermission = (resource: string, action: Action) => {
    setRolePermissions(prev =>
      prev.map(p =>
        p.resource === resource && p.action === action
          ? { ...p, granted: !p.granted }
          : p
      )
    );
  };

  const setPermissionScope = (resource: string, action: Action, scope: Scope) => {
    setRolePermissions(prev =>
      prev.map(p =>
        p.resource === resource && p.action === action
          ? { ...p, scope }
          : p
      )
    );
  };

  const toggleResourceRow = (resource: string, grantAll: boolean) => {
    setRolePermissions(prev =>
      prev.map(p =>
        p.resource === resource ? { ...p, granted: grantAll } : p
      )
    );
  };

  const toggleActionColumn = (action: Action, grantAll: boolean) => {
    setRolePermissions(prev =>
      prev.map(p =>
        p.action === action ? { ...p, granted: grantAll } : p
      )
    );
  };

  const getPermission = (resource: string, action: Action): Permission | undefined =>
    rolePermissions.find(p => p.resource === resource && p.action === action);

  const saveRole = async () => {
    if (!roleName.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: roleName,
        description: roleDescription,
        permissions: rolePermissions,
        inheritsFrom: roleInheritsFrom || null,
      };
      if (editingRole) {
        const updated = await apiFetch<Role>(`${API_BASE}/${editingRole.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setRoles(prev => prev.map(r => (r.id === editingRole.id ? updated : r)));
      } else {
        const created = await apiFetch<Role>(`${API_BASE}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setRoles(prev => [...prev, created]);
      }
      setShowRoleModal(false);
    } catch {
      setError('Failed to save role.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      setRoles(prev => prev.filter(r => r.id !== id));
      setShowDeleteConfirm(null);
    } catch {
      setError('Failed to delete role.');
    }
  };

  // ── User Assignment ──────────────────────────────────────────────────

  const loadRoleUsers = async (roleId: string) => {
    try {
      const users = await apiFetch<RoleUser[]>(`${API_BASE}/${roleId}/users`);
      setRoleUsers(prev => ({ ...prev, [roleId]: users }));
    } catch {
      setError('Failed to load role users.');
    }
  };

  const assignUser = async () => {
    if (!assignEmail.trim() || !assignRoleId) return;
    setIsAssigning(true);
    try {
      await apiFetch(`${API_BASE}/${assignRoleId}/users`, {
        method: 'POST',
        body: JSON.stringify({ email: assignEmail }),
      });
      await loadRoleUsers(assignRoleId);
      setShowAssignModal(false);
      setAssignEmail('');
    } catch {
      setError('Failed to assign user.');
    } finally {
      setIsAssigning(false);
    }
  };

  const removeUserFromRole = async (roleId: string, userId: string) => {
    try {
      await apiFetch(`${API_BASE}/${roleId}/users/${userId}`, { method: 'DELETE' });
      setRoleUsers(prev => ({
        ...prev,
        [roleId]: (prev[roleId] || []).filter(u => u.id !== userId),
      }));
    } catch {
      setError('Failed to remove user from role.');
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────

  const customRoles = roles.filter(r => !r.isSystem);
  const filteredCustomRoles = customRoles.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'custom' as const, label: 'Custom Roles', icon: Shield },
    { id: 'system' as const, label: 'System Roles', icon: Lock },
    { id: 'users' as const, label: 'User Assignments', icon: Users },
    { id: 'audit' as const, label: 'Audit Log', icon: History },
  ];

  // ── Render ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading roles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Manager</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure roles and permissions</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-600 dark:text-red-400" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Custom Roles Tab ─────────────────────────────────────────── */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button onClick={openCreateRole} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> New Role
            </button>
          </div>

          {filteredCustomRoles.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No custom roles</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create a custom role with specific permissions</p>
              <button onClick={openCreateRole} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Create Role
              </button>
            </div>
          ) : (
            filteredCustomRoles.map(role => (
              <div key={role.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {role.userCount} users</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {role.permissions.filter(p => p.granted).length} permissions
                      </span>
                      {role.inheritsFrom && (
                        <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Inherits from: {role.inheritsFrom}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {RESOURCES.map(resource => {
                        const granted = role.permissions.filter(p => p.resource === resource && p.granted).length;
                        if (granted === 0) return null;
                        return (
                          <span key={resource} className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                            {RESOURCE_LABELS[resource]} ({granted})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => openEditRole(role)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => { setAssignRoleId(role.id); setShowAssignModal(true); }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Assign Users"
                    >
                      <UserPlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(role.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                {showDeleteConfirm === role.id && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-red-700 dark:text-red-300">Delete this role? Users will lose these permissions.</span>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDeleteConfirm(null)} className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancel</button>
                      <button onClick={() => deleteRole(role.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── System Roles Tab ─────────────────────────────────────────── */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-2">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              System roles are pre-configured and cannot be modified. Create custom roles for specialized access requirements.
            </p>
          </div>

          {SYSTEM_ROLES.map(role => (
            <div key={role.name} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {role.name}
                    <Lock className="w-3 h-3 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                </div>
              </div>

              {/* Compact Permission Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left font-medium text-gray-500 dark:text-gray-400">Resource</th>
                      {ACTIONS.map(a => (
                        <th key={a} className="px-2 py-1 text-center font-medium text-gray-500 dark:text-gray-400 capitalize">{a}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCES.map(resource => (
                      <tr key={resource} className="border-t border-gray-100 dark:border-gray-700/50">
                        <td className="px-2 py-1 font-medium text-gray-700 dark:text-gray-300">{RESOURCE_LABELS[resource]}</td>
                        {ACTIONS.map(action => {
                          const perm = role.permissions.find(p => p.resource === resource && p.action === action);
                          return (
                            <td key={action} className="px-2 py-1 text-center">
                              {perm?.granted ? (
                                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 inline-block" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 inline-block" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── User Assignments Tab ─────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">User Role Assignments</h3>
            <button
              onClick={() => { setAssignRoleId(roles[0]?.id || ''); setShowAssignModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Assign User
            </button>
          </div>

          {roles.map(role => (
            <div key={role.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => {
                  if (selectedRole?.id === role.id) {
                    setSelectedRole(null);
                  } else {
                    setSelectedRole(role);
                    if (!roleUsers[role.id]) loadRoleUsers(role.id);
                  }
                }}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{role.name}</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({role.userCount} users)</span>
                  </div>
                </div>
                {selectedRole?.id === role.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>

              {selectedRole?.id === role.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  {!roleUsers[role.id] ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  ) : roleUsers[role.id].length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No users assigned to this role</p>
                  ) : (
                    <div className="space-y-2">
                      {roleUsers[role.id].map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email} | {user.department}</p>
                          </div>
                          <button
                            onClick={() => removeUserFromRole(role.id, user.id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Audit Log Tab ────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {auditLog.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No audit entries</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Permission changes will be logged here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Performed By</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Details</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {auditLog.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          entry.action.includes('create') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          entry.action.includes('delete') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{entry.roleName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.performedBy}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[250px] truncate">{entry.details}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(entry.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Role Editor Modal ────────────────────────────────────────── */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingRole ? 'Edit Role' : 'Create Custom Role'}
              </h2>
              <button onClick={() => setShowRoleModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Name and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name *</label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                    placeholder="e.g., Department Lead"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inherits From (optional)</label>
                  <select
                    value={roleInheritsFrom}
                    onChange={e => setRoleInheritsFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {roles.filter(r => r.id !== editingRole?.id).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={roleDescription}
                  onChange={e => setRoleDescription(e.target.value)}
                  placeholder="Describe what this role is used for..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Permission Matrix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permission Matrix</label>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 min-w-[120px]">Resource</th>
                        {ACTIONS.map(action => (
                          <th key={action} className="px-2 py-2 text-center font-medium text-gray-600 dark:text-gray-300 min-w-[80px]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="capitalize">{action}</span>
                              <button
                                onClick={() => {
                                  const allGranted = RESOURCES.every(r => getPermission(r, action)?.granted);
                                  toggleActionColumn(action, !allGranted);
                                }}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {RESOURCES.every(r => getPermission(r, action)?.granted) ? 'None' : 'All'}
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RESOURCES.map(resource => (
                        <tr key={resource} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{RESOURCE_LABELS[resource]}</span>
                              <button
                                onClick={() => {
                                  const allGranted = ACTIONS.every(a => getPermission(resource, a)?.granted);
                                  toggleResourceRow(resource, !allGranted);
                                }}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-1"
                              >
                                {ACTIONS.every(a => getPermission(resource, a)?.granted) ? 'None' : 'All'}
                              </button>
                            </div>
                          </td>
                          {ACTIONS.map(action => {
                            const perm = getPermission(resource, action);
                            return (
                              <td key={action} className="px-2 py-2 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <button
                                    onClick={() => togglePermission(resource, action)}
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                      perm?.granted
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {perm?.granted && <Check className="w-3.5 h-3.5" />}
                                  </button>
                                  {perm?.granted && (
                                    <select
                                      value={perm.scope}
                                      onChange={e => setPermissionScope(resource, action, e.target.value as Scope)}
                                      className="text-xs px-1 py-0.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 w-16"
                                    >
                                      {SCOPES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Scopes:</span>
                  {SCOPES.map(s => (
                    <span key={s.value} className={`px-1.5 py-0.5 text-xs rounded ${s.color}`}>{s.label} = {s.value === 'own' ? 'Own records' : s.value === 'team' ? 'Team records' : s.value === 'department' ? 'Department records' : 'All records'}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={saveRole}
                disabled={!roleName.trim() || isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign User Modal ────────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assign User to Role</h2>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  value={assignRoleId}
                  onChange={e => setAssignRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Email *</label>
                <input
                  type="email"
                  value={assignEmail}
                  onChange={e => setAssignEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={assignUser}
                disabled={!assignEmail.trim() || isAssigning}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManager;
