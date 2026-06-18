import React, { useState, useEffect, useRef } from 'react';
import { ShiftType, Transaction, PaymentStatus, UserSettings, Institution } from '../types';
import { X, Check, Clock, Stethoscope, UserCheck, Plus, Trash2, Edit3, Building2, ChevronDown, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import { translations } from '../translations';
import { api } from '../services/api';

interface ExtraActivity {
  id: string;
  type: 'procedimiento' | 'interconsulta';
  procedureName?: string;
  specialty?: string;
  amount: number;
  notes?: string;
  status: PaymentStatus;
}

interface ShiftFormProps {
  onClose: () => void;
  onSubmit: (tx: Partial<Transaction>) => void;
  initialDate?: string;
  editingTransaction?: Transaction;
  transactions?: Transaction[];
  settings: UserSettings;
  institutions: Institution[];
  onInstitutionChange: (inst: Institution) => void;
  onInstitutionDelete: (id: string) => void;
}

const HELP_ICON = String.fromCharCode(0x1F4A1);

export const ShiftForm: React.FC<ShiftFormProps> = ({
  onClose, onSubmit, initialDate, editingTransaction,
  transactions,
  settings,
  institutions, onInstitutionChange, onInstitutionDelete
}) => {
  const t = translations[settings.language];

  const [amount, setAmount] = useState<string>(editingTransaction ? editingTransaction.amount.toLocaleString('es-AR') : '');
  const [date, setDate] = useState<string>(editingTransaction ? editingTransaction.date : (initialDate || new Date().toISOString().split('T')[0]));
  const [institution, setInstitution] = useState(editingTransaction ? editingTransaction.institution : '');
  const [status, setStatus] = useState<PaymentStatus>(editingTransaction ? editingTransaction.status : PaymentStatus.PENDING);
  const [notes, setNotes] = useState(editingTransaction?.notes || '');

  const [startTime, setStartTime] = useState(editingTransaction?.startTime || '08:00');
  const [endTime, setEndTime] = useState(editingTransaction?.endTime || '08:00');
  const [endDate, setEndDate] = useState(editingTransaction?.endDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })());

  const [hours, setHours] = useState<number>(12);
  const [hourlyRate, setHourlyRate] = useState<string>('');

  const [instSearch, setInstSearch] = useState('');
  const [instDropdownOpen, setInstDropdownOpen] = useState(false);
  const instRef = useRef<HTMLDivElement>(null);

  const [instEditMode, setInstEditMode] = useState<boolean>(false);
  const [instEditName, setInstEditName] = useState('');
  const [instEditGuardiaRate, setInstEditGuardiaRate] = useState('');
  const [instEditProcedimientoRate, setInstEditProcedimientoRate] = useState('');
  const [instEditInterconsultaRate, setInstEditInterconsultaRate] = useState('');
  const [instEditId, setInstEditId] = useState<string | null>(null);
  const [instEditSaving, setInstEditSaving] = useState(false);

  const [confirmDeleteInst, setConfirmDeleteInst] = useState<string | null>(null);

  const [extras, setExtras] = useState<ExtraActivity[]>([]);

  const [shiftSubtype, setShiftSubtype] = useState<'activa' | 'pasiva'>('activa');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction && transactions) {
      const sameDayExtras = transactions.filter(t =>
        t.date === editingTransaction.date &&
        t.institution === editingTransaction.institution &&
        t.id !== editingTransaction.id
      );
      setExtras(sameDayExtras.map(t => ({
        id: t.id,
        type: t.type === ShiftType.CONSULTATION ? 'procedimiento' as const : 'interconsulta' as const,
        procedureName: t.notes?.startsWith('procedimiento') ? t.notes : undefined,
        specialty: t.notes?.startsWith('interconsulta') ? t.notes : undefined,
        amount: t.amount,
        notes: t.notes,
        status: t.status || PaymentStatus.PENDING,
      })));
    }
  }, [editingTransaction]);

  useEffect(() => {
    if (date && hours > 0 && startTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const start = new Date(date + 'T' + startTime);
      const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
      const endDateStr = end.toISOString().split('T')[0];
      setEndDate(endDateStr);
      const eh = String(end.getHours()).padStart(2, '0');
      const em = String(end.getMinutes()).padStart(2, '0');
      setEndTime(eh + ':' + em);
    }
  }, [date, hours, startTime]);

  const [editingRateType, setEditingRateType] = useState<'guardia_rate' | 'procedimiento_rate' | 'interconsulta_rate' | null>(null);
  const [tempRateValue, setTempRateValue] = useState('');
  const [rateSavedFeedback, setRateSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (hours > 0 && hourlyRate && hourlyRate.trim() !== '') {
      const rawRate = parseInt(hourlyRate.replace(/\D/g, '')) || 0;
      const et = extras.reduce((s, e) => s + e.amount, 0);
      const total = (hours * rawRate) + et;
      if (total > 0) setAmount(total.toLocaleString('es-AR'));
    }
  }, [hours, hourlyRate, extras]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (initialDate && !editingTransaction) {
      setDate(initialDate);
    }
  }, [initialDate, editingTransaction]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (instRef.current && !instRef.current.contains(e.target as Node)) {
        setInstDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (rateSavedFeedback) {
      const timer = setTimeout(() => setRateSavedFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [rateSavedFeedback]);

  const filteredInstitutions = institutions.filter(i =>
    i.is_active && i.name.toLowerCase().includes(instSearch.toLowerCase())
  );

  const selectedInstitution = institutions.find(i => i.name.toLowerCase().trim() === institution.toLowerCase().trim() && i.is_active);

  const handleSelectInstitution = (name: string) => {
    setInstitution(name);
    setInstSearch('');
    setInstDropdownOpen(false);
    const inst = institutions.find(i => i.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (inst) {
      if (inst.guardia_rate) {
        setHourlyRate(inst.guardia_rate.toString());
      }
      setExtras(extras.map(e => ({
        ...e,
        amount: e.amount === 0
          ? (e.type === 'procedimiento' ? (inst.procedimiento_rate || 0) : (inst.interconsulta_rate || 0))
          : e.amount,
      })));
    }
  };

  const handleOpenNewInst = () => {
    setInstEditMode(true);
    setInstEditName('');
    setInstEditGuardiaRate('');
    setInstEditProcedimientoRate('');
    setInstEditInterconsultaRate('');
    setInstEditId(null);
    setInstDropdownOpen(false);
  };

  const handleEditInst = (inst: Institution) => {
    setInstEditMode(true);
    setInstEditName(inst.name);
    setInstEditGuardiaRate(inst.guardia_rate?.toString() || '');
    setInstEditProcedimientoRate(inst.procedimiento_rate?.toString() || '');
    setInstEditInterconsultaRate(inst.interconsulta_rate?.toString() || '');
    setInstEditId(inst.id);
  };

  const handleSaveInst = async () => {
    if (!instEditName.trim()) return;
    setInstEditSaving(true);
    try {
      if (instEditId) {
        const updated = await api.updateInstitution(instEditId, {
          name: instEditName.trim(),
          guardia_rate: instEditGuardiaRate ? parseInt(instEditGuardiaRate.replace(/\D/g, '')) : null,
          procedimiento_rate: instEditProcedimientoRate ? parseInt(instEditProcedimientoRate.replace(/\D/g, '')) : null,
          interconsulta_rate: instEditInterconsultaRate ? parseInt(instEditInterconsultaRate.replace(/\D/g, '')) : null,
        });
        onInstitutionChange(updated);
      } else {
        const created = await api.createInstitution({
          name: instEditName.trim(),
          guardia_rate: instEditGuardiaRate ? parseInt(instEditGuardiaRate.replace(/\D/g, '')) : null,
          procedimiento_rate: instEditProcedimientoRate ? parseInt(instEditProcedimientoRate.replace(/\D/g, '')) : null,
          interconsulta_rate: instEditInterconsultaRate ? parseInt(instEditInterconsultaRate.replace(/\D/g, '')) : null,
        });
        onInstitutionChange(created);
        setInstitution(created.name);
        setInstSearch('');
        setInstDropdownOpen(true);
      }
      setInstEditMode(false);
    } catch (e) {
      console.error('Error saving institution', e);
    } finally {
      setInstEditSaving(false);
    }
  };

  const handleDeleteInst = async (id: string, name: string) => {
    try {
      await api.updateInstitution(id, { is_active: false });
      onInstitutionDelete(id);
      if (institution === name) {
        setInstitution('');
      }
      setConfirmDeleteInst(null);
    } catch (e) {
      console.error('Error deleting institution', e);
    }
  };

  const handleSaveRateEdit = async (type: 'guardia_rate' | 'procedimiento_rate' | 'interconsulta_rate', value: string) => {
    if (!selectedInstitution) return;
    const numValue = value ? parseInt(value.replace(/\D/g, '')) : null;
    try {
      const updateData: any = {};
      updateData[type] = numValue;
      const updated = await api.updateInstitution(selectedInstitution.id, updateData);
      onInstitutionChange(updated);
      const labels: Record<string, string> = { guardia_rate: 'Guardia', procedimiento_rate: 'Proced.', interconsulta_rate: 'Interc.' };
      setRateSavedFeedback(`${labels[type]} actualizada ${String.fromCharCode(0x2713)}`);
    } catch (e) {
      console.error('Error saving rate', e);
    }
    setEditingRateType(null);
  };

  const addExtra = () => {
    const rate = selectedInstitution?.procedimiento_rate || 0;
    const newExtra: ExtraActivity = {
      id: Math.random().toString(36).slice(2),
      type: 'procedimiento',
      procedureName: '',
      amount: rate,
      notes: '',
      status: PaymentStatus.PENDING,
    };
    setExtras([...extras, newExtra]);
  };

  const updateExtra = (id: string, updates: Partial<ExtraActivity>) => {
    setExtras(extras.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeExtra = (id: string) => {
    setExtras(extras.filter(e => e.id !== id));
  };

  const extraTotal = extras.reduce((s, e) => s + e.amount, 0);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution || !amount || submitting) return;

    const cleanAmount = parseInt(amount.replace(/\./g, '')) || 0;
    if (cleanAmount <= 0) return;

    setSubmitting(true);
    try {
      const rawRate = parseInt(hourlyRate.replace(/\D/g, '')) || 0;
      await onSubmit({
        amount: cleanAmount,
        date,
        endDate,
        startTime,
        endTime,
        institution,
        type: ShiftType.ACTIVE,
        status,
        notes,
        id: editingTransaction?.id,
        duration: hours,
        hourlyRate: rawRate,
        shiftSubtype,
      });

      for (const extra of extras) {
        if (extra.amount > 0) {
          await onSubmit({
            amount: extra.amount,
            date,
            institution,
            type: extra.type === 'procedimiento' ? ShiftType.CONSULTATION : ShiftType.PASSIVE,
            status: extra.status,
            notes: `${extra.type === 'procedimiento' ? extra.procedureName : extra.specialty}${extra.notes ? ': ' + extra.notes : ''}`,
            procedureName: extra.type === 'procedimiento' ? extra.procedureName : undefined,
            specialty: extra.type === 'interconsulta' ? extra.specialty : undefined,
          });
        }
      }
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleStatusToggle = () => {
    setStatus(status === PaymentStatus.PENDING ? PaymentStatus.PAID : PaymentStatus.PENDING);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-end lg:items-center justify-center animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-900 w-full lg:max-w-xl max-h-[90vh] lg:max-h-[85vh] lg:rounded-t-3xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 lg:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex-1">
            <h2 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white">
              {editingTransaction ? 'Editar' : 'Nueva Actividad'}
            </h2>
            <p className="text-[10px] text-slate-500">Tocá fuera para cerrar</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleApply} className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4">
          {/* TYPE BADGE + SUBTYPE TOGGLE */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs">
              <Clock className="w-4 h-4" />
              Guardia
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setShiftSubtype('activa')}
                className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  shiftSubtype === 'activa' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
                Activa
              </button>
              <button type="button" onClick={() => setShiftSubtype('pasiva')}
                className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  shiftSubtype === 'pasiva' ? 'bg-slate-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
                Pasiva
              </button>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">Creación de guardia con actividades adicionales</span>
          </div>

          {/* INSTITUTION */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Institución</label>
            {instEditMode ? (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <input type="text" value={instEditName} onChange={e => setInstEditName(e.target.value)}
                  placeholder="Nombre de la institución"
                  className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 font-bold text-sm text-slate-900 dark:text-white" />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 block mb-1">Guardia ($/h)</label>
                    <input type="text" inputMode="numeric" value={instEditGuardiaRate} onChange={e => setInstEditGuardiaRate(e.target.value)}
                      placeholder="0" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-xl p-2 font-bold text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 block mb-1">Proced. (unit.)</label>
                    <input type="text" inputMode="numeric" value={instEditProcedimientoRate} onChange={e => setInstEditProcedimientoRate(e.target.value)}
                      placeholder="0" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-xl p-2 font-bold text-sm text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 block mb-1">Interc. (c/u)</label>
                    <input type="text" inputMode="numeric" value={instEditInterconsultaRate} onChange={e => setInstEditInterconsultaRate(e.target.value)}
                      placeholder="0" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-xl p-2 font-bold text-sm text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setInstEditMode(false); setInstEditId(null); }}
                    className="flex-1 p-2.5 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-600 text-slate-500">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleSaveInst} disabled={!instEditName.trim() || instEditSaving}
                    className="flex-1 p-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white disabled:opacity-50">
                    {instEditSaving ? 'Guardando...' : instEditId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </div>
            ) : (
              <div ref={instRef} className="relative">
                <div
                  onClick={() => setInstDropdownOpen(!instDropdownOpen)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold flex items-center justify-between cursor-pointer"
                  style={{ minHeight: '40px' }}
                >
                  <span className={institution ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                    {institution || 'Buscar o crear institución...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
                {instDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 z-20 shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                      <input type="text" value={instSearch} onChange={e => setInstSearch(e.target.value)}
                        placeholder="Buscar institución..." autoFocus
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm font-bold text-slate-900 dark:text-white" />
                    </div>
                    {filteredInstitutions.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-slate-400 text-center">Sin resultados</p>
                    ) : (
                      filteredInstitutions.map(inst => (
                        <div key={inst.id} className="flex items-center px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <button type="button" onClick={() => handleSelectInstitution(inst.name)}
                            className="flex-1 text-left text-sm font-bold truncate text-slate-900 dark:text-white" style={{ minHeight: '36px' }}>
                            {inst.name}
                          </button>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => handleEditInst(inst)}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-400 hover:text-blue-600">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => setConfirmDeleteInst(inst.id)}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <button type="button" onClick={handleOpenNewInst}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-blue-600 border-t border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20" style={{ minHeight: '40px' }}>
                      <Plus className="w-4 h-4" /> + Nueva Institución
                    </button>
                  </div>
                )}
              </div>
            )}
            {confirmDeleteInst && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                <p className="text-xs font-bold text-red-600 flex-1">¿Eliminar esta institución? (actividades previas no se afectan)</p>
                <button type="button" onClick={() => {
                  const inst = institutions.find(i => i.id === confirmDeleteInst);
                  if (inst) handleDeleteInst(confirmDeleteInst, inst.name);
                }} className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">Eliminar</button>
                <button type="button" onClick={() => setConfirmDeleteInst(null)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 rounded-lg text-xs font-bold">Cancelar</button>
              </div>
            )}
            {institution && !instEditMode && !selectedInstitution && (
              <p className="text-[10px] text-amber-500 font-bold">
                Atenci\u00F3n: Esta instituci\u00F3n no est\u00E1 en tu lista de instituciones activas.
              </p>
            )}
          </div>

          {/* RATES REFERENCE + INLINE EDIT */}
          {selectedInstitution && !instEditMode && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tarifas de referencia</span>
                <span className="text-[7px] text-slate-300 ml-auto">toc\u00E1 un valor para editar</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  {editingRateType === 'guardia_rate' ? (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Guardia:</span>
                      <input type="text" inputMode="numeric" value={tempRateValue}
                        onChange={(e) => setTempRateValue(e.target.value)}
                        onBlur={(e) => {
                          if (e.relatedTarget?.tagName === 'BUTTON') return;
                          handleSaveRateEdit('guardia_rate', tempRateValue);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRateEdit('guardia_rate', tempRateValue);
                          if (e.key === 'Escape') setEditingRateType(null);
                        }}
                        className="w-16 bg-white dark:bg-slate-700 border border-blue-300 rounded px-1 py-0.5 text-[10px] font-bold text-slate-900 dark:text-white outline-none"
                        autoFocus />
                      <button type="button" onClick={() => handleSaveRateEdit('guardia_rate', tempRateValue)}
                        className="p-0.5 text-green-500 hover:text-green-700"><Check className="w-3 h-3" /></button>
                      <button type="button" onClick={() => setEditingRateType(null)}
                        className="p-0.5 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      Guardia:
                      {selectedInstitution.guardia_rate ? (
                        <span className="text-slate-900 dark:text-white font-bold">${selectedInstitution.guardia_rate.toLocaleString('es-AR')}/h</span>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                      <button type="button" onClick={() => { setEditingRateType('guardia_rate'); setTempRateValue(selectedInstitution.guardia_rate?.toString() || ''); }}
                        className="p-0.5 text-slate-300 hover:text-blue-500 transition-colors" title="Editar tarifa de guardia">
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-purple-400" />
                  {editingRateType === 'procedimiento_rate' ? (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Proced.:</span>
                      <input type="text" inputMode="numeric" value={tempRateValue}
                        onChange={(e) => setTempRateValue(e.target.value)}
                        onBlur={() => setTimeout(() => handleSaveRateEdit('procedimiento_rate', tempRateValue), 200)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRateEdit('procedimiento_rate', tempRateValue);
                          if (e.key === 'Escape') setEditingRateType(null);
                        }}
                        className="w-16 bg-white dark:bg-slate-700 border border-purple-300 rounded px-1 py-0.5 text-[10px] font-bold text-slate-900 dark:text-white outline-none"
                        autoFocus />
                      <button type="button" onClick={() => handleSaveRateEdit('procedimiento_rate', tempRateValue)}
                        className="p-0.5 text-green-500 hover:text-green-700"><Check className="w-3 h-3" /></button>
                      <button type="button" onClick={() => setEditingRateType(null)}
                        className="p-0.5 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      Proced.:
                      {selectedInstitution.procedimiento_rate ? (
                        <span className="text-slate-900 dark:text-white font-bold">${selectedInstitution.procedimiento_rate.toLocaleString('es-AR')}</span>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                      <button type="button" onClick={() => { setEditingRateType('procedimiento_rate'); setTempRateValue(selectedInstitution.procedimiento_rate?.toString() || ''); }}
                        className="p-0.5 text-slate-300 hover:text-blue-500 transition-colors" title="Editar tarifa de procedimiento">
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-green-400" />
                  {editingRateType === 'interconsulta_rate' ? (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Interc.:</span>
                      <input type="text" inputMode="numeric" value={tempRateValue}
                        onChange={(e) => setTempRateValue(e.target.value)}
                        onBlur={() => setTimeout(() => handleSaveRateEdit('interconsulta_rate', tempRateValue), 200)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRateEdit('interconsulta_rate', tempRateValue);
                          if (e.key === 'Escape') setEditingRateType(null);
                        }}
                        className="w-16 bg-white dark:bg-slate-700 border border-green-300 rounded px-1 py-0.5 text-[10px] font-bold text-slate-900 dark:text-white outline-none"
                        autoFocus />
                      <button type="button" onClick={() => handleSaveRateEdit('interconsulta_rate', tempRateValue)}
                        className="p-0.5 text-green-500 hover:text-green-700"><Check className="w-3 h-3" /></button>
                      <button type="button" onClick={() => setEditingRateType(null)}
                        className="p-0.5 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      Interc.:
                      {selectedInstitution.interconsulta_rate ? (
                        <span className="text-slate-900 dark:text-white font-bold">${selectedInstitution.interconsulta_rate.toLocaleString('es-AR')}</span>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                      <button type="button" onClick={() => { setEditingRateType('interconsulta_rate'); setTempRateValue(selectedInstitution.interconsulta_rate?.toString() || ''); }}
                        className="p-0.5 text-slate-300 hover:text-blue-500 transition-colors" title="Editar tarifa de interconsulta">
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
              {rateSavedFeedback && (
                <p className="text-[9px] text-green-600 dark:text-green-400 font-bold animate-in fade-in">{rateSavedFeedback}</p>
              )}
              <p className="text-[8px] text-slate-400 flex items-center gap-1">
                {HELP_ICON} Las tarifas son solo referencia. Ingres\u00E1 los valores manualmente abajo.
              </p>
            </div>
          )}

          {/* MAIN AMOUNT */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Monto Total ($)</label>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl lg:text-3xl font-black text-blue-600">$</span>
                <input type="text" inputMode="numeric" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent text-3xl lg:text-4xl font-black text-slate-900 dark:text-white w-full text-center outline-none"
                  placeholder="0"
                  disabled />
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">Pesos Argentinos</p>
            </div>
          </div>

          {/* HORAS & VALOR HORA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Horas</label>
              <input type="number" value={hours} onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                placeholder="ej: 12"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white" min={1} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">$/Hora</label>
              <input type="text" inputMode="numeric" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="ej: 19000" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white" />
            </div>
          </div>

          {/* DATE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Fecha inicio</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white" />
            </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Fecha fin</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white" />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Hora inicio</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Hora fin</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white" />
            </div>
          </div>

          {/* EXTRAS */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Actividades adicionales</label>
                  <p className="text-[8px] text-slate-400">Agreg\u00E1 procedimientos o interconsultas realizados con sus montos</p>
                </div>
                <button type="button" onClick={addExtra}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline shrink-0" style={{ minHeight: '36px' }}>
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>
            </div>
            {extras.length > 0 && (
              <div className="space-y-2">
                {extras.map(extra => (
                  <div key={extra.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateExtra(extra.id, { type: 'procedimiento', amount: selectedInstitution?.procedimiento_rate || extra.amount })}
                          className={cn("px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase",
                            extra.type === 'procedimiento' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')} style={{ minHeight: '32px' }}>
                          Proced.
                        </button>
                        <button type="button" onClick={() => updateExtra(extra.id, { type: 'interconsulta', amount: selectedInstitution?.interconsulta_rate || extra.amount })}
                          className={cn("px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase",
                            extra.type === 'interconsulta' ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')} style={{ minHeight: '32px' }}>
                          Interc.
                        </button>
                      </div>
                      <button type="button" onClick={() => removeExtra(extra.id)}
                        className="p-2 text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {extra.type === 'procedimiento' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={extra.procedureName || ''} onChange={e => updateExtra(extra.id, { procedureName: e.target.value })}
                          placeholder="Procedimiento" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-900 dark:text-white" />
                        <input type="text" inputMode="numeric" value={extra.amount || ''} onChange={e => updateExtra(extra.id, { amount: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                          placeholder="Monto $" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-900 dark:text-white" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={extra.specialty || ''} onChange={e => updateExtra(extra.id, { specialty: e.target.value })}
                          placeholder="Especialidad" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-900 dark:text-white" />
                        <input type="text" inputMode="numeric" value={extra.amount || ''} onChange={e => updateExtra(extra.id, { amount: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                          placeholder="Monto $" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-900 dark:text-white" />
                      </div>
                    )}
                    <input type="text" value={extra.notes || ''} onChange={e => updateExtra(extra.id, { notes: e.target.value })}
                      placeholder="Notas (opcional)" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-lg p-2 text-sm text-slate-900 dark:text-white" />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => updateExtra(extra.id, { status: PaymentStatus.PENDING })}
                        className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-bold uppercase",
                          extra.status === PaymentStatus.PENDING ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')} style={{ minHeight: '28px' }}>
                        <Clock className="w-2.5 h-2.5" /> Pendiente
                      </button>
                      <button type="button" onClick={() => updateExtra(extra.id, { status: PaymentStatus.PAID })}
                        className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-bold uppercase",
                          extra.status === PaymentStatus.PAID ? 'bg-green-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')} style={{ minHeight: '28px' }}>
                        <Check className="w-2.5 h-2.5" /> Pagado
                      </button>
                    </div>
                  </div>
                ))}
                {extraTotal > 0 && (
                  <p className="text-xs font-bold text-slate-500 text-right">Extra total: ${extraTotal.toLocaleString('es-AR')}</p>
                )}
              </div>
            )}
          </div>

          {/* PAYMENT STATUS - Toggle Pill */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Estado del Pago</label>
            <div
              onClick={handleStatusToggle}
              className={cn(
                "relative w-full lg:max-w-xs lg:mx-auto p-0.5 rounded-xl cursor-pointer transition-all duration-300 flex border",
                status === PaymentStatus.PENDING
                  ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              )}
              style={{ minHeight: '44px' }}
            >
              <div className={cn(
                "flex-1 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300",
                status === PaymentStatus.PENDING
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30 scale-[1.02] z-10"
                  : "text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
              )}>
                <Clock className={status === PaymentStatus.PENDING ? "w-4 h-4" : "w-4 h-4 opacity-50"} />
                Pendiente
              </div>
              <div className={cn(
                "flex-1 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300",
                status === PaymentStatus.PAID
                  ? "bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-green-900/30 scale-[1.02] z-10"
                  : "text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30"
              )}>
                <Check className={status === PaymentStatus.PAID ? "w-4 h-4" : "w-4 h-4 opacity-50"} />
                Pagado
              </div>
            </div>
            <p className="text-[9px] text-slate-400 flex items-center gap-1">
              {HELP_ICON} {status === PaymentStatus.PENDING
                ? "Marcado como Pendiente — toc\u00E1 para cambiar a Pagado"
                : "Marcado como Pagado — toc\u00E1 para cambiar a Pendiente"}
            </p>
          </div>

          {/* NOTES */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">Notas (opcional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-2.5 font-medium h-16 resize-none text-slate-900 dark:text-white" />
          </div>

          {/* SUBMIT */}
          <button type="submit" disabled={!institution || !amount || submitting}
            className={cn("w-full lg:w-auto lg:px-10 lg:mx-auto p-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all",
              institution && amount && !submitting ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]" : "bg-slate-300 text-slate-500 cursor-not-allowed")}>
            <Check className="w-4 h-4" />
            {submitting ? 'Guardando...' : extras.length > 0 ? `Guardar (${extras.length + 1} actividades)` : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
};
