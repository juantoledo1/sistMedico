import { useState, useEffect, useActionState } from 'react';
import { ShiftType, Transaction, PaymentStatus, type Institution } from '../../types';

interface ExtraActivity {
  id: string;
  type: 'procedimiento' | 'interconsulta';
  procedureName?: string;
  specialty?: string;
  amount: number;
  notes?: string;
  status: PaymentStatus;
}

interface ShiftFormState {
  error?: string;
}

export function useShiftForm(
  onSubmit: (tx: Partial<Transaction>) => void,
  editingTransaction: Transaction | undefined,
  transactions: Transaction[] | undefined,
  initialDate: string | undefined,
  institutions: Institution[],
  onClose: () => void,
  _language: string,
) {
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
  const [extras, setExtras] = useState<ExtraActivity[]>([]);
  const [shiftSubtype, setShiftSubtype] = useState<'activa' | 'pasiva'>('activa');

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
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
    }
  }, [date, hours, startTime]);

  useEffect(() => {
    if (hours > 0 && hourlyRate && hourlyRate.trim() !== '') {
      const rawRate = parseInt(hourlyRate.replace(/\D/g, '')) || 0;
      const et = extras.reduce((s, e) => s + e.amount, 0);
      const total = (hours * rawRate) + et;
      if (total > 0) setAmount(total.toLocaleString('es-AR'));
    }
  }, [hours, hourlyRate, extras]);

  useEffect(() => {
    if (initialDate && !editingTransaction) setDate(initialDate);
  }, [initialDate, editingTransaction]);

  const selectedInstitution = institutions.find(i =>
    i.name.toLowerCase().trim() === institution.toLowerCase().trim() && i.is_active
  );

  const handleSelectInstitution = (name: string) => {
    setInstitution(name);
    const inst = institutions.find(i => i.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (inst && inst.guardia_rate) setHourlyRate(inst.guardia_rate.toString());
  };

  const addExtra = () => {
    setExtras([...extras, {
      id: Math.random().toString(36).slice(2),
      type: 'procedimiento',
      procedureName: '',
      amount: selectedInstitution?.procedimiento_rate || 0,
      notes: '',
      status: PaymentStatus.PENDING,
    }]);
  };

  const updateExtra = (id: string, updates: Partial<ExtraActivity>) => {
    setExtras(extras.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeExtra = (id: string) => {
    setExtras(extras.filter(e => e.id !== id));
  };

  const extraTotal = extras.reduce((s, e) => s + e.amount, 0);

  const [formState, formAction, isPending] = useActionState(
    async (prev: ShiftFormState, formData: FormData) => {
      const rawAmount = formData.get('amount_display') as string || amount;
      const cleanAmount = parseInt(rawAmount.replace(/\./g, '')) || 0;
      if (!institution || cleanAmount <= 0) return { error: 'Completá todos los campos obligatorios' };

      const rawRate = parseInt((formData.get('hourly_rate') as string || hourlyRate).replace(/\D/g, '')) || 0;
      const fDate = formData.get('date') as string || date;
      const fEndDate = formData.get('end_date') as string || endDate;
      const fStartTime = formData.get('start_time') as string || startTime;
      const fEndTime = formData.get('end_time') as string || endTime;
      const fStatus = (formData.get('status') as string) === 'paid' ? PaymentStatus.PAID : PaymentStatus.PENDING;
      const fNotes = formData.get('notes') as string || notes;

      await onSubmit({
        amount: cleanAmount, date: fDate, endDate: fEndDate,
        startTime: fStartTime, endTime: fEndTime, institution,
        type: ShiftType.ACTIVE, status: fStatus, notes: fNotes,
        id: editingTransaction?.id, duration: hours, hourlyRate: rawRate, shiftSubtype,
      });

      for (const extra of extras) {
        if (extra.amount > 0) {
          await onSubmit({
            amount: extra.amount, date: fDate, institution,
            type: extra.type === 'procedimiento' ? ShiftType.CONSULTATION : ShiftType.PASSIVE,
            status: extra.status,
            notes: [extra.type === 'procedimiento' ? extra.procedureName : extra.specialty, extra.notes].filter(Boolean).join(': '),
            procedureName: extra.type === 'procedimiento' ? extra.procedureName : undefined,
            specialty: extra.type === 'interconsulta' ? extra.specialty : undefined,
          });
        }
      }
      onClose();
      return {};
    },
    { error: undefined },
  );

  const handleStatusToggle = () => {
    setStatus(status === PaymentStatus.PENDING ? PaymentStatus.PAID : PaymentStatus.PENDING);
  };

  return {
    amount, setAmount, date, setDate, institution, status,
    notes, setNotes, startTime, setStartTime, endTime, setEndTime,
    endDate, setEndDate, hours, setHours, hourlyRate, setHourlyRate,
    extras, addExtra, updateExtra, removeExtra, extraTotal,
    shiftSubtype, setShiftSubtype, selectedInstitution,
    handleSelectInstitution, handleStatusToggle,
    formState, formAction, isPending,
  };
}
