import React, { useState } from 'react';
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
import { ChevronLeft, ChevronRight, Plus, Clock, FileText, Trash2, Edit3, X, Calendar as CalendarIcon } from 'lucide-react';
import { Transaction, PaymentStatus, UserSettings } from '../types';
import { cn } from '../lib/utils';
import { translations } from '../translations';

interface CalendarViewProps {
  transactions: Transaction[];
  onOpenForm: (date?: string, tx?: Transaction) => void;
  onDelete: (id: string) => void;
  settings: UserSettings;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ transactions, onOpenForm, onDelete, settings }) => {
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
    return transactions.filter(tx => tx.date === dateString);
  };

  const selectedDayShifts = getShiftsForDay(selectedDay);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    // On mobile, show a modal for details
    if (window.innerWidth < 1024) {
      setShowDayModal(true);
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{t.turnos}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-2 opacity-60">
            {format(currentDate, 'MMMM yyyy', { locale })}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
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
          <button 
            onClick={() => onOpenForm(format(selectedDay, 'yyyy-MM-dd'))}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-[2rem] font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">{t.nuevoTurno}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid */}
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

                return (
                  <div 
                    key={`day-${dayIdx}-${day.toISOString()}`} 
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "min-h-[100px] lg:min-h-[140px] p-2 lg:p-4 transition-all cursor-pointer relative group flex flex-col",
                      !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-900/10 opacity-30",
                      isSelected ? "bg-blue-50/50 dark:bg-blue-900/20 z-10" : "hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-xs font-black w-8 h-8 flex items-center justify-center rounded-2xl transition-all",
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
                    
                    <div className="space-y-1 mt-auto">
                      {shifts.slice(0, 2).map((shift, sIdx) => (
                        <div 
                          key={`shift-mini-${shift.id}-${sIdx}`} 
                          className={cn(
                            "hidden lg:block text-[9px] p-1.5 rounded-lg border truncate font-black uppercase tracking-tight shadow-sm",
                            shift.status === PaymentStatus.PAID 
                              ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-900/30 dark:border-green-800" 
                              : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800"
                          )}
                        >
                          {shift.institution}
                        </div>
                      ))}
                      {shifts.length > 2 && (
                        <div className="hidden lg:block text-[8px] text-center font-black text-slate-400 dark:text-slate-500">
                          + {shifts.length - 2}
                        </div>
                      )}
                      
                      {/* Mobile Indicator */}
                      <div className="lg:hidden flex justify-center">
                        {shifts.length > 0 && <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1.5 rounded-md">{shifts.length}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day Details Panel (Desktop) */}
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

      {/* Day Details Modal (Mobile) */}
      {showDayModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-end animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full h-[80vh] rounded-t-[3rem] p-8 flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
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
  return (
    <div className={cn(
      "space-y-6 flex flex-col animate-in slide-in-from-right-4 duration-500",
      !isModal && "bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-none min-h-[500px]"
    )}>
      <div className="flex items-center justify-between">
         <div className="min-w-0">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {isToday(selectedDay) ? t.hoy : format(selectedDay, 'EEEE d', { locale })}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
              {shifts.length} {t.turnos} registrados
            </p>
         </div>
         <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-[1.2rem] flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
         </div>
      </div>

      <div className="space-y-4 flex-1">
        {shifts.map(shift => (
          <div 
            key={shift.id} 
            className="group p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-blue-100 dark:hover:border-blue-900 transition-all space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight truncate leading-none">{shift.institution}</h4>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-lg uppercase tracking-wider">{shift.type}</span>
                  {(shift.startTime || shift.endTime) && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {shift.startTime} - {shift.endTime}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-lg text-slate-900 dark:text-white tracking-tighter">
                  $ {shift.amount.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
            
            {shift.endDate && shift.endDate !== shift.date && (
                <div className="flex items-center gap-2 text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 w-fit px-2 py-1 rounded-lg">
                  <CalendarIcon className="w-3 h-3" />
                  {t.fechaFin}: {shift.endDate}
                </div>
            )}
            
            {shift.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium bg-white/50 dark:bg-black/20 p-3 rounded-xl italic">
                "{shift.notes}"
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => onOpenForm(undefined, shift)}
                className="p-3 bg-white dark:bg-slate-800 text-blue-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
                title={t.editar}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(shift.id)}
                className="p-3 bg-white dark:bg-slate-800 text-red-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
                title={t.eliminar}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {shifts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-5 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-sm">
              <Plus className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Sin registros para esta fecha</p>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-tight">Pulsa el botón para añadir un nuevo turno</p>
            </div>
            <button 
              onClick={() => onOpenForm(format(selectedDay, 'yyyy-MM-dd'))}
              className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline pt-2"
            >
              Registar turno ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

