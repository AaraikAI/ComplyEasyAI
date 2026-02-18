import React, { useState, useEffect, useCallback } from 'react';
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
  Bell,
  GitBranch,
  Layers,
  Activity,
  ArrowRight,
  Zap,
  Users,
  Play,
  Pause,
  CheckSquare,
  XCircle,
  Info,
  Eye,
  Edit3,
  MoreVertical,
  History,
  Sparkles,
  BookOpen,
  Link2,
  Hash,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Circle,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface RegulatoryChange {
  id: string;
  title: string;
  source: string;
  publishDate: string;
  effectiveDate: string;
  jurisdiction: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-review' | 'remediation' | 'completed' | 'dismissed';
  summary: string;
  affectedFrameworks: string[];
  affectedControls: number;
  affectedPolicies: number;
  affectedProcedures: number;
  complianceImpact: { before: number; after: number };
  assignedTo?: string;
  rifScore: number;
}

interface RemediationTask {
  id: string;
  changeId: string;
  changeName: string;
  title: string;
  description: string;
  type: 'control-update' | 'policy-revision' | 'procedure-change' | 'training' | 'evidence-collection' | 'notification';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'review' | 'completed';
  assignee: string;
  dueDate: string;
  estimatedEffort: string;
  affectedItem: string;
  aiGenerated: boolean;
  completedDate?: string;
}

interface ImpactItem {
  id: string;
  name: string;
  type: 'control' | 'policy' | 'procedure';
  framework: string;
  currentStatus: string;
  impactLevel: 'direct' | 'indirect' | 'minimal';
  requiredAction: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  changeId: string;
  type: 'detection' | 'analysis' | 'remediation' | 'notification' | 'completion';
}

// ─── Demo Data ──────────────────────────────────────────────────────────────────

const REGULATORY_CHANGES: RegulatoryChange[] = [
  {
    id: 'RC-2026-001',
    title: 'EU AI Act - Article 6 High-Risk AI Classification Update',
    source: 'European Commission',
    publishDate: '2026-02-10',
    effectiveDate: '2026-08-01',
    jurisdiction: 'European Union',
    category: 'AI Regulation',
    severity: 'critical',
    status: 'remediation',
    summary: 'Updated classification criteria for high-risk AI systems under Annex III. New requirements for conformity assessments, technical documentation, and transparency obligations for AI systems used in critical infrastructure, education, and employment decisions.',
    affectedFrameworks: ['EU AI Act', 'ISO 27001', 'SOC 2'],
    affectedControls: 18,
    affectedPolicies: 5,
    affectedProcedures: 8,
    complianceImpact: { before: 82, after: 71 },
    assignedTo: 'Sarah Chen',
    rifScore: 94,
  },
  {
    id: 'RC-2026-002',
    title: 'NIST SP 800-53 Rev 6 Draft - Enhanced Supply Chain Controls',
    source: 'NIST',
    publishDate: '2026-01-28',
    effectiveDate: '2026-06-15',
    jurisdiction: 'United States',
    category: 'Security Controls',
    severity: 'high',
    status: 'in-review',
    summary: 'New supply chain risk management controls (SR-13 through SR-18) requiring enhanced vendor assessment, software bill of materials (SBOM) management, and continuous monitoring of third-party components.',
    affectedFrameworks: ['NIST 800-53', 'SOC 2', 'FedRAMP'],
    affectedControls: 12,
    affectedPolicies: 3,
    affectedProcedures: 6,
    complianceImpact: { before: 78, after: 68 },
    assignedTo: 'Mike Rodriguez',
    rifScore: 87,
  },
  {
    id: 'RC-2026-003',
    title: 'GDPR - Updated Data Transfer Mechanism Requirements',
    source: 'European Data Protection Board',
    publishDate: '2026-02-05',
    effectiveDate: '2026-05-01',
    jurisdiction: 'European Union',
    category: 'Data Protection',
    severity: 'high',
    status: 'pending',
    summary: 'Revised guidelines on international data transfers following the adequacy framework review. New requirements for Transfer Impact Assessments (TIAs) and supplementary measures for transfers to non-adequate countries.',
    affectedFrameworks: ['GDPR', 'ISO 27701'],
    affectedControls: 8,
    affectedPolicies: 4,
    affectedProcedures: 5,
    complianceImpact: { before: 85, after: 76 },
    rifScore: 82,
  },
  {
    id: 'RC-2026-004',
    title: 'SOC 2 TSC 2025 - Updated Availability Criteria',
    source: 'AICPA',
    publishDate: '2026-01-15',
    effectiveDate: '2026-04-01',
    jurisdiction: 'United States',
    category: 'Audit Standards',
    severity: 'medium',
    status: 'completed',
    summary: 'Revised availability trust service criteria with enhanced requirements for cloud service resilience, business continuity testing frequency, and disaster recovery documentation.',
    affectedFrameworks: ['SOC 2'],
    affectedControls: 6,
    affectedPolicies: 2,
    affectedProcedures: 4,
    complianceImpact: { before: 88, after: 84 },
    assignedTo: 'Alex Kim',
    rifScore: 65,
  },
  {
    id: 'RC-2026-005',
    title: 'HIPAA - Cybersecurity Performance Goals (CPGs)',
    source: 'HHS Office for Civil Rights',
    publishDate: '2026-02-12',
    effectiveDate: '2026-09-01',
    jurisdiction: 'United States',
    category: 'Healthcare Security',
    severity: 'critical',
    status: 'pending',
    summary: 'Mandatory cybersecurity performance goals for HIPAA-covered entities. Includes requirements for multifactor authentication, network segmentation, and enhanced audit logging for ePHI access.',
    affectedFrameworks: ['HIPAA', 'NIST 800-53'],
    affectedControls: 15,
    affectedPolicies: 6,
    affectedProcedures: 9,
    complianceImpact: { before: 74, after: 62 },
    rifScore: 91,
  },
  {
    id: 'RC-2026-006',
    title: 'PCI DSS v4.1 - Enhanced Authentication Requirements',
    source: 'PCI Security Standards Council',
    publishDate: '2026-01-20',
    effectiveDate: '2026-07-01',
    jurisdiction: 'Global',
    category: 'Payment Security',
    severity: 'medium',
    status: 'remediation',
    summary: 'Updated requirements for multi-factor authentication across all access to cardholder data environments, including phishing-resistant authentication methods and adaptive authentication risk scoring.',
    affectedFrameworks: ['PCI DSS'],
    affectedControls: 9,
    affectedPolicies: 2,
    affectedProcedures: 5,
    complianceImpact: { before: 80, after: 74 },
    assignedTo: 'Lisa Park',
    rifScore: 72,
  },
];

const REMEDIATION_TASKS: RemediationTask[] = [
  {
    id: 'RT-001',
    changeId: 'RC-2026-001',
    changeName: 'EU AI Act Update',
    title: 'Update AI System Risk Classification Matrix',
    description: 'Revise the AI system inventory to classify all systems per the updated Annex III criteria. Document conformity assessment requirements for newly classified high-risk systems.',
    type: 'control-update',
    priority: 'critical',
    status: 'in-progress',
    assignee: 'Sarah Chen',
    dueDate: '2026-03-15',
    estimatedEffort: '16 hours',
    affectedItem: 'AI-GOV-001: AI System Classification',
    aiGenerated: true,
  },
  {
    id: 'RT-002',
    changeId: 'RC-2026-001',
    changeName: 'EU AI Act Update',
    title: 'Develop Conformity Assessment Procedures',
    description: 'Create new conformity assessment procedures for high-risk AI systems including technical documentation requirements, quality management system updates, and post-market monitoring plans.',
    type: 'procedure-change',
    priority: 'critical',
    status: 'pending',
    assignee: 'Sarah Chen',
    dueDate: '2026-04-01',
    estimatedEffort: '24 hours',
    affectedItem: 'AI-GOV-003: Conformity Assessment',
    aiGenerated: true,
  },
  {
    id: 'RT-003',
    changeId: 'RC-2026-001',
    changeName: 'EU AI Act Update',
    title: 'Update Transparency Obligation Documentation',
    description: 'Revise transparency documentation for AI systems interacting with natural persons. Update user notification mechanisms and technical documentation for model explainability.',
    type: 'policy-revision',
    priority: 'high',
    status: 'pending',
    assignee: 'James Wilson',
    dueDate: '2026-03-30',
    estimatedEffort: '8 hours',
    affectedItem: 'AI-TRANS-002: Transparency Obligations',
    aiGenerated: true,
  },
  {
    id: 'RT-004',
    changeId: 'RC-2026-001',
    changeName: 'EU AI Act Update',
    title: 'Conduct AI Team Training on New Classifications',
    description: 'Develop and deliver training materials covering updated high-risk classifications, new conformity requirements, and transparency obligations under the amended EU AI Act.',
    type: 'training',
    priority: 'medium',
    status: 'pending',
    assignee: 'HR Department',
    dueDate: '2026-04-15',
    estimatedEffort: '12 hours',
    affectedItem: 'Training: EU AI Act Compliance',
    aiGenerated: true,
  },
  {
    id: 'RT-005',
    changeId: 'RC-2026-002',
    changeName: 'NIST SP 800-53 Rev 6',
    title: 'Implement SBOM Management Process',
    description: 'Establish a software bill of materials (SBOM) management process for all production systems. Include automated SBOM generation, vulnerability monitoring, and supplier notification workflows.',
    type: 'procedure-change',
    priority: 'high',
    status: 'in-progress',
    assignee: 'Mike Rodriguez',
    dueDate: '2026-03-20',
    estimatedEffort: '32 hours',
    affectedItem: 'SR-14: SBOM Management',
    aiGenerated: true,
  },
  {
    id: 'RT-006',
    changeId: 'RC-2026-002',
    changeName: 'NIST SP 800-53 Rev 6',
    title: 'Update Vendor Assessment Questionnaire',
    description: 'Add new supply chain security questions to the vendor risk assessment questionnaire covering SBOM disclosure, incident notification SLAs, and fourth-party risk management practices.',
    type: 'control-update',
    priority: 'high',
    status: 'pending',
    assignee: 'Mike Rodriguez',
    dueDate: '2026-03-25',
    estimatedEffort: '8 hours',
    affectedItem: 'SR-15: Vendor Supply Chain Assessment',
    aiGenerated: true,
  },
  {
    id: 'RT-007',
    changeId: 'RC-2026-002',
    changeName: 'NIST SP 800-53 Rev 6',
    title: 'Deploy Continuous Component Monitoring',
    description: 'Implement automated monitoring for third-party software components including CVE tracking, license compliance, and end-of-life detection for all dependencies.',
    type: 'control-update',
    priority: 'medium',
    status: 'pending',
    assignee: 'DevOps Team',
    dueDate: '2026-04-10',
    estimatedEffort: '40 hours',
    affectedItem: 'SR-16: Continuous Component Monitoring',
    aiGenerated: true,
  },
  {
    id: 'RT-008',
    changeId: 'RC-2026-006',
    changeName: 'PCI DSS v4.1',
    title: 'Implement Phishing-Resistant MFA for CDE Access',
    description: 'Deploy FIDO2/WebAuthn-based authentication for all users accessing the cardholder data environment. Migrate from SMS-based OTP to phishing-resistant methods.',
    type: 'control-update',
    priority: 'high',
    status: 'in-progress',
    assignee: 'Lisa Park',
    dueDate: '2026-04-01',
    estimatedEffort: '48 hours',
    affectedItem: 'PCI-AUTH-001: MFA for CDE',
    aiGenerated: true,
  },
  {
    id: 'RT-009',
    changeId: 'RC-2026-006',
    changeName: 'PCI DSS v4.1',
    title: 'Configure Adaptive Authentication Risk Scoring',
    description: 'Implement risk-based authentication scoring that evaluates device trust, geographic anomalies, and behavioral biometrics before granting access to payment processing systems.',
    type: 'procedure-change',
    priority: 'medium',
    status: 'pending',
    assignee: 'Lisa Park',
    dueDate: '2026-04-15',
    estimatedEffort: '24 hours',
    affectedItem: 'PCI-AUTH-003: Adaptive Authentication',
    aiGenerated: true,
  },
  {
    id: 'RT-010',
    changeId: 'RC-2026-003',
    changeName: 'GDPR Transfer Updates',
    title: 'Conduct Transfer Impact Assessments',
    description: 'Perform Transfer Impact Assessments (TIAs) for all international data transfers to non-adequate countries. Document supplementary measures and legal basis for each transfer.',
    type: 'evidence-collection',
    priority: 'high',
    status: 'pending',
    assignee: 'DPO Office',
    dueDate: '2026-04-01',
    estimatedEffort: '20 hours',
    affectedItem: 'GDPR-TRANSFER-001: International Transfers',
    aiGenerated: true,
  },
  {
    id: 'RT-011',
    changeId: 'RC-2026-004',
    changeName: 'SOC 2 TSC 2025',
    title: 'Update BCP Testing Schedule',
    description: 'Revise business continuity plan testing frequency from annual to semi-annual. Document testing results and improvement actions per updated availability criteria.',
    type: 'procedure-change',
    priority: 'medium',
    status: 'completed',
    assignee: 'Alex Kim',
    dueDate: '2026-02-28',
    estimatedEffort: '12 hours',
    affectedItem: 'A1.2: BCP Testing',
    aiGenerated: true,
    completedDate: '2026-02-14',
  },
  {
    id: 'RT-012',
    changeId: 'RC-2026-005',
    changeName: 'HIPAA CPGs',
    title: 'Notify Control Owners of New HIPAA Requirements',
    description: 'Send notifications to all HIPAA control owners regarding the new Cybersecurity Performance Goals. Include summary of changes, timeline, and required actions.',
    type: 'notification',
    priority: 'high',
    status: 'pending',
    assignee: 'Compliance Team',
    dueDate: '2026-03-01',
    estimatedEffort: '4 hours',
    affectedItem: 'Notification: HIPAA CPG Requirements',
    aiGenerated: true,
  },
];

const IMPACT_ITEMS: ImpactItem[] = [
  { id: 'IMP-001', name: 'AI-GOV-001: AI System Classification', type: 'control', framework: 'EU AI Act', currentStatus: 'Implemented', impactLevel: 'direct', requiredAction: 'Update classification criteria per Annex III changes' },
  { id: 'IMP-002', name: 'AI-GOV-003: Conformity Assessment', type: 'control', framework: 'EU AI Act', currentStatus: 'Partially Implemented', impactLevel: 'direct', requiredAction: 'Develop new conformity assessment procedures' },
  { id: 'IMP-003', name: 'AI-TRANS-002: Transparency Policy', type: 'policy', framework: 'EU AI Act', currentStatus: 'Approved', impactLevel: 'direct', requiredAction: 'Revise transparency obligations documentation' },
  { id: 'IMP-004', name: 'AI-MON-001: Post-Market Monitoring', type: 'procedure', framework: 'EU AI Act', currentStatus: 'Draft', impactLevel: 'direct', requiredAction: 'Implement post-market monitoring system' },
  { id: 'IMP-005', name: 'SR-14: Software Supply Chain', type: 'control', framework: 'NIST 800-53', currentStatus: 'Not Implemented', impactLevel: 'direct', requiredAction: 'New control - implement SBOM management' },
  { id: 'IMP-006', name: 'SR-15: Vendor Assessment', type: 'control', framework: 'NIST 800-53', currentStatus: 'Implemented', impactLevel: 'direct', requiredAction: 'Update assessment questionnaire with new criteria' },
  { id: 'IMP-007', name: 'A.15.1: Supplier Relationships', type: 'control', framework: 'ISO 27001', currentStatus: 'Implemented', impactLevel: 'indirect', requiredAction: 'Review alignment with updated supply chain controls' },
  { id: 'IMP-008', name: 'CC6.1: Logical Access', type: 'control', framework: 'SOC 2', currentStatus: 'Implemented', impactLevel: 'indirect', requiredAction: 'Verify MFA coverage includes new requirements' },
  { id: 'IMP-009', name: 'Data Transfer Policy', type: 'policy', framework: 'GDPR', currentStatus: 'Approved', impactLevel: 'direct', requiredAction: 'Add TIA requirements and supplementary measures' },
  { id: 'IMP-010', name: 'Incident Response Plan', type: 'procedure', framework: 'HIPAA', currentStatus: 'Approved', impactLevel: 'indirect', requiredAction: 'Update to include CPG incident response metrics' },
  { id: 'IMP-011', name: 'Access Control Policy', type: 'policy', framework: 'PCI DSS', currentStatus: 'Approved', impactLevel: 'direct', requiredAction: 'Update MFA requirements for phishing-resistant methods' },
  { id: 'IMP-012', name: 'Network Segmentation Procedure', type: 'procedure', framework: 'HIPAA', currentStatus: 'Implemented', impactLevel: 'direct', requiredAction: 'Enhance segmentation per CPG requirements' },
];

const AUDIT_LOG: AuditLogEntry[] = [
  { id: 'AL-001', timestamp: '2026-02-17T09:30:00Z', action: 'Regulatory change detected', actor: 'RIF Engine', details: 'EU AI Act Article 6 update detected from European Commission feed', changeId: 'RC-2026-001', type: 'detection' },
  { id: 'AL-002', timestamp: '2026-02-17T09:31:00Z', action: 'Impact analysis started', actor: 'AI Analysis Engine', details: 'Automated impact analysis initiated for RC-2026-001. Scanning 4 frameworks, 156 controls.', changeId: 'RC-2026-001', type: 'analysis' },
  { id: 'AL-003', timestamp: '2026-02-17T09:33:00Z', action: 'Impact analysis completed', actor: 'AI Analysis Engine', details: 'Found 18 affected controls, 5 policies, 8 procedures across EU AI Act, ISO 27001, SOC 2', changeId: 'RC-2026-001', type: 'analysis' },
  { id: 'AL-004', timestamp: '2026-02-17T09:34:00Z', action: 'Remediation tasks generated', actor: 'AI Remediation Engine', details: '4 AI-generated remediation tasks created with priority assignments and timeline estimates', changeId: 'RC-2026-001', type: 'remediation' },
  { id: 'AL-005', timestamp: '2026-02-17T09:35:00Z', action: 'Notification sent', actor: 'Notification Service', details: 'Alert sent to Sarah Chen (Control Owner), James Wilson (Policy Owner), Compliance Team', changeId: 'RC-2026-001', type: 'notification' },
  { id: 'AL-006', timestamp: '2026-02-15T14:00:00Z', action: 'Remediation task completed', actor: 'Alex Kim', details: 'BCP Testing Schedule update completed. Evidence uploaded and verified.', changeId: 'RC-2026-004', type: 'completion' },
  { id: 'AL-007', timestamp: '2026-02-12T10:15:00Z', action: 'Regulatory change detected', actor: 'RIF Engine', details: 'HIPAA Cybersecurity Performance Goals detected from HHS OCR feed', changeId: 'RC-2026-005', type: 'detection' },
  { id: 'AL-008', timestamp: '2026-02-12T10:17:00Z', action: 'Impact analysis completed', actor: 'AI Analysis Engine', details: 'Found 15 affected controls, 6 policies, 9 procedures across HIPAA, NIST 800-53', changeId: 'RC-2026-005', type: 'analysis' },
  { id: 'AL-009', timestamp: '2026-02-10T08:00:00Z', action: 'Regulatory change detected', actor: 'RIF Engine', details: 'GDPR data transfer mechanism updates detected from EDPB publications', changeId: 'RC-2026-003', type: 'detection' },
  { id: 'AL-010', timestamp: '2026-02-05T11:30:00Z', action: 'Remediation started', actor: 'Lisa Park', details: 'Phishing-resistant MFA implementation started for PCI DSS v4.1 compliance', changeId: 'RC-2026-006', type: 'remediation' },
  { id: 'AL-011', timestamp: '2026-01-28T09:00:00Z', action: 'Regulatory change detected', actor: 'RIF Engine', details: 'NIST SP 800-53 Rev 6 Draft published with enhanced supply chain controls', changeId: 'RC-2026-002', type: 'detection' },
  { id: 'AL-012', timestamp: '2026-01-20T16:00:00Z', action: 'Impact analysis completed', actor: 'AI Analysis Engine', details: 'PCI DSS v4.1 analysis complete. 9 controls, 2 policies, 5 procedures affected.', changeId: 'RC-2026-006', type: 'analysis' },
];

// ─── Helper Components ──────────────────────────────────────────────────────────

const SeverityBadge: React.FC<{ severity: RegulatoryChange['severity'] }> = ({ severity }) => {
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

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'pending': 'bg-gray-100 text-gray-700 border-gray-200',
    'in-review': 'bg-blue-100 text-blue-700 border-blue-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
    'remediation': 'bg-purple-100 text-purple-700 border-purple-200',
    'review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'completed': 'bg-green-100 text-green-700 border-green-200',
    'dismissed': 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const labels: Record<string, string> = {
    'pending': 'Pending Review',
    'in-review': 'In Review',
    'in-progress': 'In Progress',
    'remediation': 'Remediation',
    'review': 'Under Review',
    'completed': 'Completed',
    'dismissed': 'Dismissed',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[status] || styles['pending']}`}>
      {labels[status] || status}
    </span>
  );
};

const TaskTypeBadge: React.FC<{ type: RemediationTask['type'] }> = ({ type }) => {
  const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
    'control-update': { bg: 'bg-blue-100 text-blue-700', icon: <Shield size={10} /> },
    'policy-revision': { bg: 'bg-purple-100 text-purple-700', icon: <FileText size={10} /> },
    'procedure-change': { bg: 'bg-teal-100 text-teal-700', icon: <GitBranch size={10} /> },
    'training': { bg: 'bg-green-100 text-green-700', icon: <BookOpen size={10} /> },
    'evidence-collection': { bg: 'bg-orange-100 text-orange-700', icon: <CheckSquare size={10} /> },
    'notification': { bg: 'bg-yellow-100 text-yellow-700', icon: <Bell size={10} /> },
  };
  const labels: Record<string, string> = {
    'control-update': 'Control Update',
    'policy-revision': 'Policy Revision',
    'procedure-change': 'Procedure Change',
    'training': 'Training',
    'evidence-collection': 'Evidence Collection',
    'notification': 'Notification',
  };
  const style = styles[type] || { bg: 'bg-gray-100 text-gray-700', icon: <Circle size={10} /> };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${style.bg}`}>
      {style.icon}
      {labels[type] || type}
    </span>
  );
};

const ComplianceScoreProjection: React.FC<{ before: number; after: number }> = ({ before, after }) => {
  const diff = after - before;
  const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600';
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <p className="text-xs text-gray-500">Before</p>
        <p className="text-lg font-bold text-gray-700">{before}%</p>
      </div>
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon size={16} />
        <span className="text-sm font-bold">{Math.abs(diff)}%</span>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500">Projected</p>
        <p className={`text-lg font-bold ${after >= 80 ? 'text-green-600' : after >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{after}%</p>
      </div>
    </div>
  );
};

const RIFScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? 'bg-red-100 text-red-700' : score >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';
  return (
    <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      <Activity size={10} />
      RIF: {score}
    </div>
  );
};

const AuditLogIcon: React.FC<{ type: AuditLogEntry['type'] }> = ({ type }) => {
  switch (type) {
    case 'detection': return <Search size={14} className="text-blue-500" />;
    case 'analysis': return <Sparkles size={14} className="text-purple-500" />;
    case 'remediation': return <Zap size={14} className="text-orange-500" />;
    case 'notification': return <Bell size={14} className="text-yellow-500" />;
    case 'completion': return <CheckCircle2 size={14} className="text-green-500" />;
    default: return <Circle size={14} className="text-gray-400" />;
  }
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export const RegulatoryAutoRemediation: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'remediation' | 'impact' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedChange, setExpandedChange] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [selectedChange, setSelectedChange] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [impactTypeFilter, setImpactTypeFilter] = useState<string>('all');
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');

  // Summary stats
  const pendingCount = REGULATORY_CHANGES.filter(c => c.status === 'pending').length;
  const remediationCount = REGULATORY_CHANGES.filter(c => c.status === 'remediation' || c.status === 'in-review').length;
  const completedCount = REGULATORY_CHANGES.filter(c => c.status === 'completed').length;
  const totalTasks = REMEDIATION_TASKS.length;
  const completedTasks = REMEDIATION_TASKS.filter(t => t.status === 'completed').length;
  const criticalChanges = REGULATORY_CHANGES.filter(c => c.severity === 'critical' && c.status !== 'completed').length;

  const filteredChanges = REGULATORY_CHANGES.filter(change => {
    if (searchQuery && !change.title.toLowerCase().includes(searchQuery.toLowerCase()) && !change.source.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (severityFilter !== 'all' && change.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && change.status !== statusFilter) return false;
    return true;
  });

  const filteredTasks = REMEDIATION_TASKS.filter(task => {
    if (selectedChange && task.changeId !== selectedChange) return false;
    if (taskStatusFilter !== 'all' && task.status !== taskStatusFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredImpactItems = IMPACT_ITEMS.filter(item => {
    if (impactTypeFilter !== 'all' && item.type !== impactTypeFilter) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredLogs = AUDIT_LOG.filter(log => {
    if (logTypeFilter !== 'all' && log.type !== logTypeFilter) return false;
    if (selectedChange && log.changeId !== selectedChange) return false;
    return true;
  });

  const [aiError, setAiError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<{ summary: string; quickWins: string[]; timeline: string } | null>(null);

  const handleRunAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAiError(null);

    try {
      // Build gaps from current regulatory changes that need remediation
      const gaps = REGULATORY_CHANGES
        .filter(c => c.status === 'pending' || c.status === 'in-review' || c.status === 'remediation')
        .map(c => ({
          controlId: c.id,
          title: c.title,
          currentStatus: c.status,
          requirement: `${c.source} - ${c.summary} (Effective: ${c.effectiveDate})`,
        }));

      if (gaps.length === 0) {
        setAiError('No pending regulatory changes to analyze.');
        setIsAnalyzing(false);
        return;
      }

      const result = await api.ai.autoRemediation(
        'Multi-Framework',
        gaps,
        'Enterprise compliance organization with active SOC 2, GDPR, ISO 27001, and EU regulatory obligations'
      );

      setAiInsights({
        summary: result.summary || 'Analysis complete.',
        quickWins: result.quickWins || [],
        timeline: result.totalEstimatedTimeline || 'Unknown',
      });
    } catch (error: any) {
      console.error('Auto-remediation analysis error:', error);
      setAiError(error?.message || 'Failed to run AI analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    const exportData = {
      regulatoryChanges: REGULATORY_CHANGES,
      remediationTasks: REMEDIATION_TASKS,
      impactItems: IMPACT_ITEMS,
      auditLog: AUDIT_LOG,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regulatory-remediation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const tabs = [
    { key: 'pending', label: 'Pending Changes', icon: <AlertCircle size={16} />, count: pendingCount },
    { key: 'remediation', label: 'Remediation Queue', icon: <Zap size={16} />, count: totalTasks - completedTasks },
    { key: 'impact', label: 'Impact Analysis', icon: <GitBranch size={16} />, count: IMPACT_ITEMS.length },
    { key: 'history', label: 'History', icon: <History size={16} />, count: AUDIT_LOG.length },
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
            <h2 className="text-2xl font-bold text-gray-900">Regulatory Change Auto-Remediation</h2>
            <p className="text-sm text-gray-500 mt-0.5">AI-powered regulatory change detection, impact analysis, and remediation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Scan for Changes
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Pending Review</span>
            <AlertCircle size={18} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          <p className="text-xs text-gray-400 mt-1">regulatory changes detected</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Critical Alerts</span>
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalChanges}</p>
          <p className="text-xs text-gray-400 mt-1">requiring immediate action</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Active Remediations</span>
            <Zap size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalTasks - completedTasks}</p>
          <p className="text-xs text-gray-400 mt-1">of {totalTasks} total tasks</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Completed</span>
            <CheckCircle2 size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          <p className="text-xs text-gray-400 mt-1">changes fully remediated</p>
        </div>
      </div>

      {/* Tab Bar */}
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
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === 'pending' ? 'regulatory changes' : activeTab === 'remediation' ? 'tasks' : activeTab === 'impact' ? 'affected items' : 'audit log'}...`}
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
              {activeTab === 'pending' && (
                <>
                  <select
                    value={severityFilter}
                    onChange={e => setSeverityFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-review">In Review</option>
                    <option value="remediation">Remediation</option>
                    <option value="completed">Completed</option>
                  </select>
                </>
              )}
              {activeTab === 'remediation' && (
                <>
                  <select
                    value={taskStatusFilter}
                    onChange={e => setTaskStatusFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Under Review</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={selectedChange || ''}
                    onChange={e => setSelectedChange(e.target.value || null)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Changes</option>
                    {REGULATORY_CHANGES.map(c => (
                      <option key={c.id} value={c.id}>{c.id}: {c.title.substring(0, 40)}...</option>
                    ))}
                  </select>
                </>
              )}
              {activeTab === 'impact' && (
                <select
                  value={impactTypeFilter}
                  onChange={e => setImpactTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Types</option>
                  <option value="control">Controls</option>
                  <option value="policy">Policies</option>
                  <option value="procedure">Procedures</option>
                </select>
              )}
              {activeTab === 'history' && (
                <select
                  value={logTypeFilter}
                  onChange={e => setLogTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Types</option>
                  <option value="detection">Detection</option>
                  <option value="analysis">Analysis</option>
                  <option value="remediation">Remediation</option>
                  <option value="notification">Notification</option>
                  <option value="completion">Completion</option>
                </select>
              )}
            </div>
          )}
        </div>

        {/* ─── Pending Changes Tab ──────────────────────────────── */}
        {activeTab === 'pending' && (
          <div className="p-4 space-y-3">
            {filteredChanges.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No matching regulatory changes found</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search query</p>
              </div>
            )}
            {filteredChanges.map(change => (
              <div
                key={change.id}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  change.severity === 'critical' ? 'border-red-200 bg-red-50/30' :
                  change.severity === 'high' ? 'border-orange-200 bg-orange-50/20' :
                  'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => setExpandedChange(expandedChange === change.id ? null : change.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">{change.id}</span>
                        <SeverityBadge severity={change.severity} />
                        <StatusBadge status={change.status} />
                        <RIFScoreBadge score={change.rifScore} />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">{change.title}</h4>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FileText size={10} />{change.source}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} />Published: {new Date(change.publishDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />Effective: {new Date(change.effectiveDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {expandedChange === change.id ? <ChevronUp size={16} className="text-gray-400 ml-2" /> : <ChevronDown size={16} className="text-gray-400 ml-2" />}
                  </div>
                </button>

                {expandedChange === change.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{change.summary}</p>

                    {/* Impact Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{change.affectedControls}</p>
                        <p className="text-xs text-gray-500">Controls Affected</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{change.affectedPolicies}</p>
                        <p className="text-xs text-gray-500">Policies Affected</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{change.affectedProcedures}</p>
                        <p className="text-xs text-gray-500">Procedures Affected</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <ComplianceScoreProjection before={change.complianceImpact.before} after={change.complianceImpact.after} />
                      </div>
                    </div>

                    {/* Affected Frameworks */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Affected Frameworks:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {change.affectedFrameworks.map(fw => (
                          <span key={fw} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-medium rounded-full border border-brand-200">{fw}</span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => { setActiveTab('remediation'); setSelectedChange(change.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors"
                      >
                        <Zap size={12} />
                        View Remediation Tasks
                      </button>
                      <button
                        onClick={() => { setActiveTab('impact'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <GitBranch size={12} />
                        Impact Analysis
                      </button>
                      {change.assignedTo && (
                        <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
                          <Users size={12} />
                          Assigned to: <span className="font-medium">{change.assignedTo}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Remediation Queue Tab ────────────────────────────── */}
        {activeTab === 'remediation' && (
          <div className="p-4 space-y-3">
            {selectedChange && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-brand-50 rounded-lg border border-brand-200">
                <Filter size={14} className="text-brand-600" />
                <span className="text-xs text-brand-700 font-medium">
                  Filtered by: {REGULATORY_CHANGES.find(c => c.id === selectedChange)?.title.substring(0, 50)}...
                </span>
                <button onClick={() => setSelectedChange(null)} className="ml-auto text-brand-600 hover:text-brand-700">
                  <XCircle size={14} />
                </button>
              </div>
            )}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No matching remediation tasks</p>
                <p className="text-xs text-gray-500 mt-1">All tasks are completed or filters are too restrictive</p>
              </div>
            )}

            {filteredTasks.map(task => (
              <div
                key={task.id}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  task.status === 'completed' ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">{task.id}</span>
                        <SeverityBadge severity={task.priority} />
                        <StatusBadge status={task.status} />
                        <TaskTypeBadge type={task.type} />
                        {task.aiGenerated && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                            <Sparkles size={10} />
                            AI Generated
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Hash size={10} />{task.changeName}</span>
                        <span className="flex items-center gap-1"><Users size={10} />{task.assignee}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} />Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{task.estimatedEffort}</span>
                      </div>
                    </div>
                    {expandedTask === task.id ? <ChevronUp size={16} className="text-gray-400 ml-2" /> : <ChevronDown size={16} className="text-gray-400 ml-2" />}
                  </div>
                </button>

                {expandedTask === task.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{task.description}</p>
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-500">Affected Item:</p>
                      <p className="text-sm text-gray-700 font-medium mt-0.5">{task.affectedItem}</p>
                    </div>
                    {task.completedDate && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle2 size={12} />
                        Completed on {new Date(task.completedDate).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      {task.status !== 'completed' && (
                        <>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
                            <Play size={12} />
                            Start Task
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            <Edit3 size={12} />
                            Edit
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            <Users size={12} />
                            Reassign
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Impact Analysis Tab ──────────────────────────────── */}
        {activeTab === 'impact' && (
          <div className="p-4 space-y-4">
            {/* Impact Blast Radius Visualization */}
            <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target size={16} className="text-orange-600" />
                Impact Blast Radius
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-100 border-4 border-red-300 flex items-center justify-center mb-2">
                    <div>
                      <p className="text-xl font-bold text-red-700">{IMPACT_ITEMS.filter(i => i.impactLevel === 'direct').length}</p>
                      <p className="text-xs text-red-600 -mt-0.5">Direct</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Immediate changes required</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center mb-2">
                    <div>
                      <p className="text-xl font-bold text-orange-700">{IMPACT_ITEMS.filter(i => i.impactLevel === 'indirect').length}</p>
                      <p className="text-xs text-orange-600 -mt-0.5">Indirect</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Review and potential updates</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 border-4 border-yellow-300 flex items-center justify-center mb-2">
                    <div>
                      <p className="text-xl font-bold text-yellow-700">{IMPACT_ITEMS.filter(i => i.impactLevel === 'minimal').length}</p>
                      <p className="text-xs text-yellow-600 -mt-0.5">Minimal</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Low or no changes expected</p>
                </div>
              </div>
            </div>

            {/* Before/After Score Projections */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-600" />
                Compliance Score Projections (Before/After Remediation)
              </h4>
              <div className="space-y-3">
                {REGULATORY_CHANGES.filter(c => c.status !== 'completed').map(change => (
                  <div key={change.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{change.title.substring(0, 50)}...</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <SeverityBadge severity={change.severity} />
                        <span className="text-xs text-gray-400">{change.id}</span>
                      </div>
                    </div>
                    <ComplianceScoreProjection before={change.complianceImpact.before} after={change.complianceImpact.after} />
                  </div>
                ))}
              </div>
            </div>

            {/* Affected Items */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Layers size={16} className="text-brand-600" />
                  Affected Controls, Policies & Procedures ({filteredImpactItems.length})
                </h4>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredImpactItems.map(item => (
                  <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            item.type === 'control' ? 'bg-blue-100 text-blue-700' :
                            item.type === 'policy' ? 'bg-purple-100 text-purple-700' :
                            'bg-teal-100 text-teal-700'
                          }`}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            item.impactLevel === 'direct' ? 'bg-red-100 text-red-700' :
                            item.impactLevel === 'indirect' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.impactLevel.charAt(0).toUpperCase() + item.impactLevel.slice(1)} Impact
                          </span>
                          <span className="text-xs text-gray-400">{item.framework}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.requiredAction}</p>
                      </div>
                      <div className="ml-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.currentStatus === 'Implemented' ? 'bg-green-100 text-green-700' :
                          item.currentStatus === 'Approved' ? 'bg-blue-100 text-blue-700' :
                          item.currentStatus === 'Partially Implemented' ? 'bg-yellow-100 text-yellow-700' :
                          item.currentStatus === 'Draft' ? 'bg-gray-100 text-gray-600' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.currentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── History Tab ──────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="p-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {filteredLogs.map(log => (
                  <div key={log.id} className="relative flex items-start gap-3 pl-0">
                    {/* Timeline dot */}
                    <div className="relative z-10 w-9 h-9 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                      <AuditLogIcon type={log.type} />
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900">{log.action}</span>
                        <span className="text-xs text-gray-400 font-mono">{log.changeId}</span>
                      </div>
                      <p className="text-sm text-gray-600">{log.details}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Users size={10} />{log.actor}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <History size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No audit log entries found</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIF Integration Note */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-900">Regulatory Intelligence Fabric (RIF) Active</h4>
            <p className="text-xs text-purple-700 mt-0.5">
              Continuously monitoring 47 regulatory sources across 12 jurisdictions. Last scan: {new Date().toLocaleString()}.
              RIF scores reflect the urgency and relevance of each change to your compliance posture.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-purple-600 flex items-center gap-1"><CheckCircle2 size={10} />47 sources active</span>
              <span className="text-xs text-purple-600 flex items-center gap-1"><Globe size={10} />12 jurisdictions</span>
              <span className="text-xs text-purple-600 flex items-center gap-1"><RefreshCw size={10} />Real-time scanning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Globe icon isn't imported from lucide, define inline
const Globe: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
