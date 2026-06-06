import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import {
  ArrowLeft, Package, Shield, CheckCircle, Clock, AlertTriangle,
  ChevronRight, ChevronDown, ChevronUp, FileText, Search, Filter,
  Plus, X, Eye, Edit3, Download, Upload, Trash2, Calendar,
  Layers, Tag, GitBranch, ExternalLink, Archive, Settings,
  BarChart3, Leaf, Bell, Users, Link, Box, Cpu, Workflow,
  CircleDot, MapPin, BookOpen, ClipboardList, FolderOpen,
  CheckSquare, XCircle, ArrowUpRight, RefreshCw, Star, Info, Minus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LifecycleStage =
  | 'concept'
  | 'design'
  | 'development'
  | 'testing'
  | 'production'
  | 'market'
  | 'maintenance'
  | 'eol'
  | 'decommission';

interface Product {
  id: string;
  name: string;
  sku: string;
  version: string;
  type: string;
  stage: LifecycleStage;
  complianceScore: number;
  ceMarkingStatus: 'not_started' | 'in_progress' | 'approved' | 'expired';
  dppId: string | null;
  sbomVersion: string | null;
  owner: string;
  team: string;
  createdAt: string;
  updatedAt: string;
  targetLaunch: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

interface StageRequirement {
  id: string;
  stage: LifecycleStage;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  completed: boolean;
  dueDate: string | null;
  assignee: string | null;
}

interface Milestone {
  id: string;
  productId: string;
  title: string;
  stage: LifecycleStage;
  status: 'pending' | 'approved' | 'rejected' | 'waived';
  approver: string;
  approvalDate: string | null;
  gateType: 'quality' | 'compliance' | 'security' | 'business';
  notes: string;
}

interface ProductDocument {
  id: string;
  productId: string;
  name: string;
  type: string;
  stage: LifecycleStage;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
}

interface RegulatoryRequirement {
  id: string;
  regulation: string;
  requirement: string;
  productTypes: string[];
  stages: LifecycleStage[];
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  evidence: string | null;
  dueDate: string | null;
}

interface EOLPolicy {
  id: string;
  productId: string;
  announcementDate: string;
  eolDate: string;
  eosDate: string;
  customerNotifications: number;
  totalCustomers: number;
  migrationPath: string;
  status: 'planned' | 'announced' | 'active' | 'completed';
}

interface EnvironmentalMetric {
  id: string;
  productId: string;
  stage: LifecycleStage;
  carbonFootprint: number;
  energyConsumption: number;
  wasteGenerated: number;
  recyclabilityScore: number;
  unit: string;
}

type TabId = 'portfolio' | 'details' | 'lifecycle' | 'compliance' | 'documents';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProductLifecycleTrackerProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_ORDER: LifecycleStage[] = [
  'concept', 'design', 'development', 'testing',
  'production', 'market', 'maintenance', 'eol', 'decommission',
];

const STAGE_LABELS: Record<LifecycleStage, string> = {
  concept: 'Concept',
  design: 'Design',
  development: 'Development',
  testing: 'Testing',
  production: 'Production',
  market: 'Market',
  maintenance: 'Maintenance',
  eol: 'End of Life',
  decommission: 'Decommission',
};

const STAGE_COLORS: Record<LifecycleStage, string> = {
  concept: 'bg-purple-500',
  design: 'bg-indigo-500',
  development: 'bg-blue-500',
  testing: 'bg-cyan-500',
  production: 'bg-green-500',
  market: 'bg-emerald-500',
  maintenance: 'bg-yellow-500',
  eol: 'bg-orange-500',
  decommission: 'bg-red-500',
};

const STAGE_BG_LIGHT: Record<LifecycleStage, string> = {
  concept: 'bg-purple-100 text-purple-800 border-purple-200',
  design: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  development: 'bg-blue-100 text-blue-800 border-blue-200',
  testing: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  production: 'bg-green-100 text-green-800 border-green-200',
  market: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  eol: 'bg-orange-100 text-orange-800 border-orange-200',
  decommission: 'bg-red-100 text-red-800 border-red-200',
};

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

const PRODUCTS: Product[] = [
  {
    id: 'p-1', name: 'SmartSensor Pro X1', sku: 'SSP-X1-2026', version: '2.4.1',
    type: 'IoT Device', stage: 'market', complianceScore: 92,
    ceMarkingStatus: 'approved', dppId: 'DPP-2026-00142', sbomVersion: '2.4.1-rc3',
    owner: 'Sarah Chen', team: 'Hardware Engineering', createdAt: '2024-06-15',
    updatedAt: '2026-02-10', targetLaunch: '2025-03-01',
    description: 'Industrial IoT sensor for environmental monitoring with AI-powered anomaly detection.',
    riskLevel: 'medium', tags: ['IoT', 'CE Marked', 'Industrial'],
  },
  {
    id: 'p-2', name: 'DataVault Enterprise', sku: 'DVE-3000', version: '3.1.0',
    type: 'Software Platform', stage: 'maintenance', complianceScore: 87,
    ceMarkingStatus: 'not_started', dppId: null, sbomVersion: '3.1.0-final',
    owner: 'Marcus Johnson', team: 'Platform Engineering', createdAt: '2023-01-20',
    updatedAt: '2026-02-14', targetLaunch: '2023-09-15',
    description: 'Enterprise data management platform with encryption, RBAC, and compliance reporting.',
    riskLevel: 'low', tags: ['SaaS', 'Enterprise', 'Data'],
  },
  {
    id: 'p-3', name: 'AI Assistant Module', sku: 'AIM-100', version: '1.0.0-beta',
    type: 'AI/ML System', stage: 'testing', complianceScore: 68,
    ceMarkingStatus: 'in_progress', dppId: 'DPP-2026-00287', sbomVersion: '1.0.0-b4',
    owner: 'Dr. Elena Vasquez', team: 'AI Research', createdAt: '2025-04-10',
    updatedAt: '2026-02-16', targetLaunch: '2026-06-01',
    description: 'Natural language AI assistant for compliance workflow automation and risk analysis.',
    riskLevel: 'high', tags: ['AI', 'High-Risk', 'EU AI Act'],
  },
  {
    id: 'p-4', name: 'SecureGate Firewall v5', sku: 'SGF-V5', version: '5.0.2',
    type: 'Network Appliance', stage: 'production', complianceScore: 95,
    ceMarkingStatus: 'approved', dppId: 'DPP-2026-00098', sbomVersion: '5.0.2-rel',
    owner: 'Tom Richards', team: 'Security Products', createdAt: '2024-11-01',
    updatedAt: '2026-02-12', targetLaunch: '2025-08-15',
    description: 'Next-gen network firewall with ML-based threat detection and zero-trust architecture.',
    riskLevel: 'low', tags: ['Security', 'Network', 'CE Marked'],
  },
  {
    id: 'p-5', name: 'MedTrack Patient Portal', sku: 'MTP-200', version: '2.0.0',
    type: 'Healthcare Software', stage: 'development', complianceScore: 54,
    ceMarkingStatus: 'not_started', dppId: null, sbomVersion: null,
    owner: 'Dr. Aisha Patel', team: 'Healthcare Division', createdAt: '2025-09-01',
    updatedAt: '2026-02-15', targetLaunch: '2026-09-01',
    description: 'Patient-facing portal for medical records access, appointment scheduling, and telehealth.',
    riskLevel: 'high', tags: ['Healthcare', 'HIPAA', 'MDR'],
  },
  {
    id: 'p-6', name: 'CloudBridge Connector', sku: 'CBC-150', version: '1.5.3',
    type: 'Integration Platform', stage: 'eol', complianceScore: 72,
    ceMarkingStatus: 'expired', dppId: null, sbomVersion: '1.5.3-legacy',
    owner: 'James Kim', team: 'Platform Engineering', createdAt: '2022-03-15',
    updatedAt: '2026-01-30', targetLaunch: '2022-08-01',
    description: 'Legacy cloud integration connector being phased out in favor of CloudBridge v2.',
    riskLevel: 'medium', tags: ['Legacy', 'EOL', 'Integration'],
  },
  {
    id: 'p-7', name: 'EdgeCompute Module', sku: 'ECM-400', version: '0.5.0',
    type: 'Edge Computing', stage: 'concept', complianceScore: 0,
    ceMarkingStatus: 'not_started', dppId: null, sbomVersion: null,
    owner: 'Priya Sharma', team: 'Innovation Lab', createdAt: '2026-01-10',
    updatedAt: '2026-02-17', targetLaunch: '2027-03-01',
    description: 'Next-generation edge computing module for real-time industrial data processing.',
    riskLevel: 'medium', tags: ['Edge', 'Concept', 'Industrial'],
  },
  {
    id: 'p-8', name: 'ComplianceBot v1', sku: 'CB-V1', version: '1.2.0',
    type: 'AI/ML System', stage: 'decommission', complianceScore: 45,
    ceMarkingStatus: 'expired', dppId: null, sbomVersion: '1.2.0-final',
    owner: 'Marcus Johnson', team: 'AI Research', createdAt: '2021-06-01',
    updatedAt: '2025-12-15', targetLaunch: '2021-11-01',
    description: 'First-generation compliance chatbot, replaced by AI Assistant Module.',
    riskLevel: 'low', tags: ['Decommissioned', 'AI', 'Legacy'],
  },
];

const STAGE_REQUIREMENTS: StageRequirement[] = [
  { id: 'sr-1', stage: 'concept', title: 'Regulatory Landscape Assessment', description: 'Identify all applicable regulations and standards for the product concept.', category: 'Regulatory', mandatory: true, completed: true, dueDate: null, assignee: 'Compliance Team' },
  { id: 'sr-2', stage: 'concept', title: 'Risk Classification', description: 'Perform initial risk classification per EU AI Act and applicable frameworks.', category: 'Risk', mandatory: true, completed: true, dueDate: null, assignee: 'Risk Manager' },
  { id: 'sr-3', stage: 'concept', title: 'Data Protection Impact Assessment', description: 'Conduct preliminary DPIA for data processing activities.', category: 'Privacy', mandatory: true, completed: false, dueDate: '2026-03-15', assignee: 'DPO' },
  { id: 'sr-4', stage: 'design', title: 'Security Architecture Review', description: 'Complete security architecture review with threat modeling.', category: 'Security', mandatory: true, completed: true, dueDate: null, assignee: 'Security Architect' },
  { id: 'sr-5', stage: 'design', title: 'Privacy by Design Documentation', description: 'Document privacy-by-design principles applied to the product.', category: 'Privacy', mandatory: true, completed: true, dueDate: null, assignee: 'DPO' },
  { id: 'sr-6', stage: 'design', title: 'Accessibility Compliance Plan', description: 'Create accessibility compliance plan per WCAG 2.1 AA standards.', category: 'Accessibility', mandatory: false, completed: false, dueDate: '2026-04-01', assignee: 'UX Team' },
  { id: 'sr-7', stage: 'development', title: 'SBOM Generation', description: 'Generate and maintain Software Bill of Materials for all dependencies.', category: 'Supply Chain', mandatory: true, completed: true, dueDate: null, assignee: 'DevOps' },
  { id: 'sr-8', stage: 'development', title: 'Secure Coding Standards', description: 'Verify adherence to OWASP secure coding standards.', category: 'Security', mandatory: true, completed: true, dueDate: null, assignee: 'Dev Lead' },
  { id: 'sr-9', stage: 'development', title: 'License Compliance Audit', description: 'Audit all third-party licenses for compatibility.', category: 'Legal', mandatory: true, completed: false, dueDate: '2026-03-30', assignee: 'Legal' },
  { id: 'sr-10', stage: 'testing', title: 'Penetration Testing', description: 'Complete external penetration test by approved vendor.', category: 'Security', mandatory: true, completed: false, dueDate: '2026-04-15', assignee: 'Security Team' },
  { id: 'sr-11', stage: 'testing', title: 'Conformity Assessment', description: 'Complete EU conformity assessment procedure for CE marking.', category: 'Regulatory', mandatory: true, completed: false, dueDate: '2026-05-01', assignee: 'QA Lead' },
  { id: 'sr-12', stage: 'testing', title: 'Bias and Fairness Testing', description: 'Run bias and fairness tests for AI/ML components.', category: 'AI Ethics', mandatory: true, completed: false, dueDate: '2026-04-20', assignee: 'AI Ethics Board' },
  { id: 'sr-13', stage: 'production', title: 'Production Readiness Review', description: 'Complete production readiness checklist and sign-off.', category: 'Operations', mandatory: true, completed: true, dueDate: null, assignee: 'Ops Manager' },
  { id: 'sr-14', stage: 'production', title: 'Incident Response Plan', description: 'Finalize product-specific incident response procedures.', category: 'Security', mandatory: true, completed: true, dueDate: null, assignee: 'Security Team' },
  { id: 'sr-15', stage: 'market', title: 'Post-Market Surveillance Plan', description: 'Establish ongoing surveillance for regulatory compliance.', category: 'Regulatory', mandatory: true, completed: true, dueDate: null, assignee: 'Compliance Team' },
  { id: 'sr-16', stage: 'maintenance', title: 'Vulnerability Management', description: 'Maintain active vulnerability scanning and patching program.', category: 'Security', mandatory: true, completed: true, dueDate: null, assignee: 'Security Team' },
  { id: 'sr-17', stage: 'eol', title: 'EOL Notification Plan', description: 'Create and execute customer notification plan for product EOL.', category: 'Business', mandatory: true, completed: false, dueDate: '2026-06-01', assignee: 'Product Manager' },
  { id: 'sr-18', stage: 'eol', title: 'Data Migration Plan', description: 'Provide data migration path for affected customers.', category: 'Data', mandatory: true, completed: false, dueDate: '2026-06-15', assignee: 'Data Team' },
  { id: 'sr-19', stage: 'decommission', title: 'Data Destruction Certification', description: 'Certify complete destruction of customer data per retention policies.', category: 'Privacy', mandatory: true, completed: false, dueDate: '2026-07-01', assignee: 'DPO' },
  { id: 'sr-20', stage: 'decommission', title: 'Regulatory Deregistration', description: 'Complete deregistration from applicable regulatory bodies.', category: 'Regulatory', mandatory: true, completed: false, dueDate: '2026-07-15', assignee: 'Compliance Team' },
];

const MILESTONES: Milestone[] = [
  { id: 'm-1', productId: 'p-3', title: 'Concept Approval Gate', stage: 'concept', status: 'approved', approver: 'VP Engineering', approvalDate: '2025-05-15', gateType: 'business', notes: 'Approved with condition to complete DPIA within 60 days.' },
  { id: 'm-2', productId: 'p-3', title: 'Design Review Gate', stage: 'design', status: 'approved', approver: 'Chief Architect', approvalDate: '2025-08-20', gateType: 'quality', notes: 'Architecture approved. Security review passed with minor findings.' },
  { id: 'm-3', productId: 'p-3', title: 'Development Completion Gate', stage: 'development', status: 'approved', approver: 'Dev Manager', approvalDate: '2025-12-10', gateType: 'quality', notes: 'Feature complete. Code coverage at 87%.' },
  { id: 'm-4', productId: 'p-3', title: 'Security Clearance Gate', stage: 'testing', status: 'pending', approver: 'CISO', approvalDate: null, gateType: 'security', notes: 'Awaiting pen test results.' },
  { id: 'm-5', productId: 'p-3', title: 'Compliance Certification Gate', stage: 'testing', status: 'pending', approver: 'Compliance Officer', approvalDate: null, gateType: 'compliance', notes: 'EU AI Act conformity assessment in progress.' },
  { id: 'm-6', productId: 'p-3', title: 'Production Release Gate', stage: 'production', status: 'pending', approver: 'CTO', approvalDate: null, gateType: 'business', notes: 'Blocked by security and compliance gates.' },
  { id: 'm-7', productId: 'p-1', title: 'Market Launch Approval', stage: 'market', status: 'approved', approver: 'CPO', approvalDate: '2025-02-28', gateType: 'business', notes: 'Full market launch approved for EU and NA regions.' },
  { id: 'm-8', productId: 'p-5', title: 'HIPAA Compliance Gate', stage: 'development', status: 'pending', approver: 'Compliance Officer', approvalDate: null, gateType: 'compliance', notes: 'HIPAA controls implementation at 60%.' },
];

const DOCUMENTS: ProductDocument[] = [
  { id: 'd-1', productId: 'p-3', name: 'AI System Technical Documentation', type: 'Technical Spec', stage: 'design', version: '2.1', uploadedBy: 'Dr. Elena Vasquez', uploadedAt: '2025-11-20', size: '4.2 MB', status: 'approved' },
  { id: 'd-2', productId: 'p-3', name: 'EU AI Act Conformity Assessment', type: 'Compliance', stage: 'testing', version: '1.0', uploadedBy: 'Compliance Team', uploadedAt: '2026-01-15', size: '2.8 MB', status: 'review' },
  { id: 'd-3', productId: 'p-3', name: 'Data Protection Impact Assessment', type: 'Privacy', stage: 'concept', version: '1.2', uploadedBy: 'DPO Office', uploadedAt: '2025-06-10', size: '1.5 MB', status: 'approved' },
  { id: 'd-4', productId: 'p-1', name: 'CE Declaration of Conformity', type: 'Regulatory', stage: 'production', version: '3.0', uploadedBy: 'Quality Assurance', uploadedAt: '2025-01-22', size: '890 KB', status: 'approved' },
  { id: 'd-5', productId: 'p-1', name: 'Digital Product Passport', type: 'DPP', stage: 'market', version: '2.4', uploadedBy: 'Product Team', uploadedAt: '2026-02-01', size: '1.1 MB', status: 'approved' },
  { id: 'd-6', productId: 'p-5', name: 'HIPAA Security Rule Assessment', type: 'Compliance', stage: 'development', version: '0.8', uploadedBy: 'Security Team', uploadedAt: '2026-02-05', size: '3.2 MB', status: 'draft' },
  { id: 'd-7', productId: 'p-4', name: 'Penetration Test Report Q4 2025', type: 'Security', stage: 'production', version: '1.0', uploadedBy: 'External Vendor', uploadedAt: '2025-12-20', size: '5.7 MB', status: 'approved' },
  { id: 'd-8', productId: 'p-6', name: 'EOL Customer Communication Plan', type: 'Business', stage: 'eol', version: '1.1', uploadedBy: 'Product Manager', uploadedAt: '2026-01-10', size: '420 KB', status: 'review' },
  { id: 'd-9', productId: 'p-3', name: 'SBOM Report v1.0.0-b4', type: 'Supply Chain', stage: 'testing', version: '1.0', uploadedBy: 'DevOps', uploadedAt: '2026-02-12', size: '780 KB', status: 'approved' },
  { id: 'd-10', productId: 'p-2', name: 'Annual Security Audit Report', type: 'Security', stage: 'maintenance', version: '2026.1', uploadedBy: 'Security Team', uploadedAt: '2026-01-28', size: '6.1 MB', status: 'approved' },
];

const REGULATORY_REQUIREMENTS: RegulatoryRequirement[] = [
  { id: 'rr-1', regulation: 'EU AI Act', requirement: 'High-risk AI system conformity assessment', productTypes: ['AI/ML System'], stages: ['testing', 'production'], status: 'partial', evidence: 'Assessment in progress', dueDate: '2026-05-01' },
  { id: 'rr-2', regulation: 'EU AI Act', requirement: 'Technical documentation (Annex IV)', productTypes: ['AI/ML System'], stages: ['design', 'development'], status: 'compliant', evidence: 'd-1', dueDate: null },
  { id: 'rr-3', regulation: 'EU AI Act', requirement: 'Human oversight mechanisms', productTypes: ['AI/ML System'], stages: ['development', 'testing'], status: 'partial', evidence: null, dueDate: '2026-04-15' },
  { id: 'rr-4', regulation: 'GDPR', requirement: 'Data Protection Impact Assessment', productTypes: ['AI/ML System', 'Software Platform', 'Healthcare Software'], stages: ['concept', 'design'], status: 'compliant', evidence: 'd-3', dueDate: null },
  { id: 'rr-5', regulation: 'GDPR', requirement: 'Data processing records (Art. 30)', productTypes: ['AI/ML System', 'Software Platform', 'Healthcare Software', 'Integration Platform'], stages: ['production', 'market', 'maintenance'], status: 'compliant', evidence: 'Records maintained', dueDate: null },
  { id: 'rr-6', regulation: 'CE Marking', requirement: 'Declaration of Conformity', productTypes: ['IoT Device', 'Network Appliance'], stages: ['production'], status: 'compliant', evidence: 'd-4', dueDate: null },
  { id: 'rr-7', regulation: 'CE Marking', requirement: 'Essential requirements verification', productTypes: ['IoT Device', 'Network Appliance'], stages: ['testing'], status: 'compliant', evidence: 'Test reports available', dueDate: null },
  { id: 'rr-8', regulation: 'HIPAA', requirement: 'Security Rule compliance', productTypes: ['Healthcare Software'], stages: ['development', 'testing', 'production'], status: 'partial', evidence: 'd-6', dueDate: '2026-06-01' },
  { id: 'rr-9', regulation: 'HIPAA', requirement: 'BAA with all subprocessors', productTypes: ['Healthcare Software'], stages: ['production', 'market'], status: 'non_compliant', evidence: null, dueDate: '2026-05-15' },
  { id: 'rr-10', regulation: 'Cyber Resilience Act', requirement: 'Vulnerability handling process', productTypes: ['IoT Device', 'Network Appliance', 'Software Platform', 'Edge Computing'], stages: ['production', 'market', 'maintenance'], status: 'compliant', evidence: 'Process documented', dueDate: null },
  { id: 'rr-11', regulation: 'Cyber Resilience Act', requirement: 'SBOM provision', productTypes: ['IoT Device', 'Network Appliance', 'Software Platform', 'Edge Computing', 'AI/ML System'], stages: ['production', 'market'], status: 'partial', evidence: 'd-9', dueDate: '2026-04-01' },
  { id: 'rr-12', regulation: 'Digital Product Passport', requirement: 'Product sustainability data', productTypes: ['IoT Device', 'Network Appliance'], stages: ['production', 'market'], status: 'compliant', evidence: 'd-5', dueDate: null },
];

const EOL_POLICIES: EOLPolicy[] = [
  { id: 'eol-1', productId: 'p-6', announcementDate: '2025-12-01', eolDate: '2026-06-01', eosDate: '2026-12-01', customerNotifications: 142, totalCustomers: 189, migrationPath: 'CloudBridge v2 (CBC-250)', status: 'announced' },
  { id: 'eol-2', productId: 'p-8', announcementDate: '2025-06-15', eolDate: '2025-09-01', eosDate: '2025-12-31', customerNotifications: 56, totalCustomers: 56, migrationPath: 'AI Assistant Module (AIM-100)', status: 'completed' },
];

const ENVIRONMENTAL_METRICS: EnvironmentalMetric[] = [
  { id: 'em-1', productId: 'p-1', stage: 'production', carbonFootprint: 12.5, energyConsumption: 45, wasteGenerated: 2.1, recyclabilityScore: 78, unit: 'per unit' },
  { id: 'em-2', productId: 'p-1', stage: 'market', carbonFootprint: 3.2, energyConsumption: 18, wasteGenerated: 0.5, recyclabilityScore: 78, unit: 'annual per unit' },
  { id: 'em-3', productId: 'p-4', stage: 'production', carbonFootprint: 28.0, energyConsumption: 95, wasteGenerated: 4.8, recyclabilityScore: 65, unit: 'per unit' },
  { id: 'em-4', productId: 'p-2', stage: 'maintenance', carbonFootprint: 0.8, energyConsumption: 120, wasteGenerated: 0, recyclabilityScore: 100, unit: 'monthly' },
];

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'portfolio', label: 'Portfolio', icon: <Layers className="w-4 h-4" /> },
  { id: 'details', label: 'Product Details', icon: <Package className="w-4 h-4" /> },
  { id: 'lifecycle', label: 'Lifecycle Map', icon: <Workflow className="w-4 h-4" /> },
  { id: 'compliance', label: 'Compliance Matrix', icon: <Shield className="w-4 h-4" /> },
  { id: 'documents', label: 'Documents', icon: <FolderOpen className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBg = (score: number): string => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-blue-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getRiskStyles = (risk: string): string => {
  switch (risk) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getCeStyles = (status: string): string => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'expired': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-500';
  }
};

const getDocStatusStyles = (status: string): string => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'review': return 'bg-blue-100 text-blue-800';
    case 'draft': return 'bg-yellow-100 text-yellow-800';
    case 'archived': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getRegStatusStyles = (status: string): string => {
  switch (status) {
    case 'compliant': return 'bg-green-100 text-green-800';
    case 'partial': return 'bg-yellow-100 text-yellow-800';
    case 'non_compliant': return 'bg-red-100 text-red-800';
    case 'not_applicable': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getMilestoneStyles = (status: string): string => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'waived': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ---------------------------------------------------------------------------
// API mapping
// ---------------------------------------------------------------------------

const VALID_STAGES = new Set<string>(STAGE_ORDER);

const riskLevelFromClassification = (cls?: string | null): Product['riskLevel'] => {
  switch ((cls || '').toLowerCase()) {
    case 'class_iii': return 'critical';
    case 'class_ii': return 'high';
    case 'class_i': return 'medium';
    default: return 'low';
  }
};

const ceStatusFromApi = (v?: string | null): Product['ceMarkingStatus'] => {
  const s = (v || '').toLowerCase();
  if (s === 'approved' || s === 'in_progress' || s === 'expired' || s === 'not_started') {
    return s as Product['ceMarkingStatus'];
  }
  return 'not_started';
};

/** Map a ProductLifecycle API record onto the view-model used by this screen. */
const mapApiProduct = (p: any): Product => {
  const stage = VALID_STAGES.has(p?.currentStage) ? (p.currentStage as LifecycleStage) : 'concept';
  return {
    id: String(p?.id ?? ''),
    name: p?.productName ?? 'Untitled Product',
    sku: p?.productCode ?? '—',
    version: p?.version ?? '—',
    type: p?.productType ?? p?.type ?? 'Product',
    stage,
    complianceScore: typeof p?.complianceScore === 'number' ? Math.round(p.complianceScore) : 0,
    ceMarkingStatus: ceStatusFromApi(p?.ceMarkingStatus),
    dppId: p?.dppId ?? null,
    sbomVersion: p?.sbomVersion ?? null,
    owner: p?.owner ?? p?.createdBy ?? '—',
    team: p?.team ?? '—',
    createdAt: (p?.createdAt ?? '').toString().split('T')[0] || '',
    updatedAt: (p?.updatedAt ?? '').toString().split('T')[0] || '',
    targetLaunch: (p?.marketEntry ?? '').toString().split('T')[0] || '—',
    description: p?.description ?? '',
    riskLevel: riskLevelFromClassification(p?.riskClassification),
    tags: Array.isArray(p?.tags) ? p.tags : [],
  };
};

/** Extract product-scoped documents from the API record's JSON `documents` field. */
const mapApiDocuments = (p: any): ProductDocument[] => {
  if (!Array.isArray(p?.documents)) return [];
  return p.documents.map((d: any, i: number): ProductDocument => ({
    id: String(d?.id ?? `${p.id}-doc-${i}`),
    productId: String(p?.id ?? ''),
    name: d?.name ?? 'Document',
    type: d?.type ?? 'FILE',
    stage: VALID_STAGES.has(d?.stage) ? (d.stage as LifecycleStage) : (VALID_STAGES.has(p?.currentStage) ? p.currentStage : 'concept'),
    version: d?.version ?? '1.0',
    uploadedBy: d?.uploadedBy ?? '—',
    uploadedAt: (d?.uploadDate ?? d?.uploadedAt ?? '').toString().split('T')[0] || '',
    size: d?.size ?? '—',
    status: d?.status ?? 'draft',
  }));
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProductLifecycleTracker: React.FC<ProductLifecycleTrackerProps> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('portfolio');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<LifecycleStage | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [docStageFilter, setDocStageFilter] = useState<LifecycleStage | 'all'>('all');
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [showEolModal, setShowEolModal] = useState(false);
  const [selectedEol, setSelectedEol] = useState<EOLPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [extraDocs, setExtraDocs] = useState<ProductDocument[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[] | null>(null);
  const [apiDocuments, setApiDocuments] = useState<ProductDocument[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.modules.productLifecycle.listProducts();
      if (Array.isArray(data) && data.length > 0) {
        setApiProducts(data.map(mapApiProduct));
        setApiDocuments(data.flatMap(mapApiDocuments));
      } else {
        // No products on record yet — fall back to the reference catalog.
        setApiProducts(null);
        setApiDocuments([]);
      }
      setLoadError(null);
    } catch (err: any) {
      setApiProducts(null);
      setApiDocuments([]);
      setLoadError('Unable to load products from the server. Showing reference catalog.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Active dataset: real products when available, reference catalog otherwise.
  const activeProducts = apiProducts ?? PRODUCTS;
  const usingApiData = apiProducts !== null;

  // Computed
  const filteredProducts = useMemo(() => {
    let list = [...activeProducts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
    }
    if (stageFilter !== 'all') list = list.filter(p => p.stage === stageFilter);
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
    return list;
  }, [activeProducts, searchQuery, stageFilter, typeFilter]);

  const productTypes = useMemo(() => [...new Set(activeProducts.map(p => p.type))], [activeProducts]);

  const portfolioStats = useMemo(() => {
    const total = activeProducts.length;
    const avgScore = total > 0 ? Math.round(activeProducts.reduce((a, p) => a + p.complianceScore, 0) / total) : 0;
    const highRisk = activeProducts.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;
    const ceMarked = activeProducts.filter(p => p.ceMarkingStatus === 'approved').length;
    return { total, avgScore, highRisk, ceMarked };
  }, [activeProducts]);

  // Documents: API-provided when real data is loaded (plus session uploads),
  // otherwise the reference catalog.
  const allDocuments = useMemo(
    () => [...extraDocs, ...(usingApiData ? apiDocuments : DOCUMENTS)],
    [extraDocs, usingApiData, apiDocuments],
  );

  const selectedProductDocs = useMemo(() => {
    if (!selectedProduct) return allDocuments;
    let docs = allDocuments.filter(d => d.productId === selectedProduct.id);
    if (docStageFilter !== 'all') docs = docs.filter(d => d.stage === docStageFilter);
    return docs;
  }, [selectedProduct, docStageFilter, allDocuments]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetProduct = selectedProduct || activeProducts[0] || null;
    const productId = targetProduct?.id || 'unknown';
    const stage = targetProduct?.stage || 'concept';
    const uploadDate = new Date().toISOString().split('T')[0];
    const size = file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / 1048576).toFixed(1)} MB`;
    const newDoc: ProductDocument = {
      id: `doc-${Date.now()}`,
      productId,
      name: file.name,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      stage: stage as any,
      version: '1.0',
      uploadedBy: 'Current User',
      uploadedAt: uploadDate,
      size,
      status: 'draft',
    };

    // Show the uploaded document immediately for a responsive UI.
    setExtraDocs(prev => [newDoc, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Persist document metadata to the product-lifecycle record's `documents` JSON
    // field. The raw file bytes are not uploaded to object storage (no such endpoint
    // exists); only the descriptive metadata is stored, matching the model's shape.
    if (!usingApiData || !targetProduct) return;
    try {
      const existingForProduct = apiDocuments.filter(d => d.productId === productId);
      const documents = [
        {
          id: newDoc.id,
          name: newDoc.name,
          type: newDoc.type,
          version: newDoc.version,
          uploadDate,
          uploadedBy: newDoc.uploadedBy,
          stage: newDoc.stage,
          status: newDoc.status,
          size: newDoc.size,
        },
        ...existingForProduct.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          version: d.version,
          uploadDate: d.uploadedAt,
          uploadedBy: d.uploadedBy,
          stage: d.stage,
          status: d.status,
          size: d.size,
        })),
      ];
      await api.modules.productLifecycle.updateProduct(productId, { documents });
      // Reload so the persisted documents (read back via mapApiDocuments) replace the
      // session-only entry and stay consistent across remounts.
      setExtraDocs(prev => prev.filter(d => d.id !== newDoc.id));
      await loadProducts();
    } catch {
      setLoadError('Failed to persist document metadata to the server. The entry is retained for this session only.');
    }
  }, [selectedProduct, activeProducts, usingApiData, apiDocuments, loadProducts]);

  const selectedProductMilestones = useMemo(() => {
    if (usingApiData) return MILESTONES.filter(m => m.productId === (selectedProduct?.id ?? ''));
    if (!selectedProduct) return MILESTONES;
    return MILESTONES.filter(m => m.productId === selectedProduct.id);
  }, [selectedProduct, usingApiData]);

  const selectedProductReqs = useMemo(() => {
    // For real (API-backed) products, never substitute the demo regulatory catalog:
    // its statuses are illustrative and would be shown as that product's real Compliance
    // Matrix. Until the backend returns per-product requirements, show an empty state.
    if (usingApiData) return [] as RegulatoryRequirement[];
    if (!selectedProduct) return REGULATORY_REQUIREMENTS;
    return REGULATORY_REQUIREMENTS.filter(r => r.productTypes.includes(selectedProduct.type));
  }, [selectedProduct, usingApiData]);

  const toggleMilestone = useCallback((id: string) => {
    setExpandedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setActiveTab('details');
  }, []);

  // Export the current product portfolio as a JSON file.
  const handleExportProducts = useCallback(() => {
    const payload = { exportedAt: new Date().toISOString(), products: activeProducts };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-lifecycle-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeProducts]);

  // Create a new product record, then refresh the portfolio from the server.
  const handleNewProduct = useCallback(async () => {
    const name = window.prompt('Product name');
    if (!name || !name.trim()) return;
    try {
      await api.modules.productLifecycle.createProduct({ productName: name.trim(), currentStage: 'concept' });
      await loadProducts();
      setLoadError(null);
    } catch (err: any) {
      setLoadError('Unable to create the product. Please try again.');
    }
  }, [loadProducts]);

  // Persist a stage change for the selected product (the update contract supports currentStage).
  const handleAdvanceStage = useCallback(async (product: Product) => {
    const idx = STAGE_ORDER.indexOf(product.stage);
    const nextStage = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
    if (!usingApiData) {
      setSelectedProduct({ ...product, stage: nextStage });
      return;
    }
    try {
      await api.modules.productLifecycle.updateProduct(product.id, { currentStage: nextStage });
      await loadProducts();
      setSelectedProduct(prev => (prev ? { ...prev, stage: nextStage } : prev));
      setLoadError(null);
    } catch (err: any) {
      setLoadError('Unable to update the product stage. Please try again.');
    }
  }, [usingApiData, loadProducts]);

  // Open a document's source URL when one is available.
  const handleOpenDocument = useCallback((doc: ProductDocument & { url?: string }) => {
    if (doc.url) {
      window.open(doc.url, '_blank', 'noopener,noreferrer');
    } else {
      setLoadError(`No stored file is available for "${doc.name}".`);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Tab: Portfolio
  // ---------------------------------------------------------------------------
  const renderPortfolio = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('common.total')} Products</span>
            <Package className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{portfolioStats.total}</div>
          <div className="text-xs text-gray-400 mt-1">{productTypes.length} product types</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Avg Compliance</span>
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(portfolioStats.avgScore)}`}>{portfolioStats.avgScore}%</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${getScoreBg(portfolioStats.avgScore)}`} style={{ width: `${portfolioStats.avgScore}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">High Risk</span>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-orange-600">{portfolioStats.highRisk}</div>
          <div className="text-xs text-gray-400 mt-1">requiring attention</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">CE Marked</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-600">{portfolioStats.ceMarked}</div>
          <div className="text-xs text-gray-400 mt-1">certified products</div>
        </div>
      </div>

      {/* Stage Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Workflow className="w-5 h-5 text-indigo-500" />
          Lifecycle Stage Distribution
        </h3>
        <div className="flex gap-2 flex-wrap">
          {STAGE_ORDER.map(stage => {
            const count = activeProducts.filter(p => p.stage === stage).length;
            return (
              <button key={stage} onClick={() => setStageFilter(stageFilter === stage ? 'all' : stage)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  stageFilter === stage ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}>
                <div className={`w-3 h-3 rounded-full ${STAGE_COLORS[stage]}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{STAGE_LABELS[stage]}</span>
                <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder={`${t('common.search')}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
          <option value="all">{t('common.all')} Types</option>
          {productTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
        </select>
        {(stageFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
          <button onClick={() => { setStageFilter('all'); setTypeFilter('all'); setSearchQuery(''); }}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1">
            <X className="w-4 h-4" /> Clear Filters
          </button>
        )}
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} onClick={() => selectProduct(product)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{product.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku} | v{product.version}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STAGE_BG_LIGHT[product.stage]}`}>
                  {STAGE_LABELS[product.stage]}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{product.type}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRiskStyles(product.riskLevel)}`}>{product.riskLevel} risk</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCeStyles(product.ceMarkingStatus)}`}>
                  CE: {product.ceMarkingStatus.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Compliance:</span>
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${getScoreBg(product.complianceScore)}`} style={{ width: `${product.complianceScore}%` }} />
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(product.complianceScore)}`}>{product.complianceScore}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Users className="w-3.5 h-3.5" /> {product.owner}
                </div>
              </div>
              {product.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {product.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No products match the current filters.</p>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Tab: Product Details
  // ---------------------------------------------------------------------------
  const renderDetails = () => {
    if (!selectedProduct) {
      return (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Product Selected</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Select a product from the Portfolio tab to view details.</p>
          <button onClick={() => setActiveTab('portfolio')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
            Go to Portfolio
          </button>
        </div>
      );
    }

    const product = selectedProduct;
    // For API-backed products, never substitute the illustrative module-level
    // catalogs (milestones / EOL / environmental). These are keyed by demo ids and
    // would otherwise surface against a real product on an id collision. Until the
    // backend returns these per product, show empty states for API-backed products
    // (consistent with the Compliance Matrix guard).
    const eolPolicy = usingApiData ? undefined : EOL_POLICIES.find(e => e.productId === product.id);
    const envMetrics = usingApiData ? [] : ENVIRONMENTAL_METRICS.filter(e => e.productId === product.id);
    const milestones = usingApiData ? [] : MILESTONES.filter(m => m.productId === product.id);
    const docs = allDocuments.filter(d => d.productId === product.id);

    return (
      <div className="space-y-6">
        {/* Product Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h2>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STAGE_BG_LIGHT[product.stage]}`}>
                  {STAGE_LABELS[product.stage]}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku} | Version {product.version} | {product.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleAdvanceStage(product)} title="Advance to next lifecycle stage"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Edit3 className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={() => setActiveTab('lifecycle')} title="Open lifecycle map"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{product.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Compliance Score</div>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getScoreBg(product.complianceScore)}`} style={{ width: `${product.complianceScore}%` }} />
                </div>
                <span className={`text-lg font-bold ${getScoreColor(product.complianceScore)}`}>{product.complianceScore}%</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risk Level</div>
              <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${getRiskStyles(product.riskLevel)}`}>{product.riskLevel}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">CE Marking</div>
              <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${getCeStyles(product.ceMarkingStatus)}`}>
                {product.ceMarkingStatus.replace('_', ' ')}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('common.owner')}</div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">{product.owner}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Team</div>
              <span className="text-sm text-gray-900 dark:text-white">{product.team}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">DPP ID</div>
              <span className="text-sm text-gray-900 dark:text-white">{product.dppId || 'Not assigned'}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">SBOM Version</div>
              <span className="text-sm text-gray-900 dark:text-white">{product.sbomVersion || 'Not generated'}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Launch</div>
              <span className="text-sm text-gray-900 dark:text-white">{product.targetLaunch}</span>
            </div>
          </div>
        </div>

        {/* Milestones & Gates */}
        {milestones.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
                Approval Gates &amp; Milestones
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {milestones.map(ms => (
                <div key={ms.id} className="px-5 py-3">
                  <button onClick={() => toggleMilestone(ms.id)} className="w-full flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      {ms.status === 'approved' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                       ms.status === 'rejected' ? <XCircle className="w-5 h-5 text-red-500" /> :
                       <Clock className="w-5 h-5 text-yellow-500" />}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ms.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STAGE_BG_LIGHT[ms.stage]}`}>{STAGE_LABELS[ms.stage]}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getMilestoneStyles(ms.status)}`}>{ms.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{ms.approver}</span>
                      {expandedMilestones.has(ms.id) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {expandedMilestones.has(ms.id) && (
                    <div className="mt-3 pl-8 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                      <p>{ms.notes}</p>
                      {ms.approvalDate && <p className="text-xs text-gray-400 mt-2">{t('common.approved')}: {ms.approvalDate}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Version History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-500" />
              Version History
            </h3>
          </div>
          <div className="p-5">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              {(usingApiData
                // API-backed products: only the actual current version is known.
                // The backend does not yet return a per-version changelog, so we do
                // not synthesize intermediate releases for a real product.
                ? [
                    { version: product.version, date: product.updatedAt, note: 'Current version', tag: 'latest' as string | null },
                  ]
                : [
                    { version: product.version, date: product.updatedAt, note: 'Current version', tag: 'latest' as string | null },
                    { version: '2.3.0', date: '2025-11-15', note: 'Security patches and compliance updates', tag: null },
                    { version: '2.0.0', date: '2025-06-01', note: 'Major release with new compliance features', tag: 'major' },
                    { version: '1.0.0', date: product.createdAt, note: 'Initial release', tag: 'initial' },
                  ]
              ).map((v, idx) => (
                <div key={idx} className="relative pl-10 pb-5 last:pb-0">
                  <div className={`absolute left-2.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${idx === 0 ? 'bg-indigo-500' : 'bg-gray-400'}`} />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">v{v.version}</span>
                    {v.tag && <span className={`text-xs px-1.5 py-0.5 rounded ${v.tag === 'latest' ? 'bg-green-100 text-green-700' : v.tag === 'major' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{v.tag}</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.date} -- {v.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* EOL Policy */}
        {eolPolicy && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
            <div className="px-5 py-4 border-b border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-t-xl">
              <h3 className="font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                <Archive className="w-5 h-5" />
                End-of-Life Policy
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">EOL Date</div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{eolPolicy.eolDate}</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">End of Support</div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{eolPolicy.eosDate}</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Migration Path</div>
                  <span className="text-sm text-indigo-600">{eolPolicy.migrationPath}</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('common.status')}</div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    eolPolicy.status === 'completed' ? 'bg-green-100 text-green-800' :
                    eolPolicy.status === 'active' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{eolPolicy.status}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Customer Notification Progress</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${(eolPolicy.customerNotifications / eolPolicy.totalCustomers) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{eolPolicy.customerNotifications}/{eolPolicy.totalCustomers}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Environmental Impact */}
        {envMetrics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" />
                Environmental Impact
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {envMetrics.map(em => (
                  <div key={em.id} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STAGE_BG_LIGHT[em.stage]}`}>{STAGE_LABELS[em.stage]}</span>
                      <span className="text-xs text-gray-400">{em.unit}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Carbon Footprint</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{em.carbonFootprint} kg CO2</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Energy</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{em.energyConsumption} kWh</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Waste</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{em.wasteGenerated} kg</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Recyclability</div>
                        <div className="text-sm font-semibold text-green-600">{em.recyclabilityScore}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Related Documents Quick View */}
        {docs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Related Documents ({docs.length})
              </h3>
              <button onClick={() => setActiveTab('documents')} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {docs.slice(0, 4).map(doc => (
                <div key={doc.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                      <p className="text-xs text-gray-400">v{doc.version} | {doc.size} | {doc.uploadedAt}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDocStatusStyles(doc.status)}`}>{doc.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Tab: Lifecycle Map
  // ---------------------------------------------------------------------------
  const renderLifecycleMap = () => {
    const product = selectedProduct || activeProducts[0];
    if (!product) {
      return (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Workflow className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No products available to map.</p>
        </div>
      );
    }
    const currentStageIdx = STAGE_ORDER.indexOf(product.stage);
    const stageReqs = (stage: LifecycleStage) => STAGE_REQUIREMENTS.filter(r => r.stage === stage);

    return (
      <div className="space-y-6">
        {/* Product Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Product:</span>
            <select value={product.id} onChange={e => { const p = activeProducts.find(pr => pr.id === e.target.value); if (p) setSelectedProduct(p); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm flex-1">
              {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({STAGE_LABELS[p.stage]})</option>)}
            </select>
          </div>
        </div>

        {/* Visual Lifecycle Map */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            Lifecycle Progress: {product.name}
          </h3>

          {/* Stage Pipeline */}
          <div className="flex items-center gap-0 overflow-x-auto pb-3">
            {STAGE_ORDER.map((stage, idx) => {
              const isCompleted = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              const isFuture = idx > currentStageIdx;
              return (
                <React.Fragment key={stage}>
                  <div className={`flex flex-col items-center min-w-[90px] ${isCurrent ? 'scale-110' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all ${
                      isCompleted ? 'bg-green-500' : isCurrent ? STAGE_COLORS[stage] + ' ring-4 ring-offset-2 ring-indigo-200 dark:ring-indigo-800' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                    </div>
                    <span className={`text-xs mt-2 text-center font-medium ${
                      isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>{STAGE_LABELS[stage]}</span>
                  </div>
                  {idx < STAGE_ORDER.length - 1 && (
                    <div className={`h-0.5 w-6 flex-shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Per-Stage Requirements */}
        <div className="space-y-4">
          {STAGE_ORDER.map((stage, idx) => {
            const reqs = stageReqs(stage);
            if (reqs.length === 0) return null;
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const completedCount = reqs.filter(r => r.completed).length;

            return (
              <div key={stage} className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm ${
                isCurrent ? 'border-indigo-300 dark:border-indigo-600' : 'border-gray-200 dark:border-gray-700'
              }`}>
                <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${STAGE_COLORS[stage]}`} />
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{STAGE_LABELS[stage]}</h4>
                    {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">Current Stage</span>}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{completedCount}/{reqs.length} completed</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {reqs.map(req => (
                    <div key={req.id} className="px-5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {req.completed ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <CircleDot className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        <div>
                          <p className={`text-sm ${req.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{req.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{req.category}</span>
                            {req.mandatory && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">{t('common.required')}</span>}
                            {req.dueDate && !req.completed && <span className="text-xs text-orange-500 flex items-center gap-0.5"><Clock className="w-3 h-3" /> {req.dueDate}</span>}
                          </div>
                        </div>
                      </div>
                      {req.assignee && <span className="text-xs text-gray-400">{req.assignee}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Tab: Compliance Matrix
  // ---------------------------------------------------------------------------
  const renderComplianceMatrix = () => {
    const product = selectedProduct;
    // Use the shared selector so real (API-backed) products never render the illustrative
    // demo catalog as their compliance status; it returns [] until the backend supplies
    // per-product requirements.
    const reqs = selectedProductReqs;
    const regulations = [...new Set(reqs.map(r => r.regulation))];

    const statusCounts = {
      compliant: reqs.filter(r => r.status === 'compliant').length,
      partial: reqs.filter(r => r.status === 'partial').length,
      non_compliant: reqs.filter(r => r.status === 'non_compliant').length,
      not_applicable: reqs.filter(r => r.status === 'not_applicable').length,
    };

    return (
      <div className="space-y-6">
        {/* Product Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Product:</span>
            <select value={product?.id || ''} onChange={e => { const p = activeProducts.find(pr => pr.id === e.target.value); setSelectedProduct(p || null); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm flex-1">
              <option value="">{t('common.all')} Products</option>
              {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
            </select>
          </div>
        </div>

        {/* Compliance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Compliant</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.compliant}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Partial</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.partial}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Non-Compliant</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{statusCounts.non_compliant}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
            </div>
            <div className="text-2xl font-bold text-gray-400">{statusCounts.not_applicable}</div>
          </div>
        </div>

        {/* Regulation-grouped Requirements */}
        {regulations.map(reg => {
          const regReqs = reqs.filter(r => r.regulation === reg);
          return (
            <div key={reg} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  {reg}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">{regReqs.filter(r => r.status === 'compliant').length} compliant</span>
                  {regReqs.filter(r => r.status === 'non_compliant').length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">{regReqs.filter(r => r.status === 'non_compliant').length} non-compliant</span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                      <th className="px-5 py-2.5 text-left font-medium">Requirement</th>
                      <th className="px-5 py-2.5 text-center font-medium">{t('common.status')}</th>
                      <th className="px-5 py-2.5 text-center font-medium">Applicable Stages</th>
                      <th className="px-5 py-2.5 text-center font-medium">Due Date</th>
                      <th className="px-5 py-2.5 text-center font-medium">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {regReqs.map(req => (
                      <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-900 dark:text-white">{req.requirement}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRegStatusStyles(req.status)}`}>
                            {req.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {req.stages.map(s => (
                              <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded border ${STAGE_BG_LIGHT[s]}`}>{STAGE_LABELS[s]}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{req.dueDate || '--'}</td>
                        <td className="px-5 py-3 text-center">
                          {req.evidence ? (
                            <span className="text-xs text-indigo-600 flex items-center justify-center gap-1"><FileText className="w-3 h-3" /> Available</span>
                          ) : (
                            <span className="text-xs text-gray-400">Missing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {reqs.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
            <Shield className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No regulatory requirements are recorded for this product yet.
            </p>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Tab: Documents
  // ---------------------------------------------------------------------------
  const renderDocuments = () => {
    const docs = selectedProduct
      ? allDocuments.filter(d => d.productId === selectedProduct.id)
      : allDocuments;
    const filteredDocs = docStageFilter !== 'all'
      ? docs.filter(d => d.stage === docStageFilter)
      : docs;

    return (
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Product:</span>
            <select value={selectedProduct?.id || ''} onChange={e => { const p = activeProducts.find(pr => pr.id === e.target.value); setSelectedProduct(p || null); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
              <option value="">{t('common.all')} Products</option>
              {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Stage:</span>
            <select value={docStageFilter} onChange={e => setDocStageFilter(e.target.value as LifecycleStage | 'all')}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
              <option value="all">{t('common.all')} Stages</option>
              {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="ml-auto px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>

        {/* Document Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Documents', value: docs.length, icon: <FileText className="w-5 h-5 text-indigo-500" /> },
            { label: t('common.approved'), value: docs.filter(d => d.status === 'approved').length, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
            { label: 'In Review', value: docs.filter(d => d.status === 'review').length, icon: <Clock className="w-5 h-5 text-blue-500" /> },
            { label: 'Drafts', value: docs.filter(d => d.status === 'draft').length, icon: <Edit3 className="w-5 h-5 text-yellow-500" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Document List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-500" />
              Documents {selectedProduct ? `for ${selectedProduct.name}` : '(All Products)'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  <th className="px-5 py-2.5 text-left font-medium">Document</th>
                  <th className="px-5 py-2.5 text-center font-medium">{t('common.type')}</th>
                  <th className="px-5 py-2.5 text-center font-medium">Stage</th>
                  <th className="px-5 py-2.5 text-center font-medium">{t('common.version')}</th>
                  <th className="px-5 py-2.5 text-center font-medium">{t('common.status')}</th>
                  <th className="px-5 py-2.5 text-center font-medium">Uploaded</th>
                  <th className="px-5 py-2.5 text-center font-medium">Size</th>
                  <th className="px-5 py-2.5 text-center font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredDocs.map(doc => {
                  const product = activeProducts.find(p => p.id === doc.productId);
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                          {!selectedProduct && product && <p className="text-xs text-gray-400">{product.name}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{doc.type}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STAGE_BG_LIGHT[doc.stage]}`}>{STAGE_LABELS[doc.stage]}</span>
                      </td>
                      <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-300">v{doc.version}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDocStatusStyles(doc.status)}`}>{doc.status}</span>
                      </td>
                      <td className="px-5 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{doc.uploadedAt}</td>
                      <td className="px-5 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{doc.size}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenDocument(doc as ProductDocument & { url?: string })} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          <button onClick={() => handleOpenDocument(doc as ProductDocument & { url?: string })} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Download">
                            <Download className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredDocs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No documents found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  Product Lifecycle Tracker
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Track products from concept through decommissioning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportProducts} className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={handleNewProduct} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> New Product
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">{t('common.loading')}...</span>
          </div>
        )}
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span className="text-sm text-amber-700">{loadError}</span>
            <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-700"><X size={14} /></button>
          </div>
        )}
        {activeTab === 'portfolio' && renderPortfolio()}
        {activeTab === 'details' && renderDetails()}
        {activeTab === 'lifecycle' && renderLifecycleMap()}
        {activeTab === 'compliance' && renderComplianceMatrix()}
        {activeTab === 'documents' && renderDocuments()}
      </div>
    </div>
  );
};

export default ProductLifecycleTracker;
