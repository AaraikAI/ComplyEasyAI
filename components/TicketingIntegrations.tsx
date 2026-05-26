/**
 * Ticketing Integrations Component
 *
 * Full ticketing integration management for Jira, ServiceNow, and Azure DevOps:
 * - Connection management: list, add, test, delete
 * - Provider cards with connect/disconnect workflows
 * - Connection configuration forms per provider
 * - Ticket list with external status and links
 * - Create ticket form linked to compliance findings/incidents
 * - Field mapping configuration UI
 * - Sync status indicators and stats
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  Ticket,
  Link2,
  ExternalLink,
  RefreshCw,
  Plus,
  Settings,
  Check,
  X,
  AlertCircle,
  Clock,
  Search,
  Trash2,
  ChevronRight,
  Shield,
  Filter,
  BarChart3,
  Zap,
  Eye,
  Edit,
} from 'lucide-react';
import { api } from '../services/api';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketingProvider = 'jira' | 'servicenow' | 'azure_devops';
type TabId = 'connections' | 'tickets' | 'create' | 'mapping' | 'stats';

interface Connection {
  id: string;
  provider: TicketingProvider;
  name: string;
  connected: boolean;
  lastSync: string | null;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface TicketRecord {
  id: string;
  provider: string;
  action: string;
  direction: string;
  externalId: string | null;
  externalSysId: string | null;
  localIssueId: string | null;
  sourceType: string | null;
  sourceId: string | null;
  syncedAt: string;
  userId: string | null;
}

interface SyncStatus {
  lastSync: string | null;
  totalSynced: number;
  pendingSync: number;
  syncErrors: number;
}

interface ConnectionForm {
  provider: TicketingProvider;
  instanceUrl: string;
  organization: string;
  project: string;
  projectKey: string;
  authType: 'basic' | 'oauth' | 'pat';
  username: string;
  password: string;
  pat: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

interface CreateTicketForm {
  provider: TicketingProvider;
  title: string;
  description: string;
  severity: string;
  framework: string;
  controlId: string;
  sourceType: string;
  sourceId: string;
  projectKey: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const providerMeta: Record<
  TicketingProvider,
  { label: string; color: string; bgColor: string; description: string }
> = {
  jira: {
    label: 'Jira',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    description: 'Atlassian Jira for issue and project tracking',
  },
  servicenow: {
    label: 'ServiceNow',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30',
    description: 'ServiceNow ITSM for incident and change management',
  },
  azure_devops: {
    label: 'Azure DevOps',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20 border-cyan-500/30',
    description: 'Azure DevOps for work items, boards, and pipelines',
  },
};

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'connections', label: 'Connections', icon: <Link2 className="w-4 h-4" /> },
  { id: 'tickets', label: 'Tickets', icon: <Ticket className="w-4 h-4" /> },
  { id: 'create', label: 'Create Ticket', icon: <Plus className="w-4 h-4" /> },
  { id: 'mapping', label: 'Field Mapping', icon: <Settings className="w-4 h-4" /> },
  { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
];

const defaultConnectionForm: ConnectionForm = {
  provider: 'jira',
  instanceUrl: '',
  organization: '',
  project: '',
  projectKey: '',
  authType: 'basic',
  username: '',
  password: '',
  pat: '',
  clientId: '',
  clientSecret: '',
  tenantId: '',
};

const defaultCreateForm: CreateTicketForm = {
  provider: 'jira',
  title: '',
  description: '',
  severity: 'Medium',
  framework: '',
  controlId: '',
  sourceType: '',
  sourceId: '',
  projectKey: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TicketingIntegrations: React.FC = () => {
  const { t } = useI18n();
  // --- State ---
  const [activeTab, setActiveTab] = useState<TabId>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [ticketsPagination, setTicketsPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus>>({});
  const [fieldMappings, setFieldMappings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Connection form
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [connectionForm, setConnectionForm] = useState<ConnectionForm>({ ...defaultConnectionForm });
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Create ticket form
  const [createForm, setCreateForm] = useState<CreateTicketForm>({ ...defaultCreateForm });
  const [creating, setCreating] = useState(false);

  // Ticket detail
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Filters
  const [ticketSearch, setTicketSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // Syncing state
  const [syncing, setSyncing] = useState(false);

  // Mapping editor
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [mappingDraft, setMappingDraft] = useState<any>(null);

  // --- Data Loading ---

  const loadConnections = useCallback(async () => {
    try {
      const data = await api.ticketing.listConnections();
      setConnections(data.connections || []);
    } catch (err: any) {
      logger.error('Failed to load connections:', err);
    }
  }, []);

  const loadTickets = useCallback(
    async (page = 1) => {
      try {
        const params: Record<string, string> = { page: String(page), limit: '20' };
        if (providerFilter !== 'all') params.provider = providerFilter;
        const data = await api.ticketing.listTickets(params);
        setTickets(data.tickets || []);
        setTicketsPagination(
          data.pagination || { page: 1, limit: 20, totalCount: 0, totalPages: 0 }
        );
      } catch (err: any) {
        logger.error('Failed to load tickets:', err);
      }
    },
    [providerFilter]
  );

  const loadSyncStatuses = useCallback(async () => {
    const statuses: Record<string, SyncStatus> = {};
    for (const provider of ['jira', 'servicenow', 'azure_devops'] as TicketingProvider[]) {
      try {
        const data = await api.ticketing.getSyncStatus(provider);
        statuses[provider] = data;
      } catch {
        // Provider not connected -- skip
      }
    }
    setSyncStatuses(statuses);
  }, []);

  const loadFieldMapping = useCallback(async (provider: string) => {
    try {
      const data = await api.ticketing.getFieldMapping(provider);
      setFieldMappings((prev) => ({ ...prev, [provider]: data }));
    } catch {
      // ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([loadConnections(), loadTickets(), loadSyncStatuses()]).finally(() =>
      setLoading(false)
    );
  }, [loadConnections, loadTickets, loadSyncStatuses]);

  // Reload tickets when filter changes
  useEffect(() => {
    loadTickets(1);
  }, [providerFilter, loadTickets]);

  // Clear status messages after timeout
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // --- Actions ---

  const handleCreateConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        provider: connectionForm.provider,
        authType: connectionForm.authType,
      };

      if (connectionForm.provider === 'jira') {
        payload.instanceUrl = connectionForm.instanceUrl;
        payload.username = connectionForm.username;
        payload.password = connectionForm.password;
        payload.projectKey = connectionForm.projectKey;
      } else if (connectionForm.provider === 'servicenow') {
        payload.instanceUrl = connectionForm.instanceUrl;
        payload.username = connectionForm.username;
        payload.password = connectionForm.password;
      } else if (connectionForm.provider === 'azure_devops') {
        payload.organization = connectionForm.organization;
        payload.project = connectionForm.project;
        payload.authType = 'pat';
        payload.pat = connectionForm.pat;
        if (connectionForm.tenantId) payload.tenantId = connectionForm.tenantId;
      }

      await api.ticketing.createConnection(payload);
      setSuccess(
        `${providerMeta[connectionForm.provider].label} connection created successfully`
      );
      setShowConnectionForm(false);
      setConnectionForm({ ...defaultConnectionForm });
      await loadConnections();
      await loadSyncStatuses();
    } catch (err: any) {
      setError(err.message || 'Failed to create connection');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    setLoading(true);
    try {
      await api.ticketing.deleteConnection(id);
      setSuccess('Connection removed');
      await loadConnections();
      await loadSyncStatuses();
    } catch (err: any) {
      setError(err.message || 'Failed to remove connection');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingConnection(id);
    setTestResult(null);
    try {
      const result = await api.ticketing.testConnectionById(id);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test failed' });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleCreateTicket = async () => {
    if (!createForm.title.trim()) {
      setError('Title is required');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await api.ticketing.createTicket({
        provider: createForm.provider,
        title: createForm.title,
        description: createForm.description,
        severity: createForm.severity,
        framework: createForm.framework || undefined,
        controlId: createForm.controlId || undefined,
        sourceType: createForm.sourceType || undefined,
        sourceId: createForm.sourceId || undefined,
        projectKey: createForm.projectKey || undefined,
      });
      setSuccess('Ticket created successfully');
      setCreateForm({ ...defaultCreateForm });
      await loadTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const handleBulkSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await api.ticketing.bulkSync({});
      const totalSynced = Object.values(result.results || {}).reduce(
        (sum: number, r: any) => sum + (r.pushed || 0) + (r.pulled || 0) + (r.updated || 0),
        0
      );
      setSuccess(`Bulk sync complete. ${totalSynced} ticket(s) synced.`);
      await loadTickets();
      await loadSyncStatuses();
    } catch (err: any) {
      setError(err.message || 'Bulk sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSingleTicket = async (ticketId: string) => {
    try {
      await api.ticketing.syncTicket(ticketId);
      setSuccess('Ticket status synced');
      await loadTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to sync ticket');
    }
  };

  const handleSaveMapping = async (provider: string) => {
    if (!mappingDraft) return;
    try {
      await api.ticketing.updateFieldMapping(provider, { mappingRules: mappingDraft });
      setSuccess(
        `Field mapping for ${providerMeta[provider as TicketingProvider]?.label || provider} updated`
      );
      setEditingMapping(null);
      setMappingDraft(null);
      await loadFieldMapping(provider);
    } catch (err: any) {
      setError(err.message || 'Failed to save mapping');
    }
  };

  const handleViewTicket = async (ticketId: string) => {
    try {
      const data = await api.ticketing.getTicket(ticketId);
      setSelectedTicket(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details');
    }
  };

  // --- Computed ---

  const connectedProviders = useMemo(
    () => connections.filter((c) => c.connected).map((c) => c.provider),
    [connections]
  );

  const filteredTickets = useMemo(() => {
    if (!ticketSearch.trim()) return tickets;
    const q = ticketSearch.toLowerCase();
    return tickets.filter(
      (t) =>
        (t.externalId && t.externalId.toLowerCase().includes(q)) ||
        (t.provider && t.provider.toLowerCase().includes(q)) ||
        (t.sourceType && t.sourceType.toLowerCase().includes(q))
    );
  }, [tickets, ticketSearch]);

  const stats = useMemo(() => {
    const byProvider: Record<string, number> = {};
    const byDirection: Record<string, number> = {};
    for (const t of tickets) {
      byProvider[t.provider] = (byProvider[t.provider] || 0) + 1;
      byDirection[t.direction] = (byDirection[t.direction] || 0) + 1;
    }
    return {
      total: ticketsPagination.totalCount,
      byProvider,
      byDirection,
      syncStatuses,
    };
  }, [tickets, ticketsPagination.totalCount, syncStatuses]);

  // --- Render Helpers ---

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'jira':
        return <Ticket className="w-5 h-5 text-blue-400" />;
      case 'servicenow':
        return <Shield className="w-5 h-5 text-green-400" />;
      case 'azure_devops':
        return <Zap className="w-5 h-5 text-cyan-400" />;
      default:
        return <Ticket className="w-5 h-5 text-gray-400" />;
    }
  };

  // =========================================================================
  // Tab: Connections
  // =========================================================================

  const renderConnections = () => (
    <div className="space-y-6">
      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(providerMeta) as TicketingProvider[]).map((provider) => {
          const meta = providerMeta[provider];
          const conn = connections.find((c) => c.provider === provider);
          const isConnected = conn?.connected || false;
          const syncStatus = syncStatuses[provider];

          return (
            <div
              key={provider}
              className={`rounded-xl border p-5 transition-all ${
                isConnected
                  ? `${meta.bgColor} border-opacity-50`
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getProviderIcon(provider)}
                  <div>
                    <h3 className={`font-semibold ${meta.color}`}>{meta.label}</h3>
                    <p className="text-xs text-white/50 mt-0.5">{meta.description}</p>
                  </div>
                </div>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full">
                    <X className="w-3 h-3" />
                    Not Connected
                  </span>
                )}
              </div>

              {isConnected && (
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Clock className="w-3 h-3" />
                    {t('integrations.lastSync')}: {formatDate(conn?.lastSync || null)}
                  </div>
                  {syncStatus && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white/5 rounded p-1.5 text-center">
                        <div className="text-white/80 font-medium">{syncStatus.totalSynced}</div>
                        <div className="text-white/40">Synced</div>
                      </div>
                      <div className="bg-white/5 rounded p-1.5 text-center">
                        <div className="text-white/80 font-medium">{syncStatus.pendingSync}</div>
                        <div className="text-white/40">{t('common.pending')}</div>
                      </div>
                      <div className="bg-white/5 rounded p-1.5 text-center">
                        <div
                          className={`font-medium ${
                            syncStatus.syncErrors > 0 ? 'text-red-400' : 'text-white/80'
                          }`}
                        >
                          {syncStatus.syncErrors}
                        </div>
                        <div className="text-white/40">Errors</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {isConnected ? (
                  <>
                    <button
                      onClick={() => conn && handleTestConnection(conn.id)}
                      disabled={testingConnection === conn?.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/15 text-white/70 transition-colors disabled:opacity-50"
                    >
                      {testingConnection === conn?.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      Test
                    </button>
                    <button
                      onClick={() => conn && handleDeleteConnection(conn.id)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setConnectionForm({ ...defaultConnectionForm, provider });
                      setShowConnectionForm(true);
                      setTestResult(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs ${meta.bgColor} ${meta.color} hover:brightness-110 transition-all`}
                  >
                    <Plus className="w-3 h-3" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Result Banner */}
      {testResult && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            testResult.success
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {testResult.success ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {testResult.message}
          <button onClick={() => setTestResult(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connection Form Modal */}
      {showConnectionForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                Connect {providerMeta[connectionForm.provider].label}
              </h3>
              <button
                onClick={() => {
                  setShowConnectionForm(false);
                  setTestResult(null);
                }}
                className="text-white/40 hover:text-white/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Jira fields */}
              {connectionForm.provider === 'jira' && (
                <>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">Instance URL</label>
                    <input
                      type="url"
                      value={connectionForm.instanceUrl}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, instanceUrl: e.target.value }))
                      }
                      placeholder="https://your-org.atlassian.net"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">Email / Username</label>
                    <input
                      type="text"
                      value={connectionForm.username}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, username: e.target.value }))
                      }
                      placeholder="user@company.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">API Token</label>
                    <input
                      type="password"
                      value={connectionForm.password}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, password: e.target.value }))
                      }
                      placeholder="Jira API token"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">
                      Default Project Key
                    </label>
                    <input
                      type="text"
                      value={connectionForm.projectKey}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, projectKey: e.target.value }))
                      }
                      placeholder="COMP"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </>
              )}

              {/* ServiceNow fields */}
              {connectionForm.provider === 'servicenow' && (
                <>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">Instance URL</label>
                    <input
                      type="url"
                      value={connectionForm.instanceUrl}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, instanceUrl: e.target.value }))
                      }
                      placeholder="https://your-instance.service-now.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">Username</label>
                    <input
                      type="text"
                      value={connectionForm.username}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, username: e.target.value }))
                      }
                      placeholder="admin"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">Password</label>
                    <input
                      type="password"
                      value={connectionForm.password}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, password: e.target.value }))
                      }
                      placeholder="ServiceNow password"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                </>
              )}

              {/* Azure DevOps fields */}
              {connectionForm.provider === 'azure_devops' && (
                <>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">Organization Name</label>
                    <input
                      type="text"
                      value={connectionForm.organization}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, organization: e.target.value }))
                      }
                      placeholder="your-org-name"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">Default Project</label>
                    <input
                      type="text"
                      value={connectionForm.project}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, project: e.target.value }))
                      }
                      placeholder="My Project"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">
                      Personal Access Token (PAT)
                    </label>
                    <input
                      type="password"
                      value={connectionForm.pat}
                      onChange={(e) => setConnectionForm((f) => ({ ...f, pat: e.target.value }))}
                      placeholder="Azure DevOps PAT"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5">
                      Tenant ID (optional, for OAuth)
                    </label>
                    <input
                      type="text"
                      value={connectionForm.tenantId}
                      onChange={(e) =>
                        setConnectionForm((f) => ({ ...f, tenantId: e.target.value }))
                      }
                      placeholder="Azure AD Tenant ID"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => {
                  setShowConnectionForm(false);
                  setTestResult(null);
                }}
                className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white/80 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConnection}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // =========================================================================
  // Tab: Tickets
  // =========================================================================

  const renderTickets = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-white/40" />
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">All Providers</option>
              <option value="jira">Jira</option>
              <option value="servicenow">ServiceNow</option>
              <option value="azure_devops">Azure DevOps</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleBulkSync}
          disabled={syncing || connectedProviders.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
        >
          {syncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {t('integrations.syncNow')}
        </button>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No synced tickets found</p>
          <p className="text-xs mt-1">Create tickets or sync from an external system</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              {getProviderIcon(ticket.provider)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {ticket.externalId && (
                    <span className="text-sm font-medium text-white">{ticket.externalId}</span>
                  )}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      ticket.direction === 'push'
                        ? 'bg-blue-500/20 text-blue-400'
                        : ticket.direction === 'pull'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {ticket.direction}
                  </span>
                  <span className="text-xs text-white/40">
                    {providerMeta[ticket.provider as TicketingProvider]?.label || ticket.provider}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(ticket.syncedAt)}
                  </span>
                  {ticket.sourceType && <span>Source: {ticket.sourceType}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSyncSingleTicket(ticket.id)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                  title="Sync status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleViewTicket(ticket.id)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                  title="View details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {ticketsPagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => loadTickets(ticketsPagination.page - 1)}
            disabled={ticketsPagination.page <= 1}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-xs text-white/40">
            Page {ticketsPagination.page} of {ticketsPagination.totalPages}
          </span>
          <button
            onClick={() => loadTickets(ticketsPagination.page + 1)}
            disabled={ticketsPagination.page >= ticketsPagination.totalPages}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-gray-900">
              <h3 className="text-lg font-semibold text-white">Ticket Details</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-white/40 hover:text-white/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/40 text-xs mb-1">Provider</div>
                  <div className="text-white">{selectedTicket.provider}</div>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-1">Action</div>
                  <div className="text-white">{selectedTicket.action}</div>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-1">Synced At</div>
                  <div className="text-white">{formatDate(selectedTicket.syncedAt)}</div>
                </div>
              </div>
              {selectedTicket.details && (
                <div>
                  <div className="text-white/40 text-xs mb-2">Sync Details</div>
                  <pre className="bg-white/5 rounded-lg p-3 text-xs text-white/70 overflow-x-auto">
                    {JSON.stringify(selectedTicket.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedTicket.externalDetails &&
                selectedTicket.externalDetails !== selectedTicket.details && (
                  <div>
                    <div className="text-white/40 text-xs mb-2">External Record</div>
                    <pre className="bg-white/5 rounded-lg p-3 text-xs text-white/70 overflow-x-auto">
                      {JSON.stringify(selectedTicket.externalDetails, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // =========================================================================
  // Tab: Create Ticket
  // =========================================================================

  const renderCreateTicket = () => (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-5">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create External Ticket
        </h3>

        {connectedProviders.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No ticketing systems connected</p>
            <p className="text-xs mt-1">Connect a provider on the Connections tab first</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Provider</label>
                <select
                  value={createForm.provider}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      provider: e.target.value as TicketingProvider,
                    }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  {connectedProviders.map((p) => (
                    <option key={p} value={p}>
                      {providerMeta[p]?.label || p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Severity</label>
                <select
                  value={createForm.severity}
                  onChange={(e) => setCreateForm((f) => ({ ...f, severity: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Title</label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ticket title"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Detailed description..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Framework (optional)</label>
                <input
                  type="text"
                  value={createForm.framework}
                  onChange={(e) => setCreateForm((f) => ({ ...f, framework: e.target.value }))}
                  placeholder="SOC 2, ISO 27001, GDPR..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1.5">
                  Control ID (optional)
                </label>
                <input
                  type="text"
                  value={createForm.controlId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, controlId: e.target.value }))}
                  placeholder="CC6.1, A.8.1..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-1.5">
                  Source Type (optional)
                </label>
                <select
                  value={createForm.sourceType}
                  onChange={(e) => setCreateForm((f) => ({ ...f, sourceType: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">None</option>
                  <option value="risk">Risk</option>
                  <option value="incident">Incident</option>
                  <option value="finding">Finding</option>
                  <option value="exception">Exception</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Source ID (optional)</label>
                <input
                  type="text"
                  value={createForm.sourceId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, sourceId: e.target.value }))}
                  placeholder="Source record ID"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {createForm.provider === 'jira' && (
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Project Key</label>
                <input
                  type="text"
                  value={createForm.projectKey}
                  onChange={(e) => setCreateForm((f) => ({ ...f, projectKey: e.target.value }))}
                  placeholder="COMP"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCreateTicket}
                disabled={creating || !createForm.title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {creating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Create Ticket
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // =========================================================================
  // Tab: Field Mapping
  // =========================================================================

  const renderFieldMapping = () => {
    const activeProviders =
      connectedProviders.length > 0
        ? connectedProviders
        : (['jira', 'servicenow', 'azure_devops'] as TicketingProvider[]);

    return (
      <div className="space-y-6">
        {activeProviders.map((provider) => {
          const meta = providerMeta[provider];
          const mapping = fieldMappings[provider];
          const isEditing = editingMapping === provider;

          return (
            <div
              key={provider}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {getProviderIcon(provider)}
                  <h3 className={`font-semibold text-sm ${meta.color}`}>
                    {meta.label} Field Mapping
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {!mapping && (
                    <button
                      onClick={() => loadFieldMapping(provider)}
                      className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Load
                    </button>
                  )}
                  {mapping && !isEditing && (
                    <button
                      onClick={() => {
                        setEditingMapping(provider);
                        setMappingDraft(mapping.mappingRules || {});
                      }}
                      className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingMapping(null);
                          setMappingDraft(null);
                        }}
                        className="text-xs text-white/40 hover:text-white/70"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveMapping(provider)}
                        className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {mapping && (
                <div className="p-4">
                  {isEditing ? (
                    <textarea
                      value={JSON.stringify(mappingDraft, null, 2)}
                      onChange={(e) => {
                        try {
                          setMappingDraft(JSON.parse(e.target.value));
                        } catch {
                          // Allow invalid JSON while typing
                        }
                      }}
                      rows={12}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(mapping.mappingRules || {}).map(
                        ([sourceType, rules]: [string, any]) => (
                          <div
                            key={sourceType}
                            className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                          >
                            <div className="min-w-[80px]">
                              <span className="text-xs font-medium text-white/80 capitalize">
                                {sourceType}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20 mt-0.5" />
                            <div className="flex-1 text-xs text-white/60">
                              {Object.entries(rules || {}).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-white/40">{key}:</span>
                                  <span className="text-white/70">
                                    {Array.isArray(val)
                                      ? (val as string[]).join(', ')
                                      : String(val)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {!mapping && (
                <div className="p-6 text-center text-white/30 text-xs">
                  Click Load to view field mapping configuration
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // =========================================================================
  // Tab: Stats
  // =========================================================================

  const renderStats = () => (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-white/40 mt-1">Total Tickets</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">{connectedProviders.length}</div>
          <div className="text-xs text-white/40 mt-1">{t('integrations.connected')}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">
            {Object.values(syncStatuses).reduce((s, st) => s + st.totalSynced, 0)}
          </div>
          <div className="text-xs text-white/40 mt-1">Total Synced</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div
            className={`text-2xl font-bold ${
              Object.values(syncStatuses).reduce((s, st) => s + st.syncErrors, 0) > 0
                ? 'text-red-400'
                : 'text-white'
            }`}
          >
            {Object.values(syncStatuses).reduce((s, st) => s + st.syncErrors, 0)}
          </div>
          <div className="text-xs text-white/40 mt-1">Sync Errors</div>
        </div>
      </div>

      {/* By Provider */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Tickets by Provider</h3>
        <div className="space-y-3">
          {(Object.keys(providerMeta) as TicketingProvider[]).map((provider) => {
            const meta = providerMeta[provider];
            const count = stats.byProvider[provider] || 0;
            const maxCount = Math.max(...Object.values(stats.byProvider), 1);
            const pct = Math.round((count / maxCount) * 100);

            return (
              <div key={provider} className="flex items-center gap-3">
                {getProviderIcon(provider)}
                <div className="min-w-[100px] text-sm text-white/70">{meta.label}</div>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      provider === 'jira'
                        ? 'bg-blue-500'
                        : provider === 'servicenow'
                        ? 'bg-green-500'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-sm font-medium text-white/80 min-w-[32px] text-right">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Direction */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Tickets by Direction</h3>
        <div className="grid grid-cols-3 gap-4">
          {['push', 'pull', 'created'].map((dir) => (
            <div key={dir} className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-xl font-bold text-white">{stats.byDirection[dir] || 0}</div>
              <div className="text-xs text-white/40 capitalize mt-1">{dir}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Status per Provider */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">{t('integrations.syncStatus')}</h3>
        <div className="space-y-3">
          {(Object.keys(providerMeta) as TicketingProvider[]).map((provider) => {
            const syncStatus = syncStatuses[provider];
            const isConnected = connectedProviders.includes(provider);
            const meta = providerMeta[provider];

            if (!isConnected) {
              return (
                <div
                  key={provider}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg opacity-50"
                >
                  {getProviderIcon(provider)}
                  <span className="text-sm text-white/40">{meta.label}</span>
                  <span className="text-xs text-white/30 ml-auto">Not connected</span>
                </div>
              );
            }

            return (
              <div key={provider} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                {getProviderIcon(provider)}
                <span className="text-sm text-white/70">{meta.label}</span>
                <div className="ml-auto flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-white/40">
                    <Clock className="w-3 h-3" />
                    {syncStatus ? formatDate(syncStatus.lastSync) : 'Never'}
                  </span>
                  {syncStatus && syncStatus.syncErrors > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      {syncStatus.syncErrors} errors
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // Main Render
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Ticket className="w-7 h-7 text-blue-400" />
            {t('integrations.title')}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Connect and manage Jira, ServiceNow, and Azure DevOps ticketing systems
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-500/20 text-red-400 border border-red-500/30">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-green-500/20 text-green-400 border border-green-500/30">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'connections' && renderConnections()}
          {activeTab === 'tickets' && renderTickets()}
          {activeTab === 'create' && renderCreateTicket()}
          {activeTab === 'mapping' && renderFieldMapping()}
          {activeTab === 'stats' && renderStats()}
        </>
      )}
    </div>
  );
};

export default TicketingIntegrations;
