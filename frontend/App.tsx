import React, { useState, useEffect } from "react";
import {
  Transaction,
  PaymentStatus,
  ShiftType,
  UserProfile,
  UserSettings,
  ActivityType,
} from "./types";
import { api } from "./services/api";
import { GeminiService } from "./services/gemini";
import { Dashboard } from "./components/Dashboard";
import { IncomeHistory } from "./components/IncomeHistory";
import { ShiftForm } from "./components/ShiftForm";
import { SettingsView } from "./components/SettingsView";
import { CalendarView } from "./components/CalendarView";
import { ReportsView } from "./components/ReportsView";
import { StatsView } from "./components/StatsView";
import { LoginView } from "./components/LoginView";
import { LoadingView } from "./components/LoadingView";
import { AdminView } from "./components/AdminView";
import {
  LayoutGrid,
  Calendar,
  Wallet,
  Settings,
  Plus,
  Bell,
  Sparkles,
  Stethoscope,
  UserCheck,
  LogOut,
  BarChart3,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { cn } from "./lib/utils";

import { translations } from "./translations";

type ViewState =
  | "inicio"
  | "turnos"
  | "finanzas"
  | "perfil"
  | "reportes"
  | "stats"
  | "admin"
  | "login";

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>("inicio");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>();
  const [insight, setInsight] = useState<string>("Analizando tus finanzas...");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [favorites, setFavorites] = useState<string[]>([
    "Hospital Italiano",
    "Sanatorio Güemes",
    "Clínica Olivos",
    "H. Británico",
  ]);
  const [defaultFormType, setDefaultFormType] = useState<
    "guardia" | "procedimiento" | "interconsulta"
  >("guardia");

  const [profile, setProfile] = useState<UserProfile>({
    name: "Dr. Rodriguez",
    specialty: "Cardiología",
    institution: "Hospital Italiano",
    avatar: "masc_doctor",
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("access_token"),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string>("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const actividades = await api.getActividades();
      
      // DEV MODE: Si no hay actividades, agregar datos de ejemplo para testing UI
      const DEV_MODE = import.meta.env.DEV_MODE || localStorage.getItem('dev_mode_seeded');
      if (actividades.length === 0 && DEV_MODE !== 'true') {
        console.log("⚠️ Modo desarrollo: Cargando datos de ejemplo...");
        const mockData = [
          { type: "guardia", institution: "Hospital Italiano", date: "2026-05-01", amount: 25000, status: "pagado", notes: "Guardia de 12hs", hours: 12 },
          { type: "guardia", institution: "Sanatorio Güemes", date: "2026-05-03", amount: 20000, status: "pagado", notes: "Guardia de 12hs", hours: 12 },
          { type: "procedimiento", institution: "Clínica Olivos", date: "2026-05-05", amount: 15000, status: "pendiente", notes: "Cateterismo diagnóstico", hours: 2 },
          { type: "interconsulta", institution: "H. Británico", date: "2026-05-07", amount: 18000, status: "pagado", notes: "Interconsulta cardiology", hours: 1 },
          { type: "guardia", institution: "Hospital Italiano", date: "2026-04-28", amount: 25000, status: "pagado", notes: "Guardia de 12hs", hours: 12 },
          { type: "procedimiento", institution: "Clínica Olivos", date: "2026-04-25", amount: 22000, status: "pagado", notes: "Angioplastia", hours: 3 },
          { type: "interconsulta", institution: "Sanatorio Güemes", date: "2026-04-22", amount: 12000, status: "pendiente", notes: "Interconsulta neumonología", hours: 1 },
          { type: "guardia", institution: "H. Británico", date: "2026-04-15", amount: 20000, status: "pagado", notes: "Guardia de 12hs", hours: 12 },
        ];
        for (const a of mockData) {
          try { await api.createActividad({ type: a.type as any, institution: a.institution, date: a.date, amount: a.amount, status: a.status as any, notes: a.notes, hours: a.hours }); } 
          catch (e) { /* ignorar */ }
        }
        localStorage.setItem('dev_mode_seeded', 'true');
        const recreated = await api.getActividades();
        const txFromApi = recreated.map((a: any) => ({
          id: a._id, institution: a.institution,
          type: a.type === "guardia" ? ShiftType.ACTIVE : a.type === "procedimiento" ? ShiftType.CONSULTATION : ShiftType.PASSIVE,
          date: a.date, amount: a.amount,
          status: a.status === "pagado" ? PaymentStatus.PAID : PaymentStatus.PENDING,
          notes: a.notes, duration: a.hours, location: a.institution,
        }));
        setTransactions(txFromApi);
        console.log("✅ DATOS EJEMPLO CREADOS:", txFromApi.length);
      } else {
        const txFromApi = actividades.map((a: any) => ({
          id: a._id, institution: a.institution,
          type: a.type === "guardia" ? ShiftType.ACTIVE : a.type === "procedimiento" ? ShiftType.CONSULTATION : ShiftType.PASSIVE,
          date: a.date, amount: a.amount,
          status: a.status === "pagado" ? PaymentStatus.PAID : PaymentStatus.PENDING,
          notes: a.notes, duration: a.hours, location: a.institution,
        }));
        setTransactions(txFromApi);
      }

      try {
        const userProfile = await api.getProfile();
        setProfile({
          name: userProfile.full_name || "Dr. Usuario",
          specialty: userProfile.specialty || "Medicina",
          institution: userProfile.institution || "",
          avatar: "neutral",
        });
        setIsAdmin(userProfile.is_admin || false);
        if (userProfile.is_admin) setActiveView("admin");
      } catch (e) {
        console.log("No se pudo obtener perfil");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error instanceof Error && error.message.includes("401")) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setLoginError("");
    setIsLoading(true);
    try {
      await api.login(email, password);
      setIsAuthenticated(true);
      setActiveView("inicio");
      setIsAdmin(false);
      fetchData(); // Cargar datos después de login exitoso
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Error al iniciar sesión",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setTransactions([]);
    setActiveView("login");
    setLoginForm({ email: "", password: "" });
  };

  const [settings, setSettings] = useState<UserSettings>({
    language: "es",
    darkMode: false,
    currency: "ARS",
  });

  const gemini = GeminiService.getInstance();

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const text = await gemini.getFinancialInsight(transactions);
        setInsight(text);
      } catch (e) {
        setInsight(
          "Optimiza tus turnos para aumentar un 15% tus ingresos el próximo mes.",
        );
      }
    };
    fetchInsight();
  }, [transactions]);

  const handleAddTransaction = async (newTx: Partial<Transaction>) => {
    try {
      if (editingTransaction) {
        const updated = await api.updateActividad(editingTransaction.id, {
          type:
            newTx.type === ShiftType.ACTIVE
              ? "guardia"
              : newTx.type === ShiftType.CONSULTATION
                ? "procedimiento"
                : "interconsulta",
          institution: newTx.institution,
          date: newTx.date,
          amount: newTx.amount,
          hours: newTx.duration,
          hourly_rate:
            newTx.amount && newTx.duration
              ? Math.round(newTx.amount / newTx.duration)
              : undefined,
          notes: newTx.notes,
        });
        setTransactions(
          transactions.map((tx) =>
            tx.id === editingTransaction.id
              ? ({
                  ...tx,
                  institution: updated.institution,
                  date: updated.date,
                  amount: updated.amount,
                  notes: updated.notes,
                } as Transaction)
              : tx,
          ),
        );
      } else {
        const created = await api.createActividad({
          type:
            newTx.type === ShiftType.ACTIVE
              ? "guardia"
              : newTx.type === ShiftType.CONSULTATION
                ? "procedimiento"
                : "interconsulta",
          institution: newTx.institution || "Nueva Institución",
          date: newTx.date || new Date().toISOString().split("T")[0],
          amount: newTx.amount || 0,
          hours: newTx.duration,
          hourly_rate:
            newTx.amount && newTx.duration
              ? Math.round(newTx.amount / newTx.duration)
              : undefined,
          notes: newTx.notes,
        });
        const tx: Transaction = {
          id: created._id,
          institution: created.institution,
          type: newTx.type || ShiftType.ACTIVE,
          date: created.date,
          amount: created.amount,
          status: PaymentStatus.PENDING,
          notes: created.notes,
          duration: created.hours,
          location: created.institution,
        };
        setTransactions([tx, ...transactions]);

        if (newTx.institution && !favorites.includes(newTx.institution)) {
          setFavorites([newTx.institution, ...favorites].slice(0, 6));
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
    }

    setIsFormOpen(false);
    setPrefilledDate(undefined);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteActividad(id);
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleUpdateTransaction = async (
    id: string,
    updates: Partial<Transaction>,
  ) => {
    try {
      const updated = await api.updateActividad(id, updates);
      setTransactions(
        transactions.map((tx) =>
          tx.id === id ? ({ ...tx, ...updates } as Transaction) : tx,
        ),
      );
    } catch (error) {
      console.error("Error updating:", error);
    }
  };

  const openForm = (
    date?: string,
    tx?: Transaction,
    type?: "guardia" | "procedimiento" | "interconsulta",
  ) => {
    setEditingTransaction(tx || null);
    setPrefilledDate(date);
    if (type) setDefaultFormType(type);
    setIsFormOpen(true);
  };

const t = translations[settings.language];

  if (!isAuthenticated) {
    return (
      <LoginView 
        onLogin={handleLogin} 
        loginError={loginError}
        isLoading={isLoading}
        settings={settings}
      />
    );
  }

if (isLoading) {
    return <LoadingView settings={settings} />;
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans flex flex-col lg:flex-row transition-colors duration-300",
        settings.darkMode && "bg-[#0F172A] text-slate-100 dark",
      )}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col p-6 sticky top-0 h-screen transition-colors duration-300 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tighter block leading-none">
              MedFlow
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">
              Pro Edition
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          {isAdmin ? (<>
            <NavButton
              active={activeView === "admin"}
              onClick={() => setActiveView("admin")}
              label="Admin"
              icon={<Shield className="w-5 h-5" />}
            />
            <NavButton
              active={activeView === "perfil"}
              onClick={() => setActiveView("perfil")}
              label={t.ajustes}
              icon={<Settings className="w-5 h-5" />}
            />
          </>) : (<>
            <NavButton
              active={activeView === "inicio"}
              onClick={() => setActiveView("inicio")}
              label={t.inicio}
              icon={<LayoutGrid className="w-5 h-5" />}
            />
            <NavButton
              active={activeView === "reportes"}
              onClick={() => setActiveView("reportes")}
              label={t.reportes || "Reportes"}
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <NavButton
              active={activeView === "stats"}
              onClick={() => setActiveView("stats")}
              label="Estadísticas"
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <NavButton
              active={activeView === "finanzas"}
              onClick={() => setActiveView("finanzas")}
              label={t.finanzas}
              icon={<Wallet className="w-5 h-5" />}
            />
            <NavButton
              active={activeView === "perfil"}
              onClick={() => setActiveView("perfil")}
              label={t.ajustes}
              icon={<Settings className="w-5 h-5" />}
            />
          </>)}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-slate-400 hover:text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="tracking-tight">Salir</span>
          </button>
        </nav>

        <div className="mt-auto p-5 bg-slate-50 border border-slate-100 rounded-2xl dark:bg-slate-800/50 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
              Smart Insight
            </p>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium dark:text-slate-400">
            "{insight}"
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative pb-32 lg:pb-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {activeView === "inicio" && (
            <Dashboard
              transactions={transactions}
              insight={insight}
              onOpenForm={() => openForm()}
              onViewReports={() => setActiveView("reportes")}
              userProfile={profile}
              settings={settings}
            />
          )}
          {activeView === "reportes" && (
            <ReportsView
              transactions={transactions}
              settings={settings}
              onBack={() => setActiveView("inicio")}
            />
          )}
          {activeView === "stats" && (
            <StatsView
              settings={settings}
              onBack={() => setActiveView("inicio")}
            />
          )}
          {activeView === "turnos" && (
            <CalendarView
              transactions={transactions}
              onOpenForm={openForm}
              onDelete={handleDeleteTransaction}
              settings={settings}
            />
          )}
          {activeView === "finanzas" && (
            <IncomeHistory
              transactions={transactions}
              onOpenForm={() => openForm()}
              onEdit={(tx) => openForm(undefined, tx)}
              onDelete={handleDeleteTransaction}
              onUpdate={handleUpdateTransaction}
              settings={settings}
            />
          )}
          {activeView === "perfil" && (
            <SettingsView
              profile={profile}
              settings={settings}
              onUpdateProfile={(p) => setProfile({ ...profile, ...p })}
              onUpdateSettings={(s) => setSettings({ ...settings, ...s })}
              onDeleteFavorite={(inst) =>
                setFavorites(favorites.filter((f) => f !== inst))
              }
              favorites={favorites}
            />
          )}
          {activeView === "admin" && (
            <AdminView
              settings={settings}
              onBack={() => setActiveView("inicio")}
            />
          )}
        </div>

        {/* Mobile Quick Add Buttons */}
        {["inicio", "turnos", "finanzas"].includes(activeView) && (
          <div className="lg:hidden fixed bottom-28 right-6 z-40 flex gap-2">
            <button
              onClick={() => openForm(undefined, undefined, "procedimiento")}
              className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg"
              title="Procedimiento"
            >
              <Stethoscope className="w-5 h-5" />
            </button>
            <button
              onClick={() => openForm(undefined, undefined, "interconsulta")}
              className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg"
              title="Interconsulta"
            >
              <UserCheck className="w-5 h-5" />
            </button>
            <button
              onClick={() => openForm(undefined, undefined, "guardia")}
              className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl"
            >
              <Plus className="w-8 h-8 contrast-150" />
            </button>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800 rounded-[2.5rem] h-16 flex items-center justify-around shadow-2xl shadow-slate-200/50 dark:shadow-none">
            <MobileTab
              active={activeView === "inicio"}
              onClick={() => setActiveView("inicio")}
              label={t.inicio}
              icon={<LayoutGrid className="w-5 h-5" />}
            />
            <MobileTab
              active={activeView === "turnos"}
              onClick={() => setActiveView("turnos")}
              label={t.turnos}
              icon={<Calendar className="w-5 h-5" />}
            />
            <MobileTab
              active={activeView === "finanzas"}
              onClick={() => setActiveView("finanzas")}
              label={t.finanzas}
              icon={<Wallet className="w-5 h-5" />}
            />
            <MobileTab
              active={activeView === "perfil"}
              onClick={() => setActiveView("perfil")}
              label={t.ajustes}
              icon={<Settings className="w-5 h-5" />}
            />
          </div>
        </nav>
      </main>

      {/* Entry Modal */}
      {isFormOpen && (
        <ShiftForm
          onClose={() => {
            setIsFormOpen(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleAddTransaction}
          initialDate={prefilledDate}
          editingTransaction={editingTransaction || undefined}
          favorites={favorites}
          settings={settings}
          defaultType={defaultFormType}
        />
      )}
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const NavButton = ({ active, label, icon, onClick }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold",
      active
        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-1"
        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800",
    )}
  >
    {icon}
    <span className="tracking-tight">{label}</span>
  </button>
);

const MobileTab = ({ active, label, icon, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1.5 transition-all duration-300",
      active
        ? "text-blue-600 dark:text-blue-400 scale-110"
        : "text-slate-400 dark:text-slate-500",
    )}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-[0.1em]">
      {label}
    </span>
  </button>
);

export default App;
