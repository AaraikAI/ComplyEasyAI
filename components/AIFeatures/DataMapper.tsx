import React, { useState, useEffect } from 'react';
import { mapGDPRData } from '../../services/geminiService';
import { Database, Loader2, ArrowLeft, Shield, Globe, Clock, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../services/api';

export const DataMapper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [process, setProcess] = useState('');
  const [map, setMap] = useState('');
  const [piiIdentified, setPiiIdentified] = useState<Array<{type: string; location: string; sensitivity: string}>>([]);
  const [crossBorderTransfers, setCrossBorderTransfers] = useState<Array<{destination: string; legalBasis: string; safeguards: string}>>([]);
  const [retentionPeriods, setRetentionPeriods] = useState<Array<{dataType: string; period: string; reason: string}>>([]);
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
      const result = await api.ai.generateDataMap(process) as any;
      setMap((result as any).map || '');
      setPiiIdentified((result as any).piiIdentified || []);
      setCrossBorderTransfers((result as any).crossBorderTransfers || []);
      setRetentionPeriods((result as any).retentionPeriods || []);
    } catch (error: any) {
      console.error('Error mapping data:', error);
      setMap('Error generating data map. Please try again.');
      setPiiIdentified([]);
      setCrossBorderTransfers([]);
      setRetentionPeriods([]);
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
         {map && (
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 prose prose-sm max-w-none">
                <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Date of Creation: <span className="font-normal">{createdDate}</span></p>
                  <p className="text-sm font-medium text-gray-700">Last Update: <span className="font-normal">{lastUpdateDate}</span></p>
                </div>
                <ReactMarkdown>{map}</ReactMarkdown>
              </div>

              {/* PII Identification */}
              {piiIdentified.length > 0 && (
                <div className="p-6 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="text-red-600" size={20} />
                    <h3 className="text-lg font-semibold">PII Identified</h3>
                  </div>
                  <div className="space-y-3">
                    {piiIdentified.map((pii, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-900">{pii.type}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            pii.sensitivity === 'High' ? 'bg-red-100 text-red-800' :
                            pii.sensitivity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {pii.sensitivity} Sensitivity
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Location: {pii.location}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cross-Border Transfers */}
              {crossBorderTransfers.length > 0 && (
                <div className="p-6 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="text-blue-600" size={20} />
                    <h3 className="text-lg font-semibold">Cross-Border Data Transfers</h3>
                  </div>
                  <div className="space-y-3">
                    {crossBorderTransfers.map((transfer, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-900 mb-1">Destination: {transfer.destination}</p>
                        <p className="text-sm text-gray-600 mb-1"><strong>Legal Basis:</strong> {transfer.legalBasis}</p>
                        <p className="text-sm text-gray-600"><strong>Safeguards:</strong> {transfer.safeguards}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Retention Periods */}
              {retentionPeriods.length > 0 && (
                <div className="p-6 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="text-purple-600" size={20} />
                    <h3 className="text-lg font-semibold">Data Retention Periods</h3>
                  </div>
                  <div className="space-y-3">
                    {retentionPeriods.map((retention, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-900">{retention.dataType}</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                            {retention.period}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Reason: {retention.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
         )}
      </div>
    </div>
  );
};
