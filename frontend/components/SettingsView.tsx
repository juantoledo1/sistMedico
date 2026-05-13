import React from 'react';
import { UserProfile, UserSettings } from '../types';
import { User, Globe, Moon, Sun, ChevronRight, Check, Star, Trash2, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { translations } from '../translations';

interface SettingsViewProps {
  profile: UserProfile;
  settings: UserSettings;
  isAdmin?: boolean;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onDeleteFavorite: (inst: string) => void;
  favorites: string[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  settings,
  isAdmin = false,
  onUpdateProfile,
  onUpdateSettings,
  onDeleteFavorite,
  favorites
}) => {
  const t = translations[settings.language];
  const avatars = {
    masc_formal: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=256&h=256&auto=format&fit=crop",
    masc_doctor: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=256&h=256&auto=format&fit=crop",
    masc_scrubs: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=256&h=256&auto=format&fit=crop",
    fem_formal: "https://images.unsplash.com/photo-1584432830680-aa991fbdd858?q=80&w=256&h=256&auto=format&fit=crop",
    fem_doctor: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?q=80&w=256&h=256&auto=format&fit=crop",
    fem_scrubs: "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=256&h=256&auto=format&fit=crop",
  };

  return (
    <div className="p-4 lg:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{t.ajustes}</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] opacity-60 leading-none">{t.preferencias}</p>
      </header>

      {!isAdmin && (<>
      {/* Avatar Selection */}
      <section className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/30 dark:shadow-none animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{t.perfilAvatar}</h2>
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
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black tracking-tight focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none"
                  placeholder="Ej. Dr. García"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{t.especialidad}</label>
                <input 
                  type="text" 
                  value={profile.specialty}
                  onChange={(e) => onUpdateProfile({ specialty: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black tracking-tight focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none"
                  placeholder="Ej. Cardiología"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">INSTITUCIÓN PRINCIPAL</label>
              <input 
                type="text" 
                value={profile.institution}
                onChange={(e) => onUpdateProfile({ institution: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black tracking-tight focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none"
                placeholder="Ej. Hospital Central"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Persistence Management */}
      <section className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/30 dark:shadow-none">
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{t.instFavoritas}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {favorites.map(fav => (
            <div key={fav} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl group border border-transparent hover:border-blue-100 dark:hover:border-blue-900 transition-all">
              <span className="font-bold text-slate-700 dark:text-slate-200">{fav}</span>
              <button 
                onClick={() => onDeleteFavorite(fav)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {favorites.length === 0 && (
            <p className="text-sm text-slate-400 font-medium p-4 italic">No hay instituciones favoritas aún.</p>
          )}
        </div>
      </section>
      </>)}

      {/* Preferences */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/40 dark:shadow-none">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.preferencias}</h2>
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
    </div>
  );
};

const SettingItem = ({ icon, label, value, onClick, disabled = false }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full flex items-center justify-between p-4 rounded-2xl transition-all",
      disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-900 group"
    )}
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <span className="font-bold text-slate-700 dark:text-slate-200">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">{value}</span>
      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
    </div>
  </button>
);
