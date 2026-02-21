import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import {
  ArrowLeft, Search, Plus, Download, Eye, Edit3, Trash2,
  AlertTriangle, ShieldCheck, Shield, CheckCircle, XCircle,
  Clock, Globe, FileText, Package, Loader2, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, Filter, Copy,
  BarChart3, Activity, Zap, Bell, Archive, Server,
  Users, Calendar, Mail, Phone, Building2, X, Settings,
  TrendingDown, Minus, Database, Cpu, Box, Layers,
  ClipboardList, MessageSquare, CheckSquare, CircleDot,
  ArrowRight, Workflow, HardDrive, Recycle, Leaf,
  UserCheck, FileCheck, AlertOctagon, Info, Tag, Lock,
  Power, PowerOff, Timer, Play, Pause, SkipForward,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProductStatus = 'Active' | 'End-of-Sale' | 'End-of-Support' | 'End-of-Life' | 'Decommissioned';
type WorkflowStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'skipped';
type MainTab = 'overview' | 'products' | 'workflows' | 'data_management' | 'notifications';

interface Product {
  id: string;
  name: string;
  version: string;
  category: string;
  status: ProductStatus;
  launchDate: string;
  endOfSaleDate: string | null;
  endOfSupportDate: string | null;
  endOfLifeDate: string | null;
  decommissionDate: string | null;
  activeUsers: number;
  securityPatchCommitment: string;
  lastSecurityPatch: string;
  successor: string | null;
  owner: string;
  description: string;
  dataRetentionPolicy: string;
  environmentalDisposal: string;
}

interface WorkflowTask {
  id: string;
  productId: string;
  phase: string;
  taskName: string;
  description: string;
  status: WorkflowStatus;
  assignee: string;
  dueDate: string;
  completedDate: string | null;
  dependencies: string[];
  notes: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface DataMigrationPlan {
  id: string;
  productId: string;
  dataCategory: string;
  recordCount: number;
  sizeGB: number;
  action: 'migrate' | 'archive' | 'delete' | 'retain';
  targetSystem: string;
  status: 'planned' | 'in_progress' | 'completed' | 'verified';
  complianceRequirements: string[];
  retentionPeriod: string;
  deletionDate: string | null;
  verifiedBy: string | null;
}

interface CustomerNotification {
  id: string;
  productId: string;
  type: 'end_of_sale' | 'end_of_support' | 'end_of_life' | 'migration_guide' | 'final_notice';
  subject: string;
  recipientCount: number;
  sentDate: string | null;
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered';
  channel: 'email' | 'in_app' | 'portal' | 'all';
  template: string;
}

interface TransitionPlan {
  id: string;
  productId: string;
  successorProduct: string;
  migrationPath: string;
  estimatedEffort: string;
  affectedCustomers: number;
  completionRate: number;
  documentationUrl: string;
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------
const DEMO_PRODUCTS: Product[] = [
  {
    id: 'P001', name: 'ComplyEasy Platform v1', version: '1.9.4', category: 'SaaS Platform',
    status: 'End-of-Support', launchDate: '2021-03-15', endOfSaleDate: '2024-06-30',
    endOfSupportDate: '2025-12-31', endOfLifeDate: '2026-06-30', decommissionDate: null,
    activeUsers: 342, securityPatchCommitment: 'Critical patches only until EOL',
    lastSecurityPatch: '2026-01-15', successor: 'ComplyEasy Platform v2',
    owner: 'Sarah Chen', description: 'Original compliance management platform with basic risk assessment and policy management.',
    dataRetentionPolicy: '7 years post-decommission for audit trail', environmentalDisposal: 'Cloud-based - data center decommission procedures apply',
  },
  {
    id: 'P002', name: 'ComplianceBot API v2', version: '2.3.1', category: 'API Service',
    status: 'End-of-Sale', launchDate: '2022-01-10', endOfSaleDate: '2025-09-30',
    endOfSupportDate: '2026-09-30', endOfLifeDate: '2027-03-31', decommissionDate: null,
    activeUsers: 156, securityPatchCommitment: 'Full security patches until EOS',
    lastSecurityPatch: '2026-02-01', successor: 'ComplianceBot API v3',
    owner: 'Michael Park', description: 'REST API for automated compliance checking and policy enforcement.',
    dataRetentionPolicy: '5 years post-decommission', environmentalDisposal: 'API infrastructure - container cleanup required',
  },
  {
    id: 'P003', name: 'RiskAssess Mobile', version: '3.1.0', category: 'Mobile Application',
    status: 'End-of-Life', launchDate: '2022-06-20', endOfSaleDate: '2024-12-31',
    endOfSupportDate: '2025-06-30', endOfLifeDate: '2025-12-31', decommissionDate: null,
    activeUsers: 45, securityPatchCommitment: 'No further patches - EOL reached',
    lastSecurityPatch: '2025-05-20', successor: 'ComplyEasy Mobile (unified)',
    owner: 'Lisa Wang', description: 'Standalone mobile risk assessment app. Being replaced by unified mobile experience.',
    dataRetentionPolicy: '3 years for user data, 7 years for assessment records', environmentalDisposal: 'App store removal, user data deletion',
  },
  {
    id: 'P004', name: 'DataGuard Encryption Module', version: '1.2.0', category: 'Security Module',
    status: 'Decommissioned', launchDate: '2020-11-01', endOfSaleDate: '2023-06-30',
    endOfSupportDate: '2024-06-30', endOfLifeDate: '2024-12-31', decommissionDate: '2025-03-15',
    activeUsers: 0, securityPatchCommitment: 'Decommissioned - no patches',
    lastSecurityPatch: '2024-06-15', successor: 'Platform-integrated encryption',
    owner: 'James Kim', description: 'Standalone encryption module. Functionality merged into core platform.',
    dataRetentionPolicy: 'All data migrated. Encryption keys archived per policy.', environmentalDisposal: 'Completed. All hardware securely wiped.',
  },
  {
    id: 'P005', name: 'AuditTrail Reporter', version: '4.0.2', category: 'Reporting Tool',
    status: 'Active', launchDate: '2023-09-01', endOfSaleDate: null,
    endOfSupportDate: null, endOfLifeDate: null, decommissionDate: null,
    activeUsers: 1250, securityPatchCommitment: 'Full support - monthly patches',
    lastSecurityPatch: '2026-02-10', successor: null,
    owner: 'Anna Rodriguez', description: 'Comprehensive audit trail and compliance reporting tool.',
    dataRetentionPolicy: 'Active product - standard retention applies', environmentalDisposal: 'N/A - Active product',
  },
  {
    id: 'P006', name: 'PolicySync Desktop', version: '2.5.3', category: 'Desktop Application',
    status: 'End-of-Life', launchDate: '2021-08-15', endOfSaleDate: '2024-03-31',
    endOfSupportDate: '2025-03-31', endOfLifeDate: '2025-09-30', decommissionDate: null,
    activeUsers: 23, securityPatchCommitment: 'No further patches',
    lastSecurityPatch: '2025-02-28', successor: 'ComplyEasy Platform v2 (web)',
    owner: 'Tom Bradley', description: 'Desktop application for policy synchronization and offline access.',
    dataRetentionPolicy: '5 years for sync logs', environmentalDisposal: 'Uninstall guide published. Local data cleanup tool provided.',
  },
];

const DEMO_WORKFLOW_TASKS: WorkflowTask[] = [
  // P001 tasks
  { id: 'W001', productId: 'P001', phase: 'Planning', taskName: 'Stakeholder Impact Assessment', description: 'Identify all stakeholders affected by decommission', status: 'completed', assignee: 'Sarah Chen', dueDate: '2025-10-15', completedDate: '2025-10-12', dependencies: [], notes: '342 active users identified', priority: 'High' },
  { id: 'W002', productId: 'P001', phase: 'Planning', taskName: 'Data Migration Plan', description: 'Create detailed data migration plan to v2', status: 'completed', assignee: 'Michael Park', dueDate: '2025-11-01', completedDate: '2025-10-28', dependencies: ['W001'], notes: 'Migration scripts prepared', priority: 'Critical' },
  { id: 'W003', productId: 'P001', phase: 'Communication', taskName: 'Customer Notification - 6 Month', description: 'Send 6-month advance notice to all users', status: 'completed', assignee: 'Lisa Wang', dueDate: '2025-12-31', completedDate: '2025-12-20', dependencies: [], notes: 'Email and in-app notification sent', priority: 'High' },
  { id: 'W004', productId: 'P001', phase: 'Migration', taskName: 'Data Export & Validation', description: 'Export all customer data and validate integrity', status: 'in_progress', assignee: 'James Kim', dueDate: '2026-03-15', completedDate: null, dependencies: ['W002'], notes: '65% of accounts migrated', priority: 'Critical' },
  { id: 'W005', productId: 'P001', phase: 'Migration', taskName: 'API Redirect Configuration', description: 'Set up API redirects to v2 endpoints', status: 'in_progress', assignee: 'Michael Park', dueDate: '2026-04-01', completedDate: null, dependencies: ['W004'], notes: 'Redirect rules being tested', priority: 'High' },
  { id: 'W006', productId: 'P001', phase: 'Security', taskName: 'Final Security Audit', description: 'Conduct final security review before shutdown', status: 'not_started', assignee: 'Anna Rodriguez', dueDate: '2026-05-15', completedDate: null, dependencies: ['W004', 'W005'], notes: '', priority: 'Critical' },
  { id: 'W007', productId: 'P001', phase: 'Decommission', taskName: 'Service Shutdown', description: 'Gracefully shut down all v1 services', status: 'not_started', assignee: 'Sarah Chen', dueDate: '2026-06-30', completedDate: null, dependencies: ['W006'], notes: '', priority: 'Critical' },
  { id: 'W008', productId: 'P001', phase: 'Decommission', taskName: 'Infrastructure Teardown', description: 'Remove all cloud infrastructure and resources', status: 'not_started', assignee: 'James Kim', dueDate: '2026-07-15', completedDate: null, dependencies: ['W007'], notes: '', priority: 'High' },
  { id: 'W009', productId: 'P001', phase: 'Post-Decommission', taskName: 'Data Retention Verification', description: 'Verify all retained data meets compliance requirements', status: 'not_started', assignee: 'Anna Rodriguez', dueDate: '2026-08-01', completedDate: null, dependencies: ['W008'], notes: '', priority: 'High' },
  { id: 'W010', productId: 'P001', phase: 'Knowledge Transfer', taskName: 'Documentation Archival', description: 'Archive all technical documentation and runbooks', status: 'in_progress', assignee: 'Tom Bradley', dueDate: '2026-05-01', completedDate: null, dependencies: [], notes: 'Wiki pages being exported', priority: 'Medium' },
  // P003 tasks
  { id: 'W011', productId: 'P003', phase: 'Communication', taskName: 'Final Shutdown Notice', description: 'Send final notice to remaining 45 users', status: 'completed', assignee: 'Lisa Wang', dueDate: '2025-11-30', completedDate: '2025-11-28', dependencies: [], notes: 'All users notified', priority: 'High' },
  { id: 'W012', productId: 'P003', phase: 'Decommission', taskName: 'App Store Removal', description: 'Remove app from iOS and Android stores', status: 'in_progress', assignee: 'Tom Bradley', dueDate: '2026-02-28', completedDate: null, dependencies: [], notes: 'iOS removed. Android pending.', priority: 'Medium' },
  { id: 'W013', productId: 'P003', phase: 'Migration', taskName: 'User Data Migration', description: 'Migrate remaining user data to unified mobile app', status: 'completed', assignee: 'James Kim', dueDate: '2026-01-31', completedDate: '2026-01-20', dependencies: [], notes: 'All 45 user accounts migrated', priority: 'Critical' },
  { id: 'W014', productId: 'P003', phase: 'Security', taskName: 'API Key Revocation', description: 'Revoke all API keys and tokens', status: 'not_started', assignee: 'Michael Park', dueDate: '2026-03-15', completedDate: null, dependencies: ['W012'], notes: '', priority: 'High' },
];

const DEMO_DATA_PLANS: DataMigrationPlan[] = [
  { id: 'DM001', productId: 'P001', dataCategory: 'User Accounts', recordCount: 342, sizeGB: 0.5, action: 'migrate', targetSystem: 'ComplyEasy Platform v2', status: 'in_progress', complianceRequirements: ['GDPR Art.20 - Data Portability', 'Data minimization'], retentionPeriod: 'Active in target system', deletionDate: null, verifiedBy: null },
  { id: 'DM002', productId: 'P001', dataCategory: 'Compliance Assessments', recordCount: 12450, sizeGB: 8.2, action: 'migrate', targetSystem: 'ComplyEasy Platform v2', status: 'in_progress', complianceRequirements: ['Audit trail retention - 7 years', 'Data integrity verification'], retentionPeriod: '7 years', deletionDate: null, verifiedBy: null },
  { id: 'DM003', productId: 'P001', dataCategory: 'System Logs', recordCount: 2500000, sizeGB: 45.0, action: 'archive', targetSystem: 'Cold Storage (S3 Glacier)', status: 'planned', complianceRequirements: ['Log retention policy - 3 years', 'SOC 2 evidence'], retentionPeriod: '3 years', deletionDate: '2029-06-30', verifiedBy: null },
  { id: 'DM004', productId: 'P001', dataCategory: 'Temporary Files & Caches', recordCount: 0, sizeGB: 12.3, action: 'delete', targetSystem: 'N/A', status: 'planned', complianceRequirements: ['No retention requirement'], retentionPeriod: 'None', deletionDate: '2026-07-15', verifiedBy: null },
  { id: 'DM005', productId: 'P001', dataCategory: 'Encryption Keys', recordCount: 156, sizeGB: 0.001, action: 'archive', targetSystem: 'HSM Vault Archive', status: 'planned', complianceRequirements: ['Key management policy', 'Potential future decryption needs'], retentionPeriod: '10 years', deletionDate: '2036-06-30', verifiedBy: null },
  { id: 'DM006', productId: 'P003', dataCategory: 'User Profiles', recordCount: 45, sizeGB: 0.02, action: 'migrate', targetSystem: 'ComplyEasy Mobile (unified)', status: 'completed', complianceRequirements: ['GDPR', 'CCPA'], retentionPeriod: 'Active in target', deletionDate: null, verifiedBy: 'James Kim' },
  { id: 'DM007', productId: 'P003', dataCategory: 'Assessment Data', recordCount: 890, sizeGB: 0.8, action: 'migrate', targetSystem: 'ComplyEasy Mobile (unified)', status: 'completed', complianceRequirements: ['Audit trail - 5 years'], retentionPeriod: '5 years', deletionDate: null, verifiedBy: 'James Kim' },
  { id: 'DM008', productId: 'P003', dataCategory: 'Device Tokens', recordCount: 120, sizeGB: 0.001, action: 'delete', targetSystem: 'N/A', status: 'completed', complianceRequirements: ['No retention needed'], retentionPeriod: 'None', deletionDate: '2026-01-25', verifiedBy: 'Michael Park' },
  { id: 'DM009', productId: 'P004', dataCategory: 'All Product Data', recordCount: 0, sizeGB: 0, action: 'delete', targetSystem: 'N/A', status: 'verified', complianceRequirements: ['Data deletion certificate required'], retentionPeriod: 'Completed', deletionDate: '2025-03-15', verifiedBy: 'Anna Rodriguez' },
];

const DEMO_NOTIFICATIONS: CustomerNotification[] = [
  { id: 'N001', productId: 'P001', type: 'end_of_sale', subject: 'ComplyEasy v1 - End of Sale Notice', recipientCount: 342, sentDate: '2024-03-31', scheduledDate: '2024-03-31', status: 'delivered', channel: 'all', template: 'Product will no longer be available for new purchases as of June 30, 2024.' },
  { id: 'N002', productId: 'P001', type: 'end_of_support', subject: 'ComplyEasy v1 - End of Support Approaching', recipientCount: 342, sentDate: '2025-09-30', scheduledDate: '2025-09-30', status: 'delivered', channel: 'email', template: 'Support for v1 will end on December 31, 2025. Please plan your migration to v2.' },
  { id: 'N003', productId: 'P001', type: 'migration_guide', subject: 'Your Migration Guide to ComplyEasy v2', recipientCount: 342, sentDate: '2025-12-20', scheduledDate: '2025-12-15', status: 'delivered', channel: 'email', template: 'Step-by-step migration guide with data export tools and timeline.' },
  { id: 'N004', productId: 'P001', type: 'end_of_life', subject: 'ComplyEasy v1 - 4 Month EOL Countdown', recipientCount: 280, sentDate: null, scheduledDate: '2026-02-28', status: 'scheduled', channel: 'all', template: 'ComplyEasy v1 reaches End of Life on June 30, 2026. Migrate now to avoid service disruption.' },
  { id: 'N005', productId: 'P001', type: 'final_notice', subject: 'URGENT: ComplyEasy v1 Shutdown in 30 Days', recipientCount: 0, sentDate: null, scheduledDate: '2026-05-31', status: 'draft', channel: 'all', template: 'Final reminder: v1 will be permanently shut down on June 30, 2026.' },
  { id: 'N006', productId: 'P003', type: 'end_of_life', subject: 'RiskAssess Mobile - End of Life', recipientCount: 45, sentDate: '2025-11-28', scheduledDate: '2025-11-30', status: 'delivered', channel: 'email', template: 'RiskAssess Mobile has reached end of life. Please switch to ComplyEasy Mobile.' },
  { id: 'N007', productId: 'P002', type: 'end_of_sale', subject: 'ComplianceBot API v2 - End of Sale Notice', recipientCount: 156, sentDate: '2025-06-30', scheduledDate: '2025-06-30', status: 'delivered', channel: 'email', template: 'API v2 is no longer available for new subscriptions. Existing clients retain access.' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const statusConfig: Record<ProductStatus, { color: string; icon: React.ReactNode; bgColor: string }> = {
  'Active': { color: 'bg-green-100 text-green-800', icon: <Power className="w-4 h-4 text-green-600" />, bgColor: 'border-green-200' },
  'End-of-Sale': { color: 'bg-blue-100 text-blue-800', icon: <Pause className="w-4 h-4 text-blue-600" />, bgColor: 'border-blue-200' },
  'End-of-Support': { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />, bgColor: 'border-yellow-200' },
  'End-of-Life': { color: 'bg-orange-100 text-orange-800', icon: <PowerOff className="w-4 h-4 text-orange-600" />, bgColor: 'border-orange-200' },
  'Decommissioned': { color: 'bg-gray-100 text-gray-600', icon: <Archive className="w-4 h-4 text-gray-500" />, bgColor: 'border-gray-200' },
};

const workflowStatusColor = (s: WorkflowStatus) => {
  switch (s) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'blocked': return 'bg-red-100 text-red-800';
    case 'not_started': return 'bg-gray-100 text-gray-600';
    case 'skipped': return 'bg-gray-100 text-gray-400';
  }
};

const priorityColor = (p: string) => {
  switch (p) {
    case 'Critical': return 'bg-red-100 text-red-800';
    case 'High': return 'bg-orange-100 text-orange-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800';
    case 'Low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const dataActionColor = (a: string) => {
  switch (a) {
    case 'migrate': return 'bg-blue-100 text-blue-800';
    case 'archive': return 'bg-purple-100 text-purple-800';
    case 'delete': return 'bg-red-100 text-red-800';
    case 'retain': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const notifTypeColor = (t: string) => {
  switch (t) {
    case 'end_of_sale': return 'bg-blue-100 text-blue-800';
    case 'end_of_support': return 'bg-yellow-100 text-yellow-800';
    case 'end_of_life': return 'bg-orange-100 text-orange-800';
    case 'migration_guide': return 'bg-green-100 text-green-800';
    case 'final_notice': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface ProductDecommissioningProps {
  onBack: () => void;
}

export const ProductDecommissioning: React.FC<ProductDecommissioningProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [workflowProductFilter, setWorkflowProductFilter] = useState<string>('All');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [dataProductFilter, setDataProductFilter] = useState<string>('All');
  const [notifProductFilter, setNotifProductFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // State variables backed by DEMO data as initial/fallback values
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>(DEMO_WORKFLOW_TASKS);
  const [dataPlans, setDataPlans] = useState<DataMigrationPlan[]>(DEMO_DATA_PLANS);
  const [notifications, setNotifications] = useState<CustomerNotification[]>(DEMO_NOTIFICATIONS);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true); else setIsLoading(true);
    try {
      const data = await api.modules.decommission.listProducts();
      if (data) {
        // The API returns a combined payload; destructure if available,
        // otherwise fall back to treating it as the products list.
        if (Array.isArray(data)) {
          setProducts(data.length > 0 ? data : DEMO_PRODUCTS);
        } else {
          const d = data as any;
          if (d.products) setProducts(d.products);
          if (d.workflowTasks) setWorkflowTasks(d.workflowTasks);
          if (d.dataPlans) setDataPlans(d.dataPlans);
          if (d.notifications) setNotifications(d.notifications);
        }
      }
      setLoadError(null);
    } catch (err: any) {
      setLoadError('Unable to connect to server. Showing demo data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteProduct = useCallback(async (id: string) => {
    try {
      await api.modules.decommission.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      setLoadError('Failed to delete product. Please try again.');
    }
  }, []);

  const handleUpdateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    try {
      const updated = await api.modules.decommission.updateProduct(id, data);
      setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...data, ...(updated ?? {}) } : p)));
    } catch {
      setLoadError('Failed to update product. Please try again.');
    }
  }, []);

  const handleCreateProduct = useCallback(async (data: Omit<Product, 'id'>) => {
    try {
      const created = await api.modules.decommission.createProduct(data);
      if (created) setProducts(prev => [...prev, created]);
      await loadData(true);
    } catch {
      setLoadError('Failed to create product. Please try again.');
    }
  }, [loadData]);

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      (p.name.toLowerCase().includes(productSearch.toLowerCase())) &&
      (productStatusFilter === 'All' || p.status === productStatusFilter)
    ), [products, productSearch, productStatusFilter]);

  const filteredTasks = useMemo(() =>
    workflowTasks.filter(t => workflowProductFilter === 'All' || t.productId === workflowProductFilter), [workflowTasks, workflowProductFilter]);

  const filteredDataPlans = useMemo(() =>
    dataPlans.filter(d => dataProductFilter === 'All' || d.productId === dataProductFilter), [dataPlans, dataProductFilter]);

  const filteredNotifications = useMemo(() =>
    notifications.filter(n => notifProductFilter === 'All' || n.productId === notifProductFilter), [notifications, notifProductFilter]);

  // Stats
  const statusCounts = useMemo(() => ({
    Active: products.filter(p => p.status === 'Active').length,
    'End-of-Sale': products.filter(p => p.status === 'End-of-Sale').length,
    'End-of-Support': products.filter(p => p.status === 'End-of-Support').length,
    'End-of-Life': products.filter(p => p.status === 'End-of-Life').length,
    Decommissioned: products.filter(p => p.status === 'Decommissioned').length,
  }), [products]);

  const taskStats = useMemo(() => ({
    total: workflowTasks.length,
    completed: workflowTasks.filter(t => t.status === 'completed').length,
    inProgress: workflowTasks.filter(t => t.status === 'in_progress').length,
    notStarted: workflowTasks.filter(t => t.status === 'not_started').length,
  }), [workflowTasks]);

  // ---------------------------------------------------------------------------
  // Tab Renderers
  // ---------------------------------------------------------------------------
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Lifecycle Pipeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Product Lifecycle Pipeline</h3>
        <div className="flex items-center justify-between gap-2">
          {(['Active', 'End-of-Sale', 'End-of-Support', 'End-of-Life', 'Decommissioned'] as ProductStatus[]).map((status, i) => (
            <React.Fragment key={status}>
              <div className={`flex-1 p-4 rounded-lg border-2 text-center ${statusConfig[status].bgColor}`}>
                <div className="flex justify-center mb-2">{statusConfig[status].icon}</div>
                <div className="text-2xl font-bold text-gray-900">{statusCounts[status]}</div>
                <div className="text-xs text-gray-600 font-medium">{status}</div>
              </div>
              {i < 4 && <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Workflow Tasks</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-green-600">{taskStats.completed} done</span>
            <span className="text-xs text-blue-600">{taskStats.inProgress} active</span>
            <span className="text-xs text-gray-500">{taskStats.notStarted} pending</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Data Plans</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{dataPlans.length}</div>
          <div className="text-xs text-gray-500 mt-1">{dataPlans.filter(d => d.status === 'completed' || d.status === 'verified').length} completed</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Notifications</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
          <div className="text-xs text-gray-500 mt-1">{notifications.filter(n => n.status === 'delivered').length} delivered</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Affected Users</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{products.filter(p => p.status !== 'Active' && p.status !== 'Decommissioned').reduce((sum, p) => sum + p.activeUsers, 0)}</div>
          <div className="text-xs text-gray-500 mt-1">Across transitioning products</div>
        </div>
      </div>

      {/* Upcoming Milestones */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">Upcoming Milestones</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {products.filter(p => p.endOfLifeDate && p.status !== 'Decommissioned').sort((a, b) => new Date(a.endOfLifeDate!).getTime() - new Date(b.endOfLifeDate!).getTime()).map(product => (
            <div key={product.id} className="px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusConfig[product.status].icon}
                  <div>
                    <div className="font-medium text-sm text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.status} | {product.activeUsers} active users</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">EOL: {formatDate(product.endOfLifeDate!)}</div>
                  {product.decommissionDate && <div className="text-xs text-gray-500">Decom: {formatDate(product.decommissionDate)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environmental & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Security Patch Commitments</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {products.filter(p => p.status !== 'Active' && p.status !== 'Decommissioned').map(p => (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[p.status].color}`}>{p.status}</span>
                </div>
                <div className="text-xs text-gray-600">{p.securityPatchCommitment}</div>
                <div className="text-xs text-gray-400 mt-0.5">Last patch: {formatDate(p.lastSecurityPatch)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <Recycle className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Environmental Disposal</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {products.filter(p => p.status !== 'Active').map(p => (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[p.status].color}`}>{p.status}</span>
                </div>
                <div className="text-xs text-gray-600">{p.environmentalDisposal}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
            placeholder="Search products..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <select value={productStatusFilter} onChange={e => setProductStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="All">All Statuses</option>
          {(['Active', 'End-of-Sale', 'End-of-Support', 'End-of-Life', 'Decommissioned'] as ProductStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filteredProducts.map(product => (
          <div key={product.id} className={`bg-white border rounded-lg overflow-hidden transition-all ${selectedProduct?.id === product.id ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="p-4 cursor-pointer" onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {statusConfig[product.status].icon}
                  <div>
                    <div className="font-semibold text-gray-900">{product.name} <span className="text-gray-400 font-normal">v{product.version}</span></div>
                    <div className="text-xs text-gray-500">{product.category} | Owner: {product.owner}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600"><Users className="w-3 h-3 inline mr-1" />{product.activeUsers} users</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[product.status].color}`}>{product.status}</span>
                  {selectedProduct?.id === product.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>

            {selectedProduct?.id === product.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><div className="text-xs text-gray-500">Launch Date</div><div className="text-sm font-medium">{formatDate(product.launchDate)}</div></div>
                  <div><div className="text-xs text-gray-500">End of Sale</div><div className="text-sm font-medium">{product.endOfSaleDate ? formatDate(product.endOfSaleDate) : 'N/A'}</div></div>
                  <div><div className="text-xs text-gray-500">End of Support</div><div className="text-sm font-medium">{product.endOfSupportDate ? formatDate(product.endOfSupportDate) : 'N/A'}</div></div>
                  <div><div className="text-xs text-gray-500">End of Life</div><div className="text-sm font-medium">{product.endOfLifeDate ? formatDate(product.endOfLifeDate) : 'N/A'}</div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Successor</div>
                    <div className="text-sm">{product.successor || <span className="text-gray-400 italic">None designated</span>}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Security Patch Status</div>
                    <div className="text-sm">{product.securityPatchCommitment}</div>
                    <div className="text-xs text-gray-400">Last: {formatDate(product.lastSecurityPatch)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Data Retention Policy</div>
                    <div className="text-sm text-gray-700">{product.dataRetentionPolicy}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Environmental Disposal</div>
                    <div className="text-sm text-gray-700">{product.environmentalDisposal}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                  <button onClick={() => { setActiveTab('workflows'); setWorkflowProductFilter(product.id); }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 inline-flex items-center gap-1"><Workflow className="w-3 h-3" />View Workflow</button>
                  <button onClick={() => { setActiveTab('data_management'); setDataProductFilter(product.id); }}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1"><Database className="w-3 h-3" />Data Plan</button>
                  <button onClick={() => { setActiveTab('notifications'); setNotifProductFilter(product.id); }}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1"><Bell className="w-3 h-3" />Notifications</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorkflows = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <select value={workflowProductFilter} onChange={e => setWorkflowProductFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="All">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{filteredTasks.length} tasks</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full" /> {filteredTasks.filter(t => t.status === 'completed').length} done
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full" /> {filteredTasks.filter(t => t.status === 'in_progress').length} active
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {filteredTasks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-gray-900">{Math.round((filteredTasks.filter(t => t.status === 'completed').length / filteredTasks.length) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full">
            <div className="h-3 bg-green-500 rounded-full transition-all"
              style={{ width: `${(filteredTasks.filter(t => t.status === 'completed').length / filteredTasks.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Tasks grouped by phase */}
      {Array.from(new Set(filteredTasks.map(t => t.phase))).map(phase => (
        <div key={phase} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="font-medium text-gray-900 text-sm">{phase}</span>
            <span className="text-xs text-gray-500">
              {filteredTasks.filter(t => t.phase === phase && t.status === 'completed').length}/{filteredTasks.filter(t => t.phase === phase).length} complete
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredTasks.filter(t => t.phase === phase).map(task => (
              <div key={task.id}>
                <div className="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                  <div className="flex items-center gap-3">
                    {task.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                      task.status === 'in_progress' ? <Play className="w-5 h-5 text-blue-500" /> :
                        task.status === 'blocked' ? <XCircle className="w-5 h-5 text-red-500" /> :
                          <CircleDot className="w-5 h-5 text-gray-300" />}
                    <div>
                      <div className="font-medium text-sm text-gray-900">{task.taskName}</div>
                      <div className="text-xs text-gray-500">{task.assignee} | Due: {formatDate(task.dueDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(task.priority)}`}>{task.priority}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${workflowStatusColor(task.status)}`}>{task.status.replace('_', ' ')}</span>
                  </div>
                </div>
                {expandedTask === task.id && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    {task.notes && <p className="text-xs text-gray-500 bg-white p-2 rounded border mb-2">Notes: {task.notes}</p>}
                    {task.dependencies.length > 0 && (
                      <div className="text-xs text-gray-500 mb-2">
                        Dependencies: {task.dependencies.map(dep => {
                          const depTask = workflowTasks.find(t => t.id === dep);
                          return depTask ? depTask.taskName : dep;
                        }).join(', ')}
                      </div>
                    )}
                    {task.completedDate && <div className="text-xs text-green-600">Completed: {formatDate(task.completedDate)}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <select value={dataProductFilter} onChange={e => setDataProductFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="All">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{filteredDataPlans.length} data plans</span>
        </div>
      </div>

      {/* Action Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['migrate', 'archive', 'delete', 'retain'] as const).map(action => (
          <div key={action} className={`p-4 rounded-lg border ${dataActionColor(action).replace('text-', 'border-').replace('bg-', 'bg-')}`}>
            <div className="text-xl font-bold">{filteredDataPlans.filter(d => d.action === action).length}</div>
            <div className="text-xs capitalize">{action}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {filteredDataPlans.filter(d => d.action === action).reduce((sum, d) => sum + d.sizeGB, 0).toFixed(1)} GB
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {filteredDataPlans.map(plan => (
          <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">{plan.dataCategory}</div>
                  <div className="text-xs text-gray-500">
                    {products.find(p => p.id === plan.productId)?.name} | {plan.recordCount.toLocaleString()} records | {plan.sizeGB} GB
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dataActionColor(plan.action)}`}>{plan.action.toUpperCase()}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.status === 'completed' || plan.status === 'verified' ? 'bg-green-100 text-green-800' : plan.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  {plan.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Target: </span>
                <span className="text-gray-700">{plan.targetSystem}</span>
              </div>
              <div>
                <span className="text-gray-500">Retention: </span>
                <span className="text-gray-700">{plan.retentionPeriod}</span>
              </div>
              {plan.deletionDate && (
                <div>
                  <span className="text-gray-500">Deletion: </span>
                  <span className="text-gray-700">{formatDate(plan.deletionDate)}</span>
                </div>
              )}
              {plan.verifiedBy && (
                <div>
                  <span className="text-gray-500">Verified by: </span>
                  <span className="text-green-700 font-medium">{plan.verifiedBy}</span>
                </div>
              )}
            </div>
            {plan.complianceRequirements.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {plan.complianceRequirements.map(req => (
                  <span key={req} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs border border-purple-200">{req}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <select value={notifProductFilter} onChange={e => setNotifProductFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="All">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm inline-flex items-center gap-1">
          <Plus className="w-4 h-4" />Create Notification
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-gray-700">{filteredNotifications.filter(n => n.status === 'draft').length}</div>
          <div className="text-xs text-gray-500">Draft</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-700">{filteredNotifications.filter(n => n.status === 'scheduled').length}</div>
          <div className="text-xs text-blue-600">Scheduled</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-700">{filteredNotifications.filter(n => n.status === 'sent').length}</div>
          <div className="text-xs text-yellow-600">Sent</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-700">{filteredNotifications.filter(n => n.status === 'delivered').length}</div>
          <div className="text-xs text-green-600">Delivered</div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.map(notif => (
          <div key={notif.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">{notif.subject}</div>
                  <div className="text-xs text-gray-500">
                    {products.find(p => p.id === notif.productId)?.name} | {notif.recipientCount} recipients | {notif.channel}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${notifTypeColor(notif.type)}`}>
                  {notif.type.replace(/_/g, ' ')}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${notif.status === 'delivered' ? 'bg-green-100 text-green-800' : notif.status === 'sent' ? 'bg-yellow-100 text-yellow-800' : notif.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  {notif.status}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border mb-2">{notif.template}</div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span><Calendar className="w-3 h-3 inline mr-1" />{notif.sentDate ? `Sent: ${formatDate(notif.sentDate)}` : `Scheduled: ${formatDate(notif.scheduledDate)}`}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  const tabs: { key: MainTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { key: 'workflows', label: 'Workflows', icon: <Workflow className="w-4 h-4" /> },
    { key: 'data_management', label: 'Data Management', icon: <Database className="w-4 h-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Archive className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Product Decommissioning</h1>
                  <p className="text-xs text-gray-500">Lifecycle Management & Decommissioning Workflows</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => loadData(true)} disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                title="Refresh data">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                {products.filter(p => p.status !== 'Active' && p.status !== 'Decommissioned').length} Products Transitioning
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">Loading data...</span>
          </div>
        )}
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span className="text-sm text-amber-700">{loadError}</span>
            <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-700"><X size={14} /></button>
          </div>
        )}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'workflows' && renderWorkflows()}
        {activeTab === 'data_management' && renderDataManagement()}
        {activeTab === 'notifications' && renderNotifications()}
      </div>
    </div>
  );
};
