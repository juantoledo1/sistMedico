import { translations, Language } from '../translations';

interface LoadingViewProps {
  settings: { language: Language; darkMode: boolean; currency: string };
}

export function LoadingView({ settings }: LoadingViewProps) {
  const t = translations[settings.language];
  
  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/login-bg.webp)' }}
      />
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="text-center relative z-10">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white font-medium">{t.cargando}</p>
      </div>
    </div>
  );
}