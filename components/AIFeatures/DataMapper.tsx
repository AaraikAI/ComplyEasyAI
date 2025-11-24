import React, { useState } from 'react';
import { mapGDPRData } from '../../services/geminiService';
import { Database, Loader2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const DataMapper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [process, setProcess] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMap = async () => {
    if(!process) return;
    setLoading(true);
    const text = await mapGDPRData(process);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">GDPR Data Mapper (RoPA)</h2>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
         <div className="flex gap-4 items-end mb-8">
            <div className="flex-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Business Process</label>
               <input 
                  value={process} onChange={e => setProcess(e.target.value)} 
                  placeholder="e.g. Employee Payroll Processing, Customer Support Ticket Handling..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500"
               />
            </div>
            <button onClick={handleMap} disabled={loading || !process} className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 flex items-center h-[50px]">
               {loading ? <Loader2 className="animate-spin"/> : 'Map Data Flows'}
            </button>
         </div>
         {result && (
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 prose prose-sm max-w-none">
               <ReactMarkdown>{result}</ReactMarkdown>
            </div>
         )}
      </div>
    </div>
  );
};