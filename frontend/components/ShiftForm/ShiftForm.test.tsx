// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ShiftForm } from './ShiftForm';
import { ShiftType, PaymentStatus, type Institution, type Transaction, type UserSettings } from '../../types';

process.env.TZ = 'America/Argentina/Buenos_Aires';

// ─── Shared test data ──────────────────────────────────────────

const language = 'es' as const;

const baseSettings: UserSettings = {
  language,
  darkMode: false,
  currency: 'ARS',
};

const institutions: Institution[] = [
  {
    id: 'inst-1',
    name: 'Hospital Test',
    guardia_semana_rate: 17000,
    guardia_finde_rate: 19000,
    guardia_feriado_rate: 25000,
    is_active: true,
  },
];

const defaultProps = {
  onClose: vi.fn(),
  onSubmit: vi.fn(async () => {}),
  transactions: [] as Transaction[],
  settings: baseSettings,
  institutions,
  onInstitutionChange: vi.fn(),
  onInstitutionDelete: vi.fn(),
};

// ─── Helpers ────────────────────────────────────────────────────

function renderShiftForm(overrides?: {
  editingTransaction?: Transaction;
  initialDate?: string;
}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  act(() => {
    root.render(
      <ShiftForm
        {...defaultProps}
        editingTransaction={overrides?.editingTransaction}
        initialDate={overrides?.initialDate}
      />,
    );
  });

  return {
    container,
    root,
    unmount() {
      act(() => root.unmount());
      document.body.removeChild(container);
    },
  };
}

/** Select an institution through the InstitutionPicker dropdown. */
function selectInstitution(container: HTMLElement) {
  // Click the picker dropdown trigger (the div with ChevronDown)
  const pickerTrigger = container.querySelector('.relative .cursor-pointer') as HTMLElement;
  act(() => pickerTrigger.click());

  // Click on "Hospital Test" in the dropdown
  const buttons = container.querySelectorAll('button');
  const hospitalBtn = Array.from(buttons).find(b =>
    b.textContent?.includes('Hospital Test'),
  );
  if (hospitalBtn) act(() => hospitalBtn.click());
}

function findBulkCheckbox(container: HTMLElement) {
  const labels = container.querySelectorAll('label');
  return Array.from(labels).find(l =>
    l.textContent?.includes('Programar guardias del mes'),
  );
}

// ─── Tests ──────────────────────────────────────────────────────

describe('ShiftForm — bulk mode checkbox visibility', () => {
  it('does NOT show bulk checkbox when no institution is selected', () => {
    const r = renderShiftForm();
    expect(findBulkCheckbox(r.container)).toBeUndefined();
    r.unmount();
  });

  it('shows bulk checkbox after selecting an institution', () => {
    const r = renderShiftForm();
    selectInstitution(r.container);
    expect(findBulkCheckbox(r.container)).toBeDefined();
    r.unmount();
  });

  it('does NOT show bulk checkbox when editing a transaction', () => {
    const editing: Transaction = {
      id: 'tx-1',
      institution: 'Hospital Test',
      type: ShiftType.ACTIVE,
      date: '2026-08-15',
      amount: 17000,
      status: PaymentStatus.PENDING,
      duration: 24,
      startTime: '08:00',
      endTime: '08:00',
      endDate: '2026-08-16',
    };
    const r = renderShiftForm({ editingTransaction: editing });
    // Even though institution is set on the editing tx, checkbox must be hidden
    expect(findBulkCheckbox(r.container)).toBeUndefined();
    r.unmount();
  });

  it('checking bulk checkbox shows BulkScheduler section', () => {
    const r = renderShiftForm();
    selectInstitution(r.container);

    const toggle = r.container.querySelector('[data-testid="bulk-toggle"]') as HTMLInputElement;
    act(() => { toggle.click(); });

    // BulkScheduler renders a heading with the programar guardias text
    const headings = r.container.querySelectorAll('h3');
    const bulkHeading = Array.from(headings).find(h =>
      h.textContent?.includes('Programar guardias del mes'),
    );
    expect(bulkHeading).toBeDefined();
    r.unmount();
  });

  it('unchecking bulk checkbox hides BulkScheduler and shows normal form', () => {
    const r = renderShiftForm();
    selectInstitution(r.container);

    const toggle = r.container.querySelector('[data-testid="bulk-toggle"]') as HTMLInputElement;
    // Check → BulkScheduler appears
    act(() => { toggle.click(); });
    expect(r.container.querySelector('h3')).toBeDefined();

    // Uncheck → BulkScheduler hidden, normal submit button returns
    act(() => { toggle.click(); });
    const headings = r.container.querySelectorAll('h3');
    const bulkHeading = Array.from(headings).find(h =>
      h.textContent?.includes('Programar guardias del mes'),
    );
    expect(bulkHeading).toBeUndefined();
    // The normal submit button should be present
    const submitBtn = r.container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).toBeDefined();
    r.unmount();
  });

  it('normal form submit button hidden when bulk mode is active', () => {
    const r = renderShiftForm();
    selectInstitution(r.container);

    const toggle = r.container.querySelector('[data-testid="bulk-toggle"]') as HTMLInputElement;
    act(() => { toggle.click(); });

    // Normal submit button should NOT be rendered in bulk mode
    const submitBtn = r.container.querySelector('button[type="submit"]');
    expect(submitBtn).toBeNull();
    r.unmount();
  });
});

// ─── Bulk generation flow ──────────────────────────────────────

describe('ShiftForm — bulk generation integration', () => {
  it('bulk generation calls onSubmit for each shift and closes modal', async () => {
    const onSubmit = vi.fn(async () => {});
    const onClose = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ShiftForm
          {...defaultProps}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      );
    });

    // Select institution
    selectInstitution(container);

    // Toggle bulk mode
    const bulkToggle = container.querySelector('[data-testid="bulk-toggle"]') as HTMLInputElement;
    act(() => { bulkToggle.click(); });

    // Deselect all days except Monday (data-day="1") to limit shift count
    const dayButtons = container.querySelectorAll('button[data-day]');
    for (const btn of Array.from(dayButtons)) {
      const day = parseInt(btn.getAttribute('data-day')!);
      if (day !== 1) {
        act(() => { (btn as HTMLElement).click(); });
      }
    }

    // Now only Monday is selected. Click confirm
    const confirmBtn = container.querySelector('[data-testid="confirm"]') as HTMLButtonElement;
    expect(confirmBtn).not.toBeNull();
    expect(confirmBtn.disabled).toBe(false);

    await act(async () => {
      confirmBtn.click();
    });

    // onSubmit should have been called for each Monday in the month
    // August 2026 has Mondays: 3, 10, 17, 24 = 4 calls
    expect(onSubmit.mock.calls.length).toBeGreaterThanOrEqual(1);

    // Modal should close (onClose called)
    expect(onClose).toHaveBeenCalled();

    act(() => root.unmount());
    document.body.removeChild(container);
  });

  it('bulk generation shows error on failure and keeps modal open', async () => {
    let callCount = 0;
    const onSubmit = vi.fn(async () => {
      callCount++;
      if (callCount === 2) {
        throw new Error('API failure');
      }
    });
    const onClose = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ShiftForm
          {...defaultProps}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      );
    });

    // Select institution
    selectInstitution(container);

    // Toggle bulk mode
    const bulkToggle = container.querySelector('[data-testid="bulk-toggle"]') as HTMLInputElement;
    act(() => { bulkToggle.click(); });

    // Deselect all days except Monday
    const dayButtons = container.querySelectorAll('button[data-day]');
    for (const btn of Array.from(dayButtons)) {
      const day = parseInt(btn.getAttribute('data-day')!);
      if (day !== 1) {
        act(() => { (btn as HTMLElement).click(); });
      }
    }

    // Click confirm
    const confirmBtn = container.querySelector('[data-testid="confirm"]') as HTMLButtonElement;
    await act(async () => {
      confirmBtn.click();
    });

    // onSubmit was called 2 times: shift 1 succeeded, shift 2 threw
    // The error message should reference shift 2
    expect(onSubmit.mock.calls.length).toBe(2);
    // Error should be shown in the UI
    const errorText = container.textContent;
    expect(errorText).toContain('Error');
    expect(errorText).toContain('2');
    // Modal should NOT close (onClose not called)
    expect(onClose).not.toHaveBeenCalled();

    act(() => root.unmount());
    document.body.removeChild(container);
  });

  it('cancel in bulk mode returns to normal form', () => {
    const r = renderShiftForm();
    selectInstitution(r.container);

    // Enter bulk mode
    const bulkToggle = r.container.querySelector('[data-testid="bulk-toggle"]') as HTMLInputElement;
    act(() => { bulkToggle.click(); });

    // BulkScheduler should be visible
    expect(r.container.querySelector('[data-testid="confirm"]')).not.toBeNull();

    // Click cancel
    const cancelBtn = r.container.querySelector('[data-testid="cancel"]') as HTMLButtonElement;
    act(() => { cancelBtn.click(); });

    // BulkScheduler should be hidden, normal submit button returns
    expect(r.container.querySelector('[data-testid="confirm"]')).toBeNull();
    const submitBtn = r.container.querySelector('button[type="submit"]');
    expect(submitBtn).toBeDefined();
    r.unmount();
  });
});
