import { cn } from '../../lib/utils';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'business' | 'auth' | 'setting';
  htmlFor?: string;
}

export function Label({
  children,
  className,
  variant = 'business',
  htmlFor,
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        variant === 'business' && "text-xs font-bold text-slate-500 uppercase",
        variant === 'auth' && "block text-sm font-bold text-slate-700 mb-2",
        variant === 'setting' && "text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1",
        className,
      )}
    >
      {children}
    </label>
  );
}
