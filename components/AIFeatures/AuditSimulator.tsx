import React, { useState, useCallback, useEffect } from 'react';
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
  Play,
  Pause,
  CheckSquare,
  X,
  Sparkles,
  Star,
  Users,
  MessageSquare,
  BookOpen,
  Award,
  Hash,
  ArrowRight,
  ClipboardList,
  Lightbulb,
  Send,
  StopCircle,
  RotateCcw,
  FileCheck,
  CircleDot,
  Minus,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface AuditType {
  id: string;
  name: string;
  description: string;
  controlCount: number;
  estimatedDuration: string;
  icon: string;
}

interface SimulationRun {
  id: string;
  auditType: string;
  status: 'configuring' | 'running' | 'completed' | 'paused';
  progress: number;
  startedAt: string;
  completedAt?: string;
  readinessScore: number;
  findingsCount: { critical: number; major: number; minor: number; observation: number };
  controlsTested: number;
  totalControls: number;
  questionsAsked: number;
  questionsAnswered: number;
}

interface AuditFinding {
  id: string;
  simulationId: string;
  controlId: string;
  controlName: string;
  severity: 'critical' | 'major' | 'minor' | 'observation';
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  estimatedEffort: string;
  category: string;
  status: 'open' | 'remediation-planned' | 'remediated';
}

interface AuditQuestion {
  id: string;
  category: string;
  controlRef: string;
  question: string;
  context: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  expectedEvidence: string[];
  auditType: string;
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  role: string;
  followUps: string[];
}

// ─── Demo Data ──────────────────────────────────────────────────────────────────

const AUDIT_TYPES: AuditType[] = [
  { id: 'soc2', name: 'SOC 2 Type II', description: 'Service Organization Control 2 - Trust Services Criteria audit simulation covering security, availability, processing integrity, confidentiality, and privacy.', controlCount: 64, estimatedDuration: '45-60 min', icon: 'shield' },
  { id: 'iso27001', name: 'ISO 27001:2022', description: 'Information Security Management System audit simulation covering all Annex A controls and ISMS requirements.', controlCount: 93, estimatedDuration: '60-90 min', icon: 'globe' },
  { id: 'gdpr', name: 'GDPR', description: 'General Data Protection Regulation compliance audit focusing on data processing, rights, transfers, and organizational measures.', controlCount: 48, estimatedDuration: '30-45 min', icon: 'lock' },
  { id: 'hipaa', name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act audit covering administrative, physical, and technical safeguards.', controlCount: 54, estimatedDuration: '45-60 min', icon: 'heart' },
  { id: 'pci-dss', name: 'PCI DSS v4.0', description: 'Payment Card Industry Data Security Standard audit simulation for cardholder data environment security.', controlCount: 78, estimatedDuration: '60-75 min', icon: 'credit-card' },
  { id: 'nist-csf', name: 'NIST CSF 2.0', description: 'National Institute of Standards and Technology Cybersecurity Framework assessment across Govern, Identify, Protect, Detect, Respond, and Recover functions.', controlCount: 106, estimatedDuration: '60-90 min', icon: 'cpu' },
];

const SIMULATION_RUNS: SimulationRun[] = [
  {
    id: 'SIM-001',
    auditType: 'SOC 2 Type II',
    status: 'completed',
    progress: 100,
    startedAt: '2026-02-15T10:00:00Z',
    completedAt: '2026-02-15T11:15:00Z',
    readinessScore: 71,
    findingsCount: { critical: 2, major: 5, minor: 8, observation: 3 },
    controlsTested: 64,
    totalControls: 64,
    questionsAsked: 42,
    questionsAnswered: 38,
  },
  {
    id: 'SIM-002',
    auditType: 'ISO 27001:2022',
    status: 'running',
    progress: 58,
    startedAt: '2026-02-17T09:00:00Z',
    readinessScore: 78,
    findingsCount: { critical: 1, major: 3, minor: 4, observation: 2 },
    controlsTested: 54,
    totalControls: 93,
    questionsAsked: 28,
    questionsAnswered: 25,
  },
  {
    id: 'SIM-003',
    auditType: 'GDPR',
    status: 'completed',
    progress: 100,
    startedAt: '2026-02-10T14:00:00Z',
    completedAt: '2026-02-10T15:00:00Z',
    readinessScore: 85,
    findingsCount: { critical: 0, major: 2, minor: 3, observation: 4 },
    controlsTested: 48,
    totalControls: 48,
    questionsAsked: 30,
    questionsAnswered: 29,
  },
  {
    id: 'SIM-004',
    auditType: 'HIPAA',
    status: 'completed',
    progress: 100,
    startedAt: '2026-02-08T11:00:00Z',
    completedAt: '2026-02-08T12:10:00Z',
    readinessScore: 64,
    findingsCount: { critical: 3, major: 6, minor: 5, observation: 2 },
    controlsTested: 54,
    totalControls: 54,
    questionsAsked: 38,
    questionsAnswered: 32,
  },
];

const AUDIT_FINDINGS: AuditFinding[] = [
  {
    id: 'AF-001', simulationId: 'SIM-001', controlId: 'CC6.1', controlName: 'Logical Access Security',
    severity: 'critical', title: 'Multi-factor authentication not enforced for all production access',
    description: 'During the simulated audit, the AI auditor identified that MFA is not consistently enforced across all production system access points. Two production systems allow single-factor authentication for administrative access.',
    evidence: 'Expected: MFA enrollment reports showing 100% coverage. Found: 87% MFA enrollment with 2 systems excluded from MFA policy.',
    recommendation: 'Immediately extend MFA policy to cover all production systems. Deploy hardware security keys for administrative access. Implement conditional access policies requiring MFA for all elevated privilege sessions.',
    estimatedEffort: '8 hours', category: 'Access Control', status: 'open',
  },
  {
    id: 'AF-002', simulationId: 'SIM-001', controlId: 'CC7.2', controlName: 'Security Monitoring',
    severity: 'critical', title: 'SIEM alert coverage gaps for critical infrastructure',
    description: 'The AI auditor found that SIEM monitoring does not cover 3 critical infrastructure components including the database replication service, API gateway failover system, and backup encryption service.',
    evidence: 'Expected: Comprehensive SIEM coverage for all critical infrastructure. Found: 85% coverage with 3 critical gaps.',
    recommendation: 'Extend SIEM agent deployment to uncovered infrastructure components. Create specific alert rules for database replication anomalies, API gateway failover events, and backup encryption status changes.',
    estimatedEffort: '12 hours', category: 'Monitoring', status: 'remediation-planned',
  },
  {
    id: 'AF-003', simulationId: 'SIM-001', controlId: 'A1.2', controlName: 'Business Continuity Testing',
    severity: 'major', title: 'BCP tabletop exercise has not been conducted in over 8 months',
    description: 'Business continuity plan testing evidence is from June 2025. SOC 2 requires regular testing to demonstrate the effectiveness of business continuity procedures.',
    evidence: 'Expected: BCP test within the audit period (last 12 months, recommended semi-annual). Found: Last test June 2025 (8 months ago).',
    recommendation: 'Schedule a tabletop exercise within the next 30 days. Include all critical business functions. Document test scenarios, participant actions, lessons learned, and improvement items.',
    estimatedEffort: '16 hours', category: 'Business Continuity', status: 'open',
  },
  {
    id: 'AF-004', simulationId: 'SIM-001', controlId: 'CC6.3', controlName: 'Access Reviews',
    severity: 'major', title: 'User access reviews are 45 days past due',
    description: 'Quarterly user access reviews for production systems were last completed 135 days ago, exceeding the quarterly review requirement by 45 days.',
    evidence: 'Expected: Quarterly access review completed within 90 days. Found: Last review 135 days ago.',
    recommendation: 'Initiate immediate access review for all production systems. Implement automated access review scheduling with escalation alerts. Consider deploying identity governance tools for continuous certification.',
    estimatedEffort: '6 hours', category: 'Access Control', status: 'open',
  },
  {
    id: 'AF-005', simulationId: 'SIM-001', controlId: 'C1.1', controlName: 'Data Classification',
    severity: 'major', title: 'Data classification incomplete for 4 repositories',
    description: 'The data classification inventory does not cover all data repositories. 4 repositories including staging database, analytics data lake, log archive, and development sandbox lack classification labels.',
    evidence: 'Expected: 100% data repository classification. Found: 28 of 32 repositories classified (87.5%).',
    recommendation: 'Classify the remaining 4 repositories according to organizational data classification policy. Update the data classification inventory and apply appropriate handling controls based on classification levels.',
    estimatedEffort: '4 hours', category: 'Data Protection', status: 'open',
  },
  {
    id: 'AF-006', simulationId: 'SIM-001', controlId: 'CC6.6', controlName: 'Encryption Management',
    severity: 'major', title: 'Encryption key rotation not documented',
    description: 'While encryption is implemented for data at rest and in transit, there is no documented evidence of encryption key rotation schedule adherence.',
    evidence: 'Expected: Documented key rotation schedule and evidence of adherence. Found: Key rotation policy exists but no rotation evidence for last 6 months.',
    recommendation: 'Document all key rotation events. Implement automated key rotation where possible. Create a key management dashboard showing rotation status for all encryption keys.',
    estimatedEffort: '8 hours', category: 'Cryptography', status: 'open',
  },
  {
    id: 'AF-007', simulationId: 'SIM-001', controlId: 'P6.1', controlName: 'Data Retention',
    severity: 'major', title: 'Data retention schedules not enforced for 3 systems',
    description: 'Data retention policies are defined but automated enforcement is not configured for 3 systems: customer analytics database, email archive, and application logs.',
    evidence: 'Expected: Automated data retention enforcement. Found: Manual processes for 3 systems with no verification of adherence.',
    recommendation: 'Implement automated data lifecycle management for the 3 identified systems. Configure automated deletion/archival workflows. Set up monitoring alerts for retention policy violations.',
    estimatedEffort: '12 hours', category: 'Privacy', status: 'open',
  },
  {
    id: 'AF-008', simulationId: 'SIM-004', controlId: '164.312(a)', controlName: 'Access Control',
    severity: 'critical', title: 'No unique user identification for 2 ePHI systems',
    description: 'Two systems containing electronic Protected Health Information allow shared account access, violating the HIPAA unique user identification requirement.',
    evidence: 'Expected: Unique user accounts for all ePHI system access. Found: Shared service accounts used for routine access in 2 systems.',
    recommendation: 'Immediately provision unique user accounts for all ePHI system access. Disable shared accounts. Implement audit logging for all individual user access. Deploy privileged access management for administrative accounts.',
    estimatedEffort: '16 hours', category: 'Access Control', status: 'open',
  },
];

const QUESTION_BANK: AuditQuestion[] = [
  { id: 'Q-001', category: 'Access Control', controlRef: 'CC6.1', question: 'Can you demonstrate that multi-factor authentication is enforced for all users accessing the production environment?', context: 'The auditor wants to verify the scope and enforcement of MFA controls.', difficulty: 'basic', expectedEvidence: ['MFA policy document', 'MFA enrollment report', 'Conditional access policy configuration'], auditType: 'SOC 2 Type II' },
  { id: 'Q-002', category: 'Access Control', controlRef: 'CC6.3', question: 'How often are user access reviews conducted, and can you provide evidence of the most recent review for production systems?', context: 'Verifying the frequency and completeness of periodic access reviews.', difficulty: 'basic', expectedEvidence: ['Access review schedule', 'Most recent access review report', 'Remediation actions from review'], auditType: 'SOC 2 Type II' },
  { id: 'Q-003', category: 'Monitoring', controlRef: 'CC7.2', question: 'Describe your security monitoring and incident detection capabilities. What percentage of your infrastructure is covered by SIEM monitoring?', context: 'Assessing the maturity and coverage of security monitoring controls.', difficulty: 'intermediate', expectedEvidence: ['SIEM architecture diagram', 'Alert rule inventory', 'Coverage report', 'Sample alert investigation report'], auditType: 'SOC 2 Type II' },
  { id: 'Q-004', category: 'Business Continuity', controlRef: 'A1.2', question: 'When was the last business continuity test conducted? Walk me through the test scenario and results.', context: 'Evaluating the effectiveness of BCP testing program.', difficulty: 'intermediate', expectedEvidence: ['BCP test plan', 'Test execution results', 'Lessons learned document', 'Improvement action tracking'], auditType: 'SOC 2 Type II' },
  { id: 'Q-005', category: 'Cryptography', controlRef: 'A.8.24', question: 'Describe your encryption strategy for data at rest and in transit. How are encryption keys managed, rotated, and protected?', context: 'Deep dive into cryptographic controls and key management practices.', difficulty: 'advanced', expectedEvidence: ['Encryption policy', 'Key management procedures', 'Key rotation evidence', 'HSM configuration documentation'], auditType: 'ISO 27001:2022' },
  { id: 'Q-006', category: 'Data Protection', controlRef: 'Art. 30', question: 'Can you provide your Record of Processing Activities? Does it cover all current data processing operations?', context: 'Verifying GDPR Article 30 compliance for data processing documentation.', difficulty: 'basic', expectedEvidence: ['ROPA document', 'Data flow diagrams', 'Legal basis documentation for each activity'], auditType: 'GDPR' },
  { id: 'Q-007', category: 'Data Protection', controlRef: 'Art. 35', question: 'How do you determine when a Data Protection Impact Assessment is required? Can you show DPIAs for your high-risk processing activities?', context: 'Assessing DPIA process maturity and completeness.', difficulty: 'intermediate', expectedEvidence: ['DPIA threshold criteria', 'Completed DPIAs', 'DPO consultation records', 'Mitigation measures documentation'], auditType: 'GDPR' },
  { id: 'Q-008', category: 'Administrative Safeguards', controlRef: '164.308(a)(1)', question: 'Describe your HIPAA risk analysis process. When was the last risk assessment conducted and what were the key findings?', context: 'Evaluating the maturity of the HIPAA risk management program.', difficulty: 'intermediate', expectedEvidence: ['Risk analysis methodology', 'Most recent risk assessment report', 'Risk treatment plan', 'Residual risk acceptance documentation'], auditType: 'HIPAA' },
  { id: 'Q-009', category: 'Network Security', controlRef: 'Req 1.3', question: 'How is network segmentation implemented to protect the cardholder data environment from other network segments?', context: 'Verifying PCI DSS network segmentation controls.', difficulty: 'advanced', expectedEvidence: ['Network diagram showing CDE boundaries', 'Firewall rule documentation', 'Segmentation test results', 'Penetration test scoping document'], auditType: 'PCI DSS v4.0' },
  { id: 'Q-010', category: 'Governance', controlRef: 'GV.OC-01', question: 'How does your organization integrate cybersecurity risk management into overall enterprise risk management? Who has ultimate accountability?', context: 'Assessing the governance maturity of the cybersecurity program.', difficulty: 'advanced', expectedEvidence: ['Cybersecurity risk management policy', 'Board/executive risk committee charter', 'Risk appetite statement', 'Cybersecurity budget allocation evidence'], auditType: 'NIST CSF 2.0' },
  { id: 'Q-011', category: 'Incident Response', controlRef: 'CC7.4', question: 'Walk me through your last security incident. How was it detected, contained, eradicated, and what lessons were learned?', context: 'Testing incident response capabilities through real-world scenario review.', difficulty: 'advanced', expectedEvidence: ['Incident response plan', 'Specific incident report', 'Post-incident review', 'Improvement actions with tracking'], auditType: 'SOC 2 Type II' },
  { id: 'Q-012', category: 'Vendor Management', controlRef: 'CC9.2', question: 'How do you assess and monitor the security of your critical third-party service providers?', context: 'Evaluating vendor risk management program maturity.', difficulty: 'intermediate', expectedEvidence: ['Vendor risk management policy', 'Vendor risk assessment methodology', 'Critical vendor assessment reports', 'Continuous monitoring evidence'], auditType: 'SOC 2 Type II' },
];

const MOCK_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  { id: 'IQ-001', question: 'Can you describe your role and responsibilities related to information security within the organization?', category: 'General', role: 'CISO / Security Manager', followUps: ['How long have you been in this role?', 'Who do you report to?', 'What is the size of your security team?'] },
  { id: 'IQ-002', question: 'How are security policies communicated to employees and how do you verify they understand their responsibilities?', category: 'Governance', role: 'HR / Security Awareness Lead', followUps: ['What is the frequency of security training?', 'How do you measure training effectiveness?', 'What happens if someone fails the training?'] },
  { id: 'IQ-003', question: 'Walk me through the process when an employee leaves the organization. How is access revocation handled?', category: 'Access Control', role: 'IT / HR Manager', followUps: ['What is the SLA for access revocation?', 'How do you handle emergency terminations?', 'Do you have automated deprovisioning?'] },
  { id: 'IQ-004', question: 'Describe your change management process for production systems. How are changes tested and approved?', category: 'Change Management', role: 'DevOps / Engineering Lead', followUps: ['What tools do you use for change tracking?', 'Who approves production deployments?', 'How do you handle emergency changes?'] },
  { id: 'IQ-005', question: 'How do you ensure that personal data is only processed for the purposes for which it was collected?', category: 'Privacy', role: 'DPO / Privacy Officer', followUps: ['How do you handle data subject access requests?', 'What is your average DSAR response time?', 'How do you manage consent?'] },
  { id: 'IQ-006', question: 'Describe your backup strategy and how you verify backup integrity and recoverability.', category: 'Operations', role: 'IT Operations Manager', followUps: ['How often are restore tests performed?', 'What is your backup retention policy?', 'Do you use immutable backups?'] },
];

// ─── Helper Components ──────────────────────────────────────────────────────────

const SeverityBadge: React.FC<{ severity: AuditFinding['severity'] }> = ({ severity }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    major: 'bg-orange-100 text-orange-700 border-orange-200',
    minor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    observation: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[severity]}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const DifficultyBadge: React.FC<{ difficulty: AuditQuestion['difficulty'] }> = ({ difficulty }) => {
  const styles: Record<string, string> = {
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[difficulty]}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
};

const ReadinessGauge: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'sm' }) => {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const ringColor = score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
  const dim = size === 'lg' ? 96 : 56;
  const r = size === 'lg' ? 40 : 22;
  const sw = size === 'lg' ? 8 : 5;
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
        <span className={`font-bold ${color} ${size === 'lg' ? 'text-xl' : 'text-xs'}`}>{score}%</span>
      </div>
    </div>
  );
};

const FindingsChart: React.FC<{ findings: SimulationRun['findingsCount'] }> = ({ findings }) => {
  const total = findings.critical + findings.major + findings.minor + findings.observation;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-sm bg-red-500" />
        <span className="text-xs text-gray-600">{findings.critical} Critical</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-sm bg-orange-500" />
        <span className="text-xs text-gray-600">{findings.major} Major</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-sm bg-yellow-500" />
        <span className="text-xs text-gray-600">{findings.minor} Minor</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-sm bg-blue-500" />
        <span className="text-xs text-gray-600">{findings.observation} Obs</span>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export const AuditSimulator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'results' | 'questions'>('new');
  const [selectedAuditType, setSelectedAuditType] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [expandedSim, setExpandedSim] = useState<string | null>(null);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [selectedSimForResults, setSelectedSimForResults] = useState<string | null>(null);
  const [simulationAnswer, setSimulationAnswer] = useState('');

  // Stats
  const totalSimulations = SIMULATION_RUNS.length;
  const completedSims = SIMULATION_RUNS.filter(s => s.status === 'completed').length;
  const activeSims = SIMULATION_RUNS.filter(s => s.status === 'running').length;
  const totalFindings = AUDIT_FINDINGS.length;
  const avgReadiness = Math.round(SIMULATION_RUNS.filter(s => s.status === 'completed').reduce((s, r) => s + r.readinessScore, 0) / completedSims);

  const filteredFindings = AUDIT_FINDINGS.filter(f => {
    if (selectedSimForResults && f.simulationId !== selectedSimForResults) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (searchQuery && !f.title.toLowerCase().includes(searchQuery.toLowerCase()) && !f.controlName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredQuestions = QUESTION_BANK.filter(q => {
    if (auditTypeFilter !== 'all' && q.auditType !== auditTypeFilter) return false;
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
    if (searchQuery && !q.question.toLowerCase().includes(searchQuery.toLowerCase()) && !q.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const findingCategories = [...new Set(AUDIT_FINDINGS.map(f => f.category))];

  const [aiError, setAiError] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);

  const handleStartSimulation = useCallback(async () => {
    if (!selectedAuditType) return;
    setIsSimulating(true);
    setAiError(null);

    try {
      // Determine framework and controls based on audit type
      const auditTypeMap: Record<string, { framework: string; domain: string }> = {
        'soc2-type2': { framework: 'SOC 2 Type II', domain: 'Trust Services Criteria' },
        'iso27001': { framework: 'ISO/IEC 27001:2022', domain: 'Information Security Management' },
        'hipaa': { framework: 'HIPAA Security Rule', domain: 'Administrative Safeguards' },
        'gdpr': { framework: 'GDPR', domain: 'Data Protection' },
        'pci-dss': { framework: 'PCI DSS v4.0', domain: 'Network Security' },
        'nist-csf': { framework: 'NIST CSF 2.0', domain: 'Cybersecurity Framework' },
      };

      const auditConfig = auditTypeMap[selectedAuditType] || { framework: selectedAuditType, domain: 'General Compliance' };

      // Get relevant controls for the audit
      const controlsToAudit = MOCK_INTERVIEW_QUESTIONS.slice(0, 5).map(q => ({
        controlId: q.id || q.category,
        title: q.category,
        description: q.question,
      }));

      const result = await api.ai.auditSimulation(
        auditConfig.framework,
        auditConfig.domain,
        controlsToAudit
      );

      if (result.questions && result.questions.length > 0) {
        setAiQuestions(result.questions);
      }

      setActiveTab('active');
    } catch (error: any) {
      console.error('Audit simulation error:', error);
      setAiError(error?.message || 'Failed to start AI audit simulation. Using default questions.');
      setActiveTab('active'); // Still switch tab with default questions
    } finally {
      setIsSimulating(false);
    }
  }, [selectedAuditType]);

  const handleExportReport = useCallback((simId: string) => {
    const sim = SIMULATION_RUNS.find(s => s.id === simId);
    const findings = AUDIT_FINDINGS.filter(f => f.simulationId === simId);
    const exportData = {
      simulation: sim,
      findings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-simulation-${simId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const tabs = [
    { key: 'new', label: 'New Simulation', icon: <Play size={16} /> },
    { key: 'active', label: 'Active Simulations', icon: <Loader2 size={16} />, count: activeSims },
    { key: 'results', label: 'Results', icon: <ClipboardList size={16} />, count: totalFindings },
    { key: 'questions', label: 'Question Bank', icon: <BookOpen size={16} />, count: QUESTION_BANK.length },
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
            <h2 className="text-2xl font-bold text-gray-900">AI-Powered Audit Simulation</h2>
            <p className="text-sm text-gray-500 mt-0.5">Simulate real auditor examinations to identify gaps before your actual audit</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Total Simulations</span>
            <Shield size={16} className="text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSimulations}</p>
          <p className="text-xs text-gray-400">{completedSims} completed</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Active</span>
            <Loader2 size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{activeSims}</p>
          <p className="text-xs text-gray-400">simulations running</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Avg Readiness</span>
            <Target size={16} className="text-green-500" />
          </div>
          <p className={`text-2xl font-bold ${avgReadiness >= 80 ? 'text-green-600' : avgReadiness >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{avgReadiness}%</p>
          <p className="text-xs text-gray-400">across all audits</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Total Findings</span>
            <AlertCircle size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{totalFindings}</p>
          <p className="text-xs text-gray-400">{AUDIT_FINDINGS.filter(f => f.severity === 'critical').length} critical</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Question Bank</span>
            <BookOpen size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{QUESTION_BANK.length}</p>
          <p className="text-xs text-gray-400">audit questions</p>
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
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── New Simulation Tab ───────────────────────────────── */}
        {activeTab === 'new' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Select Audit Type</h3>
              <p className="text-sm text-gray-500">Choose the framework to simulate. The AI auditor will examine your controls, evidence, and procedures as a real auditor would.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AUDIT_TYPES.map(audit => (
                <button
                  key={audit.id}
                  onClick={() => setSelectedAuditType(selectedAuditType === audit.id ? null : audit.id)}
                  className={`text-left p-4 border-2 rounded-xl transition-all ${
                    selectedAuditType === audit.id
                      ? 'border-brand-500 bg-brand-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Shield size={20} className={selectedAuditType === audit.id ? 'text-brand-600' : 'text-gray-400'} />
                    {selectedAuditType === audit.id && (
                      <CheckCircle2 size={18} className="text-brand-600" />
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{audit.name}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{audit.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Target size={10} />{audit.controlCount} controls</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{audit.estimatedDuration}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedAuditType && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900">Simulation Configuration</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      The AI auditor will simulate a {AUDIT_TYPES.find(a => a.id === selectedAuditType)?.name} audit by:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-blue-700">
                      <li className="flex items-center gap-1.5"><CheckSquare size={10} />Reviewing all mapped controls and their implementation status</li>
                      <li className="flex items-center gap-1.5"><CheckSquare size={10} />Examining evidence completeness, currency, and quality</li>
                      <li className="flex items-center gap-1.5"><CheckSquare size={10} />Generating audit questions an auditor would ask</li>
                      <li className="flex items-center gap-1.5"><CheckSquare size={10} />Identifying findings with severity classifications</li>
                      <li className="flex items-center gap-1.5"><CheckSquare size={10} />Producing a simulated audit report with recommendations</li>
                    </ul>
                    <button
                      onClick={handleStartSimulation}
                      disabled={isSimulating}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    >
                      {isSimulating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Starting Simulation...
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          Start Audit Simulation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mock Interview Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <MessageSquare size={18} className="text-brand-600" />
                Mock Interview Practice
              </h3>
              <p className="text-sm text-gray-500 mb-4">Practice answering common audit interview questions to prepare your team.</p>
              <div className="space-y-3">
                {MOCK_INTERVIEW_QUESTIONS.slice(0, 4).map(iq => (
                  <div key={iq.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{iq.category}</span>
                      <span className="text-xs text-gray-400">Role: {iq.role}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">"{iq.question}"</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type your answer to practice..."
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                      <button className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1">
                        <Send size={12} />
                        Evaluate
                      </button>
                    </div>
                    {iq.followUps.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium mb-1">Typical follow-up questions:</p>
                        <ul className="space-y-0.5">
                          {iq.followUps.map((fu, idx) => (
                            <li key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                              <ChevronRight size={10} className="flex-shrink-0" />
                              {fu}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Active Simulations Tab ───────────────────────────── */}
        {activeTab === 'active' && (
          <div className="p-4 space-y-4">
            {SIMULATION_RUNS.filter(s => s.status !== 'completed').length === 0 && (
              <div className="text-center py-12">
                <Play size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No active simulations</p>
                <p className="text-xs text-gray-500 mt-1">Start a new simulation from the "New Simulation" tab</p>
                <button onClick={() => setActiveTab('new')} className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mx-auto">
                  Start Simulation <ArrowRight size={14} />
                </button>
              </div>
            )}

            {SIMULATION_RUNS.filter(s => s.status === 'running' || s.status === 'paused').map(sim => (
              <div key={sim.id} className="bg-white border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-gray-900">{sim.auditType}</h4>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" />
                        Running
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Started: {new Date(sim.startedAt).toLocaleString()} | {sim.controlsTested}/{sim.totalControls} controls tested
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{sim.progress}%</p>
                    <p className="text-xs text-gray-400">complete</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${sim.progress}%` }} />
                </div>

                {/* Current Stats */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold text-gray-900">{sim.controlsTested}/{sim.totalControls}</p>
                    <p className="text-xs text-gray-500">Controls Tested</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold text-gray-900">{sim.questionsAsked}</p>
                    <p className="text-xs text-gray-500">Questions Asked</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold text-orange-600">{sim.findingsCount.critical + sim.findingsCount.major + sim.findingsCount.minor + sim.findingsCount.observation}</p>
                    <p className="text-xs text-gray-500">Findings So Far</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className={`text-sm font-bold ${sim.readinessScore >= 80 ? 'text-green-600' : sim.readinessScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{sim.readinessScore}%</p>
                    <p className="text-xs text-gray-500">Current Score</p>
                  </div>
                </div>

                <FindingsChart findings={sim.findingsCount} />

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    <Pause size={12} />
                    Pause
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
                    <StopCircle size={12} />
                    Stop
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    <Eye size={12} />
                    View Live
                  </button>
                </div>
              </div>
            ))}

            {/* Completed Simulations (Recent) */}
            {SIMULATION_RUNS.filter(s => s.status === 'completed').length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">Recently Completed</h4>
                {SIMULATION_RUNS.filter(s => s.status === 'completed').map(sim => (
                  <div key={sim.id} className="bg-white border border-green-200 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ReadinessGauge score={sim.readinessScore} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-gray-900">{sim.auditType}</h4>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              Completed
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(sim.completedAt!).toLocaleString()} | {sim.controlsTested} controls tested
                          </p>
                          <div className="mt-1">
                            <FindingsChart findings={sim.findingsCount} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setActiveTab('results'); setSelectedSimForResults(sim.id); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors"
                        >
                          <Eye size={12} />
                          View Results
                        </button>
                        <button
                          onClick={() => handleExportReport(sim.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Download size={12} />
                          Export
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                          <RotateCcw size={12} />
                          Re-run
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Results Tab ──────────────────────────────────────── */}
        {activeTab === 'results' && (
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
                    placeholder="Search findings..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedSimForResults || ''}
                  onChange={e => setSelectedSimForResults(e.target.value || null)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Simulations</option>
                  {SIMULATION_RUNS.filter(s => s.status === 'completed').map(sim => (
                    <option key={sim.id} value={sim.id}>{sim.id}: {sim.auditType}</option>
                  ))}
                </select>
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
                  <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="observation">Observation</option>
                  </select>
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="all">All Categories</option>
                    {findingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              {/* Readiness Trend */}
              <div className="bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-brand-600" />
                  Audit Readiness Trend
                </h4>
                <div className="flex items-center gap-6">
                  {SIMULATION_RUNS.filter(s => s.status === 'completed').map(sim => (
                    <div key={sim.id} className="flex items-center gap-2">
                      <ReadinessGauge score={sim.readinessScore} size="sm" />
                      <div>
                        <p className="text-xs font-medium text-gray-900">{sim.auditType}</p>
                        <p className="text-xs text-gray-400">{new Date(sim.completedAt!).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Findings */}
              {filteredFindings.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">No findings match your filters</p>
                </div>
              )}

              {filteredFindings.map(finding => (
                <div
                  key={finding.id}
                  className={`border rounded-xl overflow-hidden ${
                    finding.severity === 'critical' ? 'border-red-200 bg-red-50/20' :
                    finding.severity === 'major' ? 'border-orange-200 bg-orange-50/10' :
                    'border-gray-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{finding.controlId}</span>
                          <SeverityBadge severity={finding.severity} />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            finding.status === 'open' ? 'bg-red-100 text-red-700' :
                            finding.status === 'remediation-planned' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>{finding.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                          <span className="text-xs text-gray-400">{finding.category}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">{finding.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{finding.controlName}</p>
                      </div>
                      {expandedFinding === finding.id ? <ChevronUp size={16} className="text-gray-400 ml-2" /> : <ChevronDown size={16} className="text-gray-400 ml-2" />}
                    </div>
                  </button>

                  {expandedFinding === finding.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 space-y-3">
                      <div className="mt-3">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Finding Description</h5>
                        <p className="text-sm text-gray-600 leading-relaxed">{finding.description}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <h5 className="text-xs font-semibold text-red-700 mb-1">Evidence Gap</h5>
                        <p className="text-sm text-red-800">{finding.evidence}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <h5 className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                          <Sparkles size={12} />
                          AI Recommendation
                        </h5>
                        <p className="text-sm text-green-800">{finding.recommendation}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10} />Est. Effort: {finding.estimatedEffort}</span>
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
                            <Zap size={12} />Create Remediation Task
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            <CheckSquare size={12} />Mark Remediated
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Question Bank Tab ─────────────────────────────────── */}
        {activeTab === 'questions' && (
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
                    placeholder="Search questions..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <select value={auditTypeFilter} onChange={e => setAuditTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="all">All Frameworks</option>
                  {AUDIT_TYPES.map(at => (
                    <option key={at.id} value={at.name}>{at.name}</option>
                  ))}
                </select>
                <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="all">All Difficulties</option>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {filteredQuestions.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">No questions match your filters</p>
                </div>
              )}

              {filteredQuestions.map(question => (
                <div key={question.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-brand-200 transition-colors">
                  <button
                    onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{question.controlRef}</span>
                          <DifficultyBadge difficulty={question.difficulty} />
                          <span className="text-xs text-gray-400">{question.category}</span>
                          <span className="text-xs text-brand-600 font-medium">{question.auditType}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">"{question.question}"</p>
                      </div>
                      {expandedQuestion === question.id ? <ChevronUp size={16} className="text-gray-400 ml-2" /> : <ChevronDown size={16} className="text-gray-400 ml-2" />}
                    </div>
                  </button>

                  {expandedQuestion === question.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 space-y-3">
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="text-xs font-semibold text-blue-700 mb-1">Auditor Context</h5>
                        <p className="text-sm text-blue-800">{question.context}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Expected Evidence</h5>
                        <div className="space-y-1">
                          {question.expectedEvidence.map((ev, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <FileCheck size={12} className="text-green-500 flex-shrink-0" />
                              {ev}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
                          <MessageSquare size={12} />
                          Practice Answer
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                          <Star size={12} />
                          Bookmark
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
