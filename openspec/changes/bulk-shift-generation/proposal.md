# Proposal: Bulk Shift Generation

## Intent

Doctors who work recurring weekly shifts (e.g. every Monday 08:00–20:00) currently create each shift individually. For a typical month this means 4–5 identical form submissions. This change adds a "generate month" option inside the existing ShiftForm modal so all matching days are created in one action.

## Scope

### In Scope
- Checkbox "📅 Programar guardias del mes" in ShiftForm, visible only in guardia mode after institution selection
- Day-of-week selector (L/M/M/J/V/S/D checkboxes)
- Start/end time inputs reusing existing values from the form
- Month picker defaulting to current month
- Preview count: "Se crearán N guardias en [month] [year]"
- On confirm: sequential POST to existing `POST /api/actividades/` — no new backend endpoint
- Each generated shift is an independent Transaction (editable, deletable)
- Optional "skip feriados" checkbox
- All strings added to `translations.ts` (ES + EN)
- Responsive layout for mobile and desktop

### Out of Scope (future)
- Multi-month range generation
- Template save/recall ("my Monday pattern")
- Conflict detection (shifts already exist on a day)
- Batch delete or batch edit
- Backend bulk endpoint optimization

## Capabilities

### New Capabilities
- `bulk-shift-scheduler`: In-modal month-based shift generation with weekday selection, preview, and sequential submission

### Modified Capabilities
None — no existing spec-level behavior changes.

## Approach

1. **New component `BulkScheduler.tsx`** (~150 lines): weekday checkboxes, month picker, preview text, confirm/cancel buttons. Rendered inside ShiftForm when the bulk checkbox is checked.
2. **New hook `useBulkShift.ts`** (~80 lines): owns `bulkEnabled`, `selectedWeekdays`, `targetMonth`, `skipFeriados`. Exposes `generateShifts()` that returns an array of `Partial<Transaction>` objects using existing `computeGuardiaBreakdown` for rate calculation and `esFeriado` for holiday detection.
3. **ShiftForm integration**: new `onBulkSubmit` prop (or extend existing `onSubmit` to accept arrays). The form's confirm button changes to "Crear N guardias →" when bulk mode is active.
4. **Hook budget**: `useShiftForm` is already 443 lines — bulk state stays in `useBulkShift`, keeping the existing hook untouched.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/components/ShiftForm/BulkScheduler.tsx` | New | UI for weekday selection + preview |
| `frontend/components/ShiftForm/useBulkShift.ts` | New | Bulk scheduling logic |
| `frontend/components/ShiftForm/ShiftForm.tsx` | Modified | Add checkbox toggle + render BulkScheduler |
| `frontend/components/ShiftForm/useShiftForm.ts` | Modified | Add `onBulkSubmit` callback support (minimal) |
| `frontend/translations.ts` | Modified | ~15 new strings (ES + EN) |
| `frontend/lib/feriados.ts` | Read-only | Used for skip-feriados logic |
| `frontend/lib/guardiaBreakdown.ts` | Read-only | Used for per-shift rate calculation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| useShiftForm grows beyond 443 lines | Low | Bulk logic lives in separate `useBulkShift` hook |
| Sequential POST is slow for 20+ shifts | Low | Add subtle progress indicator; acceptable for MVP |
| GGA pre-commit hooks reject new files | Low | Follow existing patterns (named exports, no `any`, translations) |
| useActionState contract incompatible with bulk submit | Medium | May need to bypass useActionState for bulk path and call onSubmit directly — test early |

## Rollback Plan

Delete `BulkScheduler.tsx` and `useBulkShift.ts`. Remove bulk checkbox and related imports from `ShiftForm.tsx`. Revert `translations.ts` additions. No data migration needed — generated shifts are normal Transactions.

## Dependencies

- Existing `POST /api/actividades/` endpoint (no changes)
- Existing `esFeriado()` and `computeGuardiaBreakdown()` utilities
- React 19 + useActionState patterns

## Success Criteria

- [ ] User can select weekdays and generate all matching shifts for current month in one action
- [ ] Each generated shift appears as an independent, editable Transaction
- [ ] Rates are correctly applied per-day-type (weekday/weekend/feriado)
- [ ] Mobile and desktop layouts work without regressions
- [ ] All new strings are in translations.ts (ES + EN)
- [ ] GGA pre-commit hooks pass
- [ ] No regression in single-shift creation flow
