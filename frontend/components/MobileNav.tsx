import { LayoutGrid, Calendar, Settings, LogOut, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  labels: {
    inicio: string;
    turnos: string;
    ajustes: string;
  };
}

export function MobileNav({ activeView, onNavigate, onLogout, labels }: MobileNavProps) {
  const tabs = [
    { view: "inicio", label: labels.inicio, icon: <LayoutGrid className="w-5 h-5" /> },
    { view: "turnos", label: labels.turnos, icon: <Calendar className="w-5 h-5" /> },
    { view: "perfil", label: labels.ajustes, icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800 rounded-[2.5rem] h-16 flex items-center justify-around shadow-2xl shadow-slate-200/50 dark:shadow-none">
        {tabs.map(({ view, label, icon }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300",
              activeView === view
                ? "text-blue-600 dark:text-blue-400 scale-110"
                : "text-slate-400 dark:text-slate-500",
            )}
          >
            {icon}
            <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
          </button>
        ))}
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-1 px-3 py-2 text-[9px] font-bold text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Salir</span>
        </button>
      </div>
    </nav>
  );
}

interface MobileFabProps {
  visible: boolean;
  onClick: () => void;
}

export function MobileFab({ visible, onClick }: MobileFabProps) {
  if (!visible) return null;
  return (
    <div className="lg:hidden fixed bottom-28 right-6 z-40">
      <button
        onClick={onClick}
        className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl"
      >
        <Plus className="w-8 h-8 contrast-150" />
      </button>
    </div>
  );
}
