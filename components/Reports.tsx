import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { ComplianceFramework } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getLimit, isAtLimit, getUpgradeMessage } from '../constants/tierLimits';
import { TierLimitBanner } from './TierLimitBanner';
import {
  FileText, Loader2, Download, Calendar, CheckSquare, AlertTriangle, X, Settings,
  Brain, Zap, BarChart3, ArrowLeft, RefreshCw, TrendingUp, TrendingDown, AlertCircle,
  ShieldCheck, Target, Users, Building2, ChevronDown, ChevronUp, ClipboardList,
  Play, Minus, Check, Clock, FileWarning, CheckCircle, XCircle, Eye,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateComplianceReport } from '../services/geminiService';
import DOMPurify from 'dompurify';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, LineChart, Line, CartesianGrid, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

type ReportFormat = 'PDF' | 'JSON';
type ReportSection = 'executive_summary' | 'frameworks' | 'controls' | 'risks' | 'evidence' | 'recommendations' | 'audit_trail';
type ViewMode = 'dashboard' | 'generate' | 'executive-summary' | 'autopilot' | 'risk-report' | 'vendor-report';

interface ReportOptions {
  frameworks: string[];
  sections: ReportSection[];
  startDate: string;
  endDate: string;
  includeEvidence: boolean;
}

interface AutopilotResult {
  gapsIdentified: Array<{ gap: string; framework: string; severity: string; recommendation: string }>;
  actionsProposed: Array<{ action: string; priority: string; estimatedEffort: string; assignedTo?: string }>;
  actionsExecuted: Array<{ action: string; result: string; timestamp: string }>;
  itemsRequiringApproval: Array<{ item: string; reason: string; suggestedAction: string }>;
  summary: string;
  overallScore: number;
}

interface ExecutiveSummary {
  overallComplianceScore: number;
  frameworkSummaries: Array<{ name: string; score: number; status: string; trend: string }>;
  riskHighlights: Array<{ category: string; count: number; criticalCount: number }>;
  keyMetrics: { totalControls: number; compliantControls: number; openIssues: number; overdueTasks: number };
  recommendations: string[];
  narrative: string;
}

interface RiskReport {
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  risksByCategory: Array<{ category: string; count: number }>;
  trends: Array<{ period: string; count: number }>;
  topRisks: Array<{ title: string; severity: string; status: string; framework?: string }>;
  summary: string;
}

interface VendorRiskReport {
  totalVendors: number;
  highRiskVendors: number;
  averageScore: number;
  vendorsByRiskLevel: Array<{ level: string; count: number }>;
  topRiskyVendors: Array<{ name: string; score: number; riskLevel: string; dataAccess: string }>;
  summary: string;
}

const CHART_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#0d9488'];
const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
};

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const plan = user?.organization?.plan || 'Foundation';

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Core data
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);
  const [savedReportsCount, setSavedReportsCount] = useState(0);

  // Report generation state
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    frameworks: [],
    sections: ['executive_summary', 'frameworks', 'controls', 'risks', 'recommendations'],
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeEvidence: true,
  });
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  // AI report states
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [autopilotResult, setAutopilotResult] = useState<AutopilotResult | null>(null);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [vendorReport, setVendorReport] = useState<VendorRiskReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Tier limits
  const reportsLimitReached = isAtLimit(plan, 'maxCustomReports', savedReportsCount);

  // Load frameworks
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingFrameworks(true);
        const allFrameworks = await api.frameworks.list();
        setFrameworks(allFrameworks);
      } catch (error) {
        console.error('Failed to load frameworks:', error);
        setError('Failed to load frameworks');
      } finally {
        setLoadingFrameworks(false);
      }
    };
    loadData();
  }, []);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const totalFrameworks = frameworks.length;
    const avgProgress = frameworks.length > 0
      ? Math.round(frameworks.reduce((sum, f) => sum + (f.progress || 0), 0) / frameworks.length)
      : 0;
    const compliantFrameworks = frameworks.filter(f => f.status === 'Compliant').length;
    const atRiskFrameworks = frameworks.filter(f => f.progress < 50).length;
    return { totalFrameworks, avgProgress, compliantFrameworks, atRiskFrameworks };
  }, [frameworks]);

  const handleFrameworkToggle = (frameworkId: string) => {
    setSelectedFrameworks(prev => {
      if (prev.includes(frameworkId)) {
        return prev.filter(id => id !== frameworkId);
      } else {
        return [...prev, frameworkId];
      }
    });
    setError(null);
  };

  const handleSectionToggle = (section: ReportSection) => {
    setReportOptions(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section],
    }));
  };

  const handleGenerateReport = async () => {
    if (selectedFrameworks.length === 0) {
      setError('Please select at least one framework');
      return;
    }

    const selectedFwData = frameworks.filter(f => selectedFrameworks.includes(f.id));
    const frameworksWithoutControls = selectedFwData.filter(f => !f.controls || f.controls.length === 0);

    if (frameworksWithoutControls.length > 0 && reportOptions.sections.includes('controls')) {
      setError(`Warning: ${frameworksWithoutControls.map(f => f.name).join(', ')} have no controls.`);
    }

    setError(null);
    setLoading(true);
    setReport(null);

    try {
      const selectedFrameworksData = frameworks.filter(f => selectedFrameworks.includes(f.id));
      const context = selectedFrameworksData.map(fw => {
        const controls = fw.controls || [];
        const compliantControls = controls.filter((c: any) => c.status === 'Compliant' || c.status === 'Implemented').length;
        return `${fw.name}: ${fw.progress}% complete, ${compliantControls}/${controls.length} controls compliant, Status: ${fw.status}`;
      }).join('\n');

      const primaryFramework = selectedFrameworksData[0];
      const companyName = user?.organization?.name || 'Your Organization';

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Report generation timeout.')), 60000);
      });

      const reportPromise = generateComplianceReport(
        primaryFramework.name,
        companyName,
        context
      );

      const reportText = await Promise.race([reportPromise, timeoutPromise]) as string;

      let fullReport = `# Compliance Report\n\n`;
      fullReport += `**Generated:** ${new Date().toLocaleString()}\n`;
      fullReport += `**Date Range:** ${new Date(reportOptions.startDate).toLocaleDateString()} - ${new Date(reportOptions.endDate).toLocaleDateString()}\n`;
      fullReport += `**Frameworks:** ${selectedFrameworksData.map(f => f.name).join(', ')}\n\n`;

      if (reportOptions.sections.includes('executive_summary')) {
        fullReport += `## Executive Summary\n\n${reportText}\n\n`;
      }

      if (reportOptions.sections.includes('frameworks')) {
        fullReport += `## Framework Status\n\n`;
        selectedFrameworksData.forEach(fw => {
          fullReport += `### ${fw.name}\n`;
          fullReport += `- Progress: ${fw.progress}%\n`;
          fullReport += `- Status: ${fw.status}\n`;
          fullReport += `- Next Audit: ${new Date(fw.nextAuditDate).toLocaleDateString()}\n\n`;
        });
      }

      if (reportOptions.sections.includes('controls')) {
        fullReport += `## Control Status\n\n`;
        selectedFrameworksData.forEach(fw => {
          if (fw.controls && fw.controls.length > 0) {
            fullReport += `### ${fw.name} Controls\n\n`;
            fw.controls.forEach((control: any) => {
              fullReport += `- **${control.name}**: ${control.status}\n`;
              if (control.description) {
                fullReport += `  - ${control.description}\n`;
              }
            });
            fullReport += `\n`;
          }
        });
      }

      if (reportOptions.sections.includes('risks')) {
        try {
          const risks = await api.risks.list();
          const relevantRisks = risks.filter((r: any) =>
            new Date(r.detectedAt) >= new Date(reportOptions.startDate) &&
            new Date(r.detectedAt) <= new Date(reportOptions.endDate)
          );
          if (relevantRisks.length > 0) {
            fullReport += `## Risk Summary\n\n`;
            relevantRisks.forEach((risk: any) => {
              fullReport += `- **${risk.severity}**: ${risk.title || risk.description}\n`;
              fullReport += `  - Status: ${risk.status}\n`;
              fullReport += `  - Detected: ${new Date(risk.detectedAt).toLocaleDateString()}\n\n`;
            });
          }
        } catch {
          fullReport += `## Risk Summary\n\n*Unable to load risks at this time.*\n\n`;
        }
      }

      if (reportOptions.sections.includes('evidence') && reportOptions.includeEvidence) {
        fullReport += `## Evidence Summary\n\n`;
        selectedFrameworksData.forEach(fw => {
          if (fw.controls) {
            const controlsWithEvidence = fw.controls.filter((c: any) => c.evidence);
            if (controlsWithEvidence.length > 0) {
              fullReport += `### ${fw.name}\n`;
              fullReport += `${controlsWithEvidence.length} control(s) have evidence attached.\n\n`;
            }
          }
        });
      }

      if (reportOptions.sections.includes('recommendations')) {
        fullReport += `## Recommendations\n\n`;
        fullReport += `Based on the analysis, consider the following:\n\n`;
        selectedFrameworksData.forEach(fw => {
          if (fw.progress < 100) {
            fullReport += `- **${fw.name}**: Focus on implementing remaining controls to achieve full compliance.\n`;
          }
        });
      }

      setReport(fullReport);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate report.';
      setError(errorMessage);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // AI Executive Summary
  const handleGenerateExecutiveSummary = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const result = await api.enterprise.reports.getExecutiveSummary();
      setExecutiveSummary(result);
      setViewMode('executive-summary');
    } catch (err: any) {
      setError(err.message || 'Failed to generate executive summary');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Autopilot
  const handleRunAutopilot = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const result = await api.enterprise.autopilot.run();
      setAutopilotResult(result);
      setViewMode('autopilot');
    } catch (err: any) {
      setError(err.message || 'Failed to run compliance autopilot');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Risk Report
  const handleGenerateRiskReport = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const result = await api.enterprise.reports.getRiskReport();
      setRiskReport(result);
      setViewMode('risk-report');
    } catch (err: any) {
      setError(err.message || 'Failed to generate risk report');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Vendor Report
  const handleGenerateVendorReport = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const result = await api.enterprise.reports.getVendorRiskReport();
      setVendorReport(result);
      setViewMode('vendor-report');
    } catch (err: any) {
      setError(err.message || 'Failed to generate vendor risk report');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = async (format: ReportFormat) => {
    if (!report) {
      setError('Please generate a report first');
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `compliance-report-${timestamp}`;

      if (format === 'JSON') {
        const reportData = {
          generated: new Date().toISOString(),
          dateRange: { start: reportOptions.startDate, end: reportOptions.endDate },
          frameworks: selectedFrameworks.map(id => {
            const fw = frameworks.find(f => f.id === id);
            return fw ? { id: fw.id, name: fw.name, progress: fw.progress, status: fw.status } : null;
          }).filter(Boolean),
          report: report,
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        try {
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            setError('Please allow popups to download PDF');
            return;
          }

          const sanitizedFrameworks = selectedFrameworks.map(id => {
            const fw = frameworks.find(f => f.id === id);
            return fw ? DOMPurify.sanitize(fw.name, { ALLOWED_TAGS: [] }) : '';
          }).filter(Boolean).join(', ');

          const sanitizedReportLines = report.split('\n').map(line => {
            if (line.startsWith('#')) {
              const level = line.match(/^#+/)?.[0].length || 1;
              const text = line.replace(/^#+\s*/, '');
              const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
              return `<h${Math.min(level, 6)}>${sanitizedText}</h${Math.min(level, 6)}>`;
            }
            const sanitizedLine = DOMPurify.sanitize(line, { ALLOWED_TAGS: [] });
            return `<p>${sanitizedLine}</p>`;
          }).join('\n');

          const pdfContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Compliance Report - ${new Date().toLocaleDateString()}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                  h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
                  h2 { color: #374151; margin-top: 30px; }
                  .meta { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
                  .section { margin-bottom: 25px; }
                  @media print { body { padding: 20px; } @page { margin: 2cm; } }
                </style>
              </head>
              <body>
                <h1>Compliance Report</h1>
                <div class="meta">
                  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                  <p><strong>Date Range:</strong> ${reportOptions.startDate} to ${reportOptions.endDate}</p>
                  <p><strong>Frameworks:</strong> ${sanitizedFrameworks}</p>
                </div>
                <div class="section">${sanitizedReportLines}</div>
              </body>
            </html>
          `;

          const sanitizedPdfContent = DOMPurify.sanitize(pdfContent, {
            ALLOWED_TAGS: ['html', 'head', 'body', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'strong', 'em', 'br', 'style', 'title'],
            ALLOWED_ATTR: ['class', 'style'],
            ALLOW_DATA_ATTR: false
          });

          printWindow.document.write(sanitizedPdfContent);
          printWindow.document.close();

          setTimeout(() => {
            printWindow.print();
          }, 250);
        } catch (err: any) {
          setError(`PDF export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      setError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
          <p className="text-gray-500 mt-1">AI-powered compliance reporting and analytics</p>
        </div>
      </div>

      {reportsLimitReached && <TierLimitBanner message={getUpgradeMessage(plan, 'maxCustomReports', savedReportsCount)} />}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Frameworks', value: dashboardMetrics.totalFrameworks, icon: <Target className="w-5 h-5 text-blue-600" /> },
          { label: 'Avg. Progress', value: `${dashboardMetrics.avgProgress}%`, icon: <TrendingUp className="w-5 h-5 text-green-600" /> },
          { label: 'Compliant', value: dashboardMetrics.compliantFrameworks, icon: <ShieldCheck className="w-5 h-5 text-green-600" /> },
          { label: 'At Risk', value: dashboardMetrics.atRiskFrameworks, icon: <AlertTriangle className="w-5 h-5 text-yellow-600" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Report Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setViewMode('generate')}
          className="bg-white rounded-xl border p-6 hover:border-blue-200 transition text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Generate Report</h3>
          </div>
          <p className="text-sm text-gray-500">Create customizable compliance reports with AI-powered insights</p>
        </button>

        <button
          onClick={handleGenerateExecutiveSummary}
          disabled={aiLoading}
          className="bg-white rounded-xl border p-6 hover:border-purple-200 transition text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">AI Executive Summary</h3>
          </div>
          <p className="text-sm text-gray-500">Generate board-ready executive summary with AI analysis</p>
        </button>

        <button
          onClick={handleRunAutopilot}
          disabled={aiLoading}
          className="bg-white rounded-xl border p-6 hover:border-orange-200 transition text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Compliance Autopilot</h3>
          </div>
          <p className="text-sm text-gray-500">AI identifies gaps, proposes actions, and executes fixes</p>
        </button>

        <button
          onClick={handleGenerateRiskReport}
          disabled={aiLoading}
          className="bg-white rounded-xl border p-6 hover:border-red-200 transition text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Risk Report</h3>
          </div>
          <p className="text-sm text-gray-500">AI-powered risk analysis with predictive insights</p>
        </button>
      </div>

      {/* Additional Report Types */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Additional Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleGenerateVendorReport}
            disabled={aiLoading}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left disabled:opacity-50"
          >
            <Building2 className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="font-medium text-gray-900">Vendor Risk Report</h4>
              <p className="text-xs text-gray-500">Aggregated vendor risk scores</p>
            </div>
          </button>

          <button
            onClick={() => setViewMode('generate')}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
          >
            <ClipboardList className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Control Status Report</h4>
              <p className="text-xs text-gray-500">Detailed control implementation status</p>
            </div>
          </button>

          <button
            onClick={() => setViewMode('generate')}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
          >
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-gray-900">Audit Trail Report</h4>
              <p className="text-xs text-gray-500">Complete audit history and timeline</p>
            </div>
          </button>
        </div>
      </div>

      {/* Framework Progress Chart */}
      {frameworks.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Framework Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={frameworks.slice(0, 8).map(f => ({ name: f.name.slice(0, 15), progress: f.progress }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {frameworks.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // Render Report Generation
  const renderGenerate = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <h2 className="text-xl font-bold text-gray-900">Generate Compliance Report</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <FileText className="mr-2 text-brand-600" size={20} />
            Report Configuration
          </h3>

          <div className="space-y-6">
            {/* Framework Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Frameworks <span className="text-red-500">*</span>
              </label>
              {loadingFrameworks ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="animate-spin text-brand-600" size={20} />
                </div>
              ) : frameworks.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded">No frameworks available.</p>
              ) : (
                <div className="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto">
                  {frameworks.map(fw => (
                    <label key={fw.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFrameworks.includes(fw.id)}
                        onChange={() => handleFrameworkToggle(fw.id)}
                        className="mr-2"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{fw.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({fw.progress}%)</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedFrameworks.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">{selectedFrameworks.length} framework(s) selected</p>
              )}
            </div>

            {/* Customization Options */}
            <button
              onClick={() => setShowCustomization(!showCustomization)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Settings size={16} className="mr-1" />
              {showCustomization ? 'Hide' : 'Show'} Customization
              {showCustomization ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
            </button>

            {showCustomization && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Sections</label>
                  <div className="space-y-2">
                    {[
                      { key: 'executive_summary', label: 'Executive Summary' },
                      { key: 'frameworks', label: 'Framework Status' },
                      { key: 'controls', label: 'Control Status' },
                      { key: 'risks', label: 'Risk Summary' },
                      { key: 'evidence', label: 'Evidence Summary' },
                      { key: 'recommendations', label: 'Recommendations' },
                    ].map(section => (
                      <label key={section.key} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reportOptions.sections.includes(section.key as ReportSection)}
                          onChange={() => handleSectionToggle(section.key as ReportSection)}
                          className="mr-2"
                        />
                        <span className="text-sm">{section.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Start Date</label>
                      <input
                        type="date"
                        value={reportOptions.startDate}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">End Date</label>
                      <input
                        type="date"
                        value={reportOptions.endDate}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportOptions.includeEvidence}
                    onChange={(e) => setReportOptions(prev => ({ ...prev, includeEvidence: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Include Evidence Details</span>
                </label>
              </>
            )}

            <button
              onClick={handleGenerateReport}
              disabled={loading || selectedFrameworks.length === 0 || loadingFrameworks}
              className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="mr-2" size={18} />
                  AI Generate Report
                </>
              )}
            </button>

            {report && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700">Export Report</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('JSON')}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    <Download size={16} className="mr-2" />
                    JSON
                  </button>
                  <button
                    onClick={() => handleExport('PDF')}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    <Download size={16} className="mr-2" />
                    PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-200px)]">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-700">Report Preview</h3>
            {report && (
              <div className="flex items-center text-xs text-gray-500">
                <Calendar size={14} className="mr-1" />
                Generated: {new Date().toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {report ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FileText size={64} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No report generated yet</p>
                <p className="text-sm">Select frameworks and click generate to create a report</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Executive Summary
  const renderExecutiveSummary = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <Brain className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Executive Summary</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600">AI is generating executive summary...</span>
        </div>
      )}

      {executiveSummary && !aiLoading && (
        <>
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Overall Compliance Score</h3>
                <p className="text-purple-100 text-sm">Based on all frameworks and controls</p>
              </div>
              <div className="text-5xl font-bold">{executiveSummary.overallComplianceScore}%</div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Controls', value: executiveSummary.keyMetrics?.totalControls || 0, icon: <ClipboardList className="w-5 h-5 text-blue-600" /> },
              { label: 'Compliant', value: executiveSummary.keyMetrics?.compliantControls || 0, icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
              { label: 'Open Issues', value: executiveSummary.keyMetrics?.openIssues || 0, icon: <AlertCircle className="w-5 h-5 text-yellow-600" /> },
              { label: 'Overdue Tasks', value: executiveSummary.keyMetrics?.overdueTasks || 0, icon: <Clock className="w-5 h-5 text-red-600" /> },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Narrative */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Executive Narrative</h3>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{executiveSummary.narrative || 'No narrative available.'}</ReactMarkdown>
            </div>
          </div>

          {/* Framework Summaries */}
          {executiveSummary.frameworkSummaries && executiveSummary.frameworkSummaries.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Framework Status</h3>
              <div className="space-y-3">
                {executiveSummary.frameworkSummaries.map((fw, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {fw.trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                       fw.trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-600" /> :
                       <Minus className="w-4 h-4 text-gray-400" />}
                      <span className="font-medium text-gray-900">{fw.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${fw.score}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-12 text-right">{fw.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {executiveSummary.recommendations && executiveSummary.recommendations.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Key Recommendations</h3>
              <ul className="space-y-2">
                {executiveSummary.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Export */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                const data = JSON.stringify(executiveSummary, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `executive-summary-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Export JSON
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Render Autopilot
  const renderAutopilot = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <Zap className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-gray-900">Compliance Autopilot Report</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mr-3" />
          <span className="text-gray-600">AI Autopilot is running...</span>
        </div>
      )}

      {autopilotResult && !aiLoading && (
        <>
          {/* Summary */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-orange-800">Autopilot Summary</h3>
              </div>
              <div className="text-2xl font-bold text-orange-700">Score: {autopilotResult.overallScore || 0}%</div>
            </div>
            <p className="text-sm text-orange-700">{autopilotResult.summary || 'Autopilot analysis complete.'}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Gaps Identified', value: autopilotResult.gapsIdentified?.length || 0, color: 'text-red-600' },
              { label: 'Actions Proposed', value: autopilotResult.actionsProposed?.length || 0, color: 'text-yellow-600' },
              { label: 'Actions Executed', value: autopilotResult.actionsExecuted?.length || 0, color: 'text-green-600' },
              { label: 'Requiring Approval', value: autopilotResult.itemsRequiringApproval?.length || 0, color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Gaps Identified */}
          {autopilotResult.gapsIdentified && autopilotResult.gapsIdentified.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> Gaps Identified
              </h3>
              <div className="space-y-3">
                {autopilotResult.gapsIdentified.map((gap, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLORS[gap.severity] || 'bg-gray-100 text-gray-700'}`}>
                      {gap.severity}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{gap.gap}</p>
                      <p className="text-xs text-gray-500 mt-1">Framework: {gap.framework}</p>
                      <p className="text-sm text-gray-600 mt-1">{gap.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Proposed */}
          {autopilotResult.actionsProposed && autopilotResult.actionsProposed.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Play className="w-4 h-4 text-yellow-500" /> Actions Proposed
              </h3>
              <div className="space-y-2">
                {autopilotResult.actionsProposed.map((action, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">{action.priority}</span>
                      <span className="text-sm text-gray-900">{action.action}</span>
                    </div>
                    <span className="text-xs text-gray-500">{action.estimatedEffort}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Executed */}
          {autopilotResult.actionsExecuted && autopilotResult.actionsExecuted.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> Actions Executed
              </h3>
              <div className="space-y-2">
                {autopilotResult.actionsExecuted.map((action, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-900">{action.action}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(action.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Requiring Approval */}
          {autopilotResult.itemsRequiringApproval && autopilotResult.itemsRequiringApproval.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" /> Requiring Approval
              </h3>
              <div className="space-y-2">
                {autopilotResult.itemsRequiringApproval.map((item, i) => (
                  <div key={i} className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-gray-900">{item.item}</p>
                    <p className="text-sm text-gray-600 mt-1">Reason: {item.reason}</p>
                    <p className="text-sm text-purple-600 mt-1">Suggested: {item.suggestedAction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Risk Report
  const renderRiskReport = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Risk Report</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mr-3" />
          <span className="text-gray-600">AI is analyzing risks...</span>
        </div>
      )}

      {riskReport && !aiLoading && (
        <>
          {/* Risk Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Risks', value: riskReport.totalRisks || 0, color: 'text-gray-900' },
              { label: 'Critical', value: riskReport.criticalRisks || 0, color: 'text-red-600' },
              { label: 'High', value: riskReport.highRisks || 0, color: 'text-orange-600' },
              { label: 'Medium', value: riskReport.mediumRisks || 0, color: 'text-yellow-600' },
              { label: 'Low', value: riskReport.lowRisks || 0, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          {riskReport.summary && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="font-semibold text-red-800 mb-2">AI Risk Analysis</h3>
              <p className="text-sm text-red-700">{riskReport.summary}</p>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {riskReport.risksByCategory && riskReport.risksByCategory.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Risks by Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={riskReport.risksByCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                      {riskReport.risksByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {riskReport.trends && riskReport.trends.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Risk Trends</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={riskReport.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Risks */}
          {riskReport.topRisks && riskReport.topRisks.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Top Risks</h3>
              <div className="space-y-2">
                {riskReport.topRisks.map((risk, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[risk.severity] || 'bg-gray-100'}`}>
                        {risk.severity}
                      </span>
                      <span className="font-medium text-gray-900">{risk.title}</span>
                      {risk.framework && <span className="text-xs text-gray-500">({risk.framework})</span>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${risk.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {risk.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Vendor Report
  const renderVendorReport = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <Building2 className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Vendor Risk Report</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mr-3" />
          <span className="text-gray-600">AI is analyzing vendor risks...</span>
        </div>
      )}

      {vendorReport && !aiLoading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Vendors', value: vendorReport.totalVendors || 0 },
              { label: 'High Risk Vendors', value: vendorReport.highRiskVendors || 0, color: 'text-red-600' },
              { label: 'Average Score', value: `${vendorReport.averageScore || 0}%` },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
                <p className={`text-3xl font-bold ${s.color || 'text-gray-900'}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          {vendorReport.summary && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <h3 className="font-semibold text-indigo-800 mb-2">AI Vendor Analysis</h3>
              <p className="text-sm text-indigo-700">{vendorReport.summary}</p>
            </div>
          )}

          {/* By Risk Level */}
          {vendorReport.vendorsByRiskLevel && vendorReport.vendorsByRiskLevel.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Vendors by Risk Level</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={vendorReport.vendorsByRiskLevel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]}>
                    {vendorReport.vendorsByRiskLevel.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Risky Vendors */}
          {vendorReport.topRiskyVendors && vendorReport.topRiskyVendors.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">High Risk Vendors</h3>
              <div className="space-y-2">
                {vendorReport.topRiskyVendors.map((vendor, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        vendor.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                        vendor.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {vendor.riskLevel}
                      </span>
                      <span className="font-medium text-gray-900">{vendor.name}</span>
                      <span className="text-xs text-gray-500">Data Access: {vendor.dataAccess}</span>
                    </div>
                    <span className="font-bold text-gray-700">{vendor.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Main render
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'generate' && renderGenerate()}
      {viewMode === 'executive-summary' && renderExecutiveSummary()}
      {viewMode === 'autopilot' && renderAutopilot()}
      {viewMode === 'risk-report' && renderRiskReport()}
      {viewMode === 'vendor-report' && renderVendorReport()}
    </div>
  );
};
