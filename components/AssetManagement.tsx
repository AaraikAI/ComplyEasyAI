/**
 * Asset Management Component
 *
 * IT asset register with:
 * - Asset types: Hardware, Software, Data, Network, Cloud Service
 * - Data classification: Public, Internal, Confidential, Restricted
 * - Lifecycle tracking: Procurement -> Active -> Maintenance -> Decommissioned -> Disposed
 * - Search/filter capabilities
 * - Asset dependency mapping
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Shield,
  Plus,
  X,
  Search,
  Filter,
  Edit,
  Trash2,
  Monitor,
  HardDrive,
  Database,
  Cloud,
  Network,
  Eye,
  ChevronRight,
  Tag,
  Link2,
  Calendar,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Server,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type AssetType = 'Hardware' | 'Software' | 'Data' | 'Network' | 'CloudService';
type DataClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';
type LifecycleStatus = 'Procurement' | 'Active' | 'Maintenance' | 'Decommissioned' | 'Disposed';
type TabId = 'registry' | 'dependencies' | 'classification';

interface AssetDependency {
  assetId: string;
  assetName: string;
  relationship: 'depends_on' | 'depended_by' | 'integrates_with';
}

interface Asset {
  id: string;
  name: string;
  description: string;
  type: AssetType;
  classification: DataClassification;
  lifecycle: LifecycleStatus;
  owner: string;
  department: string;
  location: string;
  vendor: string;
  purchaseDate: string;
  warrantyExpiry: string | null;
  lastAuditDate: string;
  riskScore: number;
  tags: string[];
  dependencies: AssetDependency[];
  serialNumber: string;
  cost: number;
}

interface AssetForm {
  name: string;
  description: string;
  type: AssetType;
  classification: DataClassification;
  owner: string;
  department: string;
  location: string;
  vendor: string;
  serialNumber: string;
  cost: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const assetTypeConfig: Record<AssetType, { icon: React.ReactNode; color: string }> = {
  Hardware: { icon: <Monitor className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400' },
  Software: { icon: <Package className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400' },
  Data: { icon: <Database className="w-4 h-4" />, color: 'bg-green-500/20 text-green-400' },
  Network: { icon: <Network className="w-4 h-4" />, color: 'bg-orange-500/20 text-orange-400' },
  CloudService: { icon: <Cloud className="w-4 h-4" />, color: 'bg-cyan-500/20 text-cyan-400' },
};

const classificationConfig: Record<DataClassification, { color: string; priority: number }> = {
  Public: { color: 'bg-green-500/20 text-green-400 border-green-500/30', priority: 1 },
  Internal: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', priority: 2 },
  Confidential: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', priority: 3 },
  Restricted: { color: 'bg-red-500/20 text-red-400 border-red-500/30', priority: 4 },
};

const lifecycleConfig: Record<LifecycleStatus, string> = {
  Procurement: 'bg-slate-500/20 text-slate-400',
  Active: 'bg-green-500/20 text-green-400',
  Maintenance: 'bg-yellow-500/20 text-yellow-400',
  Decommissioned: 'bg-orange-500/20 text-orange-400',
  Disposed: 'bg-red-500/20 text-red-400',
};

const defaultForm: AssetForm = {
  name: '', description: '', type: 'Hardware', classification: 'Internal',
  owner: '', department: '', location: '', vendor: '', serialNumber: '', cost: '',
};

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'registry', label: 'Asset Registry', icon: <Server className="w-4 h-4" /> },
  { id: 'dependencies', label: 'Dependencies', icon: <Link2 className="w-4 h-4" /> },
  { id: 'classification', label: 'Classification', icon: <Tag className="w-4 h-4" /> },
];

// ── Mock Data ───────────────────────────────────────────────────────────────

const initialAssets: Asset[] = [
  {
    id: 'AST-001', name: 'Production Database Server', description: 'Primary PostgreSQL database cluster for customer data',
    type: 'Hardware', classification: 'Restricted', lifecycle: 'Active', owner: 'Alex Kumar',
    department: 'Engineering', location: 'AWS us-east-1', vendor: 'AWS', purchaseDate: '2024-01-15',
    warrantyExpiry: '2027-01-15', lastAuditDate: '2025-11-01', riskScore: 85, tags: ['production', 'database', 'critical'],
    serialNumber: 'DB-PROD-001', cost: 45000,
    dependencies: [
      { assetId: 'AST-003', assetName: 'Application Backend', relationship: 'depended_by' },
      { assetId: 'AST-005', assetName: 'AWS VPC Network', relationship: 'depends_on' },
    ],
  },
  {
    id: 'AST-002', name: 'CrowdStrike Falcon', description: 'Endpoint detection and response platform',
    type: 'Software', classification: 'Confidential', lifecycle: 'Active', owner: 'Sarah Chen',
    department: 'Security', location: 'Cloud', vendor: 'CrowdStrike', purchaseDate: '2024-06-01',
    warrantyExpiry: null, lastAuditDate: '2025-10-15', riskScore: 30, tags: ['security', 'endpoint', 'edr'],
    serialNumber: 'CS-LIC-2024', cost: 28000,
    dependencies: [
      { assetId: 'AST-006', assetName: 'Employee Workstations', relationship: 'integrates_with' },
    ],
  },
  {
    id: 'AST-003', name: 'Application Backend', description: 'Node.js application server running core business logic',
    type: 'Software', classification: 'Confidential', lifecycle: 'Active', owner: 'Alex Kumar',
    department: 'Engineering', location: 'AWS ECS', vendor: 'Internal', purchaseDate: '2024-01-01',
    warrantyExpiry: null, lastAuditDate: '2025-12-01', riskScore: 70, tags: ['production', 'api', 'backend'],
    serialNumber: 'APP-BE-001', cost: 0,
    dependencies: [
      { assetId: 'AST-001', assetName: 'Production Database Server', relationship: 'depends_on' },
      { assetId: 'AST-004', assetName: 'Customer Data Lake', relationship: 'depends_on' },
    ],
  },
  {
    id: 'AST-004', name: 'Customer Data Lake', description: 'S3-based data lake containing processed customer analytics',
    type: 'Data', classification: 'Restricted', lifecycle: 'Active', owner: 'Maria Garcia',
    department: 'Data Science', location: 'AWS S3', vendor: 'AWS', purchaseDate: '2024-03-01',
    warrantyExpiry: null, lastAuditDate: '2025-09-15', riskScore: 90, tags: ['data', 'analytics', 'pii'],
    serialNumber: 'DL-CUST-001', cost: 12000,
    dependencies: [
      { assetId: 'AST-001', assetName: 'Production Database Server', relationship: 'depends_on' },
    ],
  },
  {
    id: 'AST-005', name: 'AWS VPC Network', description: 'Primary VPC with public and private subnets',
    type: 'Network', classification: 'Confidential', lifecycle: 'Active', owner: 'DevOps Team',
    department: 'Infrastructure', location: 'AWS us-east-1', vendor: 'AWS', purchaseDate: '2024-01-10',
    warrantyExpiry: null, lastAuditDate: '2025-11-20', riskScore: 60, tags: ['network', 'vpc', 'infrastructure'],
    serialNumber: 'VPC-PROD-001', cost: 8000,
    dependencies: [],
  },
  {
    id: 'AST-006', name: 'Employee Workstations', description: 'MacBook Pro fleet for engineering and business teams',
    type: 'Hardware', classification: 'Internal', lifecycle: 'Active', owner: 'IT Support',
    department: 'IT', location: 'Office / Remote', vendor: 'Apple', purchaseDate: '2024-07-01',
    warrantyExpiry: '2027-07-01', lastAuditDate: '2025-12-10', riskScore: 45, tags: ['endpoint', 'laptop', 'employee'],
    serialNumber: 'WS-FLEET-2024', cost: 156000,
    dependencies: [
      { assetId: 'AST-002', assetName: 'CrowdStrike Falcon', relationship: 'integrates_with' },
    ],
  },
  {
    id: 'AST-007', name: 'Okta SSO', description: 'Identity and access management platform',
    type: 'CloudService', classification: 'Confidential', lifecycle: 'Active', owner: 'Sarah Chen',
    department: 'Security', location: 'Cloud (SaaS)', vendor: 'Okta', purchaseDate: '2024-02-01',
    warrantyExpiry: null, lastAuditDate: '2025-10-01', riskScore: 55, tags: ['identity', 'sso', 'iam'],
    serialNumber: 'OKTA-ENT-001', cost: 36000,
    dependencies: [
      { assetId: 'AST-003', assetName: 'Application Backend', relationship: 'integrates_with' },
    ],
  },
  {
    id: 'AST-008', name: 'Legacy CRM System', description: 'Deprecated CRM being migrated to new platform',
    type: 'Software', classification: 'Internal', lifecycle: 'Decommissioned', owner: 'Sales Ops',
    department: 'Sales', location: 'On-premise', vendor: 'Custom', purchaseDate: '2020-05-01',
    warrantyExpiry: '2024-05-01', lastAuditDate: '2025-06-01', riskScore: 75, tags: ['legacy', 'crm', 'migration'],
    serialNumber: 'CRM-LEG-001', cost: 0,
    dependencies: [],
  },
];

// ── Component ───────────────────────────────────────────────────────────────

const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [activeTab, setActiveTab] = useState<TabId>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [classFilter, setClassFilter] = useState<DataClassification | 'all'>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleStatus | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState<AssetForm>(defaultForm);
  const [showFilters, setShowFilters] = useState(false);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = searchQuery === '' ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === 'all' || a.type === typeFilter;
      const matchesClass = classFilter === 'all' || a.classification === classFilter;
      const matchesLifecycle = lifecycleFilter === 'all' || a.lifecycle === lifecycleFilter;
      return matchesSearch && matchesType && matchesClass && matchesLifecycle;
    });
  }, [assets, searchQuery, typeFilter, classFilter, lifecycleFilter]);

  const stats = useMemo(() => ({
    total: assets.length,
    active: assets.filter(a => a.lifecycle === 'Active').length,
    highRisk: assets.filter(a => a.riskScore >= 70).length,
    restricted: assets.filter(a => a.classification === 'Restricted').length,
  }), [assets]);

  const classificationSummary = useMemo(() => {
    return (['Public', 'Internal', 'Confidential', 'Restricted'] as DataClassification[]).map(cls => ({
      classification: cls,
      count: assets.filter(a => a.classification === cls).length,
      totalCost: assets.filter(a => a.classification === cls).reduce((sum, a) => sum + a.cost, 0),
    }));
  }, [assets]);

  const handleCreate = useCallback(() => {
    const newAsset: Asset = {
      id: `AST-${String(assets.length + 1).padStart(3, '0')}`,
      name: form.name, description: form.description, type: form.type,
      classification: form.classification, lifecycle: 'Procurement' as LifecycleStatus,
      owner: form.owner, department: form.department, location: form.location,
      vendor: form.vendor, purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: null, lastAuditDate: new Date().toISOString().split('T')[0],
      riskScore: form.classification === 'Restricted' ? 80 : form.classification === 'Confidential' ? 60 : 30,
      tags: [], dependencies: [], serialNumber: form.serialNumber,
      cost: parseFloat(form.cost) || 0,
    };
    setAssets(prev => [newAsset, ...prev]);
    setShowCreateForm(false);
    setForm(defaultForm);
  }, [form, assets.length]);

  const deleteAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selectedAsset?.id === id) setSelectedAsset(null);
  }, [selectedAsset]);

  const cycleLifecycle = useCallback((id: string) => {
    const order: LifecycleStatus[] = ['Procurement', 'Active', 'Maintenance', 'Decommissioned', 'Disposed'];
    setAssets(prev => prev.map(a => {
      if (a.id !== id) return a;
      const idx = order.indexOf(a.lifecycle);
      if (idx >= order.length - 1) return a;
      return { ...a, lifecycle: order[idx + 1] };
    }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Server className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Asset Management</h1>
            <p className="text-slate-400 text-sm">IT asset register with lifecycle and classification tracking</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Assets</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Active</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        </div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">High Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.highRisk}</div>
        </div>
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Restricted</span>
            <Shield className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400">{stats.restricted}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-800 dark:bg-slate-900 rounded-xl p-1 w-fit border border-slate-700 dark:border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── Registry Tab ──────────────────────────────────────── */}
      {activeTab === 'registry' && !selectedAsset && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search assets by name, ID, or tag..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as AssetType | 'all')} className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Types</option>
                {Object.keys(assetTypeConfig).map(t => <option key={t} value={t}>{t === 'CloudService' ? 'Cloud Service' : t}</option>)}
              </select>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value as DataClassification | 'all')} className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Classifications</option>
                {Object.keys(classificationConfig).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={lifecycleFilter} onChange={e => setLifecycleFilter(e.target.value as LifecycleStatus | 'all')} className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Lifecycles</option>
                {Object.keys(lifecycleConfig).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Asset</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Classification</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Lifecycle</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Owner</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Risk</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.id} className="border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer" onClick={() => setSelectedAsset(asset)}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{asset.name}</div>
                      <div className="text-xs text-slate-500">{asset.id} | {asset.serialNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${assetTypeConfig[asset.type].color}`}>
                        {assetTypeConfig[asset.type].icon}
                        {asset.type === 'CloudService' ? 'Cloud' : asset.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${classificationConfig[asset.classification].color}`}>
                        {asset.classification}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${lifecycleConfig[asset.lifecycle]}`}>
                        {asset.lifecycle}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{asset.owner}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-2">
                          <div className={`h-full rounded-full ${asset.riskScore >= 70 ? 'bg-red-500' : asset.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${asset.riskScore}%` }} />
                        </div>
                        <span className="text-xs font-mono">{asset.riskScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={e => { e.stopPropagation(); cycleLifecycle(asset.id); }} className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors" title="Advance lifecycle">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteAsset(asset.id); }} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAssets.length === 0 && (
              <div className="text-center py-12 text-slate-500"><Package className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No assets match your filters</p></div>
            )}
          </div>
        </>
      )}

      {/* ── Asset Detail ──────────────────────────────────────── */}
      {activeTab === 'registry' && selectedAsset && (
        <div className="space-y-6">
          <button onClick={() => setSelectedAsset(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to registry
          </button>
          <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${assetTypeConfig[selectedAsset.type].color}`}>
                    {assetTypeConfig[selectedAsset.type].icon}{selectedAsset.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${classificationConfig[selectedAsset.classification].color}`}>{selectedAsset.classification}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${lifecycleConfig[selectedAsset.lifecycle]}`}>{selectedAsset.lifecycle}</span>
                </div>
                <h2 className="text-xl font-bold">{selectedAsset.name}</h2>
                <p className="text-slate-400 text-sm mt-1">{selectedAsset.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div><span className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3" />Owner</span><p className="text-sm font-medium">{selectedAsset.owner}</p></div>
              <div><span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />Location</span><p className="text-sm font-medium">{selectedAsset.location}</p></div>
              <div><span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" />Purchase Date</span><p className="text-sm font-medium">{selectedAsset.purchaseDate}</p></div>
              <div><span className="text-xs text-slate-500">Cost</span><p className="text-sm font-medium">${selectedAsset.cost.toLocaleString()}</p></div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {selectedAsset.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-300">#{tag}</span>
              ))}
            </div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-slate-400" /> Dependencies ({selectedAsset.dependencies.length})</h3>
            <div className="space-y-2">
              {selectedAsset.dependencies.length === 0 && <p className="text-sm text-slate-500">No dependencies configured</p>}
              {selectedAsset.dependencies.map(dep => (
                <div key={dep.assetId} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium">{dep.assetName}</span>
                    <span className="text-xs text-slate-500 font-mono">{dep.assetId}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    dep.relationship === 'depends_on' ? 'bg-red-500/20 text-red-400' : dep.relationship === 'depended_by' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {dep.relationship.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Dependencies Tab ──────────────────────────────────── */}
      {activeTab === 'dependencies' && (
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Asset Dependency Map</h2>
          <div className="space-y-4">
            {assets.filter(a => a.dependencies.length > 0).map(asset => (
              <div key={asset.id} className="p-4 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${assetTypeConfig[asset.type].color}`}>
                    {assetTypeConfig[asset.type].icon}
                  </span>
                  <span className="text-sm font-medium">{asset.name}</span>
                  <span className="text-xs text-slate-500 font-mono">{asset.id}</span>
                </div>
                <div className="ml-6 space-y-1.5">
                  {asset.dependencies.map(dep => (
                    <div key={dep.assetId} className="flex items-center gap-2 text-sm">
                      <span className={`text-xs ${dep.relationship === 'depends_on' ? 'text-red-400' : dep.relationship === 'depended_by' ? 'text-green-400' : 'text-blue-400'}`}>
                        {dep.relationship === 'depends_on' ? 'depends on' : dep.relationship === 'depended_by' ? 'depended by' : 'integrates with'}
                      </span>
                      <span className="text-slate-300">{dep.assetName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Classification Tab ────────────────────────────────── */}
      {activeTab === 'classification' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {classificationSummary.map(item => (
              <div key={item.classification} className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-4">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs border mb-2 ${classificationConfig[item.classification].color}`}>{item.classification}</span>
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-xs text-slate-500">Total cost: ${item.totalCost.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-6">
            <h3 className="text-sm font-semibold mb-4">Classification Matrix</h3>
            <div className="space-y-2">
              {assets.sort((a, b) => classificationConfig[b.classification].priority - classificationConfig[a.classification].priority).map(asset => (
                <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${assetTypeConfig[asset.type].color}`}>{assetTypeConfig[asset.type].icon}</span>
                    <div>
                      <p className="text-sm font-medium">{asset.name}</p>
                      <p className="text-xs text-slate-500">{asset.department}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${classificationConfig[asset.classification].color}`}>{asset.classification}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Asset Modal ────────────────────────────────── */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold">Add New Asset</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Asset Name</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Production Web Server" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as AssetType }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Hardware">Hardware</option><option value="Software">Software</option><option value="Data">Data</option><option value="Network">Network</option><option value="CloudService">Cloud Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Classification</label>
                  <select value={form.classification} onChange={e => setForm(p => ({ ...p, classification: e.target.value as DataClassification }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Public">Public</option><option value="Internal">Internal</option><option value="Confidential">Confidential</option><option value="Restricted">Restricted</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Owner</label>
                  <input type="text" value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Department</label>
                  <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Vendor</label>
                  <input type="text" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Cost ($)</label>
                  <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Location</label>
                <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. AWS us-east-1, Office Floor 3" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Serial Number</label>
                <input type="text" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button onClick={() => { setShowCreateForm(false); setForm(defaultForm); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!form.name.trim()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;
