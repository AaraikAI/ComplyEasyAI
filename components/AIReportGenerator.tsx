import React, { useState, useEffect } from 'react';
import { generateComplianceReport } from '../services/geminiService';
import { FileText, Loader2, Download, RefreshCw, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { ComplianceFramework } from '../types';
import { useI18n } from '../contexts/I18nContext';
import { logger } from '../utils/logger';

export const AIReportGenerator: React.FC = () => {
  const { t } = useI18n();
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [framework, setFramework] = useState('SOC 2');
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [context, setContext] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    const loadFrameworks = async () => {
      try {
        setLoadingFrameworks(true);
        const allFrameworks = await api.frameworks.list();
        setFrameworks(allFrameworks);
        if (allFrameworks.length > 0 && !allFrameworks.find(f => f.name === framework)) {
          setFramework(allFrameworks[0].name);
        }
      } catch (error) {
        logger.error('Failed to load frameworks:', error);
        // Fallback to default frameworks
        setFrameworks([
          { id: '1', name: 'SOC 2 Type II', status: 'In Review' as any, progress: 0, nextAuditDate: new Date().toISOString() },
          { id: '2', name: 'GDPR', status: 'In Review' as any, progress: 0, nextAuditDate: new Date().toISOString() },
          { id: '3', name: 'HIPAA', status: 'In Review' as any, progress: 0, nextAuditDate: new Date().toISOString() },
          { id: '4', name: 'ISO 27001', status: 'In Review' as any, progress: 0, nextAuditDate: new Date().toISOString() },
        ]);
      } finally {
        setLoadingFrameworks(false);
      }
    };
    loadFrameworks();
  }, []);

  const handleGenerate = async () => {
    if (!context) return;
    setLoading(true);
    setReport(null);
    setGenerateError(null);
    try {
      const result = await generateComplianceReport(framework, companyName, context);
      setReport(result);
    } catch (error) {
      logger.error('Failed to generate compliance report:', error);
      setGenerateError('Failed to generate the report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const safeName = `${companyName || 'company'}-${framework}`.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}-compliance-report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Configuration Panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <FileText className="mr-2 text-brand-600" size={20} />
          Report Configuration
        </h3>

        <div className="space-y-6 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Framework</label>
            {loadingFrameworks ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                <Loader2 className="animate-spin mr-2" size={16} />
                <span className="text-gray-500">{t('common.loading')}...</span>
              </div>
            ) : (
              <select 
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                {frameworks.length > 0 ? (
                  frameworks.map(fw => (
                    <option key={fw.id} value={fw.name}>{fw.name}</option>
                  ))
                ) : (
                  <>
                    <option value="SOC 2">SOC 2 Type II</option>
                    <option value="GDPR">GDPR</option>
                    <option value="HIPAA">HIPAA</option>
                    <option value="ISO 27001">ISO 27001</option>
                  </>
                )}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input 
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audit Context / Data Scope</label>
            <textarea 
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="E.g., We have migrated our database to AWS RDS encrypted with KMS. We perform quarterly access reviews. Employees have completed security training."
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-2">
              Provide context about your current infrastructure and processes for the AI to analyze.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !context}
          className={`
            w-full mt-6 flex items-center justify-center py-3 rounded-lg text-white font-medium transition-all
            ${loading || !context ? 'bg-gray-300 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/30'}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              {t('ai.analyzing')}...
            </>
          ) : (
            <>
              <Send className="mr-2" size={20} />
              {t('ai.generating')}
            </>
          )}
        </button>
      </div>

      {/* Report Preview Panel */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">Report Preview</h3>
          <div className="flex space-x-2">
             <button
              onClick={handleGenerate}
              disabled={loading || !context}
              className="p-2 text-gray-500 hover:text-brand-600 hover:bg-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={t('common.refresh')}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleDownload}
              disabled={!report}
              className="p-2 text-gray-500 hover:text-brand-600 hover:bg-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={t('common.export')}
            >
              <Download size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          {generateError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {generateError}
            </div>
          )}
          {report ? (
             <div className="prose prose-sm prose-slate max-w-none">
                {/* We can use ReactMarkdown here for safety rendering if installed, but for simplicity in this prompt structure we might just dump text or simulate markdown rendering */}
                {/* Since we can't easily import external complex MD renderers in this strict setup without bundling, we will use basic whitespace handling or a simple simulated view */}
                <div className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                   {report}
                </div>
             </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium">No report generated yet</p>
              <p className="text-sm">Enter context and click generate to start.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIReportGenerator;