# Tasks: Bulk Shift Generation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500–600 (3 new files ~370, 3 modified net ~0, 2 test files ~180) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | `createTransaction` extraction + translations | PR 1 | Foundation: pure util, translations, single-shift regression guard |
| 2 | `useBulkShift` hook + `BulkScheduler` component | PR 2 | Core bulk logic + UI; depends on PR 1 for `createTransaction` |
| 3 | ShiftForm integration (checkbox, wiring, tests) | PR 3 | Wires bulk into form; integration tests; depends on PRs 1+2 |

---

## Phase 1: Foundation — Extract & Translate

- [x] 1.1 RED — Create `frontend/components/ShiftForm/createTransaction.ts` with `FormSnapshot` interface and `createTransaction()` signature; add `frontend/components/ShiftForm/createTransaction.test.ts` with table-driven tests (weekday, weekend, holiday rates; edge cases: backwards range, zero duration). Tests MUST fail (function body stubbed).
- [x] 1.2 GREEN — Implement `createTransaction()`: extract payload construction from `useShiftForm.ts` lines 274–365 (guardia path only). Use `computeGuardiaBreakdown`, `parseAmount`, `resolveGuardiaRate`. All tests pass.
- [x] 1.3 REFACTOR — Replace inline payload construction in `useShiftForm.ts` `useActionState` callback with `createTransaction()` call. Remove ~50 lines. Run existing `useShiftForm.test.tsx` to verify no regression.
- [x] 1.4 Add all bulk-related translation keys to `frontend/translations.ts` (both `es` and `en`): `programarGuardiasMes`, `diasDeLaSemana`, `desde`, `seCrearanGuardias`, `noHayDiasCoinciden`, `seleccionaAlMenosUnDia`, `feriadoIncluir`, `feriadoSaltar`, `feriadoExplicacion`, `crearNGuardias`, `creandoGuardia`, `errorGuardiaN`, `sinTarifasBulkWarning`, `cancelarGeneracion`, `lun`–`dom` (day abbreviations). Verify `tsc --noEmit` passes.

**PR 1 checkpoint**: `createTransaction` extracted, single-shift path unchanged, translations added. `npm test` green.

---

## Phase 2: Core — Hook & Component

- [x] 2.1 RED — Create `frontend/components/ShiftForm/useBulkShift.ts` with `UseBulkShiftParams` and `UseBulkShiftReturn` interfaces, `computePreviewDates()` pure function, and `generateAll()` method. Add `frontend/components/ShiftForm/useBulkShift.test.ts` with tests for: weekday filtering, holiday detection, preview count, sequential call ordering, error-stop behavior. Tests fail (implementation stubbed).
- [x] 2.2 GREEN — Implement `useBulkShift`: `selectedWeekdays` (Set\<number\>), `targetMonth` (Date), `holidayDecisions` (Map\<string, boolean\>), `previewDates`/`filteredDates` (useMemo), `generateAll()` sequential caller using `createTransaction` + `onBulkSubmit`. Respect max 3 useState. All tests pass.
- [x] 2.3 RED — Create `frontend/components/ShiftForm/BulkScheduler.tsx`: weekday toggle row (7 buttons, min 44px), month picker, preview list with holiday indicators (⚠️ + name), per-holiday include/skip toggle, confirm button ("Crear N guardias →"), cancel button, progress display, no-rates warning. Max 250 lines. Add render tests: weekday toggle visibility, preview count updates, confirm disabled when N=0, holiday toggle behavior. Tests fail.
- [x] 2.4 GREEN — Wire `BulkScheduler` to `useBulkShift` hook. Style with Tailwind (cn()). Verify responsive layout (lg: breakpoints). All tests pass.

**PR 2 checkpoint**: `useBulkShift` + `BulkScheduler` complete and tested. No integration with ShiftForm yet. `npm test` green.

---

## Phase 3: Integration — ShiftForm Wiring

- [x] 3.1 Add `bulkMode` useState to `ShiftForm.tsx`. Render checkbox ("📅 Programar guardias del mes") conditionally: visible only when `activityMode === 'guardia' && form.institution && !editingTransaction`. Add integration test: checkbox renders/hides per scenarios (spec §BulkScheduler Visibility scenarios 1–3).
- [x] 3.2 Render `<BulkScheduler>` inside `ShiftForm.tsx` when `bulkMode && form.selectedInstitution && !editingTransaction`. Pass form state snapshots + `onSubmit` as `onBulkSubmit` + `onClose`. Change submit button label: bulkMode → `t.crearNGuardias.replace('{count}', String(bulk.filteredDates.length))`. Verify ShiftForm stays ≤250 lines.
- [x] 3.3 Add `cancelarGeneracion` cancel handler that sets `bulkMode = false`. Wire confirm button to `bulk.generateAll()`. Add integration test: full flow mock — toggle bulk → select Monday → confirm → verify N calls to mock `onBulkSubmit`.
- [x] 3.4 Add error-mid-generation integration test: mock API fails on call 3 of 5, verify 2 created + error message "Error en guardia 3 de 5: {message}" + modal stays open.

**PR 3 checkpoint**: Full integration complete. All tests pass. `tsc --noEmit` clean.

---

## Phase 4: Verification

- [x] 4.1 Run full test suite: `cd frontend && npm test`. Verify zero failures, no new warnings.
- [x] 4.2 Run `tsc --noEmit` in `frontend/`. Verify strict mode clean — no `any`, no missing types.
- [ ] 4.3 Manual verification checklist: (a) single-shift submit still works identically; (b) bulk checkbox hidden in extra mode; (c) bulk checkbox hidden when editing; (d) weekday selection → preview updates; (e) holiday shows ⚠️ with name; (f) include/skip holiday toggle works; (g) confirm creates N shifts sequentially; (h) mid-generation error stops + shows message; (i) mobile layout responsive.
- [x] 4.4 Verify AGENTS.md compliance: BulkScheduler ≤250 lines, useBulkShift ≤250 lines, ShiftForm ≤250 lines, max 3 useState per component, no `any` types, all strings externalized.

---

**Status**: success
**Summary**: 14 tasks across 4 phases. PR split into 3 chained PRs (foundation → core → integration) to stay within review budget.
**Artifacts**: `openspec/changes/bulk-shift-generation/tasks.md`
**Next**: sdd-apply (after chained-PR decision from user)
**Risks**: `useShiftForm` extraction (Phase 1.3) touches the critical single-shift path — must verify regression before proceeding. Component line budgets need verification after implementation.
**Skill Resolution**: paths-injected — sdd-tasks, sdd-phase-common, openspec-convention
