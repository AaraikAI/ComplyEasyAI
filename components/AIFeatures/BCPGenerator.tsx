import React, { useState } from 'react';
import { generateBCP } from '../../services/geminiService';
import { LifeBuoy, Loader2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const BCPGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [scenario, setScenario] = useState('Ransomware Attack');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const text = await generateBCP(scenario);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">BCP Generator</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-1 space-y-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Disaster Scenario</label>
                <select value={scenario} onChange={e => setScenario(e.target.value)} className="w-full p-2 border rounded-lg mb-4">
                   <option>Ransomware Attack</option>
                   <option>Office Fire / Flood</option>
                   <option>Key Personnel Loss</option>
                   <option>Cloud Provider Outage (AWS Down)</option>
                   <option>Data Breach (Customer PII)</option>
                </select>
                <button onClick={handleGenerate} disabled={loading} className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 flex justify-center items-center">
                   {loading ? <Loader2 className="animate-spin"/> : 'Generate Plan'}
                </button>
             </div>
         </div>
         <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
             {result ? (
                <div className="prose prose-sm max-w-none">
                   <ReactMarkdown>{result}</ReactMarkdown>
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                   <LifeBuoy size={64} className="mb-4 opacity-50"/>
                   <p className="text-lg">Select a disaster scenario to generate a continuity checklist.</p>
                </div>
             )}
         </div>
      </div>
    </div>
  );
};