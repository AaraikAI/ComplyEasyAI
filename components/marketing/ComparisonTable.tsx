import React from 'react';
import { Check, X } from 'lucide-react';

export interface ComparisonTableRow {
  feature: string;
  complyEasy: string | boolean;
  competitor: string | boolean;
}

export interface ComparisonTableProps {
  competitorName: string;
  rows: ComparisonTableRow[];
}

/** Render a boolean as an accessible check/x icon, or a string as text. */
const Cell: React.FC<{ value: string | boolean; context: string }> = ({ value, context }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
        role="img"
        aria-label={`Supported: ${context}`}
      >
        <Check size={16} aria-hidden="true" />
      </span>
    ) : (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500"
        role="img"
        aria-label={`Not supported: ${context}`}
      >
        <X size={16} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="text-sm text-surface-700 dark:text-surface-300">{value}</span>
  );
};

/**
 * Accessible, responsive feature-comparison matrix. ComplyEasy AI is the
 * teal-accented column; the competitor column is neutral. Scrolls horizontally
 * on small screens.
 */
const ComparisonTable: React.FC<ComparisonTableProps> = ({ competitorName, rows }) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-surface-700">
      <table className="w-full min-w-[36rem] border-collapse text-left">
        <caption className="sr-only">
          Feature comparison between ComplyEasy AI and {competitorName}
        </caption>
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-900">
            <th
              scope="col"
              className="px-4 py-4 text-sm font-semibold text-surface-700 dark:text-surface-200 sm:px-6"
            >
              Feature
            </th>
            <th
              scope="col"
              className="px-4 py-4 text-center text-sm font-bold text-brand-700 dark:text-brand-300 sm:px-6"
            >
              ComplyEasy AI
            </th>
            <th
              scope="col"
              className="px-4 py-4 text-center text-sm font-semibold text-surface-600 dark:text-surface-300 sm:px-6"
            >
              {competitorName}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.feature}
              className={
                idx % 2 === 0
                  ? 'bg-white dark:bg-surface-950'
                  : 'bg-surface-50/60 dark:bg-surface-900/40'
              }
            >
              <th
                scope="row"
                className="px-4 py-4 text-sm font-medium text-surface-800 dark:text-surface-200 sm:px-6"
              >
                {row.feature}
              </th>
              <td className="px-4 py-4 text-center align-middle sm:px-6">
                <div className="flex justify-center">
                  <Cell value={row.complyEasy} context={`ComplyEasy AI — ${row.feature}`} />
                </div>
              </td>
              <td className="px-4 py-4 text-center align-middle sm:px-6">
                <div className="flex justify-center">
                  <Cell value={row.competitor} context={`${competitorName} — ${row.feature}`} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
export { ComparisonTable };
