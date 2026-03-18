import React, { Suspense } from 'react';

export interface TabDefinition {
  id: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface TabbedContainerProps {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  title?: string;
}

const LoadingSpinner = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const TabbedContainer: React.FC<TabbedContainerProps> = ({ tabs, activeTab, onTabChange, title }) => {
  const activeTabDef = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="space-y-0">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 rounded-t-xl px-4 -mx-0">
        <nav className="flex space-x-1 overflow-x-auto custom-scrollbar" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-150 whitespace-nowrap text-sm font-medium ${
                activeTab === id
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                  : 'border-transparent text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-surface-200 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-6">
        <Suspense fallback={<LoadingSpinner />}>
          {activeTabDef?.content}
        </Suspense>
      </div>
    </div>
  );
};
