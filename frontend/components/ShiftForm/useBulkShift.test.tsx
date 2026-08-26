// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Institution } from '../../types';
import { PaymentStatus } from '../../types';
import { useBulkShift, type UseBulkShiftParams } from './useBulkShift';
import { esFeriado, holidayName } from '../../lib/feriados';

process.env.TZ = 'America/Argentina/Buenos_Aires';

// Helper: render hook in a minimal component, return state + actions.
function renderHook(params: UseBulkShiftParams) {
  let state: ReturnType<typeof useBulkShift> | null = null;
  const container = document.createElement('div');
  document.body.appendChild(container);

  function TestComponent({ p }: { p: UseBulkShiftParams }) {
    state = useBulkShift(p);
    return null;
  }

  const root: Root = createRoot(container);
  act(() => {
    root.render(<TestComponent p={params} />);
  });

  return {
    getState: () => state!,
    act,
    unmount: () => {
      act(() => root.unmount());
      document.body.removeChild(container);
    },
  };
}

const weekdayInstitution: Institution = {
  id: 'i1',
  name: 'Hospital Test',
  guardia_semana_rate: 5000,
  guardia_finde_rate: 8000,
  guardia_feriado_rate: 9000,
  is_active: true,
};

function makeParams(overrides?: Partial<UseBulkShiftParams>): UseBulkShiftParams {
  return {
    institution: 'Hospital Test',
    language: 'es',
    onBulkSubmit: vi.fn(async () => {}),
    selectedInstitution: weekdayInstitution,
    hourlyRate: '5.000',
    shiftSubtype: 'activa',
    status: PaymentStatus.PENDING,
    notes: '',
    hours: '24',
    startTime: '08:00',
    endTime: '08:00',
    ...overrides,
  };
}

// Compute expected previewShifts for a month from selected weekday set.
function expectedPreviews(
  selectedDays: number[],
  year: number,
  month: number, // 0-indexed
): Array<{ date: string; dayName: string; isHoliday: boolean; holidayName: string | null }> {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const result: Array<{ date: string; dayName: string; isHoliday: boolean; holidayName: string | null }> = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    if (selectedDays.includes(dt.getDay())) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const holiday = esFeriado(dateStr);
      result.push({
        date: dateStr,
        dayName: dayNames[dt.getDay()],
        isHoliday: holiday,
        holidayName: holiday ? holidayName(dateStr) : null,
      });
    }
  }
  return result;
}

// ─── Weekday toggling ───────────────────────────────────────────

describe('useBulkShift — weekday toggling', () => {
  it('starts with 0 days selected', () => {
    const h = renderHook(makeParams());
    expect(h.getState().selectedDays.size).toBe(0);
    for (let i = 0; i < 7; i++) {
      expect(h.getState().selectedDays.has(i)).toBe(false);
    }
    h.unmount();
  });

  it('toggleDay adds a day when it is not selected', () => {
    const h = renderHook(makeParams());
    act(() => h.getState().toggleDay(1)); // Monday
    expect(h.getState().selectedDays.has(1)).toBe(true);
    expect(h.getState().selectedDays.size).toBe(1);
    h.unmount();
  });

  it('toggleDay removes a day back when it is selected', () => {
    const h = renderHook(makeParams());
    act(() => h.getState().toggleDay(1));
    expect(h.getState().selectedDays.has(1)).toBe(true);
    act(() => h.getState().toggleDay(1));
    expect(h.getState().selectedDays.has(1)).toBe(false);
    expect(h.getState().selectedDays.size).toBe(0);
    h.unmount();
  });
});

// ─── Time and date setters ──────────────────────────────────────

describe('useBulkShift — time and date setters', () => {
  it('startTime updates correctly via setStartTime', () => {
    const h = renderHook(makeParams());
    expect(h.getState().startTime).toBe('08:00');
    act(() => h.getState().setStartTime('14:00'));
    expect(h.getState().startTime).toBe('14:00');
    h.unmount();
  });

  it('endTime updates correctly via setEndTime', () => {
    const h = renderHook(makeParams());
    expect(h.getState().endTime).toBe('08:00');
    act(() => h.getState().setEndTime('20:00'));
    expect(h.getState().endTime).toBe('20:00');
    h.unmount();
  });

  it('startDate defaults to 1st of current month', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const h = renderHook(makeParams());
    expect(h.getState().startDate).toBe(expected);
    h.unmount();
  });

  it('setStartDate updates the start date', () => {
    const h = renderHook(makeParams());
    act(() => h.getState().setStartDate('2026-09-15'));
    expect(h.getState().startDate).toBe('2026-09-15');
    h.unmount();
  });
});

// ─── Preview shift computation ──────────────────────────────────

describe('useBulkShift — previewShifts computation', () => {
  it('computes correct dates for selected weekdays in a month', () => {
    const h = renderHook(makeParams());
    // Select only weekdays (1–5)
    for (let i = 1; i <= 5; i++) act(() => h.getState().toggleDay(i));

    const expected = expectedPreviews([1, 2, 3, 4, 5], 2026, 7); // Aug 2026
    expect(h.getState().previewShifts).toEqual(expected);
    expect(h.getState().previewShifts.length).toBeGreaterThan(0);
    h.unmount();
  });

  it('computes correct dates for Saturday-only selection', () => {
    const h = renderHook(makeParams());
    // Select only Saturday (day 6)
    act(() => h.getState().toggleDay(6));
    const expected = expectedPreviews([6], 2026, 7);
    expect(h.getState().previewShifts).toEqual(expected);
    expect(h.getState().previewShifts.length).toBeGreaterThan(0);
    h.unmount();
  });

  it('detects feriados correctly in preview', () => {
    // August 2026 has no national holidays, so test with May 2026 which has 2026-05-01 (Friday)
    const h = renderHook(makeParams());
    act(() => h.getState().setStartDate('2026-05-01'));
    // Select only Friday (day 5)
    act(() => h.getState().toggleDay(5));

    const previews = h.getState().previewShifts;
    expect(previews.length).toBeGreaterThan(0);
    const may1 = previews.find(p => p.date === '2026-05-01');
    expect(may1).toBeDefined();
    expect(may1!.isHoliday).toBe(true);
    expect(may1!.holidayName).toBe('Día del Trabajador');
    h.unmount();
  });

  it('returns empty preview when no days are selected', () => {
    const h = renderHook(makeParams());
    // No days toggled — should be empty
    expect(h.getState().previewShifts).toEqual([]);
    h.unmount();
  });
});

// ─── Holiday decisions ──────────────────────────────────────────

describe('useBulkShift — holiday decisions', () => {
  it('toggleHolidayDecision adds a holiday to the skip set', () => {
    const h = renderHook(makeParams());
    act(() => h.getState().toggleHolidayDecision('2026-05-01'));
    expect(h.getState().holidayDecisions.has('2026-05-01')).toBe(true);
    h.unmount();
  });

  it('toggleHolidayDecision removes a holiday when toggled again', () => {
    const h = renderHook(makeParams());
    act(() => h.getState().toggleHolidayDecision('2026-05-01'));
    expect(h.getState().holidayDecisions.has('2026-05-01')).toBe(true);
    act(() => h.getState().toggleHolidayDecision('2026-05-01'));
    expect(h.getState().holidayDecisions.has('2026-05-01')).toBe(false);
    h.unmount();
  });

  it('skipped holidays are excluded from previewShifts', () => {
    const h = renderHook(makeParams());
    act(() => h.getState().setStartDate('2026-05-01'));
    // Select only Friday (5) — May 1 is a Friday holiday
    act(() => h.getState().toggleDay(5));

    const beforeSkip = h.getState().previewShifts.length;
    act(() => h.getState().toggleHolidayDecision('2026-05-01'));
    const afterSkip = h.getState().previewShifts.length;

    expect(afterSkip).toBe(beforeSkip - 1);
    expect(h.getState().previewShifts.find(p => p.date === '2026-05-01')).toBeUndefined();
    h.unmount();
  });
});

// ─── generate() — sequential calls ──────────────────────────────

describe('useBulkShift — generate() calls onBulkSubmit sequentially', () => {
  it('calls onBulkSubmit for each confirmed shift', async () => {
    const onBulkSubmit = vi.fn(async () => {});
    const h = renderHook(makeParams({ onBulkSubmit }));
    // Select Monday only for Aug 2026
    act(() => h.getState().toggleDay(1));

    const count = h.getState().previewShifts.length;
    expect(count).toBeGreaterThan(0);

    await act(async () => {
      await h.getState().generate();
    });

    expect(onBulkSubmit).toHaveBeenCalledTimes(count);
    h.unmount();
  });

  it('skips holidays marked for skipping in generate', async () => {
    const onBulkSubmit = vi.fn(async () => {});
    const h = renderHook(makeParams({ onBulkSubmit }));
    act(() => h.getState().setStartDate('2026-05-01'));
    // Select only Friday (5)
    act(() => h.getState().toggleDay(5));

    const totalCount = h.getState().previewShifts.length;
    // Skip May 1 holiday
    act(() => h.getState().toggleHolidayDecision('2026-05-01'));
    const afterSkipCount = h.getState().previewShifts.length;
    expect(afterSkipCount).toBe(totalCount - 1);

    await act(async () => {
      await h.getState().generate();
    });

    // onBulkSubmit called for non-skipped dates only
    expect(onBulkSubmit).toHaveBeenCalledTimes(afterSkipCount);
    // Verify none of the calls used the skipped holiday date
    const calledDates = onBulkSubmit.mock.calls.map(
      (call: unknown[]) => (call[0] as { date: string }).date,
    );
    expect(calledDates).not.toContain('2026-05-01');
    h.unmount();
  });

  it('updates progress during generation', async () => {
    let resolveSubmit!: () => void;
    const onBulkSubmit = vi.fn(
      () => new Promise<void>(resolve => { resolveSubmit = resolve; }),
    );
    const h = renderHook(makeParams({ onBulkSubmit }));
    // Select Monday only
    act(() => h.getState().toggleDay(1));

    const total = h.getState().previewShifts.length;
    expect(total).toBeGreaterThan(0);

    let genPromise: Promise<void>;
    act(() => {
      genPromise = h.getState().generate();
    });

    // Should be generating with progress {current: 0, total}
    expect(h.getState().isGenerating).toBe(true);
    expect(h.getState().progress).toEqual({ current: 0, total });

    // Resolve first shift
    await act(async () => {
      resolveSubmit();
      await new Promise(r => setTimeout(r, 0));
    });
    expect(h.getState().progress!.current).toBe(1);

    // Resolve remaining shifts one by one
    for (let i = 1; i < total; i++) {
      await act(async () => {
        resolveSubmit();
        await new Promise(r => setTimeout(r, 0));
      });
    }

    await act(async () => {
      await genPromise!;
    });

    expect(h.getState().isGenerating).toBe(false);
    expect(h.getState().progress).toBeNull();
    h.unmount();
  });

  it('handles errors gracefully and stops generation', async () => {
    let callCount = 0;
    const onBulkSubmit = vi.fn(async () => {
      callCount++;
      if (callCount === 2) throw new Error('API failure');
    });
    const h = renderHook(makeParams({ onBulkSubmit }));
    // Select Monday only
    act(() => h.getState().toggleDay(1));

    const total = h.getState().previewShifts.length;
    expect(total).toBeGreaterThan(2);

    await act(async () => {
      await h.getState().generate();
    });

    // Should have stopped at the error (2 calls: 1 success + 1 failure)
    expect(onBulkSubmit).toHaveBeenCalledTimes(2);
    expect(h.getState().error).toMatch(/Error en guardia 2 de/);
    expect(h.getState().isGenerating).toBe(false);
    h.unmount();
  });

  it('does nothing when previewShifts is empty', async () => {
    const onBulkSubmit = vi.fn(async () => {});
    const h = renderHook(makeParams({ onBulkSubmit }));
    // No days selected — preview should be empty

    await act(async () => {
      await h.getState().generate();
    });

    expect(onBulkSubmit).not.toHaveBeenCalled();
    h.unmount();
  });
});

// ─── Initial state defaults ─────────────────────────────────────

describe('useBulkShift — initial state', () => {
  it('starts with isGenerating false', () => {
    const h = renderHook(makeParams());
    expect(h.getState().isGenerating).toBe(false);
    h.unmount();
  });

  it('starts with no error', () => {
    const h = renderHook(makeParams());
    expect(h.getState().error).toBeNull();
    h.unmount();
  });

  it('starts with no progress', () => {
    const h = renderHook(makeParams());
    expect(h.getState().progress).toBeNull();
    h.unmount();
  });
});
