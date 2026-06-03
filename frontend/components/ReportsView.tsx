import React, { useState, useMemo } from 'react';
import { Transaction, PaymentStatus, ShiftType, UserSettings, Actividad, ActivityType } from '../types';
import { CalendarView } from './CalendarView';
import {
  ArrowLeft, 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Download, 
  Building2,
  Calendar,
  Filter,
  Printer,
  Clock,
  Stethoscope,
  UserCheck,
  FileText,
  Search,
  ChevronDown,
  Edit3,
  Trash2
} from 'lucide-react';
import { translations } from '../translations';
import { cn, formatCurrency } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ReportsViewProps {
  transactions: Transaction[];
  settings: UserSettings;
  onBack: () => void;
  onOpenForm: (date?: string, tx?: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
}

type PeriodFilter = 'thisMonth' | 'lastMonth' | 'thisWeek' | 'all' | 'custom';
type ActivityFilter = 'Todos' | ActivityType;

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, settings, onBack, onOpenForm, onEdit, onDelete, onUpdate }) => {
  const t = translations[settings.language];
  const locale = settings.language === 'es' ? es : enUS;
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('thisMonth');
  const [institutionFilter, setInstitutionFilter] = useState<string>('Todas');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('Todos');
  const [showPrintView, setShowPrintView] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pagados' | 'Pendientes'>('Todos');
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  
  const actividades = transactions;
  
  const filteredActividades = useMemo(() => {
    let filtered = actividades;
    const now = new Date();
    
    if (periodFilter === 'thisMonth') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      filtered = filtered.filter(a => {
        const d = parseISO(a.date);
        return d >= start && d <= end;
      });
    } else if (periodFilter === 'lastMonth') {
      const start = startOfMonth(subMonths(now, 1));
      const end = endOfMonth(subMonths(now, 1));
      filtered = filtered.filter(a => {
        const d = parseISO(a.date);
        return d >= start && d <= end;
      });
    } else if (periodFilter === 'thisWeek') {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      filtered = filtered.filter(a => {
        const d = parseISO(a.date);
        return d >= start && d <= end;
      });
    }
    
    if (institutionFilter !== 'Todas') {
      filtered = filtered.filter(a => a.institution === institutionFilter);
    }
    
    if (activityFilter !== 'Todos') {
      const shiftMap: Record<string, ShiftType> = {
        [ActivityType.GUARDIA]: ShiftType.ACTIVE,
        [ActivityType.PROCEDIMIENTO]: ShiftType.CONSULTATION,
        [ActivityType.INTERCONSULTA]: ShiftType.PASSIVE,
      };
      const targetType = shiftMap[activityFilter];
      if (targetType) {
        filtered = filtered.filter(a => a.type === targetType);
      }
    }
    
    return filtered;
  }, [actividades, periodFilter, institutionFilter, activityFilter]);
  
  const institutions = ['Todas', ...new Set(actividades.map(a => a.institution))];
  
  const totalGuardias = filteredActividades
    .filter(a => a.type === ShiftType.ACTIVE)
    .reduce((sum, a) => sum + a.amount, 0);
  
  const totalProcedimientos = filteredActividades
    .filter(a => a.type === ShiftType.CONSULTATION)
    .reduce((sum, a) => sum + a.amount, 0);
  
  const totalInterconsultas = filteredActividades
    .filter(a => a.type === ShiftType.PASSIVE)
    .reduce((sum, a) => sum + a.amount, 0);
  
  const totalInvoiced = totalGuardias + totalProcedimientos + totalInterconsultas;
  const totalPaid = filteredActividades
    .filter(a => a.status === PaymentStatus.PAID)
    .reduce((sum, a) => sum + a.amount, 0);
  const totalPending = filteredActividades
    .filter(a => a.status === PaymentStatus.PENDING)
    .reduce((sum, a) => sum + a.amount, 0);
  
  const periodLabels = {
    thisMonth: settings.language === 'es' ? 'Este Mes' : 'This Month',
    lastMonth: settings.language === 'es' ? 'Mes Anterior' : 'Last Month',
    thisWeek: settings.language === 'es' ? 'Esta Semana' : 'This Week',
    all: settings.language === 'es' ? 'Todos' : 'All',
    custom: settings.language === 'es' ? 'Personalizado' : 'Custom'
  };

  const detailFiltered = useMemo(() => {
    let filtered = filteredActividades;
    if (statusFilter === 'Pagados') {
      filtered = filtered.filter(t => t.status === PaymentStatus.PAID);
    } else if (statusFilter === 'Pendientes') {
      filtered = filtered.filter(t => t.status === PaymentStatus.PENDING);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.institution.toLowerCase().includes(q) || t.date.includes(q));
    }
    return filtered;
  }, [filteredActividades, statusFilter, searchQuery]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    detailFiltered.forEach(tx => {
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
  }, [detailFiltered]);

  React.useEffect(() => {
    const keys = Object.keys(groupedTransactions).sort().reverse();
    if (keys.length > 0 && expandedMonths.length === 0) {
      setExpandedMonths([keys[0]]);
    }
  }, [groupedTransactions]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => 
      prev.includes(monthKey) ? prev.filter(m => m !== monthKey) : [...prev, monthKey]
    );
  };

  const monthKeys = Object.keys(groupedTransactions).sort().reverse();

  if (showPrintView) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-in fade-in duration-300 print:bg-white print:text-black">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <button 
            onClick={() => setShowPrintView(false)}
            className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
        
        <div className="bg-white p-8 rounded-2xl border border-slate-200">
          <div className="text-center border-b border-slate-200 pb-6 mb-6">
            <h1 className="text-2xl font-black text-slate-900">MedFlow Pro</h1>
            <h2 className="text-lg font-bold text-slate-600">Reporte de Actividad Profesional</h2>
            <p className="text-sm text-slate-500 mt-1">
              {periodLabels[periodFilter]} {institutionFilter !== 'Todas' ? `• ${institutionFilter}` : ''}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Generado: {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(totalInvoiced)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-xs font-bold text-green-600 uppercase">Cobrado</p>
              <p className="text-xl font-black text-green-700">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-xs font-bold text-orange-600 uppercase">Pendiente</p>
              <p className="text-xl font-black text-orange-700">{formatCurrency(totalPending)}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-slate-700 mb-3">Resumen por Tipo</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex justify-between bg-blue-50 p-3 rounded-lg">
                <span className="font-medium">Guardias:</span>
                <span className="font-bold">{formatCurrency(totalGuardias)}</span>
              </div>
              <div className="flex justify-between bg-purple-50 p-3 rounded-lg">
                <span className="font-medium">Procedimientos:</span>
                <span className="font-bold">{formatCurrency(totalProcedimientos)}</span>
              </div>
              <div className="flex justify-between bg-green-50 p-3 rounded-lg">
                <span className="font-medium">Interconsultas:</span>
                <span className="font-bold">{formatCurrency(totalInterconsultas)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-700 mb-3">Detalle de Actividades</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-2 font-bold">Fecha</th>
                  <th className="text-left p-2 font-bold">Tipo</th>
                  <th className="text-left p-2 font-bold">Institución</th>
                  <th className="text-left p-2 font-bold">Detalle</th>
                  <th className="text-right p-2 font-bold">Monto</th>
                  <th className="text-right p-2 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredActividades.sort((a, b) => b.date.localeCompare(a.date)).map((a, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-2">{a.date}</td>
                    <td className="p-2">
                      {a.type === ActivityType.GUARDIA && 'Guardia'}
                      {a.type === ActivityType.PROCEDIMIENTO && 'Proc.'}
                      {a.type === ActivityType.INTERCONSULTA && 'Inter.'}
                    </td>
                    <td className="p-2">{a.institution}</td>
                    <td className="p-2 text-xs">
                      {a.type === ActivityType.PROCEDIMIENTO && a.procedureName}
                      {a.type === ActivityType.INTERCONSULTA && `${a.specialty}${a.patientLocation === 'extraservicio' ? ' (Extra)' : ''}`}
                      {a.type === ActivityType.GUARDIA && `${a.hours}h`}
                      {a.notes && <span className="block text-slate-400 italic">📝 {a.notes}</span>}
                    </td>
                    <td className="p-2 text-right font-medium">{formatCurrency(a.amount)}</td>
                    <td className="p-2 text-right">
                      {a.status === PaymentStatus.PAID ? '✓' : '⏳'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={cn("text-2xl lg:text-3xl font-black tracking-tight", settings.darkMode ? "text-white" : "text-slate-900")}>{t.guardias || 'Guardias'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Análisis detallado de tu actividad profesional.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowPrintView(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir PDF</span>
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select 
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none text-sm"
          >
            <option value="thisMonth">{periodLabels.thisMonth}</option>
            <option value="lastMonth">{periodLabels.lastMonth}</option>
            <option value="thisWeek">{periodLabels.thisWeek}</option>
            <option value="all">{periodLabels.all}</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select 
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value)}
            className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none text-sm"
          >
            {institutions.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value as ActivityFilter)}
            className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none text-sm"
          >
            <option value="Todos">Todos los tipos</option>
            <option value={ActivityType.GUARDIA}>Guardias</option>
            <option value={ActivityType.PROCEDIMIENTO}>Procedimientos</option>
            <option value={ActivityType.INTERCONSULTA}>Interconsultas</option>
          </select>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
          </div>
          <p className="text-base md:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(totalInvoiced)}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Guardias</span>
          </div>
          <p className="text-base md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(totalGuardias)}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Proced.</span>
          </div>
          <p className="text-base md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(totalProcedimientos)}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Intercons.</span>
          </div>
          <p className="text-base md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(totalInterconsultas)}</p>
        </div>
      </div>

      {/* Paid/Pending */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-600 p-6 rounded-2xl text-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold uppercase opacity-70">Cobrado</span>
          </div>
          <p className="text-xl md:text-2xl lg:text-3xl font-black truncate">{formatCurrency(totalPaid)}</p>
          <p className="text-xs mt-2 opacity-60">
            {filteredActividades.filter(a => a.status === PaymentStatus.PAID).length} actividades cobradas
          </p>
        </div>
        
        <div className="bg-orange-500 p-6 rounded-2xl text-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold uppercase opacity-70">Pendiente</span>
          </div>
          <p className="text-xl md:text-2xl lg:text-3xl font-black truncate">{formatCurrency(totalPending)}</p>
          <p className="text-xs mt-2 opacity-60">
            {filteredActividades.filter(a => a.status === PaymentStatus.PENDING).length} actividades pendientes
          </p>
        </div>
      </div>

      {/* Activity Breakdown - Calendar View */}
      <div className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Calendario de Actividades</h3>
          <button 
            onClick={() => onOpenForm()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            + Registrar
          </button>
        </div>
        
        <CalendarView
          transactions={transactions}
          onOpenForm={onOpenForm}
          onDelete={onDelete}
          settings={settings}
          embedded
        />
      </div>

      {/* Download Button */}
      <button 
        onClick={() => setShowPrintView(true)}
        className="w-full py-6 bg-slate-900 dark:bg-slate-800 rounded-2xl text-white shadow-2xl flex flex-col items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
      >
        <Printer className="w-8 h-8" />
        <div>
          <p className="font-bold text-lg">Exportar Reporte Completo</p>
          <p className="text-sm text-slate-400">PDF listo para imprimir • Incluye todos los detalles</p>
        </div>
      </button>
    </div>
  );
};