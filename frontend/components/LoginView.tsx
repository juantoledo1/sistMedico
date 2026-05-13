import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { translations, Language } from '../translations';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  loginError: string;
  isLoading: boolean;
  settings: { language: Language; darkMode: boolean; currency: string };
  onNavigateToRegister?: () => void;
}

export function LoginView({ onLogin, loginError, isLoading, settings, onNavigateToRegister }: LoginViewProps) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const t = translations[settings.language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(loginForm.email, loginForm.password);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/login-bg.webp)' }}
      />
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-3 mb-10 px-2 justify-center">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="font-black text-2xl tracking-tighter block leading-none text-white">
              MedFlow
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">
              Pro Edition
            </span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-2xl font-bold mb-2 text-center text-slate-800">
            {t.bienvenido}
          </h1>
          <p className="text-slate-600 text-center mb-8">{t.iniciarSesion}</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {t.email || "Email"}
              </label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white text-lg"
                placeholder="doctor@hospital.com"
                autoComplete="email"
                style={{ minHeight: '56px' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {t.contrasena || "Contraseña"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  className="w-full px-4 py-4 pr-12 rounded-xl border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white text-lg"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ minHeight: '56px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isLoading ? t.cargando : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {t.noTienesCuenta}{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-blue-600 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              {t.registrate}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}