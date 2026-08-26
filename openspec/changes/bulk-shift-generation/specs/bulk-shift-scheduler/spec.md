# Bulk Shift Scheduler Specification

## Purpose

Month-based guardia generation within ShiftForm modal. User selects weekdays, previews matching dates (with per-holiday detection), confirms → sequential POST to existing `POST /api/actividades/`. Each generated shift is an independent Transaction.

## Requirements

### Requirement: BulkScheduler Visibility

The BulkScheduler section SHALL be visible only when activityMode is `guardia` AND an institution is selected AND the user is creating (not editing) a shift.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Checkbox hidden in extra mode | activityMode is `extra` | ShiftForm renders | No bulk checkbox visible |
| 2 | Checkbox hidden when editing | editingTransaction exists | ShiftForm renders | No bulk checkbox visible |
| 3 | Checkbox shown for new guardia | guardia mode, institution selected, no editing | ShiftForm renders | "📅 Programar guardias del mes" checkbox visible below institution picker |
| 4 | Section expands on check | Checkbox checked | User toggles | Day-of-week selector, time inputs, date picker, and preview section render |

### Requirement: Day-of-Week Selection

The system SHALL present seven toggle buttons (L M M J V S D) in a horizontal row, touch-friendly (min 44px tap target).

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Default state | BulkScheduler opened | Render | No days selected |
| 2 | Toggle day | Monday unchecked | User taps L | Monday selected, preview recalculates |
| 3 | Deselect day | Monday selected | User taps L again | Monday deselected, preview recalculates |

### Requirement: Time and Date Inputs

The system SHALL show start_time, end_time, and a "Desde:" date picker defaulting to the 1st of the current month. End date is derived from duration (same as single shift).

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Default date | BulkScheduler opens | Render | "Desde:" = 1st of current month |
| 2 | Time inherited | Form has startTime/endTime | BulkScheduler renders | Time inputs pre-filled from form values |

### Requirement: Preview and Holiday Detection

The system SHALL display a preview list of dates that match selected weekdays within the month. Dates falling on a feriado SHALL show ⚠️ and the holiday name. The preview count SHALL update reactively.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Weekday match | Monday selected, Aug 2026 | Preview renders | "Se crearán 4 guardias" with Aug 3, 10, 17, 24 listed |
| 2 | Feriado detection | Monday Aug 17 (San Martín) selected | Preview renders | Aug 17 shows ⚠️ "San Martín" |
| 3 | Weekend included | Saturday selected, month has 4 Saturdays | Preview renders | All 4 Saturdays listed, weekend rate applied |
| 4 | No matching days | Friday selected, month starts on Sunday with no Fridays in range | Preview renders | "No hay días que coincidan" message |

### Requirement: Per-Holiday Decision

When a feriado date appears in the preview, the system SHALL show two actions: "Sí, incluirlo" (generates shift with feriado rate) and "No, saltarlo" (removes that date from generation). A clarification line: "Incluirlo = se carga la guardia con tarifa de feriado / Saltarlo = ese día no se carga nada."

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Include holiday | Aug 17 is feriado in preview | User taps "Sí, incluirlo" | Date stays in list, rate shown as feriado rate |
| 2 | Skip holiday | Aug 17 is feriado in preview | User taps "No, saltarlo" | Date removed from preview, count decremented |
| 3 | Default behavior | Feriado in preview | No action taken | Feriado dates are included by default (pre-checked) |

### Requirement: Confirm and Cancel

The system SHALL show a confirm button labeled "Crear N guardias →" (N = preview count) and a cancel button. Confirm is disabled when N = 0 or generation is in progress.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Confirm enabled | 5 dates in preview | Render | Button shows "Crear 5 guardias →", enabled |
| 2 | Confirm disabled | 0 dates in preview | Render | Button disabled |
| 3 | Cancel | Bulk mode active | User taps cancel | Bulk mode deactivated, original single-shift form shown |

### Requirement: Sequential Generation with Progress

On confirm, the system SHALL create shifts sequentially via `POST /api/actividades/`, one per date. A progress indicator SHALL show "Creando 1/5..." during generation.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Happy path | 3 dates, all succeed | User confirms | 3 Transactions created, progress: 1/3 → 2/3 → 3/3, modal closes |
| 2 | Mid-generation failure | 5 dates, API fails on shift 3 | User confirms | 2 shifts created, error shown: "Error en guardia 3 de 5: {message}". Shifts 4-5 NOT attempted. 2 created shifts remain. |
| 3 | First failure | API fails on shift 1 | User confirms | 0 shifts created, error shown, modal stays open |

### Requirement: Rate Calculation Per Shift

Each generated shift SHALL compute its amount using the same rate resolution as single shifts: `resolveGuardiaRate()` with the institution's weekday/weekend/feriado rates.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Weekday rate | Monday, inst has guardia_semana_rate = 17000 | Shift generated | amount = 17000 × duration_hours |
| 2 | Weekend rate | Saturday, inst has guardia_finde_rate = 20000 | Shift generated | amount = 20000 × duration_hours |
| 3 | Feriado rate | Holiday included, inst has guardia_feriado_rate = 25000 | Shift generated | amount = 25000 × duration_hours |
| 4 | No rates configured | Institution has no rate fields set | Shift generated | amount uses manual $/Hora fallback from form |

### Requirement: useShiftForm Refactor

The "create single transaction" logic (lines 274-365 of useShiftForm.ts) SHALL be extracted to a reusable `createTransaction()` function. Both `useActionState` submit and the bulk generator SHALL call this same function. The normal submit path SHALL behave identically.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Single shift unchanged | Normal guardia submit | User saves | Behavior identical to before refactor |
| 2 | Bulk uses same function | Bulk mode, 3 dates | Generator calls createTransaction × 3 | Each call produces same payload structure as single submit |

### Requirement: Translations

All new UI strings SHALL be added to `translations.ts` in both `es` and `en` keys. No inline strings in components.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | All strings externalized | BulkScheduler rendered | Inspect DOM | No hardcoded Spanish/English text in component |

### Requirement: Edge Cases

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | No institution rates | Institution has no rate fields | Preview renders | Warning: "La institución no tiene tarifas configuradas. Se usará el $/Hora manual." |
| 2 | No matching days | All selected weekdays fall outside month range | Preview renders | "No hay días que coincidan" message, confirm disabled |
| 3 | No days selected | Bulk mode active, 0 weekdays toggled | Preview renders | "Seleccioná al menos un día de la semana" hint |
| 4 | end_date before start_date | User sets hours < 0 or manipulates range | Preview renders | Range error from existing previewError logic, confirm disabled |
| 5 | Multi-day shift | Form has end_date > date (24h+ shift) | Bulk generates | Each shift uses same duration; rate classified by medical day of start |
