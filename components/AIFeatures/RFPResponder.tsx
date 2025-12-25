import React, { useState } from 'react';
import { generateRFPResponse } from '../../services/geminiService';
import { FileText, Loader2, ArrowLeft, Send, AlertTriangle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const MAX_QUESTION_LENGTH = 10000; // 10k characters

export const RFPResponder: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [context, setContext] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectMultipleQuestions = (text: string): string[] => {
    // Detect multiple questions by looking for question marks followed by newlines or numbers
    const questions: string[] = [];
    const lines = text.split('\n');
    let currentQuestion = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Check if line looks like a question (ends with ? or starts with number/bullet)
      if (trimmedLine.endsWith('?') || /^(\d+[\.\)]|\-|\*)\s/.test(trimmedLine)) {
        if (currentQuestion) {
          questions.push(currentQuestion.trim());
        }
        currentQuestion = trimmedLine;
      } else if (trimmedLine.length > 0) {
        currentQuestion += (currentQuestion ? ' ' : '') + trimmedLine;
      } else if (currentQuestion) {
        // Empty line - end of current question
        questions.push(currentQuestion.trim());
        currentQuestion = '';
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion.trim());
    }

    // If no clear separation found, treat as single question
    return questions.length > 1 ? questions : [text];
  };

  const handleGenerate = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setError(null);
    setLoading(true);
    setAnswer('');

    try {
      // Check if question is too long
      if (question.length > MAX_QUESTION_LENGTH) {
        setError(`Question is very long (${question.length} characters). Processing first ${MAX_QUESTION_LENGTH} characters...`);
        const truncatedQuestion = question.substring(0, MAX_QUESTION_LENGTH) + '\n\n[Question truncated due to length...]';
        const result = await generateRFPResponse(truncatedQuestion, context || 'Standard enterprise security posture.');
        setAnswer(result);
        return;
      }

      // Detect multiple questions
      const questions = detectMultipleQuestions(question);
      
      if (questions.length > 1) {
        // Handle multiple questions
        setAnswer('Processing multiple questions...\n\n');
        const answers: string[] = [];
        
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (q.trim().length === 0) continue;
          
          try {
            const response = await generateRFPResponse(q, context || 'Standard enterprise security posture.');
            answers.push(`**Question ${i + 1}:**\n${q}\n\n**Answer:**\n${response}\n\n---\n\n`);
          } catch (err: any) {
            answers.push(`**Question ${i + 1}:**\n${q}\n\n**Answer:**\nError processing this question: ${err.message || 'Unknown error'}\n\n---\n\n`);
          }
        }
        
        setAnswer(answers.join(''));
      } else {
        // Single question
        const result = await generateRFPResponse(question, context || 'Standard enterprise security posture.');
        setAnswer(result);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate RFP response. Please try again.';
      setError(errorMessage);
      setAnswer('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">RFP Auto-Responder</h2>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-yellow-800 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-yellow-600 hover:text-yellow-800">
            <X size={18} />
          </button>
        </div>
      )}

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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Questionnaire Item(s) <span className="text-gray-400 font-normal">(Supports multiple questions)</span>
            </label>
            <textarea 
               value={question} onChange={e => setQuestion(e.target.value)}
               placeholder="Paste the question(s) from the excel sheet/portal. You can paste multiple questions separated by new lines..."
               className="w-full h-64 p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-400">
                {question.length.toLocaleString()} / {MAX_QUESTION_LENGTH.toLocaleString()} characters
                {question.length > MAX_QUESTION_LENGTH && ' (will be truncated)'}
              </p>
              {detectMultipleQuestions(question).length > 1 && (
                <p className="text-xs text-brand-600 font-medium">
                  {detectMultipleQuestions(question).length} question(s) detected
                </p>
              )}
            </div>
          </div>
          <button 
             onClick={handleGenerate} disabled={loading || !question.trim()}
             className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg"
          >
             {loading ? (
               <>
                 <Loader2 className="animate-spin mr-2" />
                 Generating Answer{detectMultipleQuestions(question).length > 1 ? 's' : ''}...
               </>
             ) : (
               <>
                 <Send size={18} className="mr-2"/>
                 Generate Answer{detectMultipleQuestions(question).length > 1 ? 's' : ''}
               </>
             )}
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
                <p>Generated answer(s) will appear here.</p>
                <p className="text-xs mt-2">Supports single or multiple questions</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
