import React, { useState } from 'react';
import { analyzeContract } from '../../services/geminiService';
import { Search, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ContractAnalyzer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text) return;
    setLoading(true);
    const result = await analyzeContract(text);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">Vendor Contract Analyzer</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="flex flex-col space-y-4">
          <textarea 
            className="flex-1 w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 resize-none font-mono text-sm"
            placeholder="Paste contract text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button 
            onClick={handleAnalyze}
            disabled={loading || !text}
            className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" size={18} />}
            Analyze for GDPR/Security Risks
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
          {analysis ? (
            <div className="prose prose-sm max-w-none">
              <h3 className="flex items-center text-brand-700"><Search className="mr-2" size={20}/> AI Analysis Report</h3>
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <AlertTriangle size={48} className="mb-2" />
              <p>Paste a contract to detect missing DPA clauses or risks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};