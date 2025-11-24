import React, { useState } from 'react';
import { generatePolicy } from '../../services/geminiService';
import { FileText, Loader2, Save, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const PolicyGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [type, setType] = useState('Data Retention');
  const [company, setCompany] = useState('My Company');
  const [tone, setTone] = useState('Strict');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const text = await generatePolicy(type, company, tone);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">AI Policy Generator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded-lg">
                <option>Data Retention</option>
                <option>Access Control</option>
                <option>Incident Response</option>
                <option>Acceptable Use</option>
                <option>Remote Work</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full p-2 border rounded-lg" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2 border rounded-lg">
                <option>Strict</option>
                <option>Standard</option>
                <option>Employee-Friendly</option>
              </select>
            </div>
            <button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Generate Policy'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto max-h-[70vh]">
          {result ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileText size={48} className="mb-2" />
              <p>Configure and generate to see your policy here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};