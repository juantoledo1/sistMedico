import { describe, it, expect } from 'vitest';
import { createTransaction, type FormSnapshot } from './createTransaction';
import { ShiftType, PaymentStatus, type Institution } from '../types';

// Date defaults must be computed with LOCAL time.
process.env.TZ = 'America/Argentina/Buenos_Aires';

const weekdayInstitution: Institution = {
  id: 'i1',
  name: 'Hospital Test',
  guardia_semana_rate: 5000,
  guardia_finde_rate: 8000,
  guardia_feriado_rate: 9000,
  is_active: true,
};

const noRatesInstitution: Institution = {
  id: 'i2',
  name: 'Sin Tarifas',
  is_active: true,
};

describe('createTransaction — guardia path', () => {
  it('weekday-only 24h shift uses semana rate', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05', // Wednesday
      endDate: '2026-08-06',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
    };

    const tx = createTransaction(snap);

    expect(tx.type).toBe(ShiftType.ACTIVE);
    expect(tx.institution).toBe('Hospital Test');
    expect(tx.date).toBe('2026-08-05');
    expect(tx.endDate).toBe('2026-08-06');
    expect(tx.startTime).toBe('08:00');
    expect(tx.endTime).toBe('08:00');
    expect(tx.status).toBe(PaymentStatus.PENDING);
    expect(tx.amount).toBe(120000); // 24h × 5000
    expect(tx.duration).toBe(24);
    expect(tx.hourlyRate).toBe(5000);
    expect(tx.shiftSubtype).toBe('activa');
  });

  it('weekend 24h shift uses finde rate', () => {
    const snap: FormSnapshot = {
      date: '2026-08-08', // Saturday
      endDate: '2026-08-09',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
    };

    const tx = createTransaction(snap);

    // 24h × 8000 (finde rate)
    expect(tx.amount).toBe(192000);
    expect(tx.duration).toBe(24);
  });

  it('holiday shift uses feriado rate', () => {
    const snap: FormSnapshot = {
      date: '2026-05-25', // Monday holiday
      endDate: '2026-05-26',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PAID,
      notes: 'feriado',
      shiftSubtype: 'pasiva',
      hours: '24',
    };

    const tx = createTransaction(snap);

    // 24h × 9000 (feriado rate)
    expect(tx.amount).toBe(216000);
    expect(tx.status).toBe(PaymentStatus.PAID);
    expect(tx.shiftSubtype).toBe('pasiva');
    expect(tx.notes).toBe('feriado');
  });

  it('48h shift crossing holiday uses mixed rates', () => {
    const snap: FormSnapshot = {
      date: '2026-05-25', // Monday holiday
      endDate: '2026-05-27',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '48',
    };

    const tx = createTransaction(snap);

    // 24h feriado (25) × 9000 + 24h weekday (26) × 5000
    expect(tx.amount).toBe(336000);
    expect(tx.duration).toBe(48);
  });

  it('backwards range returns zero amount and duration', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-05',
      startTime: '14:00',
      endTime: '08:00', // end before start
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
    };

    const tx = createTransaction(snap);

    expect(tx.amount).toBe(0);
    expect(tx.duration).toBe(0);
  });

  it('institution without rates uses fallback manual rate', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-06',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Sin Tarifas',
      selectedInstitution: noRatesInstitution,
      hourlyRate: '17.000', // manual rate
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
    };

    const tx = createTransaction(snap);

    // All 24h × manual rate (17000) — no institution rates to override
    expect(tx.amount).toBe(408000);
  });

  it('non-08:00 start/end times compute correct duration', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-05', // same day: 14:00 → 22:00 = 8h
      startTime: '14:00',
      endTime: '22:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '8',
    };

    const tx = createTransaction(snap);

    expect(tx.duration).toBe(8);
    // 8h × 5000 (all weekday)
    expect(tx.amount).toBe(40000);
  });

  it('Friday→Saturday crossing uses weekday+weekend mixed rates', () => {
    const snap: FormSnapshot = {
      date: '2026-06-05', // Friday
      endDate: '2026-06-06', // Saturday
      startTime: '14:00',
      endTime: '14:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
    };

    const tx = createTransaction(snap);

    // 18h weekday (Fri 14:00→Sat 08:00) + 6h weekend (Sat 08:00→14:00)
    expect(tx.duration).toBe(24);
    expect(tx.amount).toBe(138000); // 18×5000 + 6×8000
  });
});

describe('createTransaction — extra path', () => {
  it('EXTRA type with concept name and institution', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-06',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PAID,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
      // Extra fields
      activityMode: 'extra',
      editingTransactionType: ShiftType.EXTRA,
      conceptName: 'Coordinación SIMES',
      subItemName: '',
      editingId: undefined,
    };

    const tx = createTransaction(snap);

    expect(tx.type).toBe(ShiftType.EXTRA);
    expect(tx.amount).toBe(0); // extras don't compute amount from breakdown
    expect(tx.conceptName).toBe('Coordinación SIMES');
    expect(tx.institution).toBe('Hospital Test');
    expect(tx.status).toBe(PaymentStatus.PAID);
  });

  it('EXTRA type without institution uses concept name as institution', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-06',
      startTime: '08:00',
      endTime: '08:00',
      institution: '',
      selectedInstitution: undefined,
      hourlyRate: '',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
      activityMode: 'extra',
      editingTransactionType: ShiftType.EXTRA,
      conceptName: 'Coordinación SIMES',
      subItemName: '',
      editingId: undefined,
    };

    const tx = createTransaction(snap);

    expect(tx.institution).toBe('Coordinación SIMES');
  });

  it('CONSULTATION type reconstructs notes from sub-item name', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-06',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: 'extra notes',
      shiftSubtype: 'activa',
      hours: '24',
      activityMode: 'extra',
      editingTransactionType: ShiftType.CONSULTATION,
      conceptName: '',
      subItemName: 'ecografía abdominal',
      editingId: undefined,
    };

    const tx = createTransaction(snap);

    expect(tx.type).toBe(ShiftType.CONSULTATION);
    expect(tx.procedureName).toBe('ecografía abdominal');
    expect(tx.notes).toBe('ecografía abdominal: extra notes');
  });

  it('editing extra preserves the original id', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-06',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
      activityMode: 'extra',
      editingTransactionType: ShiftType.CONSULTATION,
      conceptName: '',
      subItemName: 'RMN',
      editingId: 'existing-tx-id',
    };

    const tx = createTransaction(snap);

    expect(tx.id).toBe('existing-tx-id');
  });

  it('PASSIVE type includes specialty field', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-06',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
      activityMode: 'extra',
      editingTransactionType: ShiftType.PASSIVE,
      conceptName: '',
      subItemName: 'Neurología',
      editingId: undefined,
    };

    const tx = createTransaction(snap);

    expect(tx.type).toBe(ShiftType.PASSIVE);
    expect(tx.specialty).toBe('Neurología');
    expect(tx.procedureName).toBeUndefined();
  });

  it('CONSULTATION with empty notes produces clean sub-item name only', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-06',
      startTime: '08:00',
      endTime: '08:00',
      institution: 'Hospital Test',
      selectedInstitution: weekdayInstitution,
      hourlyRate: '5.000',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
      activityMode: 'extra',
      editingTransactionType: ShiftType.CONSULTATION,
      conceptName: '',
      subItemName: 'ecografía',
      editingId: undefined,
    };

    const tx = createTransaction(snap);

    // No trailing colon+space when notes is empty
    expect(tx.notes).toBe('ecografía');
  });

  it('EXTRA with empty concept name and no institution returns empty institution', () => {
    const snap: FormSnapshot = {
      date: '2026-08-05',
      endDate: '2026-08-06',
      startTime: '08:00',
      endTime: '08:00',
      institution: '',
      selectedInstitution: undefined,
      hourlyRate: '',
      status: PaymentStatus.PENDING,
      notes: '',
      shiftSubtype: 'activa',
      hours: '24',
      activityMode: 'extra',
      editingTransactionType: ShiftType.EXTRA,
      conceptName: '',
      subItemName: '',
      editingId: undefined,
    };

    const tx = createTransaction(snap);

    expect(tx.institution).toBe('');
  });
});
