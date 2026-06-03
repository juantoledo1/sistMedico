import React, { useState } from 'react';
import { format } from 'date-fns';
import { Transaction, PaymentStatus, ShiftType, UserProfile, UserSettings } from '../types';
import { 
  Bell, 
  Search, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Plus, 
  ArrowUpRight,
  PieChart,
  Clock,
  X,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency, formatCurrencyFull } from '../lib/utils';
import { translations } from '../translations';

interface DashboardProps {
  transactions: Transaction[];
  insight: string;
  onOpenForm: () => void;
  onViewReports: () => void;
  userProfile: UserProfile;
  settings: UserSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, insight, onOpenForm, onViewReports, userProfile, settings }) => {
  const t = translations[settings.language];
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  
  const currentMonthTotal = transactions.reduce((acc, tran) => {
    return acc + tran.amount;
  }, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingShifts = transactions
    .filter(tx => tx.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const nextShift = upcomingShifts.length > 0 ? upcomingShifts[0] : null;

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

  const upcomingOverlaps = findOverlaps(upcomingShifts.slice(0, 10));
  const nextOverlapWarning = upcomingOverlaps.length > 0 ? upcomingOverlaps[0] : null;

  const avatars = {
    masc_formal: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=256&h=256&auto=format&fit=crop",
    masc_doctor: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=256&h=256&auto=format&fit=crop",
    masc_scrubs: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=256&h=256&auto=format&fit=crop",
    fem_formal: "https://images.unsplash.com/photo-1584432830680-aa991fbdd858?q=80&w=256&h=256&auto=format&fit=crop",
    fem_doctor: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?q=80&w=256&h=256&auto=format&fit=crop",
    fem_scrubs: "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=256&h=256&auto=format&fit=crop",
  };

  const avatarUrl = avatars[userProfile.avatar] || avatars.masc_doctor;

  const getMonthlyPerformance = (yr: number) => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(yr, i, 1);
      const label = d.toLocaleString(settings.language === 'es' ? 'es-AR' : 'en-US', { month: 'short' });
      const monthYear = format(d, 'yyyy-MM');
      
      const monthTotal = transactions
        .filter(t => t.date.startsWith(monthYear))
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.push({ label, value: monthTotal });
    }
    return months;
  };

  const monthlyData = getMonthlyPerformance(year);
  const annualTotal = monthlyData.reduce((s, m) => s + m.value, 0);
  const maxVal = Math.max(...monthlyData.map(d => d.value), 1000);
  const currentMonth = new Date().getMonth();
  const goal = 1000000;

  const filteredTransactions = searchQuery
    ? transactions.filter(tx => 
        tx.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.date.includes(searchQuery)
      ).slice(0, 10)
    : transactions.slice(0, 4);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-32">
      {/* Header Profile */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img 
              src={avatarUrl} 
              className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl border-2 border-white dark:border-slate-700 shadow-xl relative z-10 bg-slate-50 dark:bg-slate-800 object-cover" 
              alt="Doc" 
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full z-20"></div>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">{t.hola}, {userProfile.name}</h1>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{userProfile.specialty}</p>
          </div>
        </div>
        <div className="flex gap-2 lg:gap-3">
          <button 
            onClick={() => setSearchOpen(true)}
            className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 dark:hover:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all shadow-sm group"
          >
            <Search className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          <button className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 dark:hover:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all shadow-sm relative group">
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="absolute top-2.5 right-2.5 lg:top-3 lg:right-3 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/30 dark:shadow-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 lg:w-32 h-24 lg:h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-12 lg:-mr-16 -mt-12 lg:-mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl lg:rounded-2xl flex items-center justify-center">
                <Calendar className="w-5 lg:w-6 h-5 lg:h-6" />
              </div>
              <span className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.balanceMes}</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter block truncate" title={formatCurrencyFull(currentMonthTotal)}>
                {formatCurrency(currentMonthTotal)}
              </span>
              <div className="flex items-center gap-2 text-green-600 text-[9px] lg:text-[10px] font-black uppercase tracking-widest pt-1 lg:pt-2">
<TrendingUp className="w-3 lg:w-4 h-3 lg:h-4" />
                 {t.vsAnoPasado}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group hidden md:block">
          <div className="relative z-10">
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/10 text-white rounded-xl lg:rounded-2xl flex items-center justify-center">
                <PieChart className="w-5 lg:w-6 h-5 lg:h-6" />
              </div>
              <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.metaIngreso}</span>
            </div>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-2xl lg:text-4xl font-black tracking-tighter truncate block pr-2" title={formatCurrencyFull(currentMonthTotal)}>
                  {formatCurrency(currentMonthTotal)} / {goal >= 1000000 ? `${goal/1000000}M` : formatCurrency(goal)}
                </span>
                <span className="text-[9px] lg:text-[10px] font-black text-white/40">{Math.min(100, Math.round((currentMonthTotal / goal) * 100))}%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (currentMonthTotal / goal) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-600 p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 lg:block overflow-hidden relative group">
           <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{t.proximaGuardia}</p>
                <div className="w-7 lg:w-8 h-7 lg:h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-3 lg:w-4 h-3 lg:h-4" />
                </div>
              </div>
              <div className="flex-1">
                 <h3 className="text-lg lg:text-2xl font-black tracking-tight leading-tight truncate">
                   {nextShift ? nextShift.institution : 'Sin guardias'}
                 </h3>
                 <p className="text-blue-100 font-bold mt-1 uppercase text-[9px] lg:text-[10px] tracking-widest">
                   {nextShift ? `${nextShift.date} • ${nextShift.startTime || '08:00'}` : 'Agenda disponible'}
                 </p>
                 {nextShift && (() => {
                   const startD = new Date(`${nextShift.date}T${nextShift.startTime || '08:00'}`);
                   const endD = new Date(`${nextShift.endDate || nextShift.date}T${nextShift.endTime || '08:00'}`);
                   const totalH = Math.round((endD.getTime() - startD.getTime()) / 3600000);
                   return (
                     <>
                       <p className="text-blue-200 text-[8px] lg:text-[9px] font-bold mt-1">
                         {totalH}h • Sale: {nextShift.endTime || '08:00'}{nextShift.endDate && nextShift.endDate !== nextShift.date ? ` (${nextShift.endDate})` : ''}
                       </p>
                       <p className="text-blue-100 text-[8px] lg:text-[9px] font-black mt-0.5">
                         Libre a partir de: {nextShift.endDate || nextShift.date} {nextShift.endTime || '08:00'}
                       </p>
                     </>
                   );
                 })()}
              </div>
              {nextShift && (
                <div className="flex items-center gap-2 mt-4 lg:mt-6">
                   <span className="bg-white/20 px-2 lg:px-3 py-1 text-[8px] lg:text-[9px] font-black rounded-lg uppercase">{nextShift.type}</span>
                   <span className="bg-white/20 px-2 lg:px-3 py-1 text-[8px] lg:text-[9px] font-black rounded-lg uppercase">{nextShift.status === PaymentStatus.PAID ? t.pagados : t.pendientes}</span>
                </div>
              )}
              {nextOverlapWarning && (
                <div className="mt-2 bg-red-500/30 px-2 lg:px-3 py-1 rounded-lg text-[8px] lg:text-[9px] font-black text-white">
                  ⚠ Superposición: {nextOverlapWarning}
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
      </div>

      {/* Chart and History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/40 dark:shadow-none">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div>
              <h2 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{t.rendimiento}</h2>
              <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 lg:mt-2">
                {`Año ${year}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setYear(y => y - 1)} className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all">
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <span className="text-sm lg:text-base font-black text-slate-900 dark:text-white min-w-[50px] text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()} className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[9px] text-slate-400 font-medium pointer-events-none">
              <span>{formatCurrency(maxVal)}</span>
              <span>{formatCurrency(maxVal / 2)}</span>
              <span>$0</span>
            </div>
            
            {/* Chart Bars */}
            <div className="flex items-end justify-between h-40 lg:h-56 gap-0.5 lg:gap-2 pl-10">
              {monthlyData.map((d, i) => {
                const height = (d.value / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5 lg:gap-2 w-full group relative">
                    <div className="absolute -top-8 lg:-top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-700 text-white text-[10px] lg:text-xs font-bold px-2 py-1 rounded-lg z-20 pointer-events-none whitespace-nowrap shadow-lg">
                      {d.label}: {formatCurrency(d.value)}
                    </div>
                    <div 
                      className={cn(
                        "w-full rounded-xl lg:rounded-2xl transition-all duration-500 relative overflow-hidden",
                        i === currentMonth && year === new Date().getFullYear() ? 'bg-blue-600 shadow-lg shadow-blue-100 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                      )} 
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <span className={cn(
                      "text-[9px] lg:text-[10px] font-medium lg:font-bold uppercase tracking-widest transition-colors",
                      i === currentMonth && year === new Date().getFullYear() ? 'text-blue-600 scale-110' : 'text-slate-400'
                    )}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:gap-6">
            <button 
              onClick={onOpenForm} 
              className="flex flex-col items-center justify-center gap-2 lg:gap-4 bg-blue-600 text-white p-5 lg:p-8 rounded-2xl lg:rounded-[2.5rem] font-bold lg:font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-1 active:translate-y-0 group"
            >
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 rounded-xl lg:rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-90 group-hover:scale-110">
                <Plus className="w-5 lg:w-6 h-5 lg:h-6" />
              </div>
              <span className="text-sm lg:text-base tracking-tight">{t.nuevoTurno}</span>
            </button>
            <button 
              onClick={onViewReports}
              className="flex flex-col items-center justify-center gap-2 lg:gap-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 p-5 lg:p-8 rounded-2xl lg:rounded-[2.5rem] font-bold lg:font-black shadow-lg shadow-slate-100 dark:shadow-none transition-all hover:-translate-y-1 active:translate-y-0 group"
            >
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900 group-hover:text-blue-600 transition-all">
                <PieChart className="w-5 lg:w-6 h-5 lg:h-6" />
              </div>
              <span className="text-sm lg:text-base tracking-tight">{t.reportes}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/40 dark:shadow-none">
          <div className="flex items-center justify-between mb-5 lg:mb-8">
            <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.actividad}</h3>
            <ArrowRight className="w-4 lg:w-5 h-4 lg:h-5 text-slate-400 dark:text-slate-600" />
          </div>
          <div className="space-y-4 lg:space-y-6">
            {filteredTransactions.sort((a,b) => b.date.localeCompare(a.date)).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3 lg:gap-5">
                  <div className={cn(
                    "w-12 lg:w-14 h-12 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all group-hover:scale-105",
                    tx.status === PaymentStatus.PAID ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  )}>
                    <Clock className="w-5 lg:w-6 h-5 lg:h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[120px] lg:max-w-[140px] tracking-tight">{tx.institution}</h4>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "block font-bold text-sm tracking-tight",
                    tx.status === PaymentStatus.PAID ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'
                  )}>
                    {tx.status === PaymentStatus.PAID ? '+' : ''}{formatCurrency(tx.amount)}
                  </span>
                  <span className={cn(
                    "text-[8px] lg:text-[9px] font-medium uppercase tracking-widest",
                    tx.status === PaymentStatus.PAID ? 'text-green-500' : 'text-orange-500'
                  )}>
                    {tx.status === PaymentStatus.PAID ? t.pagados : t.pendientes}
                  </span>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">{t.sinActividadesRecientes}</p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-start justify-center pt-20 lg:pt-32 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={settings.language === 'es' ? 'Buscar por institución o fecha...' : 'Search by institution or date...'}
                  className="flex-1 bg-transparent font-medium text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{tx.institution}</p>
                      <p className="text-xs text-slate-400">{tx.date}</p>
                    </div>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{formatCurrency(tx.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">{settings.language === 'es' ? 'Sin resultados' : 'No results'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};