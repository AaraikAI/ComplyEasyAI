/**
 * CE Marking & Conformity Assessment Workflow
 *
 * Comprehensive management interface for CE marking compliance:
 * - Product registration and categorization
 * - Conformity assessment procedure selector (Module A through H)
 * - Essential requirements checklist per applicable directive
 * - Technical documentation management (Declaration of Conformity template)
 * - Notified body selection and engagement tracking
 * - CE marking label generation
 * - Product testing status tracking
 * - Risk assessment for product safety
 * - Market surveillance readiness check
 *
 * Reference: EU CE Marking Regulation (EC) No 765/2008 and Decision No 768/2008/EC
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import {
  ArrowLeft,
  Package,
  ClipboardCheck,
  FileText,
  Building2,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Tag,
  QrCode,
  BarChart3,
  Eye,
  Download,
  Edit3,
  Trash2,
  Target,
  Zap,
  AlertCircle,
  Info,
  ExternalLink,
  Loader2,
  Upload,
  RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CEProduct {
  id: string;
  name: string;
  modelNumber: string;
  category: string;
  applicableDirectives: string[];
  assessmentModule: string;
  status: 'draft' | 'in_assessment' | 'tested' | 'certified' | 'marked' | 'withdrawn';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  notifiedBodyId?: string;
  testingStatus: 'not_started' | 'in_progress' | 'passed' | 'failed';
  docCompleteness: number;
  createdAt: string;
  updatedAt: string;
  marketDate?: string;
}

interface EssentialRequirement {
  id: string;
  directiveId: string;
  category: string;
  requirement: string;
  standard: string;
  status: 'not_assessed' | 'compliant' | 'non_compliant' | 'partially_compliant';
  evidence?: string;
  notes?: string;
}

interface NotifiedBody {
  id: string;
  name: string;
  notifiedBodyNumber: string;
  country: string;
  directives: string[];
  accreditationStatus: 'active' | 'suspended' | 'withdrawn';
  engagementStatus: 'not_engaged' | 'inquiry_sent' | 'proposal_received' | 'contracted' | 'assessment_ongoing' | 'completed';
  contactEmail?: string;
  contactPhone?: string;
  lastInteraction?: string;
}

interface TechnicalDocument {
  id: string;
  productId: string;
  documentType: string;
  title: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  uploadDate: string;
  lastModified: string;
  fileSize?: string;
}

interface RiskAssessmentItem {
  id: string;
  productId: string;
  hazard: string;
  riskCategory: string;
  severity: number;
  probability: number;
  riskScore: number;
  mitigationMeasure: string;
  residualRisk: 'acceptable' | 'tolerable' | 'unacceptable';
  status: 'identified' | 'mitigated' | 'verified';
}

interface SurveillanceCheck {
  id: string;
  category: string;
  requirement: string;
  status: 'pass' | 'fail' | 'pending' | 'not_applicable';
  notes?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ASSESSMENT_MODULES: Record<string, { name: string; description: string; notifiedBodyRequired: boolean }> = {
  A: { name: 'Module A - Internal Production Control', description: 'Manufacturer self-assessment of design and production', notifiedBodyRequired: false },
  A1: { name: 'Module A1 - Internal Production Control + Supervised Testing', description: 'Self-assessment plus supervised product tests', notifiedBodyRequired: true },
  A2: { name: 'Module A2 - Internal Production Control + Supervised Checks', description: 'Self-assessment plus supervised random product checks', notifiedBodyRequired: true },
  B: { name: 'Module B - EU Type-Examination', description: 'Notified body examines the technical design of the product', notifiedBodyRequired: true },
  C: { name: 'Module C - Conformity to Type Based on Internal Production Control', description: 'Manufacturer ensures production conforms to approved type', notifiedBodyRequired: false },
  C1: { name: 'Module C1 - Conformity to Type + Supervised Testing', description: 'Production conformity plus supervised testing', notifiedBodyRequired: true },
  C2: { name: 'Module C2 - Conformity to Type + Supervised Checks', description: 'Production conformity plus supervised random checks', notifiedBodyRequired: true },
  D: { name: 'Module D - Quality Assurance of Production Process', description: 'Notified body approves and audits the production QA system', notifiedBodyRequired: true },
  D1: { name: 'Module D1 - Quality Assurance of Production Process', description: 'Quality assurance of production without type-examination', notifiedBodyRequired: true },
  E: { name: 'Module E - Product Quality Assurance', description: 'Notified body approves and audits product final inspection QA', notifiedBodyRequired: true },
  E1: { name: 'Module E1 - Quality Assurance of Final Product Inspection', description: 'Quality assurance of final inspection without type-examination', notifiedBodyRequired: true },
  F: { name: 'Module F - Conformity to Type Based on Product Verification', description: 'Notified body checks every product or statistically', notifiedBodyRequired: true },
  F1: { name: 'Module F1 - Conformity Based on Product Verification', description: 'Product verification without prior type-examination', notifiedBodyRequired: true },
  G: { name: 'Module G - Conformity Based on Unit Verification', description: 'Notified body examines each individual product', notifiedBodyRequired: true },
  H: { name: 'Module H - Conformity Based on Full Quality Assurance', description: 'Notified body approves and audits comprehensive QA system', notifiedBodyRequired: true },
  H1: { name: 'Module H1 - Full Quality Assurance + Design Examination', description: 'Full QA plus design examination by notified body', notifiedBodyRequired: true },
};

const EU_DIRECTIVES = [
  { id: 'LVD', name: 'Low Voltage Directive 2014/35/EU', category: 'Electrical Safety' },
  { id: 'EMC', name: 'EMC Directive 2014/30/EU', category: 'Electromagnetic Compatibility' },
  { id: 'MD', name: 'Machinery Directive 2006/42/EC', category: 'Machinery Safety' },
  { id: 'RED', name: 'Radio Equipment Directive 2014/53/EU', category: 'Radio Equipment' },
  { id: 'PPE', name: 'PPE Regulation (EU) 2016/425', category: 'Personal Protective Equipment' },
  { id: 'CPR', name: 'Construction Products Regulation (EU) No 305/2011', category: 'Construction' },
  { id: 'MDD', name: 'Medical Devices Regulation (EU) 2017/745', category: 'Medical Devices' },
  { id: 'PED', name: 'Pressure Equipment Directive 2014/68/EU', category: 'Pressure Equipment' },
  { id: 'ATEX', name: 'ATEX Directive 2014/34/EU', category: 'Explosive Atmospheres' },
  { id: 'TOY', name: 'Toy Safety Directive 2009/48/EC', category: 'Toy Safety' },
  { id: 'RoHS', name: 'RoHS Directive 2011/65/EU', category: 'Hazardous Substances' },
  { id: 'ECO', name: 'Ecodesign Directive 2009/125/EC', category: 'Energy Efficiency' },
];

const PRODUCT_CATEGORIES = [
  'Electronics & Electrical Equipment',
  'Machinery & Industrial Equipment',
  'Medical Devices',
  'Personal Protective Equipment',
  'Construction Products',
  'Toys',
  'Pressure Equipment',
  'Radio Equipment',
  'Gas Appliances',
  'Measuring Instruments',
];

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------
const DEMO_PRODUCTS: CEProduct[] = [
  {
    id: 'prod-001',
    name: 'SmartSensor Pro X200',
    modelNumber: 'SSP-X200-EU',
    category: 'Electronics & Electrical Equipment',
    applicableDirectives: ['LVD', 'EMC', 'RED', 'RoHS'],
    assessmentModule: 'A',
    status: 'marked',
    riskLevel: 'low',
    testingStatus: 'passed',
    docCompleteness: 95,
    createdAt: '2025-06-15',
    updatedAt: '2025-11-20',
    marketDate: '2025-12-01',
  },
  {
    id: 'prod-002',
    name: 'Industrial Hydraulic Press HP-500',
    modelNumber: 'HP-500-CE',
    category: 'Machinery & Industrial Equipment',
    applicableDirectives: ['MD', 'LVD', 'EMC'],
    assessmentModule: 'B',
    status: 'in_assessment',
    riskLevel: 'high',
    notifiedBodyId: 'nb-001',
    testingStatus: 'in_progress',
    docCompleteness: 72,
    createdAt: '2025-08-10',
    updatedAt: '2026-01-15',
  },
  {
    id: 'prod-003',
    name: 'MedScan Portable Ultrasound',
    modelNumber: 'MS-PU-300',
    category: 'Medical Devices',
    applicableDirectives: ['MDD', 'LVD', 'EMC', 'RoHS'],
    assessmentModule: 'H1',
    status: 'in_assessment',
    riskLevel: 'critical',
    notifiedBodyId: 'nb-002',
    testingStatus: 'in_progress',
    docCompleteness: 65,
    createdAt: '2025-04-22',
    updatedAt: '2026-02-01',
  },
  {
    id: 'prod-004',
    name: 'SafeGuard Helmet SG-Elite',
    modelNumber: 'SG-ELT-V3',
    category: 'Personal Protective Equipment',
    applicableDirectives: ['PPE'],
    assessmentModule: 'D',
    status: 'tested',
    riskLevel: 'medium',
    notifiedBodyId: 'nb-003',
    testingStatus: 'passed',
    docCompleteness: 88,
    createdAt: '2025-09-01',
    updatedAt: '2026-01-28',
  },
  {
    id: 'prod-005',
    name: 'EcoBoiler Condensing Unit CB-100',
    modelNumber: 'CB-100-EU',
    category: 'Pressure Equipment',
    applicableDirectives: ['PED', 'LVD', 'EMC', 'ECO'],
    assessmentModule: 'G',
    status: 'draft',
    riskLevel: 'high',
    testingStatus: 'not_started',
    docCompleteness: 30,
    createdAt: '2026-01-05',
    updatedAt: '2026-02-10',
  },
];

const DEMO_NOTIFIED_BODIES: NotifiedBody[] = [
  {
    id: 'nb-001',
    name: 'TUV Rheinland',
    notifiedBodyNumber: 'NB 0035',
    country: 'Germany',
    directives: ['MD', 'LVD', 'EMC', 'PED', 'ATEX'],
    accreditationStatus: 'active',
    engagementStatus: 'assessment_ongoing',
    contactEmail: 'ce-assessment@tuv.com',
    lastInteraction: '2026-02-05',
  },
  {
    id: 'nb-002',
    name: 'BSI Group',
    notifiedBodyNumber: 'NB 0086',
    country: 'United Kingdom',
    directives: ['MDD', 'LVD', 'EMC', 'PPE'],
    accreditationStatus: 'active',
    engagementStatus: 'assessment_ongoing',
    contactEmail: 'medical@bsigroup.com',
    lastInteraction: '2026-01-28',
  },
  {
    id: 'nb-003',
    name: 'SGS Fimko',
    notifiedBodyNumber: 'NB 0598',
    country: 'Finland',
    directives: ['PPE', 'MD', 'ATEX'],
    accreditationStatus: 'active',
    engagementStatus: 'completed',
    contactEmail: 'ppe@sgs.com',
    lastInteraction: '2026-01-15',
  },
  {
    id: 'nb-004',
    name: 'DEKRA Testing and Certification',
    notifiedBodyNumber: 'NB 0124',
    country: 'Germany',
    directives: ['LVD', 'EMC', 'RED', 'RoHS', 'ECO'],
    accreditationStatus: 'active',
    engagementStatus: 'not_engaged',
    contactEmail: 'certification@dekra.com',
  },
  {
    id: 'nb-005',
    name: 'Intertek',
    notifiedBodyNumber: 'NB 0359',
    country: 'Belgium',
    directives: ['LVD', 'EMC', 'RED', 'MD', 'TOY'],
    accreditationStatus: 'active',
    engagementStatus: 'inquiry_sent',
    contactEmail: 'eu-cert@intertek.com',
    lastInteraction: '2026-02-12',
  },
];

const DEMO_REQUIREMENTS: EssentialRequirement[] = [
  { id: 'req-001', directiveId: 'LVD', category: 'Protection against electrical hazards', requirement: 'Protection against direct contact with energized parts', standard: 'EN 62368-1', status: 'compliant', evidence: 'Test Report TR-2025-445' },
  { id: 'req-002', directiveId: 'LVD', category: 'Protection against electrical hazards', requirement: 'Protection against indirect contact (earth fault)', standard: 'EN 62368-1', status: 'compliant', evidence: 'Test Report TR-2025-445' },
  { id: 'req-003', directiveId: 'LVD', category: 'Thermal hazards', requirement: 'Protection against excessive temperatures on accessible surfaces', standard: 'EN 62368-1', status: 'compliant', evidence: 'Thermal imaging report TH-2025-112' },
  { id: 'req-004', directiveId: 'EMC', category: 'Emissions', requirement: 'Conducted emissions below limits', standard: 'EN 55032', status: 'compliant', evidence: 'EMC Test Report EMC-2025-890' },
  { id: 'req-005', directiveId: 'EMC', category: 'Emissions', requirement: 'Radiated emissions below limits', standard: 'EN 55032', status: 'partially_compliant', notes: 'Minor exceedance at 230MHz, retesting scheduled' },
  { id: 'req-006', directiveId: 'EMC', category: 'Immunity', requirement: 'Electrostatic discharge immunity', standard: 'EN 61000-4-2', status: 'compliant', evidence: 'EMC Test Report EMC-2025-891' },
  { id: 'req-007', directiveId: 'RED', category: 'Radio spectrum usage', requirement: 'Transmitter output power within limits', standard: 'EN 300 328', status: 'compliant', evidence: 'RF Test Report RF-2025-334' },
  { id: 'req-008', directiveId: 'RED', category: 'Radio spectrum usage', requirement: 'Spurious emissions within limits', standard: 'EN 301 489-17', status: 'not_assessed' },
  { id: 'req-009', directiveId: 'RoHS', category: 'Substance restrictions', requirement: 'Lead content below 0.1% by weight', standard: 'EN IEC 63000', status: 'compliant', evidence: 'Material declaration MD-2025-076' },
  { id: 'req-010', directiveId: 'RoHS', category: 'Substance restrictions', requirement: 'Mercury content below 0.1% by weight', standard: 'EN IEC 63000', status: 'compliant', evidence: 'Material declaration MD-2025-076' },
];

const DEMO_DOCUMENTS: TechnicalDocument[] = [
  { id: 'doc-001', productId: 'prod-001', documentType: 'Declaration of Conformity', title: 'EU DoC - SmartSensor Pro X200', version: '2.1', status: 'approved', uploadDate: '2025-11-15', lastModified: '2025-11-20', fileSize: '245 KB' },
  { id: 'doc-002', productId: 'prod-001', documentType: 'Test Report', title: 'LVD Safety Test Report', version: '1.0', status: 'approved', uploadDate: '2025-10-28', lastModified: '2025-10-28', fileSize: '1.2 MB' },
  { id: 'doc-003', productId: 'prod-001', documentType: 'Test Report', title: 'EMC Test Report', version: '1.1', status: 'approved', uploadDate: '2025-11-05', lastModified: '2025-11-10', fileSize: '2.8 MB' },
  { id: 'doc-004', productId: 'prod-001', documentType: 'Risk Assessment', title: 'Product Safety Risk Assessment', version: '1.2', status: 'approved', uploadDate: '2025-09-20', lastModified: '2025-11-01', fileSize: '890 KB' },
  { id: 'doc-005', productId: 'prod-002', documentType: 'Technical File', title: 'Technical File - Hydraulic Press HP-500', version: '0.8', status: 'draft', uploadDate: '2025-12-01', lastModified: '2026-01-15', fileSize: '4.5 MB' },
  { id: 'doc-006', productId: 'prod-002', documentType: 'Risk Assessment', title: 'Machinery Risk Assessment EN ISO 12100', version: '1.0', status: 'review', uploadDate: '2025-11-20', lastModified: '2026-01-10', fileSize: '1.7 MB' },
  { id: 'doc-007', productId: 'prod-003', documentType: 'Clinical Evaluation', title: 'Clinical Evaluation Report', version: '0.5', status: 'draft', uploadDate: '2025-10-15', lastModified: '2026-01-30', fileSize: '3.2 MB' },
  { id: 'doc-008', productId: 'prod-004', documentType: 'Declaration of Conformity', title: 'EU DoC - SafeGuard Helmet SG-Elite', version: '1.0', status: 'review', uploadDate: '2026-01-20', lastModified: '2026-01-28', fileSize: '210 KB' },
];

const DEMO_RISK_ITEMS: RiskAssessmentItem[] = [
  { id: 'risk-001', productId: 'prod-001', hazard: 'Electric shock from power supply failure', riskCategory: 'Electrical', severity: 4, probability: 1, riskScore: 4, mitigationMeasure: 'Double insulation, fuse protection, GFCI circuit', residualRisk: 'acceptable', status: 'verified' },
  { id: 'risk-002', productId: 'prod-001', hazard: 'Burns from overheating battery', riskCategory: 'Thermal', severity: 3, probability: 2, riskScore: 6, mitigationMeasure: 'Thermal cutoff, battery management system, ventilation design', residualRisk: 'acceptable', status: 'verified' },
  { id: 'risk-003', productId: 'prod-002', hazard: 'Crushing injury from moving press platens', riskCategory: 'Mechanical', severity: 5, probability: 3, riskScore: 15, mitigationMeasure: 'Light curtains, two-hand control, emergency stop', residualRisk: 'tolerable', status: 'mitigated' },
  { id: 'risk-004', productId: 'prod-002', hazard: 'Hydraulic fluid leak under pressure', riskCategory: 'Mechanical', severity: 4, probability: 2, riskScore: 8, mitigationMeasure: 'Pressure relief valves, burst-proof hoses, containment', residualRisk: 'acceptable', status: 'mitigated' },
  { id: 'risk-005', productId: 'prod-003', hazard: 'Incorrect diagnosis due to calibration drift', riskCategory: 'Clinical', severity: 5, probability: 2, riskScore: 10, mitigationMeasure: 'Auto-calibration, user calibration prompts, quality control protocol', residualRisk: 'tolerable', status: 'identified' },
  { id: 'risk-006', productId: 'prod-003', hazard: 'Patient skin irritation from probe contact', riskCategory: 'Biocompatibility', severity: 2, probability: 3, riskScore: 6, mitigationMeasure: 'Biocompatible materials, ultrasound gel barrier', residualRisk: 'acceptable', status: 'verified' },
  { id: 'risk-007', productId: 'prod-005', hazard: 'Pressure vessel rupture', riskCategory: 'Mechanical', severity: 5, probability: 1, riskScore: 5, mitigationMeasure: 'Safety valves, pressure relief, burst disc, periodic inspection', residualRisk: 'tolerable', status: 'identified' },
];

const DEMO_SURVEILLANCE_CHECKS: SurveillanceCheck[] = [
  { id: 'sc-001', category: 'Documentation', requirement: 'Declaration of Conformity is up to date and accessible', status: 'pass' },
  { id: 'sc-002', category: 'Documentation', requirement: 'Technical file is complete and maintained', status: 'pass' },
  { id: 'sc-003', category: 'Marking', requirement: 'CE mark is affixed correctly (min 5mm, visible, legible)', status: 'pass' },
  { id: 'sc-004', category: 'Marking', requirement: 'Notified body number displayed where required', status: 'pass' },
  { id: 'sc-005', category: 'Marking', requirement: 'Manufacturer identification and contact info on product', status: 'pass' },
  { id: 'sc-006', category: 'Traceability', requirement: 'Type, batch, or serial number on product', status: 'pass' },
  { id: 'sc-007', category: 'Traceability', requirement: 'Importer information displayed where applicable', status: 'not_applicable' },
  { id: 'sc-008', category: 'User Information', requirement: 'Instructions and safety info in official language(s)', status: 'pending', notes: 'Pending translations for Bulgarian and Romanian' },
  { id: 'sc-009', category: 'User Information', requirement: 'Warnings and precautionary measures clearly stated', status: 'pass' },
  { id: 'sc-010', category: 'Post-Market', requirement: 'Complaint handling procedure established', status: 'pass' },
  { id: 'sc-011', category: 'Post-Market', requirement: 'Non-conformity reporting process in place', status: 'pass' },
  { id: 'sc-012', category: 'Post-Market', requirement: 'Recall procedure documented and tested', status: 'pending', notes: 'Recall drill scheduled for Q2 2026' },
  { id: 'sc-013', category: 'Supply Chain', requirement: 'Economic operator obligations communicated', status: 'pass' },
  { id: 'sc-014', category: 'Supply Chain', requirement: 'Distributor compliance verification process', status: 'fail', notes: 'Distributor in Romania not verified yet' },
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
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    in_assessment: 'bg-blue-100 text-blue-700 border-blue-200',
    tested: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    certified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    marked: 'bg-green-100 text-green-700 border-green-200',
    withdrawn: 'bg-red-100 text-red-700 border-red-200',
    not_started: 'bg-gray-100 text-gray-700 border-gray-200',
    in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    passed: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    review: 'bg-blue-100 text-blue-700 border-blue-200',
    archived: 'bg-gray-100 text-gray-600 border-gray-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    suspended: 'bg-orange-100 text-orange-700 border-orange-200',
    compliant: 'bg-green-100 text-green-700 border-green-200',
    non_compliant: 'bg-red-100 text-red-700 border-red-200',
    partially_compliant: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    not_assessed: 'bg-gray-100 text-gray-600 border-gray-200',
    pass: 'bg-green-100 text-green-700 border-green-200',
    fail: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    not_applicable: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <Badge text={label} className={config[status] || 'bg-gray-100 text-gray-700 border-gray-200'} />;
};

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const config: Record<string, string> = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
  };
  return <Badge text={level.charAt(0).toUpperCase() + level.slice(1)} className={config[level] || 'bg-gray-100 text-gray-700 border-gray-200'} />;
};

const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-blue-500' }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, value)}%` }} />
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subLabel?: string; color: string }> = ({ icon, label, value, subLabel, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600 mt-1">{label}</p>
    {subLabel && <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CEMarkingWorkflowProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const CEMarkingWorkflow: React.FC<CEMarkingWorkflowProps> = ({ onBack }) => {
  const { t } = useI18n();
  type TabId = 'overview' | 'products' | 'assessment' | 'documentation' | 'notified_bodies';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [products, setProducts] = useState<CEProduct[]>([]);
  const [notifiedBodies, setNotifiedBodies] = useState<NotifiedBody[]>([]);
  const [requirements, setRequirements] = useState<EssentialRequirement[]>([]);
  const [documents, setDocuments] = useState<TechnicalDocument[]>([]);
  const [riskItems, setRiskItems] = useState<RiskAssessmentItem[]>([]);
  const [surveillanceChecks, setSurveillanceChecks] = useState<SurveillanceCheck[]>([]);
  const [serverReachable, setServerReachable] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<CEProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showCELabel, setShowCELabel] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const [newProduct, setNewProduct] = useState({
    name: '',
    modelNumber: '',
    category: PRODUCT_CATEGORIES[0],
    applicableDirectives: [] as string[],
    assessmentModule: 'A',
  });

  // ---------------------------------------------------------------------------
  // Loading / error state
  // ---------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // Fetch all data in parallel; each call is independent and can fail gracefully
      const [productsRes, notifiedBodiesRes, requirementsRes, documentsRes, riskItemsRes, surveillanceRes] =
        await Promise.allSettled([
          api.modules.ceMarking.listProducts(),
          api.modules.ceMarking.listNotifiedBodies(),
          api.modules.ceMarking.listRequirements(),
          api.modules.ceMarking.listDocuments(),
          api.modules.ceMarking.listRiskItems(),
          api.modules.ceMarking.listSurveillanceChecks(),
        ]);

      // If the primary products call failed, server is unreachable; fall back to local data.
      if (productsRes.status === 'rejected') {
        setServerReachable(false);
        setProducts(DEMO_PRODUCTS);
        setNotifiedBodies(DEMO_NOTIFIED_BODIES);
        setRequirements(DEMO_REQUIREMENTS);
        setDocuments(DEMO_DOCUMENTS);
        setRiskItems(DEMO_RISK_ITEMS);
        setSurveillanceChecks(DEMO_SURVEILLANCE_CHECKS);
        setLoadError('Unable to connect to server. Showing local data.');
        return;
      }

      setServerReachable(true);

      // --- Products ---
      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
        setProducts(productsRes.value.map((p: any) => ({
          id: p.id,
          name: p.name || '',
          modelNumber: p.modelNumber || '',
          category: p.category || '',
          applicableDirectives: p.applicableDirectives || [],
          assessmentModule: p.assessmentModule || 'A',
          status: p.status || 'draft',
          riskLevel: p.riskLevel || 'medium',
          notifiedBodyId: p.notifiedBodyId,
          testingStatus: p.testingStatus || 'not_started',
          docCompleteness: p.docCompleteness ?? 0,
          createdAt: p.createdAt || '',
          updatedAt: p.updatedAt || '',
          marketDate: p.marketDate,
        })));
      }

      // --- Notified Bodies ---
      if (notifiedBodiesRes.status === 'fulfilled' && Array.isArray(notifiedBodiesRes.value)) {
        setNotifiedBodies(notifiedBodiesRes.value);
      }

      // --- Essential Requirements ---
      if (requirementsRes.status === 'fulfilled' && Array.isArray(requirementsRes.value)) {
        setRequirements(requirementsRes.value);
      }

      // --- Documents ---
      if (documentsRes.status === 'fulfilled' && Array.isArray(documentsRes.value)) {
        setDocuments(documentsRes.value);
      }

      // --- Risk Items ---
      if (riskItemsRes.status === 'fulfilled' && Array.isArray(riskItemsRes.value)) {
        setRiskItems(riskItemsRes.value);
      }

      // --- Surveillance Checks ---
      if (surveillanceRes.status === 'fulfilled' && Array.isArray(surveillanceRes.value)) {
        setSurveillanceChecks(surveillanceRes.value);
      }
    } catch (err: any) {
      setServerReachable(false);
      setProducts(DEMO_PRODUCTS);
      setNotifiedBodies(DEMO_NOTIFIED_BODIES);
      setRequirements(DEMO_REQUIREMENTS);
      setDocuments(DEMO_DOCUMENTS);
      setRiskItems(DEMO_RISK_ITEMS);
      setSurveillanceChecks(DEMO_SURVEILLANCE_CHECKS);
      setLoadError('Unable to connect to server. Showing local data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.modelNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesRisk = filterRisk === 'all' || p.riskLevel === filterRisk;
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [products, searchQuery, filterStatus, filterRisk]);

  const overviewStats = useMemo(() => {
    const total = products.length;
    const marked = products.filter(p => p.status === 'marked').length;
    const inAssessment = products.filter(p => p.status === 'in_assessment').length;
    const avgDocCompleteness = total > 0 ? Math.round(products.reduce((sum, p) => sum + p.docCompleteness, 0) / total) : 0;
    const highRiskCount = products.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;
    const passedSurveillance = surveillanceChecks.filter(c => c.status === 'pass').length;
    const totalSurveillance = surveillanceChecks.filter(c => c.status !== 'not_applicable').length;
    const surveillanceScore = totalSurveillance > 0 ? Math.round((passedSurveillance / totalSurveillance) * 100) : 0;
    return { total, marked, inAssessment, avgDocCompleteness, highRiskCount, surveillanceScore };
  }, [products, surveillanceChecks]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const [isSaving, setIsSaving] = useState(false);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.modelNumber) return;

    const optimisticProduct: CEProduct = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      modelNumber: newProduct.modelNumber,
      category: newProduct.category,
      applicableDirectives: newProduct.applicableDirectives,
      assessmentModule: newProduct.assessmentModule,
      status: 'draft',
      riskLevel: 'medium',
      testingStatus: 'not_started',
      docCompleteness: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    // Optimistic update
    setProducts(prev => [optimisticProduct, ...prev]);
    setShowAddProductModal(false);
    setNewProduct({ name: '', modelNumber: '', category: PRODUCT_CATEGORIES[0], applicableDirectives: [], assessmentModule: 'A' });

    // Persist to backend
    setIsSaving(true);
    try {
      const created = await api.modules.ceMarking.createProduct({
        name: optimisticProduct.name,
        modelNumber: optimisticProduct.modelNumber,
        category: optimisticProduct.category,
        applicableDirectives: optimisticProduct.applicableDirectives,
        assessmentModule: optimisticProduct.assessmentModule,
        status: optimisticProduct.status,
        riskLevel: optimisticProduct.riskLevel,
        testingStatus: optimisticProduct.testingStatus,
        docCompleteness: optimisticProduct.docCompleteness,
      });
      // Replace optimistic entry with server-returned product (has real id)
      if (created && created.id) {
        setProducts(prev => prev.map(p => p.id === optimisticProduct.id ? { ...optimisticProduct, ...created } : p));
      }
    } catch (err: any) {
      // Keep the optimistic product in the list so the user doesn't lose data
      setLoadError('Product saved locally but failed to sync to server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const previousProducts = products;
    // Optimistic removal
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }

    try {
      await api.modules.ceMarking.deleteProduct(productId);
    } catch (err: any) {
      // Restore on failure
      setProducts(previousProducts);
      setLoadError('Failed to delete product on server. Change reverted.');
    }
  };

  const handleUpdateProductStatus = async (productId: string, status: CEProduct['status']) => {
    const previousProducts = products;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, status, updatedAt: new Date().toISOString().split('T')[0] } : p));

    try {
      await api.modules.ceMarking.updateProduct(productId, { status });
    } catch (err: any) {
      setProducts(previousProducts);
      setLoadError('Failed to update product on server. Change reverted.');
    }
  };

  const toggleDirective = (directiveId: string) => {
    setNewProduct(prev => ({
      ...prev,
      applicableDirectives: prev.applicableDirectives.includes(directiveId)
        ? prev.applicableDirectives.filter(d => d !== directiveId)
        : [...prev.applicableDirectives, directiveId],
    }));
  };

  // ---------------------------------------------------------------------------
  // Document / label generation + upload handlers
  // ---------------------------------------------------------------------------
  // Product selected inside the Generate-DoC modal (defaults to first product).
  const [docModalProductId, setDocModalProductId] = useState<string>('');
  const [docModalLanguage, setDocModalLanguage] = useState<string>('English');
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const [detailNotifiedBody, setDetailNotifiedBody] = useState<NotifiedBody | null>(null);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Build an EU Declaration of Conformity document from real product data.
  const buildDoCHtml = (product: CEProduct, language: string): string => {
    const directiveNames = product.applicableDirectives
      .map(id => EU_DIRECTIVES.find(d => d.id === id)?.name || id);
    const nb = product.notifiedBodyId ? notifiedBodies.find(n => n.id === product.notifiedBodyId) : undefined;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>EU Declaration of Conformity - ${esc(product.name)}</title></head>
<body style="font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#111">
<h1 style="text-align:center">EU DECLARATION OF CONFORMITY</h1>
<p style="text-align:center">No. DoC-${esc(product.modelNumber)}-${new Date().getFullYear()}</p>
<p><strong>Document language:</strong> ${esc(language)}</p>
<p><strong>1. Product:</strong> ${esc(product.name)} (Model ${esc(product.modelNumber)}, category ${esc(product.category)})</p>
<p><strong>2. Manufacturer:</strong> [Manufacturer name and registered address]</p>
<p><strong>3. This declaration of conformity is issued under the sole responsibility of the manufacturer.</strong></p>
<p><strong>4. Object of the declaration:</strong> ${esc(product.name)} / ${esc(product.modelNumber)}</p>
<p><strong>5. The object described above is in conformity with the relevant Union harmonisation legislation:</strong></p>
<ul>${directiveNames.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
<p><strong>6. Conformity assessment module:</strong> ${esc(product.assessmentModule)} - ${esc(ASSESSMENT_MODULES[product.assessmentModule]?.name || '')}</p>
<p><strong>7. Notified body:</strong> ${nb ? esc(nb.name + ' (' + nb.notifiedBodyNumber + ')') : 'Not applicable'}</p>
<p><strong>8. Additional information:</strong> Testing status ${esc(product.testingStatus)}; documentation completeness ${product.docCompleteness}%.</p>
<p style="margin-top:40px">Signed for and on behalf of: [Place, Date] &nbsp;&nbsp; [Name, Function] &nbsp;&nbsp; [Signature]</p>
</body></html>`;
  };

  const handleGenerateDoC = () => {
    const product = products.find(p => p.id === (docModalProductId || products[0]?.id));
    if (!product) {
      setLoadError('Select a product to generate a Declaration of Conformity.');
      return;
    }
    const html = buildDoCHtml(product, docModalLanguage);
    triggerDownload(new Blob([html], { type: 'text/html;charset=utf-8;' }), `DoC-${product.modelNumber}-${new Date().toISOString().slice(0, 10)}.html`);
    setShowDocModal(false);
  };

  const handleDownloadDocument = (doc: TechnicalDocument) => {
    const product = products.find(p => p.id === doc.productId);
    // Document binaries are not yet served by the backend; export the available
    // metadata so the action produces a real artifact for the operator.
    const payload = {
      generatedAt: new Date().toISOString(),
      document: doc,
      product: product ? { id: product.id, name: product.name, modelNumber: product.modelNumber } : undefined,
    };
    triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${doc.title.replace(/[^a-z0-9]+/gi, '-')}-v${doc.version}.json`);
  };

  // Render the CE mark as a standalone SVG and download it.
  const buildCeLabelSvg = (product: CEProduct): string => {
    const nb = product.notifiedBodyId ? notifiedBodies.find(n => n.id === product.notifiedBodyId) : undefined;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
<rect width="320" height="200" fill="#ffffff"/>
<text x="20" y="120" font-family="Arial, sans-serif" font-size="96" font-weight="bold" fill="#111">CE</text>
${nb ? `<text x="150" y="120" font-family="Arial, sans-serif" font-size="28" fill="#111">${esc(nb.notifiedBodyNumber.replace(/[^0-9]/g, ''))}</text>` : ''}
<text x="20" y="160" font-family="Arial, sans-serif" font-size="14" fill="#333">${esc(product.name)}</text>
<text x="20" y="180" font-family="Arial, sans-serif" font-size="12" fill="#666">${esc(product.modelNumber)}</text>
</svg>`;
  };

  const handleDownloadCeSvg = () => {
    if (!selectedProduct) return;
    triggerDownload(new Blob([buildCeLabelSvg(selectedProduct)], { type: 'image/svg+xml;charset=utf-8;' }), `ce-label-${selectedProduct.modelNumber}.svg`);
  };

  // Produce a downloadable verification payload (model/identity + verification URL)
  // for the product label. A scannable QR raster is rendered by the QR primitive
  // once available; this guarantees the action yields a real artifact today.
  const handleGenerateQr = () => {
    if (!selectedProduct) return;
    const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/product/${encodeURIComponent(selectedProduct.id)}`;
    const payload = {
      product: selectedProduct.name,
      modelNumber: selectedProduct.modelNumber,
      directives: selectedProduct.applicableDirectives,
      verifyUrl,
    };
    triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `ce-verify-${selectedProduct.modelNumber}.json`);
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxBytes = 25 * 1024 * 1024;
    const accepted = Array.from(files).filter(f => (allowed.includes(f.type) || /\.(pdf|docx|png|jpe?g)$/i.test(f.name)) && f.size <= maxBytes);
    if (accepted.length === 0) {
      setLoadError('Unsupported file type or file exceeds 25MB. Supported: PDF, DOCX, PNG, JPG.');
      return;
    }
    const targetProduct = selectedProduct || products[0];
    const newDocs: TechnicalDocument[] = accepted.map((f, i) => ({
      id: `doc-${Date.now()}-${i}`,
      productId: targetProduct?.id || '',
      documentType: 'Technical File',
      title: f.name,
      version: '1.0',
      status: 'draft',
      uploadDate: new Date().toISOString().slice(0, 10),
      lastModified: new Date().toISOString().slice(0, 10),
      fileSize: `${Math.max(1, Math.round(f.size / 1024))} KB`,
    }));
    setDocuments(prev => [...newDocs, ...prev]);
  };

  const handleSendInquiry = (nb: NotifiedBody) => {
    // Optimistically advance engagement state; persistence/email dispatch is handled
    // by the notified-body engagement endpoint once available.
    setNotifiedBodies(prev => prev.map(b => b.id === nb.id
      ? { ...b, engagementStatus: 'inquiry_sent', lastInteraction: new Date().toISOString().slice(0, 10) }
      : b));
    if (nb.contactEmail && typeof window !== 'undefined') {
      const subject = encodeURIComponent(`Conformity assessment inquiry - notified body ${nb.notifiedBodyNumber}`);
      window.open(`mailto:${nb.contactEmail}?subject=${subject}`, '_blank');
    }
  };

  // ---------------------------------------------------------------------------
  // Tab definitions
  // ---------------------------------------------------------------------------
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'assessment', label: 'Assessment', icon: ClipboardCheck },
    { id: 'documentation', label: 'Documentation', icon: FileText },
    { id: 'notified_bodies', label: 'Notified Bodies', icon: Building2 },
  ];

  // ---------------------------------------------------------------------------
  // Render: Overview Tab
  // ---------------------------------------------------------------------------
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={<Package size={20} className="text-blue-600" />} label="Total Products" value={overviewStats.total} color="bg-blue-50" />
        <StatCard icon={<CheckCircle size={20} className="text-green-600" />} label="CE Marked" value={overviewStats.marked} color="bg-green-50" />
        <StatCard icon={<Clock size={20} className="text-yellow-600" />} label="In Assessment" value={overviewStats.inAssessment} color="bg-yellow-50" />
        <StatCard icon={<FileText size={20} className="text-indigo-600" />} label="Avg Doc Completeness" value={`${overviewStats.avgDocCompleteness}%`} color="bg-indigo-50" />
        <StatCard icon={<AlertTriangle size={20} className="text-orange-600" />} label="High/Critical Risk" value={overviewStats.highRiskCount} color="bg-orange-50" />
        <StatCard icon={<Shield size={20} className="text-teal-600" />} label="Surveillance Score" value={`${overviewStats.surveillanceScore}%`} color="bg-teal-50" />
      </div>

      {/* Product Pipeline & Surveillance Readiness side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Certification Pipeline</h3>
          <div className="space-y-3">
            {['draft', 'in_assessment', 'tested', 'certified', 'marked'].map(status => {
              const count = products.filter(p => p.status === status).length;
              const pct = products.length > 0 ? (count / products.length) * 100 : 0;
              const colors: Record<string, string> = { draft: 'bg-gray-400', in_assessment: 'bg-blue-500', tested: 'bg-indigo-500', certified: 'bg-emerald-500', marked: 'bg-green-500' };
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-32 capitalize">{status.replace(/_/g, ' ')}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className={`${colors[status]} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Surveillance Readiness */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Surveillance Readiness</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {surveillanceChecks.map(check => (
              <div key={check.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                {check.status === 'pass' && <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />}
                {check.status === 'fail' && <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />}
                {check.status === 'pending' && <Clock size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />}
                {check.status === 'not_applicable' && <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-300">-</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{check.requirement}</p>
                  {check.notes && <p className="text-xs text-gray-500 mt-0.5">{check.notes}</p>}
                </div>
                <StatusBadge status={check.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Assessment Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Safety Risk Assessment Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Hazard</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">{t('common.category')}</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Risk Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Residual Risk</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {riskItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{product?.name || item.productId}</td>
                    <td className="py-3 px-4 text-gray-700">{item.hazard}</td>
                    <td className="py-3 px-4 text-gray-600">{item.riskCategory}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${item.riskScore >= 12 ? 'bg-red-100 text-red-700' : item.riskScore >= 8 ? 'bg-orange-100 text-orange-700' : item.riskScore >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {item.riskScore}
                      </span>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={item.residualRisk} /></td>
                    <td className="py-3 px-4"><StatusBadge status={item.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Products Tab
  // ---------------------------------------------------------------------------
  const renderProducts = () => (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`${t('common.search')}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">{t('common.all')} Statuses</option>
            <option value="draft">Draft</option>
            <option value="in_assessment">In Assessment</option>
            <option value="tested">Tested</option>
            <option value="certified">Certified</option>
            <option value="marked">CE Marked</option>
          </select>
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">{t('common.all')} Risk Levels</option>
            <option value="low">{t('risks.low')}</option>
            <option value="medium">{t('risks.medium')}</option>
            <option value="high">{t('risks.high')}</option>
            <option value="critical">{t('risks.critical')}</option>
          </select>
        </div>
        <button onClick={() => setShowAddProductModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus size={16} /> Register Product
        </button>
      </div>

      {/* Product cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedProduct(product); setActiveTab('assessment'); }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-500">{product.modelNumber}</p>
              </div>
              <StatusBadge status={product.status} />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {product.applicableDirectives.map(d => (
                <span key={d} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm mb-3">
              <div>
                <p className="text-gray-500 text-xs">Module</p>
                <p className="font-medium text-gray-900">{product.assessmentModule}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Risk</p>
                <RiskBadge level={product.riskLevel} />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Testing</p>
                <StatusBadge status={product.testingStatus} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Documentation</span>
                <span className="font-medium text-gray-700">{product.docCompleteness}%</span>
              </div>
              <ProgressBar value={product.docCompleteness} color={product.docCompleteness >= 90 ? 'bg-green-500' : product.docCompleteness >= 60 ? 'bg-blue-500' : 'bg-orange-500'} />
            </div>
            {product.status === 'marked' && (
              <div className="mt-3 flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); setSelectedProduct(product); setShowCELabel(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                  <Tag size={14} /> View CE Label
                </button>
                {product.marketDate && <span className="text-xs text-gray-500">Market entry: {product.marketDate}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No products match your criteria</p>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Assessment Tab
  // ---------------------------------------------------------------------------
  const renderAssessment = () => {
    const currentProduct = selectedProduct || products[0];
    const productRequirements = requirements.filter(r => currentProduct?.applicableDirectives.includes(r.directiveId));
    const productRisks = riskItems.filter(r => r.productId === currentProduct?.id);

    return (
      <div className="space-y-6">
        {/* Product selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Conformity Assessment</h3>
            <select
              value={currentProduct?.id || ''}
              onChange={e => setSelectedProduct(products.find(p => p.id === e.target.value) || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.modelNumber})</option>)}
            </select>
          </div>

          {currentProduct && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500 text-xs">{t('common.category')}</p><p className="font-medium">{currentProduct.category}</p></div>
              <div><p className="text-gray-500 text-xs">Assessment Module</p><p className="font-medium">{currentProduct.assessmentModule} - {ASSESSMENT_MODULES[currentProduct.assessmentModule]?.name.split(' - ')[1] || ''}</p></div>
              <div><p className="text-gray-500 text-xs">Notified Body Required</p><p className="font-medium">{ASSESSMENT_MODULES[currentProduct.assessmentModule]?.notifiedBodyRequired ? 'Yes' : 'No'}</p></div>
              <div><p className="text-gray-500 text-xs">{t('common.status')}</p><StatusBadge status={currentProduct.status} /></div>
            </div>
          )}
        </div>

        {/* Assessment Module Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Modules Reference</h3>
          <div className="space-y-2">
            {Object.entries(ASSESSMENT_MODULES).map(([key, mod]) => (
              <div key={key} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedModule(expandedModule === key ? null : key)}
                  className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors ${currentProduct?.assessmentModule === key ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentProduct?.assessmentModule === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{key}</span>
                    <span className="text-sm font-medium text-gray-900">{mod.name}</span>
                    {mod.notifiedBodyRequired && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">NB Required</span>}
                  </div>
                  {expandedModule === key ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </button>
                {expandedModule === key && (
                  <div className="px-4 pb-3 pt-1 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{mod.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Essential Requirements Checklist */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Essential Requirements Checklist</h3>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Compliant ({productRequirements.filter(r => r.status === 'compliant').length})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />Partial ({productRequirements.filter(r => r.status === 'partially_compliant').length})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />Not Assessed ({productRequirements.filter(r => r.status === 'not_assessed').length})</span>
            </div>
          </div>
          {currentProduct?.applicableDirectives.map(directiveId => {
            const directive = EU_DIRECTIVES.find(d => d.id === directiveId);
            const dirReqs = productRequirements.filter(r => r.directiveId === directiveId);
            if (dirReqs.length === 0) return null;
            return (
              <div key={directiveId} className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Shield size={14} className="text-blue-500" />
                  {directive?.name || directiveId}
                </h4>
                <div className="space-y-1.5">
                  {dirReqs.map(req => (
                    <div key={req.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50">
                      {req.status === 'compliant' && <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />}
                      {req.status === 'partially_compliant' && <AlertCircle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />}
                      {req.status === 'non_compliant' && <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />}
                      {req.status === 'not_assessed' && <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{req.requirement}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Standard: {req.standard}</span>
                          {req.evidence && <span>Evidence: {req.evidence}</span>}
                          {req.notes && <span className="text-yellow-600">{req.notes}</span>}
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {productRequirements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ClipboardCheck size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No essential requirements data for this product. Select directives to see requirements.</p>
            </div>
          )}
        </div>

        {/* Product-Level Risk Assessment */}
        {productRisks.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Safety Risk Assessment</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Hazard</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">S</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">P</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Score</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Mitigation</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Residual</th>
                  </tr>
                </thead>
                <tbody>
                  {productRisks.map(r => (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-800">{r.hazard}</td>
                      <td className="py-2 px-3 text-center text-gray-700">{r.severity}</td>
                      <td className="py-2 px-3 text-center text-gray-700">{r.probability}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${r.riskScore >= 12 ? 'bg-red-100 text-red-700' : r.riskScore >= 8 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {r.riskScore}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600 max-w-xs truncate">{r.mitigationMeasure}</td>
                      <td className="py-2 px-3"><StatusBadge status={r.residualRisk} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Documentation Tab
  // ---------------------------------------------------------------------------
  const renderDocumentation = () => {
    const docsByProduct = products.map(p => ({
      product: p,
      docs: documents.filter(d => d.productId === p.id),
    }));

    return (
      <div className="space-y-6">
        {/* Doc stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<FileText size={20} className="text-blue-600" />} label="Total Documents" value={documents.length} color="bg-blue-50" />
          <StatCard icon={<CheckCircle size={20} className="text-green-600" />} label={t('common.approved')} value={documents.filter(d => d.status === 'approved').length} color="bg-green-50" />
          <StatCard icon={<Eye size={20} className="text-indigo-600" />} label="In Review" value={documents.filter(d => d.status === 'review').length} color="bg-indigo-50" />
          <StatCard icon={<Edit3 size={20} className="text-yellow-600" />} label="Drafts" value={documents.filter(d => d.status === 'draft').length} color="bg-yellow-50" />
        </div>

        {/* DoC Template */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Declaration of Conformity Template</h3>
            <button onClick={() => { setDocModalProductId(products[0]?.id || ''); setShowDocModal(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <Download size={14} /> Generate DoC
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 text-sm space-y-3">
            <div className="text-center border-b border-gray-300 pb-3">
              <p className="font-bold text-lg text-gray-900">EU DECLARATION OF CONFORMITY</p>
              <p className="text-gray-500">No. [DoC-XXXX-YYYY]</p>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-semibold">1. Product:</span> [Product name, type, batch/serial number]</p>
              <p><span className="font-semibold">2. Manufacturer:</span> [Name, registered trade name, address]</p>
              <p><span className="font-semibold">3. This declaration of conformity is issued under the sole responsibility of the manufacturer.</span></p>
              <p><span className="font-semibold">4. Object of the declaration:</span> [Product identification, traceability info]</p>
              <p><span className="font-semibold">5. The object described above is in conformity with:</span></p>
              <ul className="ml-6 list-disc text-gray-600">
                <li>Directive 2014/35/EU (Low Voltage)</li>
                <li>Directive 2014/30/EU (EMC)</li>
                <li>[Additional applicable directives]</li>
              </ul>
              <p><span className="font-semibold">6. Harmonised standards referenced:</span> [EN 62368-1, EN 55032, ...]</p>
              <p><span className="font-semibold">7. Notified body:</span> [Name, NB number] (if applicable)</p>
              <p><span className="font-semibold">8. Additional information:</span></p>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p>[Place, Date]</p>
                  <p>[Name, Function]</p>
                  <p className="italic text-gray-500">[Signature]</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 border-2 border-gray-400 rounded flex items-center justify-center text-2xl font-bold text-gray-700">CE</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents by Product */}
        {docsByProduct.map(({ product, docs }) => (
          docs.length > 0 && (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">{product.name} ({product.modelNumber})</h3>
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                        <p className="text-xs text-gray-500">{doc.documentType} | v{doc.version} | {doc.fileSize}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={doc.status} />
                      <span className="text-xs text-gray-400">{doc.lastModified}</span>
                      <button onClick={() => handleDownloadDocument(doc)} title={`${t('common.download')} ${doc.title}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download size={14} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {/* Upload area */}
        <div
          onClick={() => uploadInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleUploadFiles(e.dataTransfer.files); }}
          className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            className="hidden"
            onChange={e => { handleUploadFiles(e.target.files); e.target.value = ''; }}
          />
          <Upload size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">{t('common.upload')} Technical Documentation</p>
          <p className="text-xs text-gray-500 mt-1">Drop files here or click to browse. Supports PDF, DOCX, and image formats (max 25MB).</p>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Notified Bodies Tab
  // ---------------------------------------------------------------------------
  const renderNotifiedBodies = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Building2 size={20} className="text-purple-600" />} label="Total Bodies" value={notifiedBodies.length} color="bg-purple-50" />
        <StatCard icon={<CheckCircle size={20} className="text-green-600" />} label="Active Accreditation" value={notifiedBodies.filter(nb => nb.accreditationStatus === 'active').length} color="bg-green-50" />
        <StatCard icon={<Zap size={20} className="text-blue-600" />} label="Assessments Ongoing" value={notifiedBodies.filter(nb => nb.engagementStatus === 'assessment_ongoing').length} color="bg-blue-50" />
        <StatCard icon={<Target size={20} className="text-emerald-600" />} label="Completed" value={notifiedBodies.filter(nb => nb.engagementStatus === 'completed').length} color="bg-emerald-50" />
      </div>

      {/* Notified Body Cards */}
      <div className="space-y-4">
        {notifiedBodies.map(nb => {
          const engagementConfig: Record<string, { color: string; label: string }> = {
            not_engaged: { color: 'bg-gray-100 text-gray-600', label: 'Not Engaged' },
            inquiry_sent: { color: 'bg-blue-100 text-blue-700', label: 'Inquiry Sent' },
            proposal_received: { color: 'bg-indigo-100 text-indigo-700', label: 'Proposal Received' },
            contracted: { color: 'bg-purple-100 text-purple-700', label: 'Contracted' },
            assessment_ongoing: { color: 'bg-yellow-100 text-yellow-700', label: 'Assessment Ongoing' },
            completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
          };
          const eng = engagementConfig[nb.engagementStatus] || engagementConfig.not_engaged;
          return (
            <div key={nb.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{nb.name}</h4>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-mono">{nb.notifiedBodyNumber}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{nb.country}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={nb.accreditationStatus} />
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${eng.color}`}>{eng.label}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {nb.directives.map(d => (
                  <span key={d} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">{d}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-gray-500">
                  {nb.contactEmail && <span className="flex items-center gap-1"><ExternalLink size={12} />{nb.contactEmail}</span>}
                  {nb.lastInteraction && <span className="flex items-center gap-1"><Clock size={12} />Last contact: {nb.lastInteraction}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDetailNotifiedBody(nb)} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    View Details
                  </button>
                  {nb.engagementStatus === 'not_engaged' && (
                    <button onClick={() => handleSendInquiry(nb)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                      Send Inquiry
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Modals
  // ---------------------------------------------------------------------------
  const renderAddProductModal = () => showAddProductModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Register New Product</h3>
          <button onClick={() => setShowAddProductModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input type="text" value={newProduct.name} onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Smart Temperature Controller" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model Number *</label>
            <input type="text" value={newProduct.modelNumber} onChange={e => setNewProduct(prev => ({ ...prev, modelNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., STC-200-EU" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
            <select value={newProduct.category} onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Module</label>
            <select value={newProduct.assessmentModule} onChange={e => setNewProduct(prev => ({ ...prev, assessmentModule: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              {Object.entries(ASSESSMENT_MODULES).map(([key, mod]) => <option key={key} value={key}>{key} - {mod.name.split(' - ')[1]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Directives</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {EU_DIRECTIVES.map(d => (
                <label key={d.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${newProduct.applicableDirectives.includes(d.id) ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={newProduct.applicableDirectives.includes(d.id)} onChange={() => toggleDirective(d.id)} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">{d.id} - {d.category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={() => setShowAddProductModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">{t('common.cancel')}</button>
          <button onClick={handleAddProduct} disabled={!newProduct.name || !newProduct.modelNumber} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Register Product</button>
        </div>
      </div>
    </div>
  );

  const renderCELabelModal = () => showCELabel && selectedProduct && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">CE Marking Label</h3>
          <button onClick={() => setShowCELabel(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-8 flex flex-col items-center">
          <div className="w-32 h-32 border-4 border-gray-800 rounded-lg flex items-center justify-center mb-6 bg-white">
            <span className="text-6xl font-bold text-gray-800 tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>CE</span>
          </div>
          <div className="text-center space-y-2">
            <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
            <p className="text-sm text-gray-500">{selectedProduct.modelNumber}</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {selectedProduct.applicableDirectives.map(d => (
                <span key={d} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{d}</span>
              ))}
            </div>
            {selectedProduct.notifiedBodyId && (
              <p className="text-sm text-gray-600 mt-2">
                NB: {notifiedBodies.find(nb => nb.id === selectedProduct.notifiedBodyId)?.notifiedBodyNumber || selectedProduct.notifiedBodyId}
              </p>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleDownloadCeSvg} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <Download size={14} /> Download SVG
            </button>
            <button onClick={handleGenerateQr} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              <QrCode size={14} /> Generate QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifiedBodyDetailModal = () => detailNotifiedBody && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{detailNotifiedBody.name}</h3>
            <p className="text-sm text-gray-500 font-mono">{detailNotifiedBody.notifiedBodyNumber} | {detailNotifiedBody.country}</p>
          </div>
          <button onClick={() => setDetailNotifiedBody(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-gray-500 text-xs">Accreditation</p><StatusBadge status={detailNotifiedBody.accreditationStatus} /></div>
            <div><p className="text-gray-500 text-xs">Engagement</p><p className="font-medium capitalize">{detailNotifiedBody.engagementStatus.replace(/_/g, ' ')}</p></div>
            {detailNotifiedBody.contactEmail && <div><p className="text-gray-500 text-xs">Contact</p><p className="font-medium">{detailNotifiedBody.contactEmail}</p></div>}
            {detailNotifiedBody.contactPhone && <div><p className="text-gray-500 text-xs">Phone</p><p className="font-medium">{detailNotifiedBody.contactPhone}</p></div>}
            {detailNotifiedBody.lastInteraction && <div><p className="text-gray-500 text-xs">Last Interaction</p><p className="font-medium">{detailNotifiedBody.lastInteraction}</p></div>}
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Directives Covered</p>
            <div className="flex flex-wrap gap-1.5">
              {detailNotifiedBody.directives.map(d => <span key={d} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">{d}</span>)}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          {detailNotifiedBody.engagementStatus === 'not_engaged' && (
            <button onClick={() => { handleSendInquiry(detailNotifiedBody); setDetailNotifiedBody(null); }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Send Inquiry</button>
          )}
          <button onClick={() => setDetailNotifiedBody(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.close')}</button>
        </div>
      </div>
    </div>
  );

  const renderDocGenerateModal = () => showDocModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Generate Declaration of Conformity</h3>
          <button onClick={() => setShowDocModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
            <select value={docModalProductId} onChange={e => setDocModalProductId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.modelNumber})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Language</label>
            <select value={docModalLanguage} onChange={e => setDocModalLanguage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option>English</option>
              <option>German</option>
              <option>French</option>
              <option>Italian</option>
              <option>Spanish</option>
            </select>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">The DoC will be generated using the product's technical file data, applicable directives, and harmonised standards. Please review before signing.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={() => setShowDocModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
          <button onClick={handleGenerateDoC} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Generate DoC</button>
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
            <h1 className="text-3xl font-bold text-gray-900">CE Marking Workflow</h1>
            <p className="text-gray-600 mt-1">Conformity assessment, documentation, and market readiness</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> {isLoading ? 'Syncing...' : 'Sync'}
          </button>
          <button onClick={() => setShowAddProductModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
            <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">{t('common.loading')} CE marking data...</span>
        </div>
      )}
      {isSaving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />
          <span className="text-sm text-blue-700">Saving changes to server...</span>
        </div>
      )}
      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <span className="text-sm text-amber-700">{loadError}</span>
          <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-700"><X size={14} /></button>
        </div>
      )}

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
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'products' && renderProducts()}
      {activeTab === 'assessment' && renderAssessment()}
      {activeTab === 'documentation' && renderDocumentation()}
      {activeTab === 'notified_bodies' && renderNotifiedBodies()}

      {/* Modals */}
      {renderAddProductModal()}
      {renderCELabelModal()}
      {renderDocGenerateModal()}
      {renderNotifiedBodyDetailModal()}
    </div>
  );
};

export default CEMarkingWorkflow;
