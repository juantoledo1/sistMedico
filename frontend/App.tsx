import React, { useState, useEffect } from "react";
import {
  Transaction,
  PaymentStatus,
  ShiftType,
  UserProfile,
  UserSettings,
  ActivityType,
  Institution,
} from "./types";
import { api } from "./services/api";
import { GeminiService } from "./services/gemini";
import { Dashboard } from "./components/Dashboard";
import { ShiftForm } from "./components/ShiftForm";
import { SettingsView } from "./components/SettingsView";
import { CalendarView } from "./components/CalendarView";
import { ReportsView } from "./components/ReportsView";
import { StatsView } from "./components/StatsView";
import { LoginView } from "./components/LoginView";
import { RegisterView } from "./components/RegisterView";
import { LoadingView } from "./components/LoadingView";
import { AdminView } from "./components/AdminView";
import {
  LayoutGrid,
  Calendar,
  Settings,
  Plus,
  Bell,
  Sparkles,
  LogOut,
  BarChart3,
  Eye,
  EyeOff,
  Shield,
  Clock,
} from "lucide-react";
import { cn } from "./lib/utils";

import { translations } from "./translations";

type ViewState =
  | "inicio"
  | "turnos"
  | "perfil"
  | "reportes"
  | "stats"
  | "admin"
  | "login"
  | "registro";

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>("inicio");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>();
  const [insight, setInsight] = useState<string>("Analizando tus finanzas...");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

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
  const [registerError, setRegisterError] = useState<string>("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener('sessionExpired', handler);
    return () => window.removeEventListener('sessionExpired', handler);
  }, []);

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
          try { await api.createActividad({ type: a.type as any, institution: a.institution, date: a.date, amount: a.amount, notes: a.notes, hours: a.hours }); } 
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
          startTime: a.start_time || undefined,
          endTime: a.end_time || undefined,
          endDate: a.end_date || undefined,
          shiftSubtype: a.shift_subtype || undefined,
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
          startTime: a.start_time || undefined,
          endTime: a.end_time || undefined,
          endDate: a.end_date || undefined,
          shiftSubtype: a.shift_subtype || undefined,
        }));
        setTransactions(txFromApi);
      }

      try {
        const userProfile = await api.getProfile();
        setProfile({
          name: userProfile.full_name || "Dr. Usuario",
          specialty: userProfile.specialty || "Medicina",
          institution: userProfile.institution || "",
          avatar: userProfile.avatar || "masc_doctor",
        });
        setIsAdmin(userProfile.is_admin || false);
        if (userProfile.is_admin) setActiveView("admin");
      } catch (e) {
        console.log("No se pudo obtener perfil");
      }

      try {
        const inst = await api.getInstitutions();
        setInstitutions(inst.filter(i => i.is_active));
      } catch (e) {
        console.log("No se pudieron cargar instituciones");
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

  const handleRegister = async (data: {
    email: string;
    password: string;
    password_confirm: string;
    full_name: string;
    specialty?: string;
    institution?: string;
    phone?: string;
  }) => {
    setRegisterError("");
    setIsLoading(true);
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
          hourly_rate: newTx.hourlyRate || undefined,
          notes: newTx.notes,
          status: newTx.status,
          start_time: newTx.startTime,
          end_time: newTx.endTime,
          end_date: newTx.endDate,
          shift_subtype: newTx.shiftSubtype,
        });
        setTransactions(
          prev => prev.map((tx) =>
            tx.id === editingTransaction.id
              ? ({
                  ...tx,
                  institution: updated.institution,
                  date: updated.date,
                  amount: updated.amount,
                  notes: updated.notes,
                  status: updated.status,
                  startTime: updated.start_time || undefined,
                  endTime: updated.end_time || undefined,
                  endDate: updated.end_date || undefined,
                  shiftSubtype: updated.shift_subtype || undefined,
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
          hourly_rate: newTx.hourlyRate || undefined,
          notes: newTx.notes,
          shift_subtype: newTx.shiftSubtype,
          start_time: newTx.startTime,
          end_time: newTx.endTime,
          end_date: newTx.endDate,
          procedure_name: newTx.procedureName,
          quantity: newTx.quantity,
          unit_value: newTx.unitValue,
          specialty: newTx.specialty,
        });
        const tx: Transaction = {
          id: created._id,
          institution: created.institution,
          type: newTx.type || ShiftType.ACTIVE,
          date: created.date,
          endDate: created.end_date || undefined,
          startTime: created.start_time || undefined,
          endTime: created.end_time || undefined,
          amount: created.amount,
          status: PaymentStatus.PENDING,
          notes: created.notes,
          duration: created.hours,
          location: created.institution,
          shiftSubtype: created.shift_subtype || undefined,
        };
        setTransactions(prev => [tx, ...prev]);
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error al guardar: " + (error instanceof Error ? error.message : "Error desconocido"));
    }

  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteActividad(id);
      setTransactions(prev => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleInstitutionChange = (inst: Institution) => {
    setInstitutions(prev => {
      const exists = prev.find(i => i.id === inst.id);
      if (exists) return prev.map(i => i.id === inst.id ? inst : i);
      return [inst, ...prev];
    });
  };

  const handleInstitutionDelete = (id: string) => {
    setInstitutions(prev => prev.filter(i => i.id !== id));
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
  ) => {
    setEditingTransaction(tx || null);
    setPrefilledDate(date);
    setIsFormOpen(true);
  };

const t = translations[settings.language];

  if (!isAuthenticated) {
    if (activeView === "registro") {
      return (
        <RegisterView
          onRegister={handleRegister}
          onBackToLogin={() => { setActiveView("login"); setRegisterError(""); setRegisterSuccess(false); }}
          error={registerError}
          isLoading={isLoading}
          settings={settings}
          successMessage={registerSuccess ? "ok" : undefined}
        />
      );
    }
    return (
      <LoginView 
        onLogin={handleLogin} 
        loginError={loginError}
        isLoading={isLoading}
        settings={settings}
        onNavigateToRegister={() => setActiveView("registro")}
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
              label={t.guardias || "Guardias"}
              icon={<Calendar className="w-5 h-5" />}
            />
            <NavButton
              active={activeView === "stats"}
              onClick={() => setActiveView("stats")}
              label="Estadísticas"
              icon={<BarChart3 className="w-5 h-5" />}
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
              onOpenForm={(date, tx) => openForm(date, tx)}
              onEdit={(tx) => openForm(undefined, tx)}
              onDelete={handleDeleteTransaction}
              onUpdate={handleUpdateTransaction}
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
          {activeView === "perfil" && (
            <SettingsView
              profile={profile}
              settings={settings}
              isAdmin={isAdmin}
              onUpdateProfile={async (p) => {
                setProfile({ ...profile, ...p });
                try { await api.updateProfile(p); } catch {}
              }}
              onUpdateSettings={(s) => setSettings({ ...settings, ...s })}
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
        {["inicio", "turnos"].includes(activeView) && (
          <div className="lg:hidden fixed bottom-28 right-6 z-40">
            <button
              onClick={() => openForm()}
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
              active={activeView === "perfil"}
              onClick={() => setActiveView("perfil")}
              label={t.ajustes}
              icon={<Settings className="w-5 h-5" />}
            />
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 px-3 py-2 text-[9px] font-bold text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Salir</span>
            </button>
          </div>
        </nav>
      </main>

      {/* Entry Modal */}
      {isFormOpen && (
        <ShiftForm
          onClose={() => {
            setIsFormOpen(false);
            setPrefilledDate(undefined);
            setEditingTransaction(null);
          }}
          onSubmit={handleAddTransaction}
          initialDate={prefilledDate}
          editingTransaction={editingTransaction || undefined}
          transactions={transactions}
          settings={settings}
          institutions={institutions}
          onInstitutionChange={handleInstitutionChange}
          onInstitutionDelete={handleInstitutionDelete}
        />
      )}

      {/* Session Expired Modal */}
      {sessionExpired && (
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
              onClick={() => { handleLogout(); setSessionExpired(false); }}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
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
