/**
 * Global Search Component (Cmd+K)
 *
 * Full-text search modal across all resource types:
 * - Policies, controls, risks, evidence, vendors, incidents, assets
 * - Results grouped by type with icons
 * - Filter chips for resource type, framework, status
 * - Recent searches list
 * - Keyboard navigation (arrow keys, Enter to select)
 * - Debounced search input
 * - Highlighted matching text in results
 * - Navigate to resource on selection
 * - API calls to /api/search
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, X, Loader2, FileText, Shield, AlertTriangle, CheckCircle,
  Building2, AlertCircle, Monitor, Clock, ArrowRight, Hash,
  ChevronRight, Command, CornerDownLeft, ArrowUp, ArrowDown,
  Bookmark, FolderOpen, Eye, Trash2, Filter,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type ResourceType = 'policy' | 'control' | 'risk' | 'evidence' | 'vendor' | 'incident' | 'asset';

interface SearchResult {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  matchedField: string;
  framework?: string;
  status?: string;
  score: number;
  updatedAt: string;
  url: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  took: number;
}

interface RecentSearch {
  query: string;
  timestamp: number;
  resultCount: number;
}

interface FilterState {
  types: ResourceType[];
  frameworks: string[];
  statuses: string[];
}

const RESOURCE_CONFIG: Record<ResourceType, { label: string; icon: React.ReactNode; color: string }> = {
  policy: { label: 'Policies', icon: <FileText className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
  control: { label: 'Controls', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' },
  risk: { label: 'Risks', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30' },
  evidence: { label: 'Evidence', icon: <FolderOpen className="w-4 h-4" />, color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30' },
  vendor: { label: 'Vendors', icon: <Building2 className="w-4 h-4" />, color: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30' },
  incident: { label: 'Incidents', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' },
  asset: { label: 'Assets', icon: <Monitor className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30' },
};

const ALL_TYPES: ResourceType[] = ['policy', 'control', 'risk', 'evidence', 'vendor', 'incident', 'asset'];

const FRAMEWORKS = ['SOC 2', 'GDPR', 'ISO 27001', 'HIPAA', 'PCI DSS', 'NIST CSF', 'CCPA'];

const STATUSES = ['Active', 'Draft', 'In Review', 'Archived', 'Open', 'Closed', 'In Progress'];

const RECENT_SEARCHES_KEY = 'complyeasy_recent_searches';

// ── Main Component ──────────────────────────────────────────────────────────

interface GlobalSearchProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: (url: string) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen: controlledOpen, onClose, onNavigate }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(controlledOpen ?? false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ types: [], frameworks: [], statuses: [] });
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (controlledOpen === undefined) {
          setIsOpen(prev => !prev);
        }
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [controlledOpen]);

  // Sync controlled state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen);
    }
  }, [controlledOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
      setShowFilters(false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filters]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setSelectedIndex(-1);
    try {
      const params: any = { q: searchQuery };
      if (filters.types.length > 0) params.types = filters.types.join(',');
      if (filters.frameworks.length > 0) params.frameworks = filters.frameworks.join(',');
      if (filters.statuses.length > 0) params.statuses = filters.statuses.join(',');

      const qs = new URLSearchParams(params as Record<string, string>).toString();
      const data: SearchResponse = await api.get(`/search?${qs}`) || { results: [], total: 0, query: searchQuery, took: 0 };
      setResults(data.results || []);
      setTotalResults(data.total || 0);
      setSearchTime(data.took || 0);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query, results.length);
    handleClose();
    onNavigate?.(result.url);
  };

  const saveRecentSearch = (q: string, count: number) => {
    if (!q.trim()) return;
    const updated = [
      { query: q, timestamp: Date.now(), resultCount: count },
      ...recentSearches.filter(r => r.query !== q),
    ].slice(0, 10);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const flatResults = results;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < flatResults.length) {
      e.preventDefault();
      handleSelect(flatResults[selectedIndex]);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-search-item]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const highlightMatch = (text: string, q: string): React.ReactNode => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-600/40 text-gray-900 dark:text-white rounded px-0.5">{part}</mark>
        : part
    );
  };

  const toggleFilter = <T extends string>(arr: T[], value: T): T[] => {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
  };

  const groupedResults = useMemo(() => {
    const groups: Record<ResourceType, SearchResult[]> = {
      policy: [], control: [], risk: [], evidence: [], vendor: [], incident: [], asset: [],
    };
    results.forEach(r => {
      if (groups[r.type]) groups[r.type].push(r);
    });
    return Object.entries(groups).filter(([, items]) => items.length > 0) as [ResourceType, SearchResult[]][];
  }, [results]);

  const activeFilterCount = filters.types.length + filters.frameworks.length + filters.statuses.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search policies, controls, risks, vendors..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-base focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 border border-gray-200 dark:border-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Resource Type</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TYPES.map(type => {
                  const config = RESOURCE_CONFIG[type];
                  const active = filters.types.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => setFilters({ ...filters, types: toggleFilter(filters.types, type) })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                        active
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Framework</p>
              <div className="flex flex-wrap gap-1.5">
                {FRAMEWORKS.map(fw => (
                  <button
                    key={fw}
                    onClick={() => setFilters({ ...filters, frameworks: toggleFilter(filters.frameworks, fw) })}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                      filters.frameworks.includes(fw)
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {fw}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => setFilters({ ...filters, statuses: toggleFilter(filters.statuses, status) })}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                      filters.statuses.includes(status)
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters({ types: [], frameworks: [], statuses: [] })}
                className="text-xs text-red-500 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
          {/* No query - show recent searches */}
          {!query.trim() && !loading && (
            <div className="p-4">
              {recentSearches.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Searches</p>
                    <button onClick={clearRecentSearches} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((recent, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(recent.query)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-surface-700 text-left transition"
                    >
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{recent.query}</span>
                      <span className="text-xs text-gray-400">{recent.resultCount} results</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start typing to search across all resources</p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <CornerDownLeft className="w-3 h-3" /> Select
                    </span>
                    <span className="flex items-center gap-1">
                      <Command className="w-3 h-3" />K Toggle
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {query.trim() && loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-2" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Searching...</span>
            </div>
          )}

          {/* Results */}
          {query.trim() && !loading && results.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {totalResults} result{totalResults !== 1 ? 's' : ''} in {searchTime}ms
                </p>
              </div>
              {groupedResults.map(([type, items]) => {
                const config = RESOURCE_CONFIG[type];
                return (
                  <div key={type}>
                    <div className="px-4 py-1.5">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className={`p-1 rounded ${config.color}`}>{config.icon}</span>
                        {config.label} ({items.length})
                      </p>
                    </div>
                    {items.map(result => {
                      const globalIdx = results.indexOf(result);
                      return (
                        <button
                          key={result.id}
                          data-search-item
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition ${
                            selectedIndex === globalIdx
                              ? 'bg-primary-50 dark:bg-primary-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-surface-700'
                          }`}
                        >
                          <div className={`p-1.5 rounded mt-0.5 ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {highlightMatch(result.title, query)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                              {highlightMatch(result.description, query)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {result.framework && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                  {result.framework}
                                </span>
                              )}
                              {result.status && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">{result.status}</span>
                              )}
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                matched: {result.matchedField}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-1 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query.trim() && !loading && results.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try different keywords or adjust your filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-700/50">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Select
            </span>
            <span className="flex items-center gap-1">ESC Close</span>
          </div>
          <span className="text-xs text-gray-400">
            <Command className="w-3 h-3 inline" />K to toggle
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
