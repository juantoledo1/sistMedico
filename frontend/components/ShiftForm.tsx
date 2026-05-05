import React, { useState, useEffect } from 'react';
import { ShiftType, Transaction, PaymentStatus, UserSettings, ActivityType } from '../types';
import { X, Check, Landmark, Calendar, FileText, Star, Clock, Stethoscope, UserCheck, AlertCircle } from 'lucide-react';
import { cn, formatCurrencyFull } from '../lib/utils';
import { translations } from '../translations';

interface ShiftFormProps {
  onClose: () => void;
  onSubmit: (tx: Partial<Transaction>) => void;
  initialDate?: string;
  editingTransaction?: Transaction;
  favorites: string[];
  settings: UserSettings;
  defaultType?: 'guardia' | 'procedimiento' | 'interconsulta';
}

const PROCEDURES_DEFAULT = [
  'Vía Central',
  'Intubación Orotraqueal',
  'Punción Lumbar',
  'Sutura',
  'Ecografía Bedside',
  'RCP',
  'Canalización Venosa',
  'Nebulización',
  'Aspiración de Vía Aérea',
  'Cricostomía',
  'Toracostomía',
  'Paracentesis'
];

export const ShiftForm: React.FC<ShiftFormProps> = ({ 
  onClose, 
  onSubmit, 
  initialDate, 
  editingTransaction,
  favorites,
  settings,
  defaultType = 'guardia'
}) => {
  const t = translations[settings.language];
  
  // Type selector: Guardia, Procedimiento, Interconsulta
  const [activityType, setActivityType] = useState<'guardia' | 'procedimiento' | 'interconsulta'>(
    defaultType === 'procedimiento' ? 'procedimiento' : 
    defaultType === 'interconsulta' ? 'interconsulta' : 'guardia'
  );
  
  // Common fields
  const [amount, setAmount] = useState<string>(editingTransaction ? editingTransaction.amount.toLocaleString('es-AR') : '');
  const [date, setDate] = useState<string>(editingTransaction ? editingTransaction.date : (initialDate || new Date().toISOString().split('T')[0]));
  const [institution, setInstitution] = useState(editingTransaction ? editingTransaction.institution : '');
  const [status, setStatus] = useState<PaymentStatus>(editingTransaction ? editingTransaction.status : PaymentStatus.PENDING);
  const [notes, setNotes] = useState(editingTransaction?.notes || '');
  
  // Guardia fields
  const [hours, setHours] = useState<number>(12);
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('08:00');
  const [endDate, setEndDate] = useState<string>(date);
  
  // Procedimiento fields
  const [procedureName, setProcedureName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitValue, setUnitValue] = useState<string>('');
  const [patientInitials, setPatientInitials] = useState<string>('');
  const [procedureSuggestions, setProcedureSuggestions] = useState<string[]>([]);
  
  // Interconsulta fields
  const [specialty, setSpecialty] = useState<string>('');
  const [patientLocation, setPatientLocation] = useState<'intraservicio' | 'extraservicio'>('intraservicio');
  const [complexity, setComplexity] = useState<boolean>(false);
  
  // Effect: Calculate amount for guardia
  useEffect(() => {
    if (activityType === 'guardia' && hours > 0 && hourlyRate) {
      const rawRate = parseInt(hourlyRate.replace(/\D/g, '')) || 0;
      const total = hours * rawRate;
      if (total > 0) setAmount(total.toLocaleString('es-AR'));
    }
  }, [hours, hourlyRate, activityType]);
  
  // Effect: Calculate amount for procedimiento
  useEffect(() => {
    if (activityType === 'procedimiento' && quantity > 0 && unitValue) {
      const rawUnit = parseInt(unitValue.replace(/\D/g, '')) || 0;
      const total = quantity * rawUnit;
      if (total > 0) setAmount(total.toLocaleString('es-AR'));
    }
  }, [quantity, unitValue, activityType]);
  
  // Effect: Apply 50% surcharge for extraservicio
  useEffect(() => {
    if (activityType === 'interconsulta' && amount) {
      const raw = parseInt(amount.replace(/\D/g, '')) || 0;
      const mult = patientLocation === 'extraservicio' || complexity ? 1.5 : 1;
      setAmount((raw * mult).toLocaleString('es-AR'));
    }
  }, [patientLocation, complexity, activityType]);
  
  // Procedure autocomplete
  useEffect(() => {
    if (activityType === 'procedimiento' && procedureName.length >= 1) {
      const filtered = PROCEDURES_DEFAULT.filter(p => 
        p.toLowerCase().includes(procedureName.toLowerCase())
      );
      setProcedureSuggestions(filtered.slice(0, 5));
    } else {
      setProcedureSuggestions([]);
    }
  }, [procedureName, activityType]);
  
  // Close on Escape
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
      setEndDate(initialDate);
    }
  }, [initialDate, editingTransaction]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution || !amount) return;
    
    const cleanAmount = parseInt(amount.replace(/\./g, '')) || 0;
    if (cleanAmount <= 0) return;
    
    onSubmit({
      amount: cleanAmount,
      date,
      institution,
      type: activityType === 'guardia' ? ShiftType.ACTIVE : 
           activityType === 'procedimiento' ? ShiftType.CONSULTATION : ShiftType.PASSIVE,
      status,
      notes,
      id: editingTransaction?.id
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const parseInputNumber = (value: string): number => {
    return parseInt(value.replace(/\D/g, '')) || 0;
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-end lg:items-center justify-center animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-h-[90vh] lg:max-h-[85vh] lg:rounded-t-3xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex-1">
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">
              {editingTransaction ? 'Editar' : 'Nueva Actividad'}
            </h2>
            <p className="text-xs text-slate-500">Tocá fuera para cerrar</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-11 h-11 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
          {/* TYPE SELECTOR - Very visible */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Actividad</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                onClick={() => setActivityType('guardia')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm",
                  activityType === 'guardia' 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                )}
              >
                <Clock className="w-6 h-6" />
                Guardia
              </button>
              <button 
                type="button"
                onClick={() => setActivityType('procedimiento')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm",
                  activityType === 'procedimiento' 
                    ? 'bg-purple-600 border-purple-600 text-white' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                )}
              >
                <Stethoscope className="w-6 h-6" />
                Proced.
              </button>
              <button 
                type="button"
                onClick={() => setActivityType('interconsulta')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm",
                  activityType === 'interconsulta' 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                )}
              >
                <UserCheck className="w-6 h-6" />
                Intercons.
              </button>
            </div>
          </div>

          {/* MAIN AMOUNT - Very big */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Monto Total ($)</label>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black text-blue-600">$</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent text-5xl font-black text-slate-900 dark:text-white w-full text-center outline-none"
                  placeholder="0"
                  disabled={activityType === 'guardia' || activityType === 'procedimiento'}
                />
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">Pesos Argentinos</p>
            </div>
          </div>

          {/* TYPE-SPECIFIC FIELDS */}
          {activityType === 'guardia' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Horas</label>
                <input 
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 font-bold"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">$/Hora</label>
                <input 
                  type="text"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 font-bold"
                />
              </div>
            </div>
          )}

          {activityType === 'procedimiento' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Procedimiento</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={procedureName}
                    onChange={(e) => setProcedureName(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 font-bold"
                  />
                  {procedureSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl mt-1 z-20 shadow-lg">
                      {procedureSuggestions.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setProcedureName(s); setProcedureSuggestions([]); }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Cantidad</label>
                  <input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 font-bold"
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">$/Unitario</label>
                  <input 
                    type="text"
                    value={unitValue}
                    onChange={(e) => setUnitValue(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {activityType === 'interconsulta' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Especialidad</label>
                <input 
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej: Cardiología, UTI..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 font-bold"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Ubicación</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setPatientLocation('intraservicio')}
                    className={cn(
                      "p-3 rounded-xl border-2 font-bold text-sm",
                      patientLocation === 'intraservicio' 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : 'bg-white dark:bg-slate-800 border-slate-200'
                    )}
                  >
                    Intra-servicio
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPatientLocation('extraservicio')}
                    className={cn(
                      "p-3 rounded-xl border-2 font-bold text-sm",
                      patientLocation === 'extraservicio' 
                        ? 'bg-amber-500 border-amber-500 text-white' 
                        : 'bg-white dark:bg-slate-800 border-slate-200'
                    )}
                  >
                    Extra (recargo)
                  </button>
                </div>
              </div>
              
              <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <input 
                  type="checkbox"
                  checked={complexity}
                  onChange={(e) => setComplexity(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-bold text-sm">Alta complejidad (recargo)</span>
              </label>
            </div>
          )}

          {/* COMMON FIELDS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Fecha</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Institución</label>
              <input 
                type="text" 
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Hospital..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 font-bold" 
              />
            </div>
          </div>

          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {favorites.map(fav => (
                <button
                  key={fav}
                  type="button"
                  onClick={() => setInstitution(fav)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold border",
                    institution === fav 
                      ? "bg-blue-600 border-blue-600 text-white" 
                      : "bg-white dark:bg-slate-800 border-slate-200 text-slate-600"
                  )}
                >
                  {fav}
                </button>
              ))}
            </div>
          )}

          {/* Payment Status */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">Estado del Pago</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setStatus(PaymentStatus.PENDING)}
                className={cn(
                  "p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2",
                  status === PaymentStatus.PENDING 
                    ? 'bg-orange-500 border-orange-500 text-white' 
                    : 'bg-white dark:bg-slate-800 border-slate-200'
                )}
              >
                <Clock className="w-4 h-4" />
                Pendiente
              </button>
              <button 
                type="button"
                onClick={() => setStatus(PaymentStatus.PAID)}
                className={cn(
                  "p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2",
                  status === PaymentStatus.PAID 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'bg-white dark:bg-slate-800 border-slate-200'
                )}
              >
                <Check className="w-4 h-4" />
                Pagado
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">Notas (opcional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl p-3 font-medium h-20 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={!institution || !amount}
            className={cn(
              "w-full p-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2",
              institution && amount
                ? "bg-blue-600 text-white" 
                : "bg-slate-300 text-slate-500"
            )}
          >
            <Check className="w-5 h-5" />
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
};