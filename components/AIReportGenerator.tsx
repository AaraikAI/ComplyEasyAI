import React, { useState } from 'react';
import { generateComplianceReport } from '../services/geminiService';
import { FileText, Loader2, Download, RefreshCw, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const AIReportGenerator: React.FC = () => {
  const [framework, setFramework] = useState('SOC 2');
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [context, setContext] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!context) return;
    setLoading(true);
    setReport(null);
    const result = await generateComplianceReport(framework, companyName, context);
    setReport(result);
    setLoading(false);
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
            <select 
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="SOC 2">SOC 2 Type II</option>
              <option value="GDPR">GDPR</option>
              <option value="HIPAA">HIPAA</option>
              <option value="ISO 27001">ISO 27001</option>
            </select>
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
              Analyzing with AI...
            </>
          ) : (
            <>
              <Send className="mr-2" size={20} />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Report Preview Panel */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">Report Preview</h3>
          <div className="flex space-x-2">
             <button className="p-2 text-gray-500 hover:text-brand-600 hover:bg-white rounded-lg transition-colors" title="Regenerate">
              <RefreshCw size={18} />
            </button>
            <button className="p-2 text-gray-500 hover:text-brand-600 hover:bg-white rounded-lg transition-colors" title="Export PDF">
              <Download size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto bg-white">
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