import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, AlertTriangle, Shield, FileText, Users, Clock, ChevronRight, Settings, Volume2, VolumeX, Filter } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  category?: string;
}

type FilterTab = 'all' | 'unread' | 'mentions';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  CONTROL_STATUS_CHANGE: { icon: <Shield size={16} />, color: 'text-blue-500' },
  RISK_ESCALATION: { icon: <AlertTriangle size={16} />, color: 'text-red-500' },
  EVIDENCE_UPLOADED: { icon: <FileText size={16} />, color: 'text-green-500' },
  POLICY_APPROVED: { icon: <Check size={16} />, color: 'text-emerald-500' },
  AUDIT_DEADLINE: { icon: <Clock size={16} />, color: 'text-amber-500' },
  TASK_ASSIGNED: { icon: <Users size={16} />, color: 'text-purple-500' },
  INCIDENT_CREATED: { icon: <AlertTriangle size={16} />, color: 'text-red-600' },
  FRAMEWORK_SCORE_CHANGE: { icon: <Shield size={16} />, color: 'text-indigo-500' },
  VENDOR_RISK_CHANGE: { icon: <AlertTriangle size={16} />, color: 'text-orange-500' },
  REGULATORY_UPDATE: { icon: <FileText size={16} />, color: 'text-cyan-500' },
  SYSTEM_ALERT: { icon: <Bell size={16} />, color: 'text-gray-500' },
};

const NotificationCenter: React.FC = () => {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(0);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      if (response?.status === 'success') {
        setUnreadCount(response.data?.count || response.data?.unreadCount || 0);
      }
    } catch (err) {
      // Notification count fetch is non-critical; log and continue
      console.warn('Failed to fetch unread count', err);
    }
  };

  const fetchNotifications = async (pageNum: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { page: String(pageNum + 1), pageSize: '20' };
      if (activeTab === 'unread') params.isRead = 'false';
      const query = '?' + new URLSearchParams(params).toString();
      const response = await api.get(`/notifications${query}`);
      if (response?.status === 'success') {
        const items = response.data || [];
        if (pageNum === 0) {
          setNotifications(items);
        } else {
          setNotifications(prev => [...prev, ...items]);
        }
        setHasMore(items.length === 20);
        setPage(pageNum);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
      if (pageNum === 0) setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications as read', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.warn('Failed to delete notification', err);
    }
  };

  const getTypeConfig = (type: string) => {
    return TYPE_CONFIG[type] || { icon: <Bell size={16} />, color: 'text-gray-500' };
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'mentions') return n.type === 'TASK_ASSIGNED' || n.message?.includes('@');
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[420px] max-h-[600px] bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('notifications.title')}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-md transition-colors"
                >
                  <CheckCheck size={12} />
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-surface-200 dark:border-surface-700">
            {(['all', 'unread', 'mentions'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {tab}
                {tab === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">{t('common.loading')}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-surface-300 dark:text-surface-600 mb-2" />
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {activeTab === 'unread' ? t('notifications.noNotifications') : t('notifications.noNotifications')}
                </p>
              </div>
            ) : (
              <>
                {filteredNotifications.map(notification => {
                  const config = getTypeConfig(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-750 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
                      }`}
                      onClick={() => {
                        if (!notification.isRead) markAsRead(notification.id);
                      }}
                    >
                      <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-surface-900 dark:text-surface-100 line-clamp-1`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                            className="flex-shrink-0 p-0.5 rounded text-surface-300 hover:text-surface-500 dark:text-surface-600 dark:hover:text-surface-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-surface-400 dark:text-surface-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {hasMore && (
                  <button
                    onClick={() => fetchNotifications(page + 1)}
                    className="w-full py-3 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors"
                  >
                    {isLoading ? t('common.loading') : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-surface-200 dark:border-surface-700 px-4 py-2">
            <button className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              <Settings size={12} />
              {t('notifications.preferences')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
