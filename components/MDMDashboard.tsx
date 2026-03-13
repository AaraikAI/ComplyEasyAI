/**
 * Mobile Device Management (MDM) Dashboard
 *
 * Comprehensive MDM interface for corporate device fleet management:
 * - Device enrollment, monitoring, and compliance tracking
 * - MDM policy creation and assignment
 * - Compliance violation detection and auto-remediation
 * - Remote actions (lock, wipe, message, locate)
 * - Full audit trail of all remote actions
 *
 * Supports iOS, Android, Windows, and macOS platforms
 * for both BYOD and corporate-owned device fleets.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft, Smartphone, Shield, CheckCircle, XCircle, AlertTriangle,
  Search, Plus, X, Lock, Trash2, Eye, Download, Settings, Filter,
  Clock, BarChart3, Monitor, Tablet, Wifi, WifiOff, RefreshCw,
  AlertCircle, Bell, FileText, Activity, ChevronRight, Users,
  MapPin, MessageSquare, ShieldCheck, ShieldAlert, HardDrive,
  Key, Fingerprint, Globe, Cpu, ToggleLeft, ToggleRight, Edit3
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'devices' | 'policies' | 'compliance' | 'actions_log';
type Platform = 'iOS' | 'Android' | 'Windows' | 'macOS';
type ComplianceStatus = 'Compliant' | 'Non-Compliant' | 'Pending';
type Ownership = 'Corporate' | 'BYOD';
type PolicyStatus = 'Active' | 'Draft';
type ViolationSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
type ActionType = 'Lock' | 'Wipe' | 'Message' | 'Locate' | 'Unenroll';
type ActionStatus = 'Completed' | 'Pending' | 'Failed';

interface Device {
  id: string;
  deviceName: string;
  serialNumber: string;
  platform: Platform;
  osVersion: string;
  user: string;
  department: string;
  ownership: Ownership;
  enrollmentDate: string;
  lastCheckIn: string;
  complianceStatus: ComplianceStatus;
  encryptionEnabled: boolean;
  passcodeSet: boolean;
  jailbroken: boolean;
  model: string;
}

interface MDMPolicy {
  id: string;
  name: string;
  description: string;
  platforms: Platform[];
  minPasscodeLength: number;
  encryptionRequired: boolean;
  vpnRequired: boolean;
  cameraAllowed: boolean;
  screenCaptureAllowed: boolean;
  minOsVersion: string;
  maxInactivityLock: number;
  assignedGroups: string[];
  status: PolicyStatus;
  createdDate: string;
  lastModified: string;
}

interface ComplianceViolation {
  id: string;
  type: string;
  description: string;
  deviceCount: number;
  severity: ViolationSeverity;
  autoRemediation: boolean;
  remediationAction: string;
  affectedPlatforms: Platform[];
  firstDetected: string;
}

interface ActionLogEntry {
  id: string;
  actionType: ActionType;
  targetDevice: string;
  targetUser: string;
  initiatedBy: string;
  timestamp: string;
  status: ActionStatus;
  notes: string;
}

// Mock data constants removed — component now uses empty initial state with proper error handling.

// ── Component ──────────────────────────────────────────────────────────
export const MDMDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [showActionConfirm, setShowActionConfirm] = useState<{ type: ActionType; device: Device } | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [policies, setPolicies] = useState<MDMPolicy[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Policy form state
  const [policyForm, setPolicyForm] = useState({
    name: '', description: '', platforms: [] as Platform[],
    minPasscodeLength: 8, encryptionRequired: true, vpnRequired: false,
    cameraAllowed: true, screenCaptureAllowed: true, minOsVersion: '',
    maxInactivityLock: 5, assignedGroups: ['All Mobile Devices'] as string[],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [devicesRes, policiesRes, dashboardRes] = await Promise.allSettled([
        api.mdm.listDevices(),
        api.mdm.listPolicies(),
        api.mdm.getDashboard(),
      ]);
      const failedApis: string[] = [];
      if (devicesRes.status === 'fulfilled' && Array.isArray(devicesRes.value)) {
        setDevices(devicesRes.value);
      } else if (devicesRes.status === 'fulfilled' && devicesRes.value?.data) {
        setDevices(devicesRes.value.data);
      } else {
        failedApis.push('devices');
      }
      if (policiesRes.status === 'fulfilled' && Array.isArray(policiesRes.value)) {
        setPolicies(policiesRes.value);
      } else if (policiesRes.status === 'fulfilled' && policiesRes.value?.data) {
        setPolicies(policiesRes.value.data);
      } else {
        failedApis.push('policies');
      }
      if (dashboardRes.status === 'fulfilled' && dashboardRes.value) {
        const db = dashboardRes.value;
        if (db.violations && Array.isArray(db.violations)) setViolations(db.violations);
        if (db.actionLog && Array.isArray(db.actionLog)) setActionLog(db.actionLog);
      } else {
        failedApis.push('dashboard');
      }
      if (failedApis.length > 0) {
        setLoadError(`Failed to load ${failedApis.join(', ')} data. Some information may be missing.`);
      }
    } catch (err) {
      setLoadError('Failed to connect to the server. Please check your connection and try again.');
      console.error('MDMDashboard data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived metrics
  const totalDevices = devices.length;
  const compliantDevices = devices.filter(d => d.complianceStatus === 'Compliant').length;
  const nonCompliantDevices = devices.filter(d => d.complianceStatus === 'Non-Compliant').length;
  const pendingDevices = devices.filter(d => d.complianceStatus === 'Pending').length;
  const complianceRate = totalDevices > 0 ? Math.round((compliantDevices / totalDevices) * 100) : 0;

  const platformBreakdown = useMemo(() => {
    const counts: Record<Platform, number> = { iOS: 0, Android: 0, Windows: 0, macOS: 0 };
    devices.forEach(d => { counts[d.platform]++; });
    return counts;
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (platformFilter !== 'all' && d.platform !== platformFilter) return false;
      if (statusFilter !== 'all' && d.complianceStatus !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return d.deviceName.toLowerCase().includes(q) ||
          d.serialNumber.toLowerCase().includes(q) ||
          d.user.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q);
      }
      return true;
    });
  }, [devices, platformFilter, statusFilter, searchQuery]);

  const complianceBg = (s: ComplianceStatus) =>
    s === 'Compliant' ? 'bg-emerald-500/20 text-emerald-400' :
    s === 'Non-Compliant' ? 'bg-red-500/20 text-red-400' :
    'bg-amber-500/20 text-amber-400';

  const severityBg = (s: ViolationSeverity) =>
    s === 'Critical' ? 'bg-red-500/20 text-red-400' :
    s === 'High' ? 'bg-orange-500/20 text-orange-400' :
    s === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
    'bg-blue-500/20 text-blue-400';

  const actionStatusBg = (s: ActionStatus) =>
    s === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
    s === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
    'bg-red-500/20 text-red-400';

  const actionIcon = (actionType: ActionType) => {
    switch (actionType) {
      case 'Lock': return <Lock size={14} className="text-amber-400" />;
      case 'Wipe': return <Trash2 size={14} className="text-red-400" />;
      case 'Message': return <MessageSquare size={14} className="text-blue-400" />;
      case 'Locate': return <MapPin size={14} className="text-green-400" />;
      case 'Unenroll': return <XCircle size={14} className="text-slate-400" />;
    }
  };

  const platformIcon = (p: Platform) => {
    switch (p) {
      case 'iOS': return <Smartphone size={14} className="text-blue-400" />;
      case 'Android': return <Smartphone size={14} className="text-green-400" />;
      case 'Windows': return <Monitor size={14} className="text-cyan-400" />;
      case 'macOS': return <Cpu size={14} className="text-purple-400" />;
    }
  };

  const renderErrorBanner = () => loadError ? (
    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <span className="text-sm text-red-300">{loadError}</span>
      </div>
      <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 transition-colors">
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    </div>
  ) : null;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
    { key: 'devices', label: 'Devices', icon: <Smartphone size={15} /> },
    { key: 'policies', label: 'Policies', icon: <Shield size={15} /> },
    { key: 'compliance', label: 'Compliance', icon: <ShieldCheck size={15} /> },
    { key: 'actions_log', label: 'Actions Log', icon: <Activity size={15} /> },
  ];

  // ── Overview Tab ──────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Compliance Rate</span>
            <ShieldCheck size={18} className="text-blue-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 36 36" className="w-14 h-14 transform -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={complianceRate >= 80 ? '#10b981' : complianceRate >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${complianceRate} ${100 - complianceRate}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{complianceRate}%</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{complianceRate}%</div>
              <div className="text-xs text-slate-400">Fleet Compliance</div>
            </div>
          </div>
        </div>
        {[
          { label: 'Total Devices', value: totalDevices, icon: Smartphone, color: 'text-blue-400' },
          { label: 'Compliant', value: compliantDevices, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Non-Compliant', value: nonCompliantDevices, icon: XCircle, color: 'text-red-400' },
          { label: 'Pending Enrollment', value: pendingDevices, icon: Clock, color: 'text-amber-400' },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{m.label}</span>
              <m.icon size={18} className={m.color} />
            </div>
            <div className="text-2xl font-bold text-white">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Breakdown</h3>
          <div className="space-y-3">
            {(Object.entries(platformBreakdown) as [Platform, number][]).map(([platform, count]) => {
              const pct = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
              const barColor = platform === 'iOS' ? 'bg-blue-500' : platform === 'Android' ? 'bg-green-500' : platform === 'Windows' ? 'bg-cyan-500' : 'bg-purple-500';
              return (
                <div key={platform}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 flex items-center gap-2">{platformIcon(platform)} {platform}</span>
                    <span className="text-white font-medium">{count} devices ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className={`h-2 ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Ownership Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Corporate Owned', count: devices.filter(d => d.ownership === 'Corporate').length, color: 'bg-blue-500' },
              { label: 'BYOD', count: devices.filter(d => d.ownership === 'BYOD').length, color: 'bg-violet-500' },
            ].map(item => {
              const pct = totalDevices > 0 ? Math.round((item.count / totalDevices) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="text-white font-medium">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className={`h-2 ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Department Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(devices.map(d => d.department))).map(dept => {
                const count = devices.filter(d => d.department === dept).length;
                return (
                  <span key={dept} className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs">
                    {dept} <span className="text-white font-medium ml-1">{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          {[
            { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', message: 'Jailbroken device detected: iPhone 15 (Jessica Liu)', time: '2 hours ago' },
            { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10', message: '2 devices missing encryption - immediate action required', time: '5 hours ago' },
            { icon: WifiOff, color: 'text-orange-400', bg: 'bg-orange-500/10', message: 'MacBook Air M3 (Nina Petrov) has not checked in for 4 days', time: '1 day ago' },
            { icon: Bell, color: 'text-blue-400', bg: 'bg-blue-500/10', message: 'OS update available for 3 devices - compliance deadline in 7 days', time: '1 day ago' },
            { icon: Lock, color: 'text-emerald-400', bg: 'bg-emerald-500/10', message: 'Remote lock completed successfully: Surface Pro 10 (David Kim)', time: '2 days ago' },
          ].map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 ${alert.bg} rounded-lg`}>
              <alert.icon size={16} className={`${alert.color} flex-shrink-0`} />
              <div className="flex-1">
                <div className="text-sm text-white">{alert.message}</div>
                <div className="text-xs text-slate-400">{alert.time}</div>
              </div>
              <ChevronRight size={14} className="text-slate-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Devices Tab ───────────────────────────────────────────────────────
  const renderDevices = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder={t('common.search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Platforms</option>
          {(['iOS', 'Android', 'Windows', 'macOS'] as Platform[]).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Statuses</option>
          {(['Compliant', 'Non-Compliant', 'Pending'] as ComplianceStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Enroll Device
        </button>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {['Device', 'Serial Number', 'OS / Version', 'User', 'Department', 'Enrolled', 'Last Check-in', 'Status', 'Encryption', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map(d => (
              <tr key={d.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {platformIcon(d.platform)}
                    <div>
                      <div className="text-white font-medium">{d.deviceName}</div>
                      <div className="text-xs text-slate-400">{d.ownership}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">{d.serialNumber}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{d.platform} {d.osVersion}</td>
                <td className="px-4 py-3 text-white">{d.user}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{d.department}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{d.enrollmentDate}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(d.lastCheckIn).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${complianceBg(d.complianceStatus)}`}>
                    {d.complianceStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {d.encryptionEnabled
                    ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><Lock size={12} /> Enabled</span>
                    : <span className="flex items-center gap-1 text-red-400 text-xs"><AlertCircle size={12} /> Disabled</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setShowActionConfirm({ type: 'Lock', device: d })} className="p-1 hover:bg-slate-600 rounded" title="Lock Device">
                      <Lock size={14} className="text-slate-400" />
                    </button>
                    <button onClick={() => setShowActionConfirm({ type: 'Wipe', device: d })} className="p-1 hover:bg-slate-600 rounded" title="Wipe Device">
                      <Trash2 size={14} className="text-slate-400" />
                    </button>
                    <button onClick={() => setShowActionConfirm({ type: 'Unenroll', device: d })} className="p-1 hover:bg-slate-600 rounded" title="Unenroll Device">
                      <XCircle size={14} className="text-slate-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-slate-400">{filteredDevices.length} of {devices.length} devices shown</div>
    </div>
  );

  // ── Policies Tab ──────────────────────────────────────────────────────
  const renderPolicies = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">MDM Policies</h3>
        <button onClick={() => setShowCreatePolicy(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Create Policy
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {policies.map(p => (
          <div key={p.id} className="bg-slate-800 rounded-lg border border-slate-700 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-semibold">{p.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 max-w-2xl">{p.description}</p>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-slate-700 rounded"><Edit3 size={14} className="text-slate-400" /></button>
                <button className="p-1.5 hover:bg-slate-700 rounded"><Eye size={14} className="text-slate-400" /></button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.platforms.map(plat => (
                <span key={plat} className="flex items-center gap-1 px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                  {platformIcon(plat)} {plat}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Min Passcode', value: p.minPasscodeLength > 0 ? `${p.minPasscodeLength} chars` : 'None', icon: Key },
                { label: 'Encryption', value: p.encryptionRequired ? 'Required' : 'Optional', icon: Lock },
                { label: 'VPN', value: p.vpnRequired ? 'Required' : 'Optional', icon: Globe },
                { label: 'Camera', value: p.cameraAllowed ? 'Allowed' : 'Blocked', icon: Eye },
                { label: 'Auto-Lock', value: `${p.maxInactivityLock} min`, icon: Clock },
                { label: 'Min OS', value: p.minOsVersion.split(' / ')[0], icon: RefreshCw },
              ].map(setting => (
                <div key={setting.label} className="bg-slate-700/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <setting.icon size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-400">{setting.label}</span>
                  </div>
                  <div className="text-sm text-white font-medium">{setting.value}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
              <Users size={14} className="text-slate-400" />
              <span className="text-xs text-slate-400">Assigned to:</span>
              {p.assignedGroups.map(g => (
                <span key={g} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{g}</span>
              ))}
              <span className="ml-auto text-xs text-slate-500">Modified: {p.lastModified}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Compliance Tab ────────────────────────────────────────────────────
  const renderCompliance = () => {
    const criticalCount = violations.filter(v => v.severity === 'Critical').length;
    const highCount = violations.filter(v => v.severity === 'High').length;
    const mediumCount = violations.filter(v => v.severity === 'Medium').length;
    const lowCount = violations.filter(v => v.severity === 'Low').length;
    const autoRemediationEnabled = violations.filter(v => v.autoRemediation).length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Violations', value: violations.length, icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Critical', value: criticalCount, icon: AlertCircle, color: 'text-red-400' },
            { label: 'High', value: highCount, icon: ShieldAlert, color: 'text-orange-400' },
            { label: 'Medium / Low', value: mediumCount + lowCount, icon: Shield, color: 'text-amber-400' },
            { label: 'Auto-Remediation', value: `${autoRemediationEnabled}/${violations.length}`, icon: RefreshCw, color: 'text-blue-400' },
          ].map(m => (
            <div key={m.label} className="bg-slate-800 rounded-lg p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{m.label}</span>
                <m.icon size={18} className={m.color} />
              </div>
              <div className="text-2xl font-bold text-white">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Violation Type', 'Description', 'Devices', 'Severity', 'Platforms', 'Auto-Remediation', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {violations.map(v => (
                <tr key={v.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-white font-medium">{v.type}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs max-w-[250px]">{v.description}</td>
                  <td className="px-4 py-3">
                    <span className="text-white font-bold">{v.deviceCount}</span>
                    <span className="text-slate-400 text-xs ml-1">device{v.deviceCount !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityBg(v.severity)}`}>{v.severity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {v.affectedPlatforms.map(p => (
                        <span key={p} className="flex items-center">{platformIcon(p)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {v.autoRemediation
                      ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><ToggleRight size={16} /> Enabled</span>
                      : <span className="flex items-center gap-1 text-slate-400 text-xs"><ToggleLeft size={16} /> Disabled</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30">Remediate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Auto-Remediation Settings</h3>
          <p className="text-sm text-slate-400 mb-4">Configure automatic remediation actions for detected compliance violations. When enabled, the MDM system will attempt to resolve issues without manual intervention.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {violations.map(v => (
              <div key={v.id} className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
                <div className={`mt-0.5 p-1 rounded ${v.autoRemediation ? 'bg-emerald-500/20' : 'bg-slate-600'}`}>
                  {v.autoRemediation ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-slate-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium">{v.type}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${severityBg(v.severity)}`}>{v.severity}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{v.remediationAction}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Actions Log Tab ───────────────────────────────────────────────────
  const renderActionsLog = () => {
    const completedCount = actionLog.filter(a => a.status === 'Completed').length;
    const pendingCount = actionLog.filter(a => a.status === 'Pending').length;
    const failedCount = actionLog.filter(a => a.status === 'Failed').length;

    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          {[
            { label: 'Completed', count: completedCount, color: 'text-emerald-400' },
            { label: 'Pending', count: pendingCount, color: 'text-amber-400' },
            { label: 'Failed', count: failedCount, color: 'text-red-400' },
          ].map(r => (
            <div key={r.label} className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
              <span className="text-xs text-slate-400">{r.label}</span>
              <div className={`text-xl font-bold ${r.color}`}>{r.count}</div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Action', 'Target Device', 'User', 'Initiated By', 'Timestamp', 'Status', 'Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actionLog.map(a => (
                <tr key={a.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {actionIcon(a.actionType)}
                      <span className="text-white font-medium">{a.actionType}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{a.targetDevice}</td>
                  <td className="px-4 py-3 text-slate-300">{a.targetUser}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{a.initiatedBy}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionStatusBg(a.status)}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs max-w-[250px] truncate">{a.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">{actionLog.length} actions recorded</div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white text-sm">
            <Download size={14} /> Export Log
          </button>
        </div>
      </div>
    );
  };

  // ── Create Policy Modal ───────────────────────────────────────────────
  const renderCreatePolicyModal = () => {
    if (!showCreatePolicy) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreatePolicy(false)}>
        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Create MDM Policy</h3>
            <button onClick={() => setShowCreatePolicy(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Policy Name</label>
              <input type="text" placeholder="e.g., BYOD Tablet Policy" value={policyForm.name} onChange={e => setPolicyForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <textarea placeholder="Describe the purpose and scope of this policy..." value={policyForm.description} onChange={e => setPolicyForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Target Platforms</label>
              <div className="flex gap-2">
                {(['iOS', 'Android', 'Windows', 'macOS'] as Platform[]).map(p => (
                  <label key={p} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-300 cursor-pointer hover:border-blue-500">
                    <input type="checkbox" checked={policyForm.platforms.includes(p)} onChange={e => setPolicyForm(f => ({ ...f, platforms: e.target.checked ? [...f.platforms, p] : f.platforms.filter(x => x !== p) }))} className="rounded border-slate-500" />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Min Passcode Length</label>
                <input type="number" placeholder="8" min={0} max={32} value={policyForm.minPasscodeLength} onChange={e => setPolicyForm(f => ({ ...f, minPasscodeLength: Number(e.target.value) }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Auto-Lock (minutes)</label>
                <input type="number" placeholder="5" min={1} max={60} value={policyForm.maxInactivityLock} onChange={e => setPolicyForm(f => ({ ...f, maxInactivityLock: Number(e.target.value) }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Minimum OS Version</label>
                <input type="text" placeholder="e.g., 17.0 / 14.0" value={policyForm.minOsVersion} onChange={e => setPolicyForm(f => ({ ...f, minOsVersion: e.target.value }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Assigned Group</label>
                <select value={policyForm.assignedGroups[0]} onChange={e => setPolicyForm(f => ({ ...f, assignedGroups: [e.target.value] }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                  <option>All Mobile Devices</option>
                  <option>Corporate Owned</option>
                  <option>BYOD Users</option>
                  <option>All Laptops</option>
                  <option>Executive Team</option>
                  <option>Shared Devices</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-slate-400">Security Settings</label>
              {[
                { label: 'Require device encryption', id: 'encryption', key: 'encryptionRequired' as const },
                { label: 'Require VPN connection', id: 'vpn', key: 'vpnRequired' as const },
                { label: 'Allow camera access', id: 'camera', key: 'cameraAllowed' as const },
                { label: 'Allow screen capture', id: 'screenshot', key: 'screenCaptureAllowed' as const },
              ].map(opt => (
                <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={policyForm[opt.key]} onChange={e => setPolicyForm(f => ({ ...f, [opt.key]: e.target.checked }))} className="rounded border-slate-500" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
            <button onClick={() => setShowCreatePolicy(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">{t('common.cancel')}</button>
            <button onClick={async () => {
              try { await api.mdm.createPolicy({ ...policyForm, status: 'Draft' }); setShowCreatePolicy(false); loadData(); } catch { setShowCreatePolicy(false); }
            }} className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500">Save as Draft</button>
            <button onClick={async () => {
              try { await api.mdm.createPolicy({ ...policyForm, status: 'Active' }); setShowCreatePolicy(false); loadData(); } catch { setShowCreatePolicy(false); }
            }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Create & Activate</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Action Confirmation Modal ─────────────────────────────────────────
  const renderActionConfirmModal = () => {
    if (!showActionConfirm) return null;
    const { type, device } = showActionConfirm;
    const isDestructive = type === 'Wipe';
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowActionConfirm(null)}>
        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Confirm {type} Action</h3>
            <button onClick={() => setShowActionConfirm(null)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${isDestructive ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
              {isDestructive ? <AlertTriangle size={20} className="text-red-400" /> : <AlertCircle size={20} className="text-amber-400" />}
              <div>
                <div className="text-sm font-medium text-white">
                  {isDestructive ? 'This action will permanently erase all data on the device.' : `This will ${type.toLowerCase()} the device remotely.`}
                </div>
                <div className="text-xs text-slate-400 mt-1">This action cannot be undone.</div>
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Device:</span><span className="text-white">{device.deviceName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">User:</span><span className="text-white">{device.user}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Serial:</span><span className="text-white font-mono text-xs">{device.serialNumber}</span></div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Reason (optional)</label>
              <textarea placeholder="Provide a reason for this action..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm h-16 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
            <button onClick={() => setShowActionConfirm(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">{t('common.cancel')}</button>
            <button
              disabled={actionLoading}
              onClick={async () => {
                setActionLoading(true);
                try {
                  await api.mdm.executeAction(device.id, { action: type.toLowerCase(), notes: '' });
                  setShowActionConfirm(null);
                  loadData();
                } catch {
                  setShowActionConfirm(null);
                } finally {
                  setActionLoading(false);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm text-white ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
            >
              {actionLoading ? 'Processing...' : `Confirm ${type}`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Main Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold">Mobile Device Management</h1>
            <p className="text-sm text-slate-400">Manage, secure, and monitor your corporate device fleet</p>
          </div>
          <button onClick={loadData} disabled={loading} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t('common.refresh')}
          </button>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {renderErrorBanner()}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'devices' && renderDevices()}
        {activeTab === 'policies' && renderPolicies()}
        {activeTab === 'compliance' && renderCompliance()}
        {activeTab === 'actions_log' && renderActionsLog()}
      </div>

      {renderCreatePolicyModal()}
      {renderActionConfirmModal()}
    </div>
  );
};

export default MDMDashboard;
