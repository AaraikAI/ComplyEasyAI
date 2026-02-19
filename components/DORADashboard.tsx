/**
 * DORA (Digital Operational Resilience Act) Compliance Dashboard
 *
 * Comprehensive management interface for DORA compliance:
 * - ICT risk management framework (Article 6-16)
 * - ICT-related incident reporting (Article 17-23)
 * - Digital operational resilience testing (Article 24-27)
 * - Third-party ICT service provider risk management (Article 28-44)
 * - Compliance overview with key metrics and scoring
 *
 * Reference: Regulation (EU) 2022/2554
 */
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Shield, CheckCircle, AlertTriangle, XCircle, Search, Plus, X,
  FileText, Clock, BarChart3, ChevronRight, Edit3, Trash2, Eye, Download,
  AlertCircle, Filter, Calendar, Activity, TrendingUp, Lock, Server,
  Globe, Wifi, Database, Bug, RefreshCw, Users, Building2, Zap
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'ict_risk' | 'incidents' | 'third_party' | 'resilience_testing';

type RiskCategory = 'Cyber' | 'Infrastructure' | 'Software' | 'Cloud' | 'Data';
type Likelihood = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
type Impact = 'Negligible' | 'Minor' | 'Moderate' | 'Major' | 'Severe';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type MitigationStatus = 'Not Started' | 'In Progress' | 'Implemented' | 'Verified';

type IncidentType = 'Cyber Attack' | 'System Failure' | 'Data Breach' | 'Third-Party Outage';
type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
type IncidentStatus = 'Open' | 'Investigating' | 'Resolved' | 'Reported to Authority';
type NotificationStatus = 'Not Required' | 'Pending' | 'Initial Sent' | 'Intermediate Sent' | 'Final Sent';

type Criticality = 'Critical' | 'Important' | 'Standard';
type ContractStatus = 'Active' | 'Under Review' | 'Renewal Pending' | 'Expired';
type ConcentrationRisk = 'Low' | 'Medium' | 'High';

type TestType = 'TLPT' | 'Scenario' | 'Vulnerability Scan' | 'Penetration Test';
type TestResult = 'Pass' | 'Fail' | 'Partial';

interface ICTRisk {
  id: string;
  riskId: string;
  title: string;
  category: RiskCategory;
  description: string;
  likelihood: Likelihood;
  impact: Impact;
  riskLevel: RiskLevel;
  mitigationStatus: MitigationStatus;
  owner: string;
  reviewDate: string;
}

interface ICTIncident {
  id: string;
  incidentId: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  affectedServices: string[];
  detectionTime: string;
  resolutionTime: string | null;
  status: IncidentStatus;
  notificationStatus: NotificationStatus;
  description: string;
  rootCause: string;
}

interface ThirdPartyProvider {
  id: string;
  providerName: string;
  serviceType: string;
  criticality: Criticality;
  contractStatus: ContractStatus;
  exitStrategyExists: boolean;
  concentrationRisk: ConcentrationRisk;
  lastAssessmentDate: string;
  nextReview: string;
  country: string;
  subcontractors: number;
}

interface ResilienceTest {
  id: string;
  testName: string;
  type: TestType;
  scope: string;
  lastExecuted: string;
  result: TestResult;
  nextScheduled: string;
  findingsCount: number;
  description: string;
  testedBy: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────

const MOCK_ICT_RISKS: ICTRisk[] = [
  { id: '1', riskId: 'ICT-R-001', title: 'Ransomware Attack on Core Banking', category: 'Cyber', description: 'Risk of ransomware encrypting critical banking infrastructure and customer data', likelihood: 'Medium', impact: 'Severe', riskLevel: 'Critical', mitigationStatus: 'Implemented', owner: 'CISO', reviewDate: '2026-03-15' },
  { id: '2', riskId: 'ICT-R-002', title: 'Cloud Provider Service Disruption', category: 'Cloud', description: 'Major outage at primary cloud provider affecting trading platform availability', likelihood: 'Low', impact: 'Major', riskLevel: 'High', mitigationStatus: 'Implemented', owner: 'Head of Infrastructure', reviewDate: '2026-04-01' },
  { id: '3', riskId: 'ICT-R-003', title: 'Legacy Core Banking System Failure', category: 'Infrastructure', description: 'End-of-life mainframe system supporting payment processing at risk of hardware failure', likelihood: 'High', impact: 'Severe', riskLevel: 'Critical', mitigationStatus: 'In Progress', owner: 'CTO', reviewDate: '2026-02-28' },
  { id: '4', riskId: 'ICT-R-004', title: 'API Gateway Vulnerability Exploitation', category: 'Software', description: 'Unpatched vulnerabilities in API gateway exposing customer account data', likelihood: 'Medium', impact: 'Major', riskLevel: 'High', mitigationStatus: 'In Progress', owner: 'Application Security Lead', reviewDate: '2026-03-10' },
  { id: '5', riskId: 'ICT-R-005', title: 'Database Corruption in Trade Repository', category: 'Data', description: 'Data integrity risk in regulatory trade reporting database due to concurrent write conflicts', likelihood: 'Low', impact: 'Moderate', riskLevel: 'Medium', mitigationStatus: 'Verified', owner: 'Head of Data Engineering', reviewDate: '2026-05-01' },
  { id: '6', riskId: 'ICT-R-006', title: 'DDoS Attack on Online Banking Portal', category: 'Cyber', description: 'Distributed denial-of-service attack disrupting customer access to online banking services', likelihood: 'High', impact: 'Moderate', riskLevel: 'High', mitigationStatus: 'Implemented', owner: 'CISO', reviewDate: '2026-03-20' },
  { id: '7', riskId: 'ICT-R-007', title: 'SaaS Vendor Data Leakage', category: 'Cloud', description: 'Misconfigured SaaS platform allowing unauthorized access to employee and client PII', likelihood: 'Medium', impact: 'Major', riskLevel: 'High', mitigationStatus: 'In Progress', owner: 'Vendor Risk Manager', reviewDate: '2026-04-15' },
  { id: '8', riskId: 'ICT-R-008', title: 'Network Segmentation Bypass', category: 'Infrastructure', description: 'Insufficient network segmentation between DMZ and internal trading systems', likelihood: 'Low', impact: 'Major', riskLevel: 'Medium', mitigationStatus: 'Not Started', owner: 'Network Security Engineer', reviewDate: '2026-03-30' },
];

const MOCK_INCIDENTS: ICTIncident[] = [
  { id: '1', incidentId: 'INC-2026-001', title: 'Phishing Campaign Targeting Treasury Staff', type: 'Cyber Attack', severity: 'High', affectedServices: ['Email', 'Treasury Management System'], detectionTime: '2026-01-15T08:30:00', resolutionTime: '2026-01-15T14:45:00', status: 'Reported to Authority', notificationStatus: 'Final Sent', description: 'Targeted spear-phishing emails sent to 12 treasury staff with credential harvesting links', rootCause: 'Sophisticated social engineering bypassing email filters' },
  { id: '2', incidentId: 'INC-2026-002', title: 'Payment Processing System Outage', type: 'System Failure', severity: 'Critical', affectedServices: ['SEPA Payments', 'SWIFT Gateway', 'Instant Payments'], detectionTime: '2026-01-22T06:15:00', resolutionTime: '2026-01-22T11:30:00', status: 'Reported to Authority', notificationStatus: 'Final Sent', description: 'Complete payment processing failure affecting all outbound payment channels for 5 hours', rootCause: 'Database failover mechanism failed during scheduled maintenance window' },
  { id: '3', incidentId: 'INC-2026-003', title: 'Customer Data Exposure via API', type: 'Data Breach', severity: 'High', affectedServices: ['Mobile Banking API', 'Open Banking Platform'], detectionTime: '2026-02-03T11:20:00', resolutionTime: '2026-02-03T16:00:00', status: 'Resolved', notificationStatus: 'Intermediate Sent', description: 'API endpoint returned customer account details without proper authentication for 2 hours', rootCause: 'Deployment error removed authentication middleware from production endpoint' },
  { id: '4', incidentId: 'INC-2026-004', title: 'Market Data Provider Outage', type: 'Third-Party Outage', severity: 'Medium', affectedServices: ['Trading Platform', 'Risk Engine'], detectionTime: '2026-02-08T09:00:00', resolutionTime: '2026-02-08T12:30:00', status: 'Resolved', notificationStatus: 'Not Required', description: 'Primary market data feed provider experienced 3.5 hour outage during trading hours', rootCause: 'Provider infrastructure failure in primary data center' },
  { id: '5', incidentId: 'INC-2026-005', title: 'Credential Stuffing on Client Portal', type: 'Cyber Attack', severity: 'Medium', affectedServices: ['Client Portal', 'Authentication Service'], detectionTime: '2026-02-12T03:45:00', resolutionTime: '2026-02-12T07:00:00', status: 'Resolved', notificationStatus: 'Not Required', description: 'Automated credential stuffing attack detected against client-facing authentication service', rootCause: 'Compromised credentials from third-party breach used in attack' },
  { id: '6', incidentId: 'INC-2026-006', title: 'KYC System Unavailability', type: 'System Failure', severity: 'Low', affectedServices: ['KYC/AML Platform'], detectionTime: '2026-02-17T14:00:00', resolutionTime: null, status: 'Investigating', notificationStatus: 'Pending', description: 'Intermittent failures in KYC verification service affecting new client onboarding', rootCause: 'Under investigation - suspected memory leak in microservice' },
];

const MOCK_PROVIDERS: ThirdPartyProvider[] = [
  { id: '1', providerName: 'CloudFirst Financial Services', serviceType: 'Core Banking Platform (IaaS)', criticality: 'Critical', contractStatus: 'Active', exitStrategyExists: true, concentrationRisk: 'High', lastAssessmentDate: '2025-11-15', nextReview: '2026-05-15', country: 'Germany', subcontractors: 3 },
  { id: '2', providerName: 'SecureNet Solutions', serviceType: 'Cybersecurity SOC (MDR)', criticality: 'Critical', contractStatus: 'Active', exitStrategyExists: true, concentrationRisk: 'Medium', lastAssessmentDate: '2025-12-01', nextReview: '2026-06-01', country: 'Ireland', subcontractors: 1 },
  { id: '3', providerName: 'DataVault Analytics', serviceType: 'Data Warehousing & Analytics', criticality: 'Important', contractStatus: 'Active', exitStrategyExists: true, concentrationRisk: 'Low', lastAssessmentDate: '2025-10-20', nextReview: '2026-04-20', country: 'Netherlands', subcontractors: 2 },
  { id: '4', providerName: 'SwiftComm Networks', serviceType: 'Network Infrastructure (MPLS/SD-WAN)', criticality: 'Critical', contractStatus: 'Renewal Pending', exitStrategyExists: true, concentrationRisk: 'High', lastAssessmentDate: '2025-09-30', nextReview: '2026-03-30', country: 'France', subcontractors: 4 },
  { id: '5', providerName: 'RegTech Compliance Hub', serviceType: 'Regulatory Reporting (SaaS)', criticality: 'Important', contractStatus: 'Active', exitStrategyExists: false, concentrationRisk: 'Medium', lastAssessmentDate: '2025-11-01', nextReview: '2026-05-01', country: 'Luxembourg', subcontractors: 0 },
  { id: '6', providerName: 'PayBridge International', serviceType: 'Payment Processing Gateway', criticality: 'Critical', contractStatus: 'Active', exitStrategyExists: true, concentrationRisk: 'High', lastAssessmentDate: '2026-01-10', nextReview: '2026-07-10', country: 'Belgium', subcontractors: 2 },
  { id: '7', providerName: 'IdentityFirst Ltd', serviceType: 'KYC/AML Verification Service', criticality: 'Important', contractStatus: 'Under Review', exitStrategyExists: true, concentrationRisk: 'Low', lastAssessmentDate: '2025-12-15', nextReview: '2026-06-15', country: 'United Kingdom', subcontractors: 1 },
  { id: '8', providerName: 'MarketStream Global', serviceType: 'Market Data Feed Provider', criticality: 'Standard', contractStatus: 'Active', exitStrategyExists: false, concentrationRisk: 'Low', lastAssessmentDate: '2025-08-20', nextReview: '2026-02-20', country: 'United States', subcontractors: 0 },
];

const MOCK_TESTS: ResilienceTest[] = [
  { id: '1', testName: 'TLPT Red Team Exercise - Core Banking', type: 'TLPT', scope: 'Core banking infrastructure, payment systems, SWIFT interface', lastExecuted: '2025-11-20', result: 'Partial', nextScheduled: '2026-11-20', findingsCount: 7, description: 'Threat-Led Penetration Test per TIBER-EU framework targeting critical financial infrastructure', testedBy: 'External - CyberForce GmbH' },
  { id: '2', testName: 'Ransomware Scenario Simulation', type: 'Scenario', scope: 'Enterprise-wide backup and recovery, incident response procedures', lastExecuted: '2026-01-10', result: 'Pass', nextScheduled: '2026-07-10', findingsCount: 2, description: 'Full-scale ransomware simulation testing backup integrity, recovery time, and incident response', testedBy: 'Internal CIRT + External Advisor' },
  { id: '3', testName: 'Quarterly Vulnerability Assessment', type: 'Vulnerability Scan', scope: 'All internet-facing systems, internal network, cloud workloads', lastExecuted: '2026-01-25', result: 'Partial', nextScheduled: '2026-04-25', findingsCount: 23, description: 'Comprehensive vulnerability scan across all environments with CVSS scoring and remediation tracking', testedBy: 'Internal - Security Operations' },
  { id: '4', testName: 'External Penetration Test - Trading Platform', type: 'Penetration Test', scope: 'Trading platform frontend, APIs, authentication, session management', lastExecuted: '2025-12-05', result: 'Pass', nextScheduled: '2026-06-05', findingsCount: 4, description: 'Black-box penetration test of client-facing trading platform and associated APIs', testedBy: 'External - PenTest Partners' },
  { id: '5', testName: 'Cloud Infrastructure Security Test', type: 'Penetration Test', scope: 'AWS/Azure cloud environments, IAM policies, data encryption', lastExecuted: '2026-02-01', result: 'Fail', nextScheduled: '2026-05-01', findingsCount: 11, description: 'Cloud security assessment covering misconfiguration, privilege escalation, and data exposure risks', testedBy: 'External - CloudSec Auditors' },
  { id: '6', testName: 'Business Continuity Tabletop Exercise', type: 'Scenario', scope: 'Critical business processes, disaster recovery, communication plans', lastExecuted: '2025-10-15', result: 'Pass', nextScheduled: '2026-04-15', findingsCount: 3, description: 'Tabletop exercise simulating major ICT disruption with senior management participation', testedBy: 'Internal - BCP Team' },
];

// ── Component ──────────────────────────────────────────────────────────

export const DORADashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [showAddIncident, setShowAddIncident] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<ICTRisk | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<ICTIncident | null>(null);

  const risks = MOCK_ICT_RISKS;
  const incidents = MOCK_INCIDENTS;
  const providers = MOCK_PROVIDERS;
  const tests = MOCK_TESTS;

  // ── Derived Metrics ──────────────────────────────────────────────────
  const complianceScore = 76;
  const criticalRisks = risks.filter(r => r.riskLevel === 'Critical').length;
  const highRisks = risks.filter(r => r.riskLevel === 'High').length;
  const openIncidents = incidents.filter(i => i.status === 'Open' || i.status === 'Investigating').length;
  const criticalProviders = providers.filter(p => p.criticality === 'Critical').length;
  const testsCompleted = tests.length;
  const testsPassed = tests.filter(t => t.result === 'Pass').length;
  const testsFailed = tests.filter(t => t.result === 'Fail').length;
  const totalFindings = tests.reduce((sum, t) => sum + t.findingsCount, 0);
  const reportedIncidents = incidents.filter(i => i.notificationStatus === 'Final Sent' || i.notificationStatus === 'Intermediate Sent' || i.notificationStatus === 'Initial Sent').length;
  const providersWithoutExit = providers.filter(p => !p.exitStrategyExists).length;

  const filteredRisks = useMemo(() => {
    return risks.filter(r => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (searchQuery && !r.riskId.toLowerCase().includes(searchQuery.toLowerCase()) && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [risks, categoryFilter, searchQuery]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      if (searchQuery && !i.incidentId.toLowerCase().includes(searchQuery.toLowerCase()) && !i.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [incidents, searchQuery]);

  // ── Helper Functions ─────────────────────────────────────────────────
  const riskLevelBg = (level: RiskLevel) => level === 'Critical' ? 'bg-red-500/20 text-red-400' : level === 'High' ? 'bg-orange-500/20 text-orange-400' : level === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';
  const severityBg = (s: IncidentSeverity) => s === 'Critical' ? 'bg-red-500/20 text-red-400' : s === 'High' ? 'bg-orange-500/20 text-orange-400' : s === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';
  const statusBg = (s: IncidentStatus) => s === 'Reported to Authority' ? 'bg-blue-500/20 text-blue-400' : s === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : s === 'Investigating' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400';
  const mitigationBg = (s: MitigationStatus) => s === 'Verified' ? 'bg-emerald-500/20 text-emerald-400' : s === 'Implemented' ? 'bg-blue-500/20 text-blue-400' : s === 'In Progress' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400';
  const criticalityBg = (c: Criticality) => c === 'Critical' ? 'bg-red-500/20 text-red-400' : c === 'Important' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400';
  const testResultBg = (r: TestResult) => r === 'Pass' ? 'bg-emerald-500/20 text-emerald-400' : r === 'Fail' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400';
  const contractBg = (s: ContractStatus) => s === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : s === 'Renewal Pending' ? 'bg-amber-500/20 text-amber-400' : s === 'Under Review' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400';
  const concentrationBg = (c: ConcentrationRisk) => c === 'High' ? 'bg-red-500/20 text-red-400' : c === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
    { key: 'ict_risk', label: 'ICT Risk Management', icon: <Shield size={15} /> },
    { key: 'incidents', label: 'Incident Reporting', icon: <AlertTriangle size={15} /> },
    { key: 'third_party', label: 'Third-Party Risk', icon: <Building2 size={15} /> },
    { key: 'resilience_testing', label: 'Resilience Testing', icon: <Activity size={15} /> },
  ];

  // ── Overview Tab ─────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Compliance Score</span>
            <Shield size={18} className="text-blue-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 36 36" className="w-14 h-14 transform -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={complianceScore >= 80 ? '#10b981' : complianceScore >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${complianceScore} ${100 - complianceScore}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{complianceScore}%</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{complianceScore}%</div>
              <div className="text-xs text-slate-400">DORA Readiness</div>
            </div>
          </div>
        </div>
        {[
          { label: 'ICT Risk Events', value: risks.length, sub: `${criticalRisks} critical`, icon: AlertCircle, color: 'text-red-400' },
          { label: 'Third-Party Providers', value: providers.length, sub: `${criticalProviders} critical`, icon: Building2, color: 'text-purple-400' },
          { label: 'Incidents Filed', value: reportedIncidents, sub: `${openIncidents} open`, icon: FileText, color: 'text-amber-400' },
          { label: 'Resilience Tests', value: testsCompleted, sub: `${testsPassed} passed`, icon: Activity, color: 'text-emerald-400' },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{m.label}</span>
              <m.icon size={18} className={m.color} />
            </div>
            <div className="text-2xl font-bold text-white">{m.value}</div>
            <div className="text-xs text-slate-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">ICT Risk Level Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Critical', count: criticalRisks, pct: Math.round((criticalRisks / risks.length) * 100), color: 'bg-red-500' },
              { label: 'High', count: highRisks, pct: Math.round((highRisks / risks.length) * 100), color: 'bg-orange-500' },
              { label: 'Medium', count: risks.filter(r => r.riskLevel === 'Medium').length, pct: Math.round((risks.filter(r => r.riskLevel === 'Medium').length / risks.length) * 100), color: 'bg-amber-500' },
              { label: 'Low', count: risks.filter(r => r.riskLevel === 'Low').length, pct: Math.round((risks.filter(r => r.riskLevel === 'Low').length / risks.length) * 100), color: 'bg-emerald-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-white font-medium">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full">
                  <div className={`h-2 ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent ICT Incidents</h3>
          <div className="space-y-3">
            {incidents.slice(0, 4).map(inc => (
              <div key={inc.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">{inc.incidentId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${severityBg(inc.severity)}`}>{inc.severity}</span>
                  </div>
                  <p className="text-sm text-white truncate mt-1">{inc.title}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ml-3 whitespace-nowrap ${statusBg(inc.status)}`}>{inc.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Third-Party Concentration */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Third-Party Provider Overview</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{criticalProviders}</div>
              <div className="text-xs text-slate-400">Critical Providers</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{providersWithoutExit}</div>
              <div className="text-xs text-slate-400">Missing Exit Strategy</div>
            </div>
          </div>
          <div className="space-y-2">
            {providers.filter(p => p.criticality === 'Critical').map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <div>
                  <span className="text-sm text-white">{p.providerName}</span>
                  <span className="text-xs text-slate-400 ml-2">{p.serviceType.split('(')[0].trim()}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${concentrationBg(p.concentrationRisk)}`}>{p.concentrationRisk} risk</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resilience Testing Summary */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Resilience Testing Summary</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{testsPassed}</div>
              <div className="text-xs text-slate-400">Passed</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{tests.filter(t => t.result === 'Partial').length}</div>
              <div className="text-xs text-slate-400">Partial</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{testsFailed}</div>
              <div className="text-xs text-slate-400">Failed</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
            <span className="text-sm text-slate-300">Total Open Findings</span>
            <span className="text-lg font-bold text-amber-400">{totalFindings}</span>
          </div>
          <div className="mt-3 space-y-2">
            {tests.filter(t => t.result === 'Fail').map(t => (
              <div key={t.id} className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                <XCircle size={14} className="text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300">{t.testName}</span>
                <span className="text-xs text-red-400 ml-auto">{t.findingsCount} findings</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── ICT Risk Management Tab ──────────────────────────────────────────
  const renderICTRisk = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search risks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Categories</option>
            {(['Cyber', 'Infrastructure', 'Software', 'Cloud', 'Data'] as RiskCategory[]).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowAddRisk(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} />Add Risk
        </button>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium">Risk ID</th>
                <th className="text-left p-3 text-slate-400 font-medium">Title</th>
                <th className="text-left p-3 text-slate-400 font-medium">Category</th>
                <th className="text-left p-3 text-slate-400 font-medium">Likelihood</th>
                <th className="text-left p-3 text-slate-400 font-medium">Impact</th>
                <th className="text-left p-3 text-slate-400 font-medium">Risk Level</th>
                <th className="text-left p-3 text-slate-400 font-medium">Mitigation</th>
                <th className="text-left p-3 text-slate-400 font-medium">Owner</th>
                <th className="text-left p-3 text-slate-400 font-medium">Review Date</th>
                <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.map(risk => (
                <tr key={risk.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 font-mono text-xs text-slate-300">{risk.riskId}</td>
                  <td className="p-3 text-white max-w-[200px] truncate">{risk.title}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">{risk.category}</span></td>
                  <td className="p-3 text-slate-300">{risk.likelihood}</td>
                  <td className="p-3 text-slate-300">{risk.impact}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${riskLevelBg(risk.riskLevel)}`}>{risk.riskLevel}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${mitigationBg(risk.mitigationStatus)}`}>{risk.mitigationStatus}</span></td>
                  <td className="p-3 text-slate-300 whitespace-nowrap">{risk.owner}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{risk.reviewDate}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedRisk(risk)} className="p-1.5 hover:bg-slate-600 rounded" title="View"><Eye size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Edit"><Edit3 size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Delete"><Trash2 size={14} className="text-red-400" /></button>
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

  // ── Incident Reporting Tab ───────────────────────────────────────────
  const renderIncidents = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500"
          />
        </div>
        <button onClick={() => setShowAddIncident(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} />Report Incident
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Open Incidents', value: incidents.filter(i => i.status === 'Open').length, color: 'text-red-400', icon: AlertCircle },
          { label: 'Under Investigation', value: incidents.filter(i => i.status === 'Investigating').length, color: 'text-amber-400', icon: Search },
          { label: 'Resolved', value: incidents.filter(i => i.status === 'Resolved').length, color: 'text-emerald-400', icon: CheckCircle },
          { label: 'Reported to Authority', value: incidents.filter(i => i.status === 'Reported to Authority').length, color: 'text-blue-400', icon: FileText },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium">Incident ID</th>
                <th className="text-left p-3 text-slate-400 font-medium">Title</th>
                <th className="text-left p-3 text-slate-400 font-medium">Type</th>
                <th className="text-left p-3 text-slate-400 font-medium">Severity</th>
                <th className="text-left p-3 text-slate-400 font-medium">Affected Services</th>
                <th className="text-left p-3 text-slate-400 font-medium">Detection</th>
                <th className="text-left p-3 text-slate-400 font-medium">Resolution</th>
                <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                <th className="text-left p-3 text-slate-400 font-medium">Notification</th>
                <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(inc => (
                <tr key={inc.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 font-mono text-xs text-slate-300">{inc.incidentId}</td>
                  <td className="p-3 text-white max-w-[180px] truncate">{inc.title}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 whitespace-nowrap">{inc.type}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${severityBg(inc.severity)}`}>{inc.severity}</span></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {inc.affectedServices.slice(0, 2).map(s => <span key={s} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{s}</span>)}
                      {inc.affectedServices.length > 2 && <span className="text-xs text-slate-500">+{inc.affectedServices.length - 2}</span>}
                    </div>
                  </td>
                  <td className="p-3 text-slate-400 text-xs whitespace-nowrap">{new Date(inc.detectionTime).toLocaleDateString()}</td>
                  <td className="p-3 text-slate-400 text-xs whitespace-nowrap">{inc.resolutionTime ? new Date(inc.resolutionTime).toLocaleDateString() : <span className="text-amber-400">Ongoing</span>}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusBg(inc.status)}`}>{inc.status}</span></td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      inc.notificationStatus === 'Final Sent' ? 'bg-emerald-500/20 text-emerald-400' :
                      inc.notificationStatus === 'Not Required' ? 'bg-slate-500/20 text-slate-400' :
                      inc.notificationStatus === 'Pending' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{inc.notificationStatus}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedIncident(inc)} className="p-1.5 hover:bg-slate-600 rounded" title="View"><Eye size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Edit"><Edit3 size={14} className="text-slate-400" /></button>
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

  // ── Third-Party Risk Tab ─────────────────────────────────────────────
  const renderThirdParty = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">ICT Third-Party Service Provider Register</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} />Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Total Providers', value: providers.length, color: 'text-blue-400', icon: Building2 },
          { label: 'Critical Providers', value: criticalProviders, color: 'text-red-400', icon: AlertCircle },
          { label: 'No Exit Strategy', value: providersWithoutExit, color: 'text-amber-400', icon: AlertTriangle },
          { label: 'High Concentration', value: providers.filter(p => p.concentrationRisk === 'High').length, color: 'text-orange-400', icon: Zap },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium">Provider Name</th>
                <th className="text-left p-3 text-slate-400 font-medium">Service Type</th>
                <th className="text-left p-3 text-slate-400 font-medium">Criticality</th>
                <th className="text-left p-3 text-slate-400 font-medium">Contract</th>
                <th className="text-left p-3 text-slate-400 font-medium">Exit Strategy</th>
                <th className="text-left p-3 text-slate-400 font-medium">Concentration Risk</th>
                <th className="text-left p-3 text-slate-400 font-medium">Country</th>
                <th className="text-left p-3 text-slate-400 font-medium">Last Assessment</th>
                <th className="text-left p-3 text-slate-400 font-medium">Next Review</th>
                <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(p => (
                <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-white font-medium whitespace-nowrap">{p.providerName}</td>
                  <td className="p-3 text-slate-300 max-w-[180px] truncate">{p.serviceType}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${criticalityBg(p.criticality)}`}>{p.criticality}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${contractBg(p.contractStatus)}`}>{p.contractStatus}</span></td>
                  <td className="p-3 text-center">
                    {p.exitStrategyExists
                      ? <CheckCircle size={16} className="text-emerald-400 inline" />
                      : <XCircle size={16} className="text-red-400 inline" />
                    }
                  </td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${concentrationBg(p.concentrationRisk)}`}>{p.concentrationRisk}</span></td>
                  <td className="p-3 text-slate-300 whitespace-nowrap">{p.country}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{p.lastAssessmentDate}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{p.nextReview}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="View"><Eye size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Edit"><Edit3 size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Delete"><Trash2 size={14} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concentration Risk Warning */}
      {providers.filter(p => p.concentrationRisk === 'High').length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-orange-300">Concentration Risk Alert</h4>
              <p className="text-sm text-orange-200/80 mt-1">
                {providers.filter(p => p.concentrationRisk === 'High').length} providers have high concentration risk. DORA Article 29 requires financial entities to identify and assess concentration risk at entity and group level. Consider alternative providers or mitigation measures.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {providers.filter(p => p.concentrationRisk === 'High').map(p => (
                  <span key={p.id} className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">{p.providerName}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Resilience Testing Tab ───────────────────────────────────────────
  const renderResilienceTesting = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Digital Operational Resilience Testing Programme</h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600">
            <Download size={16} />Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} />Schedule Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Tests Conducted', value: tests.length, color: 'text-blue-400', icon: Activity },
          { label: 'Pass Rate', value: `${Math.round((testsPassed / tests.length) * 100)}%`, color: 'text-emerald-400', icon: CheckCircle },
          { label: 'Open Findings', value: totalFindings, color: 'text-amber-400', icon: Bug },
          { label: 'TLPT Completed', value: tests.filter(t => t.type === 'TLPT').length, color: 'text-purple-400', icon: Shield },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium">Test Name</th>
                <th className="text-left p-3 text-slate-400 font-medium">Type</th>
                <th className="text-left p-3 text-slate-400 font-medium">Scope</th>
                <th className="text-left p-3 text-slate-400 font-medium">Last Executed</th>
                <th className="text-left p-3 text-slate-400 font-medium">Result</th>
                <th className="text-left p-3 text-slate-400 font-medium">Findings</th>
                <th className="text-left p-3 text-slate-400 font-medium">Next Scheduled</th>
                <th className="text-left p-3 text-slate-400 font-medium">Tested By</th>
                <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(t => (
                <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-white font-medium max-w-[200px] truncate">{t.testName}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      t.type === 'TLPT' ? 'bg-purple-500/20 text-purple-400' :
                      t.type === 'Penetration Test' ? 'bg-blue-500/20 text-blue-400' :
                      t.type === 'Vulnerability Scan' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-slate-600 text-slate-300'
                    }`}>{t.type}</span>
                  </td>
                  <td className="p-3 text-slate-300 max-w-[200px] truncate">{t.scope}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{t.lastExecuted}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${testResultBg(t.result)}`}>{t.result}</span></td>
                  <td className="p-3">
                    <span className={`text-sm font-medium ${t.findingsCount > 5 ? 'text-amber-400' : t.findingsCount > 0 ? 'text-slate-300' : 'text-emerald-400'}`}>
                      {t.findingsCount}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{t.nextScheduled}</td>
                  <td className="p-3 text-slate-300 max-w-[150px] truncate">{t.testedBy}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="View Report"><Eye size={14} className="text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-600 rounded" title="Download"><Download size={14} className="text-slate-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TLPT Notice */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-purple-300">Threat-Led Penetration Testing (TLPT)</h4>
            <p className="text-sm text-purple-200/80 mt-1">
              Under DORA Article 26, financial entities identified by competent authorities must conduct TLPT at least every 3 years. TLPT must be carried out in accordance with the TIBER-EU framework and cover critical or important functions on live production systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Modals ───────────────────────────────────────────────────────────

  const renderRiskDetailModal = () => selectedRisk && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRisk(null)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{selectedRisk.riskId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${riskLevelBg(selectedRisk.riskLevel)}`}>{selectedRisk.riskLevel}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-1">{selectedRisk.title}</h3>
          </div>
          <button onClick={() => setSelectedRisk(null)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <p className="text-sm text-white">{selectedRisk.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category</label>
              <span className="text-sm text-white">{selectedRisk.category}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Owner</label>
              <span className="text-sm text-white">{selectedRisk.owner}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Likelihood</label>
              <span className="text-sm text-white">{selectedRisk.likelihood}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Impact</label>
              <span className="text-sm text-white">{selectedRisk.impact}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mitigation Status</label>
              <span className={`text-xs px-2 py-1 rounded-full ${mitigationBg(selectedRisk.mitigationStatus)}`}>{selectedRisk.mitigationStatus}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Next Review</label>
              <span className="text-sm text-white">{selectedRisk.reviewDate}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setSelectedRisk(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Close</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Edit Risk</button>
        </div>
      </div>
    </div>
  );

  const renderIncidentDetailModal = () => selectedIncident && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedIncident(null)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{selectedIncident.incidentId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${severityBg(selectedIncident.severity)}`}>{selectedIncident.severity}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg(selectedIncident.status)}`}>{selectedIncident.status}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-1">{selectedIncident.title}</h3>
          </div>
          <button onClick={() => setSelectedIncident(null)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <p className="text-sm text-white">{selectedIncident.description}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Root Cause</label>
            <p className="text-sm text-white">{selectedIncident.rootCause}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Type</label>
              <span className="text-sm text-white">{selectedIncident.type}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Notification Status</label>
              <span className="text-sm text-white">{selectedIncident.notificationStatus}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Detection Time</label>
              <span className="text-sm text-white">{new Date(selectedIncident.detectionTime).toLocaleString()}</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Resolution Time</label>
              <span className="text-sm text-white">{selectedIncident.resolutionTime ? new Date(selectedIncident.resolutionTime).toLocaleString() : 'Ongoing'}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Affected Services</label>
            <div className="flex flex-wrap gap-2">
              {selectedIncident.affectedServices.map(s => (
                <span key={s} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{s}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setSelectedIncident(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Close</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Update Status</button>
        </div>
      </div>
    </div>
  );

  const renderAddRiskModal = () => showAddRisk && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddRisk(false)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Add ICT Risk</h3>
          <button onClick={() => setShowAddRisk(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Risk Title</label>
            <input type="text" placeholder="Enter risk title..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Category</label>
            <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
              {(['Cyber', 'Infrastructure', 'Software', 'Cloud', 'Data'] as RiskCategory[]).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Likelihood</label>
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                {(['Very Low', 'Low', 'Medium', 'High', 'Very High'] as Likelihood[]).map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Impact</label>
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                {(['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'] as Impact[]).map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Owner</label>
            <input type="text" placeholder="Risk owner..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea placeholder="Describe the risk..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm h-20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setShowAddRisk(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
          <button onClick={() => setShowAddRisk(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Add Risk</button>
        </div>
      </div>
    </div>
  );

  const renderAddIncidentModal = () => showAddIncident && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddIncident(false)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Report ICT Incident</h3>
          <button onClick={() => setShowAddIncident(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Incident Title</label>
            <input type="text" placeholder="Enter incident title..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Type</label>
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                {(['Cyber Attack', 'System Failure', 'Data Breach', 'Third-Party Outage'] as IncidentType[]).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Severity</label>
              <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                {(['Low', 'Medium', 'High', 'Critical'] as IncidentSeverity[]).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Affected Services</label>
            <input type="text" placeholder="Comma-separated services..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea placeholder="Describe the incident..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm h-20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setShowAddIncident(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
          <button onClick={() => setShowAddIncident(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Report Incident</button>
        </div>
      </div>
    </div>
  );

  // ── Main Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold">DORA Compliance</h1>
            <p className="text-sm text-slate-400">Digital Operational Resilience Act (EU) 2022/2554</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-700 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearchQuery(''); setCategoryFilter('all'); }} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'ict_risk' && renderICTRisk()}
        {activeTab === 'incidents' && renderIncidents()}
        {activeTab === 'third_party' && renderThirdParty()}
        {activeTab === 'resilience_testing' && renderResilienceTesting()}
      </div>

      {renderRiskDetailModal()}
      {renderIncidentDetailModal()}
      {renderAddRiskModal()}
      {renderAddIncidentModal()}
    </div>
  );
};

export default DORADashboard;
