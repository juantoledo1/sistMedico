import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import { translations, MONTH_NAMES, type Language } from '../../translations';
import type { ScheduledPattern } from '../../hooks/useScheduledPatterns';

interface ScheduledPatternsProps {
  patterns: ScheduledPattern[];
  language: Language;
  onReuse: (patterns: ScheduledPattern[], institution: string) => void;
}

interface InstitutionGroup {
  institution: string;
  patterns: ScheduledPattern[];
  totalAmount: number;
  totalCount: number;
}

function groupByInstitution(patterns: ScheduledPattern[]): InstitutionGroup[] {
  const map = new Map<string, ScheduledPattern[]>();
  for (const p of patterns) {
    const existing = map.get(p.institution);
    if (existing) existing.push(p);
    else map.set(p.institution, [p]);
  }

  const groups: InstitutionGroup[] = [];
  for (const [institution, instPatterns] of map) {
    groups.push({
      institution,
      patterns: instPatterns,
      totalAmount: instPatterns.reduce((s, p) => s + p.totalAmount, 0),
      totalCount: instPatterns.reduce((s, p) => s + p.count, 0),
    });
  }
  return groups;
}

function getNextMonthLabel(language: Language): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return MONTH_NAMES[language][nextMonth.getMonth()];
}

export function ScheduledPatterns({ patterns, language, onReuse }: ScheduledPatternsProps) {
  const t = translations[language];
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const groups = groupByInstitution(patterns);
  const nextMonthLabel = getNextMonthLabel(language);

  const toggleGroup = (institution: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(institution)) next.delete(institution);
      else next.add(institution);
      return next;
    });
  };

  if (patterns.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">
          📋 {t.guardiasProgramadas}
        </h3>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {groups.map(group => {
          const isExpanded = expanded.has(group.institution);

          return (
            <div key={group.institution}>
              {/* Institution header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.institution)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {group.institution}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>×{group.totalCount}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(group.totalAmount)}
                  </span>
                </div>
              </button>

              {/* Pattern rows */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-1.5">
                  {group.patterns.map((p, i) => (
                    <div
                      key={`${p.dayOfWeek}-${p.startTime}-${i}`}
                      className="flex items-center justify-between text-xs pl-6 py-1.5"
                    >
                      <span className="text-slate-600 dark:text-slate-300">
                        {p.dayLabel.slice(0, 3)} {p.startTime}–{p.endTime}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 dark:text-slate-500">
                          ×{p.count}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-200 w-20 text-right">
                          {formatCurrency(p.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Reuse button */}
                  <div className="pt-2 pl-6">
                    <button
                      type="button"
                      onClick={() => onReuse(group.patterns, group.institution)}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-semibold',
                        'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300',
                        'transition-colors',
                      )}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {t.reutilizarPara.replace('{month}', nextMonthLabel)} →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
