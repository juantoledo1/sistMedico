import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { esFeriado, holidayName } from '../../lib/feriados';
import { translations, type Language } from '../../translations';
import { PaymentStatus, type Transaction } from '../../types';
import { createTransaction, type FormSnapshot } from '../../lib/createTransaction';
import type { Institution } from '../../types';

export interface PreviewShift {
  date: string;
  dayName: string;
  isHoliday: boolean;
  holidayName: string | null;
}

export interface BulkPreset {
  selectedDays: number[];
  startTime: string;
  endTime: string;
  startDate: string;
}

export interface UseBulkShiftParams {
  institution: string;
  language: Language;
  onBulkSubmit: (tx: Partial<Transaction>) => Promise<void>;
  selectedInstitution: Institution | undefined;
  hourlyRate: string;
  shiftSubtype: 'activa' | 'pasiva';
  status: PaymentStatus;
  notes: string;
  hours: string;
  startTime: string;
  endTime: string;
  bulkPreset?: BulkPreset;
}

export interface UseBulkShiftReturn {
  selectedDays: Set<number>;
  toggleDay: (day: number) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  startTime: string;
  setStartTime: (t: string) => void;
  endTime: string;
  setEndTime: (t: string) => void;
  previewShifts: PreviewShift[];
  holidayDecisions: Set<string>;
  toggleHolidayDecision: (dateStr: string) => void;
  isGenerating: boolean;
  progress: { current: number; total: number } | null;
  error: string | null;
  generate: () => Promise<void>;
}

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Pure function: selected weekdays + target month → matching dates with holiday info.
 * Includes all matching dates regardless of holiday decisions.
 */
export function computeAllPreviewShifts(
  selectedDays: Set<number>,
  startDate: string,
): PreviewShift[] {
  const [yearStr, monthStr] = startDate.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: PreviewShift[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    if (!selectedDays.has(dt.getDay())) continue;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const holiday = esFeriado(dateStr);
    result.push({
      date: dateStr,
      dayName: DAY_NAMES_ES[dt.getDay()],
      isHoliday: holiday,
      holidayName: holiday ? holidayName(dateStr) : null,
    });
  }

  return result;
}

/**
 * Compute end date from start date + hours. Uses LOCAL dates (no UTC shift).
 */
function computeEndDate(startDate: string, hours: string): string {
  const hoursNum = parseInt(hours) || 24;
  const dt = new Date(`${startDate}T08:00`);
  dt.setHours(dt.getHours() + hoursNum);
  return format(dt, 'yyyy-MM-dd');
}

export function useBulkShift(params: UseBulkShiftParams): UseBulkShiftReturn {
  const {
    institution,
    language,
    onBulkSubmit,
    selectedInstitution,
    hourlyRate,
    shiftSubtype,
    status,
    notes,
    hours,
    bulkPreset,
  } = params;

  const t = translations[language];

  // ── State ──────────────────────────────────────────────────────
  const [selectedDays, setSelectedDays] = useState<Set<number>>(
    () => bulkPreset ? new Set(bulkPreset.selectedDays) : new Set<number>(),
  );
  const [startDate, setStartDate] = useState<string>(() => {
    if (bulkPreset) return bulkPreset.startDate;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [holidayDecisions, setHolidayDecisions] = useState<Set<string>>(
    () => new Set(),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(bulkPreset?.startTime ?? params.startTime);
  const [endTime, setEndTime] = useState(bulkPreset?.endTime ?? params.endTime);

  // ── Derived ────────────────────────────────────────────────────
  // previewShifts = all matching dates MINUS skipped holidays
  const previewShifts = useMemo(() => {
    const all = computeAllPreviewShifts(selectedDays, startDate);
    if (holidayDecisions.size === 0) return all;
    return all.filter(s => !holidayDecisions.has(s.date));
  }, [selectedDays, startDate, holidayDecisions]);

  // ── Actions ────────────────────────────────────────────────────
  const toggleDay = useCallback((day: number) => {
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day); else next.add(day);
      return next;
    });
  }, []);

  const toggleHolidayDecision = useCallback((dateStr: string) => {
    setHolidayDecisions(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
      return next;
    });
  }, []);

  // ── Generate ───────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (previewShifts.length === 0) return;
    setIsGenerating(true);
    setProgress({ current: 0, total: previewShifts.length });
    setError(null);

    for (let i = 0; i < previewShifts.length; i++) {
      setProgress({ current: i, total: previewShifts.length });

      const snap: FormSnapshot = {
        date: previewShifts[i].date,
        endDate: computeEndDate(previewShifts[i].date, hours),
        startTime,
        endTime,
        institution,
        selectedInstitution,
        hourlyRate,
        status,
        notes,
        shiftSubtype,
        hours,
      };

      const tx = createTransaction(snap);

      try {
        await onBulkSubmit(tx);
      } catch (e) {
        const msg = e instanceof Error ? e.message : t.errorGeneracion;
        const locale = language === 'es' ? 'es' : 'en';
        setError(
          locale === 'es'
            ? `Error en guardia ${i + 1} de ${previewShifts.length}: ${msg}`
            : `Error on shift ${i + 1} of ${previewShifts.length}: ${msg}`,
        );
        setIsGenerating(false);
        setProgress(null);
        return;
      }
    }

    setIsGenerating(false);
    setProgress(null);
  }, [
    previewShifts, startTime, endTime, hours, institution,
    selectedInstitution, hourlyRate, status, notes, shiftSubtype,
    onBulkSubmit, t, language,
  ]);

  return {
    selectedDays,
    toggleDay,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    previewShifts,
    holidayDecisions,
    toggleHolidayDecision,
    isGenerating,
    progress,
    error,
    generate,
  };
}
