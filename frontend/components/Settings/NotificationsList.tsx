import { Bell, Info, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../hooks/useNotifications';
import { Language, translations } from '../../translations';
import { useState, useEffect } from 'react';

interface NotificationsListProps {
  language: Language;
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  alert: AlertCircle,
};

const typeColors = {
  info: 'text-blue-600 bg-blue-100',
  warning: 'text-amber-600 bg-amber-100',
  alert: 'text-red-600 bg-red-100',
};

export function NotificationsList({ language }: NotificationsListProps) {
  const t = translations[language];
  const { notifications, loading, error, fetchMine, markAsRead } = useNotifications();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load on mount
  useEffect(() => { fetchMine(); }, [fetchMine]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-red-600 text-sm font-medium text-center py-8">{error}</p>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-slate-400">
        <Bell className="w-12 h-12 mb-3" />
        <p className="font-medium">{t.notifEmpty}</p>
      </div>
    );
  }

  const handleToggle = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.read) {
        markAsRead(id);
      }
    }
  };

  return (
    <div className="space-y-2">
      {notifications.map(n => {
        const Icon = typeIcons[n.type];
        const colorClass = typeColors[n.type];
        const isExpanded = expandedId === n.id;

        return (
          <button
            key={n.id}
            onClick={() => handleToggle(n.id)}
            className={cn(
              'w-full text-left p-4 rounded-2xl transition-all border',
              !n.read
                ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                : 'bg-white border-slate-100 hover:bg-slate-50',
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorClass)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-bold text-sm truncate',
                    !n.read ? 'text-slate-900' : 'text-slate-600',
                  )}>
                    {n.title}
                  </span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(n.created_at).toLocaleDateString(
                    language === 'es' ? 'es-AR' : 'en-US',
                    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
                  )}
                </p>
                {isExpanded && (
                  <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                    {n.message}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-slate-300">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
