import React, { useState } from 'react';
import { performGapAnalysis } from '../../services/geminiService';
import { ArrowLeft, Loader2, GitMerge } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { INITIAL_FRAMEWORKS } from '../../constants';

export const GapAnalysis: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [target, setTarget] = useState('HIPAA');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const currentFws = INITIAL_FRAMEWORKS.map(f => f.name);

  const handleRun = async () => {
    setLoading(true);
    const text = await performGapAnalysis(currentFws, target);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">Compliance Gap Analysis</h2>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-end gap-4 mb-8">
           <div className="flex-1 min-w-[200px]">
             <label className="block text-sm font-medium text-gray-500 mb-1">Current Frameworks</label>
             <div className="p-3 bg-gray-100 rounded-lg text-gray-700">{currentFws.join(', ')}</div>
           </div>
           <div className="flex items-center pb-3 text-gray-400"><GitMerge size={24} className="rotate-90 md:rotate-0"/></div>
           <div className="flex-1 min-w-[200px]">
             <label className="block text-sm font-medium text-gray-700 mb-1">Target Framework</label>
             <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full p-3 border rounded-lg">
                <option>HIPAA</option>
                <option>ISO 27001</option>
                <option>NIST 800-53</option>
                <option>PCI DSS</option>
             </select>
           </div>
           <button onClick={handleRun} disabled={loading} className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 h-fit">
              {loading ? <Loader2 className="animate-spin" /> : 'Run Analysis'}
           </button>
        </div>

        {result && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
             <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};