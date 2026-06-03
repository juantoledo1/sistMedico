import React, { useState } from 'react';
import { UserProfile, UserSettings } from '../types';
import { User, Globe, Moon, Sun, ChevronRight, Check, Star, Trash2, Bell, KeyRound, Eye, EyeOff, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { translations } from '../translations';
import { api } from '../services/api';

interface SettingsViewProps {
  profile: UserProfile;
  settings: UserSettings;
  isAdmin?: boolean;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;

}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  settings,
  isAdmin = false,
  onUpdateProfile,
  onUpdateSettings,
}) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentFocused, setCurrentFocused] = useState(false);

  const t = translations[settings.language];
  const avatars = {
    masc_formal: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=256&h=256&auto=format&fit=crop",
    masc_doctor: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=256&h=256&auto=format&fit=crop",
    masc_scrubs: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=256&h=256&auto=format&fit=crop",
    fem_formal: "https://images.unsplash.com/photo-1584432830680-aa991fbdd858?q=80&w=256&h=256&auto=format&fit=crop",
    fem_doctor: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?q=80&w=256&h=256&auto=format&fit=crop",
    fem_scrubs: "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=256&h=256&auto=format&fit=crop",
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) { setPasswordError('Ingresá tu contraseña actual'); return; }
    if (!newPassword) { setPasswordError('Ingresá una nueva contraseña'); return; }
    if (newPassword.length < 8) { setPasswordError('Mínimo 8 caracteres'); return; }
    if (!/[A-Z]/.test(newPassword)) { setPasswordError('Al menos una mayúscula'); return; }
    if (!/[a-z]/.test(newPassword)) { setPasswordError('Al menos una minúscula'); return; }
    if (!/[0-9]/.test(newPassword)) { setPasswordError('Al menos un número'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Las contraseñas no coinciden'); return; }

    try {
      setChangingPassword(true);
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangePassword(false), 1500);
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'Error al cambiar contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="space-y-1">
        <h1 className={cn("text-3xl font-black tracking-tight leading-none", settings.darkMode ? "text-white" : "text-slate-900")}>{t.ajustes}</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] opacity-60 leading-none">{t.preferencias}</p>
      </header>

      {!isAdmin && (<>
      {/* Avatar Selection */}
      <section className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/30 dark:shadow-none animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className={cn("text-lg font-black tracking-tight", settings.darkMode ? "text-white" : "text-slate-900")}>{t.perfilAvatar}</h2>
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10">
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <img 
                src={avatars[profile.avatar]} 
                className="w-40 h-40 rounded-[2.5rem] border-4 border-white dark:border-slate-700 shadow-2xl object-cover bg-slate-50 dark:bg-slate-900 relative z-10 transition-transform duration-500 group-hover:scale-105" 
                alt="Avatar" 
              />
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg z-20 border-2 border-white dark:border-slate-800">
                <Check className="w-4 h-4" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {(Object.keys(avatars) as Array<keyof typeof avatars>).map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdateProfile({ avatar: type })}
                  className={cn(
                    "w-14 h-14 rounded-2xl border-2 transition-all p-1 shadow-sm",
                    profile.avatar === type 
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 scale-110" 
                      : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={avatars[type]} alt={type} className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{t.nombreCompleto}</label>
                <p className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black tracking-tight">
                  {profile.name}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{t.especialidad}</label>
                <p className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black tracking-tight">
                  {profile.specialty}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowChangePassword(true); setPasswordError(''); setPasswordSuccess(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setCurrentFocused(false); }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200">Cambiar contraseña</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </button>
          </div>
        </div>
      </section>

      </>)}

      {/* Preferences */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/40 dark:shadow-none">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-indigo-600" />
          <h2 className={cn("text-lg font-bold", settings.darkMode ? "text-white" : "text-slate-900")}>{t.preferencias}</h2>
        </div>

        <div className="space-y-4">
          <SettingItem 
            icon={<Globe className="w-5 h-5" />} 
            label={t.idioma} 
            value={settings.language === 'es' ? 'Español' : 'English'} 
            onClick={() => onUpdateSettings({ language: settings.language === 'es' ? 'en' : 'es' })}
          />
          <SettingItem 
            icon={settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} 
            label={t.modoOscuro} 
            value={settings.darkMode ? t.activado : t.desactivado} 
            onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
          />
          <SettingItem 
            icon={<Bell className="w-5 h-5" />} 
            label={t.notificaciones} 
            value={t.proximamente} 
            disabled
          />
        </div>
      </section>

      <div className="text-center pt-4">
        <p className="text-slate-400 text-xs font-medium">MedFlow Pro v1.0.5 • © 2026</p>
      </div>

      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowChangePassword(false)}>
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

            <div className="space-y-4">
              <input type="text" style={{display: 'none'}} autoComplete="off" />
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 mb-1">Contraseña actual</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => { setCurrentPassword(e.target.value); setCurrentFocused(true); }}
                    onFocus={() => setCurrentFocused(true)}
                    readOnly={!currentFocused && currentPassword === ''}
                    autoComplete="off"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none pr-10"
                    placeholder="Tu contraseña actual"
                  />
                  <button
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="off"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none pr-10"
                    placeholder="Mín. 8 caracteres"
                  />
                  <button
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 mb-1">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="off"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none pr-10"
                    placeholder="Repetí la nueva contraseña"
                  />
                  <button
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">{passwordSuccess}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowChangePassword(false)}
                className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Cambiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingItem = ({ icon, label, value, onClick, disabled = false }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full flex items-center justify-between p-4 rounded-2xl transition-all overflow-hidden",
      disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-900 group"
    )}
  >
    <div className="flex items-center gap-4 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
        {icon}
      </div>
      <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{value}</span>
      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
    </div>
  </button>
);
