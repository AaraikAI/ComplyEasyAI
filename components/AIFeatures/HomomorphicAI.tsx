/**
 * Homomorphic AI Component
 * Provides UI for privacy-preserving machine learning operations
 */

import React, { useState } from 'react';
import { ArrowLeft, Loader2, Key, Lock, Unlock, TrendingUp, BarChart3, Brain, AlertCircle, CheckCircle, Copy, Download } from 'lucide-react';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';

interface HomomorphicKeys {
  publicKey: string;
  secretKey: string;
  relinKeys: string;
  galoisKeys?: string;
}

export const HomomorphicAI: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'encrypt' | 'decrypt' | 'regression' | 'statistics' | 'neural'>('keys');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Key generation
  const [keys, setKeys] = useState<HomomorphicKeys | null>(null);
  const [keyScheme, setKeyScheme] = useState<'BFV' | 'CKKS'>('CKKS');
  const [keySecurityLevel, setKeySecurityLevel] = useState<128 | 192 | 256>(128);
  
  // Encryption
  const [encryptData, setEncryptData] = useState<string>('');
  const [encryptScheme, setEncryptScheme] = useState<'BFV' | 'CKKS'>('CKKS');
  const [encryptedResult, setEncryptedResult] = useState<any>(null);
  
  // Decryption
  const [decryptData, setDecryptData] = useState<string>('');
  const [decryptedResult, setDecryptedResult] = useState<number[] | null>(null);
  
  // Linear Regression
  const [regressionFeatures, setRegressionFeatures] = useState<string>('');
  const [regressionWeights, setRegressionWeights] = useState<string>('');
  const [regressionResult, setRegressionResult] = useState<any>(null);
  
  // Statistics
  const [statisticsData, setStatisticsData] = useState<string>('');
  const [statisticsResult, setStatisticsResult] = useState<any>(null);
  
  // Neural Network
  const [nnInput, setNnInput] = useState<string>('');
  const [nnWeights, setNnWeights] = useState<string>('');
  const [nnResult, setNnResult] = useState<any>(null);

  const handleGenerateKeys = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await api.acos.generateHomomorphicKeys(keyScheme, keySecurityLevel);
      setKeys(result);
      setSuccess(`Successfully generated ${keyScheme} keys with ${keySecurityLevel}-bit security`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate keys');
    } finally {
      setLoading(false);
    }
  };

  const handleEncrypt = async () => {
    if (!keys) {
      setError('Please generate keys first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const dataArray = encryptData.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      if (dataArray.length === 0) {
        throw new Error('Please enter valid numbers separated by commas');
      }
      
      const result = await api.acos.encryptData(dataArray, keys.publicKey, encryptScheme);
      setEncryptedResult(result);
      setSuccess('Data encrypted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to encrypt data');
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!keys) {
      setError('Please generate keys first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const encryptedData = JSON.parse(decryptData);
      const result = await api.acos.decryptData(encryptedData, keys.secretKey);
      setDecryptedResult(result.data);
      setSuccess('Data decrypted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to decrypt data. Make sure the encrypted data is valid JSON.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinearRegression = async () => {
    if (!keys) {
      setError('Please generate keys first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const featuresArray = regressionFeatures.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      const weightsArray = regressionWeights.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      
      if (featuresArray.length === 0 || weightsArray.length === 0) {
        throw new Error('Please enter valid numbers for features and weights');
      }
      
      // First encrypt the features
      const encryptedFeatures = await api.acos.encryptData(featuresArray, keys.publicKey, 'CKKS');
      
      // Then perform regression
      const result = await api.acos.performEncryptedLinearRegression(
        encryptedFeatures,
        weightsArray,
        keys.publicKey,
        keys.relinKeys!
      );
      
      setRegressionResult(result);
      setSuccess('Linear regression completed on encrypted data');
    } catch (err: any) {
      setError(err.message || 'Failed to perform linear regression');
    } finally {
      setLoading(false);
    }
  };

  const handleStatistics = async () => {
    if (!keys || !keys.galoisKeys) {
      setError('Please generate CKKS keys first (galois keys required)');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const dataArray = statisticsData.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      if (dataArray.length === 0) {
        throw new Error('Please enter valid numbers separated by commas');
      }
      
      // First encrypt the data
      const encryptedData = await api.acos.encryptData(dataArray, keys.publicKey, 'CKKS');
      
      // Then compute statistics
      const result = await api.acos.computeEncryptedStatistics(
        encryptedData,
        keys.galoisKeys,
        keys.relinKeys!
      );
      
      setStatisticsResult(result);
      setSuccess('Statistics computed on encrypted data');
    } catch (err: any) {
      setError(err.message || 'Failed to compute statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleNeuralNetwork = async () => {
    if (!keys) {
      setError('Please generate keys first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const inputArray = nnInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      const weightsObj = JSON.parse(nnWeights);
      
      if (inputArray.length === 0) {
        throw new Error('Please enter valid numbers for input');
      }
      if (!weightsObj.layer1 || !weightsObj.layer2) {
        throw new Error('Model weights must have layer1 and layer2');
      }
      
      // First encrypt the input
      const encryptedInput = await api.acos.encryptData(inputArray, keys.publicKey, 'CKKS');
      
      // Then run neural network
      const result = await api.acos.performEncryptedNeuralNetwork(
        encryptedInput,
        weightsObj,
        keys
      );
      
      setNnResult(result);
      setSuccess('Neural network inference completed on encrypted data');
    } catch (err: any) {
      setError(err.message || 'Failed to run neural network');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  const tabs = [
    { id: 'keys', label: 'Key Generation', icon: Key },
    { id: 'encrypt', label: 'Encrypt', icon: Lock },
    { id: 'decrypt', label: 'Decrypt', icon: Unlock },
    { id: 'regression', label: 'Linear Regression', icon: TrendingUp },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'neural', label: 'Neural Network', icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Homomorphic AI</h1>
              <p className="text-slate-600 mt-1">Privacy-preserving machine learning on encrypted data</p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Key Generation Tab */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Generate Encryption Keys</h2>
                <p className="text-slate-600">Generate public/private key pairs for homomorphic encryption operations.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Scheme</label>
                  <select
                    value={keyScheme}
                    onChange={(e) => setKeyScheme(e.target.value as 'BFV' | 'CKKS')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="CKKS">CKKS (Floating Point)</option>
                    <option value="BFV">BFV (Integer)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Security Level</label>
                  <select
                    value={keySecurityLevel}
                    onChange={(e) => setKeySecurityLevel(parseInt(e.target.value) as 128 | 192 | 256)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="128">128-bit</option>
                    <option value="192">192-bit</option>
                    <option value="256">256-bit</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleGenerateKeys}
                disabled={loading}
                className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                Generate Keys
              </button>
              
              {keys && (
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Public Key</label>
                      <button
                        onClick={() => copyToClipboard(keys.publicKey)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={keys.publicKey}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Secret Key</label>
                      <button
                        onClick={() => copyToClipboard(keys.secretKey)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={keys.secretKey}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Encrypt Tab */}
          {activeTab === 'encrypt' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Encrypt Data</h2>
                <p className="text-slate-600">Encrypt numerical data for homomorphic operations.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data (comma-separated numbers)</label>
                <input
                  type="text"
                  value={encryptData}
                  onChange={(e) => setEncryptData(e.target.value)}
                  placeholder="1.5, 2.5, 3.5, 4.5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Scheme</label>
                <select
                  value={encryptScheme}
                  onChange={(e) => setEncryptScheme(e.target.value as 'BFV' | 'CKKS')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="CKKS">CKKS (Floating Point)</option>
                  <option value="BFV">BFV (Integer)</option>
                </select>
              </div>
              
              <button
                onClick={handleEncrypt}
                disabled={loading || !keys}
                className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                Encrypt Data
              </button>
              
              {encryptedResult && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Encrypted Result</label>
                  <textarea
                    value={JSON.stringify(encryptedResult, null, 2)}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50"
                    rows={10}
                  />
                </div>
              )}
            </div>
          )}

          {/* Decrypt Tab */}
          {activeTab === 'decrypt' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Decrypt Data</h2>
                <p className="text-slate-600">Decrypt homomorphically encrypted data.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Encrypted Data (JSON)</label>
                <textarea
                  value={decryptData}
                  onChange={(e) => setDecryptData(e.target.value)}
                  placeholder='{"ciphertext": "...", "contextParams": {...}, "scheme": "CKKS"}'
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  rows={8}
                />
              </div>
              
              <button
                onClick={handleDecrypt}
                disabled={loading || !keys}
                className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                Decrypt Data
              </button>
              
              {decryptedResult && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Decrypted Result</label>
                  <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm">
                    [{decryptedResult.join(', ')}]
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Linear Regression Tab */}
          {activeTab === 'regression' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Encrypted Linear Regression</h2>
                <p className="text-slate-600">Perform linear regression on encrypted data without decryption.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Features (comma-separated)</label>
                <input
                  type="text"
                  value={regressionFeatures}
                  onChange={(e) => setRegressionFeatures(e.target.value)}
                  placeholder="1.0, 2.0, 3.0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Weights (comma-separated)</label>
                <input
                  type="text"
                  value={regressionWeights}
                  onChange={(e) => setRegressionWeights(e.target.value)}
                  placeholder="0.5, 1.0, 0.3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              <button
                onClick={handleLinearRegression}
                disabled={loading || !keys}
                className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                Run Linear Regression
              </button>
              
              {regressionResult && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Result</label>
                  <textarea
                    value={JSON.stringify(regressionResult, null, 2)}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50"
                    rows={8}
                  />
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Encrypted Statistics</h2>
                <p className="text-slate-600">Compute mean and variance on encrypted data.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data (comma-separated numbers)</label>
                <input
                  type="text"
                  value={statisticsData}
                  onChange={(e) => setStatisticsData(e.target.value)}
                  placeholder="1.5, 2.5, 3.5, 4.5, 5.5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              <button
                onClick={handleStatistics}
                disabled={loading || !keys}
                className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
                Compute Statistics
              </button>
              
              {statisticsResult && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Result</label>
                  <textarea
                    value={JSON.stringify(statisticsResult, null, 2)}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50"
                    rows={6}
                  />
                </div>
              )}
            </div>
          )}

          {/* Neural Network Tab */}
          {activeTab === 'neural' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Encrypted Neural Network</h2>
                <p className="text-slate-600">Run neural network inference on encrypted data.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Input (comma-separated numbers)</label>
                <input
                  type="text"
                  value={nnInput}
                  onChange={(e) => setNnInput(e.target.value)}
                  placeholder="1.0, 2.0, 3.0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Model Weights (JSON)</label>
                <textarea
                  value={nnWeights}
                  onChange={(e) => setNnWeights(e.target.value)}
                  placeholder='{"layer1": [[0.5, 0.3]], "layer2": [[0.2]], "biases1": [0.1], "biases2": [0.05]}'
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  rows={6}
                />
              </div>
              
              <button
                onClick={handleNeuralNetwork}
                disabled={loading || !keys}
                className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                Run Neural Network
              </button>
              
              {nnResult && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Result</label>
                  <textarea
                    value={JSON.stringify(nnResult, null, 2)}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50"
                    rows={8}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

