import React, { useState, useCallback } from 'react';
import { api } from '../../services/api';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Target,
  BarChart3,
  Calendar,
  ExternalLink,
  Download,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  Info,
  XCircle,
  Upload,
  CheckSquare,
  X,
  Sparkles,
  Star,
  Users,
  Play,
  Pause,
  Building2,
  Globe,
  Lock,
  Unlock,
  Activity,
  Layers,
  Link2,
  Hash,
  Bell,
  ArrowRight,
  MoreVertical,
  Award,
  Minus,
  Plus,
  Cpu,
  Database,
  CreditCard,
  Wifi,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Vendor {
  id: string;
  name: string;
  category: string;
  tier: 'critical' | 'high' | 'medium' | 'low';
  overallRiskScore: number;
  previousRiskScore: number;
  status: 'active' | 'under-review' | 'monitoring' | 'onboarding' | 'offboarding';
  dataAccess: string;
  contractExpiry: string;
  lastAssessment: string;
  nextAssessment: string;
  certifications: string[];
  country: string;
  contactEmail: string;
  slaCompliance: number;
  incidentCount: number;
  fourthParties: string[];
  riskBreakdown: {
    security: number;
    privacy: number;
    operational: number;
    financial: number;
    compliance: number;
    reputational: number;
  };
  findings: VendorFinding[];
  tasks: VendorTask[];
}

interface VendorFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  status: 'open' | 'remediated' | 'accepted' | 'mitigated';
  discoveredDate: string;
  dueDate?: string;
}

interface VendorTask {
  id: string;
  title: string;
  type: 'assessment' | 'follow-up' | 'review' | 'monitoring' | 'onboarding';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  assignee: string;
  dueDate: string;
  aiGenerated: boolean;
}

interface AssessmentQueue {
  id: string;
  vendorName: string;
  vendorId: string;
  assessmentType: string;
  status: 'queued' | 'collecting' | 'analyzing' | 'review' | 'completed';
  progress: number;
  startedAt?: string;
  estimatedCompletion?: string;
  aiAgent: string;
}

// ─── Demo Data ──────────────────────────────────────────────────────────────────

const VENDORS: Vendor[] = [
  {
    id: 'V-001',
    name: 'CloudSync Analytics',
    category: 'Cloud Infrastructure',
    tier: 'critical',
    overallRiskScore: 58,
    previousRiskScore: 72,
    status: 'under-review',
    dataAccess: 'Full Database Access',
    contractExpiry: '2026-12-31',
    lastAssessment: '2025-11-15',
    nextAssessment: '2026-03-15',
    certifications: ['SOC 2 Type II', 'ISO 27001'],
    country: 'United States',
    contactEmail: 'security@cloudsync.example.com',
    slaCompliance: 94.2,
    incidentCount: 3,
    fourthParties: ['AWS', 'Datadog', 'PagerDuty'],
    riskBreakdown: { security: 62, privacy: 55, operational: 48, financial: 70, compliance: 58, reputational: 52 },
    findings: [
      { id: 'F-001', title: 'Insufficient encryption for data in transit between regions', severity: 'critical', category: 'Security', description: 'Data transfers between US-East and EU-West regions use TLS 1.2 without perfect forward secrecy.', status: 'open', discoveredDate: '2026-02-01', dueDate: '2026-03-01' },
      { id: 'F-002', title: 'Missing SOC 2 bridge letter', severity: 'high', category: 'Compliance', description: 'SOC 2 Type II report expires March 2026 with no bridge letter provided for the gap period.', status: 'open', discoveredDate: '2026-01-20', dueDate: '2026-02-28' },
      { id: 'F-003', title: 'Data retention policy exceeds contractual limits', severity: 'medium', category: 'Privacy', description: 'Vendor retains processed data for 180 days despite contractual requirement of 90 days maximum.', status: 'mitigated', discoveredDate: '2025-12-10' },
    ],
    tasks: [
      { id: 'T-001', title: 'Request updated encryption documentation', type: 'follow-up', status: 'in-progress', assignee: 'Sarah Chen', dueDate: '2026-02-28', aiGenerated: true },
      { id: 'T-002', title: 'Schedule quarterly security review call', type: 'review', status: 'pending', assignee: 'Mike Rodriguez', dueDate: '2026-03-15', aiGenerated: true },
    ],
  },
  {
    id: 'V-002',
    name: 'SecureHost Pro',
    category: 'Web Hosting',
    tier: 'high',
    overallRiskScore: 74,
    previousRiskScore: 71,
    status: 'active',
    dataAccess: 'Read-Only Customer PII',
    contractExpiry: '2027-06-30',
    lastAssessment: '2026-01-10',
    nextAssessment: '2026-07-10',
    certifications: ['SOC 2 Type II', 'ISO 27001', 'PCI DSS'],
    country: 'Germany',
    contactEmail: 'compliance@securehost.example.com',
    slaCompliance: 99.1,
    incidentCount: 0,
    fourthParties: ['Hetzner', 'Cloudflare'],
    riskBreakdown: { security: 78, privacy: 72, operational: 80, financial: 68, compliance: 75, reputational: 71 },
    findings: [
      { id: 'F-004', title: 'Annual penetration test scheduled but not yet completed', severity: 'medium', category: 'Security', description: 'Vendor committed to annual pen testing. 2026 test is scheduled for March but not yet executed.', status: 'open', discoveredDate: '2026-02-01', dueDate: '2026-03-31' },
    ],
    tasks: [
      { id: 'T-003', title: 'Verify penetration test completion', type: 'monitoring', status: 'pending', assignee: 'Lisa Park', dueDate: '2026-04-01', aiGenerated: true },
    ],
  },
  {
    id: 'V-003',
    name: 'DataFlow Inc',
    category: 'Data Processing',
    tier: 'critical',
    overallRiskScore: 65,
    previousRiskScore: 68,
    status: 'monitoring',
    dataAccess: 'Full Database Access',
    contractExpiry: '2026-09-30',
    lastAssessment: '2025-09-20',
    nextAssessment: '2026-03-20',
    certifications: ['SOC 2 Type II'],
    country: 'India',
    contactEmail: 'security@dataflow.example.com',
    slaCompliance: 96.8,
    incidentCount: 1,
    fourthParties: ['Azure', 'MongoDB Atlas', 'Elastic Cloud', 'Twilio'],
    riskBreakdown: { security: 68, privacy: 60, operational: 72, financial: 62, compliance: 55, reputational: 63 },
    findings: [
      { id: 'F-005', title: 'New sub-processor added without prior notification', severity: 'high', category: 'Privacy', description: 'Vendor onboarded Twilio as a sub-processor without providing the contractually required 30-day prior notification.', status: 'open', discoveredDate: '2026-02-05', dueDate: '2026-02-25' },
      { id: 'F-006', title: 'ISO 27001 certification not maintained', severity: 'high', category: 'Compliance', description: 'Vendor previously held ISO 27001 certification which lapsed in 2025. Only SOC 2 remains current.', status: 'accepted', discoveredDate: '2025-10-01' },
      { id: 'F-007', title: 'Incident response SLA breached', severity: 'medium', category: 'Operational', description: 'Recent security incident reported 8 hours after detection, exceeding the 4-hour SLA.', status: 'open', discoveredDate: '2026-01-15', dueDate: '2026-03-01' },
    ],
    tasks: [
      { id: 'T-004', title: 'Obtain sub-processor disclosure documentation', type: 'follow-up', status: 'overdue', assignee: 'DPO Office', dueDate: '2026-02-15', aiGenerated: true },
      { id: 'T-005', title: 'Annual reassessment - full scope', type: 'assessment', status: 'pending', assignee: 'Sarah Chen', dueDate: '2026-03-20', aiGenerated: false },
    ],
  },
  {
    id: 'V-004',
    name: 'PaymentGate Systems',
    category: 'Payment Processing',
    tier: 'critical',
    overallRiskScore: 81,
    previousRiskScore: 79,
    status: 'active',
    dataAccess: 'Payment/Health Data (PCI/HIPAA)',
    contractExpiry: '2027-12-31',
    lastAssessment: '2026-01-05',
    nextAssessment: '2026-04-05',
    certifications: ['PCI DSS Level 1', 'SOC 2 Type II', 'ISO 27001'],
    country: 'United States',
    contactEmail: 'security@paymentgate.example.com',
    slaCompliance: 99.97,
    incidentCount: 0,
    fourthParties: ['Visa', 'Mastercard'],
    riskBreakdown: { security: 85, privacy: 78, operational: 88, financial: 80, compliance: 82, reputational: 75 },
    findings: [],
    tasks: [
      { id: 'T-006', title: 'Quarterly PCI compliance verification', type: 'review', status: 'pending', assignee: 'Alex Kim', dueDate: '2026-04-05', aiGenerated: true },
    ],
  },
  {
    id: 'V-005',
    name: 'TalentHub HR',
    category: 'HR/Payroll',
    tier: 'high',
    overallRiskScore: 69,
    previousRiskScore: 69,
    status: 'active',
    dataAccess: 'Employee PII',
    contractExpiry: '2026-11-30',
    lastAssessment: '2025-12-01',
    nextAssessment: '2026-06-01',
    certifications: ['SOC 2 Type II'],
    country: 'United Kingdom',
    contactEmail: 'compliance@talenthub.example.com',
    slaCompliance: 97.5,
    incidentCount: 1,
    fourthParties: ['AWS', 'Stripe', 'SendGrid'],
    riskBreakdown: { security: 72, privacy: 65, operational: 74, financial: 68, compliance: 67, reputational: 70 },
    findings: [
      { id: 'F-008', title: 'Employee data exported to non-adequate jurisdiction', severity: 'high', category: 'Privacy', description: 'Analytics processing involves temporary data transfer to servers in a jurisdiction without GDPR adequacy decision.', status: 'open', discoveredDate: '2026-01-20', dueDate: '2026-03-15' },
    ],
    tasks: [
      { id: 'T-007', title: 'Request data transfer impact assessment', type: 'follow-up', status: 'in-progress', assignee: 'DPO Office', dueDate: '2026-03-01', aiGenerated: true },
    ],
  },
  {
    id: 'V-006',
    name: 'NetGuard Security',
    category: 'Security Services',
    tier: 'medium',
    overallRiskScore: 82,
    previousRiskScore: 80,
    status: 'active',
    dataAccess: 'Network Logs Only',
    contractExpiry: '2027-03-31',
    lastAssessment: '2026-02-01',
    nextAssessment: '2026-08-01',
    certifications: ['SOC 2 Type II', 'ISO 27001', 'CREST'],
    country: 'Australia',
    contactEmail: 'security@netguard.example.com',
    slaCompliance: 99.8,
    incidentCount: 0,
    fourthParties: ['GCP'],
    riskBreakdown: { security: 88, privacy: 80, operational: 82, financial: 78, compliance: 84, reputational: 80 },
    findings: [],
    tasks: [],
  },
  {
    id: 'V-007',
    name: 'QuickScan Docs',
    category: 'Document Management',
    tier: 'low',
    overallRiskScore: 76,
    previousRiskScore: 74,
    status: 'active',
    dataAccess: 'Internal Documents',
    contractExpiry: '2026-08-31',
    lastAssessment: '2025-10-15',
    nextAssessment: '2026-04-15',
    certifications: ['ISO 27001'],
    country: 'Canada',
    contactEmail: 'support@quickscan.example.com',
    slaCompliance: 98.2,
    incidentCount: 0,
    fourthParties: ['AWS S3'],
    riskBreakdown: { security: 75, privacy: 73, operational: 80, financial: 78, compliance: 72, reputational: 78 },
    findings: [],
    tasks: [],
  },
];

const ASSESSMENT_QUEUE: AssessmentQueue[] = [
  { id: 'AQ-001', vendorName: 'CloudSync Analytics', vendorId: 'V-001', assessmentType: 'Emergency Reassessment', status: 'analyzing', progress: 72, startedAt: '2026-02-17T08:00:00Z', estimatedCompletion: '2026-02-17T14:00:00Z', aiAgent: 'Risk Analysis Agent' },
  { id: 'AQ-002', vendorName: 'DataFlow Inc', vendorId: 'V-003', assessmentType: 'Annual Reassessment', status: 'collecting', progress: 35, startedAt: '2026-02-17T09:00:00Z', estimatedCompletion: '2026-02-18T12:00:00Z', aiAgent: 'Evidence Collection Agent' },
  { id: 'AQ-003', vendorName: 'TalentHub HR', vendorId: 'V-005', assessmentType: 'Privacy Impact Assessment', status: 'queued', progress: 0, aiAgent: 'Privacy Analysis Agent' },
  { id: 'AQ-004', vendorName: 'PaymentGate Systems', vendorId: 'V-004', assessmentType: 'Quarterly PCI Review', status: 'completed', progress: 100, startedAt: '2026-02-15T10:00:00Z', estimatedCompletion: '2026-02-16T09:00:00Z', aiAgent: 'Compliance Verification Agent' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

const TierBadge: React.FC<{ tier: Vendor['tier'] }> = ({ tier }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[tier]}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'active': 'bg-green-100 text-green-700',
    'under-review': 'bg-purple-100 text-purple-700',
    'monitoring': 'bg-blue-100 text-blue-700',
    'onboarding': 'bg-yellow-100 text-yellow-700',
    'offboarding': 'bg-gray-100 text-gray-600',
    'queued': 'bg-gray-100 text-gray-600',
    'collecting': 'bg-blue-100 text-blue-700',
    'analyzing': 'bg-purple-100 text-purple-700',
    'review': 'bg-yellow-100 text-yellow-700',
    'completed': 'bg-green-100 text-green-700',
    'pending': 'bg-gray-100 text-gray-600',
    'in-progress': 'bg-blue-100 text-blue-700',
    'overdue': 'bg-red-100 text-red-700',
    'open': 'bg-red-100 text-red-700',
    'remediated': 'bg-green-100 text-green-700',
    'accepted': 'bg-yellow-100 text-yellow-700',
    'mitigated': 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
    </span>
  );
};

const RiskScoreGauge: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'sm' }) => {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const ringColor = score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
  const dim = size === 'lg' ? 80 : 48;
  const r = size === 'lg' ? 34 : 19;
  const sw = size === 'lg' ? 7 : 4;
  const cx = dim / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: dim, height: dim }}>
      <svg className="-rotate-90" width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
        <circle cx={cx} cy={cx} r={r} fill="none" className={ringColor} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${color} ${size === 'lg' ? 'text-lg' : 'text-xs'}`}>{score}</span>
      </div>
    </div>
  );
};

const RiskBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-24 text-right">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8">{score}</span>
    </div>
  );
};

const ScoreTrend: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus size={10} />No change</span>;
  if (diff > 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingUp size={10} />+{diff} pts</span>;
  return <span className="text-xs text-red-600 flex items-center gap-0.5"><TrendingDown size={10} />{diff} pts</span>;
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export const AgenticVendorRisk: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'assessments' | 'scores' | 'reports'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [vendorAssessmentRunning, setVendorAssessmentRunning] = useState<Record<string, boolean>>({});
  const [vendorAssessmentComplete, setVendorAssessmentComplete] = useState<Record<string, boolean>>({});
  const [alertThresholdVendor, setAlertThresholdVendor] = useState<string | null>(null);
  const [socReportRequested, setSocReportRequested] = useState<Record<string, boolean>>({});
  const [assessmentDetailView, setAssessmentDetailView] = useState<string | null>(null);
  const [pausedAgents, setPausedAgents] = useState<Record<string, boolean>>({});
  const [generatingReports, setGeneratingReports] = useState<Record<number, boolean>>({});
  const [generatedReports, setGeneratedReports] = useState<Record<number, boolean>>({});
  const [scheduleReportIdx, setScheduleReportIdx] = useState<number | null>(null);

  // Stats
  const criticalVendors = VENDORS.filter(v => v.tier === 'critical').length;
  const underReviewCount = VENDORS.filter(v => v.status === 'under-review').length;
  const avgRiskScore = Math.round(VENDORS.reduce((sum, v) => sum + v.overallRiskScore, 0) / VENDORS.length);
  const openFindings = VENDORS.reduce((sum, v) => sum + v.findings.filter(f => f.status === 'open').length, 0);
  const totalFourthParties = new Set(VENDORS.flatMap(v => v.fourthParties)).size;
  const activeAssessments = ASSESSMENT_QUEUE.filter(a => a.status !== 'completed').length;

  const filteredVendors = VENDORS.filter(v => {
    if (searchQuery && !v.name.toLowerCase().includes(searchQuery.toLowerCase()) && !v.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (tierFilter !== 'all' && v.tier !== tierFilter) return false;
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    return true;
  });

  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAssessmentResult, setAiAssessmentResult] = useState<any | null>(null);

  const handleRunAgent = useCallback(async () => {
    setIsRunningAgent(true);
    setAiError(null);

    try {
      // Pick first vendor from queue for assessment, or use the selected vendor
      const vendorToAssess = ASSESSMENT_QUEUE[0] || VENDORS[0];
      if (!vendorToAssess) {
        setAiError('No vendors in the assessment queue.');
        setIsRunningAgent(false);
        return;
      }

      const vendorName = 'name' in vendorToAssess ? vendorToAssess.name : vendorToAssess.vendorName;
      const vendorCategory = 'category' in vendorToAssess ? vendorToAssess.category : vendorToAssess.assessmentType;
      const result = await api.ai.agenticVendorRisk(
        {
          name: vendorName,
          service: vendorCategory || 'Cloud Services',
          dataAccess: 'Sensitive data with potential PII access',
          certifications: ['SOC 2 Type II', 'ISO 27001'],
          subProcessors: [],
        },
        ['Security', 'Privacy', 'Business Continuity', 'Regulatory', 'Fourth-Party']
      );

      setAiAssessmentResult(result);
    } catch (error: any) {
      console.error('Agentic vendor risk error:', error);
      setAiError(error?.message || 'Failed to run AI vendor assessment. Please try again.');
    } finally {
      setIsRunningAgent(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    const exportData = {
      vendors: VENDORS,
      assessmentQueue: ASSESSMENT_QUEUE,
      avgRiskScore,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-risk-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [avgRiskScore]);

  const tabs = [
    { key: 'queue', label: 'Vendor Queue', icon: <Layers size={16} />, count: VENDORS.length },
    { key: 'assessments', label: 'Active Assessments', icon: <Activity size={16} />, count: activeAssessments },
    { key: 'scores', label: 'Risk Scores', icon: <BarChart3 size={16} /> },
    { key: 'reports', label: 'Reports', icon: <FileText size={16} /> },
  ] as const;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agentic Vendor Risk Assessment</h2>
            <p className="text-sm text-gray-500 mt-0.5">Autonomous AI agents for continuous vendor risk monitoring and assessment</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAgent}
            disabled={isRunningAgent}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isRunningAgent ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Agent Running...
              </>
            ) : (
              <>
                <Cpu size={16} />
                Launch Assessment Agent
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Total Vendors</span>
            <Building2 size={16} className="text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{VENDORS.length}</p>
          <p className="text-xs text-gray-400">managed vendors</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Critical Tier</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalVendors}</p>
          <p className="text-xs text-gray-400">require close monitoring</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Avg Risk Score</span>
            <BarChart3 size={16} className="text-yellow-500" />
          </div>
          <p className={`text-2xl font-bold ${avgRiskScore >= 70 ? 'text-green-600' : avgRiskScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{avgRiskScore}</p>
          <p className="text-xs text-gray-400">across all vendors</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Open Findings</span>
            <AlertCircle size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{openFindings}</p>
          <p className="text-xs text-gray-400">requiring resolution</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">4th Parties</span>
            <Link2 size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalFourthParties}</p>
          <p className="text-xs text-gray-400">unique sub-processors</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Active Agents</span>
            <Cpu size={16} className="text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-brand-600">{activeAssessments}</p>
          <p className="text-xs text-gray-400">assessments running</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {'count' in tab && tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        {(activeTab === 'queue' || activeTab === 'scores') && (
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search vendors..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  showFilters ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter size={14} />
                Filters
              </button>
            </div>
            {showFilters && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="all">All Tiers</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="under-review">Under Review</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="onboarding">Onboarding</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* ─── Vendor Queue Tab ─────────────────────────────────── */}
        {activeTab === 'queue' && (
          <div className="p-4 space-y-3">
            {filteredVendors.length === 0 && (
              <div className="text-center py-12">
                <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No vendors match your filters</p>
              </div>
            )}

            {filteredVendors.map(vendor => (
              <div
                key={vendor.id}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  vendor.tier === 'critical' && vendor.status === 'under-review' ? 'border-red-200 bg-red-50/20' : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RiskScoreGauge score={vendor.overallRiskScore} />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-semibold text-gray-900">{vendor.name}</h4>
                          <TierBadge tier={vendor.tier} />
                          <StatusBadge status={vendor.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{vendor.category}</span>
                          <span className="flex items-center gap-1"><Globe size={10} />{vendor.country}</span>
                          <span className="flex items-center gap-1"><Database size={10} />{vendor.dataAccess}</span>
                          <ScoreTrend current={vendor.overallRiskScore} previous={vendor.previousRiskScore} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs">
                        <div className="flex items-center gap-2">
                          {vendor.findings.filter(f => f.status === 'open').length > 0 && (
                            <span className="text-red-600 font-medium">{vendor.findings.filter(f => f.status === 'open').length} findings</span>
                          )}
                          {vendor.fourthParties.length > 0 && (
                            <span className="text-purple-600 font-medium">{vendor.fourthParties.length} 4th parties</span>
                          )}
                        </div>
                      </div>
                      {expandedVendor === vendor.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>
                </button>

                {expandedVendor === vendor.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {/* Vendor Details Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">SLA Compliance</p>
                        <p className={`text-lg font-bold ${vendor.slaCompliance >= 99 ? 'text-green-600' : vendor.slaCompliance >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {vendor.slaCompliance}%
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Incidents (12m)</p>
                        <p className={`text-lg font-bold ${vendor.incidentCount === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {vendor.incidentCount}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Contract Expiry</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date(vendor.contractExpiry).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Next Assessment</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date(vendor.nextAssessment).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Risk Breakdown */}
                    <div className="mt-4">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Risk Score Breakdown</h5>
                      <div className="space-y-1.5">
                        <RiskBar label="Security" score={vendor.riskBreakdown.security} />
                        <RiskBar label="Privacy" score={vendor.riskBreakdown.privacy} />
                        <RiskBar label="Operational" score={vendor.riskBreakdown.operational} />
                        <RiskBar label="Financial" score={vendor.riskBreakdown.financial} />
                        <RiskBar label="Compliance" score={vendor.riskBreakdown.compliance} />
                        <RiskBar label="Reputational" score={vendor.riskBreakdown.reputational} />
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="mt-4">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Certifications</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {vendor.certifications.map(cert => (
                          <span key={cert} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200 flex items-center gap-1">
                            <Award size={10} />
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Fourth Parties */}
                    {vendor.fourthParties.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <Link2 size={12} />
                          Fourth-Party Dependencies ({vendor.fourthParties.length})
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {vendor.fourthParties.map(fp => (
                            <span key={fp} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                              {fp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Findings */}
                    {vendor.findings.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Findings ({vendor.findings.length})</h5>
                        <div className="space-y-2">
                          {vendor.findings.map(finding => (
                            <div key={finding.id} className={`p-3 rounded-lg border ${finding.status === 'open' ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                  finding.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                  finding.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                  finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                  'bg-blue-100 text-blue-700 border-blue-200'
                                }`}>{finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}</span>
                                <StatusBadge status={finding.status} />
                                <span className="text-xs text-gray-400">{finding.category}</span>
                              </div>
                              <p className="text-sm font-medium text-gray-900">{finding.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{finding.description}</p>
                              {finding.dueDate && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <Calendar size={10} />
                                  Due: {new Date(finding.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    {vendor.tasks.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Follow-up Tasks ({vendor.tasks.length})</h5>
                        <div className="space-y-1.5">
                          {vendor.tasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={task.status} />
                                <span className="text-sm text-gray-700">{task.title}</span>
                                {task.aiGenerated && (
                                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full flex items-center gap-0.5">
                                    <Sparkles size={8} />AI
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{task.assignee}</span>
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {/* Alert Threshold Modal */}
                    {alertThresholdVendor === vendor.id && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs font-semibold text-yellow-900 flex items-center gap-1">
                            <Bell size={12} />
                            Alert Threshold Settings for {vendor.name}
                          </h5>
                          <button onClick={() => setAlertThresholdVendor(null)} className="text-yellow-600 hover:text-yellow-800">
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-yellow-700">
                          Current threshold: Alert when risk score drops by {vendor.tier === 'critical' ? 5 : vendor.tier === 'high' ? 10 : vendor.tier === 'medium' ? 15 : 20} points.
                          Tier-based thresholds are active for this vendor.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          if (vendorAssessmentRunning[vendor.id]) return;
                          setVendorAssessmentRunning(prev => ({ ...prev, [vendor.id]: true }));
                          setVendorAssessmentComplete(prev => ({ ...prev, [vendor.id]: false }));
                          setTimeout(() => {
                            setVendorAssessmentRunning(prev => ({ ...prev, [vendor.id]: false }));
                            setVendorAssessmentComplete(prev => ({ ...prev, [vendor.id]: true }));
                          }, 2000);
                        }}
                        disabled={vendorAssessmentRunning[vendor.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                      >
                        {vendorAssessmentRunning[vendor.id] ? (
                          <><Loader2 size={12} className="animate-spin" />Running...</>
                        ) : vendorAssessmentComplete[vendor.id] ? (
                          <><CheckCircle2 size={12} />Assessment Complete</>
                        ) : (
                          <><Cpu size={12} />Run AI Assessment</>
                        )}
                      </button>
                      <button
                        onClick={() => setAlertThresholdVendor(alertThresholdVendor === vendor.id ? null : vendor.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${
                          alertThresholdVendor === vendor.id
                            ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Bell size={12} />
                        Set Alert Threshold
                      </button>
                      <button
                        onClick={() => {
                          setSocReportRequested(prev => ({ ...prev, [vendor.id]: true }));
                        }}
                        disabled={socReportRequested[vendor.id]}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${
                          socReportRequested[vendor.id]
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {socReportRequested[vendor.id] ? (
                          <><CheckCircle2 size={12} />SOC 2 Request Sent</>
                        ) : (
                          <><FileText size={12} />Request SOC 2 Report</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Active Assessments Tab ───────────────────────────── */}
        {activeTab === 'assessments' && (
          <div className="p-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <Cpu size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Autonomous Assessment Agents</h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    AI agents autonomously collect vendor documentation, analyze security posture, score risks, and generate follow-up tasks.
                    Each assessment runs through: Collection &rarr; Analysis &rarr; Scoring &rarr; Report Generation.
                  </p>
                </div>
              </div>
            </div>

            {ASSESSMENT_QUEUE.map(assessment => (
              <div key={assessment.id} className={`bg-white border rounded-xl p-4 ${assessment.status === 'completed' ? 'border-green-200' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-gray-900">{assessment.vendorName}</h4>
                      <StatusBadge status={assessment.status} />
                    </div>
                    <p className="text-xs text-gray-500">{assessment.assessmentType} | Agent: {assessment.aiAgent}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{assessment.progress}%</p>
                    <p className="text-xs text-gray-400">complete</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      assessment.status === 'completed' ? 'bg-green-500' :
                      assessment.status === 'analyzing' ? 'bg-purple-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${assessment.progress}%` }}
                  />
                </div>

                {/* Stage Indicators */}
                <div className="flex items-center gap-0 mt-3">
                  {['Queued', 'Collecting', 'Analyzing', 'Review', 'Complete'].map((stage, idx) => {
                    const stageKey = stage.toLowerCase().replace('complete', 'completed');
                    const stageOrder = ['queued', 'collecting', 'analyzing', 'review', 'completed'];
                    const currentIdx = stageOrder.indexOf(assessment.status);
                    const isActive = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <React.Fragment key={stage}>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isCurrent ? 'bg-brand-100 text-brand-700' :
                          isActive ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {isActive && idx < currentIdx ? <CheckCircle2 size={10} /> : isCurrent ? <Loader2 size={10} className="animate-spin" /> : <Circle size={10} />}
                          {stage}
                        </div>
                        {idx < 4 && <div className={`flex-1 h-0.5 ${isActive && idx < currentIdx ? 'bg-green-300' : 'bg-gray-200'}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Timestamps */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  {assessment.startedAt && (
                    <span className="flex items-center gap-1"><Clock size={10} />Started: {new Date(assessment.startedAt).toLocaleString()}</span>
                  )}
                  {assessment.estimatedCompletion && (
                    <span className="flex items-center gap-1"><Calendar size={10} />Est. Completion: {new Date(assessment.estimatedCompletion).toLocaleString()}</span>
                  )}
                </div>

                {assessment.status !== 'completed' && assessment.status !== 'queued' && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setAssessmentDetailView(assessmentDetailView === assessment.id ? null : assessment.id)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                        assessmentDetailView === assessment.id ? 'text-brand-700 bg-brand-50' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Eye size={10} />{assessmentDetailView === assessment.id ? 'Hide Details' : 'View Details'}
                    </button>
                    <button
                      onClick={() => setPausedAgents(prev => ({ ...prev, [assessment.id]: !prev[assessment.id] }))}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                        pausedAgents[assessment.id] ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pausedAgents[assessment.id] ? (
                        <><Play size={10} />Resume Agent</>
                      ) : (
                        <><Pause size={10} />Pause Agent</>
                      )}
                    </button>
                  </div>
                )}
                {assessmentDetailView === assessment.id && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 space-y-1">
                    <p><span className="font-semibold">Assessment ID:</span> {assessment.id}</p>
                    <p><span className="font-semibold">Vendor:</span> {assessment.vendorName} ({assessment.vendorId})</p>
                    <p><span className="font-semibold">Type:</span> {assessment.assessmentType}</p>
                    <p><span className="font-semibold">Agent:</span> {assessment.aiAgent}</p>
                    <p><span className="font-semibold">Status:</span> {pausedAgents[assessment.id] ? 'Paused' : assessment.status}</p>
                    <p><span className="font-semibold">Progress:</span> {assessment.progress}%</p>
                    {assessment.startedAt && <p><span className="font-semibold">Started:</span> {new Date(assessment.startedAt).toLocaleString()}</p>}
                    {assessment.estimatedCompletion && <p><span className="font-semibold">Est. Completion:</span> {new Date(assessment.estimatedCompletion).toLocaleString()}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Risk Scores Tab ──────────────────────────────────── */}
        {activeTab === 'scores' && (
          <div className="p-4 space-y-4">
            {/* Comparison Matrix */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={16} className="text-brand-600" />
                  Vendor Risk Comparison Matrix
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Vendor</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Tier</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Overall</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Security</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Privacy</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Ops</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Financial</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Compliance</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">SLA</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredVendors.sort((a, b) => a.overallRiskScore - b.overallRiskScore).map(vendor => (
                      <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                            <p className="text-xs text-gray-400">{vendor.category}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center"><TierBadge tier={vendor.tier} /></td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-sm font-bold ${vendor.overallRiskScore >= 80 ? 'text-green-600' : vendor.overallRiskScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {vendor.overallRiskScore}
                          </span>
                        </td>
                        {['security', 'privacy', 'operational', 'financial', 'compliance'].map(key => {
                          const val = vendor.riskBreakdown[key as keyof typeof vendor.riskBreakdown];
                          return (
                            <td key={key} className="px-3 py-3 text-center">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                val >= 80 ? 'bg-green-100 text-green-700' : val >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>{val}</span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center">
                          <span className={`text-xs font-medium ${vendor.slaCompliance >= 99 ? 'text-green-600' : vendor.slaCompliance >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {vendor.slaCompliance}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <ScoreTrend current={vendor.overallRiskScore} previous={vendor.previousRiskScore} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tier Distribution */}
            <div className="grid grid-cols-4 gap-4">
              {(['critical', 'high', 'medium', 'low'] as const).map(tier => {
                const count = VENDORS.filter(v => v.tier === tier).length;
                const avgScore = count > 0
                  ? Math.round(VENDORS.filter(v => v.tier === tier).reduce((s, v) => s + v.overallRiskScore, 0) / count)
                  : 0;
                const colors: Record<string, { bg: string; border: string; text: string }> = {
                  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
                  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
                  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
                  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
                };
                const c = colors[tier];
                return (
                  <div key={tier} className={`${c.bg} border ${c.border} rounded-xl p-4 text-center`}>
                    <h5 className={`text-xs font-semibold uppercase ${c.text}`}>{tier} Tier</h5>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                    <p className="text-xs text-gray-500 mt-0.5">vendors</p>
                    <p className={`text-sm font-bold mt-2 ${c.text}`}>Avg: {avgScore}</p>
                  </div>
                );
              })}
            </div>

            {/* Continuous Monitoring */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Activity size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-green-900">Continuous Monitoring Active</h4>
                  <p className="text-xs text-green-700 mt-0.5">
                    AI agents continuously monitor all {VENDORS.length} vendors for risk score changes, certification expirations, security incidents,
                    and fourth-party supply chain events. Alert thresholds are configured per vendor tier.
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} />Critical: Alert at -5 pts</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} />High: Alert at -10 pts</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} />Medium: Alert at -15 pts</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} />Low: Alert at -20 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Reports Tab ──────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { title: 'Vendor Risk Summary Report', desc: 'Executive summary of all vendor risk scores, tier distribution, and trending data.', icon: <BarChart3 size={18} className="text-brand-600" />, type: 'PDF' },
                { title: 'Detailed Assessment Report', desc: 'Full assessment details including findings, risk breakdown, and remediation status for all vendors.', icon: <FileText size={18} className="text-blue-600" />, type: 'PDF' },
                { title: 'Fourth-Party Risk Map', desc: 'Visual map of all fourth-party dependencies and their risk exposure across your vendor ecosystem.', icon: <Link2 size={18} className="text-purple-600" />, type: 'PDF' },
                { title: 'SLA Compliance Report', desc: 'SLA compliance metrics, breach history, and trend analysis for all active vendor contracts.', icon: <CheckSquare size={18} className="text-green-600" />, type: 'CSV' },
                { title: 'Certification Tracker', desc: 'Status of vendor certifications including expiration dates, gap periods, and renewal tracking.', icon: <Award size={18} className="text-yellow-600" />, type: 'PDF' },
                { title: 'Vendor Comparison Matrix', desc: 'Side-by-side comparison of vendor risk scores across all assessment dimensions.', icon: <Layers size={18} className="text-orange-600" />, type: 'CSV' },
              ].map((report, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-200 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      {report.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{report.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{report.desc}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => {
                            if (generatingReports[idx]) return;
                            setGeneratingReports(prev => ({ ...prev, [idx]: true }));
                            setGeneratedReports(prev => ({ ...prev, [idx]: false }));
                            setTimeout(() => {
                              setGeneratingReports(prev => ({ ...prev, [idx]: false }));
                              setGeneratedReports(prev => ({ ...prev, [idx]: true }));
                            }, 2000);
                          }}
                          disabled={generatingReports[idx]}
                          className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                        >
                          {generatingReports[idx] ? (
                            <><Loader2 size={12} className="animate-spin" />Generating...</>
                          ) : generatedReports[idx] ? (
                            <><CheckCircle2 size={12} />{report.type} Ready</>
                          ) : (
                            <><Download size={12} />Generate {report.type}</>
                          )}
                        </button>
                        <button
                          onClick={() => setScheduleReportIdx(scheduleReportIdx === idx ? null : idx)}
                          className={`flex items-center gap-1 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${
                            scheduleReportIdx === idx
                              ? 'border-brand-300 bg-brand-50 text-brand-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Calendar size={12} />
                          {scheduleReportIdx === idx ? 'Scheduled' : 'Schedule'}
                        </button>
                      </div>
                      {scheduleReportIdx === idx && (
                        <div className="mt-2 p-2 bg-brand-50 border border-brand-200 rounded-lg">
                          <p className="text-xs text-brand-700 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Report scheduled for automatic weekly generation every Monday at 9:00 AM.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Reports */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">Recently Generated Reports</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { name: 'Vendor Risk Summary - February 2026', date: '2026-02-15', type: 'PDF', size: '2.4 MB' },
                  { name: 'CloudSync Analytics Emergency Assessment', date: '2026-02-10', type: 'PDF', size: '1.8 MB' },
                  { name: 'Q4 2025 Vendor Review', date: '2026-01-15', type: 'PDF', size: '3.1 MB' },
                  { name: 'Fourth-Party Risk Analysis', date: '2026-01-10', type: 'PDF', size: '1.2 MB' },
                ].map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-700">{report.name}</p>
                        <p className="text-xs text-gray-400">{new Date(report.date).toLocaleDateString()} | {report.type} | {report.size}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const blob = new Blob(
                          [`${report.name}\n\nGenerated: ${report.date}\nType: ${report.type}\nSize: ${report.size}\n\nThis is a placeholder report document.`],
                          { type: report.type === 'CSV' ? 'text/csv' : 'application/pdf' }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${report.name.replace(/\s+/g, '_')}.${report.type.toLowerCase()}`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-brand-600 hover:text-brand-700 font-medium hover:bg-brand-50 rounded transition-colors"
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Circle: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);
