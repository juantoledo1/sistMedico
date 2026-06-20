import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token"),
  );
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener('sessionExpired', handler);
    return () => window.removeEventListener('sessionExpired', handler);
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setLoginError("");
    setAuthLoading(true);
    try {
      await api.login(email, password);
      setIsAuthenticated(true);
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Error al iniciar sesión",
      );
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleRegister = useCallback(async (data: {
    email: string; password: string; password_confirm: string;
    full_name: string; specialty?: string; institution?: string; phone?: string;
  }) => {
    setRegisterError("");
    setAuthLoading(true);
    setRegisterSuccess(false);
    try {
      await api.register(data);
      setRegisterSuccess(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al registrarse";
      if (msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("Rate limit")) {
        setRegisterError("Demasiados intentos. Esperá un minuto e intentá de nuevo.");
      } else {
        setRegisterError(msg);
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    api.logout();
    setIsAuthenticated(false);
    setSessionExpired(false);
  }, []);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  return {
    isAuthenticated, sessionExpired,
    loginError, registerError, registerSuccess, authLoading,
    handleLogin, handleRegister, handleLogout, dismissSessionExpired,
  };
}
