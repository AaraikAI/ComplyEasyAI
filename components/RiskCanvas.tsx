import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Send, Sparkles, ArrowRight, X } from 'lucide-react';
import { useRisks } from '../hooks/queries/useRisks';
import { useExecutiveDashboard } from '../hooks/queries/useDashboard';
import { RisingSignals } from './RisingSignals';
import { api } from '../services/api';
import { logger } from '../utils/logger';

// ── Types ────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: 'hub' | 'domain' | 'risk';
  color: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  parent?: string;
  severity?: string;
  path?: string;
  featureCount?: number;
  fullLabel?: string;
}

interface GraphLink {
  source: string;
  target: string;
  color: string;
}

const DOMAIN_COLORS: Record<string, string> = {
  Governance: '#6366f1',
  Risk: '#ef4444',
  Compliance: '#0d9488',
  Audits: '#f59e0b',
  Vendors: '#8b5cf6',
  Privacy: '#ec4899',
};

const DOMAIN_PATHS: Record<string, string> = {
  Governance: '/governance',
  Risk: '/risks',
  Compliance: '/frameworks',
  Audits: '/audit',
  Vendors: '/vendors',
  Privacy: '/privacy',
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Medium: '#9ca3af',
  Low: '#6b7280',
};

// ── Force simulation ─────────────────────────────────────────────────

function runForceSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  onTick: (nodes: GraphNode[]) => void,
  frameRef: React.MutableRefObject<number>
) {
  const cx = width / 2;
  const cy = height / 2;
  let frame = 0;
  const maxFrames = 120;

  const tick = () => {
    frame++;
    const alpha = Math.max(0, 1 - frame / maxFrames);

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const minDist = nodes[i].radius + nodes[j].radius + 30;
        if (dist < minDist) {
          const force = (minDist - dist) * 0.05 * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }
    }

    // Spring forces on links
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    links.forEach(link => {
      const s = nodeMap.get(link.source);
      const t = nodeMap.get(link.target);
      if (!s || !t) return;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const targetDist = s.type === 'hub' ? 140 : 80;
      const force = (dist - targetDist) * 0.02 * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    });

    // Gravity toward center
    nodes.forEach(n => {
      if (n.type === 'hub') return;
      n.vx += (cx - n.x) * 0.003 * alpha;
      n.vy += (cy - n.y) * 0.003 * alpha;
    });

    // Apply velocity with damping
    nodes.forEach(n => {
      if (n.type === 'hub') {
        n.x = cx;
        n.y = cy;
        return;
      }
      n.vx *= 0.85;
      n.vy *= 0.85;
      n.x += n.vx;
      n.y += n.vy;
      // Bounds
      n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
      n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
    });

    onTick([...nodes]);
    if (frame < maxFrames) {
      frameRef.current = requestAnimationFrame(tick);
    }
  };

  frameRef.current = requestAnimationFrame(tick);
}

// ── Chat messages ────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  actions?: Array<{ label: string; path: string }>;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'ai',
    content: 'Welcome to the Risk Canvas. I can help you analyze risks, check compliance status, and generate reports. What would you like to explore?',
    actions: [
      { label: 'SOC2 status', path: '/frameworks' },
      { label: 'Gap analysis', path: '/ai/document-tools?tab=gap' },
    ],
  },
];

const QUICK_CHIPS = [
  { label: 'SOC2 status', query: 'What is our SOC2 compliance status?' },
  { label: 'Gap analysis', query: 'Run a gap analysis on our frameworks' },
  { label: 'Vendor risks', query: 'Show me high-risk vendors' },
  { label: 'Board report', query: 'Generate a board-ready compliance report' },
];

// ── Component ────────────────────────────────────────────────────────

const RiskCanvas: React.FC = () => {
  const navigate = useNavigate();
  const { data: risks = [] } = useRisks();
  const { data: dashboard } = useExecutiveDashboard();
  const canvasRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<number>(0);

  const [activeTab, setActiveTab] = useState<'canvas' | 'signals'>('canvas');
  const [renderedNodes, setRenderedNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Build graph data from risks
  const { nodes: initialNodes, links } = useMemo(() => {
    const n: GraphNode[] = [];
    const l: GraphLink[] = [];

    // Central hub
    n.push({
      id: 'hub',
      label: 'ComplyEasyAI',
      type: 'hub',
      color: '#0d9488',
      radius: 32,
      x: 300, y: 250,
      vx: 0, vy: 0,
    });

    // Domain nodes
    const domains = Object.keys(DOMAIN_COLORS);
    domains.forEach((domain, i) => {
      const angle = (i / domains.length) * Math.PI * 2 - Math.PI / 2;
      n.push({
        id: `domain-${domain}`,
        label: domain,
        type: 'domain',
        color: DOMAIN_COLORS[domain],
        radius: 22,
        x: 300 + Math.cos(angle) * 150,
        y: 250 + Math.sin(angle) * 150,
        vx: 0, vy: 0,
        path: DOMAIN_PATHS[domain],
        featureCount: 50,
      });
      l.push({ source: 'hub', target: `domain-${domain}`, color: DOMAIN_COLORS[domain] + '40' });
    });

    // Risk nodes (up to 12)
    const activeRisks = risks
      .filter(r => r.status !== 'Closed')
      .slice(0, 12);

    activeRisks.forEach((risk, i) => {
      const domainKey = Object.keys(DOMAIN_COLORS).find(
        d => risk.category?.toLowerCase().includes(d.toLowerCase())
      ) || 'Risk';
      const parentId = `domain-${domainKey}`;
      const parent = n.find(node => node.id === parentId);

      n.push({
        id: `risk-${risk.id}`,
        label: risk.title.length > 20 ? risk.title.slice(0, 20) + '...' : risk.title,
        fullLabel: risk.title,
        type: 'risk',
        color: SEVERITY_COLORS[risk.severity] || '#9ca3af',
        radius: risk.severity === 'Critical' ? 14 : 10,
        x: (parent?.x ?? 300) + (Math.random() - 0.5) * 80,
        y: (parent?.y ?? 250) + (Math.random() - 0.5) * 80,
        vx: 0, vy: 0,
        parent: parentId,
        severity: risk.severity,
      });
      l.push({
        source: parentId,
        target: `risk-${risk.id}`,
        color: SEVERITY_COLORS[risk.severity] + '60',
      });
    });

    return { nodes: n, links: l };
  }, [risks]);

  // Run simulation
  useEffect(() => {
    const nodesCopy = initialNodes.map(n => ({ ...n }));
    runForceSimulation(nodesCopy, links, 600, 500, setRenderedNodes, frameRef);
    return () => cancelAnimationFrame(frameRef.current);
  }, [initialNodes, links]);

  // Map relevant compliance domains mentioned in a reply to navigation chips
  const deriveActions = useCallback((text: string): Array<{ label: string; path: string }> => {
    const lower = text.toLowerCase();
    const actions: Array<{ label: string; path: string }> = [];
    if (lower.includes('framework') || lower.includes('soc2') || lower.includes('iso')) {
      actions.push({ label: 'View frameworks', path: '/frameworks' });
    }
    if (lower.includes('vendor')) actions.push({ label: 'View vendors', path: '/vendors' });
    if (lower.includes('gap')) actions.push({ label: 'Start gap analysis', path: '/ai/document-tools?tab=gap' });
    if (lower.includes('risk')) actions.push({ label: 'View risks', path: '/risks' });
    if (lower.includes('report') || lower.includes('board') || lower.includes('executive')) {
      actions.push({ label: 'Executive report', path: '/executive' });
    }
    return actions.slice(0, 2);
  }, []);

  // Chat send — calls the compliance copilot service with live dashboard context
  const handleSend = useCallback(async (text?: string) => {
    const msg = text || chatInput.trim();
    if (!msg || isSending) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsSending(true);

    const conversationHistory = chatMessages.slice(-10).map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }));
    const context = {
      currentView: 'risk-canvas',
      complianceScore: dashboard?.overallCompliance ?? dashboard?.complianceScore ?? 0,
      frameworksTracked: dashboard?.frameworkProgress?.length ?? 0,
      criticalRisks: risks.filter(r => r.severity === 'Critical').length,
      totalVendors: dashboard?.vendorRiskSummary?.totalVendors ?? 0,
      highRiskVendors: dashboard?.vendorRiskSummary?.highRisk ?? 0,
      pendingAudits: dashboard?.pendingAudits ?? 0,
    };

    try {
      const result = await api.ai.complianceCopilot(msg, conversationHistory, context) as {
        response?: string;
        suggestions?: string[];
      };
      const content = result?.response || 'I could not generate a response. Please try again.';
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content,
        actions: deriveActions(content),
      };
      setChatMessages(prev => [...prev, response]);
    } catch (error: any) {
      logger.error('Risk Canvas copilot request failed:', error);
      const fallback: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'The AI copilot is temporarily unavailable. Please try again in a few moments.',
      };
      setChatMessages(prev => [...prev, fallback]);
    } finally {
      setIsSending(false);
    }
  }, [chatInput, chatMessages, dashboard, risks, isSending, deriveActions]);

  const nodeMap = useMemo(() => new Map(renderedNodes.map(n => [n.id, n])), [renderedNodes]);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm">

      {/* ── Left: AI Copilot Chat ────────────────────── */}
      <div className="w-1/2 flex flex-col border-r border-surface-200 dark:border-surface-700">
        {/* Chat header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-200 dark:border-surface-700">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">AI Copilot</span>
          <span className="text-xs text-surface-400">&middot; Active</span>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-surface-100'
              }`}>
                <p className="text-sm">{msg.content}</p>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(action.path)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1"
                      >
                        {action.label} <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl px-4 py-3 bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-300">
                <p className="text-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-pulse [animation-delay:300ms]" />
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick chips */}
        <div className="px-5 py-2 flex flex-wrap gap-2">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => handleSend(chip.query)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat input */}
        <div className="px-5 py-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isSending}
              placeholder="Ask about risks, compliance, vendors..."
              className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-60"
            />
            <button
              onClick={() => handleSend()}
              disabled={isSending}
              className="px-3 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Risk Canvas / Signals ─────────────── */}
      <div className="w-1/2 flex flex-col">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-surface-200 dark:border-surface-700">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'canvas'
                ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            Risk canvas
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'signals'
                ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            Signals feed
          </button>
        </div>

        {activeTab === 'canvas' ? (
          <div className="flex-1 relative overflow-hidden">
            {/* SVG Canvas */}
            <svg
              ref={canvasRef}
              viewBox="0 0 600 500"
              className="w-full h-full"
              style={{ background: 'var(--warm-bg2, #eeece6)' }}
            >
              {/* Links */}
              {links.map((link, i) => {
                const s = nodeMap.get(link.source);
                const t = nodeMap.get(link.target);
                if (!s || !t) return null;
                return (
                  <line
                    key={i}
                    x1={s.x} y1={s.y}
                    x2={t.x} y2={t.y}
                    stroke={link.color}
                    strokeWidth={1.5}
                  />
                );
              })}

              {/* Nodes */}
              {renderedNodes.map(node => (
                <g
                  key={node.id}
                  onClick={() => {
                    if (node.type === 'domain' && node.path) navigate(node.path);
                    else setSelectedNode(node);
                  }}
                  onMouseEnter={() => node.type === 'risk' && setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: node.type !== 'hub' ? 'pointer' : 'default' }}
                >
                  {/* Glow for critical */}
                  {node.severity === 'Critical' && (
                    <circle cx={node.x} cy={node.y} r={node.radius + 6} fill={node.color} opacity={0.15} />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={node.color}
                    stroke="white"
                    strokeWidth={node.type === 'hub' ? 3 : 2}
                    className="transition-transform duration-200 hover:scale-110"
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  />
                  {/* Label */}
                  {node.type !== 'risk' && (
                    <text
                      x={node.x}
                      y={node.y + node.radius + 14}
                      textAnchor="middle"
                      fontSize={node.type === 'hub' ? 11 : 10}
                      fontWeight={node.type === 'hub' ? 700 : 600}
                      className="fill-current text-surface-700 dark:text-surface-300"
                    >
                      {node.label}
                    </text>
                  )}
                  {/* Hub icon text */}
                  {node.type === 'hub' && (
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fill="white"
                    >
                      CE
                    </text>
                  )}
                </g>
              ))}

              {/* Hover tooltip for risk nodes */}
              {hoveredNode && hoveredNode.type === 'risk' && (
                <g pointerEvents="none">
                  <rect
                    x={hoveredNode.x - Math.min((hoveredNode.fullLabel || hoveredNode.label).length * 3.5 + 12, 120)}
                    y={hoveredNode.y - hoveredNode.radius - 32}
                    width={Math.min((hoveredNode.fullLabel || hoveredNode.label).length * 7 + 24, 240)}
                    height={24}
                    rx={6}
                    fill="#1e293b"
                    opacity={0.92}
                  />
                  <text
                    x={hoveredNode.x}
                    y={hoveredNode.y - hoveredNode.radius - 16}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill="white"
                  >
                    {(hoveredNode.fullLabel || hoveredNode.label).length > 32
                      ? (hoveredNode.fullLabel || hoveredNode.label).slice(0, 32) + '...'
                      : (hoveredNode.fullLabel || hoveredNode.label)}
                  </text>
                </g>
              )}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] text-surface-500">
              {Object.entries(SEVERITY_COLORS).slice(0, 3).map(([label, color]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  {label}
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Domain
              </div>
            </div>

            {/* Selected node detail */}
            {selectedNode && selectedNode.type !== 'hub' && (
              <div className="absolute bottom-4 right-4 left-1/3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selectedNode.color }} />
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                      {selectedNode.fullLabel || selectedNode.label}
                    </h4>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-surface-400 hover:text-surface-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {selectedNode.severity && (
                  <p className="text-xs text-surface-500 mb-2">Severity: {selectedNode.severity}</p>
                )}
                {selectedNode.path && (
                  <button
                    onClick={() => navigate(selectedNode.path!)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    Browse features <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <RisingSignals
              maxVisible={10}
              risks={risks.map(r => ({
                id: r.id,
                title: r.title,
                severity: r.severity,
                status: r.status,
                category: r.category,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskCanvas;
