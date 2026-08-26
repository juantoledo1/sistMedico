# Design: Bulk Shift Generation

## Technical Approach

Add an in-modal bulk scheduling mode to ShiftForm. A new `BulkScheduler` component renders weekday selection + month preview inside the existing modal. A new `useBulkShift` hook owns bulk-specific state and orchestrates sequential API calls. The existing single-shift path (`useActionState` → `onSubmit`) is untouched. The `createTransaction` helper is extracted from `useShiftForm` to unify payload construction.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Bulk state isolation | Separate `useBulkShift` hook | Inline in `useShiftForm` | `useShiftForm` is already 443 lines. Separation respects single-responsibility. |
| API call path | `useBulkShift` calls `onBulkSubmit` prop (wrapper around `handleAddTransaction`) | Direct `api.createActividad` bypass | Must update local transaction list. Bypassing `handleAddTransaction` would leave UI stale until next fetch. |
| `createTransaction` extraction | Extract from `useActionState` callback into module-level function | Duplicate logic in hook | DRY — single source of truth for payload shape. Both `useActionState` and bulk path call it. |
| Progress tracking | `useState<{ current: number; total: number }>` inside `useBulkShift` | External store | Scoped to the hook; no global state needed. |
| Holiday handling | Per-date include/skip toggle in preview, defaulting to include | Skip-all or include-all | Spec requires per-holiday user decision. |

## Component Hierarchy

```
App.tsx
└── ShiftForm.tsx (188 lines → ~215 lines)
    ├── useShiftForm.ts (443 lines → ~390 lines after extraction)
    ├── [Guardia mode fields]
    │   └── BulkScheduler.tsx (NEW, ~180 lines)
    │       └── useBulkShift.ts (NEW, ~120 lines)
    │           ├── computePreviewDates() — pure util
    │           └── createTransaction() — extracted util
    └── [Submit button — label changes in bulk mode]
```

## State Flow

```
ShiftForm ──────────────────────────────────────────────
│  form = useShiftForm(onSubmit, ...)
│  const [bulkMode, setBulkMode] = useState(false)   ← NEW (1 useState)
│
├── BulkScheduler (when bulkMode && guardia && institution && !editing)
│     bulk = useBulkShift({
│       startTime: form.startTime,
│       endTime: form.endTime,
│       hours: form.hours,
│       institution: form.institution,
│       selectedInstitution: form.selectedInstitution,
│       hourlyRate: form.hourlyRate,
│       shiftSubtype: form.shiftSubtype,
│       onBulkSubmit: onSubmit,        ← parent's handleAddTransaction
│       onClose,
│       language,
│     })
│
│     State owned by useBulkShift:
│       selectedWeekdays: Set<number>   (0=Sun..6=Sat)
│       targetMonth: Date               (1st of month)
│       holidayDecisions: Map<string, boolean>  (dateStr → include?)
│       isGenerating: boolean
│       progress: { current, total } | null
│       error: string | null
│
│     Derived (useMemo):
│       previewDates: PreviewDate[]     (computed from weekdays + month)
│       filteredDates: PreviewDate[]    (after holiday decisions)
│
├── Submit button label:
│   bulkMode → `Crear ${bulk.filteredDates.length} guardias →`
│   normal → existing label
│
└── Confirm button in BulkScheduler triggers bulk.generateAll()
```

## API Call Sequence

```
User taps "Crear 5 guardias →"
  │
  ▼
bulk.generateAll()
  │
  ├─ For each date in filteredDates:
  │     │
  │     ▼
  │   createTransaction(date, formState) → Partial<Transaction>
  │     │  (extracted from useShiftForm lines 274-365)
  │     │  Uses: resolveGuardiaRate() for amount
  │     │        computeGuardiaBreakdown() for weekdayHours/weekendHours
  │     │
  │     ▼
  │   onBulkSubmit(payload)     ← handleAddTransaction → saveActivity → api.createActividad
  │     │
  │     ├── Success → setTransactions(prev => [newTx, ...prev])
  │     │             progress.current++
  │     │
  │     └── Error → STOP. Error message: "Error en guardia {i+1}/{total}: {msg}"
  │                  Previously created shifts REMAIN (no rollback)
  │
  └─ All done → onClose()
```

## Error Handling Strategy

| Scenario | Behavior |
|----------|----------|
| API fails on shift N | Stop immediately. Show `"Error en guardia {N}/{total}: {message}"`. Shifts 1..N-1 remain created. Shifts N+1..total are NOT attempted. |
| API fails on shift 1 | 0 created. Error shown. Modal stays open. User can retry or cancel. |
| Network timeout | Same as API failure — caught by `saveActivity` throw. |
| No matching dates | Preview shows "No hay días que coincidan". Confirm button disabled. |
| Institution has no rates | Warning in preview: uses manual $/Hora fallback (same as single shift). |

No rollback mechanism. Partial success is acceptable per spec — each generated shift is independent.

## File Changes

| File | Action | Lines (est.) | Description |
|------|--------|-------------|-------------|
| `frontend/components/ShiftForm/BulkScheduler.tsx` | **Create** | ~180 | Weekday toggle row, month picker, preview list with holiday indicators, confirm/cancel buttons, progress display |
| `frontend/components/ShiftForm/useBulkShift.ts` | **Create** | ~120 | Bulk state, `computePreviewDates()`, `generateAll()` sequential caller |
| `frontend/components/ShiftForm/createTransaction.ts` | **Create** | ~70 | Extracted from `useShiftForm` lines 274-365. Builds `Partial<Transaction>` from form values + date |
| `frontend/components/ShiftForm/ShiftForm.tsx` | **Modify** | ~215 (was 188) | Add `bulkMode` state, render BulkScheduler toggle + component, change submit button label |
| `frontend/components/ShiftForm/useShiftForm.ts` | **Modify** | ~390 (was 443) | Replace inline payload construction with `createTransaction()` call. Remove ~50 lines |
| `frontend/translations.ts` | **Modify** | ~815 (was 788) | Add ~27 new keys (ES + EN) for bulk UI |
| `frontend/hooks/useTransactions.ts` | **Modify** | ~220 (was 215) | Minor: no structural change needed — `handleAddTransaction` already handles single calls |
| `frontend/lib/feriados.ts` | Read-only | 49 | Used by `useBulkShift` for `esFeriado()` and `holidayName()` |
| `frontend/lib/guardiaBreakdown.ts` | Read-only | 39 | Used by `createTransaction()` for rate computation |

**Total**: 3 new files, 4 modified files, 0 deleted.

## `createTransaction.ts` — Extracted Function

```typescript
// Pure function: form state + date → Partial<Transaction>
// Extracted from useShiftForm useActionState callback (lines 274-365)
export function createTransaction(params: {
  date: string;
  form: FormSnapshot;       // date, endDate, startTime, endTime, institution,
                            // amount, notes, status, hourlyRate, hours,
                            // shiftSubtype, extras, editingTransaction
  language: Language;
}): Partial<Transaction> {
  const { date: txDate, form, language } = params;
  const t = translations[language];

  // Guardia path: compute duration from range, resolve rate
  const start = new Date(txDate + 'T' + form.startTime);
  const end = new Date(form.endDate + 'T' + form.endTime);
  const duration = Math.max(0, Math.round(
    (end.getTime() - start.getTime()) / (60 * 60 * 1000)
  ));

  const rawRate = parseAmount(form.hourlyRate);
  const { split, semanaRate, findeRate, feriadoRate } =
    computeGuardiaBreakdown(start, end, form.selectedInstitution, rawRate);

  const amount =
    split.weekdayHours * (semanaRate ?? 0) +
    split.weekendHours * (findeRate ?? 0) +
    split.feriadoHours * (feriadoRate ?? 0);

  return {
    amount,
    date: txDate,
    endDate: form.endDate,
    startTime: form.startTime,
    endTime: form.endTime,
    institution: form.institution,
    type: ShiftType.ACTIVE,
    status: form.status,
    notes: form.notes,
    duration,
    hourlyRate: rawRate,
    shiftSubtype: form.shiftSubtype,
    weekdayHours: split.weekdayHours || undefined,
    weekendHours: split.weekendHours || undefined,
  };
}
```

## `useBulkShift.ts` — Hook Interface

```typescript
interface UseBulkShiftParams {
  // Form state (read-only snapshots)
  startTime: string;
  endTime: string;
  hours: string;
  institution: string;
  selectedInstitution: Institution | undefined;
  hourlyRate: string;
  shiftSubtype: 'activa' | 'pasiva';
  status: PaymentStatus;
  notes: string;
  // Callbacks
  onBulkSubmit: (tx: Partial<Transaction>) => Promise<void>;
  onClose: () => void;
  language: Language;
}

interface UseBulkShiftReturn {
  selectedWeekdays: Set<number>;
  toggleWeekday: (day: number) => void;
  targetMonth: Date;
  setTargetMonth: (d: Date) => void;
  previewDates: PreviewDate[];
  filteredDates: PreviewDate[];
  holidayDecisions: Map<string, boolean>;
  toggleHolidayDecision: (dateStr: string) => void;
  isGenerating: boolean;
  progress: { current: number; total: number } | null;
  error: string | null;
  generateAll: () => Promise<void>;
  hasNoRates: boolean;
}
```

## Translations (New Keys)

| Key | ES | EN |
|-----|----|----|
| `programarGuardiasMes` | Programar guardias del mes | Schedule monthly shifts |
| `diasDeLaSemana` | Días de la semana | Days of the week |
| `desde` | Desde: | From: |
| `seCrearanGuardias` | Se crearán {count} guardias en {month} {year} | {count} shifts will be created in {month} {year} |
| `noHayDiasCoinciden` | No hay días que coincidan | No matching days |
| `seleccionaAlMenosUnDia` | Seleccioná al menos un día de la semana | Select at least one day of the week |
| `feriadoIncluir` | Sí, incluirlo | Yes, include it |
| `feriadoSaltar` | No, saltarlo | No, skip it |
| `feriadoExplicacion` | Incluirlo = se carga la guardia con tarifa de feriado / Saltarlo = ese día no se carga nada | Include = shift created with holiday rate / Skip = nothing created for that day |
| `crearNGuardias` | Crear {count} guardias → | Create {count} shifts → |
| `creandoGuardia` | Creando {current}/{total}... | Creating {current}/{total}... |
| `errorGuardiaN` | Error en guardia {n} de {total}: {message} | Error on shift {n} of {total}: {message} |
| `sinTarifasBulkWarning` | La institución no tiene tarifas configuradas. Se usará el $/Hora manual. | Institution has no rates configured. Manual $/Hour will be used. |
| `cancelarGeneracion` | Cancelar | Cancel |
| `lun` | L | M |
| `mar` | M | T |
| `mie` | M | W |
| `jue` | J | T |
| `vie` | V | F |
| `sab` | S | S |
| `dom` | D | S |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `computePreviewDates()` pure function | Table-driven: various months, weekday combos, edge cases (month boundary) |
| Unit | `createTransaction()` extracted function | Same inputs → same output as old `useActionState` path |
| Unit | `useBulkShift` hook | `@testing-library/react-hooks`: toggle weekdays, preview count, holiday decisions |
| Integration | ShiftForm bulk mode toggle → BulkScheduler render | Render ShiftForm in guardia mode, check bulk checkbox, verify BulkScheduler appears |
| Integration | Bulk generation flow (mock API) | Mock `onBulkSubmit`, call `generateAll`, verify N calls with correct payloads |
| Integration | Error mid-generation | Mock API to fail on call 3, verify 2 created + error message + modal stays open |
| E2E | Full bulk creation | Create 3 Monday shifts for a month, verify they appear in transaction list |

## Migration / Rollout

No migration required. Generated shifts are normal Transaction records. Feature is additive — no existing behavior changes.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `useShiftForm` refactoring breaks single-shift path | Medium | High | Extract `createTransaction` first, verify single path still works before adding bulk. Run existing tests. |
| Sequential POST slow for 20+ shifts | Low | Low | Progress indicator reassures user. Acceptable for MVP — bulk endpoint is out of scope. |
| `useActionState` incompatibility with bulk | Medium | Medium | Bulk path bypasses `useActionState` entirely — calls `onBulkSubmit` directly. No conflict. |
| Holiday decisions UI too complex for mobile | Low | Medium | Keep toggle simple: tap to include/skip. Use existing responsive patterns (lg: breakpoints). |
| GGA pre-commit rejection | Low | Low | Follow existing patterns: named exports, no `any`, translations for all strings. |

## Open Questions

None — all architecture decisions are resolved.
