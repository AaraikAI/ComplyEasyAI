import React, { useState } from 'react';
import { generateBCP } from '../../services/geminiService';
import { LifeBuoy, Loader2, ArrowLeft, Users, Clock, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';

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
  const [rto, setRto] = useState('4 hours');
  const [rpo, setRpo] = useState('1 hour');
  const [plan, setPlan] = useState('');
  const [contactTree, setContactTree] = useState<Array<{role: string; name: string; contact: string; priority: number}>>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setPlan('');
    setContactTree([]);
    try {
      const result = await api.ai.generateBCP(scenario, rto, rpo);
      
      // Handle response - could be object or string
      let planText = '';
      let contactTreeData: Array<{role: string; name: string; contact: string; priority: number}> = [];
      
      if (typeof result === 'string') {
        // If result is a string, try to parse it as JSON
        try {
          const parsed = JSON.parse(result);
          planText = typeof parsed.plan === 'string' ? parsed.plan : (parsed.plan || result);
          contactTreeData = Array.isArray(parsed.contactTree) ? parsed.contactTree : [];
        } catch {
          // If not JSON, use as-is
          planText = result;
        }
      } else if (result && typeof result === 'object') {
        // If result is an object, extract plan and contactTree
        if (typeof (result as any).plan === 'string') {
          planText = (result as any).plan;
        } else if ((result as any).plan && typeof (result as any).plan === 'object') {
          // If plan is an object, stringify it (shouldn't happen, but handle it)
          planText = JSON.stringify((result as any).plan, null, 2);
        } else {
          planText = '';
        }
        contactTreeData = Array.isArray((result as any).contactTree) ? (result as any).contactTree : [];
      }
      
      // Clean up planText - remove any JSON structure if it's embedded
      // Check if planText contains escaped JSON (common when AI returns JSON as string)
      if (planText.includes('"plan":') || planText.includes('\\"plan\\"')) {
        // Try multiple extraction methods
        try {
          // Method 1: Try to parse as JSON directly
          const parsed = JSON.parse(planText);
          if (typeof parsed.plan === 'string') {
            planText = parsed.plan;
            if (Array.isArray(parsed.contactTree)) {
              contactTreeData = parsed.contactTree;
            }
          }
        } catch (e1) {
          // Method 2: Extract from escaped JSON string
          try {
            // Handle escaped JSON strings like: "{\"plan\":\"...\",\"contactTree\":[...]}"
            const unescaped = planText.replace(/\\"/g, '"').replace(/\\n/g, '\n');
            const jsonMatch = unescaped.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (typeof parsed.plan === 'string') {
                planText = parsed.plan;
                if (Array.isArray(parsed.contactTree)) {
                  contactTreeData = parsed.contactTree;
                }
              }
            }
          } catch (e2) {
            // Method 3: Try regex extraction for plan field
            const planMatch = planText.match(/"plan"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (planMatch && planMatch[1]) {
              planText = planMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            }
          }
        }
      }
      
      // Final cleanup: remove any remaining JSON artifacts
      if (planText.trim().startsWith('{') && planText.includes('"plan"')) {
        // If it still looks like JSON, try one more parse
        try {
          const parsed = JSON.parse(planText);
          if (typeof parsed.plan === 'string') {
            planText = parsed.plan;
          }
        } catch (e) {
          // If all parsing fails, keep the original text and surface a warning.
          logger.warn('Could not fully parse BCP response, displaying as-is');
        }
      }
      
      // Add header with date and RTO/RPO
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const dateHeader = `**Document Generated:** ${formattedDate}\n**RTO:** ${rto}\n**RPO:** ${rpo}\n\n`;
      
      setPlan(dateHeader + planText);
      setContactTree(contactTreeData);
    } catch (error: any) {
      logger.error('Error generating BCP:', error);
      setPlan('Error generating business continuity plan. Please try again.');
      setContactTree([]);
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
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Disaster Scenario</label>
                  <select
                    value={scenario}
                    onChange={e => setScenario(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    {DISASTER_SCENARIOS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Clock size={14} />
                    RTO (Recovery Time Objective)
                  </label>
                  <input
                    type="text"
                    value={rto}
                    onChange={e => setRto(e.target.value)}
                    placeholder="e.g., 4 hours"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Target size={14} />
                    RPO (Recovery Point Objective)
                  </label>
                  <input
                    type="text"
                    value={rpo}
                    onChange={e => setRpo(e.target.value)}
                    placeholder="e.g., 1 hour"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
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
         <div className="lg:col-span-3 space-y-6">
             {plan ? (
               <div className="space-y-6">
                 <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                   <div className="prose prose-sm max-w-none">
                     <ReactMarkdown>{plan}</ReactMarkdown>
                   </div>
                 </div>

                 {contactTree.length > 0 && (
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <div className="flex items-center gap-2 mb-4">
                       <Users className="text-brand-600" size={20} />
                       <h3 className="text-lg font-semibold">Contact Tree</h3>
                     </div>
                     <div className="space-y-2">
                       {contactTree
                         .sort((a, b) => a.priority - b.priority)
                         .map((contact, idx) => (
                           <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                             <div className="flex justify-between items-start">
                               <div>
                                 <p className="font-medium text-gray-900">{contact.role}</p>
                                 <p className="text-sm text-gray-600">{contact.name}</p>
                                 <p className="text-sm text-gray-500">{contact.contact}</p>
                               </div>
                               <span className="px-2 py-1 bg-brand-100 text-brand-800 rounded text-xs font-semibold">
                                 Priority {contact.priority}
                               </span>
                             </div>
                           </div>
                         ))}
                     </div>
                   </div>
                 )}
               </div>
             ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400 py-20">
                   <LifeBuoy size={64} className="mb-4 opacity-50"/>
                   <p className="text-lg">Select a disaster scenario and set RTO/RPO to generate a continuity plan.</p>
                </div>
             )}
         </div>
      </div>
    </div>
  );
};
