import React, { useState } from 'react';
import { generateBCP } from '../../services/geminiService';
import { LifeBuoy, Loader2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DISASTER_SCENARIOS = [
  'Ransomware Attack',
  'Office Fire / Flood',
  'Key Personnel Loss',
  'Cloud Provider Outage (AWS Down)',
  'Data Breach (Customer PII)',
  'Natural Disaster (Earthquake, Hurricane)',
  'Cyber Attack (DDoS)',
  'Power Outage',
  'Network Infrastructure Failure',
  'Supply Chain Disruption',
  'Pandemic / Health Crisis',
  'Regulatory Compliance Failure',
  'Vendor Service Interruption',
  'Physical Security Breach',
  'Data Center Failure',
];

export const BCPGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [scenario, setScenario] = useState('Ransomware Attack');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult('');
    try {
      const text = await generateBCP(scenario);
      // Add today's date to the generated document
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const dateHeader = `**Document Generated:** ${formattedDate}\n\n`;
      setResult(dateHeader + text);
    } catch (error) {
      console.error('Error generating BCP:', error);
      setResult('Error generating business continuity plan. Please try again.');
    } finally {
      setLoading(false);
    }
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
                <select
                  value={scenario}
                  onChange={e => setScenario(e.target.value)}
                  className="w-full p-2 border rounded-lg mb-4 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {DISASTER_SCENARIOS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                   {loading ? (
                     <>
                       <Loader2 className="animate-spin mr-2"/>
                       Generating...
                     </>
                   ) : (
                     'Generate Plan'
                   )}
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
