import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { api } from '../services/api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export const useNotifications = () => {
  const { subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications?limit=50');
        // fetchAPI returns parsed JSON: { status, data: { notifications, ... } }
        const envelope = response?.data ?? response ?? {};
        const items = envelope.notifications ?? envelope.data ?? [];
        if (Array.isArray(items)) {
          setNotifications(items);
        }
      } catch (error) {
        console.warn('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        // fetchAPI returns parsed JSON: { status, data: { unreadCount } }
        const envelope = response?.data ?? response ?? {};
        const count = envelope.unreadCount ?? envelope.data?.unreadCount ?? 0;
        setUnreadCount(count);
      } catch {
        // Silently fail — expected if not authenticated
      }
    };

    fetchNotifications();
    fetchUnreadCount();
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubscribe = subscribe('notification:new', (notification: AppNotification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 100));
      setUnreadCount(prev => prev + 1);

      // Browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.warn('Failed to mark all as read:', error);
    }
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    requestBrowserPermission,
  };
};

export default useNotifications;
