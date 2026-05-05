
import React, { useState, useMemo } from 'react';
import { Transaction, PaymentStatus, UserSettings } from '../types';
import { ChevronDown, Download, Search, ArrowUpRight, Clock, Trash2, Edit3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { translations } from '../translations';

interface IncomeHistoryProps {
  transactions: Transaction[];
  onOpenForm: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  settings: UserSettings;
}

export const IncomeHistory: React.FC<IncomeHistoryProps> = ({ transactions, onOpenForm, onEdit, onDelete, onUpdate, settings }) => {
  const t = translations[settings.language];
  const locale = settings.language === 'es' ? es : enUS;
  const [filter, setFilter] = useState<'Todos' | 'Pagados' | 'Pendientes'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => 
      prev.includes(monthKey) ? prev.filter(m => m !== monthKey) : [...prev, monthKey]
    );
  };

  const filtered = transactions.filter(tran => {
    const matchesFilter = filter === 'Todos' ? true : 
                         filter === 'Pagados' ? tran.status === PaymentStatus.PAID : 
                         tran.status === PaymentStatus.PENDING;
    const matchesSearch = tran.institution.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tran.date.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(tx => {
      try {
        const date = parseISO(tx.date);
        const key = format(date, 'yyyy-MM');
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
      } catch (err) {
        console.error("Error formatting date:", tx.date);
      }
    });

    return groups;
  }, [filtered]);

  // Handle initial expansion safely
  React.useEffect(() => {
    const keys = Object.keys(groupedTransactions).sort().reverse();
    if (keys.length > 0 && expandedMonths.length === 0) {
      setExpandedMonths([keys[0]]);
    }
  }, [groupedTransactions]);

  const monthKeys = Object.keys(groupedTransactions).sort().reverse();

  const totalFiltered = filtered.reduce((acc, tran) => acc + tran.amount, 0);

  return (
    <div className="p-4 lg:p-10 max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{t.finanzas}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-2 opacity-60">Control total de tus ingresos médicos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4 rotate-45" />
            {t.registrar}
          </button>
          <button className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl text-slate-700 dark:text-slate-300 font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <Download className="w-4 h-4" />
            {t.exportar}
          </button>
        </div>
      </div>

      {/* Main Income Summary Card */}
      <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border dark:border-slate-700">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{t.balanceFiltrado}</p>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">$ {totalFiltered.toLocaleString('es-AR')}</h2>
            </div>
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.pagados}</p>
              <p className="font-bold text-green-400">$ {filtered.filter(tr => tr.status === PaymentStatus.PAID).reduce((a, b) => a + b.amount, 0).toLocaleString('es-AR')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.pendientes}</p>
              <p className="font-bold text-orange-400">$ {filtered.filter(tr => tr.status === PaymentStatus.PENDING).reduce((a, b) => a + b.amount, 0).toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por clínica o fecha..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 transition-all shadow-sm font-medium text-slate-900 dark:text-white" 
          />
        </div>
        <div className="flex gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto no-scrollbar">
          {(['Todos', 'Pagados', 'Pendientes'] as const).map((f, fIdx) => (
            <button
              key={`filter-${fIdx}-${f}`}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                filter === f ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              )}
            >
              {f === 'Todos' ? t.verTodo : f === 'Pagados' ? t.pagados : t.pendientes}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List Grouped by Month */}
      <div className="space-y-6">
        {monthKeys.length > 0 ? (
          monthKeys.map((key, kIdx) => {
            const date = parseISO(`${key}-01`);
            const monthName = format(date, 'MMMM yyyy', { locale });
            const isExpanded = expandedMonths.includes(key);
            const monthTotal = groupedTransactions[key].reduce((acc, trans) => acc + trans.amount, 0);

            return (
              <div key={`month-group-${kIdx}-${key}`} className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/30 dark:shadow-none overflow-hidden transition-all">
                <button 
                  onClick={() => toggleMonth(key)}
                  className="w-full flex items-center justify-between p-5 lg:p-6 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize tracking-tight">{monthName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{groupedTransactions[key].length} {t.turnos}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-lg text-slate-900 dark:text-white tracking-tighter shrink-0">$ {monthTotal.toLocaleString('es-AR')}</span>
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 transition-transform duration-300",
                      isExpanded ? "rotate-180" : ""
                    )}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                    {groupedTransactions[key].map((tx, txIdx) => (
                      <div key={`transaction-${tx.id}-${txIdx}`} className="p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <button 
                            onClick={() => onUpdate(tx.id, { 
                              status: tx.status === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID 
                            })}
                            className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 active:scale-95 shadow-sm",
                              tx.status === PaymentStatus.PAID ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                            )}
                          >
                            <Clock className="w-6 h-6 outline-none" />
                          </button>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-tight truncate">{tx.institution}</h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider truncate">{tx.type} • {tx.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                          <div className="text-left sm:text-right">
                            <span className="block font-black text-slate-900 dark:text-white tracking-tighter text-lg shrink-0">$ {tx.amount.toLocaleString('es-AR')}</span>
                            <button 
                              onClick={() => onUpdate(tx.id, { 
                                status: tx.status === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID 
                              })}
                              className={cn(
                                "text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-2",
                                tx.status === PaymentStatus.PAID ? 'text-green-500 dark:text-green-400' : 'text-orange-400'
                              )}
                            >
                              • {tx.status === PaymentStatus.PAID ? t.pagados : t.pendientes}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => onEdit(tx)}
                              className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => onDelete(tx.id)}
                              className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-red-500 dark:text-red-400 rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
            <Search className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500">No se encontraron resultados</h3>
            <p className="text-slate-300 dark:text-slate-600 text-sm">Prueba ajustando tus filtros o búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};
