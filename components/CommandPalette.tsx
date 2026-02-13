import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, LayoutDashboard, ShieldCheck, FileText, Activity, Settings,
  AlertTriangle, Users, Layers, Brain, Monitor, Building2, ClipboardList,
  CheckSquare, Sparkles, Briefcase, GitGraph, Mail, ShieldAlert, Database,
  LifeBuoy, Lock, ArrowRight, Command, Hash, Zap
} from 'lucide-react';
import { ViewState } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  keywords: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'dashboard', label: 'Dashboard', description: 'Compliance overview', icon: LayoutDashboard, action: () => onNavigate('dashboard'), category: 'Navigation', keywords: ['home', 'overview', 'main'] },
    { id: 'risks', label: 'Risk Management', description: 'View and manage risks', icon: ShieldAlert, action: () => onNavigate('risks'), category: 'Navigation', keywords: ['risk', 'threat', 'vulnerability'] },
    { id: 'frameworks', label: 'Frameworks', description: 'Compliance frameworks', icon: ShieldCheck, action: () => onNavigate('frameworks'), category: 'Navigation', keywords: ['soc2', 'gdpr', 'hipaa', 'iso'] },
    { id: 'reports', label: 'Reports', description: 'Generate compliance reports', icon: FileText, action: () => onNavigate('reports'), category: 'Navigation', keywords: ['report', 'pdf', 'export', 'generate'] },
    { id: 'audit', label: 'Audit Trail', description: 'View audit history', icon: Activity, action: () => onNavigate('audit'), category: 'Navigation', keywords: ['audit', 'log', 'history', 'trail'] },
    { id: 'my-tasks', label: 'My Tasks', description: 'Your assigned tasks', icon: CheckSquare, action: () => onNavigate('my-tasks'), category: 'Navigation', keywords: ['task', 'todo', 'assigned'] },
    { id: 'vendors', label: 'Vendor Management', description: 'Manage vendor risks', icon: Users, action: () => onNavigate('vendors'), category: 'Navigation', keywords: ['vendor', 'third-party', 'supplier'] },
    { id: 'policies', label: 'Policy Management', description: 'Manage policies', icon: FileText, action: () => onNavigate('policies'), category: 'Navigation', keywords: ['policy', 'document', 'governance'] },
    { id: 'integrations', label: 'Integrations', description: 'Connected services', icon: Layers, action: () => onNavigate('integrations'), category: 'Navigation', keywords: ['integration', 'connect', 'aws', 'github'] },
    { id: 'monitoring', label: 'Monitoring', description: 'Real-time monitoring', icon: Monitor, action: () => onNavigate('monitoring'), category: 'Navigation', keywords: ['monitor', 'alert', 'real-time'] },
    { id: 'issues', label: 'Issue Management', description: 'Track issues', icon: AlertTriangle, action: () => onNavigate('issues'), category: 'Navigation', keywords: ['issue', 'bug', 'problem'] },
    { id: 'settings', label: 'Settings', description: 'App configuration', icon: Settings, action: () => onNavigate('settings'), category: 'Navigation', keywords: ['settings', 'config', 'billing', 'profile'] },

    // AI Tools
    { id: 'ai-policy', label: 'AI Policy Generator', description: 'Generate policies with AI', icon: Sparkles, action: () => onNavigate('ai-policy'), category: 'AI Tools', keywords: ['ai', 'policy', 'generate', 'create'] },
    { id: 'ai-contract', label: 'AI Contract Analyzer', description: 'Analyze contracts', icon: Briefcase, action: () => onNavigate('ai-contract'), category: 'AI Tools', keywords: ['ai', 'contract', 'analyze', 'review'] },
    { id: 'ai-gap', label: 'AI Gap Analysis', description: 'Find compliance gaps', icon: GitGraph, action: () => onNavigate('ai-gap'), category: 'AI Tools', keywords: ['ai', 'gap', 'analysis', 'compliance'] },
    { id: 'ai-rfp', label: 'AI RFP Responder', description: 'Respond to RFPs', icon: Mail, action: () => onNavigate('ai-rfp'), category: 'AI Tools', keywords: ['ai', 'rfp', 'proposal', 'respond'] },
    { id: 'ai-vendor', label: 'AI Vendor Scorer', description: 'Score vendor risks', icon: ShieldAlert, action: () => onNavigate('ai-vendor'), category: 'AI Tools', keywords: ['ai', 'vendor', 'score', 'risk'] },
    { id: 'ai-data-map', label: 'GDPR Data Mapper', description: 'Map data flows', icon: Database, action: () => onNavigate('ai-data-map'), category: 'AI Tools', keywords: ['gdpr', 'data', 'map', 'pii'] },
    { id: 'ai-bcp', label: 'BCP Generator', description: 'Business continuity plans', icon: LifeBuoy, action: () => onNavigate('ai-bcp'), category: 'AI Tools', keywords: ['bcp', 'continuity', 'disaster', 'recovery'] },

    // Enterprise
    { id: 'acos', label: 'aCOS Dashboard', description: 'Autonomous compliance', icon: Brain, action: () => onNavigate('acos'), category: 'Enterprise', keywords: ['acos', 'autonomous', 'compliance'] },
    { id: 'ai-rmf', label: 'NIST AI RMF', description: 'AI risk management', icon: Brain, action: () => onNavigate('ai-rmf'), category: 'Enterprise', keywords: ['nist', 'ai', 'rmf', 'risk'] },
    { id: 'eu-ai-act', label: 'EU AI Act', description: 'EU AI regulation', icon: ShieldCheck, action: () => onNavigate('eu-ai-act'), category: 'Enterprise', keywords: ['eu', 'ai', 'act', 'regulation'] },
    { id: 'security', label: 'Security Features', description: 'Advanced security', icon: Lock, action: () => onNavigate('security'), category: 'Enterprise', keywords: ['security', 'encryption', 'zero-trust'] },
    { id: 'analytics', label: 'Real-time Analytics', description: 'Live metrics', icon: Activity, action: () => onNavigate('analytics'), category: 'Enterprise', keywords: ['analytics', 'metrics', 'real-time'] },
    { id: 'workspaces', label: 'Workspaces', description: 'Multi-workspace', icon: Building2, action: () => onNavigate('workspaces'), category: 'Enterprise', keywords: ['workspace', 'team', 'multi'] },
    { id: 'questionnaires', label: 'Questionnaires', description: 'Assessment forms', icon: ClipboardList, action: () => onNavigate('questionnaires'), category: 'Enterprise', keywords: ['questionnaire', 'assessment', 'form'] },
  ], [onNavigate]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lower = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(lower) ||
      cmd.description?.toLowerCase().includes(lower) ||
      cmd.keywords.some(k => k.includes(lower))
    );
  }, [query, commands]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] animate-fadeIn">
      <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden animate-scaleIn">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-surface-100">
          <Search size={20} className="text-surface-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, pages, AI tools..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-3 py-4 text-base bg-transparent outline-none placeholder:text-surface-400"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-surface-400 bg-surface-100 rounded-md border border-surface-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto custom-scrollbar p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center">
              <Search size={32} className="mx-auto text-surface-300 mb-3" />
              <p className="text-sm text-surface-500">No results for "{query}"</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-1">
                <div className="px-3 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                  {category}
                </div>
                {items.map(item => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      data-selected={isSelected}
                      onClick={() => { item.action(); onClose(); }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-surface-700 hover:bg-surface-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-brand-100 text-brand-600' : 'bg-surface-100 text-surface-500'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-surface-400 truncate">{item.description}</p>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight size={14} className="text-brand-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-surface-100 bg-surface-50/50 text-xs text-surface-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-100 rounded border border-surface-200 font-medium">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-100 rounded border border-surface-200 font-medium">↵</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command size={12} />
            <span>K to toggle</span>
          </span>
        </div>
      </div>
    </div>
  );
};
