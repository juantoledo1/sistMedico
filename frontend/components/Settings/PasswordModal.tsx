import { useActionState } from 'react';
import { Lock, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function PasswordModal({ open, onClose }: PasswordModalProps) {
  interface PasswordState {
    error: string;
    success: boolean;
  }

  const [pwState, pwAction, pwPending] = useActionState(
    async (prev: PasswordState, formData: FormData) => {
      const current = formData.get('current_password') as string;
      const pwd = formData.get('new_password') as string;
      const confirm = formData.get('confirm_password') as string;

      if (!current) return { error: 'Ingresá tu contraseña actual', success: false };
      if (!pwd) return { error: 'Ingresá una nueva contraseña', success: false };
      if (pwd.length < 8) return { error: 'Mínimo 8 caracteres', success: false };
      if (!/[A-Z]/.test(pwd)) return { error: 'Al menos una mayúscula', success: false };
      if (!/[a-z]/.test(pwd)) return { error: 'Al menos una minúscula', success: false };
      if (!/[0-9]/.test(pwd)) return { error: 'Al menos un número', success: false };
      if (pwd !== confirm) return { error: 'Las contraseñas no coinciden', success: false };

      try {
        await api.changePassword(current, pwd);
        setTimeout(() => onClose(), 1500);
        return { error: '', success: true };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Error al cambiar contraseña', success: false };
      }
    },
    { error: '', success: false },
  );

  if (!open) return null;

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cambiar contraseña</h3>
            <p className="text-xs text-slate-400">Ingresá tu contraseña actual y una nueva</p>
          </div>
        </div>

        <form action={pwAction} className="space-y-4">
          <input type="text" className="hidden" autoComplete="off" />

          <div>
            <Label variant="setting" className="mb-1">Contraseña actual</Label>
            <input type="password" name="current_password" defaultValue="" autoComplete="off" className={inputClass} placeholder="Tu contraseña actual" />
          </div>
          <div>
            <Label variant="setting" className="mb-1">Nueva contraseña</Label>
            <input type="password" name="new_password" defaultValue="" autoComplete="off" className={inputClass} placeholder="Mín. 8 caracteres" />
          </div>
          <div>
            <Label variant="setting" className="mb-1">Confirmar nueva contraseña</Label>
            <input type="password" name="confirm_password" defaultValue="" autoComplete="off" className={inputClass} placeholder="Repetí la nueva contraseña" />
          </div>

          {pwState.error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{pwState.error}</p>
            </div>
          )}

          {pwState.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400">Contraseña actualizada correctamente</p>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={pwPending} className="flex-1">
              {pwPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Cambiar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
