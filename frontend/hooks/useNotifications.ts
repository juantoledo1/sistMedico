import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { Notification } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.getUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // Silently fail — badge is non-critical
    }
  }, []);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyNotifications();
      setNotifications(data);
      // Refresh badge after listing
      await fetchUnreadCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [fetchUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silent
    }
  }, []);

  // Load unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchMine,
    fetchUnreadCount,
    markAsRead,
  };
}
