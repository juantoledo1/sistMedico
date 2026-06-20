import { useState, useEffect } from 'react';
import { Clock, Stethoscope, UserCheck, Check, X, Pencil, Building2 } from 'lucide-react';
import { Institution } from '../types';
import { cn } from '../lib/utils';
import { api } from '../services/api';

interface RateEditorProps {
  institution: Institution;
  onInstitutionChange: (inst: Institution) => void;
}

export function RateEditor({ institution, onInstitutionChange }: RateEditorProps) {
  const HELP_ICON = String.fromCharCode(0x1F4A1);
  const [editingRateType, setEditingRateType] = useState<'guardia_rate' | 'procedimiento_rate' | 'interconsulta_rate' | null>(null);
  const [tempRateValue, setTempRateValue] = useState('');
  const [rateSavedFeedback, setRateSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (rateSavedFeedback) {
      const timer = setTimeout(() => setRateSavedFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [rateSavedFeedback]);

  const handleSaveRateEdit = async (type: 'guardia_rate' | 'procedimiento_rate' | 'interconsulta_rate', value: string) => {
    const numValue = value ? parseInt(value.replace(/\D/g, '')) : null;
    try {
      const updateData: any = {};
      updateData[type] = numValue;
      const updated = await api.updateInstitution(institution.id, updateData);
      onInstitutionChange(updated);
      const labels: Record<string, string> = { guardia_rate: 'Guardia', procedimiento_rate: 'Proced.', interconsulta_rate: 'Interc.' };
      setRateSavedFeedback(`${labels[type]} actualizada ${String.fromCharCode(0x2713)}`);
    } catch (e) {
      console.error('Error saving rate', e);
    }
    setEditingRateType(null);
  };

  const renderRateRow = (
    label: string,
    type: 'guardia_rate' | 'procedimiento_rate' | 'interconsulta_rate',
    icon: React.ReactNode,
    borderColor: string,
    value: number | null | undefined,
  ) => (
    <div className="flex items-center gap-1">
      {icon}
      {editingRateType === type ? (
        <div className="flex items-center gap-1">
          <span className="text-slate-500">{label}:</span>
          <input type="text" inputMode="numeric" value={tempRateValue}
            onChange={(e) => setTempRateValue(e.target.value)}
            onBlur={(e) => {
              if (e.relatedTarget?.tagName === 'BUTTON') return;
              handleSaveRateEdit(type, tempRateValue);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRateEdit(type, tempRateValue);
              if (e.key === 'Escape') setEditingRateType(null);
            }}
            className={cn("w-16 bg-white dark:bg-slate-700 border rounded px-1 py-0.5 text-[10px] font-bold text-slate-900 dark:text-white outline-none", borderColor)}
            autoFocus />
          <button type="button" onClick={() => handleSaveRateEdit(type, tempRateValue)}
            className="p-0.5 text-green-500 hover:text-green-700"><Check className="w-3 h-3" /></button>
          <button type="button" onClick={() => setEditingRateType(null)}
            className="p-0.5 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <span className="flex items-center gap-1 text-slate-500">
          {label}:
          {value ? (
            <span className="text-slate-900 dark:text-white font-bold">${value.toLocaleString('es-AR')}{type === 'guardia_rate' ? '/h' : ''}</span>
          ) : (
            <span className="text-slate-300 italic">—</span>
          )}
          <button type="button" onClick={() => { setEditingRateType(type); setTempRateValue(value?.toString() || ''); }}
            className="p-0.5 text-slate-300 hover:text-blue-500 transition-colors">
            <Pencil className="w-2.5 h-2.5" />
          </button>
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <Building2 className="w-3 h-3 text-slate-400" />
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tarifas de referencia</span>
        <span className="text-[7px] text-slate-300 ml-auto">tocá un valor para editar</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {renderRateRow('Guardia', 'guardia_rate', <Clock className="w-3 h-3 text-blue-400" />, 'border-blue-300', institution.guardia_rate)}
        {renderRateRow('Proced.', 'procedimiento_rate', <Stethoscope className="w-3 h-3 text-purple-400" />, 'border-purple-300', institution.procedimiento_rate)}
        {renderRateRow('Interc.', 'interconsulta_rate', <UserCheck className="w-3 h-3 text-green-400" />, 'border-green-300', institution.interconsulta_rate)}
      </div>
      {rateSavedFeedback && (
        <p className="text-[9px] text-green-600 dark:text-green-400 font-bold animate-in fade-in">{rateSavedFeedback}</p>
      )}
      <p className="text-[8px] text-slate-400 flex items-center gap-1">
        {HELP_ICON} Las tarifas son solo referencia. Ingresá los valores manualmente abajo.
      </p>
    </div>
  );
}
