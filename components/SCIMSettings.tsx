/**
 * SCIM 2.0 User Provisioning Configuration
 *
 * Automated user lifecycle management:
 * - Enable/disable SCIM provisioning
 * - Bearer token generation with copy-to-clipboard
 * - SCIM endpoint URL display
 * - Sync status dashboard (last sync, total synced, failed syncs)
 * - User sync log table with action types, status, timestamps
 * - Group-to-role mapping configuration
 * - Manual sync trigger
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Plus,
  Trash2,
  Copy,
  Shield,
  Key,
  Users,
  Clock,
  Eye,
  EyeOff,
  Link,
  Check,
  Play,
  UserPlus,
  UserMinus,
  UserCheck,
  Settings,
  RotateCw,
  Activity,
  Search,
  ChevronDown,
  Info,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type SyncAction = 'create' | 'update' | 'deactivate' | 'reactivate' | 'delete';
type SyncStatus = 'success' | 'failed' | 'pending' | 'skipped';

interface SCIMConfig {
  enabled: boolean;
  endpointUrl: string;
  bearerToken: string;
  tokenCreatedAt: string;
  tokenExpiresAt: string;
}

interface SyncStats {
  lastSyncTime: string | null;
  totalSyncedUsers: number;
  failedSyncs: number;
  pendingSyncs: number;
  lastSyncDuration: number;
  nextScheduledSync: string | null;
}

interface SyncLogEntry {
  id: string;
  action: SyncAction;
  userEmail: string;
  userName: string;
  timestamp: string;
  status: SyncStatus;
  details: string;
  source: string;
}

interface GroupRoleMapping {
  id: string;
  scimGroup: string;
  appRole: string;
  autoAssign: boolean;
}

interface SCIMSettingsProps {
  onBack?: () => void;
}

const API_BASE = '/api/scim';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const ACTION_ICONS: Record<SyncAction, React.FC<{ className?: string }>> = {
  create: UserPlus,
  update: UserCheck,
  deactivate: UserMinus,
  reactivate: UserPlus,
  delete: Trash2,
};

const ACTION_LABELS: Record<SyncAction, string> = {
  create: 'Created',
  update: 'Updated',
  deactivate: 'Deactivated',
  reactivate: 'Reactivated',
  delete: 'Deleted',
};

const ACTION_COLORS: Record<SyncAction, string> = {
  create: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  update: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  deactivate: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  reactivate: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
  delete: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
};

const STATUS_COLORS: Record<SyncStatus, string> = {
  success: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
  failed: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
  pending: 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
  skipped: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
};

const ROLE_OPTIONS = ['admin', 'compliance_manager', 'risk_manager', 'auditor', 'viewer'];

// ── Component ───────────────────────────────────────────────────────────────

const SCIMSettings: React.FC<SCIMSettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'mappings'>('overview');
  const [config, setConfig] = useState<SCIMConfig | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [groupMappings, setGroupMappings] = useState<GroupRoleMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logActionFilter, setLogActionFilter] = useState<string>('all');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');

  // Mapping modal
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<GroupRoleMapping | null>(null);
  const [mappingForm, setMappingForm] = useState({ scimGroup: '', appRole: 'viewer', autoAssign: true });
  const [isSavingMapping, setIsSavingMapping] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [configData, statsData, logsData, mappingsData] = await Promise.all([
        apiFetch<SCIMConfig>(`${API_BASE}/config`),
        apiFetch<SyncStats>(`${API_BASE}/stats`),
        apiFetch<SyncLogEntry[]>(`${API_BASE}/logs`),
        apiFetch<GroupRoleMapping[]>(`${API_BASE}/group-mappings`),
      ]);
      setConfig(configData);
      setSyncStats(statsData);
      setSyncLogs(logsData);
      setGroupMappings(mappingsData);
    } catch {
      setError('Failed to load SCIM settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Toggle SCIM ──────────────────────────────────────────────────────

  const toggleSCIM = async () => {
    if (!config) return;
    try {
      const updated = await apiFetch<SCIMConfig>(`${API_BASE}/config`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !config.enabled }),
      });
      setConfig(updated);
      setSuccessMsg(updated.enabled ? 'SCIM provisioning enabled.' : 'SCIM provisioning disabled.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to toggle SCIM.');
    }
  };

  // ── Regenerate Token ─────────────────────────────────────────────────

  const regenerateToken = async () => {
    setIsRegeneratingToken(true);
    try {
      const updated = await apiFetch<SCIMConfig>(`${API_BASE}/token/regenerate`, { method: 'POST' });
      setConfig(updated);
      setShowToken(true);
      setSuccessMsg('Bearer token regenerated. Make sure to update your IdP configuration.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch {
      setError('Failed to regenerate token.');
    } finally {
      setIsRegeneratingToken(false);
    }
  };

  // ── Manual Sync ──────────────────────────────────────────────────────

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      await apiFetch(`${API_BASE}/sync`, { method: 'POST' });
      setSuccessMsg('Manual sync triggered successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadData();
    } catch {
      setError('Sync failed. Check the logs for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Group Mapping CRUD ───────────────────────────────────────────────

  const openCreateMapping = () => {
    setEditingMapping(null);
    setMappingForm({ scimGroup: '', appRole: 'viewer', autoAssign: true });
    setShowMappingModal(true);
  };

  const openEditMapping = (mapping: GroupRoleMapping) => {
    setEditingMapping(mapping);
    setMappingForm({ scimGroup: mapping.scimGroup, appRole: mapping.appRole, autoAssign: mapping.autoAssign });
    setShowMappingModal(true);
  };

  const saveMapping = async () => {
    if (!mappingForm.scimGroup.trim()) return;
    setIsSavingMapping(true);
    try {
      if (editingMapping) {
        const updated = await apiFetch<GroupRoleMapping>(`${API_BASE}/group-mappings/${editingMapping.id}`, {
          method: 'PUT',
          body: JSON.stringify(mappingForm),
        });
        setGroupMappings(prev => prev.map(m => (m.id === editingMapping.id ? updated : m)));
      } else {
        const created = await apiFetch<GroupRoleMapping>(`${API_BASE}/group-mappings`, {
          method: 'POST',
          body: JSON.stringify(mappingForm),
        });
        setGroupMappings(prev => [...prev, created]);
      }
      setShowMappingModal(false);
    } catch {
      setError('Failed to save group mapping.');
    } finally {
      setIsSavingMapping(false);
    }
  };

  const deleteMapping = async (id: string) => {
    try {
      await apiFetch(`${API_BASE}/group-mappings/${id}`, { method: 'DELETE' });
      setGroupMappings(prev => prev.filter(m => m.id !== id));
    } catch {
      setError('Failed to delete group mapping.');
    }
  };

  // ── Clipboard ────────────────────────────────────────────────────────

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Filtered Logs ────────────────────────────────────────────────────

  const filteredLogs = syncLogs.filter(log => {
    const matchesSearch = !searchQuery ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = logActionFilter === 'all' || log.action === logActionFilter;
    const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;
    return matchesSearch && matchesAction && matchesStatus;
  });

  // ── Tab Config ───────────────────────────────────────────────────────

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'logs' as const, label: 'Sync Logs', icon: Clock },
    { id: 'mappings' as const, label: 'Group Mappings', icon: Users },
  ];

  // ── Render ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading SCIM settings...</span>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SCIM Provisioning</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automated user lifecycle management via SCIM 2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerSync}
            disabled={isSyncing || !config?.enabled}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
            Manual Sync
          </button>
          <button onClick={loadData} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Refresh">
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-600 dark:text-red-400" /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300">{successMsg}</span>
        </div>
      )}

      {/* Enable/Disable + Endpoint Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              config?.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Users className={`w-5 h-5 ${config?.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">SCIM 2.0 Provisioning</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {config?.enabled ? 'Active and accepting provisioning requests' : 'Provisioning is disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSCIM}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config?.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config?.enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Endpoint URL */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SCIM Endpoint URL</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <Link className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <code className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                  {config?.endpointUrl || 'https://api.complyeasy.ai/api/scim/v2'}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(config?.endpointUrl || '', 'endpoint')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy"
              >
                {copiedField === 'endpoint' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>

          {/* Bearer Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bearer Token</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <Key className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <code className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                  {showToken ? (config?.bearerToken || 'scim_xxxxxxxxxxxxxxxx') : '••••••••••••••••••••••••••••••'}
                </code>
              </div>
              <button
                onClick={() => setShowToken(!showToken)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={showToken ? 'Hide' : 'Show'}
              >
                {showToken ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
              </button>
              <button
                onClick={() => copyToClipboard(config?.bearerToken || '', 'token')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy"
              >
                {copiedField === 'token' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created: {config?.tokenCreatedAt ? new Date(config.tokenCreatedAt).toLocaleDateString() : 'N/A'}
                {config?.tokenExpiresAt && ` | Expires: ${new Date(config.tokenExpiresAt).toLocaleDateString()}`}
              </span>
              <button
                onClick={regenerateToken}
                disabled={isRegeneratingToken}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50"
              >
                {isRegeneratingToken ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                Regenerate Token
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {/* ── Overview Tab ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Synced Users', value: syncStats?.totalSyncedUsers ?? 0, icon: Users, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Failed Syncs', value: syncStats?.failedSyncs ?? 0, icon: XCircle, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
              { label: 'Pending Syncs', value: syncStats?.pendingSyncs ?? 0, icon: Clock, color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' },
              { label: 'Last Sync Duration', value: `${syncStats?.lastSyncDuration ?? 0}s`, icon: Activity, color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{stat.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Last Sync Info */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sync Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Sync</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {syncStats?.lastSyncTime ? new Date(syncStats.lastSyncTime).toLocaleString() : 'Never'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Next Scheduled Sync</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {syncStats?.nextScheduledSync ? new Date(syncStats.nextScheduledSync).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            {syncLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sync activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {syncLogs.slice(0, 5).map(log => {
                  const ActionIcon = ACTION_ICONS[log.action];
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ACTION_COLORS[log.action]}`}>
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {ACTION_LABELS[log.action]} - {log.userName || log.userEmail}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[log.status]}`}>
                        {log.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sync Logs Tab ────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={logActionFilter}
              onChange={e => setLogActionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="deactivate">Deactivate</option>
              <option value="reactivate">Reactivate</option>
              <option value="delete">Delete</option>
            </select>
            <select
              value={logStatusFilter}
              onChange={e => setLogStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sync logs</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sync activity will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Action</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">User</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Details</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredLogs.map(log => {
                      const ActionIcon = ACTION_ICONS[log.action];
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action]}`}>
                              <ActionIcon className="w-3 h-3" />
                              {ACTION_LABELS[log.action]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{log.userName}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{log.userEmail}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[log.status]}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[200px] truncate">{log.details}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Group Mappings Tab ───────────────────────────────────────── */}
      {activeTab === 'mappings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Group-to-Role Mappings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Map SCIM groups from your IdP to application roles</p>
            </div>
            <button onClick={openCreateMapping} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Mapping
            </button>
          </div>

          {groupMappings.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center py-16">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No group mappings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Map IdP groups to application roles for automatic assignment</p>
              <button onClick={openCreateMapping} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Add Mapping
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">SCIM Group</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Application Role</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Auto-Assign</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {groupMappings.map(mapping => (
                    <tr key={mapping.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{mapping.scimGroup}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          {mapping.appRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {mapping.autoAssign ? (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditMapping(mapping)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button onClick={() => deleteMapping(mapping.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Mapping Modal ────────────────────────────────────────────── */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingMapping ? 'Edit Group Mapping' : 'Add Group Mapping'}
              </h2>
              <button onClick={() => setShowMappingModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SCIM Group Name *</label>
                <input
                  type="text"
                  value={mappingForm.scimGroup}
                  onChange={e => setMappingForm(prev => ({ ...prev, scimGroup: e.target.value }))}
                  placeholder="e.g., ComplianceTeam"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application Role</label>
                <select
                  value={mappingForm.appRole}
                  onChange={e => setMappingForm(prev => ({ ...prev, appRole: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Auto-Assign</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically assign role when user is added to this group</p>
                </div>
                <button
                  onClick={() => setMappingForm(prev => ({ ...prev, autoAssign: !prev.autoAssign }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    mappingForm.autoAssign ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    mappingForm.autoAssign ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowMappingModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={saveMapping}
                disabled={!mappingForm.scimGroup.trim() || isSavingMapping}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingMapping && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingMapping ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SCIMSettings;
