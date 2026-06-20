import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'md' | 'sm' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2",
        size === 'sm' && "px-4 py-2 text-sm",
        size === 'md' && "px-6 py-3",
        size === 'lg' && "px-8 py-4 text-lg",
        variant === 'primary' && "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:hover:bg-blue-600",
        variant === 'secondary' && "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600",
        variant === 'ghost' && "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800",
        variant === 'icon' && "p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
