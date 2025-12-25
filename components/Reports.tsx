import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ComplianceFramework } from '../types';
import { FileText, Loader2, Download, Calendar, CheckSquare, AlertTriangle, X, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateComplianceReport } from '../services/geminiService';

type ReportFormat = 'PDF' | 'JSON';
type ReportSection = 'executive_summary' | 'frameworks' | 'controls' | 'risks' | 'evidence' | 'recommendations' | 'audit_trail';

interface ReportOptions {
  frameworks: string[];
  sections: ReportSection[];
  startDate: string;
  endDate: string;
  includeEvidence: boolean;
}

export const Reports: React.FC = () => {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    frameworks: [],
    sections: ['executive_summary', 'frameworks', 'controls', 'risks', 'recommendations'],
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
    endDate: new Date().toISOString().split('T')[0],
    includeEvidence: true,
  });
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  useEffect(() => {
    const loadFrameworks = async () => {
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
    loadFrameworks();
  }, []);

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
    // Validation
    if (selectedFrameworks.length === 0) {
      setError('Please select at least one framework');
      return;
    }

    // Check if selected frameworks have controls
    const selectedFwData = frameworks.filter(f => selectedFrameworks.includes(f.id));
    const frameworksWithoutControls = selectedFwData.filter(f => !f.controls || f.controls.length === 0);
    
    if (frameworksWithoutControls.length > 0 && reportOptions.sections.includes('controls')) {
      setError(`Warning: ${frameworksWithoutControls.map(f => f.name).join(', ')} have no controls. They will be excluded from the controls section.`);
      // Continue anyway, just show warning
    }

    setError(null);
    setLoading(true);
    setReport(null);

    try {
      // Build context from selected frameworks
      const selectedFrameworksData = frameworks.filter(f => selectedFrameworks.includes(f.id));
      const context = selectedFrameworksData.map(fw => {
        const controls = fw.controls || [];
        const compliantControls = controls.filter((c: any) => c.status === 'Compliant' || c.status === 'Implemented').length;
        return `${fw.name}: ${fw.progress}% complete, ${compliantControls}/${controls.length} controls compliant, Status: ${fw.status}`;
      }).join('\n');

      // Generate report for first framework (or combine if multiple)
      const primaryFramework = selectedFrameworksData[0];
      const companyName = 'Your Organization'; // Could be fetched from organization data

      // Set timeout for very large reports (60 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Report generation timeout. The report is very large. Please try with fewer frameworks or a shorter date range.')), 60000);
      });

      const reportPromise = generateComplianceReport(
        primaryFramework.name,
        companyName,
        context
      );

      const reportText = await Promise.race([reportPromise, timeoutPromise]) as string;

      // Build full report with all sections
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
        } catch (err) {
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
      const errorMessage = err.message || 'Failed to generate report. Please try again.';
      setError(errorMessage);
      setReport(null);
    } finally {
      setLoading(false);
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
          dateRange: {
            start: reportOptions.startDate,
            end: reportOptions.endDate,
          },
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
        // PDF export - simplified (in production, use a library like jsPDF or pdfmake)
        setError('PDF export requires additional setup. JSON export is available.');
      }
    } catch (err: any) {
      setError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compliance Reports</h2>
          <p className="text-sm text-gray-500">Generate comprehensive compliance reports for audits and reviews</p>
        </div>
        <button
          onClick={() => setShowCustomization(!showCustomization)}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <Settings size={18} className="mr-2" />
          Customization
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

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
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded">No frameworks available. Please create frameworks first.</p>
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

                <div>
                  <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportOptions.includeEvidence}
                      onChange={(e) => setReportOptions(prev => ({ ...prev, includeEvidence: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Include Evidence Details</span>
                  </label>
                </div>
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
                  <FileText className="mr-2" size={18} />
                  Generate Report
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
};

