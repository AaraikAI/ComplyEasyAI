import React, { useState } from 'react';
import { scoreVendorRisk } from '../../services/geminiService';
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const VendorScorer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [vendor, setVendor] = useState('');
  const [service, setService] = useState('');
  const [data, setData] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    if(!vendor) return;
    setLoading(true);
    const text = await scoreVendorRisk(vendor, service, data);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">Vendor Risk Scorer</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 h-fit">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
              <input value={vendor} onChange={e => setVendor(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. Acme Analytics"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <input value={service} onChange={e => setService(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. Marketing Automation"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Access</label>
              <select value={data} onChange={e => setData(e.target.value)} className="w-full p-2 border rounded-lg">
                <option value="">Select Access Level</option>
                <option>No PII Access</option>
                <option>Read-Only Customer PII</option>
                <option>Full Database Access</option>
                <option>Payment/Health Data (PCI/HIPAA)</option>
              </select>
            </div>
            <button onClick={handleScore} disabled={loading || !data} className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 flex justify-center items-center">
               {loading ? <Loader2 className="animate-spin"/> : 'Calculate Risk'}
            </button>
         </div>
         <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {result ? (
               <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{result}</ReactMarkdown>
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                  <ShieldAlert size={48} className="mb-2"/>
                  <p>Enter vendor details to assess security risk.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};