import { cn } from '../../lib/utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
}

export function Card({
  className,
  children,
  padding = 'md',
  shadow = 'lg',
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden",
        padding === 'none' && "p-0",
        padding === 'sm' && "p-4",
        padding === 'md' && "p-5",
        padding === 'lg' && "p-6",
        padding === 'xl' && "p-8",
        shadow === 'sm' && "shadow-sm",
        shadow === 'md' && "shadow-md",
        shadow === 'lg' && "shadow-lg",
        shadow === 'xl' && "shadow-xl",
        shadow === '2xl' && "shadow-2xl",
        shadow === 'none' && "shadow-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
