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
  FolderOpen,
  CheckSquare,
  X,
  Sparkles,
  CircleDot,
  FileCheck,
  FileClock,
  FileX,
  FileQuestion,
  Percent,
  Award,
  PieChart,
  ListChecks,
  ArrowRight,
  Star,
  Lightbulb,
  Link2,
  Hash,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FrameworkReadiness {
  id: string;
  name: string;
  overallScore: number;
  totalControls: number;
  evidenceComplete: number;
  evidenceCurrent: number;
  evidenceVerified: number;
  evidenceMatched: number;
  evidenceMissing: number;
  evidenceStale: number;
  evidenceUnverified: number;
  evidenceMismatched: number;
  lastScanned: string;
  status: 'ready' | 'at-risk' | 'not-ready';
}

interface EvidenceGap {
  id: string;
  controlId: string;
  controlName: string;
  framework: string;
  gapType: 'missing' | 'stale' | 'unverified' | 'mismatched' | 'incomplete';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  currentEvidence?: string;
  lastUpdated?: string;
  daysStale?: number;
  aiSuggestion: string;
  suggestedEvidence: string[];
  estimatedEffort: string;
  controlOwner: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  affectedControls: number;
  scoreImprovement: number;
  category: string;
  priority: number;
  steps: string[];
}

// ─── Demo Data ──────────────────────────────────────────────────────────────────

const FRAMEWORK_READINESS: FrameworkReadiness[] = [
  {
    id: 'fw-1',
    name: 'SOC 2 Type II',
    overallScore: 71,
    totalControls: 64,
    evidenceComplete: 45,
    evidenceCurrent: 40,
    evidenceVerified: 38,
    evidenceMatched: 42,
    evidenceMissing: 12,
    evidenceStale: 7,
    evidenceUnverified: 5,
    evidenceMismatched: 3,
    lastScanned: '2026-02-17T08:30:00Z',
    status: 'at-risk',
  },
  {
    id: 'fw-2',
    name: 'ISO 27001:2022',
    overallScore: 78,
    totalControls: 93,
    evidenceComplete: 72,
    evidenceCurrent: 68,
    evidenceVerified: 65,
    evidenceMatched: 70,
    evidenceMissing: 14,
    evidenceStale: 8,
    evidenceUnverified: 6,
    evidenceMismatched: 4,
    lastScanned: '2026-02-17T08:30:00Z',
    status: 'at-risk',
  },
  {
    id: 'fw-3',
    name: 'GDPR',
    overallScore: 85,
    totalControls: 48,
    evidenceComplete: 41,
    evidenceCurrent: 39,
    evidenceVerified: 40,
    evidenceMatched: 40,
    evidenceMissing: 3,
    evidenceStale: 4,
    evidenceUnverified: 2,
    evidenceMismatched: 1,
    lastScanned: '2026-02-17T08:30:00Z',
    status: 'ready',
  },
  {
    id: 'fw-4',
    name: 'HIPAA',
    overallScore: 64,
    totalControls: 54,
    evidenceComplete: 34,
    evidenceCurrent: 30,
    evidenceVerified: 28,
    evidenceMatched: 31,
    evidenceMissing: 15,
    evidenceStale: 6,
    evidenceUnverified: 5,
    evidenceMismatched: 4,
    lastScanned: '2026-02-17T08:30:00Z',
    status: 'not-ready',
  },
  {
    id: 'fw-5',
    name: 'PCI DSS v4.0',
    overallScore: 73,
    totalControls: 78,
    evidenceComplete: 57,
    evidenceCurrent: 52,
    evidenceVerified: 50,
    evidenceMatched: 54,
    evidenceMissing: 10,
    evidenceStale: 9,
    evidenceUnverified: 6,
    evidenceMismatched: 5,
    lastScanned: '2026-02-17T08:30:00Z',
    status: 'at-risk',
  },
  {
    id: 'fw-6',
    name: 'NIST CSF 2.0',
    overallScore: 82,
    totalControls: 106,
    evidenceComplete: 87,
    evidenceCurrent: 82,
    evidenceVerified: 80,
    evidenceMatched: 84,
    evidenceMissing: 11,
    evidenceStale: 7,
    evidenceUnverified: 5,
    evidenceMismatched: 3,
    lastScanned: '2026-02-17T08:30:00Z',
    status: 'ready',
  },
];

const EVIDENCE_GAPS: EvidenceGap[] = [
  {
    id: 'EG-001',
    controlId: 'CC6.1',
    controlName: 'Logical Access Security',
    framework: 'SOC 2 Type II',
    gapType: 'missing',
    severity: 'critical',
    description: 'No evidence of multi-factor authentication configuration for production systems. Required for SOC 2 CC6.1 logical access controls.',
    aiSuggestion: 'Export MFA enrollment report from your identity provider (Okta/Azure AD). Include screenshots of MFA policy configuration and coverage statistics.',
    suggestedEvidence: ['MFA enrollment report', 'Identity provider MFA policy screenshot', 'MFA coverage statistics by user group'],
    estimatedEffort: '2 hours',
    controlOwner: 'IT Security Team',
  },
  {
    id: 'EG-002',
    controlId: 'CC7.2',
    controlName: 'Security Incident Monitoring',
    framework: 'SOC 2 Type II',
    gapType: 'stale',
    severity: 'critical',
    description: 'SIEM monitoring configuration evidence is 120 days old. Auditors require evidence within the audit period (last 90 days).',
    currentEvidence: 'SIEM Configuration Review - Oct 2025',
    lastUpdated: '2025-10-20',
    daysStale: 120,
    aiSuggestion: 'Generate a fresh SIEM configuration export showing current monitoring rules, alert thresholds, and incident response escalation paths.',
    suggestedEvidence: ['Current SIEM configuration export', 'Active monitoring rules inventory', 'Recent alert log samples (last 30 days)'],
    estimatedEffort: '3 hours',
    controlOwner: 'SOC Team',
  },
  {
    id: 'EG-003',
    controlId: 'A.8.24',
    controlName: 'Use of Cryptography',
    framework: 'ISO 27001:2022',
    gapType: 'unverified',
    severity: 'high',
    description: 'Encryption policy documentation exists but has not been verified against actual implementation. Key management practices may not match policy.',
    currentEvidence: 'Encryption Policy v3.1',
    lastUpdated: '2025-12-15',
    aiSuggestion: 'Conduct a verification review comparing the encryption policy with actual implementation. Document TLS configurations, encryption-at-rest settings, and key rotation schedules.',
    suggestedEvidence: ['TLS configuration scan results', 'Encryption-at-rest verification report', 'Key rotation schedule evidence', 'Certificate management inventory'],
    estimatedEffort: '4 hours',
    controlOwner: 'Platform Engineering',
  },
  {
    id: 'EG-004',
    controlId: 'Art. 30',
    controlName: 'Records of Processing Activities',
    framework: 'GDPR',
    gapType: 'incomplete',
    severity: 'high',
    description: 'Data processing inventory is missing 3 recently added data flows. Record of Processing Activities (ROPA) is not complete per GDPR Article 30.',
    currentEvidence: 'ROPA v2.4 - 45 of 48 processing activities documented',
    lastUpdated: '2026-01-10',
    aiSuggestion: 'Run the AI Data Mapper to identify undocumented data flows. Update the ROPA to include the new processing activities with legal basis, purpose, and data categories.',
    suggestedEvidence: ['Updated ROPA with all 48 processing activities', 'Data flow diagrams for new activities', 'Legal basis documentation for each activity'],
    estimatedEffort: '6 hours',
    controlOwner: 'DPO Office',
  },
  {
    id: 'EG-005',
    controlId: '164.312(a)',
    controlName: 'Access Control - Unique User ID',
    framework: 'HIPAA',
    gapType: 'missing',
    severity: 'critical',
    description: 'No evidence of unique user identification for ePHI systems. Required by HIPAA 164.312(a)(2)(i) for user identity verification.',
    aiSuggestion: 'Export user access lists from all ePHI-containing systems. Document the user provisioning process and unique ID assignment procedures.',
    suggestedEvidence: ['User access list for each ePHI system', 'User provisioning workflow documentation', 'Annual access review results', 'Terminated user deprovisioning evidence'],
    estimatedEffort: '8 hours',
    controlOwner: 'Health IT Team',
  },
  {
    id: 'EG-006',
    controlId: '164.308(a)(5)',
    controlName: 'Security Awareness Training',
    framework: 'HIPAA',
    gapType: 'stale',
    severity: 'high',
    description: 'Security awareness training completion records are 95 days old. Training compliance evidence should be refreshed quarterly.',
    currentEvidence: 'Training Completion Report - Nov 2025',
    lastUpdated: '2025-11-14',
    daysStale: 95,
    aiSuggestion: 'Generate current training completion report from your LMS. Include completion rates by department, quiz scores, and attestation records.',
    suggestedEvidence: ['Current LMS training completion report', 'Department-level completion rates', 'Training content review records'],
    estimatedEffort: '1 hour',
    controlOwner: 'HR Department',
  },
  {
    id: 'EG-007',
    controlId: 'Req 6.3',
    controlName: 'Software Development Security',
    framework: 'PCI DSS v4.0',
    gapType: 'mismatched',
    severity: 'high',
    description: 'Code review evidence references an outdated SDLC process. The current development workflow uses a different branching and review strategy not reflected in evidence.',
    currentEvidence: 'SDLC Policy v2.0 - Waterfall Methodology',
    lastUpdated: '2025-09-01',
    aiSuggestion: 'Update the SDLC evidence to reflect current Agile/DevOps practices. Document the code review process, branch protection rules, and security testing integration.',
    suggestedEvidence: ['Updated SDLC policy reflecting current practices', 'Branch protection rule configuration', 'Code review workflow documentation', 'SAST/DAST scan results'],
    estimatedEffort: '6 hours',
    controlOwner: 'Engineering Lead',
  },
  {
    id: 'EG-008',
    controlId: 'A1.2',
    controlName: 'Business Continuity Testing',
    framework: 'SOC 2 Type II',
    gapType: 'stale',
    severity: 'high',
    description: 'Business continuity plan test results are from over 8 months ago. Annual testing minimum required, but semi-annual is recommended for SOC 2.',
    currentEvidence: 'BCP Test Results - June 2025',
    lastUpdated: '2025-06-15',
    daysStale: 247,
    aiSuggestion: 'Schedule and execute a BCP tabletop exercise or full simulation. Document test scenarios, participant roles, results, and improvement actions.',
    suggestedEvidence: ['BCP tabletop exercise report', 'DR failover test results', 'RTO/RPO measurement evidence', 'Improvement action plan from test'],
    estimatedEffort: '16 hours',
    controlOwner: 'IT Operations',
  },
  {
    id: 'EG-009',
    controlId: 'GV.SC-03',
    controlName: 'Supply Chain Risk Management',
    framework: 'NIST CSF 2.0',
    gapType: 'missing',
    severity: 'medium',
    description: 'No evidence of formal supply chain risk management program. NIST CSF 2.0 Govern category requires documented SCRM processes.',
    aiSuggestion: 'Create a supply chain risk management policy and procedure. Document vendor risk assessment criteria, monitoring processes, and incident response for supply chain events.',
    suggestedEvidence: ['SCRM Policy document', 'Vendor risk assessment template', 'Active vendor risk register', 'Supply chain incident response plan'],
    estimatedEffort: '12 hours',
    controlOwner: 'Procurement/Security',
  },
  {
    id: 'EG-010',
    controlId: 'C1.1',
    controlName: 'Data Classification',
    framework: 'SOC 2 Type II',
    gapType: 'incomplete',
    severity: 'medium',
    description: 'Data classification policy exists but 4 data repositories have not been classified. All data stores must have documented classification levels.',
    currentEvidence: 'Data Classification Inventory - 28 of 32 repositories classified',
    lastUpdated: '2026-01-05',
    aiSuggestion: 'Identify and classify the remaining 4 unclassified data repositories. Update the data classification inventory and apply appropriate handling labels.',
    suggestedEvidence: ['Complete data classification inventory', 'Data repository scan results', 'Classification label assignment evidence'],
    estimatedEffort: '4 hours',
    controlOwner: 'Data Governance Team',
  },
  {
    id: 'EG-011',
    controlId: 'Req 11.3',
    controlName: 'Penetration Testing',
    framework: 'PCI DSS v4.0',
    gapType: 'stale',
    severity: 'critical',
    description: 'Most recent penetration test report is 13 months old. PCI DSS requires annual penetration testing of the CDE at minimum.',
    currentEvidence: 'Annual Pentest Report - January 2025',
    lastUpdated: '2025-01-20',
    daysStale: 393,
    aiSuggestion: 'Commission an internal or external penetration test of the cardholder data environment. Ensure scope includes all in-scope network segments, applications, and APIs.',
    suggestedEvidence: ['Penetration test report (within last 12 months)', 'Remediation evidence for identified findings', 'Retest results for critical/high findings'],
    estimatedEffort: '40 hours',
    controlOwner: 'Security Team',
  },
  {
    id: 'EG-012',
    controlId: 'Art. 35',
    controlName: 'Data Protection Impact Assessment',
    framework: 'GDPR',
    gapType: 'missing',
    severity: 'high',
    description: '2 high-risk processing activities identified but no DPIA completed. GDPR Article 35 requires DPIAs for processing likely to result in high risk.',
    aiSuggestion: 'Conduct DPIAs for the identified high-risk processing activities. Include risk assessment, necessity/proportionality analysis, and mitigation measures.',
    suggestedEvidence: ['DPIA for AI-based customer profiling', 'DPIA for employee monitoring system', 'DPO consultation records', 'Supervisory authority consultation (if required)'],
    estimatedEffort: '16 hours',
    controlOwner: 'DPO Office',
  },
];

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'REC-001',
    title: 'Implement Automated Evidence Collection Pipeline',
    description: 'Set up automated evidence collection from identity providers, SIEM, cloud platforms, and development tools. This would address 60% of your stale and missing evidence gaps.',
    impact: 'high',
    effort: 'high',
    affectedControls: 38,
    scoreImprovement: 15,
    category: 'Automation',
    priority: 1,
    steps: [
      'Identify top 10 evidence types that can be automated',
      'Configure API integrations with source systems (IdP, SIEM, AWS/Azure, GitHub)',
      'Set up scheduled evidence collection jobs',
      'Configure evidence freshness alerts',
      'Test and validate automated evidence against control requirements',
    ],
  },
  {
    id: 'REC-002',
    title: 'Schedule Immediate Penetration Test',
    description: 'Your PCI DSS penetration test evidence is 13 months old. Schedule an immediate pen test to avoid non-compliance and potential audit findings.',
    impact: 'high',
    effort: 'medium',
    affectedControls: 5,
    scoreImprovement: 8,
    category: 'Critical Gap',
    priority: 2,
    steps: [
      'Engage approved penetration testing vendor',
      'Define scope covering all CDE segments',
      'Execute penetration test within next 30 days',
      'Document remediation for all critical/high findings',
      'Conduct retest to verify remediation effectiveness',
    ],
  },
  {
    id: 'REC-003',
    title: 'Complete HIPAA ePHI System Access Reviews',
    description: 'Multiple HIPAA controls lack evidence of user access management for ePHI systems. Completing access reviews would address 3 critical gaps.',
    impact: 'high',
    effort: 'medium',
    affectedControls: 8,
    scoreImprovement: 12,
    category: 'Critical Gap',
    priority: 3,
    steps: [
      'Inventory all systems containing ePHI',
      'Export current user access lists from each system',
      'Conduct access review with system owners',
      'Remove excessive/unauthorized access',
      'Document review results and retain evidence',
    ],
  },
  {
    id: 'REC-004',
    title: 'Run BCP Tabletop Exercise',
    description: 'Business continuity plan testing evidence is 8 months old. Schedule a tabletop exercise to demonstrate ongoing BCP effectiveness.',
    impact: 'medium',
    effort: 'medium',
    affectedControls: 4,
    scoreImprovement: 6,
    category: 'Refresh Required',
    priority: 4,
    steps: [
      'Select 2-3 relevant disaster scenarios',
      'Identify key participants from each business unit',
      'Schedule 2-hour tabletop exercise',
      'Document scenario walkthroughs, decisions, and gaps identified',
      'Create improvement action plan with deadlines',
    ],
  },
  {
    id: 'REC-005',
    title: 'Complete GDPR Data Protection Impact Assessments',
    description: '2 high-risk processing activities require DPIAs under GDPR Article 35. Complete these to maintain GDPR compliance.',
    impact: 'high',
    effort: 'medium',
    affectedControls: 3,
    scoreImprovement: 5,
    category: 'Regulatory Requirement',
    priority: 5,
    steps: [
      'Review processing activities identified as high-risk',
      'Conduct DPIA using organization template',
      'Document necessity and proportionality analysis',
      'Identify and implement risk mitigation measures',
      'Consult DPO and document recommendations',
    ],
  },
  {
    id: 'REC-006',
    title: 'Update SDLC Evidence for PCI DSS',
    description: 'Software development lifecycle evidence does not match current practices. Update to reflect the Agile/DevOps methodology currently in use.',
    impact: 'medium',
    effort: 'low',
    affectedControls: 6,
    scoreImprovement: 4,
    category: 'Evidence Mismatch',
    priority: 6,
    steps: [
      'Document current SDLC process (branching strategy, code review, testing)',
      'Export branch protection rules from GitHub/GitLab',
      'Capture SAST/DAST scan configurations and recent results',
      'Update SDLC policy to reflect current practices',
      'Obtain management approval for updated policy',
    ],
  },
  {
    id: 'REC-007',
    title: 'Implement Evidence Freshness Monitoring',
    description: 'Set up automated alerts when evidence items approach their expiration or recommended refresh dates. Prevents evidence from becoming stale.',
    impact: 'medium',
    effort: 'low',
    affectedControls: 24,
    scoreImprovement: 7,
    category: 'Process Improvement',
    priority: 7,
    steps: [
      'Define evidence freshness thresholds by evidence type',
      'Configure automated expiration alerts (30, 14, 7 days before)',
      'Set up weekly evidence freshness digest for control owners',
      'Create evidence renewal workflow with approval tracking',
    ],
  },
];

// ─── Helper Components ──────────────────────────────────────────────────────────

const ReadinessGauge: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'sm' }) => {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const ringColor = score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
  const dim = size === 'lg' ? 96 : 56;
  const r = size === 'lg' ? 40 : 22;
  const sw = size === 'lg' ? 8 : 5;
  const vb = size === 'lg' ? 96 : 56;
  const cx = vb / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: dim, height: dim }}>
      <svg className="-rotate-90" width={dim} height={dim} viewBox={`0 0 ${vb} ${vb}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
        <circle cx={cx} cy={cx} r={r} fill="none" className={ringColor} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${color} ${size === 'lg' ? 'text-xl' : 'text-xs'}`}>{score}%</span>
      </div>
    </div>
  );
};

const GapTypeBadge: React.FC<{ type: EvidenceGap['gapType'] }> = ({ type }) => {
  const configs: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
    missing: { bg: 'bg-red-100 text-red-700', icon: <FileX size={10} />, label: 'Missing' },
    stale: { bg: 'bg-orange-100 text-orange-700', icon: <FileClock size={10} />, label: 'Stale' },
    unverified: { bg: 'bg-yellow-100 text-yellow-700', icon: <FileQuestion size={10} />, label: 'Unverified' },
    mismatched: { bg: 'bg-purple-100 text-purple-700', icon: <AlertCircle size={10} />, label: 'Mismatched' },
    incomplete: { bg: 'bg-blue-100 text-blue-700', icon: <FileCheck size={10} />, label: 'Incomplete' },
  };
  const config = configs[type] || configs.missing;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${config.bg}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const SeverityBadge: React.FC<{ severity: 'critical' | 'high' | 'medium' | 'low' }> = ({ severity }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[severity]}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const ImpactEffortBadge: React.FC<{ label: string; level: 'high' | 'medium' | 'low' }> = ({ label, level }) => {
  const styles: Record<string, string> = {
    high: 'bg-red-50 text-red-700',
    medium: 'bg-yellow-50 text-yellow-700',
    low: 'bg-green-50 text-green-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles[level]}`}>
      {label}: {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

const EvidenceBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 text-right">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-14">{value}/{total}</span>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export const EvidenceCompletenessChecker: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'frameworks' | 'gaps' | 'recommendations'>('overview');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [gapTypeFilter, setGapTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');
  const [expandedGap, setExpandedGap] = useState<string | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

  // Calculated stats
  const totalControls = FRAMEWORK_READINESS.reduce((sum, fw) => sum + fw.totalControls, 0);
  const totalMissing = FRAMEWORK_READINESS.reduce((sum, fw) => sum + fw.evidenceMissing, 0);
  const totalStale = FRAMEWORK_READINESS.reduce((sum, fw) => sum + fw.evidenceStale, 0);
  const totalUnverified = FRAMEWORK_READINESS.reduce((sum, fw) => sum + fw.evidenceUnverified, 0);
  const overallScore = Math.round(FRAMEWORK_READINESS.reduce((sum, fw) => sum + fw.overallScore, 0) / FRAMEWORK_READINESS.length);
  const totalGaps = EVIDENCE_GAPS.length;
  const criticalGaps = EVIDENCE_GAPS.filter(g => g.severity === 'critical').length;

  const filteredGaps = EVIDENCE_GAPS.filter(gap => {
    if (searchQuery && !gap.controlName.toLowerCase().includes(searchQuery.toLowerCase()) && !gap.controlId.toLowerCase().includes(searchQuery.toLowerCase()) && !gap.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (gapTypeFilter !== 'all' && gap.gapType !== gapTypeFilter) return false;
    if (severityFilter !== 'all' && gap.severity !== severityFilter) return false;
    if (frameworkFilter !== 'all' && gap.framework !== frameworkFilter) return false;
    return true;
  });

  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setScanComplete(false);
    setAiError(null);

    try {
      // Build controls array from framework readiness data for AI analysis
      const controls = FRAMEWORK_READINESS.flatMap(fw =>
        EVIDENCE_GAPS
          .filter(g => g.framework === fw.name)
          .map(g => ({
            controlId: g.controlId,
            title: g.controlName,
            requirement: `${fw.name} control requirement for ${g.controlName}`,
            currentEvidence: g.currentEvidence ? [g.currentEvidence] : [],
          }))
      );

      if (controls.length > 0) {
        const result = await api.ai.evidenceCompleteness(
          'Multi-Framework',
          controls.slice(0, 20) // Limit to 20 controls per request
        );

        setAiSummary(result.summary || null);
      }

      setScanComplete(true);
    } catch (error: any) {
      console.error('Evidence scan error:', error);
      setAiError(error?.message || 'Failed to run AI evidence scan. Showing cached results.');
      setScanComplete(true); // Still show cached data
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    const exportData = {
      overallScore,
      frameworkReadiness: FRAMEWORK_READINESS,
      evidenceGaps: EVIDENCE_GAPS,
      recommendations: RECOMMENDATIONS,
      exportedAt: new Date().toISOString(),
      totalControls,
      totalGaps,
      criticalGaps,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-readiness-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [overallScore, totalControls, totalGaps, criticalGaps]);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <PieChart size={16} /> },
    { key: 'frameworks', label: 'Framework Readiness', icon: <Shield size={16} />, count: FRAMEWORK_READINESS.length },
    { key: 'gaps', label: 'Evidence Gaps', icon: <AlertCircle size={16} />, count: totalGaps },
    { key: 'recommendations', label: 'Recommendations', icon: <Lightbulb size={16} />, count: RECOMMENDATIONS.length },
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
            <h2 className="text-2xl font-bold text-gray-900">AI Evidence Completeness Checker</h2>
            <p className="text-sm text-gray-500 mt-0.5">Scan controls across all frameworks for evidence completeness and quality</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Scanning {totalControls} Controls...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Run Full Scan
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <ReadinessGauge score={overallScore} size="sm" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Overall Readiness</p>
            <p className="text-lg font-bold text-gray-900">{overallScore}%</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Total Controls</span>
            <ListChecks size={16} className="text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalControls}</p>
          <p className="text-xs text-gray-400">across {FRAMEWORK_READINESS.length} frameworks</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Missing Evidence</span>
            <FileX size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{totalMissing}</p>
          <p className="text-xs text-gray-400">controls without evidence</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Stale Evidence</span>
            <FileClock size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{totalStale}</p>
          <p className="text-xs text-gray-400">evidence past refresh date</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Critical Gaps</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalGaps}</p>
          <p className="text-xs text-gray-400">requiring immediate action</p>
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
              {'count' in tab && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Overview Tab ─────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Overall Readiness */}
            <div className="bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-xl p-6">
              <div className="flex items-center gap-6">
                <ReadinessGauge score={overallScore} size="lg" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Overall Audit Readiness Score</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {overallScore >= 80
                      ? 'Your organization is generally well-prepared for audits. Focus on the remaining gaps to achieve full readiness.'
                      : overallScore >= 60
                      ? 'Several areas need attention before your upcoming audits. Prioritize critical gaps first.'
                      : 'Significant evidence gaps exist. Immediate action is required to prepare for audit readiness.'}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" />{totalControls - totalMissing} controls with evidence</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><XCircle size={12} className="text-red-500" />{totalMissing} missing evidence</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} className="text-orange-500" />{totalStale} stale evidence</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><AlertCircle size={12} className="text-yellow-500" />{totalUnverified} unverified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Framework Summary Grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Framework Readiness Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FRAMEWORK_READINESS.map(fw => (
                  <button
                    key={fw.id}
                    onClick={() => { setActiveTab('frameworks'); setSelectedFramework(fw.id); }}
                    className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-brand-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">{fw.name}</h4>
                      <ReadinessGauge score={fw.overallScore} size="sm" />
                    </div>
                    <div className="space-y-1.5">
                      <EvidenceBar label="Complete" value={fw.evidenceComplete} total={fw.totalControls} color="bg-green-500" />
                      <EvidenceBar label="Current" value={fw.evidenceCurrent} total={fw.totalControls} color="bg-blue-500" />
                      <EvidenceBar label="Verified" value={fw.evidenceVerified} total={fw.totalControls} color="bg-purple-500" />
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100">
                      <span className="text-xs text-red-600 font-medium">{fw.evidenceMissing} missing</span>
                      <span className="text-xs text-orange-600 font-medium">{fw.evidenceStale} stale</span>
                      <span className="text-xs text-yellow-600 font-medium">{fw.evidenceUnverified} unverified</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Quality Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-brand-600" />
                Evidence Quality Scoring
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <FileCheck size={24} className="text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">{FRAMEWORK_READINESS.reduce((s, f) => s + f.evidenceComplete, 0)}</p>
                  <p className="text-xs text-green-600 font-medium">Complete</p>
                  <p className="text-xs text-gray-500 mt-0.5">Evidence exists for the control</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Clock size={24} className="text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{FRAMEWORK_READINESS.reduce((s, f) => s + f.evidenceCurrent, 0)}</p>
                  <p className="text-xs text-blue-600 font-medium">Current</p>
                  <p className="text-xs text-gray-500 mt-0.5">Evidence is within freshness window</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <CheckSquare size={24} className="text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">{FRAMEWORK_READINESS.reduce((s, f) => s + f.evidenceVerified, 0)}</p>
                  <p className="text-xs text-purple-600 font-medium">Verified</p>
                  <p className="text-xs text-gray-500 mt-0.5">Evidence reviewed and approved</p>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <Target size={24} className="text-teal-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-teal-700">{FRAMEWORK_READINESS.reduce((s, f) => s + f.evidenceMatched, 0)}</p>
                  <p className="text-xs text-teal-600 font-medium">Matched</p>
                  <p className="text-xs text-gray-500 mt-0.5">Evidence matches control requirements</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-900">AI-Recommended Priority Actions</h4>
                  <ul className="mt-2 space-y-1.5">
                    <li className="text-sm text-yellow-800 flex items-start gap-2">
                      <span className="text-red-600 font-bold">1.</span>
                      Schedule PCI DSS penetration test immediately (13 months overdue)
                    </li>
                    <li className="text-sm text-yellow-800 flex items-start gap-2">
                      <span className="text-red-600 font-bold">2.</span>
                      Collect MFA evidence for SOC 2 CC6.1 (critical path for upcoming audit)
                    </li>
                    <li className="text-sm text-yellow-800 flex items-start gap-2">
                      <span className="text-orange-600 font-bold">3.</span>
                      Complete HIPAA ePHI access reviews (3 critical controls affected)
                    </li>
                  </ul>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="mt-3 text-xs font-medium text-yellow-800 hover:text-yellow-900 flex items-center gap-1"
                  >
                    View All Recommendations <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Framework Readiness Tab ──────────────────────────── */}
        {activeTab === 'frameworks' && (
          <div className="p-4 space-y-4">
            {FRAMEWORK_READINESS.map(fw => (
              <div
                key={fw.id}
                className={`bg-white border rounded-xl overflow-hidden transition-all ${
                  selectedFramework === fw.id ? 'border-brand-300 shadow-md' : 'border-gray-200'
                }`}
              >
                <button
                  onClick={() => setSelectedFramework(selectedFramework === fw.id ? null : fw.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <ReadinessGauge score={fw.overallScore} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">{fw.name}</h4>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            fw.status === 'ready' ? 'bg-green-100 text-green-700' :
                            fw.status === 'at-risk' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {fw.status === 'ready' ? 'Audit Ready' : fw.status === 'at-risk' ? 'At Risk' : 'Not Ready'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{fw.totalControls} controls | Last scanned: {new Date(fw.lastScanned).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-red-600 font-medium">{fw.evidenceMissing} missing</span>
                          <span className="text-orange-600 font-medium">{fw.evidenceStale} stale</span>
                          <span className="text-yellow-600 font-medium">{fw.evidenceUnverified} unverified</span>
                        </div>
                      </div>
                      {selectedFramework === fw.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>
                </button>

                {selectedFramework === fw.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-green-700">{fw.evidenceComplete}</p>
                        <p className="text-xs text-green-600">Evidence Complete</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-blue-700">{fw.evidenceCurrent}</p>
                        <p className="text-xs text-blue-600">Current (Fresh)</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-purple-700">{fw.evidenceVerified}</p>
                        <p className="text-xs text-purple-600">Verified</p>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-teal-700">{fw.evidenceMatched}</p>
                        <p className="text-xs text-teal-600">Requirements Matched</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase">Evidence Quality Breakdown</h5>
                      <EvidenceBar label="Complete" value={fw.evidenceComplete} total={fw.totalControls} color="bg-green-500" />
                      <EvidenceBar label="Current" value={fw.evidenceCurrent} total={fw.totalControls} color="bg-blue-500" />
                      <EvidenceBar label="Verified" value={fw.evidenceVerified} total={fw.totalControls} color="bg-purple-500" />
                      <EvidenceBar label="Matched" value={fw.evidenceMatched} total={fw.totalControls} color="bg-teal-500" />
                    </div>

                    {/* Framework-specific gaps */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Evidence Gaps for {fw.name}</h5>
                      <div className="space-y-2">
                        {EVIDENCE_GAPS.filter(g => g.framework === fw.name).map(gap => (
                          <div key={gap.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                              <SeverityBadge severity={gap.severity} />
                              <GapTypeBadge type={gap.gapType} />
                              <span className="text-sm text-gray-700">{gap.controlId}: {gap.controlName}</span>
                            </div>
                            <button
                              onClick={() => { setActiveTab('gaps'); setExpandedGap(gap.id); }}
                              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        ))}
                        {EVIDENCE_GAPS.filter(g => g.framework === fw.name).length === 0 && (
                          <p className="text-xs text-gray-500 italic">No specific gaps identified for this framework.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Evidence Gaps Tab ─────────────────────────────────── */}
        {activeTab === 'gaps' && (
          <div>
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search evidence gaps..."
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
                  <select value={gapTypeFilter} onChange={e => setGapTypeFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="all">All Gap Types</option>
                    <option value="missing">Missing</option>
                    <option value="stale">Stale</option>
                    <option value="unverified">Unverified</option>
                    <option value="mismatched">Mismatched</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                  <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select value={frameworkFilter} onChange={e => setFrameworkFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="all">All Frameworks</option>
                    {FRAMEWORK_READINESS.map(fw => (
                      <option key={fw.id} value={fw.name}>{fw.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              {filteredGaps.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">No matching evidence gaps</p>
                </div>
              )}

              {filteredGaps.map(gap => (
                <div
                  key={gap.id}
                  className={`border rounded-xl overflow-hidden ${
                    gap.severity === 'critical' ? 'border-red-200 bg-red-50/20' :
                    gap.severity === 'high' ? 'border-orange-200 bg-orange-50/10' :
                    'border-gray-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => setExpandedGap(expandedGap === gap.id ? null : gap.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{gap.controlId}</span>
                          <SeverityBadge severity={gap.severity} />
                          <GapTypeBadge type={gap.gapType} />
                          <span className="text-xs text-gray-400">{gap.framework}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">{gap.controlName}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{gap.description}</p>
                      </div>
                      <div className="ml-2">
                        {expandedGap === gap.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>
                  </button>

                  {expandedGap === gap.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 space-y-3">
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed">{gap.description}</p>

                      {gap.currentEvidence && (
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs font-medium text-gray-500">Current Evidence:</p>
                          <p className="text-sm text-gray-700 mt-0.5">{gap.currentEvidence}</p>
                          {gap.lastUpdated && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Last updated: {new Date(gap.lastUpdated).toLocaleDateString()}
                              {gap.daysStale && <span className="text-red-600 font-medium ml-1">({gap.daysStale} days ago)</span>}
                            </p>
                          )}
                        </div>
                      )}

                      {/* AI Suggestion */}
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs font-semibold text-purple-700 flex items-center gap-1 mb-1">
                          <Sparkles size={12} />
                          AI Remediation Suggestion
                        </p>
                        <p className="text-sm text-purple-800">{gap.aiSuggestion}</p>
                      </div>

                      {/* Suggested Evidence */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">Suggested Evidence to Collect:</p>
                        <div className="space-y-1">
                          {gap.suggestedEvidence.map((ev, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                              <FolderOpen size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{ev}</span>
                              <button className="ml-auto text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                                <Upload size={10} />
                                Upload
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={10} />Est. {gap.estimatedEffort}</span>
                          <span className="flex items-center gap-1"><Target size={10} />Owner: {gap.controlOwner}</span>
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
                          <Zap size={12} />
                          Create Task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Recommendations Tab ──────────────────────────────── */}
        {activeTab === 'recommendations' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-500">
                AI-Generated Recommendations (Prioritized by Impact)
              </h4>
            </div>

            {RECOMMENDATIONS.sort((a, b) => a.priority - b.priority).map(rec => (
              <div key={rec.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-brand-200 transition-colors">
                <button
                  onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                          {rec.priority}
                        </span>
                        <ImpactEffortBadge label="Impact" level={rec.impact} />
                        <ImpactEffortBadge label="Effort" level={rec.effort} />
                        <span className="text-xs text-gray-400 font-medium">{rec.category}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">{rec.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.description}</p>
                    </div>
                    <div className="ml-3 flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp size={14} />
                        <span className="text-sm font-bold">+{rec.scoreImprovement}%</span>
                      </div>
                      <p className="text-xs text-gray-400">{rec.affectedControls} controls</p>
                      {expandedRec === rec.id ? <ChevronUp size={14} className="text-gray-400 ml-auto mt-1" /> : <ChevronDown size={14} className="text-gray-400 ml-auto mt-1" />}
                    </div>
                  </div>
                </button>

                {expandedRec === rec.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{rec.description}</p>
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Implementation Steps:</p>
                      <ol className="space-y-1.5">
                        {rec.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
                        <Zap size={12} />
                        Create Remediation Tasks
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        <Calendar size={12} />
                        Schedule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Scan Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Info size={14} />
          <span>Last full scan: {new Date().toLocaleString()} | {totalControls} controls across {FRAMEWORK_READINESS.length} frameworks analyzed</span>
        </div>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};
