import { Transaction, PaymentStatus } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { Clock, ArrowRight } from 'lucide-react';
import { DashboardCard } from './DashboardCard';

interface TransactionHistoryProps {
  transactions: Transaction[];
  pagadosLabel: string;
  pendientesLabel: string;
  activityLabel: string;
  emptyLabel: string;
}

export function TransactionHistory({
  transactions,
  pagadosLabel,
  pendientesLabel,
  activityLabel,
  emptyLabel,
}: TransactionHistoryProps) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between mb-5 lg:mb-8">
        <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {activityLabel}
        </h3>
        <ArrowRight className="w-4 lg:w-5 h-4 lg:h-5 text-slate-400 dark:text-slate-600" />
      </div>
      <div className="space-y-4 lg:space-y-6">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3 lg:gap-5">
              <div
                className={cn(
                  "w-12 lg:w-14 h-12 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all group-hover:scale-105",
                  tx.status === PaymentStatus.PAID
                    ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
                )}
              >
                <Clock className="w-5 lg:w-6 h-5 lg:h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[120px] lg:max-w-[140px] tracking-tight">
                  {tx.institution}
                </h4>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">
                  {tx.date}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  "block font-bold text-sm tracking-tight",
                  tx.status === PaymentStatus.PAID
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-900 dark:text-white",
                )}
              >
                {tx.status === PaymentStatus.PAID ? "+" : ""}
                {formatCurrency(tx.amount)}
              </span>
              <span
                className={cn(
                  "text-[8px] lg:text-[9px] font-medium uppercase tracking-widest",
                  tx.status === PaymentStatus.PAID
                    ? "text-green-500"
                    : "text-orange-500",
                )}
              >
                {tx.status === PaymentStatus.PAID ? pagadosLabel : pendientesLabel}
              </span>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-4">{emptyLabel}</p>
        )}
      </div>
    </DashboardCard>
  );
}
