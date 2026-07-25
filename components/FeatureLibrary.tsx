import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, Pin, PinOff, Lock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { normalizePlan, canAccessView } from '../constants/tierFeatures';
import { FEATURE_CATALOG, FEATURE_CATEGORIES, type CatalogFeature, type FeatureCategory } from '../constants/featureCatalog';

const PINNED_KEY = 'complyeasy_pinned_features';

function getPinnedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]');
  } catch {
    return [];
  }
}

function setPinnedIds(ids: string[]) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
}

const FeatureLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userPlan = normalizePlan(user?.organization?.plan);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FeatureCategory | 'All'>('All');
  const [pinnedIds, _setPinnedIds] = useState<string[]>(getPinnedIds);

  const togglePin = useCallback((id: string) => {
    _setPinnedIds(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      setPinnedIds(next);
      return next;
    });
  }, []);

  const filteredFeatures = useMemo(() => {
    let features = FEATURE_CATALOG;

    if (activeCategory !== 'All') {
      features = features.filter(f => f.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      features = features.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.tags.some(t => t.includes(q))
      );
    }

    // Pinned first
    return features.sort((a, b) => {
      const aPin = pinnedIds.includes(a.id) ? 0 : 1;
      const bPin = pinnedIds.includes(b.id) ? 0 : 1;
      return aPin - bPin;
    });
  }, [search, activeCategory, pinnedIds]);

  const tierOrder = ['Foundation', 'Essentials', 'Growth', 'Visionary'];
  const userTierIdx = tierOrder.indexOf(userPlan);

  const isLocked = (feature: CatalogFeature) => {
    const featureTierIdx = tierOrder.indexOf(feature.minimumTier);
    return featureTierIdx > userTierIdx;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Feature Library</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Browse all {FEATURE_CATALOG.length} features across {FEATURE_CATEGORIES.length} categories. Pin your favorites for quick access.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search features..."
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            activeCategory === 'All'
              ? 'bg-brand-600 text-white'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
          }`}
        >
          All ({FEATURE_CATALOG.length})
        </button>
        {FEATURE_CATEGORIES.map(cat => {
          const count = FEATURE_CATALOG.filter(f => f.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFeatures.map(feature => {
          const Icon = feature.icon;
          const locked = isLocked(feature);
          const pinned = pinnedIds.includes(feature.id);

          return (
            <div
              key={feature.id}
              className={`relative group rounded-xl border transition-all duration-200 ${
                locked
                  ? 'border-surface-200 dark:border-surface-700 opacity-60'
                  : 'border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md cursor-pointer'
              } bg-white dark:bg-surface-800 p-4`}
              onClick={() => {
                if (!locked) navigate(feature.path);
              }}
            >
              {/* Pin toggle */}
              <button
                onClick={e => { e.stopPropagation(); togglePin(feature.id); }}
                className={`absolute top-3 right-3 p-1 rounded-md transition-all ${
                  pinned
                    ? 'text-brand-500 opacity-100'
                    : 'text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100'
                } hover:bg-surface-100 dark:hover:bg-surface-700`}
              >
                {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>

              {/* Lock overlay */}
              {locked && (
                <div className="absolute inset-0 rounded-xl bg-surface-50/80 dark:bg-surface-900/80 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-1">
                    <Lock className="w-5 h-5 text-surface-400" />
                    <span className="text-xs font-medium text-surface-500">{feature.minimumTier}</span>
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>

              {/* Content */}
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-1 pr-6">
                {feature.name}
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2">
                {feature.description}
              </p>

              {/* Tier badge */}
              <div className="mt-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  feature.minimumTier === 'Foundation' ? 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400' :
                  feature.minimumTier === 'Essentials' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                  feature.minimumTier === 'Growth' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' :
                  'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {feature.minimumTier}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="text-center py-12 text-surface-400 dark:text-surface-500">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No features found</p>
          <p className="text-xs mt-1">Try a different search term or category</p>
        </div>
      )}
    </div>
  );
};

export default FeatureLibrary;
