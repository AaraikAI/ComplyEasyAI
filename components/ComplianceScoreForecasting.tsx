import React, { useState, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Target, Shield,
  AlertTriangle, CheckCircle, Clock, Calendar, Download, RefreshCw,
  ChevronRight, ChevronDown, ChevronUp, BarChart3, Lightbulb,
  Zap, Eye, FileText, Settings, Bell, ArrowUpRight, ArrowDownRight,
  Activity, Layers, Lock, Server, Users, Building2, Search,
  PieChart as PieChartIcon, Info, Star, ExternalLink, Play,
  BookOpen, Filter, X, Sliders, Sparkles, Award, Gauge,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FrameworkProjection {
  id: string;
  name: string;
  currentScore: number;
  projected30: number;
  projected60: number;
  projected90: number;
  projected180: number;
  trend: 'improving' | 'stable' | 'declining';
  trendDelta: number;
  category: string;
}

interface RiskFactor {
  id: string;
  title: string;
  description: string;
  category: 'regulation' | 'certification' | 'audit' | 'personnel' | 'technology';
  severity: 'critical' | 'high' | 'medium' | 'low';
  impactScore: number;
  expectedDate: string;
  status: 'upcoming' | 'active' | 'mitigated';
  affectedFrameworks: string[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedImpact: number;
  effort: 'low' | 'medium' | 'high';
  category: string;
  affectedFrameworks: string[];
  timeToImplement: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
}

interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  controls: WhatIfControl[];
  projectedScoreChange: number;
  projectedNewScore: number;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  isCustom: boolean;
}

interface WhatIfControl {
  id: string;
  name: string;
  category: string;
  currentStatus: 'not_implemented' | 'partial' | 'implemented';
  proposedStatus: 'partial' | 'implemented';
  scoreImpact: number;
}

interface HistoricalEntry {
  month: string;
  overall: number;
  technical: number;
  administrative: number;
  physical: number;
}

interface AlertThreshold {
  id: string;
  name: string;
  framework: string;
  thresholdType: 'below' | 'drop';
  value: number;
  isActive: boolean;
  lastTriggered: string | null;
}

interface IndustryBenchmark {
  framework: string;
  industryAvg: number;
  industryTop25: number;
  industryTop10: number;
  ourScore: number;
}

type TabId = 'dashboard' | 'projections' | 'whatif' | 'history' | 'recommendations';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ComplianceScoreForecastingProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

const FRAMEWORK_PROJECTIONS: FrameworkProjection[] = [
  { id: 'fw-1', name: 'SOC 2 Type II', currentScore: 82, projected30: 84, projected60: 87, projected90: 89, projected180: 93, trend: 'improving', trendDelta: 3.2, category: 'Security' },
  { id: 'fw-2', name: 'ISO 27001', currentScore: 78, projected30: 79, projected60: 81, projected90: 83, projected180: 88, trend: 'improving', trendDelta: 1.8, category: 'Security' },
  { id: 'fw-3', name: 'GDPR', currentScore: 91, projected30: 91, projected60: 90, projected90: 89, projected180: 87, trend: 'declining', trendDelta: -1.2, category: 'Privacy' },
  { id: 'fw-4', name: 'HIPAA', currentScore: 75, projected30: 76, projected60: 78, projected90: 80, projected180: 85, trend: 'improving', trendDelta: 2.5, category: 'Healthcare' },
  { id: 'fw-5', name: 'PCI DSS', currentScore: 88, projected30: 88, projected60: 88, projected90: 87, projected180: 86, trend: 'stable', trendDelta: -0.3, category: 'Financial' },
  { id: 'fw-6', name: 'NIST 800-53', currentScore: 71, projected30: 73, projected60: 76, projected90: 79, projected180: 84, trend: 'improving', trendDelta: 4.1, category: 'Federal' },
  { id: 'fw-7', name: 'EU AI Act', currentScore: 64, projected30: 67, projected60: 71, projected90: 75, projected180: 82, trend: 'improving', trendDelta: 5.6, category: 'AI Governance' },
  { id: 'fw-8', name: 'CCPA', currentScore: 86, projected30: 86, projected60: 85, projected90: 85, projected180: 84, trend: 'stable', trendDelta: -0.5, category: 'Privacy' },
];

const RISK_FACTORS: RiskFactor[] = [
  { id: 'rf-1', title: 'GDPR Enforcement Update Q2 2026', description: 'New GDPR enforcement guidelines expected to tighten data transfer rules, requiring additional safeguards for cross-border processing.', category: 'regulation', severity: 'high', impactScore: -4.5, expectedDate: '2026-04-15', status: 'upcoming', affectedFrameworks: ['GDPR', 'CCPA'] },
  { id: 'rf-2', title: 'ISO 27001 Certification Renewal', description: 'Current ISO 27001 certification expires in 120 days. Recertification audit must be scheduled and prepared for.', category: 'certification', severity: 'critical', impactScore: -8.0, expectedDate: '2026-06-17', status: 'upcoming', affectedFrameworks: ['ISO 27001'] },
  { id: 'rf-3', title: 'SOC 2 Annual Audit Pending', description: 'Annual SOC 2 Type II audit window begins next month. Evidence collection must be finalized.', category: 'audit', severity: 'high', impactScore: -3.0, expectedDate: '2026-03-10', status: 'active', affectedFrameworks: ['SOC 2 Type II'] },
  { id: 'rf-4', title: 'CISO Departure - Knowledge Transfer', description: 'Current CISO departing in 60 days. Knowledge transfer and succession planning needed for compliance continuity.', category: 'personnel', severity: 'high', impactScore: -5.0, expectedDate: '2026-04-20', status: 'upcoming', affectedFrameworks: ['SOC 2 Type II', 'ISO 27001', 'NIST 800-53'] },
  { id: 'rf-5', title: 'EU AI Act Classification Deadline', description: 'High-risk AI systems must complete conformity assessment by deadline. Three systems pending classification.', category: 'regulation', severity: 'critical', impactScore: -6.0, expectedDate: '2026-08-01', status: 'upcoming', affectedFrameworks: ['EU AI Act'] },
  { id: 'rf-6', title: 'Cloud Migration - Security Controls', description: 'Ongoing cloud migration may temporarily reduce physical security control scores during transition.', category: 'technology', severity: 'medium', impactScore: -2.5, expectedDate: '2026-05-01', status: 'active', affectedFrameworks: ['SOC 2 Type II', 'PCI DSS', 'HIPAA'] },
  { id: 'rf-7', title: 'PCI DSS v4.0 Transition', description: 'PCI DSS v4.0 requirements become mandatory. Several new controls need implementation.', category: 'regulation', severity: 'high', impactScore: -4.0, expectedDate: '2026-03-31', status: 'active', affectedFrameworks: ['PCI DSS'] },
  { id: 'rf-8', title: 'Vendor Security Assessment Backlog', description: '12 vendor security assessments overdue, potentially impacting third-party risk management scores.', category: 'audit', severity: 'medium', impactScore: -2.0, expectedDate: '2026-03-15', status: 'active', affectedFrameworks: ['SOC 2 Type II', 'ISO 27001'] },
];

const RECOMMENDATIONS: Recommendation[] = [
  { id: 'rec-1', title: 'Implement Automated Evidence Collection', description: 'Deploy automated evidence collection pipelines for SOC 2 and ISO 27001 controls. This will reduce manual effort by 60% and improve evidence freshness scores significantly.', priority: 'high', estimatedImpact: 5.2, effort: 'medium', category: 'Technical Controls', affectedFrameworks: ['SOC 2 Type II', 'ISO 27001'], timeToImplement: '4-6 weeks', status: 'pending' },
  { id: 'rec-2', title: 'Complete Data Mapping Inventory', description: 'Finalize data flow mapping for all processing activities. Critical for GDPR Article 30 compliance and CCPA disclosure requirements.', priority: 'critical', estimatedImpact: 7.8, effort: 'high', category: 'Administrative Controls', affectedFrameworks: ['GDPR', 'CCPA'], timeToImplement: '6-8 weeks', status: 'in_progress' },
  { id: 'rec-3', title: 'Deploy Encryption at Rest for All Databases', description: 'Enable AES-256 encryption at rest for all production databases. Currently 3 databases lack encryption configuration.', priority: 'high', estimatedImpact: 4.5, effort: 'low', category: 'Technical Controls', affectedFrameworks: ['PCI DSS', 'HIPAA', 'SOC 2 Type II'], timeToImplement: '1-2 weeks', status: 'pending' },
  { id: 'rec-4', title: 'Establish AI Model Governance Board', description: 'Create a cross-functional AI governance board to oversee model risk management, bias testing, and EU AI Act conformity assessment processes.', priority: 'high', estimatedImpact: 8.5, effort: 'medium', category: 'Administrative Controls', affectedFrameworks: ['EU AI Act', 'NIST 800-53'], timeToImplement: '3-4 weeks', status: 'pending' },
  { id: 'rec-5', title: 'Implement Multi-Factor Authentication Everywhere', description: 'Enforce MFA for all system access points including VPN, cloud console, and internal applications. Currently at 78% coverage.', priority: 'medium', estimatedImpact: 3.2, effort: 'low', category: 'Technical Controls', affectedFrameworks: ['SOC 2 Type II', 'ISO 27001', 'NIST 800-53'], timeToImplement: '2-3 weeks', status: 'pending' },
  { id: 'rec-6', title: 'Update Incident Response Playbooks', description: 'Review and update all incident response playbooks to align with latest NIST guidelines and include AI-specific incident scenarios.', priority: 'medium', estimatedImpact: 2.8, effort: 'medium', category: 'Administrative Controls', affectedFrameworks: ['NIST 800-53', 'SOC 2 Type II', 'HIPAA'], timeToImplement: '3-4 weeks', status: 'pending' },
  { id: 'rec-7', title: 'Physical Access Control Upgrade', description: 'Upgrade badge access systems to biometric authentication for server rooms and sensitive areas. Current system lacks audit trail integration.', priority: 'low', estimatedImpact: 2.0, effort: 'high', category: 'Physical Controls', affectedFrameworks: ['SOC 2 Type II', 'PCI DSS'], timeToImplement: '8-12 weeks', status: 'pending' },
  { id: 'rec-8', title: 'Automate HIPAA Training Compliance', description: 'Implement automated HIPAA training assignment, tracking, and certification renewal. 15% of workforce is overdue for annual training.', priority: 'high', estimatedImpact: 3.8, effort: 'low', category: 'Administrative Controls', affectedFrameworks: ['HIPAA'], timeToImplement: '1-2 weeks', status: 'completed' },
];

const WHATIF_SCENARIOS: WhatIfScenario[] = [
  {
    id: 'wf-1', name: 'Full Encryption Implementation', description: 'Implement encryption at rest and in transit for all data stores and communication channels.', projectedScoreChange: 4.8, projectedNewScore: 85.8, effort: 'medium', timeframe: '4-6 weeks', isCustom: false,
    controls: [
      { id: 'c-1', name: 'Database Encryption at Rest', category: 'Technical', currentStatus: 'partial', proposedStatus: 'implemented', scoreImpact: 2.1 },
      { id: 'c-2', name: 'API TLS 1.3 Enforcement', category: 'Technical', currentStatus: 'partial', proposedStatus: 'implemented', scoreImpact: 1.5 },
      { id: 'c-3', name: 'Email Encryption (S/MIME)', category: 'Technical', currentStatus: 'not_implemented', proposedStatus: 'implemented', scoreImpact: 1.2 },
    ],
  },
  {
    id: 'wf-2', name: 'Comprehensive Access Control Overhaul', description: 'Upgrade all access controls to zero-trust model with MFA, least privilege, and continuous verification.', projectedScoreChange: 6.2, projectedNewScore: 87.2, effort: 'high', timeframe: '8-12 weeks', isCustom: false,
    controls: [
      { id: 'c-4', name: 'Zero Trust Network Architecture', category: 'Technical', currentStatus: 'not_implemented', proposedStatus: 'implemented', scoreImpact: 2.8 },
      { id: 'c-5', name: 'Universal MFA Enforcement', category: 'Technical', currentStatus: 'partial', proposedStatus: 'implemented', scoreImpact: 1.6 },
      { id: 'c-6', name: 'Privileged Access Management', category: 'Technical', currentStatus: 'partial', proposedStatus: 'implemented', scoreImpact: 1.8 },
    ],
  },
  {
    id: 'wf-3', name: 'Policy & Training Enhancement', description: 'Complete policy refresh cycle and implement automated security awareness training with phishing simulation.', projectedScoreChange: 3.5, projectedNewScore: 84.5, effort: 'low', timeframe: '2-4 weeks', isCustom: false,
    controls: [
      { id: 'c-7', name: 'Security Policy Refresh', category: 'Administrative', currentStatus: 'partial', proposedStatus: 'implemented', scoreImpact: 1.2 },
      { id: 'c-8', name: 'Automated Training Platform', category: 'Administrative', currentStatus: 'not_implemented', proposedStatus: 'implemented', scoreImpact: 1.5 },
      { id: 'c-9', name: 'Phishing Simulation Program', category: 'Administrative', currentStatus: 'not_implemented', proposedStatus: 'implemented', scoreImpact: 0.8 },
    ],
  },
  {
    id: 'wf-4', name: 'AI Governance Fast-Track', description: 'Implement critical AI governance controls to meet EU AI Act requirements and NIST AI RMF alignment.', projectedScoreChange: 8.1, projectedNewScore: 89.1, effort: 'high', timeframe: '10-14 weeks', isCustom: false,
    controls: [
      { id: 'c-10', name: 'AI Risk Classification System', category: 'Administrative', currentStatus: 'not_implemented', proposedStatus: 'implemented', scoreImpact: 3.0 },
      { id: 'c-11', name: 'Model Bias Testing Framework', category: 'Technical', currentStatus: 'not_implemented', proposedStatus: 'implemented', scoreImpact: 2.5 },
      { id: 'c-12', name: 'AI Transparency Documentation', category: 'Administrative', currentStatus: 'partial', proposedStatus: 'implemented', scoreImpact: 1.6 },
      { id: 'c-13', name: 'Human Oversight Mechanisms', category: 'Administrative', currentStatus: 'not_implemented', proposedStatus: 'implemented', scoreImpact: 1.0 },
    ],
  },
  {
    id: 'wf-5', name: 'Vendor Risk Remediation Sprint', description: 'Address all overdue vendor assessments and implement continuous vendor monitoring.', projectedScoreChange: 2.9, projectedNewScore: 83.9, effort: 'medium', timeframe: '3-5 weeks', isCustom: false,
    controls: [
      { id: 'c-14', name: 'Vendor Assessment Completion', category: 'Administrative', currentStatus: 'partial', proposedStatus: 'implemented', scoreImpact: 1.4 },
      { id: 'c-15', name: 'Continuous Vendor Monitoring', category: 'Technical', currentStatus: 'not_implemented', proposedStatus: 'implemented', scoreImpact: 1.5 },
    ],
  },
];

const HISTORICAL_DATA: HistoricalEntry[] = [
  { month: 'Aug 2025', overall: 68, technical: 72, administrative: 62, physical: 70 },
  { month: 'Sep 2025', overall: 70, technical: 73, administrative: 65, physical: 71 },
  { month: 'Oct 2025', overall: 72, technical: 75, administrative: 67, physical: 73 },
  { month: 'Nov 2025', overall: 74, technical: 77, administrative: 70, physical: 74 },
  { month: 'Dec 2025', overall: 76, technical: 78, administrative: 72, physical: 76 },
  { month: 'Jan 2026', overall: 79, technical: 81, administrative: 75, physical: 78 },
  { month: 'Feb 2026', overall: 81, technical: 83, administrative: 77, physical: 80 },
];

const ALERT_THRESHOLDS: AlertThreshold[] = [
  { id: 'at-1', name: 'Overall Score Below 75', framework: 'All Frameworks', thresholdType: 'below', value: 75, isActive: true, lastTriggered: '2025-11-15' },
  { id: 'at-2', name: 'SOC 2 Score Drop > 5pts', framework: 'SOC 2 Type II', thresholdType: 'drop', value: 5, isActive: true, lastTriggered: null },
  { id: 'at-3', name: 'GDPR Score Below 85', framework: 'GDPR', thresholdType: 'below', value: 85, isActive: true, lastTriggered: '2026-01-28' },
  { id: 'at-4', name: 'HIPAA Score Below 80', framework: 'HIPAA', thresholdType: 'below', value: 80, isActive: true, lastTriggered: '2026-02-10' },
  { id: 'at-5', name: 'Any Framework Drop > 3pts', framework: 'All Frameworks', thresholdType: 'drop', value: 3, isActive: false, lastTriggered: null },
];

const INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  { framework: 'SOC 2 Type II', industryAvg: 76, industryTop25: 85, industryTop10: 92, ourScore: 82 },
  { framework: 'ISO 27001', industryAvg: 72, industryTop25: 82, industryTop10: 90, ourScore: 78 },
  { framework: 'GDPR', industryAvg: 80, industryTop25: 89, industryTop10: 95, ourScore: 91 },
  { framework: 'HIPAA', industryAvg: 70, industryTop25: 80, industryTop10: 88, ourScore: 75 },
  { framework: 'PCI DSS', industryAvg: 78, industryTop25: 87, industryTop10: 94, ourScore: 88 },
  { framework: 'NIST 800-53', industryAvg: 65, industryTop25: 76, industryTop10: 85, ourScore: 71 },
];

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Gauge className="w-4 h-4" /> },
  { id: 'projections', label: 'Projections', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'whatif', label: 'What-If Scenarios', icon: <Sliders className="w-4 h-4" /> },
  { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
  { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
  switch (trend) {
    case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
    default: return <Minus className="w-4 h-4 text-yellow-500" />;
  }
};

const getTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
  switch (trend) {
    case 'improving': return 'text-green-600 bg-green-50 border-green-200';
    case 'declining': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  }
};

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

const getScoreBgLight = (score: number): string => {
  if (score >= 90) return 'bg-green-100';
  if (score >= 75) return 'bg-blue-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
};

const getSeverityStyles = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityStyles = (priority: string): string => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getEffortStyles = (effort: string): string => {
  switch (effort) {
    case 'low': return 'bg-green-100 text-green-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'high': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'regulation': return <FileText className="w-4 h-4" />;
    case 'certification': return <Award className="w-4 h-4" />;
    case 'audit': return <Search className="w-4 h-4" />;
    case 'personnel': return <Users className="w-4 h-4" />;
    case 'technology': return <Server className="w-4 h-4" />;
    default: return <Info className="w-4 h-4" />;
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ComplianceScoreForecasting: React.FC<ComplianceScoreForecastingProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [projectionFilter, setProjectionFilter] = useState<'all' | 'improving' | 'stable' | 'declining'>('all');
  const [selectedScenario, setSelectedScenario] = useState<WhatIfScenario | null>(null);
  const [expandedRiskFactors, setExpandedRiskFactors] = useState<Set<string>>(new Set());
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  const [recFilter, setRecFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [recPriorityFilter, setRecPriorityFilter] = useState<string>('all');
  const [alertThresholds, setAlertThresholds] = useState<AlertThreshold[]>(ALERT_THRESHOLDS);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<'all' | 'technical' | 'administrative' | 'physical'>('all');

  // Computed values
  const overallCurrentScore = useMemo(() => {
    const sum = FRAMEWORK_PROJECTIONS.reduce((acc, fw) => acc + fw.currentScore, 0);
    return Math.round(sum / FRAMEWORK_PROJECTIONS.length);
  }, []);

  const overallProjected90 = useMemo(() => {
    const sum = FRAMEWORK_PROJECTIONS.reduce((acc, fw) => acc + fw.projected90, 0);
    return Math.round(sum / FRAMEWORK_PROJECTIONS.length);
  }, []);

  const overallProjected180 = useMemo(() => {
    const sum = FRAMEWORK_PROJECTIONS.reduce((acc, fw) => acc + fw.projected180, 0);
    return Math.round(sum / FRAMEWORK_PROJECTIONS.length);
  }, []);

  const filteredProjections = useMemo(() => {
    if (projectionFilter === 'all') return FRAMEWORK_PROJECTIONS;
    return FRAMEWORK_PROJECTIONS.filter(fw => fw.trend === projectionFilter);
  }, [projectionFilter]);

  const filteredRecommendations = useMemo(() => {
    let recs = [...RECOMMENDATIONS];
    if (recFilter !== 'all') recs = recs.filter(r => r.status === recFilter);
    if (recPriorityFilter !== 'all') recs = recs.filter(r => r.priority === recPriorityFilter);
    return recs;
  }, [recFilter, recPriorityFilter]);

  const criticalRiskCount = useMemo(() => RISK_FACTORS.filter(rf => rf.severity === 'critical').length, []);
  const activeRiskCount = useMemo(() => RISK_FACTORS.filter(rf => rf.status === 'active').length, []);

  const toggleRiskExpanded = useCallback((id: string) => {
    setExpandedRiskFactors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleRecExpanded = useCallback((id: string) => {
    setExpandedRecommendations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAlertActive = useCallback((id: string) => {
    setAlertThresholds(prev => prev.map(at => at.id === id ? { ...at, isActive: !at.isActive } : at));
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiInsights, setAiInsights] = useState<{ keyInsights: string[]; recommendedActions: any[]; summary: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleRefreshForecast = useCallback(async () => {
    setIsRefreshing(true);
    setAiError(null);

    try {
      const currentScores = FRAMEWORK_PROJECTIONS.map(fw => ({
        framework: fw.name,
        score: fw.currentScore,
        trend: fw.trend === 'improving' ? 'up' as const : fw.trend === 'declining' ? 'down' as const : 'stable' as const,
      }));

      const result = await api.ai.forecastComplianceScore(
        currentScores,
        ['EU AI Act enforcement deadline approaching', 'NIS2 compliance deadline', 'SOC 2 annual audit cycle'],
        HISTORICAL_DATA.map(h => ({ date: h.month, framework: 'Overall', score: h.overall }))
      );

      setAiInsights({
        keyInsights: result.keyInsights || [],
        recommendedActions: result.recommendedActions || [],
        summary: result.summary || '',
      });
    } catch (error: any) {
      console.error('Forecast refresh error:', error);
      setAiError(error?.message || 'Failed to refresh AI forecast.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  }, []);

  // ---------------------------------------------------------------------------
  // Render: Bar Chart (div-based)
  // ---------------------------------------------------------------------------
  const renderBarChart = (data: HistoricalEntry[], categoryFilter: string) => {
    const maxVal = 100;
    return (
      <div className="flex items-end gap-2 h-64 px-2">
        {data.map((entry, idx) => {
          const getValue = () => {
            switch (categoryFilter) {
              case 'technical': return entry.technical;
              case 'administrative': return entry.administrative;
              case 'physical': return entry.physical;
              default: return entry.overall;
            }
          };
          const val = getValue();
          const heightPct = (val / maxVal) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{val}%</span>
              <div className="w-full relative" style={{ height: '200px' }}>
                <div
                  className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${getScoreBg(val)}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">{entry.month}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Score Ring (SVG)
  // ---------------------------------------------------------------------------
  const renderScoreRing = (score: number, size: number = 120, strokeWidth: number = 10) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 90 ? '#22c55e' : score >= 75 ? '#3b82f6' : score >= 60 ? '#eab308' : '#ef4444';

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700"
        />
      </svg>
    );
  };

  // ---------------------------------------------------------------------------
  // Tab: Dashboard
  // ---------------------------------------------------------------------------
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Score Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Current Score</span>
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              {renderScoreRing(overallCurrentScore, 72, 7)}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${getScoreColor(overallCurrentScore)}`}>{overallCurrentScore}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">+2.4</span>
              </div>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">90-Day Projection</span>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              {renderScoreRing(overallProjected90, 72, 7)}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${getScoreColor(overallProjected90)}`}>{overallProjected90}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">+{overallProjected90 - overallCurrentScore}</span>
              </div>
              <span className="text-xs text-gray-400">projected change</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Risks</span>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{activeRiskCount}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {criticalRiskCount} critical
            </span>
            <span className="text-xs text-gray-400">{RISK_FACTORS.length} total</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">180-Day Forecast</span>
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              {renderScoreRing(overallProjected180, 72, 7)}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${getScoreColor(overallProjected180)}`}>{overallProjected180}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">+{overallProjected180 - overallCurrentScore}</span>
              </div>
              <span className="text-xs text-gray-400">total projected gain</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { name: 'Technical Controls', score: 83, projected: 89, icon: <Lock className="w-5 h-5 text-blue-500" />, color: 'blue' },
          { name: 'Administrative Controls', score: 77, projected: 83, icon: <FileText className="w-5 h-5 text-purple-500" />, color: 'purple' },
          { name: 'Physical Controls', score: 80, projected: 85, icon: <Building2 className="w-5 h-5 text-green-500" />, color: 'green' },
        ].map(cat => (
          <div key={cat.name} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              {cat.icon}
              <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Current</span>
              <span className={`text-lg font-bold ${getScoreColor(cat.score)}`}>{cat.score}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
              <div className={`h-2.5 rounded-full transition-all duration-500 ${getScoreBg(cat.score)}`} style={{ width: `${cat.score}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Projected (90d)</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-green-600">{cat.projected}%</span>
                <ArrowUpRight className="w-3 h-3 text-green-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Framework Quick Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            Framework Compliance Trajectory
          </h3>
          <button onClick={() => setShowBenchmarks(!showBenchmarks)} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            {showBenchmarks ? 'Hide' : 'Show'} Benchmarks
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Framework</th>
                <th className="px-5 py-3 text-center font-medium">Current</th>
                <th className="px-5 py-3 text-center font-medium">30d</th>
                <th className="px-5 py-3 text-center font-medium">60d</th>
                <th className="px-5 py-3 text-center font-medium">90d</th>
                <th className="px-5 py-3 text-center font-medium">180d</th>
                <th className="px-5 py-3 text-center font-medium">Trend</th>
                {showBenchmarks && <th className="px-5 py-3 text-center font-medium">Industry Avg</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {FRAMEWORK_PROJECTIONS.map(fw => {
                const benchmark = INDUSTRY_BENCHMARKS.find(b => b.framework === fw.name);
                return (
                  <tr key={fw.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedFramework(selectedFramework === fw.id ? null : fw.id)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{fw.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{fw.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-bold text-sm ${getScoreColor(fw.currentScore)}`}>{fw.currentScore}%</span>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{fw.projected30}%</td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{fw.projected60}%</td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{fw.projected90}%</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-semibold text-sm ${getScoreColor(fw.projected180)}`}>{fw.projected180}%</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {getTrendIcon(fw.trend)}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getTrendColor(fw.trend)}`}>
                          {fw.trendDelta > 0 ? '+' : ''}{fw.trendDelta}
                        </span>
                      </div>
                    </td>
                    {showBenchmarks && benchmark && (
                      <td className="px-5 py-3 text-center">
                        <span className={`text-sm ${fw.currentScore >= benchmark.industryAvg ? 'text-green-600' : 'text-red-600'}`}>
                          {benchmark.industryAvg}%
                          {fw.currentScore >= benchmark.industryAvg ?
                            <ArrowUpRight className="w-3 h-3 inline ml-1" /> :
                            <ArrowDownRight className="w-3 h-3 inline ml-1" />}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Factors Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Key Risk Factors Affecting Forecast
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {RISK_FACTORS.filter(rf => rf.severity === 'critical' || rf.severity === 'high').slice(0, 4).map(rf => (
            <div key={rf.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${rf.severity === 'critical' ? 'bg-red-100' : 'bg-orange-100'}`}>
                  {getCategoryIcon(rf.category)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rf.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Due: {rf.expectedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getSeverityStyles(rf.severity)}`}>
                  {rf.severity}
                </span>
                <span className="text-sm font-medium text-red-600">{rf.impactScore} pts</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-b-xl">
          <button onClick={() => setActiveTab('projections')} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all risk factors <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI-Generated Top Recommendations
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {RECOMMENDATIONS.filter(r => r.status === 'pending').slice(0, 3).map(rec => (
            <div key={rec.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-purple-100">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rec.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{rec.category} | {rec.timeToImplement}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityStyles(rec.priority)}`}>
                  {rec.priority}
                </span>
                <span className="text-sm font-semibold text-green-600">+{rec.estimatedImpact} pts</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-b-xl">
          <button onClick={() => setActiveTab('recommendations')} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all recommendations <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Tab: Projections
  // ---------------------------------------------------------------------------
  const renderProjections = () => (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Filter by trend:</span>
        {(['all', 'improving', 'stable', 'declining'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setProjectionFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              projectionFilter === filter
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Framework Projection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProjections.map(fw => (
          <div key={fw.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{fw.name}</h3>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getTrendColor(fw.trend)}`}>
                {getTrendIcon(fw.trend)}
                {fw.trend}
              </div>
            </div>

            {/* Score Timeline */}
            <div className="flex items-center justify-between mb-4">
              {[
                { label: 'Now', score: fw.currentScore },
                { label: '30d', score: fw.projected30 },
                { label: '60d', score: fw.projected60 },
                { label: '90d', score: fw.projected90 },
                { label: '180d', score: fw.projected180 },
              ].map((point, idx) => (
                <div key={idx} className="text-center">
                  <div className={`text-lg font-bold ${getScoreColor(point.score)}`}>{point.score}%</div>
                  <div className="text-xs text-gray-400">{point.label}</div>
                </div>
              ))}
            </div>

            {/* Projection Bar Visual */}
            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getScoreBg(fw.currentScore)}`}
                style={{ width: `${fw.currentScore}%` }} />
              <div className="absolute top-0 h-full rounded-full bg-indigo-300/50 dark:bg-indigo-400/30"
                style={{ left: `${fw.currentScore}%`, width: `${Math.max(0, fw.projected180 - fw.currentScore)}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">0%</span>
              <span className="text-xs text-gray-400">100%</span>
            </div>

            {/* Affected Risk Factors */}
            {RISK_FACTORS.filter(rf => rf.affectedFrameworks.includes(fw.name)).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Risk Factors:</p>
                <div className="flex flex-wrap gap-1.5">
                  {RISK_FACTORS.filter(rf => rf.affectedFrameworks.includes(fw.name)).map(rf => (
                    <span key={rf.id} className={`text-xs px-2 py-0.5 rounded-full border ${getSeverityStyles(rf.severity)}`}>
                      {rf.title.length > 30 ? rf.title.substring(0, 30) + '...' : rf.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Risk Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            All Risk Factors Affecting Compliance Forecast
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {RISK_FACTORS.map(rf => (
            <div key={rf.id} className="px-5 py-3">
              <button onClick={() => toggleRiskExpanded(rf.id)} className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors p-1 -m-1">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    rf.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                    rf.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    rf.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {getCategoryIcon(rf.category)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{rf.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getSeverityStyles(rf.severity)}`}>{rf.severity}</span>
                      <span className="text-xs text-gray-400">{rf.category}</span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className={`text-xs ${rf.status === 'active' ? 'text-orange-600' : rf.status === 'mitigated' ? 'text-green-600' : 'text-blue-600'}`}>{rf.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-red-600">{rf.impactScore} pts</span>
                  {expandedRiskFactors.has(rf.id) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>
              {expandedRiskFactors.has(rf.id) && (
                <div className="mt-3 pl-12 space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{rf.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Expected: {rf.expectedDate}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Affects: {rf.affectedFrameworks.join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Industry Benchmarks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Industry Benchmark Comparison
          </h3>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {INDUSTRY_BENCHMARKS.map(bm => {
              const aboveAvg = bm.ourScore >= bm.industryAvg;
              const percentile = bm.ourScore >= bm.industryTop10 ? 'Top 10%' :
                bm.ourScore >= bm.industryTop25 ? 'Top 25%' : aboveAvg ? 'Above Average' : 'Below Average';
              return (
                <div key={bm.framework} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{bm.framework}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      percentile === 'Top 10%' ? 'bg-green-100 text-green-800' :
                      percentile === 'Top 25%' ? 'bg-blue-100 text-blue-800' :
                      percentile === 'Above Average' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>{percentile}</span>
                  </div>
                  <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {/* Industry average marker */}
                    <div className="absolute top-0 h-full w-0.5 bg-gray-500 dark:bg-gray-400 z-10" style={{ left: `${bm.industryAvg}%` }} />
                    {/* Top 25% marker */}
                    <div className="absolute top-0 h-full w-0.5 bg-blue-400 z-10" style={{ left: `${bm.industryTop25}%` }} />
                    {/* Our score */}
                    <div className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getScoreBg(bm.ourScore)}`}
                      style={{ width: `${bm.ourScore}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Our Score: {bm.ourScore}%</span>
                    <span>Avg: {bm.industryAvg}% | Top 25%: {bm.industryTop25}% | Top 10%: {bm.industryTop10}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Alert Thresholds
          </h3>
          <button onClick={() => setShowAlertModal(!showAlertModal)}
            className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" /> Configure
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {alertThresholds.map(at => (
            <div key={at.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleAlertActive(at.id)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${at.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${at.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{at.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {at.framework} | {at.thresholdType === 'below' ? `Score below ${at.value}%` : `Score drops > ${at.value} pts`}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {at.lastTriggered ? `Last: ${at.lastTriggered}` : 'Never triggered'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Tab: What-If Scenarios
  // ---------------------------------------------------------------------------
  const renderWhatIf = () => (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            What-If Scenario Modeling
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select a scenario to see projected impact on your compliance score
          </p>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WHATIF_SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(selectedScenario?.id === scenario.id ? null : scenario)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedScenario?.id === scenario.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{scenario.name}</h4>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEffortStyles(scenario.effort)}`}>
                  {scenario.effort} effort
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{scenario.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-bold text-green-600">+{scenario.projectedScoreChange}</span>
                  <span className="text-xs text-gray-400">pts</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{scenario.projectedNewScore}%</div>
                  <div className="text-xs text-gray-400">{scenario.timeframe}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Scenario Details */}
      {selectedScenario && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-green-500" />
                {selectedScenario.name} - Control Impact Analysis
              </h3>
              <button onClick={() => setSelectedScenario(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {/* Score Change Visualization */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(overallCurrentScore)}`}>{overallCurrentScore}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-16 bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 px-3 py-1.5 rounded-full">
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-600">+{selectedScenario.projectedScoreChange}</span>
                  </div>
                  <div className="h-0.5 w-16 bg-gray-300 dark:bg-gray-600" />
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Projected Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(selectedScenario.projectedNewScore)}`}>{selectedScenario.projectedNewScore}%</div>
                </div>
              </div>
            </div>

            {/* Individual Controls */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Controls to Implement</h4>
              {selectedScenario.controls.map(ctrl => (
                <div key={ctrl.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      ctrl.currentStatus === 'implemented' ? 'bg-green-500' :
                      ctrl.currentStatus === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{ctrl.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ctrl.category} | {ctrl.currentStatus.replace('_', ' ')} → {ctrl.proposedStatus.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">+{ctrl.scoreImpact} pts</span>
                </div>
              ))}
            </div>

            {/* Scenario Metadata */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Effort Level</div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getEffortStyles(selectedScenario.effort)}`}>
                  {selectedScenario.effort}
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timeframe</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedScenario.timeframe}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Controls</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedScenario.controls.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Scenario Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-3 text-left font-medium">Scenario</th>
                <th className="px-5 py-3 text-center font-medium">Score Impact</th>
                <th className="px-5 py-3 text-center font-medium">New Score</th>
                <th className="px-5 py-3 text-center font-medium">Effort</th>
                <th className="px-5 py-3 text-center font-medium">Timeframe</th>
                <th className="px-5 py-3 text-center font-medium">Controls</th>
                <th className="px-5 py-3 text-center font-medium">ROI Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {[...WHATIF_SCENARIOS].sort((a, b) => b.projectedScoreChange - a.projectedScoreChange).map(s => {
                const effortMultiplier = s.effort === 'low' ? 3 : s.effort === 'medium' ? 2 : 1;
                const roi = Math.round(s.projectedScoreChange * effortMultiplier * 10) / 10;
                return (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-bold text-green-600">+{s.projectedScoreChange}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-sm font-bold ${getScoreColor(s.projectedNewScore)}`}>{s.projectedNewScore}%</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEffortStyles(s.effort)}`}>{s.effort}</span>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{s.timeframe}</td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{s.controls.length}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-sm font-bold ${roi >= 15 ? 'text-green-600' : roi >= 8 ? 'text-blue-600' : 'text-yellow-600'}`}>{roi}</span>
                    </td>
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
  // Tab: History
  // ---------------------------------------------------------------------------
  const renderHistory = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">View by category:</span>
        {(['all', 'technical', 'administrative', 'physical'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setHistoryCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              historyCategoryFilter === cat
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {cat === 'all' ? 'Overall' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Historical Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Historical Compliance Score Trend
          </h3>
        </div>
        <div className="p-5">
          {renderBarChart(HISTORICAL_DATA, historyCategoryFilter)}
        </div>
        <div className="px-5 pb-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /> 90+ Excellent</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500" /> 75-89 Good</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500" /> 60-74 Needs Work</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500" /> &lt;60 Critical</span>
        </div>
      </div>

      {/* All Categories Side by Side */}
      {historyCategoryFilter === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(['technical', 'administrative', 'physical'] as const).map(cat => (
            <div key={cat} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{cat} Controls</h4>
              </div>
              <div className="p-4">
                <div className="flex items-end gap-1.5 h-32">
                  {HISTORICAL_DATA.map((entry, idx) => {
                    const val = entry[cat];
                    const heightPct = (val / 100) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{val}</span>
                        <div className="w-full relative" style={{ height: '90px' }}>
                          <div className={`absolute bottom-0 w-full rounded-t transition-all duration-500 ${getScoreBg(val)}`}
                            style={{ height: `${heightPct}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-400">{entry.month.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Monthly Score Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-3 text-left font-medium">Month</th>
                <th className="px-5 py-3 text-center font-medium">Overall</th>
                <th className="px-5 py-3 text-center font-medium">Technical</th>
                <th className="px-5 py-3 text-center font-medium">Administrative</th>
                <th className="px-5 py-3 text-center font-medium">Physical</th>
                <th className="px-5 py-3 text-center font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {HISTORICAL_DATA.map((entry, idx) => {
                const prevEntry = idx > 0 ? HISTORICAL_DATA[idx - 1] : null;
                const change = prevEntry ? entry.overall - prevEntry.overall : 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{entry.month}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-sm font-bold ${getScoreColor(entry.overall)}`}>{entry.overall}%</span>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{entry.technical}%</td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{entry.administrative}%</td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{entry.physical}%</td>
                    <td className="px-5 py-3 text-center">
                      {idx === 0 ? (
                        <span className="text-xs text-gray-400">--</span>
                      ) : (
                        <span className={`text-sm font-medium flex items-center justify-center gap-1 ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : change < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                          {change > 0 ? '+' : ''}{change}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Milestones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Key Compliance Milestones
          </h3>
        </div>
        <div className="p-5">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            {[
              { date: 'Feb 2026', event: 'Overall score crossed 80% threshold', type: 'achievement' },
              { date: 'Jan 2026', event: 'HIPAA controls gap analysis completed', type: 'milestone' },
              { date: 'Dec 2025', event: 'SOC 2 Type II audit passed with no findings', type: 'achievement' },
              { date: 'Nov 2025', event: 'Implemented automated monitoring for 15 controls', type: 'improvement' },
              { date: 'Oct 2025', event: 'EU AI Act readiness assessment initiated', type: 'milestone' },
              { date: 'Sep 2025', event: 'ISO 27001 Stage 1 audit completed', type: 'milestone' },
            ].map((item, idx) => (
              <div key={idx} className="relative pl-10 pb-6 last:pb-0">
                <div className={`absolute left-2.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${
                  item.type === 'achievement' ? 'bg-green-500' :
                  item.type === 'improvement' ? 'bg-blue-500' : 'bg-indigo-500'
                }`} />
                <div className="text-xs text-gray-400 mb-0.5">{item.date}</div>
                <div className="text-sm text-gray-900 dark:text-white">{item.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Tab: Recommendations
  // ---------------------------------------------------------------------------
  const renderRecommendations = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Status:</span>
          {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setRecFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                recFilter === f
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}>
              {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Priority:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map(p => (
            <button key={p} onClick={() => setRecPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                recPriorityFilter === p
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}>
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Impact Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-6 h-6 text-green-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Potential Impact Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-green-600">
              +{RECOMMENDATIONS.filter(r => r.status === 'pending').reduce((a, r) => a + r.estimatedImpact, 0).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total pending impact (pts)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{RECOMMENDATIONS.filter(r => r.status === 'pending').length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pending recommendations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">{RECOMMENDATIONS.filter(r => r.status === 'in_progress').length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">In progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{RECOMMENDATIONS.filter(r => r.status === 'completed').length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
          </div>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-3">
        {filteredRecommendations.map(rec => (
          <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <button onClick={() => toggleRecExpanded(rec.id)} className="w-full px-5 py-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  rec.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                  rec.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  'bg-purple-100 dark:bg-purple-900/30'
                }`}>
                  {rec.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                   rec.status === 'in_progress' ? <RefreshCw className="w-5 h-5 text-blue-600" /> :
                   <Lightbulb className="w-5 h-5 text-purple-600" />}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{rec.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityStyles(rec.priority)}`}>{rec.priority}</span>
                    <span className="text-xs text-gray-400">{rec.category}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEffortStyles(rec.effort)}`}>{rec.effort} effort</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">+{rec.estimatedImpact} pts</div>
                  <div className="text-xs text-gray-400">{rec.timeToImplement}</div>
                </div>
                {expandedRecommendations.has(rec.id) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>
            {expandedRecommendations.has(rec.id) && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700 mt-1">
                <div className="pl-12 space-y-3 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{rec.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Affected Frameworks:</span>
                    {rec.affectedFrameworks.map((fw, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                        {fw}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <button className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
                      <Play className="w-3 h-3" /> Start Implementation
                    </button>
                    <button className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View Details
                    </button>
                    <button className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1">
                      <X className="w-3 h-3" /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Lightbulb className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No recommendations match the current filters.</p>
        </div>
      )}
    </div>
  );

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
                  <Gauge className="w-5 h-5 text-indigo-500" />
                  Compliance Score Forecasting
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered compliance trajectory analysis and scenario modeling</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                disabled={isExporting}>
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? 'Exporting...' : 'Export Report'}
              </button>
              <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" />
                Refresh Forecast
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
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'projections' && renderProjections()}
        {activeTab === 'whatif' && renderWhatIf()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'recommendations' && renderRecommendations()}
      </div>

      {/* Alert Configuration Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500" />
                Configure Alert Thresholds
              </h3>
              <button onClick={() => setShowAlertModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {alertThresholds.map(at => (
                <div key={at.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleAlertActive(at.id)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${at.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${at.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{at.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{at.framework}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {at.thresholdType === 'below' ? `< ${at.value}%` : `> ${at.value} pts drop`}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1">
                  <Bell className="w-4 h-4" /> Add New Alert Threshold
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setShowAlertModal(false)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button onClick={() => setShowAlertModal(false)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
