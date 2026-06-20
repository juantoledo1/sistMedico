import { Transaction, PaymentStatus } from '../../types';
import { formatCurrency, formatCurrencyFull } from '../../lib/utils';
import { Calendar, PieChart, Clock, TrendingUp } from 'lucide-react';
import { DashboardCard } from './DashboardCard';

interface StatsCardsProps {
  currentMonthTotal: number;
  nextShift: Transaction | null;
  nextOverlapWarning: string | null;
  onOpenForm: () => void;
  goal: number;
}

export function StatsCards({
  currentMonthTotal,
  nextShift,
  nextOverlapWarning,
  onOpenForm,
  goal,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      <DashboardCard
        decoration={
          <div className="w-24 lg:w-32 h-24 lg:h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-12 lg:-mr-16 -mt-12 lg:-mt-16" />
        }
      >
        <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
          <div className="w-10 lg:w-12 h-10 lg:h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl lg:rounded-2xl flex items-center justify-center">
            <Calendar className="w-5 lg:w-6 h-5 lg:h-6" />
          </div>
          <span className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Balance del Mes
          </span>
        </div>
        <div className="space-y-1">
          <span
            className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter block truncate"
            title={formatCurrencyFull(currentMonthTotal)}
          >
            {formatCurrency(currentMonthTotal)}
          </span>
          <div className="flex items-center gap-2 text-green-600 text-[9px] lg:text-[10px] font-black uppercase tracking-widest pt-1 lg:pt-2">
            <TrendingUp className="w-3 lg:w-4 h-3 lg:h-4" />
            vs. año pasado
          </div>
        </div>
      </DashboardCard>

      <DashboardCard className="bg-slate-900 dark:bg-slate-800 text-white hidden md:block">
        <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
          <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/10 text-white rounded-xl lg:rounded-2xl flex items-center justify-center">
            <PieChart className="w-5 lg:w-6 h-5 lg:h-6" />
          </div>
          <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Meta de Ingreso
          </span>
        </div>
        <div className="space-y-3 lg:space-y-4">
          <div className="flex justify-between items-end">
            <span
              className="text-2xl lg:text-3xl font-black tracking-tighter truncate block pr-2"
              title={formatCurrencyFull(currentMonthTotal)}
            >
              {formatCurrency(currentMonthTotal)} / {goal >= 1000000 ? `${goal / 1000000}M` : formatCurrency(goal)}
            </span>
            <span className="text-[9px] lg:text-[10px] font-black text-white/40">
              {Math.min(100, Math.round((currentMonthTotal / goal) * 100))}%
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (currentMonthTotal / goal) * 100)}%` }}
            />
          </div>
        </div>
      </DashboardCard>

      <DashboardCard className="bg-blue-600 text-white shadow-xl shadow-blue-500/20">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
              Próxima Guardia
            </p>
            <div className="w-7 lg:w-8 h-7 lg:h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-3 lg:w-4 h-3 lg:h-4" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg lg:text-2xl font-black tracking-tight leading-tight truncate">
              {nextShift ? nextShift.institution : 'Sin guardias'}
            </h3>
            <p className="text-blue-100 font-bold mt-1 uppercase text-[9px] lg:text-[10px] tracking-widest">
              {nextShift ? `${nextShift.date} \u2022 ${nextShift.startTime || '08:00'}` : 'Agenda disponible'}
            </p>
            {nextShift && (
              <>
                {(() => {
                  const startD = new Date(`${nextShift.date}T${nextShift.startTime || '08:00'}`);
                  const endD = new Date(`${nextShift.endDate || nextShift.date}T${nextShift.endTime || '08:00'}`);
                  const totalH = Math.round((endD.getTime() - startD.getTime()) / 3600000);
                  return (
                    <>
                      <p className="text-blue-200 text-[8px] lg:text-[9px] font-bold mt-1">
                        {totalH}h \u2022 Sale: {nextShift.endTime || '08:00'}
                        {nextShift.endDate && nextShift.endDate !== nextShift.date ? ` (${nextShift.endDate})` : ''}
                      </p>
                      <p className="text-blue-100 text-[8px] lg:text-[9px] font-black mt-0.5">
                        Libre a partir de: {nextShift.endDate || nextShift.date} {nextShift.endTime || '08:00'}
                      </p>
                    </>
                  );
                })()}
                <div className="flex items-center gap-2 mt-4 lg:mt-6">
                  <span className="bg-white/20 px-2 lg:px-3 py-1 text-[8px] lg:text-[9px] font-black rounded-lg uppercase">
                    {nextShift.type}
                  </span>
                  <span className="bg-white/20 px-2 lg:px-3 py-1 text-[8px] lg:text-[9px] font-black rounded-lg uppercase">
                    {nextShift.status === PaymentStatus.PAID ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </>
            )}
            {nextOverlapWarning && (
              <div className="mt-2 bg-red-500/30 px-2 lg:px-3 py-1 rounded-lg text-[8px] lg:text-[9px] font-black text-white">
                {'\u26A0'} Superposición: {nextOverlapWarning}
              </div>
            )}
          </div>
          {!nextShift && (
            <button
              onClick={onOpenForm}
              className="mt-3 lg:mt-4 text-[9px] lg:text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 p-2 rounded-xl text-center"
            >
              Programar ahora
            </button>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
