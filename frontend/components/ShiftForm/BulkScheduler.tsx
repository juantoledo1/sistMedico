import { translations, MONTH_NAMES, type Language } from '../../translations';
import { cn } from '../../lib/utils';
import type { UseBulkShiftReturn } from './useBulkShift';

const DAY_LABELS: Record<Language, Record<number, string>> = {
  es: { 0: 'D', 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S' },
  en: { 0: 'S', 1: 'M', 2: 'T', 3: 'W', 4: 'T', 5: 'F', 6: 'S' },
};

export interface BulkSchedulerProps {
  hook: UseBulkShiftReturn;
  language: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkScheduler({ hook, language, onConfirm, onCancel }: BulkSchedulerProps) {
  const t = translations[language];
  const dayLabels = DAY_LABELS[language];
  const count = hook.previewShifts.length;

  // Parse month/year from startDate for summary text
  const [yearStr, monthStr] = hook.startDate.split('-');
  const monthIdx = parseInt(monthStr) - 1;
  const monthName = MONTH_NAMES[language][monthIdx];
  const year = parseInt(yearStr);

  const summaryText = t.previewGuardias
    .replace('{count}', String(count))
    .replace('{month}', monthName)
    .replace('{year}', String(year));

  const confirmLabel = language === 'es'
    ? `Crear ${count} guardias \u2192`
    : `Create ${count} shifts \u2192`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {t.programarGuardiasDelMes}
      </h3>

      {/* Day-of-week selector */}
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {t.seleccionarDias}
        </p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5, 6, 0].map(day => (
            <button
              key={day}
              type="button"
              data-day={day}
              onClick={() => hook.toggleDay(day)}
              className={cn(
                'flex-1 min-h-[44px] min-w-[44px] rounded-lg text-sm font-medium transition-colors',
                hook.selectedDays.has(day)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
              )}
            >
              {dayLabels[day]}
            </button>
          ))}
        </div>
      </div>

      {/* Time inputs */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
            {t.horarioInicio}
          </label>
          <input
            type="time"
            data-testid="start-time"
            value={hook.startTime}
            onChange={e => hook.setStartTime(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
            {t.horarioFin}
          </label>
          <input
            type="time"
            data-testid="end-time"
            value={hook.endTime}
            onChange={e => hook.setEndTime(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Date picker */}
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
          {t.desde}
        </label>
        <input
          type="date"
          data-testid="start-date"
          value={hook.startDate}
          onChange={e => hook.setStartDate(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        />
      </div>

      {/* Preview section */}
      <div className="space-y-1">
        {count > 0 ? (
          <>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {summaryText}
            </p>
            {hook.previewShifts.map(shift => (
              <div key={shift.date} className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-700 dark:text-slate-200">
                  {shift.date} {shift.dayName}
                  {shift.isHoliday && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                      \u26A0 {shift.holidayName}
                    </span>
                  )}
                </span>
                {shift.isHoliday && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      data-holiday-toggle={shift.date}
                      onClick={() => hook.toggleHolidayDecision(shift.date)}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full transition-colors',
                        !hook.holidayDecisions.has(shift.date)
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500',
                      )}
                    >
                      {t.siIncluirlo}
                    </button>
                    <button
                      type="button"
                      data-holiday-toggle={shift.date}
                      onClick={() => hook.toggleHolidayDecision(shift.date)}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full transition-colors',
                        hook.holidayDecisions.has(shift.date)
                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500',
                      )}
                    >
                      {t.noSaltarlo}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {hook.previewShifts.some(s => s.isHoliday) && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {t.incluirFeriado} / {t.saltarFeriado}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t.sinCoincidencias}
          </p>
        )}
      </div>

      {/* Generating state */}
      {hook.isGenerating && (
        <p className="text-xs text-blue-600 dark:text-blue-400">
          {t.generandoGuardias}
          {hook.progress && ` (${hook.progress.current}/${hook.progress.total})`}
        </p>
      )}

      {/* Error state */}
      {hook.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{hook.error}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          data-testid="confirm"
          onClick={onConfirm}
          disabled={count === 0 || hook.isGenerating}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors',
            count > 0 && !hook.isGenerating
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500',
          )}
        >
          {hook.isGenerating ? t.generandoGuardias : confirmLabel}
        </button>
        <button
          type="button"
          data-testid="cancel"
          onClick={onCancel}
          disabled={hook.isGenerating}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
        >
          {t.cancelar}
        </button>
      </div>
    </div>
  );
}
