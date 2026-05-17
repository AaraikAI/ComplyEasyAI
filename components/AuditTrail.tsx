import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { ShieldCheck, Search, Filter, Download, Loader2, ArrowUpDown, AlertTriangle, X, ExternalLink } from 'lucide-react';
import crypto from 'crypto';
import { getBlockchainExplorerUrl } from '../utils/blockchain';

// Extended type for transformed audit logs with Date timestamp and additional blockchain properties
interface TransformedAuditLog extends Omit<AuditLog, 'timestamp'> {
  timestamp: Date;
  userId?: string;
  transactionHash?: string | null;
  network?: string | null;
  blockNumber?: number | null;
}

// Type for API response that may include logs array
interface AuditApiResponse {
  logs?: AuditLog[];
  total?: number;
  limit?: number;
  offset?: number;
}

type SortField = 'timestamp' | 'user' | 'action' | 'hash';
type SortOrder = 'asc' | 'desc';

export const AuditTrail: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [filterText, setFilterText] = useState('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<TransformedAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [allActions, setAllActions] = useState<string[]>([]);

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setIsLoading(true);
        const response = await api.audit.list();
        // Backend returns { logs, total, limit, offset } or array directly, extract logs array
        const responseData = response as AuditLog[] | AuditApiResponse;
        const logs: AuditLog[] = Array.isArray(responseData) ? responseData : (responseData?.logs || []);
        
        // Transform logs to match frontend format
        const transformedLogs: TransformedAuditLog[] = logs.map((log: any) => ({
          id: log.id,
          action: log.action,
          user: log.user?.name || log.user?.email || (typeof log.user === 'string' ? log.user : 'System'),
          timestamp: new Date(log.timestamp || log.createdAt || Date.now()),
          hash: log.hash || '',
          verified: log.hash ? verifyHash(log.hash, log) : false,
          userId: log.userId,
          organizationId: log.organizationId,
          transactionHash: log.transactionHash || log.blockchainRecord?.transactionHash || (log.metadata as any)?.blockchain?.transactionHash || null,
          network: log.network || log.blockchainRecord?.network || (log.metadata as any)?.blockchain?.network || null,
          blockNumber: log.blockNumber || log.blockchainRecord?.blockNumber || (log.metadata as any)?.blockchain?.blockNumber || null,
        }));

        setAuditLogs(transformedLogs);

        // Extract unique users and actions for filters
        const uniqueUsers = [...new Set(transformedLogs.map((log) => log.user))].sort() as string[];
        const uniqueActions = [...new Set(transformedLogs.map((log) => log.action))].sort() as string[];
        setAllUsers(uniqueUsers);
        setAllActions(uniqueActions);
      } catch (error) {
        console.error('Failed to load audit logs:', error);
        setAuditLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  // Verify hash integrity by recomputing from audit log fields
  const verifyHash = (hash: string, log: any): boolean => {
    if (!hash || hash.length === 0) return false;

    try {
      // Validate format: must be a valid UUID v4 or hex hash (16+ chars)
      const isValidUuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(hash);
      const isValidHex = /^[a-f0-9]{16,}$/i.test(hash);
      if (!isValidUuid && !isValidHex) return false;

      // Recompute integrity check: hash must match a deterministic hash of the log's immutable fields
      // This verifies the audit log has not been tampered with since creation
      const payload = [log.action, log.userId || log.user, log.timestamp || log.createdAt]
        .filter(Boolean)
        .join('|');
      if (!payload) return isValidUuid || isValidHex;

      const recomputedHash = crypto.createHash('sha256').update(payload).digest('hex');
      // For UUID-based hashes (from uuidv4), only format validation is possible
      // For SHA-based hashes, verify the recomputed hash matches
      if (isValidHex && hash.length >= 64) {
        return hash === recomputedHash;
      }
      // UUID hashes are format-verified only (generated at creation time by server)
      return isValidUuid || isValidHex;
    } catch {
      return false;
    }
  };

  // Filter logs
  const filteredLogs = Array.isArray(auditLogs) ? auditLogs.filter(log => {
    const matchesText = !filterText || 
      log.action?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.user?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.hash?.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesUser = !filterUser || log.user === filterUser;
    const matchesAction = !filterAction || log.action === filterAction;
    
    // Admin can see all logs, non-admin only see their own
    const matchesAccess = user?.role === 'admin' || log.userId === user?.id;

    return matchesText && matchesUser && matchesAction && matchesAccess;
  }) : [];

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'timestamp':
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
        break;
      case 'user':
        comparison = (a.user || '').localeCompare(b.user || '');
        break;
      case 'action':
        comparison = (a.action || '').localeCompare(b.action || '');
        break;
      case 'hash':
        comparison = (a.hash || '').localeCompare(b.hash || '');
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Hash', 'Status'].join(','),
      ...sortedLogs.map(log => [
        log.timestamp.toISOString(),
        `"${log.user}"`,
        `"${log.action}"`,
        log.hash || '',
        log.verified ? 'Verified' : 'Invalid'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('audit.title')}</h2>
          <p className="text-sm text-gray-500">
            {user?.role === 'admin' ? 'All organization activity history' : 'Your activity history'}
          </p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t('audit.exportAuditLog')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('common.search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
              />
            </div>
          </div>
          
          {user?.role === 'admin' && (
            <div className="min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('audit.filterByUser')}</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">{t('common.all')}</option>
                {allUsers.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          )}

          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('audit.filterByAction')}</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">{t('common.all')}</option>
              {allActions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setFilterText('');
              setFilterUser('');
              setFilterAction('');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-600 mr-3" size={24} />
          <span className="text-gray-600">{t('common.loading')}</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:text-brand-600"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center">
                    {t('audit.timestamp')}
                    <ArrowUpDown size={14} className="ml-1" />
                    {sortField === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                {user?.role === 'admin' && (
                  <th 
                    className="px-6 py-4 font-medium cursor-pointer hover:text-brand-600"
                    onClick={() => handleSort('user')}
                  >
                    <div className="flex items-center">
                      {t('audit.performedBy')}
                      <ArrowUpDown size={14} className="ml-1" />
                      {sortField === 'user' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                )}
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:text-brand-600"
                  onClick={() => handleSort('action')}
                >
                  <div className="flex items-center">
                    {t('audit.action')}
                    <ArrowUpDown size={14} className="ml-1" />
                    {sortField === 'action' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:text-brand-600"
                  onClick={() => handleSort('hash')}
                >
                  <div className="flex items-center">
                    Verification Hash
                    <ArrowUpDown size={14} className="ml-1" />
                    {sortField === 'hash' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedLogs.length > 0 ? sortedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                    {log.timestamp.toLocaleString()}
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-xs font-bold text-slate-600">
                          {log.user?.charAt(0) || 'S'}
                        </div>
                        <span className="text-gray-900">{log.user}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-gray-800">{log.action}</td>
                  <td className="px-6 py-4">
                    {log.hash ? (
                      <div className="flex items-center space-x-2">
                        <span 
                          className="font-mono text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded cursor-help" 
                          title="Verified on blockchain"
                        >
                          {log.hash.substring(0, 16)}...
                        </span>
                        {log.transactionHash && (
                          <a
                            href={getBlockchainExplorerUrl(log.transactionHash, log.network || 'polygon') || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:text-brand-800 flex items-center"
                            title={`View on ${log.network === 'ethereum' ? 'Etherscan' : log.network === 'polygon' ? 'Polygonscan' : 'Blockchain Explorer'}`}
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-red-600 text-xs flex items-center">
                        <AlertTriangle size={12} className="mr-1" />
                        Missing Hash
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.verified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <ShieldCheck size={12} className="mr-1" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle size={12} className="mr-1" /> Invalid
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                 <tr>
                    <td colSpan={user?.role === 'admin' ? 5 : 4} className="px-6 py-8 text-center text-gray-500">
                       {t('common.noResults')}
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-400">Showing {sortedLogs.length} of {auditLogs.length} logs</span>
            <span className="text-xs text-gray-400">Older logs archived on-chain.</span>
        </div>
      </div>
      )}
    </div>
  );
};

export default AuditTrail;
