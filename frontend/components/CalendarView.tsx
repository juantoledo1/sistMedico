import React, { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, FileText, Trash2, Edit3, X, Calendar as CalendarIcon, TrendingUp, CreditCard, Wallet } from 'lucide-react';
import { Transaction, PaymentStatus, ShiftType, UserSettings } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { translations } from '../translations';

interface CalendarViewProps {
  transactions: Transaction[];
  onOpenForm: (date?: string, tx?: Transaction) => void;
  onDelete: (id: string) => void;
  settings: UserSettings;
  embedded?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ transactions, onOpenForm, onDelete, settings, embedded }) => {
  const t = translations[settings.language];
  const locale = settings.language === 'es' ? es : enUS;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [showDayModal, setShowDayModal] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getShiftsForDay = (day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    return transactions.filter(tx => {
      if (tx.date === dateString) return true;
      if (tx.endDate && tx.type === ShiftType.ACTIVE) {
        return tx.date <= dateString && tx.endDate >= dateString;
      }
      return false;
    });
  };

  const selectedDayShifts = getShiftsForDay(selectedDay);

  const isCoverageDay = (day: Date, tx: Transaction) => {
    if (!tx.endDate || tx.type !== ShiftType.ACTIVE) return false;
    const dateString = format(day, 'yyyy-MM-dd');
    return tx.date <= dateString && tx.endDate >= dateString && tx.date !== dateString;
  };

  const findOverlaps = (txList: Transaction[]) => {
    const guardias = txList.filter(tx => tx.type === ShiftType.ACTIVE);
    const warnings: string[] = [];
    for (let i = 0; i < guardias.length; i++) {
      for (let j = i + 1; j < guardias.length; j++) {
        const a = guardias[i];
        const b = guardias[j];
        const aStart = new Date(`${a.date}T${a.startTime || '00:00'}`);
        const aEnd = new Date(`${a.endDate || a.date}T${a.endTime || '23:59'}`);
        const bStart = new Date(`${b.date}T${b.startTime || '00:00'}`);
        const bEnd = new Date(`${b.endDate || b.date}T${b.endTime || '23:59'}`);
        if (aStart <= bEnd && bStart <= aEnd) {
          warnings.push(`${a.institution} ↔ ${b.institution}`);
        }
      }
    }
    return warnings;
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    if (window.innerWidth < 1024) {
      setShowDayModal(true);
    }
  };

  const monthSummary = useMemo(() => {
    const monthStr = format(currentDate, 'yyyy-MM');
    const monthTx = transactions.filter(tx => tx.date.startsWith(monthStr));
    const total = monthTx.reduce((s, t) => s + t.amount, 0);
    const paid = monthTx.filter(t => t.status === PaymentStatus.PAID).reduce((s, t) => s + t.amount, 0);
    const pending = monthTx.filter(t => t.status === PaymentStatus.PENDING).reduce((s, t) => s + t.amount, 0);
    const overlaps = findOverlaps(monthTx);
    return { total, paid, pending, count: monthTx.length, overlaps };
  }, [transactions, currentDate]);

  const content = (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              setSelectedDay(now);
            }}
            className="px-4 py-2 text-xs font-black text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            {t.hoy}
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale })}
        </h3>
        {!embedded && (
          <button
            onClick={() => onOpenForm(format(selectedDay, 'yyyy-MM-dd'))}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-[2rem] font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.nuevoTurno}</span>
          </button>
        )}
      </div>

      {monthSummary.overlaps.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 mb-4">
          <span className="text-[10px] font-bold text-red-600">
            ⚠ Superposición detectada: {monthSummary.overlaps.join(', ')}
          </span>
        </div>
      )}

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-blue-600 shrink-0" />
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-sm md:text-lg font-black text-slate-900 dark:text-white truncate">{formatCurrency(monthSummary.total)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1">
            <CreditCard className="w-3 h-3 text-green-600 shrink-0" />
            <span className="text-[9px] font-black text-green-600 uppercase tracking-wider">Cobrado</span>
          </div>
          <p className="text-sm md:text-lg font-black text-green-700 dark:text-green-400 truncate">{formatCurrency(monthSummary.paid)}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet className="w-3 h-3 text-orange-600 shrink-0" />
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider">Pendiente</span>
          </div>
          <p className="text-sm md:text-lg font-black text-orange-700 dark:text-orange-400 truncate">{formatCurrency(monthSummary.pending)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dayName, dIdx) => (
                <div key={`header-${dIdx}-${dayName}`} className="py-3 lg:py-4 text-center">
                  <span className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{dayName}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-50 dark:divide-slate-700">
              {calendarDays.map((day, dayIdx) => {
                const shifts = getShiftsForDay(day);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isSelected = isSameDay(day, selectedDay);
                const isActuallyToday = isToday(day);
                const dayTotal = shifts.reduce((s, t) => s + t.amount, 0);
                const multiDayShifts = shifts.filter(s => s.endDate && s.endDate !== s.date && s.type === ShiftType.ACTIVE);
                const hasCoverage = multiDayShifts.some(s => isCoverageDay(day, s));

                return (
                  <div
                    key={`day-${dayIdx}-${day.toISOString()}`}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "min-h-[90px] lg:min-h-[120px] p-2 lg:p-3 transition-all cursor-pointer relative group flex flex-col",
                      !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-900/10 opacity-30",
                      isSelected ? "bg-blue-50/50 dark:bg-blue-900/20 z-10" : "hover:bg-slate-50/80 dark:hover:bg-slate-900/50",
                      hasCoverage && "bg-blue-50/30 dark:bg-blue-900/10"
                    )}
                  >
                    {hasCoverage && (
                      <div className="absolute inset-x-1 top-7 bottom-1 bg-blue-200/40 dark:bg-blue-700/20 rounded-lg pointer-events-none" />
                    )}
                    <div className="flex justify-between items-start mb-1 relative">
                      <span className={cn(
                        "text-xs font-black w-7 h-7 flex items-center justify-center rounded-2xl transition-all shrink-0",
                        isActuallyToday ? "bg-red-500 text-white shadow-lg shadow-red-200" :
                        isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" :
                        "text-slate-900 dark:text-white"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {shifts.length > 0 && (
                        <div className="flex -space-x-1">
                          {shifts.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full border border-white dark:border-slate-800" />
                          ))}
                        </div>
                      )}
                    </div>

                    {dayTotal > 0 && (
                      <p className="text-[8px] font-black text-slate-900 dark:text-white mt-0.5 truncate relative">
                        ${(dayTotal / 1000).toFixed(0)}k
                      </p>
                    )}

                    {/* Time badges for multi-day coverage */}
                    {multiDayShifts.slice(0, 1).map(s => (
                      <div key={`cov-${s.id}`} className="text-[6px] font-black text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 px-1 rounded mt-0.5 truncate relative text-center">
                        {s.startTime || '08:00'} → {s.endTime || '08:00'}
                      </div>
                    ))}

                    <div className="space-y-0.5 mt-auto relative">
                      {shifts.slice(0, 2).map((shift, sIdx) => (
                        <div
                          key={`shift-mini-${shift.id}-${sIdx}`}
                          className={cn(
                            "hidden lg:block text-[7px] p-1 rounded border font-black uppercase tracking-tight truncate leading-tight",
                            shift.status === PaymentStatus.PAID
                              ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-900/30 dark:border-green-800"
                              : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800"
                          )}
                        >
                          {shift.institution}
                        </div>
                      ))}
                      {shifts.length > 2 && (
                        <div className="hidden lg:block text-[7px] text-center font-black text-slate-400 dark:text-slate-500">
                          + {shifts.length - 2}
                        </div>
                      )}

                      <div className="lg:hidden flex justify-center">
                        {shifts.length > 0 && <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1.5 rounded-md">{shifts.length}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-4 sticky top-10">
          <DayDetailsPanel
            key={selectedDay.toISOString()}
            selectedDay={selectedDay}
            shifts={selectedDayShifts}
            t={t}
            locale={locale}
            onOpenForm={onOpenForm}
            onDelete={onDelete}
          />
        </div>
      </div>

      {showDayModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-end sm:items-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-[3rem] h-[85vh] sm:h-auto sm:max-h-[80vh] rounded-t-[3rem] p-6 lg:p-8 pt-6 flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-6" onClick={() => setShowDayModal(false)} />
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {format(selectedDay, 'EEEE d', { locale })}
              </h2>
              <button onClick={() => setShowDayModal(false)} className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
              <DayDetailsPanel
                selectedDay={selectedDay}
                shifts={selectedDayShifts}
                t={t}
                locale={locale}
                onOpenForm={(date, tx) => {
                  setShowDayModal(false);
                  onOpenForm(date, tx);
                }}
                onDelete={onDelete}
                isModal
              />
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="hidden lg:flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={cn("text-3xl lg:text-4xl font-black tracking-tight leading-none", settings.darkMode ? "text-white" : "text-slate-900")}>{t.turnos}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-2 opacity-60">
            {format(currentDate, 'MMMM yyyy', { locale })}
          </p>
        </div>
      </header>
      {content}
    </div>
  );
};

interface DayDetailsPanelProps {
  selectedDay: Date;
  shifts: Transaction[];
  t: any;
  locale: any;
  onOpenForm: (date?: string, tx?: Transaction) => void;
  onDelete: (id: string) => void;
  isModal?: boolean;
}

const DayDetailsPanel: React.FC<DayDetailsPanelProps> = ({ selectedDay, shifts, t, locale, onOpenForm, onDelete, isModal }) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const dayTotal = shifts.reduce((s, t) => s + t.amount, 0);
  const paid = shifts.filter(s => s.status === PaymentStatus.PAID).reduce((s, t) => s + t.amount, 0);
  const pending = shifts.filter(s => s.status === PaymentStatus.PENDING).reduce((s, t) => s + t.amount, 0);

  return (
    <div className={cn(
      "space-y-4 flex flex-col animate-in slide-in-from-right-4 duration-500",
      !isModal && "bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none min-h-[400px]"
    )}>
      <div className="flex items-center justify-between">
         <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {isToday(selectedDay) ? t.hoy : format(selectedDay, 'EEEE d', { locale })}
            </h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
              {shifts.length} {t.turnos} registrados
            </p>
         </div>
         <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-[1.2rem] flex items-center justify-center shrink-0">
           <Clock className="w-6 h-6" />
         </div>
      </div>

      {/* Day Summary */}
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
          <div
            key={shift.id}
            className="group p-4 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-blue-100 dark:hover:border-blue-900 transition-all space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight truncate leading-none">{shift.institution}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider",
                    shift.type === ShiftType.ACTIVE ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/40' :
                    shift.type === ShiftType.CONSULTATION ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/40' :
                    'text-green-600 bg-green-50 dark:bg-green-900/40'
                  )}>{shift.type === ShiftType.ACTIVE ? 'Guardia' : shift.type === ShiftType.CONSULTATION ? 'Proced.' : 'Intercons.'}</span>
                  {shift.startTime && shift.endTime && (
                    <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {shift.startTime}→{shift.endTime}
                      {shift.endDate && shift.endDate !== shift.date && ` (${shift.endDate})`}
                    </span>
                  )}
                  {shift.notes && (
                    <FileText className="w-3 h-3 text-slate-300" />
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tighter">
                  ${shift.amount.toLocaleString('es-AR')}
                </span>
                <span className={cn(
                  "block text-[8px] font-black uppercase tracking-widest",
                  shift.status === PaymentStatus.PAID ? 'text-green-500' : 'text-orange-400'
                )}>
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
                  <button
                    onClick={() => { onDelete(shift.id); setConfirmDeleteId(null); }}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
                    style={{ minHeight: '40px', minWidth: '40px' }}
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider"
                    style={{ minHeight: '40px', minWidth: '40px' }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onOpenForm(undefined, shift)}
                    className="p-2.5 bg-white dark:bg-slate-800 text-blue-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title={t.editar}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(shift.id)}
                    className="p-2.5 bg-white dark:bg-slate-800 text-red-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title={t.eliminar}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Tocá para añadir actividad</p>
            </div>
            <button
              onClick={() => onOpenForm(format(selectedDay, 'yyyy-MM-dd'))}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline pt-2"
            >
              Registrar ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

