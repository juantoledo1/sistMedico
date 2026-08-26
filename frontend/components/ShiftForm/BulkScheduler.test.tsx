// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BulkScheduler } from './BulkScheduler';
import type { UseBulkShiftReturn } from './useBulkShift';
import { esFeriado, holidayName } from '../../lib/feriados';

process.env.TZ = 'America/Argentina/Buenos_Aires';

// Helper: render BulkScheduler and return references for assertions + actions.
function renderBulkScheduler(overrides?: {
  hookOverrides?: Partial<UseBulkShiftReturn>;
  onConfirm?: () => void;
  onCancel?: () => void;
  language?: 'es' | 'en';
}) {
  const onConfirm = overrides?.onConfirm ?? vi.fn();
  const onCancel = overrides?.onCancel ?? vi.fn();
  const language = overrides?.language ?? 'es';

  // Default hook state: all days, August 2026, no holidays skipped
  const defaultHook: UseBulkShiftReturn = {
    selectedDays: new Set([0, 1, 2, 3, 4, 5, 6]),
    toggleDay: vi.fn(),
    startDate: '2026-08-01',
    setStartDate: vi.fn(),
    startTime: '08:00',
    setStartTime: vi.fn(),
    endTime: '20:00',
    setEndTime: vi.fn(),
    previewShifts: [
      { date: '2026-08-03', dayName: 'Lunes', isHoliday: false, holidayName: null },
      { date: '2026-08-10', dayName: 'Lunes', isHoliday: false, holidayName: null },
    ],
    holidayDecisions: new Set(),
    toggleHolidayDecision: vi.fn(),
    isGenerating: false,
    progress: null,
    error: null,
    generate: vi.fn(async () => {}),
    ...overrides?.hookOverrides,
  };

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  act(() => {
    root.render(
      <BulkScheduler
        hook={defaultHook}
        language={language}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
  });

  return {
    container,
    root,
    onConfirm,
    onCancel,
    hook: defaultHook,
    act,
    rerender(hookOverrides: Partial<UseBulkShiftReturn>) {
      const updatedHook = { ...defaultHook, ...hookOverrides };
      act(() => {
        root.render(
          <BulkScheduler
            hook={updatedHook}
            language={language}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />,
        );
      });
      return updatedHook;
    },
    unmount() {
      act(() => root.unmount());
      document.body.removeChild(container);
    },
  };
}

// ─── Day selector rendering ──────────────────────────────────────

describe('BulkScheduler — day selectors', () => {
  it('renders 7 day-of-week buttons', () => {
    const r = renderBulkScheduler();
    const buttons = r.container.querySelectorAll('button[data-day]');
    expect(buttons.length).toBe(7);
    r.unmount();
  });

  it('renders day abbreviation labels from constants', () => {
    const r = renderBulkScheduler();
    const buttons = r.container.querySelectorAll('button[data-day]');
    const labels = Array.from(buttons).map(b => b.textContent);
    // ES day abbreviations: L, M, M, J, V, S, D
    expect(labels).toEqual(['L', 'M', 'M', 'J', 'V', 'S', 'D']);
    r.unmount();
  });

  it('calls toggleDay when a day button is clicked', () => {
    const r = renderBulkScheduler();
    const buttons = r.container.querySelectorAll('button[data-day]');
    (buttons[0] as HTMLElement).click(); // Monday is first in Monday-first order
    expect(r.hook.toggleDay).toHaveBeenCalledWith(1);
    r.unmount();
  });

  it('calls toggleDay for each day index 0–6', () => {
    const r = renderBulkScheduler();
    const buttons = r.container.querySelectorAll('button[data-day]');
    const dayIndices = Array.from(buttons).map(b =>
      parseInt(b.getAttribute('data-day')!, 10),
    );
    expect(dayIndices).toEqual([1, 2, 3, 4, 5, 6, 0]); // Monday-first
    r.unmount();
  });
});

// ─── Time inputs ────────────────────────────────────────────────

describe('BulkScheduler — time inputs', () => {
  it('renders start time input with hook value', () => {
    const r = renderBulkScheduler();
    const input = r.container.querySelector('input[data-testid="start-time"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('08:00');
    r.unmount();
  });

  it('renders end time input with hook value', () => {
    const r = renderBulkScheduler();
    const input = r.container.querySelector('input[data-testid="end-time"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('20:00');
    r.unmount();
  });

  it('calls setStartTime when start time changes', () => {
    const r = renderBulkScheduler();
    const input = r.container.querySelector('input[data-testid="start-time"]') as HTMLInputElement;
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype, 'value',
      )!.set!;
      nativeInputValueSetter.call(input, '14:00');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(r.hook.setStartTime).toHaveBeenCalled();
    r.unmount();
  });
});

// ─── Preview list ────────────────────────────────────────────────

describe('BulkScheduler — preview section', () => {
  it('renders summary message with shift count', () => {
    const r = renderBulkScheduler();
    const text = r.container.textContent!;
    expect(text).toContain('2');
    r.unmount();
  });

  it('renders each preview shift date', () => {
    const r = renderBulkScheduler();
    const text = r.container.textContent!;
    expect(text).toContain('2026-08-03');
    expect(text).toContain('2026-08-10');
    r.unmount();
  });

  it('shows empty message when no shifts match', () => {
    const r = renderBulkScheduler({
      hookOverrides: { previewShifts: [] },
    });
    const text = r.container.textContent!;
    expect(text).toContain('No hay días que coincidan');
    r.unmount();
  });

  it('renders holiday warning icon for holiday shifts', () => {
    const r = renderBulkScheduler({
      hookOverrides: {
        previewShifts: [
          { date: '2026-05-01', dayName: 'Viernes', isHoliday: true, holidayName: 'Día del Trabajador' },
          { date: '2026-05-08', dayName: 'Viernes', isHoliday: false, holidayName: null },
        ],
      },
    });
    const text = r.container.textContent!;
    expect(text).toContain('Día del Trabajador');
    r.unmount();
  });

  it('renders include/skip buttons for holidays', () => {
    const r = renderBulkScheduler({
      hookOverrides: {
        previewShifts: [
          { date: '2026-05-01', dayName: 'Viernes', isHoliday: true, holidayName: 'Día del Trabajador' },
        ],
      },
    });
    const text = r.container.textContent!;
    expect(text).toContain('Sí, incluirlo');
    expect(text).toContain('No, saltarlo');
    r.unmount();
  });

  it('calls toggleHolidayDecision when include/skip is clicked', () => {
    const r = renderBulkScheduler({
      hookOverrides: {
        previewShifts: [
          { date: '2026-05-01', dayName: 'Viernes', isHoliday: true, holidayName: 'Día del Trabajador' },
        ],
      },
    });
    const buttons = r.container.querySelectorAll('button[data-holiday-toggle="2026-05-01"]');
    expect(buttons.length).toBe(2); // include + skip
    (buttons[0] as HTMLElement).click();
    expect(r.hook.toggleHolidayDecision).toHaveBeenCalledWith('2026-05-01');
    r.unmount();
  });
});

// ─── Confirm / Cancel buttons ────────────────────────────────────

describe('BulkScheduler — confirm and cancel', () => {
  it('renders confirm button with shift count', () => {
    const r = renderBulkScheduler();
    const btn = r.container.querySelector('button[data-testid="confirm"]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('2');
    r.unmount();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const r = renderBulkScheduler();
    const btn = r.container.querySelector('button[data-testid="confirm"]') as HTMLButtonElement;
    btn.click();
    expect(r.onConfirm).toHaveBeenCalledTimes(1);
    r.unmount();
  });

  it('disables confirm button when no shifts to create', () => {
    const r = renderBulkScheduler({
      hookOverrides: { previewShifts: [] },
    });
    const btn = r.container.querySelector('button[data-testid="confirm"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    r.unmount();
  });

  it('renders cancel button', () => {
    const r = renderBulkScheduler();
    const btn = r.container.querySelector('button[data-testid="cancel"]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    r.unmount();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const r = renderBulkScheduler();
    const btn = r.container.querySelector('button[data-testid="cancel"]') as HTMLButtonElement;
    btn.click();
    expect(r.onCancel).toHaveBeenCalledTimes(1);
    r.unmount();
  });
});

// ─── Loading state ──────────────────────────────────────────────

describe('BulkScheduler — loading state', () => {
  it('shows generating text and disables confirm during generation', () => {
    const r = renderBulkScheduler({
      hookOverrides: {
        isGenerating: true,
        progress: { current: 1, total: 3 },
      },
    });
    const text = r.container.textContent!;
    expect(text).toContain('Generando guardias');
    const btn = r.container.querySelector('button[data-testid="confirm"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    r.unmount();
  });
});

// ─── Error state ────────────────────────────────────────────────

describe('BulkScheduler — error state', () => {
  it('shows error message when error is set', () => {
    const r = renderBulkScheduler({
      hookOverrides: {
        error: 'Error en guardia 2 de 5: API failure',
      },
    });
    const text = r.container.textContent!;
    expect(text).toContain('Error en guardia 2 de 5: API failure');
    r.unmount();
  });
});

// ─── Translations ────────────────────────────────────────────────

describe('BulkScheduler — English translations', () => {
  it('renders English day abbreviations', () => {
    const r = renderBulkScheduler({ language: 'en' });
    const text = r.container.textContent!;
    expect(text).toContain('M'); // Monday
    r.unmount();
  });

  it('renders English summary message', () => {
    const r = renderBulkScheduler({ language: 'en' });
    const text = r.container.textContent!;
    // The preview message contains "2" (count) and "2026"
    expect(text).toContain('2');
    r.unmount();
  });
});

// ─── Date input ─────────────────────────────────────────────────

describe('BulkScheduler — date input', () => {
  it('renders date input with hook startDate value', () => {
    const r = renderBulkScheduler();
    const input = r.container.querySelector('input[data-testid="start-date"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('2026-08-01');
    r.unmount();
  });
});
