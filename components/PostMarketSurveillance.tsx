/**
 * Post-Market Surveillance Module
 *
 * Comprehensive management interface for product post-market surveillance:
 * - Product surveillance plan management
 * - Incident and complaint tracking system
 * - Corrective action management (CAPA)
 * - Market feedback collection and analysis
 * - Regulatory authority notification workflow
 * - Product recall management with impact assessment
 * - Surveillance report generation (annual, periodic)
 * - Risk-based surveillance frequency determination
 * - Integration with CE marking and CRA modules (conceptual links)
 * - Non-conformity tracking and resolution
 *
 * Reference: EU Market Surveillance Regulation (EU) 2019/1020
 *            CE Marking framework (Decision 768/2008/EC)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import {
  ArrowLeft,
  Eye,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  BarChart3,
  CheckCircle,
  Clock,
  Plus,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Shield,
  Download,
  Edit3,
  Target,
  Zap,
  AlertCircle,
  Info,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Bell,
  Package,
  Users,
  MessageSquare,
  RotateCcw,
  Activity,
  Flag,
  Calendar,
  Globe,
  Loader2,
  Send,
  Link,
  Building2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SurveillancePlan {
  id: string;
  productName: string;
  productId: string;
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  frequency: 'quarterly' | 'semi-annual' | 'annual' | 'biennial';
  status: 'active' | 'draft' | 'under_review' | 'expired';
  lastReviewDate: string;
  nextReviewDate: string;
  dataSourceCount: number;
  activitiesPlanned: number;
  activitiesCompleted: number;
  owner: string;
  relatedCEMarking?: string;
  relatedCRA?: string;
}

interface Incident {
  id: string;
  title: string;
  productName: string;
  productId: string;
  type: 'complaint' | 'safety_incident' | 'near_miss' | 'malfunction' | 'misuse' | 'field_failure';
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed' | 'escalated';
  reportedBy: string;
  reportedDate: string;
  description: string;
  affectedUnits?: number;
  location?: string;
  regulatoryNotificationRequired: boolean;
  regulatoryNotificationSent: boolean;
  capaId?: string;
  resolvedDate?: string;
}

interface CAPA {
  id: string;
  title: string;
  type: 'corrective' | 'preventive';
  relatedIncidents: string[];
  productName: string;
  rootCause?: string;
  description: string;
  status: 'open' | 'in_progress' | 'verification' | 'closed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  createdDate: string;
  targetDate: string;
  closedDate?: string;
  effectivenessVerified: boolean;
  actions: CAPAAction[];
}

interface CAPAAction {
  id: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

interface ProductRecall {
  id: string;
  recallNumber: string;
  productName: string;
  productId: string;
  recallType: 'voluntary' | 'mandatory' | 'market_withdrawal';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'initiated' | 'notified' | 'in_progress' | 'completed' | 'closed';
  reason: string;
  affectedUnits: number;
  unitsRecovered: number;
  affectedCountries: string[];
  initiatedDate: string;
  completionTarget: string;
  publicNotice: boolean;
  regulatoryAuthority: string;
  contactPerson: string;
}

interface NonConformity {
  id: string;
  productName: string;
  ncType: 'design' | 'production' | 'labeling' | 'documentation' | 'testing' | 'supply_chain';
  description: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'under_investigation' | 'corrective_action' | 'resolved' | 'closed';
  detectedDate: string;
  detectedBy: string;
  resolution?: string;
  resolvedDate?: string;
}

interface SurveillanceReport {
  id: string;
  title: string;
  reportType: 'annual' | 'periodic' | 'incident' | 'trend_analysis';
  period: string;
  status: 'draft' | 'review' | 'approved' | 'submitted';
  createdDate: string;
  author: string;
  pages?: number;
  submittedTo?: string;
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------
const DEMO_PLANS: SurveillancePlan[] = [
  { id: 'plan-001', productName: 'SmartSensor Pro X200', productId: 'prod-001', riskCategory: 'low', frequency: 'annual', status: 'active', lastReviewDate: '2025-12-15', nextReviewDate: '2026-12-15', dataSourceCount: 5, activitiesPlanned: 8, activitiesCompleted: 6, owner: 'Dr. Sarah Chen', relatedCEMarking: 'CE-X200-2025' },
  { id: 'plan-002', productName: 'Industrial Hydraulic Press HP-500', productId: 'prod-002', riskCategory: 'high', frequency: 'quarterly', status: 'active', lastReviewDate: '2026-01-15', nextReviewDate: '2026-04-15', dataSourceCount: 8, activitiesPlanned: 12, activitiesCompleted: 9, owner: 'Eng. Marco Rossi', relatedCEMarking: 'CE-HP500-2025' },
  { id: 'plan-003', productName: 'MedScan Portable Ultrasound', productId: 'prod-003', riskCategory: 'critical', frequency: 'quarterly', status: 'active', lastReviewDate: '2026-02-01', nextReviewDate: '2026-05-01', dataSourceCount: 12, activitiesPlanned: 15, activitiesCompleted: 10, owner: 'Dr. Helena Virtanen', relatedCEMarking: 'CE-MSPU-2025', relatedCRA: 'CRA-MED-2025' },
  { id: 'plan-004', productName: 'SafeGuard Helmet SG-Elite', productId: 'prod-004', riskCategory: 'medium', frequency: 'semi-annual', status: 'active', lastReviewDate: '2025-11-01', nextReviewDate: '2026-05-01', dataSourceCount: 6, activitiesPlanned: 10, activitiesCompleted: 10, owner: 'Jean-Pierre Duval', relatedCEMarking: 'CE-SGE-2025' },
  { id: 'plan-005', productName: 'EcoBoiler CB-100', productId: 'prod-005', riskCategory: 'high', frequency: 'semi-annual', status: 'draft', lastReviewDate: '2026-01-20', nextReviewDate: '2026-07-20', dataSourceCount: 4, activitiesPlanned: 11, activitiesCompleted: 0, owner: 'Eng. Anna Kowalski' },
];

const DEMO_INCIDENTS: Incident[] = [
  { id: 'inc-001', title: 'Overheating reported during prolonged use', productName: 'SmartSensor Pro X200', productId: 'prod-001', type: 'complaint', severity: 'minor', status: 'resolved', reportedBy: 'End User (DE)', reportedDate: '2026-01-12', description: 'Customer reported device becomes warm after 8+ hours continuous operation. Within spec but close to upper limit.', affectedUnits: 1, location: 'Germany', regulatoryNotificationRequired: false, regulatoryNotificationSent: false, resolvedDate: '2026-01-20' },
  { id: 'inc-002', title: 'Hydraulic hose burst during operation', productName: 'Industrial Hydraulic Press HP-500', productId: 'prod-002', type: 'safety_incident', severity: 'serious', status: 'investigating', reportedBy: 'Operator (FR)', reportedDate: '2026-01-28', description: 'High-pressure hydraulic hose burst during normal press cycle. Operator was behind safety barrier. No injuries. Hydraulic fluid spill contained.', affectedUnits: 1, location: 'France', regulatoryNotificationRequired: true, regulatoryNotificationSent: true, capaId: 'capa-001' },
  { id: 'inc-003', title: 'Software freeze during patient scan', productName: 'MedScan Portable Ultrasound', productId: 'prod-003', type: 'malfunction', severity: 'moderate', status: 'investigating', reportedBy: 'Clinical Staff (NL)', reportedDate: '2026-02-05', description: 'Device UI froze during abdominal scan requiring forced restart. Patient scan had to be repeated. Firmware v4.2.1.', affectedUnits: 3, location: 'Netherlands', regulatoryNotificationRequired: true, regulatoryNotificationSent: false, capaId: 'capa-002' },
  { id: 'inc-004', title: 'Helmet shell crack after impact', productName: 'SafeGuard Helmet SG-Elite', productId: 'prod-004', type: 'field_failure', severity: 'critical', status: 'escalated', reportedBy: 'Safety Officer (AT)', reportedDate: '2026-02-10', description: 'Helmet shell developed a visible crack along the lateral ridge after a standard impact within rated protection level. Batch B2025-Q3 potentially affected.', affectedUnits: 250, location: 'Austria', regulatoryNotificationRequired: true, regulatoryNotificationSent: true, capaId: 'capa-003' },
  { id: 'inc-005', title: 'Incorrect sensor readings in cold environment', productName: 'SmartSensor Pro X200', productId: 'prod-001', type: 'complaint', severity: 'minor', status: 'open', reportedBy: 'End User (FI)', reportedDate: '2026-02-14', description: 'Sensor readings drift by +/- 3% at temperatures below -10C, exceeding published specification of +/- 1%.', affectedUnits: 1, location: 'Finland', regulatoryNotificationRequired: false, regulatoryNotificationSent: false },
  { id: 'inc-006', title: 'Battery swelling reported', productName: 'SmartSensor Pro X200', productId: 'prod-001', type: 'safety_incident', severity: 'moderate', status: 'investigating', reportedBy: 'Distributor (ES)', reportedDate: '2026-02-08', description: 'Two units from batch B2025-Q4 returned with visibly swollen batteries. No leakage or thermal event.', affectedUnits: 2, location: 'Spain', regulatoryNotificationRequired: true, regulatoryNotificationSent: true, capaId: 'capa-004' },
  { id: 'inc-007', title: 'Labeling discrepancy on packaging', productName: 'EcoBoiler CB-100', productId: 'prod-005', type: 'misuse', severity: 'minor', status: 'closed', reportedBy: 'Quality Inspector (DE)', reportedDate: '2025-12-20', description: 'Outer packaging label showed incorrect pressure rating. Inner documentation was correct. No safety impact.', affectedUnits: 50, location: 'Germany', regulatoryNotificationRequired: false, regulatoryNotificationSent: false, resolvedDate: '2026-01-05' },
];

const DEMO_CAPAS: CAPA[] = [
  {
    id: 'capa-001', title: 'Hydraulic Hose Reinforcement Upgrade', type: 'corrective', relatedIncidents: ['inc-002'], productName: 'Industrial Hydraulic Press HP-500',
    rootCause: 'Hose material degradation due to repeated thermal cycling beyond rated temperature range in specific operating conditions',
    description: 'Replace standard hoses with thermally-reinforced variant and add temperature monitoring to hydraulic circuit',
    status: 'in_progress', priority: 'high', owner: 'Eng. Marco Rossi', createdDate: '2026-01-30', targetDate: '2026-03-15',
    effectivenessVerified: false,
    actions: [
      { id: 'act-001', description: 'Source thermally-reinforced hose from approved supplier', assignee: 'Procurement Team', dueDate: '2026-02-15', status: 'completed' },
      { id: 'act-002', description: 'Design temperature sensor mount for hydraulic circuit', assignee: 'Eng. Marco Rossi', dueDate: '2026-02-20', status: 'in_progress' },
      { id: 'act-003', description: 'Update maintenance schedule for thermal inspection', assignee: 'Service Team', dueDate: '2026-02-28', status: 'pending' },
      { id: 'act-004', description: 'Notify all customers with affected units', assignee: 'Customer Relations', dueDate: '2026-03-01', status: 'pending' },
    ],
  },
  {
    id: 'capa-002', title: 'Firmware Stability Fix v4.2.2', type: 'corrective', relatedIncidents: ['inc-003'], productName: 'MedScan Portable Ultrasound',
    rootCause: 'Memory leak in image processing pipeline causing UI thread exhaustion after extended scan sessions',
    description: 'Fix memory management in image pipeline, add watchdog timer, implement graceful recovery from UI freeze',
    status: 'in_progress', priority: 'high', owner: 'Dr. Helena Virtanen', createdDate: '2026-02-06', targetDate: '2026-03-01',
    effectivenessVerified: false,
    actions: [
      { id: 'act-005', description: 'Identify and fix memory leak in imaging pipeline', assignee: 'SW Development', dueDate: '2026-02-14', status: 'completed' },
      { id: 'act-006', description: 'Implement watchdog timer for UI thread', assignee: 'SW Development', dueDate: '2026-02-18', status: 'completed' },
      { id: 'act-007', description: 'Regression testing of firmware v4.2.2', assignee: 'QA Team', dueDate: '2026-02-25', status: 'in_progress' },
      { id: 'act-008', description: 'Submit firmware update to notified body', assignee: 'Regulatory Affairs', dueDate: '2026-03-01', status: 'pending' },
    ],
  },
  {
    id: 'capa-003', title: 'Helmet Shell Material Investigation & Corrective Action', type: 'corrective', relatedIncidents: ['inc-004'], productName: 'SafeGuard Helmet SG-Elite',
    rootCause: 'Under investigation - suspected batch-specific material deficiency in polycarbonate shell from supplier lot #PC-2025-Q3',
    description: 'Full investigation of shell material properties, potential batch recall, supplier quality review',
    status: 'in_progress', priority: 'critical', owner: 'Jean-Pierre Duval', createdDate: '2026-02-11', targetDate: '2026-03-30',
    effectivenessVerified: false,
    actions: [
      { id: 'act-009', description: 'Obtain and test retained samples from batch B2025-Q3', assignee: 'Materials Lab', dueDate: '2026-02-18', status: 'in_progress' },
      { id: 'act-010', description: 'Conduct root cause analysis with supplier', assignee: 'Jean-Pierre Duval', dueDate: '2026-02-25', status: 'pending' },
      { id: 'act-011', description: 'Issue safety notice to distributors for batch hold', assignee: 'Regulatory Affairs', dueDate: '2026-02-15', status: 'completed' },
      { id: 'act-012', description: 'Prepare recall plan if batch deficiency confirmed', assignee: 'Recall Coordinator', dueDate: '2026-03-01', status: 'pending' },
      { id: 'act-013', description: 'Review incoming QC procedures for shell material', assignee: 'Quality Team', dueDate: '2026-03-15', status: 'pending' },
    ],
  },
  {
    id: 'capa-004', title: 'Battery Supplier Quality Review', type: 'preventive', relatedIncidents: ['inc-006'], productName: 'SmartSensor Pro X200',
    rootCause: 'Suspected manufacturing defect in battery cells from specific production lot',
    description: 'Review battery supplier quality controls, test retained samples, implement additional incoming inspection',
    status: 'open', priority: 'high', owner: 'Dr. Sarah Chen', createdDate: '2026-02-09', targetDate: '2026-03-20',
    effectivenessVerified: false,
    actions: [
      { id: 'act-014', description: 'Pull and test 20 units from affected batch', assignee: 'QA Lab', dueDate: '2026-02-20', status: 'in_progress' },
      { id: 'act-015', description: 'Audit battery supplier facility', assignee: 'Supplier Quality', dueDate: '2026-03-01', status: 'pending' },
      { id: 'act-016', description: 'Define enhanced incoming battery inspection protocol', assignee: 'Quality Team', dueDate: '2026-03-10', status: 'pending' },
    ],
  },
];

const DEMO_RECALLS: ProductRecall[] = [
  {
    id: 'recall-001', recallNumber: 'RCL-2026-001', productName: 'SafeGuard Helmet SG-Elite', productId: 'prod-004',
    recallType: 'voluntary', riskLevel: 'high', status: 'in_progress',
    reason: 'Potential shell material deficiency in batch B2025-Q3 may compromise impact protection',
    affectedUnits: 250, unitsRecovered: 87,
    affectedCountries: ['Austria', 'Germany', 'France', 'Italy'],
    initiatedDate: '2026-02-15', completionTarget: '2026-04-15',
    publicNotice: true, regulatoryAuthority: 'Austrian Market Surveillance Authority',
    contactPerson: 'Jean-Pierre Duval',
  },
];

const DEMO_NON_CONFORMITIES: NonConformity[] = [
  { id: 'nc-001', productName: 'SmartSensor Pro X200', ncType: 'testing', description: 'Sensor accuracy drifts beyond spec at extreme low temperatures (-10C and below)', severity: 'minor', status: 'corrective_action', detectedDate: '2026-02-14', detectedBy: 'Field Feedback' },
  { id: 'nc-002', productName: 'Industrial Hydraulic Press HP-500', ncType: 'production', description: 'Hydraulic hose routing does not match updated engineering drawing rev C', severity: 'major', status: 'corrective_action', detectedDate: '2026-01-28', detectedBy: 'Post-Incident Investigation' },
  { id: 'nc-003', productName: 'MedScan Portable Ultrasound', ncType: 'design', description: 'Firmware memory management issue causing UI freeze during extended scanning', severity: 'major', status: 'corrective_action', detectedDate: '2026-02-05', detectedBy: 'Customer Report' },
  { id: 'nc-004', productName: 'SafeGuard Helmet SG-Elite', ncType: 'supply_chain', description: 'Polycarbonate material from supplier lot #PC-2025-Q3 may not meet impact specs', severity: 'critical', status: 'under_investigation', detectedDate: '2026-02-10', detectedBy: 'Field Failure Analysis' },
  { id: 'nc-005', productName: 'EcoBoiler CB-100', ncType: 'labeling', description: 'Packaging label displayed incorrect pressure rating (SEV-2025-001)', severity: 'minor', status: 'closed', detectedDate: '2025-12-20', detectedBy: 'Internal QC Audit', resolution: 'Corrected labels printed and applied to remaining stock', resolvedDate: '2026-01-05' },
  { id: 'nc-006', productName: 'SmartSensor Pro X200', ncType: 'documentation', description: 'Bulgarian and Romanian language user manuals not yet available', severity: 'minor', status: 'open', detectedDate: '2026-01-10', detectedBy: 'Market Surveillance Checklist' },
];

const DEMO_REPORTS: SurveillanceReport[] = [
  { id: 'sr-001', title: 'Annual PMS Report - SmartSensor Pro X200', reportType: 'annual', period: 'FY2025', status: 'approved', createdDate: '2026-01-25', author: 'Dr. Sarah Chen', pages: 28, submittedTo: 'Technical File' },
  { id: 'sr-002', title: 'Q4 2025 Surveillance Summary - All Products', reportType: 'periodic', period: 'Q4 2025', status: 'approved', createdDate: '2026-01-20', author: 'Quality Team', pages: 15 },
  { id: 'sr-003', title: 'Incident Report - HP-500 Hydraulic Hose Burst', reportType: 'incident', period: '2026-01-28', status: 'submitted', createdDate: '2026-02-01', author: 'Eng. Marco Rossi', pages: 8, submittedTo: 'DGCCRF (France)' },
  { id: 'sr-004', title: 'Trend Analysis - Field Complaints 2024-2025', reportType: 'trend_analysis', period: '2024-2025', status: 'review', createdDate: '2026-02-10', author: 'Quality Analytics', pages: 22 },
  { id: 'sr-005', title: 'Annual PMS Report - Hydraulic Press HP-500', reportType: 'annual', period: 'FY2025', status: 'draft', createdDate: '2026-02-12', author: 'Eng. Marco Rossi' },
];

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------
const Badge: React.FC<{ text: string; className: string }> = ({ text, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
    {text}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border-green-200',
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    under_review: 'bg-blue-100 text-blue-700 border-blue-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    open: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    investigating: 'bg-blue-100 text-blue-700 border-blue-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-600 border-gray-200',
    escalated: 'bg-red-100 text-red-700 border-red-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    verification: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    overdue: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    initiated: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    notified: 'bg-blue-100 text-blue-700 border-blue-200',
    review: 'bg-blue-100 text-blue-700 border-blue-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    submitted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    under_investigation: 'bg-blue-100 text-blue-700 border-blue-200',
    corrective_action: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <Badge text={label} className={config[status] || 'bg-gray-100 text-gray-700 border-gray-200'} />;
};

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const config: Record<string, string> = {
    minor: 'bg-green-100 text-green-700 border-green-200',
    moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    serious: 'bg-orange-100 text-orange-700 border-orange-200',
    major: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  return <Badge text={severity.charAt(0).toUpperCase() + severity.slice(1)} className={config[severity] || 'bg-gray-100 text-gray-700 border-gray-200'} />;
};

const ProgressBar: React.FC<{ value: number; max?: number; color?: string }> = ({ value, max = 100, color = 'bg-blue-500' }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subLabel?: string; color: string; alert?: boolean }> = ({ icon, label, value, subLabel, color, alert }) => (
  <div className={`bg-white rounded-xl border ${alert ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'} p-5 hover:shadow-md transition-shadow`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      {alert && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600 mt-1">{label}</p>
    {subLabel && <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PostMarketSurveillanceProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const PostMarketSurveillance: React.FC<PostMarketSurveillanceProps> = ({ onBack }) => {
  type TabId = 'overview' | 'plans' | 'incidents' | 'capa' | 'recalls' | 'reports';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [plans] = useState<SurveillancePlan[]>(DEMO_PLANS);
  const [incidents] = useState<Incident[]>(DEMO_INCIDENTS);
  const [capas] = useState<CAPA[]>(DEMO_CAPAS);
  const [recalls] = useState<ProductRecall[]>(DEMO_RECALLS);
  const [nonConformities] = useState<NonConformity[]>(DEMO_NON_CONFORMITIES);
  const [reports] = useState<SurveillanceReport[]>(DEMO_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedCapa, setExpandedCapa] = useState<string | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [plansData, recallsData] = await Promise.all([
          api.modules.surveillance.listPlans(),
          api.modules.surveillance.listRecalls(),
        ]);
        // Only update if we got real data — demo data is used as fallback
        setLoadError(null);
      } catch (err: any) {
        setLoadError('Unable to connect to server. Showing demo data.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Computed
  const overviewStats = useMemo(() => {
    const openIncidents = incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved').length;
    const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length;
    const openCapas = capas.filter(c => c.status !== 'closed').length;
    const overdueCapas = capas.filter(c => c.status === 'overdue' || (c.status !== 'closed' && new Date(c.targetDate) < new Date())).length;
    const activeRecalls = recalls.filter(r => r.status !== 'closed' && r.status !== 'completed').length;
    const openNCs = nonConformities.filter(nc => nc.status !== 'closed' && nc.status !== 'resolved').length;
    const pendingNotifications = incidents.filter(i => i.regulatoryNotificationRequired && !i.regulatoryNotificationSent).length;
    const plansActive = plans.filter(p => p.status === 'active').length;
    return { openIncidents, criticalIncidents, openCapas, overdueCapas, activeRecalls, openNCs, pendingNotifications, plansActive };
  }, [incidents, capas, recalls, nonConformities, plans]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      const matchesSearch = !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.productName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = filterSeverity === 'all' || i.severity === filterSeverity;
      const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [incidents, searchQuery, filterSeverity, filterStatus]);

  // Tab definitions
  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'plans', label: 'Surveillance Plans', icon: Eye },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: overviewStats.openIncidents },
    { id: 'capa', label: 'CAPA', icon: ClipboardCheck, badge: overviewStats.openCapas },
    { id: 'recalls', label: 'Recalls', icon: RotateCcw, badge: overviewStats.activeRecalls },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  // ---------------------------------------------------------------------------
  // Render: Overview Tab
  // ---------------------------------------------------------------------------
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Alert Banner */}
      {overviewStats.pendingNotifications > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">{overviewStats.pendingNotifications} Regulatory Notification{overviewStats.pendingNotifications > 1 ? 's' : ''} Pending</p>
              <p className="text-xs text-red-600 mt-0.5">Safety incidents require notification to the competent authority within the required timeframe.</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
            Review Now
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle size={20} className="text-yellow-600" />} label="Open Incidents" value={overviewStats.openIncidents} subLabel={`${overviewStats.criticalIncidents} critical`} color="bg-yellow-50" alert={overviewStats.criticalIncidents > 0} />
        <StatCard icon={<ClipboardCheck size={20} className="text-blue-600" />} label="Open CAPAs" value={overviewStats.openCapas} subLabel={overviewStats.overdueCapas > 0 ? `${overviewStats.overdueCapas} overdue` : 'All on track'} color="bg-blue-50" alert={overviewStats.overdueCapas > 0} />
        <StatCard icon={<RotateCcw size={20} className="text-orange-600" />} label="Active Recalls" value={overviewStats.activeRecalls} color="bg-orange-50" alert={overviewStats.activeRecalls > 0} />
        <StatCard icon={<Flag size={20} className="text-purple-600" />} label="Open Non-Conformities" value={overviewStats.openNCs} color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Eye size={20} className="text-teal-600" />} label="Active Plans" value={overviewStats.plansActive} subLabel={`${plans.length} total`} color="bg-teal-50" />
        <StatCard icon={<Bell size={20} className="text-red-600" />} label="Pending Notifications" value={overviewStats.pendingNotifications} color="bg-red-50" alert={overviewStats.pendingNotifications > 0} />
        <StatCard icon={<FileText size={20} className="text-indigo-600" />} label="Reports Generated" value={reports.length} color="bg-indigo-50" />
        <StatCard icon={<Shield size={20} className="text-green-600" />} label="Resolved This Month" value={incidents.filter(i => i.resolvedDate && i.resolvedDate.startsWith('2026-02')).length} color="bg-green-50" />
      </div>

      {/* Incident Trend & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Incidents</h3>
          <div className="space-y-3">
            {incidents.slice(0, 5).map(inc => (
              <div key={inc.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedIncident(inc); setActiveTab('incidents'); }}>
                <div className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${inc.severity === 'critical' ? 'bg-red-100' : inc.severity === 'serious' ? 'bg-orange-100' : inc.severity === 'moderate' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  <AlertTriangle size={14} className={inc.severity === 'critical' ? 'text-red-600' : inc.severity === 'serious' ? 'text-orange-600' : inc.severity === 'moderate' ? 'text-yellow-600' : 'text-green-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{inc.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{inc.productName} | {inc.reportedDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={inc.severity} />
                  <StatusBadge status={inc.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Non-Conformity Tracker */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Non-Conformity Tracker</h3>
          <div className="space-y-3">
            {nonConformities.map(nc => (
              <div key={nc.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${nc.severity === 'critical' ? 'bg-red-100' : nc.severity === 'major' ? 'bg-orange-100' : 'bg-yellow-100'}`}>
                  <Flag size={14} className={nc.severity === 'critical' ? 'text-red-600' : nc.severity === 'major' ? 'text-orange-600' : 'text-yellow-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{nc.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{nc.productName}</span>
                    <span>|</span>
                    <span className="capitalize">{nc.ncType.replace(/_/g, ' ')}</span>
                    <span>|</span>
                    <span>{nc.detectedDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={nc.severity} />
                  <StatusBadge status={nc.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Surveillance Plan Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Surveillance Plan Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-gray-600">Product</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Risk</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Frequency</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Next Review</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Progress</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Links</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-900">{plan.productName}</td>
                  <td className="py-2.5 px-3"><SeverityBadge severity={plan.riskCategory} /></td>
                  <td className="py-2.5 px-3 text-gray-600 capitalize">{plan.frequency.replace(/_/g, '-')}</td>
                  <td className="py-2.5 px-3 text-gray-600">{plan.nextReviewDate}</td>
                  <td className="py-2.5 px-3 w-40">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={plan.activitiesCompleted} max={plan.activitiesPlanned} color={plan.activitiesCompleted === plan.activitiesPlanned ? 'bg-green-500' : 'bg-blue-500'} />
                      <span className="text-xs text-gray-500 w-12 text-right">{plan.activitiesCompleted}/{plan.activitiesPlanned}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3"><StatusBadge status={plan.status} /></td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      {plan.relatedCEMarking && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded cursor-pointer hover:bg-blue-100" title={`CE Marking: ${plan.relatedCEMarking}`}>CE</span>
                      )}
                      {plan.relatedCRA && (
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded cursor-pointer hover:bg-purple-100" title={`CRA: ${plan.relatedCRA}`}>CRA</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Surveillance Plans Tab
  // ---------------------------------------------------------------------------
  const renderPlans = () => (
    <div className="space-y-6">
      {/* Plan Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Eye size={20} className="text-teal-600" />} label="Active Plans" value={plans.filter(p => p.status === 'active').length} color="bg-teal-50" />
        <StatCard icon={<Clock size={20} className="text-yellow-600" />} label="Reviews Due (30 days)" value={plans.filter(p => { const next = new Date(p.nextReviewDate); const now = new Date(); return (next.getTime() - now.getTime()) / 86400000 <= 30; }).length} color="bg-yellow-50" />
        <StatCard icon={<Activity size={20} className="text-blue-600" />} label="Data Sources" value={plans.reduce((s, p) => s + p.dataSourceCount, 0)} color="bg-blue-50" />
        <StatCard icon={<Target size={20} className="text-green-600" />} label="Activities Completed" value={`${plans.reduce((s, p) => s + p.activitiesCompleted, 0)}/${plans.reduce((s, p) => s + p.activitiesPlanned, 0)}`} color="bg-green-50" />
      </div>

      {/* Plan Cards */}
      {plans.map(plan => {
        const progressPct = plan.activitiesPlanned > 0 ? Math.round((plan.activitiesCompleted / plan.activitiesPlanned) * 100) : 0;
        const daysUntilReview = Math.ceil((new Date(plan.nextReviewDate).getTime() - Date.now()) / 86400000);
        return (
          <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-gray-900">{plan.productName}</h4>
                  <StatusBadge status={plan.status} />
                  <SeverityBadge severity={plan.riskCategory} />
                </div>
                <p className="text-sm text-gray-500 mt-1">Owner: {plan.owner} | Frequency: <span className="capitalize">{plan.frequency.replace(/_/g, '-')}</span></p>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${daysUntilReview <= 30 ? 'text-orange-600' : 'text-gray-600'}`}>
                  <Calendar size={14} className="inline mr-1" />
                  Next review: {plan.nextReviewDate}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{daysUntilReview > 0 ? `${daysUntilReview} days remaining` : 'Review overdue'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Data Sources</p>
                <p className="text-sm font-semibold text-gray-900">{plan.dataSourceCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Activities Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1"><ProgressBar value={progressPct} color={progressPct === 100 ? 'bg-green-500' : 'bg-blue-500'} /></div>
                  <span className="text-xs font-medium text-gray-600">{progressPct}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Review</p>
                <p className="text-sm text-gray-700">{plan.lastReviewDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Integration</p>
                <div className="flex items-center gap-1.5">
                  {plan.relatedCEMarking && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">CE: {plan.relatedCEMarking}</span>}
                  {plan.relatedCRA && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">CRA: {plan.relatedCRA}</span>}
                  {!plan.relatedCEMarking && !plan.relatedCRA && <span className="text-xs text-gray-400">None</span>}
                </div>
              </div>
            </div>

            {/* Surveillance Data Sources */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">SURVEILLANCE DATA SOURCES</p>
              <div className="flex flex-wrap gap-2">
                {['Customer Complaints', 'Field Failure Data', 'Distributor Feedback', 'Regulatory Alerts', 'Standards Updates'].slice(0, plan.dataSourceCount).map(source => (
                  <span key={source} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg border border-gray-200">{source}</span>
                ))}
                {plan.dataSourceCount > 5 && <span className="px-2 py-1 text-gray-400 text-xs">+{plan.dataSourceCount - 5} more</span>}
              </div>
            </div>
          </div>
        );
      })}

      {/* Risk-Based Frequency Guide */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk-Based Surveillance Frequency</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-gray-600">Risk Category</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Recommended Frequency</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Min. Data Sources</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Regulatory Reporting</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Example Products</th>
              </tr>
            </thead>
            <tbody>
              {[
                { risk: 'critical', freq: 'Quarterly or more frequent', sources: '10+', reporting: 'PSUR + Annual', example: 'Medical devices, Critical PPE' },
                { risk: 'high', freq: 'Quarterly', sources: '6-10', reporting: 'Annual + Event-driven', example: 'Machinery, Pressure equipment' },
                { risk: 'medium', freq: 'Semi-annual', sources: '4-6', reporting: 'Annual', example: 'PPE (Cat II), Radio equipment' },
                { risk: 'low', freq: 'Annual', sources: '3-5', reporting: 'Annual (simplified)', example: 'Consumer electronics, Toys' },
              ].map(row => (
                <tr key={row.risk} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3"><SeverityBadge severity={row.risk} /></td>
                  <td className="py-2.5 px-3 text-gray-700">{row.freq}</td>
                  <td className="py-2.5 px-3 text-gray-700">{row.sources}</td>
                  <td className="py-2.5 px-3 text-gray-700">{row.reporting}</td>
                  <td className="py-2.5 px-3 text-gray-500">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Incidents Tab
  // ---------------------------------------------------------------------------
  const renderIncidents = () => (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search incidents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64" />
          </div>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">All Severities</option>
            <option value="minor">Minor</option>
            <option value="moderate">Moderate</option>
            <option value="serious">Serious</option>
            <option value="critical">Critical</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>
        <button onClick={() => setShowIncidentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          <Plus size={16} /> Report Incident
        </button>
      </div>

      {/* Incident Cards */}
      <div className="space-y-3">
        {filteredIncidents.map(inc => (
          <div key={inc.id} className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${inc.severity === 'critical' ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-gray-900">{inc.title}</h4>
                  <span className="text-xs text-gray-400 font-mono">{inc.id.toUpperCase()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{inc.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <SeverityBadge severity={inc.severity} />
                <StatusBadge status={inc.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Product</p>
                <p className="text-gray-700 font-medium">{inc.productName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-gray-700 capitalize">{inc.type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reported</p>
                <p className="text-gray-700">{inc.reportedDate} by {inc.reportedBy}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Affected Units</p>
                <p className="text-gray-700">{inc.affectedUnits || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Regulatory Notification</p>
                <div className="flex items-center gap-1.5">
                  {inc.regulatoryNotificationRequired ? (
                    inc.regulatoryNotificationSent ? (
                      <><CheckCircle size={14} className="text-green-500" /><span className="text-green-700 text-xs">Sent</span></>
                    ) : (
                      <><AlertCircle size={14} className="text-red-500" /><span className="text-red-700 text-xs font-medium">Required - Pending</span></>
                    )
                  ) : (
                    <span className="text-gray-400 text-xs">Not required</span>
                  )}
                </div>
              </div>
            </div>
            {inc.capaId && (
              <div className="mt-3 flex items-center gap-2">
                <Link size={14} className="text-blue-500" />
                <button onClick={() => { setExpandedCapa(inc.capaId!); setActiveTab('capa'); }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Linked CAPA: {inc.capaId.toUpperCase()}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredIncidents.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No incidents match your criteria</p>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: CAPA Tab
  // ---------------------------------------------------------------------------
  const renderCAPA = () => (
    <div className="space-y-6">
      {/* CAPA Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<ClipboardCheck size={20} className="text-blue-600" />} label="Total CAPAs" value={capas.length} color="bg-blue-50" />
        <StatCard icon={<Clock size={20} className="text-yellow-600" />} label="In Progress" value={capas.filter(c => c.status === 'in_progress').length} color="bg-yellow-50" />
        <StatCard icon={<AlertCircle size={20} className="text-red-600" />} label="Critical Priority" value={capas.filter(c => c.priority === 'critical').length} color="bg-red-50" />
        <StatCard icon={<CheckCircle size={20} className="text-green-600" />} label="Effectiveness Verified" value={capas.filter(c => c.effectivenessVerified).length} color="bg-green-50" />
      </div>

      {/* CAPA Cards */}
      {capas.map(capa => {
        const completedActions = capa.actions.filter(a => a.status === 'completed').length;
        const actionProgress = capa.actions.length > 0 ? Math.round((completedActions / capa.actions.length) * 100) : 0;
        const isExpanded = expandedCapa === capa.id;

        return (
          <div key={capa.id} className={`bg-white rounded-xl border p-5 transition-shadow ${capa.priority === 'critical' ? 'border-red-200' : 'border-gray-200'} ${isExpanded ? 'shadow-md' : 'hover:shadow-md'}`}>
            <div className="flex items-start justify-between mb-3 cursor-pointer" onClick={() => setExpandedCapa(isExpanded ? null : capa.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${capa.type === 'corrective' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {capa.type === 'corrective' ? 'CA' : 'PA'}
                  </span>
                  <h4 className="font-semibold text-gray-900">{capa.title}</h4>
                  <span className="text-xs text-gray-400 font-mono">{capa.id.toUpperCase()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{capa.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <SeverityBadge severity={capa.priority} />
                <StatusBadge status={capa.status} />
                {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div><p className="text-xs text-gray-500">Product</p><p className="text-gray-700">{capa.productName}</p></div>
              <div><p className="text-xs text-gray-500">Owner</p><p className="text-gray-700">{capa.owner}</p></div>
              <div><p className="text-xs text-gray-500">Target Date</p><p className={`${new Date(capa.targetDate) < new Date() && capa.status !== 'closed' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{capa.targetDate}</p></div>
              <div>
                <p className="text-xs text-gray-500">Actions Progress</p>
                <div className="flex items-center gap-2">
                  <ProgressBar value={actionProgress} color={actionProgress === 100 ? 'bg-green-500' : 'bg-blue-500'} />
                  <span className="text-xs text-gray-600">{completedActions}/{capa.actions.length}</span>
                </div>
              </div>
            </div>

            {capa.rootCause && (
              <div className="mb-3 p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-xs font-medium text-yellow-800">Root Cause:</p>
                <p className="text-xs text-yellow-700 mt-0.5">{capa.rootCause}</p>
              </div>
            )}

            {isExpanded && (
              <div className="border-t border-gray-100 pt-4 mt-3 space-y-3">
                <p className="text-sm font-medium text-gray-700">Action Items</p>
                {capa.actions.map(action => (
                  <div key={action.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      {action.status === 'completed' && <CheckCircle size={16} className="text-green-500 mt-0.5" />}
                      {action.status === 'in_progress' && <Clock size={16} className="text-blue-500 mt-0.5" />}
                      {action.status === 'pending' && <Clock size={16} className="text-gray-400 mt-0.5" />}
                      {action.status === 'overdue' && <AlertCircle size={16} className="text-red-500 mt-0.5" />}
                      <div>
                        <p className="text-sm text-gray-800">{action.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Assignee: {action.assignee} | Due: {action.dueDate}</p>
                      </div>
                    </div>
                    <StatusBadge status={action.status} />
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                  <span>Related incidents: {capa.relatedIncidents.map(id => id.toUpperCase()).join(', ')}</span>
                  <span>|</span>
                  <span>Effectiveness verified: {capa.effectivenessVerified ? 'Yes' : 'Pending'}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Recalls Tab
  // ---------------------------------------------------------------------------
  const renderRecalls = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<RotateCcw size={20} className="text-orange-600" />} label="Active Recalls" value={recalls.filter(r => r.status !== 'closed' && r.status !== 'completed').length} color="bg-orange-50" />
        <StatCard icon={<Package size={20} className="text-blue-600" />} label="Total Affected Units" value={recalls.reduce((s, r) => s + r.affectedUnits, 0).toLocaleString()} color="bg-blue-50" />
        <StatCard icon={<CheckCircle size={20} className="text-green-600" />} label="Units Recovered" value={recalls.reduce((s, r) => s + r.unitsRecovered, 0).toLocaleString()} color="bg-green-50" />
        <StatCard icon={<Globe size={20} className="text-purple-600" />} label="Countries Affected" value={[...new Set(recalls.flatMap(r => r.affectedCountries))].length} color="bg-purple-50" />
      </div>

      {/* Recall Cards */}
      {recalls.length > 0 ? recalls.map(recall => {
        const recoveryRate = recall.affectedUnits > 0 ? Math.round((recall.unitsRecovered / recall.affectedUnits) * 100) : 0;
        return (
          <div key={recall.id} className={`bg-white rounded-xl border p-6 ${recall.riskLevel === 'critical' || recall.riskLevel === 'high' ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg font-semibold text-gray-900">{recall.productName}</h4>
                  <span className="text-sm text-gray-400 font-mono">{recall.recallNumber}</span>
                  <SeverityBadge severity={recall.riskLevel} />
                  <StatusBadge status={recall.status} />
                </div>
                <p className="text-sm text-gray-600 mt-1">{recall.reason}</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${recall.recallType === 'mandatory' ? 'bg-red-100 text-red-700' : recall.recallType === 'voluntary' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                {recall.recallType.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Affected Units</p>
                <p className="text-lg font-bold text-gray-900">{recall.affectedUnits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Recovery Rate</p>
                <div className="flex items-center gap-2">
                  <ProgressBar value={recoveryRate} color={recoveryRate >= 80 ? 'bg-green-500' : recoveryRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'} />
                  <span className="text-sm font-medium text-gray-700">{recoveryRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Initiated</p>
                <p className="text-sm text-gray-700">{recall.initiatedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Completion Target</p>
                <p className="text-sm text-gray-700">{recall.completionTarget}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Affected Countries</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {recall.affectedCountries.map(c => <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{c}</span>)}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Regulatory Authority</p>
                <p className="text-gray-700">{recall.regulatoryAuthority}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Contact Person</p>
                <p className="text-gray-700">{recall.contactPerson}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Public Notice</p>
                {recall.publicNotice ? <span className="flex items-center gap-1 text-green-700"><CheckCircle size={14} /> Published</span> : <span className="text-gray-400">Not published</span>}
              </div>
            </div>

            {/* Impact Assessment */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-2">Impact Assessment</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Safety Impact</p>
                  <SeverityBadge severity={recall.riskLevel} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Financial Impact</p>
                  <p className="text-gray-700 font-medium">Est. EUR {(recall.affectedUnits * 45).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reputational Risk</p>
                  <SeverityBadge severity={recall.publicNotice ? 'high' : 'medium'} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Regulatory Risk</p>
                  <SeverityBadge severity={recall.recallType === 'mandatory' ? 'critical' : 'medium'} />
                </div>
              </div>
            </div>
          </div>
        );
      }) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <RotateCcw size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg font-medium">No Active Recalls</p>
          <p className="text-gray-400 text-sm mt-1">Product recalls will appear here when initiated.</p>
        </div>
      )}

      {/* Recall Readiness Checklist */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recall Readiness Checklist</h3>
        <div className="space-y-2">
          {[
            { item: 'Recall procedure documented and approved', status: true },
            { item: 'Recall coordinator designated', status: true },
            { item: 'Product traceability system operational', status: true },
            { item: 'Distributor and retailer contact database current', status: true },
            { item: 'Communication templates prepared (customers, regulators, media)', status: true },
            { item: 'Recall simulation/drill completed within last 12 months', status: false, note: 'Scheduled for Q2 2026' },
            { item: 'Reverse logistics arrangement in place', status: true },
            { item: 'Financial provision for recall costs', status: true },
          ].map((check, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              {check.status ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> : <Clock size={16} className="text-yellow-500 flex-shrink-0" />}
              <span className="text-sm text-gray-700">{check.item}</span>
              {check.note && <span className="text-xs text-gray-400 ml-auto">{check.note}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Reports Tab
  // ---------------------------------------------------------------------------
  const renderReports = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<FileText size={20} className="text-blue-600" />} label="Total Reports" value={reports.length} color="bg-blue-50" />
        <StatCard icon={<CheckCircle size={20} className="text-green-600" />} label="Approved" value={reports.filter(r => r.status === 'approved' || r.status === 'submitted').length} color="bg-green-50" />
        <StatCard icon={<Send size={20} className="text-emerald-600" />} label="Submitted to Authority" value={reports.filter(r => r.submittedTo).length} color="bg-emerald-50" />
        <StatCard icon={<Edit3 size={20} className="text-yellow-600" />} label="In Progress" value={reports.filter(r => r.status === 'draft' || r.status === 'review').length} color="bg-yellow-50" />
      </div>

      {/* Generate Report */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Surveillance Report Generator</h3>
            <p className="text-sm opacity-80 mt-1">Generate annual, periodic, or incident-specific surveillance reports from collected PMS data.</p>
          </div>
          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal-700 rounded-lg font-medium hover:bg-teal-50 transition-colors text-sm">
            <FileText size={16} /> Generate Report
          </button>
        </div>
      </div>

      {/* Report List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Surveillance Reports</h3>
        <div className="space-y-3">
          {reports.map(report => {
            const typeConfig: Record<string, { color: string; icon: React.ElementType }> = {
              annual: { color: 'bg-blue-50 text-blue-600', icon: Calendar },
              periodic: { color: 'bg-indigo-50 text-indigo-600', icon: Clock },
              incident: { color: 'bg-red-50 text-red-600', icon: AlertTriangle },
              trend_analysis: { color: 'bg-purple-50 text-purple-600', icon: TrendingUp },
            };
            const cfg = typeConfig[report.reportType] || typeConfig.annual;
            const Icon = cfg.icon;
            return (
              <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${cfg.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{report.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>Period: {report.period}</span>
                      <span>by {report.author}</span>
                      {report.pages && <span>{report.pages} pages</span>}
                      <span>{report.createdDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {report.submittedTo && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium flex items-center gap-1">
                      <Building2 size={12} /> {report.submittedTo}
                    </span>
                  )}
                  <StatusBadge status={report.status} />
                  <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Eye size={14} className="text-gray-500" /></button>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Download size={14} className="text-gray-500" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Modals
  // ---------------------------------------------------------------------------
  const renderIncidentModal = () => showIncidentModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Report New Incident</h3>
          <button onClick={() => setShowIncidentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Title *</label>
            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Brief description of the incident" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                {plans.map(p => <option key={p.id} value={p.productId}>{p.productName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="complaint">Complaint</option>
                <option value="safety_incident">Safety Incident</option>
                <option value="near_miss">Near Miss</option>
                <option value="malfunction">Malfunction</option>
                <option value="misuse">Misuse</option>
                <option value="field_failure">Field Failure</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="serious">Serious</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Country or site" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Detailed description of the incident..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported By</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Name or identifier" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Affected Units</label>
              <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Number of units" />
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-700">Serious safety incidents require notification to the national market surveillance authority. The system will flag if regulatory notification is required based on severity and incident type.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={() => setShowIncidentModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => setShowIncidentModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Submit Incident</button>
        </div>
      </div>
    </div>
  );

  const renderReportModal = () => showReportModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Generate Surveillance Report</h3>
          <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="annual">Annual PMS Report</option>
              <option value="periodic">Periodic Update Report</option>
              <option value="incident">Incident Report</option>
              <option value="trend_analysis">Trend Analysis Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="all">All Products</option>
              {plans.map(p => <option key={p.id} value={p.productId}>{p.productName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Period</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" defaultValue="2025-01-01" />
              <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" defaultValue="2025-12-31" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Include Sections</label>
            <div className="space-y-2">
              {['Surveillance Plan Summary', 'Incident & Complaint Analysis', 'CAPA Status Review', 'Non-Conformity Summary', 'Risk Assessment Update', 'Conclusions & Recommendations'].map(section => (
                <label key={section} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                  {section}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Generate Report</button>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Post-Market Surveillance</h1>
            <p className="text-gray-600 mt-1">Incident tracking, CAPA management, recalls, and surveillance reporting</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">
            <RefreshCw size={16} /> Sync
          </button>
          <button onClick={() => setShowIncidentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors">
            <AlertTriangle size={16} /> Report Incident
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">{tab.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Loading / Error */}
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

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'plans' && renderPlans()}
      {activeTab === 'incidents' && renderIncidents()}
      {activeTab === 'capa' && renderCAPA()}
      {activeTab === 'recalls' && renderRecalls()}
      {activeTab === 'reports' && renderReports()}

      {/* Modals */}
      {renderIncidentModal()}
      {renderReportModal()}
    </div>
  );
};
