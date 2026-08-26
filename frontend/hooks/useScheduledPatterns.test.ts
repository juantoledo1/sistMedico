import { describe, it, expect } from 'vitest';
import { computeScheduledPatterns } from './useScheduledPatterns';
import { ShiftType, PaymentStatus, type Transaction } from '../types';

function makeGuardia(overrides: Partial<Transaction> & { date: string }): Transaction {
  return {
    id: crypto.randomUUID(),
    institution: 'Hospital Test',
    type: ShiftType.ACTIVE,
    amount: 17000,
    status: PaymentStatus.PENDING,
    startTime: '08:00',
    endTime: '20:00',
    ...overrides,
  };
}

// NOTE: Date strings are parsed as UTC by `new Date(str)`, so in UTC-3
// (Argentina) a string like '2026-08-04' resolves to Mon Aug 3 21:00 local,
// which is still Monday (dayOfWeek=1). We use Aug 4+ to avoid the midnight
// UTC boundary shifting the weekday back by one.

describe('computeScheduledPatterns', () => {
  it('returns empty array when no guardias match the month', () => {
    const txs = [makeGuardia({ date: '2026-07-15' })];
    const result = computeScheduledPatterns(txs, new Date(2026, 7, 1)); // August 2026
    expect(result).toEqual([]);
  });

  it('groups guardias by institution + time + dayOfWeek', () => {
    const txs = [
      makeGuardia({ date: '2026-08-04', institution: 'Hosp A', startTime: '08:00', endTime: '20:00' }), // Mon (UTC→local)
      makeGuardia({ date: '2026-08-11', institution: 'Hosp A', startTime: '08:00', endTime: '20:00' }), // Mon
      makeGuardia({ date: '2026-08-06', institution: 'Hosp A', startTime: '20:00', endTime: '08:00' }), // Wed (different time)
    ];

    const result = computeScheduledPatterns(txs, new Date(2026, 7, 1));

    expect(result).toHaveLength(2);
    expect(result[0].institution).toBe('Hosp A');
    expect(result[0].dayOfWeek).toBe(1); // Monday
    expect(result[0].count).toBe(2);
    expect(result[0].startTime).toBe('08:00');

    expect(result[1].dayOfWeek).toBe(3); // Wednesday
    expect(result[1].count).toBe(1);
    expect(result[1].startTime).toBe('20:00');
  });

  it('separates different institutions into different groups', () => {
    const txs = [
      makeGuardia({ date: '2026-08-04', institution: 'Hosp A' }), // Mon
      makeGuardia({ date: '2026-08-04', institution: 'Hosp B' }), // Mon
    ];

    const result = computeScheduledPatterns(txs, new Date(2026, 7, 1));

    expect(result).toHaveLength(2);
    expect(result[0].institution).toBe('Hosp A');
    expect(result[1].institution).toBe('Hosp B');
  });

  it('computes totalAmount as sum of amounts', () => {
    const txs = [
      makeGuardia({ date: '2026-08-04', amount: 15000 }),
      makeGuardia({ date: '2026-08-11', amount: 20000 }),
    ];

    const result = computeScheduledPatterns(txs, new Date(2026, 7, 1));

    expect(result[0].totalAmount).toBe(35000);
  });

  it('computes hourlyRate as average of non-zero rates', () => {
    const txs = [
      makeGuardia({ date: '2026-08-04', hourlyRate: 17000 }),
      makeGuardia({ date: '2026-08-11', hourlyRate: 19000 }),
    ];

    const result = computeScheduledPatterns(txs, new Date(2026, 7, 1));

    expect(result[0].hourlyRate).toBe(18000);
  });

  it('handles zero hourlyRate gracefully', () => {
    const txs = [
      makeGuardia({ date: '2026-08-04', hourlyRate: 0 }),
    ];

    const result = computeScheduledPatterns(txs, new Date(2026, 7, 1));

    expect(result[0].hourlyRate).toBe(0);
  });

  it('sorts by institution name then dayOfWeek', () => {
    const txs = [
      makeGuardia({ date: '2026-08-07', institution: 'Zebra Hosp' }), // Thu
      makeGuardia({ date: '2026-08-05', institution: 'Alpha Hosp' }), // Tue
      makeGuardia({ date: '2026-08-04', institution: 'Alpha Hosp' }), // Mon
    ];

    const result = computeScheduledPatterns(txs, new Date(2026, 7, 1));

    expect(result[0].institution).toBe('Alpha Hosp');
    expect(result[0].dayOfWeek).toBe(1); // Monday first
    expect(result[1].institution).toBe('Alpha Hosp');
    expect(result[1].dayOfWeek).toBe(2); // Tuesday second
    expect(result[2].institution).toBe('Zebra Hosp');
  });

  it('excludes non-guardia transactions', () => {
    const txs: Transaction[] = [
      makeGuardia({ date: '2026-08-04' }),
      {
        id: '2',
        institution: 'Hosp A',
        type: ShiftType.CONSULTATION,
        date: '2026-08-04',
        amount: 5000,
        status: PaymentStatus.PENDING,
      },
    ];

    const result = computeScheduledPatterns(txs, new Date(2026, 7, 1));

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(1);
  });

  it('includes dayLabel from day names', () => {
    const txs = [makeGuardia({ date: '2026-08-04' })]; // Mon in UTC→local
    const result = computeScheduledPatterns(txs, new Date(2026, 7, 1));

    expect(result[0].dayLabel).toBe('Lunes');
  });
});
