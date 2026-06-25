import { Bell, Info, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Loader2, X, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../hooks/useNotifications';
import { translations, Language } from '../../translations';
import { useState, useEffect } from 'react';

interface NotificationsDropdownProps {
  language: Language;
  onClose: () => void;
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  alert: AlertCircle,
};

const typeColors = {
  info: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400',
  warning: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400',
  alert: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400',
};

export function NotificationsDropdown({ language, onClose }: NotificationsDropdownProps) {
  const t = translations[language];
  const { notifications, loading, error, fetchMine, markAsRead, unreadCount } = useNotifications();
  // We keep our own expanded state local to the dropdown
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

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

  // Sort: unread first, then by newest
  const sorted = [...notifications].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const DISPLAY_LIMIT = 20;
  const visible = sorted.slice(0, DISPLAY_LIMIT);
  const hasMore = sorted.length > DISPLAY_LIMIT;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div
        className={cn(
          "absolute right-0 top-full mt-2 z-50",
          "w-[calc(100vw-2rem)] sm:w-[420px]",
          "bg-white dark:bg-slate-800",
          "border border-slate-200 dark:border-slate-700",
          "rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-none",
          "overflow-hidden",
          "animate-in fade-in slide-in-from-top-2 duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.notificaciones}</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[420px] overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <p className="text-red-600 text-sm font-medium text-center py-8">{error}</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400">
              <Bell className="w-10 h-10 mb-3" />
              <p className="font-medium text-sm">{t.notifEmpty}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {visible.map(n => {
                const Icon = typeIcons[n.type];
                const colorClass = typeColors[n.type];
                const isExpanded = expandedId === n.id;

                return (
                  <button
                    key={n.id}
                    onClick={() => handleToggle(n.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl transition-all border',
                      !n.read
                        ? 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-sm truncate',
                            !n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-400',
                          )}>
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(n.created_at).toLocaleDateString(
                            language === 'es' ? 'es-AR' : 'en-US',
                            { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
                          )}
                        </p>
                        {isExpanded && (
                          <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {n.message}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-slate-300 dark:text-slate-600">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-700">
            {hasMore && (
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                {language === 'es' ? `Ver las ${sorted.length} en Ajustes` : `View all ${sorted.length} in Settings`}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="px-5 py-3">
              <p className="text-[11px] text-center text-slate-400">
                {language === 'es'
                  ? 'Presioná una notificación para ver el mensaje completo'
                  : 'Tap a notification to read the full message'}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
