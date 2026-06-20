import { Transaction } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Search, X } from 'lucide-react';

interface SearchModalProps {
  open: boolean;
  searchQuery: string;
  results: Transaction[];
  placeholder: string;
  emptyLabel: string;
  onSearchChange: (q: string) => void;
  onClose: () => void;
}

export function SearchModal({
  open,
  searchQuery,
  results,
  placeholder,
  emptyLabel,
  onSearchChange,
  onClose,
}: SearchModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-start justify-center pt-20 lg:pt-32 p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent font-medium text-slate-900 dark:text-white focus:outline-none"
              autoFocus
            />
            <button onClick={onClose}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{tx.institution}</p>
                  <p className="text-xs text-slate-400">{tx.date}</p>
                </div>
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 py-8">{emptyLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
