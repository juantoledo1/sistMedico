import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Check, X, ArrowLeft } from 'lucide-react';
import { translations, Language } from '../translations';

interface RegisterViewProps {
  onRegister: (data: {
    email: string;
    password: string;
    password_confirm: string;
    full_name: string;
    specialty?: string;
    institution?: string;
    phone?: string;
  }) => Promise<void>;
  onBackToLogin: () => void;
  error: string;
  isLoading: boolean;
  settings: { language: Language; darkMode: boolean; currency: string };
  successMessage?: string;
}

type FieldErrors = {
  email?: string;
  full_name?: string;
  password?: string;
  password_confirm?: string;
};

export function RegisterView({ onRegister, onBackToLogin, error, isLoading, settings, successMessage }: RegisterViewProps) {
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    specialty: '',
    institution: '',
    phone: '',
    password: '',
    password_confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const t = translations[settings.language];

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'email':
        if (!value) return undefined;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : t.emailInvalido;
      case 'full_name':
        if (!value) return undefined;
        return value.length >= 2 ? undefined : t.nombreRequerido;
      case 'password':
        if (!value) return undefined;
        if (value.length < 8) return t.requisitoLongitud;
        if (!/[A-Z]/.test(value)) return t.requisitoMayuscula;
        if (!/[a-z]/.test(value)) return t.requisitoMinuscula;
        if (!/[0-9]/.test(value)) return t.requisitoNumero;
        return undefined;
      case 'password_confirm':
        if (!value) return undefined;
        return value === form.password ? undefined : t.contrasenasNoCoinciden;
      default:
        return undefined;
    }
  };

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
    if (name === 'password' && touched.password_confirm) {
      const pc = name === 'password_confirm' ? value : form.password_confirm;
      setFieldErrors(prev => ({ ...prev, password_confirm: form.password_confirm ? (pc === (name === 'password' ? value : form.password) ? undefined : t.contrasenasNoCoinciden) : undefined }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, form[name as keyof typeof form]) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t.emailInvalido;
    if (form.full_name.length < 2) errors.full_name = t.nombreRequerido;
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errors.password = t.contrasenaDebil;
    }
    if (form.password !== form.password_confirm) errors.password_confirm = t.contrasenasNoCoinciden;
    setFieldErrors(errors);
    setTouched({ email: true, full_name: true, password: true, password_confirm: true });
    if (Object.keys(errors).length > 0) return;
    await onRegister(form);
  };

  const passwordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { score, label: 'Débil', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Media', color: 'bg-yellow-500' };
    return { score, label: 'Fuerte', color: 'bg-green-500' };
  };

  const strength = passwordStrength(form.password);

  const inputClass = (name: string) =>
    `w-full px-4 py-4 rounded-xl border-2 outline-none transition-all bg-white text-lg font-medium ${
      touched[name] && fieldErrors[name as keyof FieldErrors]
        ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
        : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
    }`;

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
          {successMessage ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t.registroExitoso}</h2>
              <p className="text-slate-600 mb-6">{t.cuentaCreada}</p>
              <button
                onClick={onBackToLogin}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.iniciarSesionBtn}
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center text-slate-800">
                {t.crearCuenta}
              </h1>
              <p className="text-slate-600 text-center mb-8">{t.registrate}</p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {t.nombreCompleto} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    onBlur={() => handleBlur('full_name')}
                    className={inputClass('full_name')}
                    placeholder="Dr. Juan Pérez"
                    autoComplete="name"
                    style={{ minHeight: '56px' }}
                    required
                  />
                  {touched.full_name && fieldErrors.full_name && (
                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" /> {fieldErrors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {t.email} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={inputClass('email')}
                    placeholder="doctor@hospital.com"
                    autoComplete="email"
                    style={{ minHeight: '56px' }}
                    required
                  />
                  {touched.email && fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" /> {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {t.especialidad}
                    </label>
                    <input
                      type="text"
                      value={form.specialty}
                      onChange={(e) => handleChange('specialty', e.target.value)}
                      className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white text-lg font-medium"
                      placeholder="Cardiología"
                      style={{ minHeight: '56px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {t.telefono}
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white text-lg font-medium"
                      placeholder="+54 11 1234-5678"
                      style={{ minHeight: '56px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {t.institucion}
                  </label>
                  <input
                    type="text"
                    value={form.institution}
                    onChange={(e) => handleChange('institution', e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white text-lg font-medium"
                    placeholder="Hospital Italiano"
                    style={{ minHeight: '56px' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {t.contrasena} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      className={inputClass('password')}
                      placeholder="••••••••"
                      autoComplete="new-password"
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
                  {form.password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        <div className={`h-1.5 flex-1 rounded-full ${form.password.length >= 8 ? strength.color : 'bg-slate-200'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${/[A-Z]/.test(form.password) ? strength.color : 'bg-slate-200'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${/[a-z]/.test(form.password) ? strength.color : 'bg-slate-200'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${/[0-9]/.test(form.password) ? strength.color : 'bg-slate-200'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${/[^A-Za-z0-9]/.test(form.password) ? strength.color : 'bg-slate-200'}`} />
                      </div>
                      <p className={`text-xs font-medium ${form.password.length >= 8 && /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) && /[0-9]/.test(form.password) ? 'text-green-600' : 'text-slate-400'}`}>
                        {strength.label === 'Fuerte' ? '✓ Contraseña segura' : 'Requisitos: ' + [form.password.length < 8 && '8+ caracteres', !/[A-Z]/.test(form.password) && 'mayúscula', !/[a-z]/.test(form.password) && 'minúscula', !/[0-9]/.test(form.password) && 'número'].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  {touched.password && fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" /> {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {t.confirmarContrasena} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.password_confirm}
                      onChange={(e) => handleChange('password_confirm', e.target.value)}
                      onBlur={() => handleBlur('password_confirm')}
                      className={inputClass('password_confirm')}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={{ minHeight: '56px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {touched.password_confirm && fieldErrors.password_confirm && (
                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" /> {fieldErrors.password_confirm}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t.cargando : t.crearCuenta}
                </button>
              </form>

              <p className="text-center text-slate-400 text-sm mt-6">
                {t.yaTienesCuenta}{' '}
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-blue-600 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  {t.iniciarSesionBtn}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
