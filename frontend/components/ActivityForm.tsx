import React, { useState, useEffect } from 'react';
import { ActivityType, Actividad, PaymentStatus, UserSettings } from '../types';
import { X, Check, Landmark, Calendar, Activity, FileText, Star, Clock, Stethoscope, UserCheck, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { translations } from '../translations';

interface ActivityFormProps {
  onClose: () => void;
  onSubmit: (actividad: Partial<Actividad>) => void;
  initialDate?: string;
  editingActividad?: Actividad;
  favorites: string[];
  settings: UserSettings;
  proceduresList?: string[];
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

export const ActivityForm: React.FC<ActivityFormProps> = ({ 
  onClose, 
  onSubmit, 
  initialDate, 
  editingActividad,
  favorites,
  settings,
  proceduresList = PROCEDURES_DEFAULT
}) => {
  const t = translations[settings.language];
  const [activityType, setActivityType] = useState<ActivityType>(
    editingActividad ? editingActividad.type : ActivityType.GUARDIA
  );
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(
    editingActividad ? editingActividad.date : (initialDate || new Date().toISOString().split('T')[0])
  );
  const [institution, setInstitution] = useState(editingActividad ? editingActividad.institution : '');
  const [status, setStatus] = useState<PaymentStatus>(
    editingActividad ? editingActividad.status : PaymentStatus.PENDING
  );
  const [notes, setNotes] = useState(editingActividad?.notes || '');
  
  // Guardia fields
  const [hours, setHours] = useState<number>(12);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
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
  
  useEffect(() => {
    if (initialDate && !editingActividad) {
      setDate(initialDate);
      setEndDate(initialDate);
    }
  }, [initialDate, editingActividad]);
  
  useEffect(() => {
    if (activityType === ActivityType.GUARDIA && hours > 0 && hourlyRate > 0) {
      const total = hours * hourlyRate;
      setAmount(total.toLocaleString('es-AR'));
    }
  }, [hours, hourlyRate, activityType]);
  
  useEffect(() => {
    if (activityType === ActivityType.PROCEDIMIENTO && procedureName.length >= 2) {
      const filtered = proceduresList.filter(p => 
        p.toLowerCase().includes(procedureName.toLowerCase())
      );
      setProcedureSuggestions(filtered.slice(0, 5));
    } else {
      setProcedureSuggestions([]);
    }
  }, [procedureName, activityType, proceduresList]);
  
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution || !amount || parseFloat(amount.replace(/\./g, '').replace(',', '.')) <= 0) {
      return;
    }
    
    const cleanAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    const id = editingActividad?.id;
    const baseData = {
      id,
      type: activityType,
      institution,
      date,
      amount: cleanAmount,
      status,
      notes,
      createdAt: editingActividad?.createdAt || new Date().toISOString(),
      synced: false
    };
    
    if (activityType === ActivityType.GUARDIA) {
      onSubmit({
        ...baseData,
        type: ActivityType.GUARDIA,
        hours,
        hourlyRate,
        startTime,
        endTime,
        endDate
      });
    } else if (activityType === ActivityType.PROCEDIMIENTO) {
      onSubmit({
        ...baseData,
        type: ActivityType.PROCEDIMIENTO,
        procedureName,
        quantity,
        unitValue: parseFloat(unitValue.replace(/\./g, '').replace(',', '.')),
        patientInitials: patientInitials.slice(0, 2).toUpperCase()
      });
    } else if (activityType === ActivityType.INTERCONSULTA) {
      let finalAmount = cleanAmount;
      if (patientLocation === 'extraservicio' || complexity) {
        finalAmount = cleanAmount * 1.5;
        setAmount(finalAmount.toLocaleString('es-AR'));
      }
      onSubmit({
        ...baseData,
        type: ActivityType.INTERCONSULTA,
        specialty,
        patientLocation,
        complexity,
        patientInitials: patientInitials.slice(0, 2).toUpperCase()
      });
    }
  };
  
  const isValid = institution && amount && parseFloat(amount.replace(/\./g, '').replace(',', '.')) > 0;
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end lg:items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full lg:max-w-2xl h-[95vh] lg:h-auto lg:max-h-[95vh] lg:rounded-[3rem] shadow-2xl overflow-y-auto p-6 lg:p-12 flex flex-col animate-in slide-in-from-bottom duration-500 scrollbar-hide border-t lg:border border-slate-100 dark:border-slate-800">
        <header className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {editingActividad ? t.editar : t.registrarGuardia}
            </h2>
            <p className="text-xs lg:text-sm font-bold text-slate-400 dark:text-slate-500 mt-2">Carga tu actividad profesional</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all flex items-center justify-center">
            <X className="w-6 h-6" />
          </button>
        </header>
        
        <form onSubmit={handleApply} className="space-y-5 lg:space-y-6 flex-1">
          {/* Activity Type Selector */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Tipo de Actividad</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: ActivityType.GUARDIA, label: 'Guardia', icon: Clock },
                { key: ActivityType.PROCEDIMIENTO, label: 'Proced.', icon: Stethoscope },
                { key: ActivityType.INTERCONSULTA, label: 'Interconsulta', icon: UserCheck }
              ].map(({ key, label, icon: Icon }) => (
                <button 
                  key={key}
                  type="button" 
                  onClick={() => setActivityType(key)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold transition-all text-xs uppercase tracking-wider",
                    activityType === key 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-200'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* TYPE-SPECIFIC FIELDS */}
          {activityType === ActivityType.GUARDIA && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Horas</label>
                  <input 
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                    min={1}
                    max={48}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">$/Hora</label>
                  <input 
                    type="text"
                    value={hourlyRate > 0 ? hourlyRate.toLocaleString('es-AR') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setHourlyRate(parseInt(raw) || 0);
                    }}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.entrada}</label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.salida}</label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activityType === ActivityType.PROCEDIMIENTO && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Procedimiento</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={procedureName}
                    onChange={(e) => setProcedureName(e.target.value)}
                    placeholder="Ej: Vía Central, Intubación..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                    autoComplete="off"
                  />
                  {procedureSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl mt-1 max-h-40 overflow-y-auto z-10 shadow-lg">
                      {procedureSuggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setProcedureName(suggestion);
                            setProcedureSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cantidad</label>
                  <input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">$/Unitario</label>
                  <input 
                    type="text"
                    value={unitValue}
                    onChange={(e) => setUnitValue(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Iniciales Paciente (opcional)</label>
                <input 
                  type="text"
                  value={patientInitials}
                  onChange={(e) => setPatientInitials(e.target.value.slice(0, 2).toUpperCase())}
                  placeholder="Ej: JD"
                  maxLength={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
          
          {activityType === ActivityType.INTERCONSULTA && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Especialidad Solicitante</label>
                <input 
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej: Cardiología, UTI..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ubicación del Paciente</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'intraservicio', label: 'Intra-servicio' },
                    { key: 'extraservicio', label: 'Extra-servicio' }
                  ].map(({ key, label }) => (
                    <button 
                      key={key}
                      type="button"
                      onClick={() => setPatientLocation(key as 'intraservicio' | 'extraservicio')}
                      className={cn(
                        "p-3 rounded-2xl border-2 font-bold text-xs uppercase tracking-wider transition-all",
                        patientLocation === key 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {patientLocation === 'extraservicio' && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                      Recargo automático del 50% aplicado
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                <input 
                  type="checkbox"
                  id="complexity"
                  checked={complexity}
                  onChange={(e) => setComplexity(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="complexity" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Alta complejidad (recargo adicional)
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Iniciales Paciente (opcional)</label>
                <input 
                  type="text"
                  value={patientInitials}
                  onChange={(e) => setPatientInitials(e.target.value.slice(0, 2).toUpperCase())}
                  placeholder="Ej: JD"
                  maxLength={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
          
          {/* Amount Display */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Monto Total</label>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 lg:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-1 shadow-inner">
               <div className="flex items-center gap-2">
                 <span className="text-3xl lg:text-4xl font-black text-blue-600 tracking-tighter">$</span>
                 <input 
                   type="text" 
                   inputMode="decimal"
                   value={amount}
                   onChange={(e) => {
                     const raw = e.target.value.replace(/\D/g, '');
                     if (!raw) {
                       setAmount('');
                       return;
                     }
                     const formatted = new Intl.NumberFormat('es-AR').format(parseInt(raw));
                     setAmount(formatted);
                   }}
                   className="bg-transparent text-4xl lg:text-5xl font-black text-slate-900 dark:text-white w-full focus:outline-none text-center tracking-tighter"
                   placeholder="0"
                   disabled={activityType === ActivityType.GUARDIA}
                 />
               </div>
            </div>
          </div>
          
          {/* Common Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.fecha}</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (endDate < e.target.value) setEndDate(e.target.value);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 font-bold text-slate-900 dark:text-white" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.institucion}</label>
                <div className="relative">
                  <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Hospital Italiano..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 font-bold text-slate-900 dark:text-white" 
                  />
                </div>
              </div>
            </div>
            
            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.favoritos}</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favorites.map(fav => (
                    <button
                      key={fav}
                      type="button"
                      onClick={() => setInstitution(fav)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                        institution === fav 
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg" 
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-200"
                      )}
                    >
                      {fav}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Payment Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.estadoPago}</label>
              <div className="grid grid-cols-2 gap-3">
                {[PaymentStatus.PENDING, PaymentStatus.PAID].map((s) => (
                  <button 
                    key={s}
                    type="button" 
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-widest transition-all",
                      status === s 
                        ? (s === PaymentStatus.PAID 
                            ? 'bg-green-600 border-green-600 text-white shadow-lg' 
                            : 'bg-orange-500 border-orange-500 text-white shadow-lg')
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    )}
                  >
                    {s === PaymentStatus.PAID ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {s === PaymentStatus.PAID ? 'Pagado' : 'Pendiente'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.notas}</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 font-medium text-slate-900 dark:text-white min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={!isValid}
            className={cn(
              "w-full p-5 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2",
              isValid 
                ? "bg-blue-600 text-white hover:bg-blue-500 active:scale-95" 
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            )}
          >
            <Check className="w-5 h-5" />
            <span>{editingActividad ? t.editar : t.guardarRegistro}</span>
          </button>
        </form>
      </div>
    </div>
  );
};