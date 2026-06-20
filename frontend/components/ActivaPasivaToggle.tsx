import { cn } from '../lib/utils';
import { Clock } from 'lucide-react';

interface ActivaPasivaToggleProps {
  shiftSubtype: 'activa' | 'pasiva';
  onChange: (value: 'activa' | 'pasiva') => void;
  language: string;
}

export function ActivaPasivaToggle({ shiftSubtype, onChange, language }: ActivaPasivaToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs">
        <Clock className="w-4 h-4" />
        Guardia
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange('activa')}
          className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
            shiftSubtype === 'activa' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
          {language === 'en' ? 'Active' : 'Activa'}
        </button>
        <button type="button" onClick={() => onChange('pasiva')}
          className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
            shiftSubtype === 'pasiva' ? 'bg-slate-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
          {language === 'en' ? 'Passive' : 'Pasiva'}
        </button>
      </div>
      <span className="text-[10px] text-slate-400 hidden sm:inline">
        {language === 'en' ? 'Shift with additional activities' : 'Creación de guardia con actividades adicionales'}
      </span>
    </div>
  );
}
