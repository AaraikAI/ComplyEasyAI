import React, { useState } from 'react';
import { generatePhishingSim } from '../../services/geminiService';
import { Mail, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

export const PhishingGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [department, setDepartment] = useState('Finance');
  const [theme, setTheme] = useState('Urgent Invoice');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const text = await generatePhishingSim(theme, department);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">Phishing Simulator</h2>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full p-2 border rounded-lg">
                <option>Finance</option>
                <option>HR</option>
                <option>Engineering</option>
                <option>Sales</option>
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Theme</label>
              <input value={theme} onChange={e => setTheme(e.target.value)} className="w-full p-2 border rounded-lg" />
           </div>
           <div className="flex items-end">
              <button onClick={handleGenerate} disabled={loading} className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 flex justify-center items-center">
                 {loading ? <Loader2 className="animate-spin" /> : 'Generate Campaign'}
              </button>
           </div>
        </div>
        {result && (
           <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 font-mono text-sm whitespace-pre-wrap">
              {result}
           </div>
        )}
      </div>
    </div>
  );
};