/**
 * SOX Compliance Dashboard
 * Sarbanes-Oxley Act Section 404 compliance management
 * Controls, testing, deficiencies, walkthroughs, and ICFR reporting
 */
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import {
  ArrowLeft, Shield, CheckCircle, AlertTriangle, XCircle, Search, Plus, X,
  FileText, Clock, BarChart3, ChevronRight, Edit3, Trash2, Eye, Download,
  AlertCircle, Filter, Calendar, Target, Activity, TrendingUp, Lock
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'controls' | 'testing' | 'deficiencies' | 'walkthroughs' | 'reports';
type ControlCategory = 'ITGC' | 'Business Process' | 'Entity Level' | 'Transaction Level' | 'IT Application';
type ProcessArea = 'Revenue' | 'Procurement' | 'Financial Close' | 'Treasury' | 'Payroll' | 'IT General';
type ControlType = 'Preventive' | 'Detective' | 'Corrective';
type Effectiveness = 'Effective' | 'Ineffective' | 'Needs Improvement';
type RiskLevel = 'High' | 'Medium' | 'Low';
type ControlStatus = 'Active' | 'Inactive' | 'Remediation';
type TestResult = 'Pass' | 'Fail' | 'Exception' | 'N/A';
type DeficiencyType = 'Control Deficiency' | 'Significant Deficiency' | 'Material Weakness';

interface SOXControl {
  id: string; controlId: string; title: string; description: string;
  category: ControlCategory; processArea: ProcessArea; controlType: ControlType;
  assertion: string; frequency: string; owner: string; status: ControlStatus;
  effectiveness: Effectiveness; riskLevel: RiskLevel; automationLevel: string;
  lastTestedDate: string; nextTestDate: string; deficiencyCount: number;
}

interface TestRecord {
  id: string; controlId: string; controlTitle: string; tester: string;
  methodology: string; sampleSize: number; result: TestResult;
  testDate: string; findings: string; status: string;
}

interface Deficiency {
  id: string; title: string; controlId: string; type: DeficiencyType;
  severity: string; status: string; owner: string; dueDate: string;
  description: string; remediationPlan: string;
}

interface Walkthrough {
  id: string; processName: string; cosoComponent: string; steps: number;
  keyControls: number; riskPoints: number; status: string; lastReviewed: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────
const MOCK_CONTROLS: SOXControl[] = [
  { id: '1', controlId: 'ITGC-01', title: 'Logical Access - User Provisioning', description: 'New user access requires manager and IT approval', category: 'ITGC', processArea: 'IT General', controlType: 'Preventive', assertion: 'Existence', frequency: 'Per Occurrence', owner: 'IT Security Manager', status: 'Active', effectiveness: 'Effective', riskLevel: 'High', automationLevel: 'Semi-Automated', lastTestedDate: '2026-01-15', nextTestDate: '2026-04-15', deficiencyCount: 0 },
  { id: '2', controlId: 'ITGC-02', title: 'Logical Access - Termination', description: 'Access removed within 24 hours of termination', category: 'ITGC', processArea: 'IT General', controlType: 'Preventive', assertion: 'Rights & Obligations', frequency: 'Per Occurrence', owner: 'IT Security Manager', status: 'Active', effectiveness: 'Effective', riskLevel: 'High', automationLevel: 'Automated', lastTestedDate: '2026-01-15', nextTestDate: '2026-04-15', deficiencyCount: 0 },
  { id: '3', controlId: 'ITGC-03', title: 'Change Management - Approval', description: 'All production changes require CAB approval', category: 'ITGC', processArea: 'IT General', controlType: 'Preventive', assertion: 'Completeness', frequency: 'Per Occurrence', owner: 'Change Manager', status: 'Active', effectiveness: 'Needs Improvement', riskLevel: 'High', automationLevel: 'Semi-Automated', lastTestedDate: '2026-01-20', nextTestDate: '2026-04-20', deficiencyCount: 1 },
  { id: '4', controlId: 'ITGC-04', title: 'Backup & Recovery', description: 'Daily backups verified monthly', category: 'ITGC', processArea: 'IT General', controlType: 'Detective', assertion: 'Existence', frequency: 'Monthly', owner: 'Infrastructure Lead', status: 'Active', effectiveness: 'Effective', riskLevel: 'Medium', automationLevel: 'Automated', lastTestedDate: '2026-02-01', nextTestDate: '2026-05-01', deficiencyCount: 0 },
  { id: '5', controlId: 'ITGC-05', title: 'Password Policy Enforcement', description: 'Password complexity and rotation per policy', category: 'ITGC', processArea: 'IT General', controlType: 'Preventive', assertion: 'Rights & Obligations', frequency: 'Continuous', owner: 'IT Security Manager', status: 'Active', effectiveness: 'Effective', riskLevel: 'Medium', automationLevel: 'Automated', lastTestedDate: '2026-01-10', nextTestDate: '2026-04-10', deficiencyCount: 0 },
  { id: '6', controlId: 'ITGC-06', title: 'Segregation of Duties in IT', description: 'Developers cannot deploy to production', category: 'ITGC', processArea: 'IT General', controlType: 'Preventive', assertion: 'Rights & Obligations', frequency: 'Continuous', owner: 'IT Director', status: 'Active', effectiveness: 'Effective', riskLevel: 'High', automationLevel: 'Automated', lastTestedDate: '2026-01-25', nextTestDate: '2026-04-25', deficiencyCount: 0 },
  { id: '7', controlId: 'FIN-RC-01', title: 'Revenue Recognition Review', description: 'Monthly review of revenue recognition criteria per ASC 606', category: 'Business Process', processArea: 'Revenue', controlType: 'Detective', assertion: 'Valuation', frequency: 'Monthly', owner: 'Revenue Controller', status: 'Active', effectiveness: 'Effective', riskLevel: 'High', automationLevel: 'Manual', lastTestedDate: '2026-01-30', nextTestDate: '2026-04-30', deficiencyCount: 0 },
  { id: '8', controlId: 'FIN-RC-02', title: 'Customer Credit Approval', description: 'Credit limits require credit committee approval over $50K', category: 'Business Process', processArea: 'Revenue', controlType: 'Preventive', assertion: 'Rights & Obligations', frequency: 'Per Occurrence', owner: 'Credit Manager', status: 'Active', effectiveness: 'Effective', riskLevel: 'Medium', automationLevel: 'Semi-Automated', lastTestedDate: '2026-01-28', nextTestDate: '2026-04-28', deficiencyCount: 0 },
  { id: '9', controlId: 'FIN-RC-03', title: 'Billing Accuracy Verification', description: 'System-generated invoices matched to contracts', category: 'Transaction Level', processArea: 'Revenue', controlType: 'Detective', assertion: 'Completeness', frequency: 'Daily', owner: 'Billing Manager', status: 'Active', effectiveness: 'Needs Improvement', riskLevel: 'Medium', automationLevel: 'Automated', lastTestedDate: '2026-02-05', nextTestDate: '2026-05-05', deficiencyCount: 1 },
  { id: '10', controlId: 'FIN-RC-04', title: 'Bad Debt Reserve Estimation', description: 'Quarterly review of allowance for doubtful accounts', category: 'Business Process', processArea: 'Revenue', controlType: 'Detective', assertion: 'Valuation', frequency: 'Quarterly', owner: 'CFO', status: 'Active', effectiveness: 'Effective', riskLevel: 'High', automationLevel: 'Manual', lastTestedDate: '2026-01-05', nextTestDate: '2026-04-05', deficiencyCount: 0 },
  { id: '11', controlId: 'BPC-01', title: 'Purchase Order Approval', description: 'POs over $10K require dual approval', category: 'Business Process', processArea: 'Procurement', controlType: 'Preventive', assertion: 'Existence', frequency: 'Per Occurrence', owner: 'Procurement Director', status: 'Active', effectiveness: 'Effective', riskLevel: 'Medium', automationLevel: 'Automated', lastTestedDate: '2026-02-01', nextTestDate: '2026-05-01', deficiencyCount: 0 },
  { id: '12', controlId: 'BPC-02', title: 'Three-Way Match', description: 'PO, receipt, and invoice matched before payment', category: 'Transaction Level', processArea: 'Procurement', controlType: 'Detective', assertion: 'Existence', frequency: 'Per Occurrence', owner: 'AP Manager', status: 'Active', effectiveness: 'Effective', riskLevel: 'High', automationLevel: 'Automated', lastTestedDate: '2026-01-20', nextTestDate: '2026-04-20', deficiencyCount: 0 },
  { id: '13', controlId: 'BPC-03', title: 'Vendor Master Data Changes', description: 'Vendor bank account changes require dual authorization', category: 'Business Process', processArea: 'Procurement', controlType: 'Preventive', assertion: 'Rights & Obligations', frequency: 'Per Occurrence', owner: 'AP Manager', status: 'Active', effectiveness: 'Ineffective', riskLevel: 'High', automationLevel: 'Manual', lastTestedDate: '2026-01-18', nextTestDate: '2026-02-18', deficiencyCount: 2 },
  { id: '14', controlId: 'BPC-04', title: 'Duplicate Payment Detection', description: 'Automated duplicate payment check before batch processing', category: 'IT Application', processArea: 'Procurement', controlType: 'Detective', assertion: 'Existence', frequency: 'Daily', owner: 'AP Manager', status: 'Active', effectiveness: 'Effective', riskLevel: 'Medium', automationLevel: 'Automated', lastTestedDate: '2026-02-10', nextTestDate: '2026-05-10', deficiencyCount: 0 },
  { id: '15', controlId: 'ELC-01', title: 'Financial Close Checklist', description: 'Standardized close checklist completed each period', category: 'Entity Level', processArea: 'Financial Close', controlType: 'Detective', assertion: 'Completeness', frequency: 'Monthly', owner: 'Corporate Controller', status: 'Active', effectiveness: 'Effective', riskLevel: 'High', automationLevel: 'Semi-Automated', lastTestedDate: '2026-02-01', nextTestDate: '2026-05-01', deficiencyCount: 0 },
  { id: '16', controlId: 'ELC-02', title: 'Journal Entry Review', description: 'Manual journal entries reviewed and approved by controller', category: 'Entity Level', processArea: 'Financial Close', controlType: 'Detective', assertion: 'Valuation', frequency: 'Monthly', owner: 'Corporate Controller', status: 'Active', effectiveness: 'Effective', riskLevel: 'High', automationLevel: 'Semi-Automated', lastTestedDate: '2026-02-01', nextTestDate: '2026-05-01', deficiencyCount: 0 },
  { id: '17', controlId: 'ELC-03', title: 'Account Reconciliation', description: 'Balance sheet accounts reconciled monthly', category: 'Entity Level', processArea: 'Financial Close', controlType: 'Detective', assertion: 'Completeness', frequency: 'Monthly', owner: 'Accounting Manager', status: 'Active', effectiveness: 'Effective', riskLevel: 'High', automationLevel: 'Semi-Automated', lastTestedDate: '2026-02-05', nextTestDate: '2026-05-05', deficiencyCount: 0 },
  { id: '18', controlId: 'ELC-04', title: 'Intercompany Eliminations', description: 'Intercompany balances reconciled and eliminated in consolidation', category: 'Entity Level', processArea: 'Financial Close', controlType: 'Detective', assertion: 'Completeness', frequency: 'Monthly', owner: 'Corporate Controller', status: 'Active', effectiveness: 'Needs Improvement', riskLevel: 'Medium', automationLevel: 'Manual', lastTestedDate: '2026-01-31', nextTestDate: '2026-04-30', deficiencyCount: 1 },
];

const MOCK_TESTS: TestRecord[] = [
  { id: 't1', controlId: 'ITGC-01', controlTitle: 'Logical Access - User Provisioning', tester: 'Sarah Chen', methodology: 'Inspection', sampleSize: 25, result: 'Pass', testDate: '2026-01-15', findings: 'All 25 samples had proper approvals documented', status: 'Completed' },
  { id: 't2', controlId: 'ITGC-03', controlTitle: 'Change Management - Approval', tester: 'Michael Torres', methodology: 'Inspection', sampleSize: 30, result: 'Exception', testDate: '2026-01-20', findings: '2 of 30 changes lacked CAB approval documentation', status: 'Completed' },
  { id: 't3', controlId: 'FIN-RC-01', controlTitle: 'Revenue Recognition Review', tester: 'Jennifer Walsh', methodology: 'Re-performance', sampleSize: 15, result: 'Pass', testDate: '2026-01-30', findings: 'Revenue recognition criteria properly applied', status: 'Completed' },
  { id: 't4', controlId: 'BPC-03', controlTitle: 'Vendor Master Data Changes', tester: 'David Kim', methodology: 'Walkthrough', sampleSize: 20, result: 'Fail', testDate: '2026-01-18', findings: '5 vendor bank changes processed without dual authorization', status: 'Completed' },
  { id: 't5', controlId: 'ELC-02', controlTitle: 'Journal Entry Review', tester: 'Sarah Chen', methodology: 'Inspection', sampleSize: 40, result: 'Pass', testDate: '2026-02-01', findings: 'All journal entries properly reviewed and approved', status: 'Completed' },
  { id: 't6', controlId: 'ITGC-06', controlTitle: 'Segregation of Duties in IT', tester: 'Michael Torres', methodology: 'Observation', sampleSize: 0, result: 'Pass', testDate: '2026-01-25', findings: 'Technical controls prevent developer production access', status: 'Completed' },
  { id: 't7', controlId: 'BPC-01', controlTitle: 'Purchase Order Approval', tester: 'Jennifer Walsh', methodology: 'Inspection', sampleSize: 35, result: 'Pass', testDate: '2026-02-01', findings: 'Proper dual approval for all POs over $10K', status: 'Completed' },
  { id: 't8', controlId: 'FIN-RC-03', controlTitle: 'Billing Accuracy Verification', tester: 'David Kim', methodology: 'Re-performance', sampleSize: 50, result: 'Exception', testDate: '2026-02-05', findings: '3 invoices had minor quantity discrepancies', status: 'Completed' },
];

const MOCK_DEFICIENCIES: Deficiency[] = [
  { id: 'd1', title: 'Missing CAB Approval Documentation', controlId: 'ITGC-03', type: 'Control Deficiency', severity: 'Medium', status: 'In Remediation', owner: 'Change Manager', dueDate: '2026-03-15', description: '2 production changes lacked documented CAB approval', remediationPlan: 'Implement automated CAB approval workflow in ServiceNow' },
  { id: 'd2', title: 'Vendor Bank Account Change Authorization Gap', controlId: 'BPC-03', type: 'Significant Deficiency', severity: 'High', status: 'Open', owner: 'AP Manager', dueDate: '2026-03-01', description: '5 vendor bank account changes processed without required dual authorization', remediationPlan: 'Implement mandatory dual approval in ERP vendor master module' },
  { id: 'd3', title: 'Billing Quantity Discrepancies', controlId: 'FIN-RC-03', type: 'Control Deficiency', severity: 'Low', status: 'In Remediation', owner: 'Billing Manager', dueDate: '2026-03-30', description: 'Minor quantity discrepancies found in 3 invoices', remediationPlan: 'Enhance automated quantity validation in billing system' },
  { id: 'd4', title: 'Intercompany Reconciliation Delays', controlId: 'ELC-04', type: 'Control Deficiency', severity: 'Medium', status: 'Open', owner: 'Corporate Controller', dueDate: '2026-04-15', description: 'Intercompany reconciliations completed 5+ days after close', remediationPlan: 'Implement BlackLine intercompany module for real-time reconciliation' },
];

const MOCK_WALKTHROUGHS: Walkthrough[] = [
  { id: 'w1', processName: 'Order-to-Cash (Revenue)', cosoComponent: 'Control Activities', steps: 12, keyControls: 4, riskPoints: 3, status: 'Complete', lastReviewed: '2026-01-15' },
  { id: 'w2', processName: 'Procure-to-Pay', cosoComponent: 'Control Activities', steps: 10, keyControls: 4, riskPoints: 2, status: 'Complete', lastReviewed: '2026-01-20' },
  { id: 'w3', processName: 'Financial Close & Reporting', cosoComponent: 'Information & Communication', steps: 15, keyControls: 4, riskPoints: 4, status: 'Complete', lastReviewed: '2026-02-01' },
  { id: 'w4', processName: 'IT General Controls', cosoComponent: 'Control Environment', steps: 8, keyControls: 6, riskPoints: 2, status: 'Complete', lastReviewed: '2026-01-25' },
  { id: 'w5', processName: 'Payroll Processing', cosoComponent: 'Control Activities', steps: 9, keyControls: 3, riskPoints: 2, status: 'In Progress', lastReviewed: '2025-12-15' },
  { id: 'w6', processName: 'Treasury & Cash Management', cosoComponent: 'Risk Assessment', steps: 7, keyControls: 3, riskPoints: 3, status: 'Scheduled', lastReviewed: '2025-11-01' },
];

// ── Component ──────────────────────────────────────────────────────────
export const SOXComplianceDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [processFilter, setProcessFilter] = useState<string>('all');
  const [showCreateControl, setShowCreateControl] = useState(false);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [selectedControl, setSelectedControl] = useState<SOXControl | null>(null);
  const [selectedDeficiency, setSelectedDeficiency] = useState<Deficiency | null>(null);
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<SOXControl[]>(MOCK_CONTROLS);
  const [tests, setTests] = useState<TestRecord[]>(MOCK_TESTS);
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>(MOCK_DEFICIENCIES);
  const [walkthroughs, setWalkthroughs] = useState<Walkthrough[]>(MOCK_WALKTHROUGHS);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [dashData, controlsData, testsData, assessmentsData] = await Promise.all([
          api.sox.getDashboard().catch(() => null),
          api.sox.listControls().catch(() => null),
          api.sox.listTestResults().catch(() => null),
          api.sox.listAssessments().catch(() => null),
        ]);
        if (controlsData?.controls) setControls(controlsData.controls);
        else if (controlsData?.items) setControls(controlsData.items);
        else if (Array.isArray(controlsData)) setControls(controlsData);
        if (testsData?.testResults) setTests(testsData.testResults);
        else if (testsData?.items) setTests(testsData.items);
        else if (Array.isArray(testsData)) setTests(testsData);
        if (assessmentsData?.deficiencies) setDeficiencies(assessmentsData.deficiencies);
        else if (assessmentsData?.items) {
          // assessments may contain deficiency and walkthrough data
        }
        if (dashData?.walkthroughs) setWalkthroughs(dashData.walkthroughs);
        if (dashData?.deficiencies) setDeficiencies(dashData.deficiencies);
      } catch (err) {
        console.error('Failed to load SOX data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Derived metrics
  const effectiveCount = controls.filter(c => c.effectiveness === 'Effective').length;
  const ineffectiveCount = controls.filter(c => c.effectiveness === 'Ineffective').length;
  const needsImprovementCount = controls.filter(c => c.effectiveness === 'Needs Improvement').length;
  const complianceScore = Math.round((effectiveCount / controls.length) * 100);
  const totalDeficiencies = deficiencies.length;
  const materialWeaknesses = deficiencies.filter(d => d.type === 'Material Weakness').length;
  const significantDeficiencies = deficiencies.filter(d => d.type === 'Significant Deficiency').length;

  const filteredControls = useMemo(() => {
    return controls.filter(c => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (processFilter !== 'all' && c.processArea !== processFilter) return false;
      if (searchQuery && !c.controlId.toLowerCase().includes(searchQuery.toLowerCase()) && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [controls, categoryFilter, processFilter, searchQuery]);

  const effectivenessColor = (e: Effectiveness) => e === 'Effective' ? 'text-emerald-400' : e === 'Ineffective' ? 'text-red-400' : 'text-amber-400';
  const effectivenessBg = (e: Effectiveness) => e === 'Effective' ? 'bg-emerald-500/20 text-emerald-400' : e === 'Ineffective' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400';
  const riskBg = (r: RiskLevel) => r === 'High' ? 'bg-red-500/20 text-red-400' : r === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';
  const resultBg = (r: TestResult) => r === 'Pass' ? 'bg-emerald-500/20 text-emerald-400' : r === 'Fail' ? 'bg-red-500/20 text-red-400' : r === 'Exception' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400';
  const defTypeBg = (t: DeficiencyType) => t === 'Material Weakness' ? 'bg-red-500/20 text-red-400' : t === 'Significant Deficiency' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400';

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
    { key: 'controls', label: 'Controls', icon: <Shield size={15} /> },
    { key: 'testing', label: 'Testing', icon: <Target size={15} /> },
    { key: 'deficiencies', label: 'Deficiencies', icon: <AlertTriangle size={15} /> },
    { key: 'walkthroughs', label: 'Walkthroughs', icon: <Activity size={15} /> },
    { key: 'reports', label: 'Reports', icon: <FileText size={15} /> },
  ];

  // ── Overview Tab ──────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
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
            <div><div className="text-2xl font-bold text-white">{complianceScore}%</div><div className="text-xs text-slate-400">ICFR Rating</div></div>
          </div>
        </div>
        {[
          { label: 'Total Controls', value: controls.length, icon: Shield, color: 'text-blue-400' },
          { label: 'Tested Controls', value: tests.length, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Total Deficiencies', value: totalDeficiencies, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Material Weaknesses', value: materialWeaknesses, icon: XCircle, color: 'text-red-400' },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-2"><span className="text-sm text-slate-400">{m.label}</span><m.icon size={18} className={m.color} /></div>
            <div className="text-2xl font-bold text-white">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Control Effectiveness Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Effective', count: effectiveCount, pct: Math.round((effectiveCount / controls.length) * 100), color: 'bg-emerald-500' },
              { label: 'Needs Improvement', count: needsImprovementCount, pct: Math.round((needsImprovementCount / controls.length) * 100), color: 'bg-amber-500' },
              { label: 'Ineffective', count: ineffectiveCount, pct: Math.round((ineffectiveCount / controls.length) * 100), color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-300">{item.label}</span><span className="text-white font-medium">{item.count} ({item.pct}%)</span></div>
                <div className="h-2 bg-slate-700 rounded-full"><div className={`h-2 ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Testing Activity</h3>
          <div className="space-y-3">
            {tests.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">{t.controlId}: {t.controlTitle.slice(0, 35)}...</div>
                  <div className="text-xs text-slate-400">{t.tester} · {t.testDate}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${resultBg(t.result)}`}>{t.result}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Deadlines</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { date: '2026-03-01', event: 'Vendor Bank Control Remediation Due', severity: 'High' },
            { date: '2026-03-15', event: 'Q1 SOX Testing Completion', severity: 'Medium' },
            { date: '2026-03-31', event: 'Quarterly CEO/CFO Certification', severity: 'High' },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
              <Calendar size={16} className="text-blue-400 flex-shrink-0" />
              <div><div className="text-sm text-white">{d.event}</div><div className="text-xs text-slate-400">{d.date}</div></div>
              <span className={`ml-auto px-2 py-0.5 rounded text-xs ${d.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{d.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Controls Tab ──────────────────────────────────────────────────────
  const renderControls = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search controls..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Categories</option>
          {['ITGC', 'Business Process', 'Entity Level', 'Transaction Level', 'IT Application'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={processFilter} onChange={e => setProcessFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
          <option value="all">All Process Areas</option>
          {['Revenue', 'Procurement', 'Financial Close', 'Treasury', 'Payroll', 'IT General'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => setShowCreateControl(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus size={16} /> Add Control</button>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-700">
            {['Control ID', 'Title', 'Category', 'Process Area', 'Type', 'Frequency', 'Effectiveness', 'Risk', 'Owner', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filteredControls.map(c => (
              <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-blue-400 font-mono text-xs">{c.controlId}</td>
                <td className="px-4 py-3 text-white">{c.title}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{c.category}</span></td>
                <td className="px-4 py-3 text-slate-300">{c.processArea}</td>
                <td className="px-4 py-3 text-slate-300">{c.controlType}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{c.frequency}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${effectivenessBg(c.effectiveness)}`}>{c.effectiveness}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${riskBg(c.riskLevel)}`}>{c.riskLevel}</span></td>
                <td className="px-4 py-3 text-slate-300 text-xs">{c.owner}</td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button onClick={() => setSelectedControl(c)} className="p-1 hover:bg-slate-600 rounded"><Eye size={14} className="text-slate-400" /></button>
                  <button className="p-1 hover:bg-slate-600 rounded"><Edit3 size={14} className="text-slate-400" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-slate-400">{filteredControls.length} of {controls.length} controls shown</div>
    </div>
  );

  // ── Testing Tab ───────────────────────────────────────────────────────
  const renderTesting = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {['Pass', 'Fail', 'Exception'].map(r => {
            const count = tests.filter(t => t.result === r).length;
            return <div key={r} className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700"><span className="text-xs text-slate-400">{r}</span><div className={`text-xl font-bold ${r === 'Pass' ? 'text-emerald-400' : r === 'Fail' ? 'text-red-400' : 'text-amber-400'}`}>{count}</div></div>;
          })}
        </div>
        <button onClick={() => setShowCreateTest(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus size={16} /> New Test</button>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-700">
            {['Control', 'Tester', 'Methodology', 'Sample', 'Result', 'Date', 'Findings'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {tests.map(t => (
              <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3"><div className="text-blue-400 font-mono text-xs">{t.controlId}</div><div className="text-white text-xs">{t.controlTitle.slice(0, 30)}...</div></td>
                <td className="px-4 py-3 text-slate-300">{t.tester}</td>
                <td className="px-4 py-3 text-slate-300">{t.methodology}</td>
                <td className="px-4 py-3 text-slate-400">{t.sampleSize || 'N/A'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${resultBg(t.result)}`}>{t.result}</span></td>
                <td className="px-4 py-3 text-slate-400">{t.testDate}</td>
                <td className="px-4 py-3 text-slate-300 text-xs max-w-[200px] truncate">{t.findings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Deficiencies Tab ──────────────────────────────────────────────────
  const renderDeficiencies = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Material Weaknesses', count: materialWeaknesses, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
          { label: 'Significant Deficiencies', count: significantDeficiencies, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
          { label: 'Control Deficiencies', count: deficiencies.filter(d => d.type === 'Control Deficiency').length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
        ].map(m => (
          <div key={m.label} className={`rounded-lg p-4 border ${m.bg}`}>
            <div className="text-sm text-slate-400">{m.label}</div>
            <div className={`text-3xl font-bold ${m.color}`}>{m.count}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {deficiencies.map(d => (
          <div key={d.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 cursor-pointer" onClick={() => setSelectedDeficiency(d)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${defTypeBg(d.type)}`}>{d.type}</span>
                <span className="text-white font-medium">{d.title}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs ${d.status === 'Open' ? 'bg-red-500/20 text-red-400' : d.status === 'In Remediation' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{d.status}</span>
            </div>
            <div className="text-sm text-slate-400 mb-2">{d.description}</div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Control: {d.controlId}</span>
              <span>Owner: {d.owner}</span>
              <span>Due: {d.dueDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Walkthroughs Tab ──────────────────────────────────────────────────
  const renderWalkthroughs = () => (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">COSO Framework Alignment</h3>
        <div className="grid grid-cols-5 gap-3">
          {['Control Environment', 'Risk Assessment', 'Control Activities', 'Information & Communication', 'Monitoring'].map((comp, i) => {
            const count = walkthroughs.filter(w => w.cosoComponent === comp).length;
            return (
              <div key={comp} className="text-center p-3 bg-slate-700/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">{comp}</div>
                <div className="text-lg font-bold text-blue-400">{count}</div>
                <div className="text-xs text-slate-500">processes</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {walkthroughs.map(w => (
          <div key={w.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white font-medium">{w.processName}</div>
              <span className={`px-2 py-0.5 rounded text-xs ${w.status === 'Complete' ? 'bg-emerald-500/20 text-emerald-400' : w.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>{w.status}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span>COSO: {w.cosoComponent}</span>
              <span>{w.steps} Steps</span>
              <span>{w.keyControls} Key Controls</span>
              <span>{w.riskPoints} Risk Points</span>
              <span>Last: {w.lastReviewed}</span>
            </div>
            <div className="mt-3 flex gap-2">
              {Array.from({ length: w.steps }, (_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < (w.status === 'Complete' ? w.steps : w.status === 'In Progress' ? Math.floor(w.steps * 0.6) : 0) ? 'bg-blue-500' : 'bg-slate-700'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Reports Tab ───────────────────────────────────────────────────────
  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Management Assessment of ICFR</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-slate-400 mb-2">Overall Assessment</div>
            <div className={`text-xl font-bold ${materialWeaknesses === 0 ? 'text-emerald-400' : 'text-red-400'}`}>{materialWeaknesses === 0 ? 'Effective' : 'Ineffective'}</div>
            <div className="text-sm text-slate-400 mt-1">Internal Control over Financial Reporting is {materialWeaknesses === 0 ? 'effective' : 'not effective'} as of the assessment date.</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Material Weaknesses</span><span className={materialWeaknesses > 0 ? 'text-red-400' : 'text-emerald-400'}>{materialWeaknesses}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Significant Deficiencies</span><span className="text-orange-400">{significantDeficiencies}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Control Deficiencies</span><span className="text-amber-400">{deficiencies.filter(d => d.type === 'Control Deficiency').length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Controls Tested</span><span className="text-white">{tests.length} / {controls.length}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quarterly Certification Readiness</h3>
          {['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'].map((q, i) => (
            <div key={q} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <span className="text-sm text-slate-300">{q}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${i === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{i === 0 ? 'Ready' : 'Pending'}</span>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Available Reports</h3>
          {['Management Assessment Report', 'Control Testing Summary', 'Deficiency Analysis', 'Walkthrough Documentation', 'External Auditor Package'].map(r => (
            <div key={r} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <div className="flex items-center gap-2"><FileText size={14} className="text-blue-400" /><span className="text-sm text-slate-300">{r}</span></div>
              <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Download size={12} /> Export</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Modals ────────────────────────────────────────────────────────────
  const renderCreateControlModal = () => showCreateControl && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateControl(false)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Add SOX Control</h3>
          <button onClick={() => setShowCreateControl(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Control ID', placeholder: 'e.g. ITGC-07' },
            { label: 'Title', placeholder: 'Control title' },
            { label: 'Description', placeholder: 'Describe the control objective' },
          ].map(f => (
            <div key={f.label}><label className="block text-sm text-slate-400 mb-1">{f.label}</label><input type="text" placeholder={f.placeholder} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" /></div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Category', options: ['ITGC', 'Business Process', 'Entity Level', 'Transaction Level', 'IT Application'] },
              { label: 'Process Area', options: ['Revenue', 'Procurement', 'Financial Close', 'Treasury', 'Payroll', 'IT General'] },
              { label: 'Control Type', options: ['Preventive', 'Detective', 'Corrective'] },
              { label: 'Risk Level', options: ['High', 'Medium', 'Low'] },
            ].map(s => (
              <div key={s.label}><label className="block text-sm text-slate-400 mb-1">{s.label}</label><select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">{s.options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
            ))}
          </div>
          <div><label className="block text-sm text-slate-400 mb-1">Owner</label><input type="text" placeholder="Control owner" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
          <button onClick={() => setShowCreateControl(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button onClick={() => setShowCreateControl(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Create Control</button>
        </div>
      </div>
    </div>
  );

  const renderDetailModal = () => selectedControl && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedControl(null)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{selectedControl.controlId}: {selectedControl.title}</h3>
          <button onClick={() => setSelectedControl(null)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="text-sm text-slate-300">{selectedControl.description}</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Category', selectedControl.category], ['Process Area', selectedControl.processArea],
              ['Type', selectedControl.controlType], ['Frequency', selectedControl.frequency],
              ['Assertion', selectedControl.assertion], ['Risk Level', selectedControl.riskLevel],
              ['Automation', selectedControl.automationLevel], ['Owner', selectedControl.owner],
              ['Last Tested', selectedControl.lastTestedDate], ['Next Test', selectedControl.nextTestDate],
            ].map(([k, v]) => (
              <div key={k as string}><span className="text-slate-400">{k}: </span><span className="text-white">{v}</span></div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2"><span className="text-sm text-slate-400">Effectiveness:</span><span className={`px-2 py-0.5 rounded text-xs font-medium ${effectivenessBg(selectedControl.effectiveness)}`}>{selectedControl.effectiveness}</span></div>
        </div>
      </div>
    </div>
  );

  const renderDeficiencyDetailModal = () => selectedDeficiency && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDeficiency(null)}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{selectedDeficiency.title}</h3>
          <button onClick={() => setSelectedDeficiency(null)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${defTypeBg(selectedDeficiency.type)}`}>{selectedDeficiency.type}</span></div>
          <div><div className="text-sm text-slate-400 mb-1">Description</div><div className="text-sm text-slate-300">{selectedDeficiency.description}</div></div>
          <div><div className="text-sm text-slate-400 mb-1">Remediation Plan</div><div className="text-sm text-slate-300">{selectedDeficiency.remediationPlan}</div></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Control: </span><span className="text-white">{selectedDeficiency.controlId}</span></div>
            <div><span className="text-slate-400">Owner: </span><span className="text-white">{selectedDeficiency.owner}</span></div>
            <div><span className="text-slate-400">Due Date: </span><span className="text-white">{selectedDeficiency.dueDate}</span></div>
            <div><span className="text-slate-400">Status: </span><span className="text-white">{selectedDeficiency.status}</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold">SOX Compliance</h1><p className="text-sm text-slate-400">Sarbanes-Oxley Section 404 Internal Controls Management</p></div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-700 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'controls' && renderControls()}
        {activeTab === 'testing' && renderTesting()}
        {activeTab === 'deficiencies' && renderDeficiencies()}
        {activeTab === 'walkthroughs' && renderWalkthroughs()}
        {activeTab === 'reports' && renderReports()}
      </div>

      {renderCreateControlModal()}
      {renderDetailModal()}
      {renderDeficiencyDetailModal()}
      {showCreateTest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateTest(false)}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Create Test Record</h3>
              <button onClick={() => setShowCreateTest(false)} className="p-1 hover:bg-slate-700 rounded"><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">Control</label><select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">{controls.map(c => <option key={c.id} value={c.controlId}>{c.controlId} - {c.title}</option>)}</select></div>
              <div><label className="block text-sm text-slate-400 mb-1">Methodology</label><select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">{['Walkthrough', 'Inquiry', 'Observation', 'Inspection', 'Re-performance'].map(m => <option key={m}>{m}</option>)}</select></div>
              <div><label className="block text-sm text-slate-400 mb-1">Sample Size</label><input type="number" placeholder="25" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Findings</label><textarea placeholder="Describe test findings..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm h-20 resize-none" /></div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
              <button onClick={() => setShowCreateTest(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={() => setShowCreateTest(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Create Test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOXComplianceDashboard;
