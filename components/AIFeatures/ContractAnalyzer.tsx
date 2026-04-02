import React, { useState, useRef } from 'react';
import { analyzeContract } from '../../services/geminiService';
import { Search, Loader2, ArrowLeft, AlertTriangle, Upload, FileText, X, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md'];

export const ContractAnalyzer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const isValidType = ALLOWED_FILE_TYPES.includes(file.type) || 
      ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      return `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`;
    }

    return null;
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (!content || content.trim().length === 0) {
            reject(new Error('File appears to be empty or corrupted'));
          }
          resolve(content);
        } catch (err) {
          reject(new Error('Failed to read file content. File may be corrupted.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file. File may be corrupted.'));
      };

      // Handle different file types
      if (file.type === 'application/pdf' || file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        // Send binary files to backend for text extraction
        const formData = new FormData();
        formData.append('file', file);
        fetch('/api/contracts/extract-text', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })
          .then(response => {
            if (!response.ok) {
              reject(new Error(`Failed to extract text from ${file.name}. Server returned ${response.status}.`));
              return;
            }
            return response.json();
          })
          .then(data => {
            if (data) resolve(data.text || '');
          })
          .catch((error) => {
            console.warn('Failed to fetch data:', error);
            reject(new Error(`Failed to send ${file.name} to server for text extraction. Please paste the content manually.`));
          });
      } else {
        // Text files
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadedFile(null);
    setText('');

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsReadingFile(true);
    setUploadedFile(file);

    try {
      const content = await readFileContent(file);
      setText(content);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to read file. File may be corrupted.');
      setUploadedFile(null);
    } finally {
      setIsReadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setText('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please provide contract text or upload a file');
      return;
    }

    setError(null);
    setLoading(true);
    setAnalysis('');

    try {
      // Check if text is too long (handle very large contracts)
      const MAX_TEXT_LENGTH = 50000; // ~50k characters
      if (text.length > MAX_TEXT_LENGTH) {
        setError(`Contract is very large (${text.length} characters). Analyzing first ${MAX_TEXT_LENGTH} characters...`);
        const truncatedText = text.substring(0, MAX_TEXT_LENGTH) + '\n\n[Content truncated due to size...]';
        const result = await analyzeContract(truncatedText);
        setAnalysis(result);
      } else {
        const result = await analyzeContract(text);
        setAnalysis(result);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'AI analysis failed. Please try again.';
      setError(errorMessage);
      setAnalysis('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">Vendor Contract Analyzer</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="flex flex-col space-y-4">
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-brand-500 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileUpload}
              className="hidden"
              id="contract-file-upload"
            />
            <label
              htmlFor="contract-file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              {isReadingFile ? (
                <>
                  <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
                  <p className="text-sm text-gray-600">Reading file...</p>
                </>
              ) : uploadedFile ? (
                <>
                  <CheckCircle className="text-green-600 mb-2" size={32} />
                  <p className="text-sm font-medium text-gray-900 mb-1">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveFile();
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <Upload className="text-gray-400 mb-2" size={32} />
                  <p className="text-sm font-medium text-gray-700 mb-1">Upload Contract File</p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT, MD (Max 10MB)</p>
                </>
              )}
            </label>
          </div>

          <div className="text-center text-sm text-gray-500">OR</div>

          {/* Text Input */}
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Or Paste Contract Text</label>
            <textarea 
              className="flex-1 w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 resize-none font-mono text-sm"
              placeholder="Paste contract text here..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
            />
            <p className="text-xs text-gray-400 mt-2">
              {text.length.toLocaleString()} characters
              {text.length > 50000 && ' (will be truncated)'}
            </p>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={loading || !text.trim() || isReadingFile}
            className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Analyzing Contract...
              </>
            ) : (
              <>
                <Search className="mr-2" size={18} />
                Analyze for GDPR/Security Risks
              </>
            )}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
          {analysis ? (
            <div className="prose prose-sm max-w-none">
              <h3 className="flex items-center text-brand-700 mb-4">
                <FileText className="mr-2" size={20}/>
                AI Analysis Report
              </h3>
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <AlertTriangle size={48} className="mb-2" />
              <p>Upload a contract file or paste text to detect missing DPA clauses or risks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
