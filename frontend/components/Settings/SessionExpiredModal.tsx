import { Clock } from 'lucide-react';

interface SessionExpiredModalProps {
  onReLogin: () => void;
}

export function SessionExpiredModal({ onReLogin }: SessionExpiredModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 w-[90%] max-w-sm rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Sesión expirada
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Tu sesión venció. Por seguridad, volvé a iniciar sesión.
          </p>
        </div>
        <button
          onClick={onReLogin}
          className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}
