import { useActionState, useState } from 'react';
import { api } from '../../services/api';

interface PasswordState {
  error: string;
  success: boolean;
}

export function usePasswordModal(onClose: () => void) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  return {
    showCurrent, setShowCurrent,
    showNew, setShowNew,
    showConfirm, setShowConfirm,
    pwState, pwAction, pwPending,
  };
}
