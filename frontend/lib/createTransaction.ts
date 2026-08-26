import { ShiftType, PaymentStatus, type Transaction, type Institution } from '../types';
import { computeGuardiaBreakdown } from './guardiaBreakdown';
import { parseAmount } from './utils';

/**
 * Snapshot of ShiftForm state needed to build a transaction payload.
 * Covers both guardia and extra paths so `createTransaction` is the single
 * source of truth for payload construction.
 */
export interface FormSnapshot {
  // Shared fields
  date: string;
  institution: string;
  status: PaymentStatus;
  notes: string;
  hours: string; // fallback duration when range is incomplete

  // Guardia fields
  endDate: string;
  startTime: string;
  endTime: string;
  selectedInstitution: Institution | undefined;
  hourlyRate: string; // es-AR formatted $/Hora
  shiftSubtype: 'activa' | 'pasiva';

  // Extra fields
  activityMode?: 'guardia' | 'extra';
  editingTransactionType?: ShiftType;
  conceptName?: string;
  subItemName?: string;
  editingId?: string;
}

/**
 * Pure function: form state snapshot → Partial<Transaction> payload.
 *
 * Extracted from useShiftForm's useActionState callback so both the
 * single-shift path and the future bulk path share the same logic.
 *
 * For guardia: computes amount from the breakdown (weekday/weekend/holiday
 * hours × respective rates), matching the backend's calculation.
 *
 * For extras: returns fields that the caller (useShiftForm) will merge with
 * the editing id and async onSubmit call.
 */
export function createTransaction(snap: FormSnapshot): Partial<Transaction> {
  // --- Extra path ---
  if (snap.activityMode === 'extra') {
    const txType = snap.editingTransactionType ?? ShiftType.EXTRA;

    if (txType === ShiftType.EXTRA) {
      const effectiveInstitution = snap.institution || snap.conceptName?.trim() || '';
      return {
        amount: 0,
        date: snap.date,
        institution: effectiveInstitution,
        type: txType,
        status: snap.status,
        notes: snap.notes,
        conceptName: snap.conceptName,
        id: snap.editingId,
      };
    }

    // CONSULTATION or PASSIVE (procedimiento / interconsulta)
    const reconstructedNotes = [snap.subItemName, snap.notes].filter(Boolean).join(': ');
    return {
      amount: 0,
      date: snap.date,
      institution: snap.institution,
      type: txType,
      status: snap.status,
      notes: reconstructedNotes,
      procedureName: txType === ShiftType.CONSULTATION ? snap.subItemName : undefined,
      specialty: txType === ShiftType.PASSIVE ? snap.subItemName : undefined,
      id: snap.editingId,
    };
  }

  // --- Guardia path ---
  const rawRate = parseAmount(snap.hourlyRate);

  const start = new Date(snap.date + 'T' + snap.startTime);
  const end = new Date(snap.endDate + 'T' + snap.endTime);

  const duration = (snap.date && snap.startTime && snap.endDate && snap.endTime)
    ? Math.max(0, Math.round(
        (end.getTime() - start.getTime()) / (60 * 60 * 1000),
      ))
    : (parseInt(snap.hours) || 0);

  const { split, semanaRate, findeRate, feriadoRate } =
    computeGuardiaBreakdown(start, end, snap.selectedInstitution ?? null, rawRate);

  const amount =
    split.weekdayHours * (semanaRate ?? 0) +
    split.weekendHours * (findeRate ?? 0) +
    split.feriadoHours * (feriadoRate ?? 0);

  return {
    amount,
    date: snap.date,
    endDate: snap.endDate,
    startTime: snap.startTime,
    endTime: snap.endTime,
    institution: snap.institution,
    type: ShiftType.ACTIVE,
    status: snap.status,
    notes: snap.notes,
    duration,
    hourlyRate: rawRate,
    shiftSubtype: snap.shiftSubtype,
  };
}
