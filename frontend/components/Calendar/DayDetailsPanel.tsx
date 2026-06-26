import { useState } from 'react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { isToday } from 'date-fns';
import { Clock, FileText, Edit3, Trash2, Plus } from 'lucide-react';
import { Transaction, PaymentStatus, ShiftType } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';

interface DayDetailsPanelProps {
  selectedDay: Date;
  shifts: Transaction[];
  t: any;
  locale: any;
  onOpenForm: (date?: string, tx?: Transaction) => void;
  onDelete: (id: string) => void;
  isModal?: boolean;
}

export function DayDetailsPanel({ selectedDay, shifts, t, locale, onOpenForm, onDelete, isModal }: DayDetailsPanelProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const dayTotal = shifts.reduce((s, t) => s + t.amount, 0);
  const paid = shifts.filter(s => s.status === PaymentStatus.PAID).reduce((s, t) => s + t.amount, 0);
  const pending = shifts.filter(s => s.status === PaymentStatus.PENDING).reduce((s, t) => s + t.amount, 0);

  return (
    <div className={cn(
      "space-y-4 flex flex-col animate-in slide-in-from-right-4 duration-500",
      !isModal && "bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-300 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none min-h-[400px]"
    )}>
      <div className="flex items-center justify-between">
         <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {isToday(selectedDay) ? t.hoy : format(selectedDay, 'EEEE d', { locale })}
            </h3>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
              {shifts.length} {t.turnos} registrados
            </p>
         </div>
         <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-[1.2rem] flex items-center justify-center shrink-0">
           <Clock className="w-6 h-6" />
         </div>
      </div>

      {shifts.length > 0 && (
        <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider">
          <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg">
            Cobrado: ${(paid / 1000).toFixed(0)}k
          </span>
          <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-lg">
            Pendiente: ${(pending / 1000).toFixed(0)}k
          </span>
        </div>
      )}

      <div className="space-y-3 flex-1">
        {shifts.map(shift => (
          <div key={shift.id}
            className="group p-4 rounded-[2rem] bg-slate-100 dark:bg-slate-900/50 border border-transparent hover:border-blue-100 dark:hover:border-blue-900 transition-all space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight truncate leading-none">{shift.institution}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider",
                    shift.type === ShiftType.ACTIVE ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/40' :
                    shift.type === ShiftType.CONSULTATION ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/40' :
                    'text-green-600 bg-green-50 dark:bg-green-900/40')}>
                    {shift.type === ShiftType.ACTIVE ? 'Guardia' : shift.type === ShiftType.CONSULTATION ? 'Proced.' : 'Intercons.'}
                  </span>
                  {shift.startTime && shift.endTime && (
                    <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {shift.startTime}→{shift.endTime}
                      {shift.endDate && shift.endDate !== shift.date && ` (${shift.endDate})`}
                    </span>
                  )}
                  {shift.notes && <FileText className="w-3 h-3 text-slate-300" />}
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tighter">${shift.amount.toLocaleString('es-AR')}</span>
                <span className={cn("block text-[8px] font-black uppercase tracking-widest",
                  shift.status === PaymentStatus.PAID ? 'text-green-500' : 'text-orange-400')}>
                  {shift.status === PaymentStatus.PAID ? '• Pagado' : '• Pendiente'}
                </span>
              </div>
            </div>

            {shift.notes && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium bg-white/50 dark:bg-black/20 p-2 rounded-xl italic">
                "{shift.notes}"
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              {confirmDeleteId === shift.id ? (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-xl border border-red-100 dark:border-red-800">
                  <span className="text-[9px] font-bold text-red-600 whitespace-nowrap">¿Eliminar?</span>
                  <button onClick={() => { onDelete(shift.id); setConfirmDeleteId(null); }}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider min-h-[40px] min-w-[40px]">Sí</button>
                  <button onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider min-h-[40px] min-w-[40px]">No</button>
                </div>
              ) : (
                <>
                  <button onClick={() => onOpenForm(undefined, shift)}
                    className="p-2.5 bg-white dark:bg-slate-800 text-blue-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title={t.editar}><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmDeleteId(shift.id)}
                    className="p-2.5 bg-white dark:bg-slate-800 text-red-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title={t.eliminar}><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </div>
        ))}

        {shifts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-sm">
              <Plus className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Sin registros</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Tocá para añadir actividad</p>
            </div>
            <button onClick={() => onOpenForm(format(selectedDay, 'yyyy-MM-dd'))}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline pt-2">Registrar ahora</button>
          </div>
        )}
      </div>
    </div>
  );
}
