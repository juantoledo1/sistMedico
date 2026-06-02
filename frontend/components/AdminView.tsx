import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { UserSettings } from "../types";
import { ArrowLeft, Search, Loader2, AlertTriangle, Shield, Mail, Phone, Trash2, Eye, EyeOff, KeyRound, Check, Copy } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  specialty: string | null;
  institution: string | null;
  phone: string | null;
  status: string;
  is_active: boolean;
  is_admin: boolean;
  is_deleted: boolean;
  created_at: string | null;
}

interface AdminViewProps {
  settings: UserSettings;
  onBack: () => void;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  suspended: "bg-yellow-100 text-yellow-700 border-yellow-200",
  deleted: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
  deleted: "Eliminado",
};

export const AdminView: React.FC<AdminViewProps> = ({ settings, onBack }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordUserName, setPasswordUserName] = useState("");
  const [passwordUserEmail, setPasswordUserEmail] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await api.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading users:", e);
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      setToggling(userId);
      await api.toggleUserActive(userId, !currentActive);
      setUsers(users.map(u =>
        u.id === userId ? {
          ...u,
          is_active: !currentActive,
          status: !currentActive ? "active" : "suspended"
        } : u
      ));
    } catch (e) {
      console.error("Error toggling:", e);
      alert(e instanceof Error ? e.message : "Error al cambiar estado");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario? Los datos se conservarán pero no podrá acceder.")) return;
    try {
      setDeleting(userId);
      await api.deleteUser(userId);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_deleted: true, is_active: false, status: "deleted" } : u
      ));
    } catch (e) {
      console.error("Error deleting:", e);
      alert(e instanceof Error ? e.message : "Error al eliminar usuario");
    } finally {
      setDeleting(null);
    }
  };

  const handleResetPassword = (user: AdminUser) => {
    setConfirmData({ id: user.id, name: user.full_name || user.email, email: user.email });
    setShowConfirmModal(true);
  };

  const executeResetPassword = async () => {
    if (!confirmData) return;
    setShowConfirmModal(false);
    try {
      setResetting(confirmData.id);
      const result = await api.resetPassword(confirmData.id);
      setGeneratedPassword(result.new_password);
      setPasswordUserName(confirmData.name);
      setPasswordUserEmail(confirmData.email);
      setPasswordCopied(false);
      setShowPasswordModal(true);
    } catch (e) {
      console.error("Error resetting password:", e);
      alert(e instanceof Error ? e.message : "Error al resetear contraseña");
    } finally {
      setResetting(null);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
    } catch {
      const el = document.createElement('textarea');
      el.value = generatedPassword;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setPasswordCopied(true);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter === "active") return u.status === "active" && !u.is_deleted;
    if (filter === "inactive") return u.status === "inactive" && !u.is_deleted;
    if (filter === "suspended") return u.status === "suspended" && !u.is_deleted;
    if (filter === "deleted") return u.is_deleted;
    return !u.is_admin;
  }).filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (u.email?.toLowerCase() || "").includes(q) ||
           (u.full_name?.toLowerCase() || "").includes(q) ||
           (u.phone || "").includes(q);
  });

  const filterButtons = [
    { key: "all", label: "Todos", count: users.filter(u => !u.is_admin && !u.is_deleted).length },
    { key: "active", label: "Activos", count: users.filter(u => u.status === "active" && !u.is_deleted).length },
    { key: "inactive", label: "Inactivos", count: users.filter(u => u.status === "inactive" && !u.is_deleted).length },
    { key: "suspended", label: "Suspendidos", count: users.filter(u => u.status === "suspended" && !u.is_deleted).length },
    { key: "deleted", label: "Eliminados", count: users.filter(u => u.is_deleted).length },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">
              Panel de Administración
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestión de médicos y suscripciones
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Search + Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por email, nombre o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === btn.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              {btn.label}
              <span className={`ml-2 text-xs ${filter === btn.key ? "text-white/80" : "text-slate-400"}`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            {search ? "No se encontraron usuarios con ese criterio" : "No hay usuarios en esta categoría"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Usuario</th>
                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Contacto</th>
                <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Estado</th>
                <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900">{user.full_name || "Sin nombre"}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{isAdminText(user)}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-600">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-slate-600">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[user.status] || statusColors.inactive}`}>
                      {getStatusIcon(user.status)}
                      {statusLabels[user.status] || user.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {user.is_deleted ? (
                        <span className="text-xs text-slate-400 italic">Sin acceso</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            disabled={toggling === user.id}
                            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                              user.is_active
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            } disabled:opacity-50`}
                          >
                            {toggling === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.is_active ? (
                              "Suspender"
                            ) : (
                              "Activar"
                            )}
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            disabled={resetting === user.id}
                            className="p-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all disabled:opacity-50"
                            title="Resetear contraseña"
                          >
                            {resetting === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deleting === user.id}
                            className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                            title="Eliminar (soft delete)"
                          >
                            {deleting === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showConfirmModal && confirmData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Resetear contraseña</h3>
            <p className="text-sm text-slate-500 mb-4">Vas a resetear la contraseña de:</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-5">
              <p className="font-bold text-slate-900 text-base">{confirmData.name}</p>
              <p className="text-sm text-slate-500 mt-1">{confirmData.email}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmModal(false); setConfirmData(null); }}
                className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={executeResetPassword}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
              >
                Sí, resetear
              </button>
            </div>
          </div>
        </div>
      )}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Contraseña generada</h3>
            <p className="font-semibold text-slate-900">{passwordUserName}</p>
            <p className="text-xs text-slate-400 mb-5">{passwordUserEmail}</p>
            <div className="bg-slate-100 rounded-xl p-4 mb-5">
              <span className="text-2xl font-mono font-bold text-slate-900 tracking-widest select-all">
                {generatedPassword}
              </span>
            </div>
            <button
              onClick={copyPassword}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {passwordCopied ? (
                <><Check className="w-5 h-5" /> Copiado</>
              ) : (
                <><Copy className="w-5 h-5" /> Copiar contraseña</>
              )}
            </button>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="w-full py-2 mt-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function isAdminText(user: AdminUser): string {
  if (user.is_admin) return "Admin • " + (user.status || "active");
  return user.specialty || user.institution || "Médico";
}

function getStatusIcon(status: string) {
  if (status === "deleted") return <EyeOff className="w-3.5 h-3.5" />;
  if (status === "inactive") return <Eye className="w-3.5 h-3.5" />;
  return <Shield className="w-3.5 h-3.5" />;
}
