import React, { useState } from 'react';
import { generateRFPResponse } from '../../services/geminiService';
import { FileText, Loader2, ArrowLeft, Send, AlertTriangle, X, Download, Edit2, Save, XCircle, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';

const MAX_QUESTION_LENGTH = 10000; // 10k characters

interface RFPAnswer {
  question: string;
  answer: string;
  confidence: number;
  edited: boolean;
}

export const RFPResponder: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [context, setContext] = useState('');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<RFPAnswer[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
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
      if (trimmedLine.endsWith('?') || /^(\d+[.)]\s|-|\*)\s/.test(trimmedLine)) {
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
    setAnswers([]);

    try {
      // Check if question is too long
      if (question.length > MAX_QUESTION_LENGTH) {
        setError(`Question is very long (${question.length} characters). Processing first ${MAX_QUESTION_LENGTH} characters...`);
        const truncatedQuestion = question.substring(0, MAX_QUESTION_LENGTH) + '\n\n[Question truncated due to length...]';
        const result = await api.ai.generateRFPResponse(truncatedQuestion, context || 'Standard enterprise security posture.') as any;
        setAnswers([{
          question: truncatedQuestion,
          answer: (result as any).response || (result as any).answer || result,
          confidence: (result as any).confidence || 0.75,
          edited: false,
        }]);
        return;
      }

      // Detect multiple questions
      const questions = detectMultipleQuestions(question);
      const newAnswers: RFPAnswer[] = [];
      
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.trim().length === 0) continue;
        
        try {
          const result = await api.ai.generateRFPResponse(q, context || 'Standard enterprise security posture.') as any;
          newAnswers.push({
            question: q,
            answer: (result as any).response || result,
            confidence: (result as any).confidence || 0.75,
            edited: false,
          });
        } catch (err: any) {
          newAnswers.push({
            question: q,
            answer: `Error processing this question: ${err.message || 'Unknown error'}`,
            confidence: 0,
            edited: false,
          });
        }
      }
      
      setAnswers(newAnswers);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate RFP response. Please try again.';
      setError(errorMessage);
      setAnswers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(answers[index].answer);
  };

  const handleSaveEdit = (index: number) => {
    const updated = [...answers];
    updated[index] = { ...updated[index], answer: editText, edited: true };
    setAnswers(updated);
    setEditingIndex(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Question', 'Answer', 'Confidence', 'Edited'],
      ...answers.map(a => [
        a.question.replace(/"/g, '""'),
        a.answer.replace(/"/g, '""'),
        (a.confidence * 100).toFixed(1) + '%',
        a.edited ? 'Yes' : 'No'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfp-responses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    // Create HTML content for PDF with sanitization
    const sanitizedContext = DOMPurify.sanitize(context || 'Not provided', { ALLOWED_TAGS: [] });
    const sanitizedAnswers = answers.map((a, i) => {
      const sanitizedQuestion = DOMPurify.sanitize(a.question, { ALLOWED_TAGS: [] });
      const sanitizedAnswer = DOMPurify.sanitize(a.answer, { ALLOWED_TAGS: [] });
      return `
        <div class="question">
          <h3>Question ${i + 1}</h3>
          <p>${sanitizedQuestion}</p>
          <div class="answer">
            <p>${sanitizedAnswer}</p>
            <div class="confidence">Confidence: ${(a.confidence * 100).toFixed(1)}%</div>
            ${a.edited ? '<div class="edited">✓ Edited</div>' : ''}
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>RFP Responses</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .question { margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #0066cc; }
            .answer { margin: 10px 0; padding: 10px; background: white; }
            .confidence { color: #666; font-size: 0.9em; }
            .edited { color: #ff6600; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>RFP Responses</h1>
          <p><strong>Company Context:</strong> ${sanitizedContext}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          ${sanitizedAnswers}
        </body>
      </html>
    `;

    // SECURITY: Sanitize entire HTML content before writing to prevent XSS
    const sanitizedHtmlContent = DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: ['html', 'head', 'body', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'strong', 'em', 'br', 'style', 'hr', 'title'],
      ALLOWED_ATTR: ['class', 'style'],
      ALLOW_DATA_ATTR: false
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(sanitizedHtmlContent);
      printWindow.document.close();
      printWindow.print();
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
          {answers.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download size={16} />
                  Export CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Download size={16} />
                  Export PDF
                </button>
              </div>
              {answers.map((answer, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        answer.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                        answer.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Confidence: {(answer.confidence * 100).toFixed(0)}%
                      </span>
                      {answer.edited && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          Edited
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{answer.question}</p>
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                        rows={6}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          <Save size={14} />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="prose prose-sm max-w-none bg-white p-3 rounded border border-gray-200">
                        <ReactMarkdown>{answer.answer}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => handleEdit(index)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded transition-colors"
                      >
                        <Edit2 size={14} />
                        Edit Response
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
