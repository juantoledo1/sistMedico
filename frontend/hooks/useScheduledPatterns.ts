import { useMemo } from 'react';
import { format } from 'date-fns';
import { Transaction, ShiftType } from '../types';

export interface ScheduledPattern {
  institution: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  dayLabel: string;
  count: number;
  totalAmount: number;
  hourlyRate: number;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Groups guardia transactions from the current month by
 * institution + startTime + endTime + dayOfWeek and computes
 * per-group stats (count, total, hourly rate).
 *
 * Pure computation — no side effects, fully testable.
 */
export function computeScheduledPatterns(
  transactions: Transaction[],
  currentDate: Date,
): ScheduledPattern[] {
  const monthPrefix = format(currentDate, 'yyyy-MM');

  const guardias = transactions.filter(
    tx => tx.type === ShiftType.ACTIVE && tx.date.startsWith(monthPrefix),
  );

  const groups = new Map<string, { count: number; totalAmount: number; hourlyRateSum: number; rateSamples: number }>();

  for (const tx of guardias) {
    const dow = new Date(tx.date).getDay();
    const key = `${tx.institution}|${tx.startTime ?? ''}|${tx.endTime ?? ''}|${dow}`;

    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalAmount += tx.amount;
      if (tx.hourlyRate && tx.hourlyRate > 0) {
        existing.hourlyRateSum += tx.hourlyRate;
        existing.rateSamples += 1;
      }
    } else {
      groups.set(key, {
        count: 1,
        totalAmount: tx.amount,
        hourlyRateSum: tx.hourlyRate ?? 0,
        rateSamples: tx.hourlyRate && tx.hourlyRate > 0 ? 1 : 0,
      });
    }
  }

  const patterns: ScheduledPattern[] = [];

  for (const [key, stats] of groups) {
    const [institution, startTime, endTime, dowStr] = key.split('|');
    const dow = parseInt(dowStr, 10);

    patterns.push({
      institution,
      startTime,
      endTime,
      dayOfWeek: dow,
      dayLabel: DAY_NAMES[dow],
      count: stats.count,
      totalAmount: stats.totalAmount,
      hourlyRate: stats.rateSamples > 0 ? stats.hourlyRateSum / stats.rateSamples : 0,
    });
  }

  patterns.sort((a, b) => {
    const instCmp = a.institution.localeCompare(b.institution);
    if (instCmp !== 0) return instCmp;
    return a.dayOfWeek - b.dayOfWeek;
  });

  return patterns;
}

/**
 * React hook wrapper — memoized over [transactions, currentDate].
 */
export function useScheduledPatterns(
  transactions: Transaction[],
  currentDate: Date,
): ScheduledPattern[] {
  return useMemo(
    () => computeScheduledPatterns(transactions, currentDate),
    [transactions, currentDate],
  );
}
