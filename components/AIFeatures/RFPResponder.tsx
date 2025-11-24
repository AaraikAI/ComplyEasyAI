import React, { useState } from 'react';
import { generateRFPResponse } from '../../services/geminiService';
import { FileText, Loader2, ArrowLeft, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const RFPResponder: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [context, setContext] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if(!question) return;
    setLoading(true);
    const result = await generateRFPResponse(question, context || 'Standard enterprise security posture.');
    setAnswer(result);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">RFP Auto-Responder</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Context</label>
            <textarea 
               value={context} onChange={e => setContext(e.target.value)}
               placeholder="Briefly describe your security stack (e.g. AWS, Encrypted, SOC2 Certified)..."
               className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Questionnaire Item</label>
            <textarea 
               value={question} onChange={e => setQuestion(e.target.value)}
               placeholder="Paste the question from the excel sheet/portal..."
               className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
            />
          </div>
          <button 
             onClick={handleGenerate} disabled={loading || !question}
             className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 flex justify-center items-center shadow-lg"
          >
             {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} className="mr-2"/> Generate Answer</>}
          </button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
          {answer ? (
             <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{answer}</ReactMarkdown>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText size={48} className="mb-2" />
                <p>Generated answer will appear here.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};