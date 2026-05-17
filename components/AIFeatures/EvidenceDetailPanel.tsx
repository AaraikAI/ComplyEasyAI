import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import { toast } from 'sonner';
import {
  ArrowLeft, ShieldCheck, Activity, History, FileSignature,
  CheckCircle2, AlertTriangle, Loader2, Copy, ExternalLink,
  Upload, Anchor, Search,
} from 'lucide-react';
import { getBlockchainExplorerUrl } from '../../utils/blockchain';

interface EvidenceDetailPanelProps {
  evidenceId: string;
  onClose: () => void;
}

type SubTab = 'overview' | 'provenance' | 'actions';

interface EvidenceAnalysisShape {
  evidenceId?: string;
  deepfakeScore?: number;
  cryptographicHash?: string;
  overallConfidence?: number;
  verificationStatus?: string;
  createdAt?: string;
  physicalAttestation?: {
    blockchainAnchor?: {
      evidenceHash?: string;
      transactionHash?: string;
      blockNumber?: number;
      anchoredAt?: string;
      network?: string;
    };
  };
}

interface ProvenanceShape {
  evidenceId: string;
  chainOfCustody: Array<{ action: string; hash: string; timestamp: string; actor: string; blockchainTx?: string }>;
  analyses: Array<{ timestamp: string; deepfakeScore: number; confidence: number; status: string }>;
  blockchainAnchors: Array<{ hash: string; transactionHash: string; blockNumber: number; network: string; timestamp: string }>;
  attestations: Array<{ userId: string; signature: string; timestamp: string; role?: string }>;
  integrityScore: number;
}

interface IntegrityResultShape {
  integrityVerified: boolean;
  hashMatch: boolean;
  blockchainVerified: boolean;
  analysisConsistent: boolean;
  currentHash: string;
  originalHash: string | null;
  tamperDetails: string | null;
  blockchainRecord: { transactionHash: string; blockNumber: number; network: string; anchoredAt: string } | null;
}

function truncateHash(hash: string | undefined, head = 10, tail = 6): string {
  if (!hash) return '—';
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

function StatusBadge({ status }: { status?: string }): React.ReactElement {
  const s = (status || 'unknown').toLowerCase();
  const variant =
    s === 'verified' || s === 'success' ? 'bg-green-100 text-green-800 border-green-300'
    : s === 'failed' || s === 'tampered' ? 'bg-red-100 text-red-800 border-red-300'
    : 'bg-gray-100 text-gray-800 border-gray-300';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variant}`}>{status || 'unknown'}</span>;
}

export const EvidenceDetailPanel: React.FC<EvidenceDetailPanelProps> = ({ evidenceId, onClose }) => {
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<EvidenceAnalysisShape | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceShape | null>(null);
  const [history, setHistory] = useState<Array<EvidenceAnalysisShape> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Actions state
  const [anchorFile, setAnchorFile] = useState<File | null>(null);
  const [anchorNetwork, setAnchorNetwork] = useState<'ethereum' | 'polygon' | 'hyperledger'>('polygon');
  const [skipBlockchain, setSkipBlockchain] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const [anchorResult, setAnchorResult] = useState<EvidenceAnalysisShape | null>(null);

  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<IntegrityResultShape | null>(null);

  const anchorInputRef = useRef<HTMLInputElement | null>(null);
  const verifyInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [a, p, h] = await Promise.allSettled([
        api.acos.getEvidenceAnalysis(evidenceId),
        api.acos.getProvenance(evidenceId),
        api.acos.getAnalysisHistory(evidenceId),
      ]);
      if (a.status === 'fulfilled') setAnalysis(a.value as EvidenceAnalysisShape);
      else setAnalysis(null);
      if (p.status === 'fulfilled') setProvenance(p.value as ProvenanceShape);
      else setProvenance(null);
      if (h.status === 'fulfilled') setHistory(h.value as EvidenceAnalysisShape[]);
      else setHistory(null);

      if (a.status === 'rejected' && p.status === 'rejected') {
        const msg = (a.reason as Error)?.message || (p.reason as Error)?.message || 'Failed to load evidence detail';
        setLoadError(msg);
      }
    } catch (error: any) {
      setLoadError(error?.message || 'Failed to load evidence detail');
    } finally {
      setLoading(false);
    }
  }, [evidenceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleAnchor = async () => {
    if (!anchorFile) {
      toast.error('Select a file to analyze and anchor');
      return;
    }
    setAnchoring(true);
    setAnchorResult(null);
    try {
      const result = await api.acos.analyzeAndAnchor(evidenceId, anchorFile, {
        network: anchorNetwork,
        skipBlockchain,
      });
      setAnchorResult(result as EvidenceAnalysisShape);
      toast.success(skipBlockchain ? 'Analysis complete (blockchain skipped)' : 'Analyze-and-anchor complete');
      void load();
    } catch (error: any) {
      toast.error(`Analyze-and-anchor failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setAnchoring(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyFile) {
      toast.error('Select a file to verify');
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await api.acos.verifyIntegrity(evidenceId, verifyFile);
      setVerifyResult(result as IntegrityResultShape);
      if ((result as IntegrityResultShape).integrityVerified) {
        toast.success('Integrity verified');
      } else {
        toast.warning('Integrity check failed — see details');
      }
    } catch (error: any) {
      toast.error(`Verification failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setVerifying(false);
    }
  };

  const subTabs: Array<{ id: SubTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'provenance', label: 'Provenance', icon: History },
    { id: 'actions', label: 'Actions', icon: ShieldCheck },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Evidence Detail</h2>
            <code className="text-xs text-gray-500">{evidenceId}</code>
          </div>
        </div>
        <button
          onClick={() => load()}
          className="text-sm text-blue-600 hover:text-blue-800"
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="flex border-b border-gray-200 px-4">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px ${
                active ? 'border-blue-600 text-blue-700 font-medium' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading evidence detail…
          </div>
        )}

        {!loading && loadError && (
          <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
            <AlertTriangle className="inline w-4 h-4 mr-1" /> {loadError}
          </div>
        )}

        {!loading && !loadError && activeTab === 'overview' && (
          <div className="space-y-4">
            {analysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs uppercase text-gray-500 mb-1">Verification Status</div>
                  <StatusBadge status={analysis.verificationStatus} />
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs uppercase text-gray-500 mb-1">Overall Confidence</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {analysis.overallConfidence != null ? `${Math.round(analysis.overallConfidence * 100)}%` : '—'}
                  </div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs uppercase text-gray-500 mb-1">Deepfake Score</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {analysis.deepfakeScore != null ? analysis.deepfakeScore.toFixed(3) : '—'}
                  </div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs uppercase text-gray-500 mb-1">Last Analyzed</div>
                  <div className="text-sm text-gray-900">
                    {analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : '—'}
                  </div>
                </div>
                <div className="border border-gray-200 rounded p-3 md:col-span-2">
                  <div className="text-xs uppercase text-gray-500 mb-1">Cryptographic Hash (SHA-256)</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono break-all">{analysis.cryptographicHash || '—'}</code>
                    {analysis.cryptographicHash && (
                      <button
                        onClick={() => handleCopy(analysis.cryptographicHash!)}
                        className="text-gray-500 hover:text-gray-900"
                        aria-label="Copy hash"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {analysis.physicalAttestation?.blockchainAnchor && (
                  <div className="border border-gray-200 rounded p-3 md:col-span-2">
                    <div className="text-xs uppercase text-gray-500 mb-1">Latest Blockchain Anchor</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Anchor className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">Block {analysis.physicalAttestation.blockchainAnchor.blockNumber} on {analysis.physicalAttestation.blockchainAnchor.network}</span>
                      {(() => {
                        const url = getBlockchainExplorerUrl(
                          analysis.physicalAttestation.blockchainAnchor.transactionHash || '',
                          analysis.physicalAttestation.blockchainAnchor.network || 'polygon'
                        );
                        return url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                            View tx <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <code className="text-xs">{truncateHash(analysis.physicalAttestation.blockchainAnchor.transactionHash)}</code>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No analysis recorded for this evidence yet.</div>
            )}

            {history && history.length > 1 && (
              <div className="border border-gray-200 rounded">
                <div className="px-3 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">
                  Analysis History ({history.length})
                </div>
                <div className="max-h-48 overflow-auto">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-xs border-t border-gray-100 first:border-t-0">
                      <span className="text-gray-500">{h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}</span>
                      <span className="text-gray-700">conf {h.overallConfidence != null ? `${Math.round(h.overallConfidence * 100)}%` : '—'}</span>
                      <StatusBadge status={h.verificationStatus} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !loadError && activeTab === 'provenance' && (
          <div className="space-y-4">
            {provenance ? (
              <>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="border border-gray-200 rounded p-2">
                    <div className="text-xs text-gray-500">Custody events</div>
                    <div className="text-xl font-semibold">{provenance.chainOfCustody.length}</div>
                  </div>
                  <div className="border border-gray-200 rounded p-2">
                    <div className="text-xs text-gray-500">Attestations</div>
                    <div className="text-xl font-semibold">{provenance.attestations.length}</div>
                  </div>
                  <div className="border border-gray-200 rounded p-2">
                    <div className="text-xs text-gray-500">Anchors</div>
                    <div className="text-xl font-semibold">{provenance.blockchainAnchors.length}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Chain of Custody</h3>
                  {provenance.chainOfCustody.length === 0 ? (
                    <div className="text-xs text-gray-500">No custody events recorded.</div>
                  ) : (
                    <ol className="space-y-2">
                      {provenance.chainOfCustody.map((c, i) => (
                        <li key={i} className="border-l-2 border-blue-500 pl-3">
                          <div className="text-sm text-gray-900">{c.action}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(c.timestamp).toLocaleString()} · {c.actor}
                          </div>
                          {c.blockchainTx && (
                            <code className="text-xs text-gray-600">tx {truncateHash(c.blockchainTx)}</code>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Blockchain Anchors</h3>
                  {provenance.blockchainAnchors.length === 0 ? (
                    <div className="text-xs text-gray-500">No anchors recorded.</div>
                  ) : (
                    <ul className="space-y-2">
                      {provenance.blockchainAnchors.map((a, i) => {
                        const url = getBlockchainExplorerUrl(a.transactionHash, a.network);
                        return (
                          <li key={i} className="flex items-center justify-between text-sm border border-gray-200 rounded px-3 py-2">
                            <div>
                              <div className="text-gray-900">Block {a.blockNumber} on {a.network}</div>
                              <div className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleString()}</div>
                            </div>
                            {url ? (
                              <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-xs">
                                {truncateHash(a.transactionHash)} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <code className="text-xs">{truncateHash(a.transactionHash)}</code>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Attestations</h3>
                  {provenance.attestations.length === 0 ? (
                    <div className="text-xs text-gray-500">No attestations recorded.</div>
                  ) : (
                    <ul className="space-y-1">
                      {provenance.attestations.map((a, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <FileSignature className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-900">{a.userId}</span>
                          {a.role && <span className="text-gray-500">({a.role})</span>}
                          <span className="text-gray-500">{new Date(a.timestamp).toLocaleString()}</span>
                          <code className="text-gray-600">{truncateHash(a.signature)}</code>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">No provenance available.</div>
            )}
          </div>
        )}

        {!loading && !loadError && activeTab === 'actions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded p-3">
              <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                <Anchor className="w-4 h-4" /> Analyze and Anchor
              </h3>
              <p className="text-xs text-gray-500 mb-3">Runs full evidence analysis and anchors the hash on-chain. Failed anchors are queued for retry.</p>
              <input
                type="file"
                ref={anchorInputRef}
                className="hidden"
                onChange={e => setAnchorFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => anchorInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" /> {anchorFile ? anchorFile.name : 'Select file'}
              </button>
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-gray-600">
                  Network
                  <select
                    value={anchorNetwork}
                    onChange={e => setAnchorNetwork(e.target.value as 'ethereum' | 'polygon' | 'hyperledger')}
                    className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="polygon">polygon</option>
                    <option value="ethereum">ethereum</option>
                    <option value="hyperledger">hyperledger</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={skipBlockchain}
                    onChange={e => setSkipBlockchain(e.target.checked)}
                  />
                  Skip blockchain (analysis only)
                </label>
              </div>
              <button
                onClick={handleAnchor}
                disabled={!anchorFile || anchoring}
                className="mt-3 w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {anchoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Anchor className="w-4 h-4" />}
                {anchoring ? 'Working…' : 'Analyze and Anchor'}
              </button>
              {anchorResult?.physicalAttestation?.blockchainAnchor && (
                <div className="mt-3 p-2 rounded bg-green-50 border border-green-200 text-xs">
                  <CheckCircle2 className="inline w-4 h-4 text-green-700 mr-1" />
                  Anchored — block {anchorResult.physicalAttestation.blockchainAnchor.blockNumber} on {anchorResult.physicalAttestation.blockchainAnchor.network}.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                <Search className="w-4 h-4" /> Verify Integrity
              </h3>
              <p className="text-xs text-gray-500 mb-3">Re-hashes the file and compares against the stored analysis and blockchain anchor.</p>
              <input
                type="file"
                ref={verifyInputRef}
                className="hidden"
                onChange={e => setVerifyFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => verifyInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" /> {verifyFile ? verifyFile.name : 'Select file'}
              </button>
              <button
                onClick={handleVerify}
                disabled={!verifyFile || verifying}
                className="mt-3 w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {verifying ? 'Verifying…' : 'Verify'}
              </button>
              {verifyResult && (
                <div className={`mt-3 p-2 rounded border text-xs ${
                  verifyResult.integrityVerified ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="font-medium">
                    {verifyResult.integrityVerified ? 'Integrity verified' : 'Integrity check failed'}
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    <li>hashMatch: {String(verifyResult.hashMatch)}</li>
                    <li>blockchainVerified: {String(verifyResult.blockchainVerified)}</li>
                    <li>analysisConsistent: {String(verifyResult.analysisConsistent)}</li>
                    {verifyResult.tamperDetails && <li className="mt-1">{verifyResult.tamperDetails}</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceDetailPanel;
