import { useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { Transaction, PaymentStatus, ShiftType } from '../../types';
import { cn } from '../../lib/utils';
import { getShiftsForDay, isCoverageDay } from './calendarUtils';

interface CalendarGridProps {
  transactions: Transaction[];
  currentDate: Date;
  selectedDay: Date;
  locale: any;
  t: Record<string, string>;
  onDayClick: (day: Date) => void;
}

export function CalendarGrid({
  transactions, currentDate, selectedDay, locale, t, onDayClick,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        {dayNames.map((dayName, dIdx) => (
          <div key={`header-${dIdx}`} className="py-3 lg:py-4 text-center">
            <span className="text-[9px] lg:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {dayName}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-700">
        {calendarDays.map((day, dayIdx) => {
          const shifts = getShiftsForDay(day, transactions);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = isSameDay(day, selectedDay);
          const isActuallyToday = isToday(day);
          const dayTotal = shifts.reduce((s, t) => s + t.amount, 0);
          const multiDayShifts = shifts.filter(s => s.endDate && s.endDate !== s.date && s.type === ShiftType.ACTIVE);
          const hasCoverage = multiDayShifts.some(s => isCoverageDay(day, s));

          return (
            <div
              key={`day-${dayIdx}`}
              onClick={() => onDayClick(day)}
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

              {multiDayShifts.slice(0, 1).map(s => (
                <div key={`cov-${s.id}`} className="text-[6px] font-black text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 px-1 rounded mt-0.5 truncate relative text-center">
                  {s.startTime || '08:00'} → {s.endTime || '08:00'}
                </div>
              ))}

              <div className="space-y-0.5 mt-auto relative">
                {shifts.slice(0, 2).map((shift, sIdx) => (
                  <div
                    key={`shift-mini-${shift.id}`}
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
                  <div className="hidden lg:block text-[7px] text-center font-black text-slate-500 dark:text-slate-400">
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
  );
}
