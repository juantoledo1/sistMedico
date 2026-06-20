import { cn, formatCurrency } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardCard } from './DashboardCard';

interface MonthlyChartProps {
  monthlyData: { label: string; value: number }[];
  year: number;
  currentMonth: number;
  maxVal: number;
  onYearChange: (year: number) => void;
}

export function MonthlyChart({
  monthlyData,
  year,
  currentMonth,
  maxVal,
  onYearChange,
}: MonthlyChartProps) {
  const isCurrentYear = year === new Date().getFullYear();

  return (
    <DashboardCard>
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div>
          <h2 className="text-lg lg:text-xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
            Rendimiento
          </h2>
          <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 lg:mt-2">
            {`Año ${year}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYearChange(year - 1)}
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <span className="text-sm lg:text-base font-black text-slate-900 dark:text-white min-w-[50px] text-center">
            {year}
          </span>
          <button
            onClick={() => onYearChange(year + 1)}
            disabled={year >= new Date().getFullYear()}
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[9px] text-slate-400 font-medium pointer-events-none">
          <span>{formatCurrency(maxVal)}</span>
          <span>{formatCurrency(maxVal / 2)}</span>
          <span>$0</span>
        </div>

        <div className="flex items-end justify-center h-40 lg:h-56 gap-px lg:gap-1 pl-6 lg:pl-10">
          {monthlyData.map((d, i) => {
            const heightPct = (d.value / maxVal) * 100;
            const barFlex = Math.max(heightPct, 2);
            const spacerFlex = 100 - barFlex;
            const isCurrent = i === currentMonth && isCurrentYear;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center group relative h-full lg:max-w-[56px]"
              >
                <div className="absolute -top-8 lg:-top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-700 text-white text-[10px] lg:text-xs font-bold px-2 py-1 rounded-lg z-20 pointer-events-none whitespace-nowrap shadow-lg">
                  {d.label}: {formatCurrency(d.value)}
                </div>
                <div className="w-full" style={{ flex: spacerFlex }} />
                <div
                  className={cn(
                    "w-full rounded-xl lg:rounded-2xl transition-all duration-500",
                    isCurrent
                      ? "bg-blue-600 shadow-lg shadow-blue-100 dark:shadow-none"
                      : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600",
                  )}
                  style={{ flex: barFlex }}
                />
                <span
                  className={cn(
                    "text-[9px] lg:text-[10px] font-medium lg:font-bold uppercase tracking-widest transition-colors",
                    isCurrent ? "text-blue-600 lg:scale-110" : "text-slate-400",
                  )}
                >
                  <span className="lg:hidden">{d.label.charAt(0)}</span>
                  <span className="hidden lg:inline">{d.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardCard>
  );
}
