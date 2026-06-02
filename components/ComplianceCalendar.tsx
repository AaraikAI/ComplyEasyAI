/**
 * Compliance Calendar Component
 *
 * Interactive calendar for compliance deadline management:
 * - Month/Week/Day views with navigation
 * - Deadline creation/editing with modal dialogs
 * - Color-coded deadline types (audit, certification, policy review, DSAR, breach, etc.)
 * - Filtering by type, framework, and status
 * - Reminder configuration and overdue tracking with red highlighting
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  Calendar as CalendarIcon,
  Plus,
  X,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Bell,
  Edit,
  Trash2,
  Shield,
  FileText,
  AlertCircle,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type ViewMode = 'month' | 'week' | 'day';

type DeadlineType =
  | 'audit'
  | 'certification_renewal'
  | 'policy_review'
  | 'dsar_response'
  | 'breach_notification'
  | 'training'
  | 'risk_assessment'
  | 'vendor_review'
  | 'regulatory_filing'
  | 'other';

type DeadlineStatus = 'upcoming' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type ReminderUnit = 'days' | 'weeks' | 'months';
type Recurrence = 'none' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

interface Reminder {
  amount: number;
  unit: ReminderUnit;
  notifyEmail: boolean;
  notifyInApp: boolean;
}

interface Deadline {
  id: string;
  title: string;
  description: string;
  type: DeadlineType;
  status: DeadlineStatus;
  dueDate: string;
  framework: string;
  assignee: string;
  priority: Priority;
  reminders: Reminder[];
  recurrence: Recurrence;
  notes: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface DeadlineForm {
  title: string;
  description: string;
  type: DeadlineType;
  dueDate: string;
  framework: string;
  assignee: string;
  priority: Priority;
  reminders: Reminder[];
  recurrence: Recurrence;
  notes: string;
}

interface Filters {
  type: DeadlineType | 'all';
  framework: string;
  status: DeadlineStatus | 'all';
  search: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const API_BASE = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3001/api';
const apiUrl = API_BASE.endsWith('/api') ? API_BASE : API_BASE.replace(/\/?$/, '') + '/api';

const TYPE_LABELS: Record<DeadlineType, string> = {
  audit: 'Audit',
  certification_renewal: 'Certification Renewal',
  policy_review: 'Policy Review',
  dsar_response: 'DSAR Response',
  breach_notification: 'Breach Notification',
  training: 'Training',
  risk_assessment: 'Risk Assessment',
  vendor_review: 'Vendor Review',
  regulatory_filing: 'Regulatory Filing',
  other: 'Other',
};

const TYPE_COLORS: Record<DeadlineType, string> = {
  audit: 'bg-blue-500',
  certification_renewal: 'bg-purple-500',
  policy_review: 'bg-teal-500',
  dsar_response: 'bg-orange-500',
  breach_notification: 'bg-red-500',
  training: 'bg-green-500',
  risk_assessment: 'bg-amber-500',
  vendor_review: 'bg-indigo-500',
  regulatory_filing: 'bg-pink-500',
  other: 'bg-gray-500',
};

const TYPE_TEXT: Record<DeadlineType, string> = {
  audit: 'text-blue-600 dark:text-blue-400',
  certification_renewal: 'text-purple-600 dark:text-purple-400',
  policy_review: 'text-teal-600 dark:text-teal-400',
  dsar_response: 'text-orange-600 dark:text-orange-400',
  breach_notification: 'text-red-600 dark:text-red-400',
  training: 'text-green-600 dark:text-green-400',
  risk_assessment: 'text-amber-600 dark:text-amber-400',
  vendor_review: 'text-indigo-600 dark:text-indigo-400',
  regulatory_filing: 'text-pink-600 dark:text-pink-400',
  other: 'text-gray-600 dark:text-gray-400',
};

const STATUS_LABELS: Record<DeadlineStatus, string> = {
  upcoming: 'Upcoming',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const PRIORITY_LABELS: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

const FRAMEWORKS = ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'PCI DSS', 'NIST CSF', 'CCPA', 'FedRAMP', 'SOX', 'Other'];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}

function getDaysInMonth(y: number, m: number): number { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number): number { return new Date(y, m, 1).getDay(); }
function isSameDay(a: Date, b: Date): boolean { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isOverdue(dueDate: string, status: DeadlineStatus): boolean { return status !== 'completed' && status !== 'cancelled' && new Date(dueDate) < new Date(new Date().toDateString()); }
function formatDate(d: string): string { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtDateStr(d: Date): string { return d.toISOString().split('T')[0]; }

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
}

const emptyForm: DeadlineForm = {
  title: '', description: '', type: 'audit', dueDate: fmtDateStr(new Date()),
  framework: 'SOC 2', assignee: '', priority: 'medium',
  reminders: [{ amount: 7, unit: 'days', notifyEmail: true, notifyInApp: true }],
  recurrence: 'none', notes: '',
};

// ── Component ───────────────────────────────────────────────────────────────

const ComplianceCalendar: React.FC = () => {
  const { t } = useI18n();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [viewingDeadline, setViewingDeadline] = useState<Deadline | null>(null);
  const [form, setForm] = useState<DeadlineForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({ type: 'all', framework: '', status: 'all', search: '' });

  // ── API ────────────────────────────────────────────────────────────────

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      params.set('startDate', new Date(y, m - 1, 1).toISOString());
      params.set('endDate', new Date(y, m + 2, 0).toISOString());
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.framework) params.set('framework', filters.framework);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`${apiUrl}/calendar/deadlines?${params}`, { headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch deadlines: ${res.status}`);
      const data = await res.json();
      setDeadlines(Array.isArray(data) ? data : data.deadlines || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deadlines');
    } finally {
      setLoading(false);
    }
  }, [currentDate, filters]);

  useEffect(() => { fetchDeadlines(); }, [fetchDeadlines]);

  // Client-side guards mirror the backend createDeadlineSchema/updateDeadlineSchema
  // validators so the user gets immediate feedback before the request is sent.
  const validateForm = (): string | null => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.dueDate) return 'Due date is required.';
    if (Number.isNaN(new Date(form.dueDate).getTime())) return 'Due date is invalid.';
    if (form.assignee.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.assignee.trim())) {
      return 'Assignee must be a valid email address.';
    }
    for (const r of form.reminders) {
      if (!Number.isFinite(r.amount) || r.amount < 1 || r.amount > 365) {
        return 'Each reminder must be between 1 and 365 units before the due date.';
      }
    }
    return null;
  };

  const saveDeadline = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      const url = editingDeadline ? `${apiUrl}/calendar/deadlines/${editingDeadline.id}` : `${apiUrl}/calendar/deadlines`;
      const res = await fetch(url, { method: editingDeadline ? 'PUT' : 'POST', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(form) });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      setShowModal(false);
      setEditingDeadline(null);
      setForm(emptyForm);
      await fetchDeadlines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deadline');
    } finally {
      setSaving(false);
    }
  };

  const deleteDeadline = async (id: string) => {
    if (!confirm('Delete this deadline?')) return;
    try {
      const res = await fetch(`${apiUrl}/calendar/deadlines/${id}`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('Delete failed');
      setViewingDeadline(null);
      await fetchDeadlines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const markComplete = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/calendar/deadlines/${id}/complete`, { method: 'PATCH', headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('Failed to complete');
      setViewingDeadline(null);
      await fetchDeadlines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete');
    }
  };

  // ── Computed ───────────────────────────────────────────────────────────

  const processed = useMemo(() =>
    deadlines.map(d => ({ ...d, status: isOverdue(d.dueDate, d.status) ? 'overdue' as DeadlineStatus : d.status })),
    [deadlines]
  );

  const deadlinesForDate = useCallback(
    (date: Date) => processed.filter(d => isSameDay(new Date(d.dueDate), date)),
    [processed]
  );

  const overdueCount = useMemo(() => processed.filter(d => d.status === 'overdue').length, [processed]);
  const upcomingCount = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 30);
    return processed.filter(d => d.status !== 'completed' && d.status !== 'cancelled' && new Date(d.dueDate) >= today && new Date(d.dueDate) <= cutoff).length;
  }, [processed]);
  const completedCount = useMemo(() => processed.filter(d => d.status === 'completed').length, [processed]);

  // ── Navigation ────────────────────────────────────────────────────────

  const navigatePrev = () => { const d = new Date(currentDate); if (viewMode === 'month') d.setMonth(d.getMonth() - 1); else if (viewMode === 'week') d.setDate(d.getDate() - 7); else d.setDate(d.getDate() - 1); setCurrentDate(d); };
  const navigateNext = () => { const d = new Date(currentDate); if (viewMode === 'month') d.setMonth(d.getMonth() + 1); else if (viewMode === 'week') d.setDate(d.getDate() + 7); else d.setDate(d.getDate() + 1); setCurrentDate(d); };
  const goToToday = () => setCurrentDate(new Date());

  const openCreate = (date?: Date) => { setEditingDeadline(null); setForm({ ...emptyForm, dueDate: fmtDateStr(date || new Date()) }); setShowModal(true); };
  const openEdit = (dl: Deadline) => {
    setEditingDeadline(dl);
    setForm({ title: dl.title, description: dl.description, type: dl.type, dueDate: dl.dueDate.split('T')[0], framework: dl.framework, assignee: dl.assignee, priority: dl.priority, reminders: dl.reminders.length ? dl.reminders : [{ amount: 7, unit: 'days', notifyEmail: true, notifyInApp: true }], recurrence: dl.recurrence, notes: dl.notes });
    setViewingDeadline(null);
    setShowModal(true);
  };

  const addReminder = () => setForm(p => ({ ...p, reminders: [...p.reminders, { amount: 1, unit: 'days', notifyEmail: true, notifyInApp: true }] }));
  const removeReminder = (i: number) => setForm(p => ({ ...p, reminders: p.reminders.filter((_, idx) => idx !== i) }));
  const updateReminder = (i: number, field: keyof Reminder, val: number | string | boolean) => setForm(p => ({ ...p, reminders: p.reminders.map((r, idx) => idx === i ? { ...r, [field]: val } : r) }));

  const navLabel = useMemo(() => {
    if (viewMode === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (viewMode === 'week') { const w = getWeekDays(currentDate); return `${w[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${w[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`; }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [currentDate, viewMode]);

  // ── Month View ────────────────────────────────────────────────────────

  const renderMonth = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const daysIn = getDaysInMonth(y, m), firstDay = getFirstDayOfMonth(y, m), prevDays = getDaysInMonth(y, m - 1);
    const cells: React.ReactNode[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevDays - i;
      cells.push(<div key={`p${day}`} className="min-h-[90px] p-1 border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 opacity-40"><span className="text-xs text-surface-400">{day}</span></div>);
    }

    for (let day = 1; day <= daysIn; day++) {
      const date = new Date(y, m, day);
      const dl = deadlinesForDate(date);
      const isToday_ = isSameDay(date, today);
      const isSel = selectedDate && isSameDay(date, selectedDate);
      const hasOD = dl.some(d => d.status === 'overdue');

      cells.push(
        <div key={`d${day}`} onClick={() => setSelectedDate(date)} onDoubleClick={() => openCreate(date)}
          className={`min-h-[90px] p-1 border cursor-pointer transition-colors ${isToday_ ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : isSel ? 'border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : hasOD ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : 'border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday_ ? 'bg-blue-600 text-white' : 'text-surface-700 dark:text-surface-300'}`}>{day}</span>
            {dl.length > 0 && <span className="text-[10px] text-surface-500 dark:text-surface-400">{dl.length}</span>}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dl.slice(0, 3).map(d => (
              <button key={d.id} onClick={e => { e.stopPropagation(); setViewingDeadline(d); }}
                className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white ${d.status === 'overdue' ? 'bg-red-600 animate-pulse' : TYPE_COLORS[d.type]}`}>
                {d.title}
              </button>
            ))}
            {dl.length > 3 && <span className="text-[10px] text-surface-500 pl-1">+{dl.length - 3} more</span>}
          </div>
        </div>
      );
    }

    const rem = 42 - cells.length;
    for (let d = 1; d <= rem; d++) {
      cells.push(<div key={`n${d}`} className="min-h-[90px] p-1 border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 opacity-40"><span className="text-xs text-surface-400">{d}</span></div>);
    }

    return (
      <div>
        <div className="grid grid-cols-7">
          {DAYS_OF_WEEK.map(d => (<div key={d} className="px-2 py-2 text-center text-xs font-semibold text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">{d}</div>))}
        </div>
        <div className="grid grid-cols-7">{cells}</div>
      </div>
    );
  };

  // ── Week View ─────────────────────────────────────────────────────────

  const renderWeek = () => {
    const wDays = getWeekDays(currentDate);
    return (
      <div className="overflow-auto">
        <div className="grid grid-cols-7 min-w-[700px]">
          {wDays.map((date, i) => {
            const dl = deadlinesForDate(date);
            const isToday_ = isSameDay(date, today);
            return (
              <div key={i} className="border border-surface-200 dark:border-surface-700">
                <div className={`px-2 py-2 text-center text-xs font-semibold border-b border-surface-200 dark:border-surface-700 ${isToday_ ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
                  <div>{DAYS_OF_WEEK[date.getDay()]}</div>
                  <div className={`text-lg ${isToday_ ? 'font-bold' : ''}`}>{date.getDate()}</div>
                </div>
                <div className="min-h-[400px] p-1 space-y-1 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800" onDoubleClick={() => openCreate(date)}>
                  {dl.map(d => (
                    <button key={d.id} onClick={() => setViewingDeadline(d)}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded text-white ${d.status === 'overdue' ? 'bg-red-600' : TYPE_COLORS[d.type]}`}>
                      <div className="font-medium truncate">{d.title}</div>
                      <div className="opacity-80 text-[10px]">{TYPE_LABELS[d.type]}</div>
                    </button>
                  ))}
                  {dl.length === 0 && <div className="text-center text-xs text-surface-400 dark:text-surface-500 pt-4">No deadlines</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Day View ──────────────────────────────────────────────────────────

  const renderDay = () => {
    const dl = deadlinesForDate(currentDate);
    return (
      <div className="space-y-0">
        <div className={`px-4 py-3 border-b border-surface-200 dark:border-surface-700 ${isSameDay(currentDate, today) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-surface-50 dark:bg-surface-800'}`}>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400">{dl.length} deadline{dl.length !== 1 ? 's' : ''}</p>
        </div>
        {dl.length > 0 ? (
          <div className="divide-y divide-surface-200 dark:divide-surface-700">
            {dl.map(d => (
              <button key={d.id} onClick={() => setViewingDeadline(d)} className="w-full text-left px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${d.status === 'overdue' ? 'bg-red-600 animate-pulse' : TYPE_COLORS[d.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{d.title}</span>
                      {d.status === 'overdue' && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">OVERDUE</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                      <span className={TYPE_TEXT[d.type]}>{TYPE_LABELS[d.type]}</span>
                      <span>{d.framework}</span>
                      {d.assignee && <span>Assigned: {d.assignee}</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium flex-shrink-0 ${d.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : d.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : d.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                    {PRIORITY_LABELS[d.priority]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CalendarIcon className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-sm text-surface-500 dark:text-surface-400">No deadlines for this day</p>
            <button onClick={() => openCreate(currentDate)} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">Add a deadline</button>
          </div>
        )}
      </div>
    );
  };

  // ── Create/Edit Modal ─────────────────────────────────────────────────

  const renderFormModal = () => {
    if (!showModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{editingDeadline ? 'Edit Deadline' : 'Create Deadline'}</h2>
            <button onClick={() => { setShowModal(false); setEditingDeadline(null); setForm(emptyForm); }} className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., SOC 2 Type II Audit"
                className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Detailed description..."
                className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Type <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as DeadlineType }))}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-blue-500">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Framework</label>
                <select value={form.framework} onChange={e => setForm(p => ({ ...p, framework: e.target.value }))}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-blue-500">
                  {FRAMEWORKS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Due Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Assignee</label>
                <input type="text" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} placeholder="e.g., compliance@company.com"
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Recurrence</label>
                <select value={form.recurrence} onChange={e => setForm(p => ({ ...p, recurrence: e.target.value as Recurrence }))}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="none">None</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="semi_annual">Semi-Annual</option><option value="annual">Annual</option>
                </select>
              </div>
            </div>

            {/* Reminders */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Reminders</label>
                <button onClick={addReminder} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
              </div>
              {form.reminders.map((r, i) => (
                <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                  <input type="number" min={1} value={r.amount} onChange={e => updateReminder(i, 'amount', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
                  <select value={r.unit} onChange={e => updateReminder(i, 'unit', e.target.value)}
                    className="px-2 py-1 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm">
                    <option value="days">Days Before</option><option value="weeks">Weeks Before</option><option value="months">Months Before</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs text-surface-600 dark:text-surface-400">
                    <input type="checkbox" checked={r.notifyEmail} onChange={e => updateReminder(i, 'notifyEmail', e.target.checked)} className="rounded border-surface-300 text-blue-600" /> Email
                  </label>
                  <label className="flex items-center gap-1 text-xs text-surface-600 dark:text-surface-400">
                    <input type="checkbox" checked={r.notifyInApp} onChange={e => updateReminder(i, 'notifyInApp', e.target.checked)} className="rounded border-surface-300 text-blue-600" /> In-App
                  </label>
                  <button onClick={() => removeReminder(i)} className="p-1 text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-end gap-3">
            <button onClick={() => { setShowModal(false); setEditingDeadline(null); setForm(emptyForm); }} className="px-4 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200">{t('common.cancel')}</button>
            <button onClick={saveDeadline} disabled={saving || !form.title.trim() || !form.dueDate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg">
              {saving ? t('common.loading') : editingDeadline ? t('common.save') : t('common.create')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── View Detail Modal ─────────────────────────────────────────────────

  const renderDetail = () => {
    if (!viewingDeadline) return null;
    const dl = viewingDeadline;
    const od = isOverdue(dl.dueDate, dl.status);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${od ? 'bg-red-600 animate-pulse' : TYPE_COLORS[dl.type]}`} />
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{dl.title}</h2>
            </div>
            <button onClick={() => setViewingDeadline(null)} className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-6 py-4 space-y-4">
            {od && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">This deadline is overdue</span>
              </div>
            )}
            {dl.description && <p className="text-sm text-surface-600 dark:text-surface-400">{dl.description}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3">
                <span className="text-xs text-surface-500 dark:text-surface-400">Type</span>
                <p className={`text-sm font-medium ${TYPE_TEXT[dl.type]}`}>{TYPE_LABELS[dl.type]}</p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3">
                <span className="text-xs text-surface-500 dark:text-surface-400">Framework</span>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{dl.framework}</p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3">
                <span className="text-xs text-surface-500 dark:text-surface-400">Due Date</span>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{formatDate(dl.dueDate)}</p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3">
                <span className="text-xs text-surface-500 dark:text-surface-400">Priority</span>
                <p className={`text-sm font-medium ${dl.priority === 'critical' ? 'text-red-600 dark:text-red-400' : dl.priority === 'high' ? 'text-orange-600 dark:text-orange-400' : dl.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>{PRIORITY_LABELS[dl.priority]}</p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3">
                <span className="text-xs text-surface-500 dark:text-surface-400">{t('common.status')}</span>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{od ? t('calendar.overdue') : STATUS_LABELS[dl.status]}</p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3">
                <span className="text-xs text-surface-500 dark:text-surface-400">{t('calendar.recurring')}</span>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100 capitalize">{dl.recurrence === 'semi_annual' ? 'Semi-Annual' : dl.recurrence === 'none' ? 'One-time' : dl.recurrence}</p>
              </div>
            </div>
            {dl.assignee && (
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3">
                <span className="text-xs text-surface-500 dark:text-surface-400">Assignee</span>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{dl.assignee}</p>
              </div>
            )}
            {dl.reminders && dl.reminders.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">Reminders</h4>
                <div className="space-y-1">
                  {dl.reminders.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400">
                      <Bell className="w-3 h-3" /> {r.amount} {r.unit} before
                      {r.notifyEmail && <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Email</span>}
                      {r.notifyInApp && <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">In-App</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dl.notes && <div><h4 className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Notes</h4><p className="text-sm text-surface-600 dark:text-surface-400">{dl.notes}</p></div>}
          </div>
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <button onClick={() => deleteDeadline(dl.id)} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}</button>
            <div className="flex items-center gap-2">
              {dl.status !== 'completed' && (
                <button onClick={() => markComplete(dl.id)} className="px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 rounded-lg flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {t('calendar.completed')}</button>
              )}
              <button onClick={() => openEdit(dl)} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1"><Edit className="w-3.5 h-3.5" /> {t('common.edit')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Main ──────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
      <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('calendar.title')}</h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">Track and manage compliance deadlines across all frameworks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'}`}><Filter className="w-4 h-4" /></button>
            <button onClick={fetchDeadlines} disabled={loading} className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={() => openCreate()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"><Plus className="w-4 h-4" /> {t('calendar.addEvent')}</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" /><span className="text-xs font-medium text-red-700 dark:text-red-300">{t('calendar.overdue')}</span></div>
            <span className="text-2xl font-bold text-red-700 dark:text-red-300">{overdueCount}</span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /><span className="text-xs font-medium text-amber-700 dark:text-amber-300">Next 30 Days</span></div>
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{upcomingCount}</span>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /><span className="text-xs font-medium text-green-700 dark:text-green-300">{t('calendar.completed')}</span></div>
            <span className="text-2xl font-bold text-green-700 dark:text-green-300">{completedCount}</span>
          </div>
        </div>

        {showFilters && (
          <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4 mb-4 grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-surface-400" />
                <input type="text" value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Type</label>
              <select value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value as DeadlineType | 'all' }))}
                className="w-full px-3 py-1.5 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm">
                <option value="all">All Types</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Framework</label>
              <select value={filters.framework} onChange={e => setFilters(p => ({ ...p, framework: e.target.value }))}
                className="w-full px-3 py-1.5 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm">
                <option value="">All Frameworks</option>
                {FRAMEWORKS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Status</label>
              <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value as DeadlineStatus | 'all' }))}
                className="w-full px-3 py-1.5 border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm">
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={navigatePrev} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 min-w-[260px] text-center">{navLabel}</h2>
            <button onClick={navigateNext} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"><ChevronRight className="w-5 h-5" /></button>
            <button onClick={goToToday} className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">{t('calendar.today')}</button>
          </div>
          <div className="flex items-center bg-surface-100 dark:bg-surface-700 rounded-lg p-0.5">
            {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize ${viewMode === mode ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'}`}>
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="ml-3 text-sm text-surface-500 dark:text-surface-400">{t('common.loading')}</span>
        </div>
      ) : (
        <div className="p-4">
          {viewMode === 'month' && renderMonth()}
          {viewMode === 'week' && renderWeek()}
          {viewMode === 'day' && renderDay()}
        </div>
      )}

      <div className="px-6 py-3 border-t border-surface-200 dark:border-surface-700">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400">Legend:</span>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[k as DeadlineType]}`} />
              <span className="text-xs text-surface-600 dark:text-surface-400">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {renderFormModal()}
      {renderDetail()}
    </div>
  );
};

export default ComplianceCalendar;
