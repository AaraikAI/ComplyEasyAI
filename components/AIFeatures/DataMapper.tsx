import React, { useState, useEffect } from 'react';
import { mapGDPRData } from '../../services/geminiService';
import { Database, Loader2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const DataMapper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [process, setProcess] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdDate, setCreatedDate] = useState<string>('');
  const [lastUpdateDate, setLastUpdateDate] = useState<string>('');

  useEffect(() => {
    // Set initial creation date
    const now = new Date();
    setCreatedDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    setLastUpdateDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const handleMap = async () => {
    if(!process.trim()) return;
    
    setLoading(true);
    const now = new Date();
    setLastUpdateDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    
    try {
      const text = await mapGDPRData(process);
      // Inject dates into the result
      const resultWithDates = text.replace(
        /Date of Creation\/Last Update:.*/g,
        `Date of Creation: ${createdDate}\nLast Update: ${lastUpdateDate}`
      );
      setResult(resultWithDates);
    } catch (error) {
      console.error('Error mapping data:', error);
      setResult('Error generating data map. Please try again.');
    } finally {
      setLoading(false);
    }
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
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
               />
            </div>
            <button onClick={handleMap} disabled={loading || !process.trim()} className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center h-[50px]">
               {loading ? <Loader2 className="animate-spin"/> : 'Map Data Flows'}
            </button>
         </div>
         {result && (
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 prose prose-sm max-w-none">
               <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Date of Creation: <span className="font-normal">{createdDate}</span></p>
                  <p className="text-sm font-medium text-gray-700">Last Update: <span className="font-normal">{lastUpdateDate}</span></p>
               </div>
               <ReactMarkdown>{result}</ReactMarkdown>
            </div>
         )}
      </div>
    </div>
  );
};
