import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { UserSettings } from "../types";
import { ArrowLeft, Users, DollarSign, ToggleLeft, ToggleRight, Loader2, AlertTriangle, Phone, Mail } from "lucide-react";

interface UserDebt {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  total_debt: number;
  days_overdue: number;
  is_active: boolean;
}

interface AdminViewProps {
  settings: UserSettings;
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ settings, onBack }) => {
  const [usersWithDebts, setUsersWithDebts] = useState<UserDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadUsersWithDebts();
  }, []);

  const loadUsersWithDebts = async () => {
    try {
      setIsLoading(true);
      setError("");
      const debts = await api.getUsersWithDebts();
      setUsersWithDebts(debts);
    } catch (e) {
      console.error("Error loading debts:", e);
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      setToggling(userId);
      await api.toggleUserActive(userId, !currentActive);
      setUsersWithDebts(usersWithDebts.map(u => 
        u.id === userId ? { ...u, is_active: !currentActive } : u
      ));
    } catch (e) {
      console.error("Error toggling:", e);
      alert(e instanceof Error ? e.message : "Error al cambiar estado");
    } finally {
      setToggling(null);
    }
  };

  const getStatusColor = (days: number, isActive: boolean) => {
    if (!isActive) return "bg-red-100 text-red-700 border-red-200";
    if (days > 30) return "bg-red-100 text-red-700 border-red-200";
    if (days > 15) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

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
              Gestión de médicos y pagos
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : usersWithDebts.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No hay médicos con deudas</p>
          <p className="text-sm text-slate-400 mt-1">Todos los pagos están al día</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Médico</th>
                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Contacto</th>
                <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Deuda</th>
                <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Días Atraso</th>
                <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Estado</th>
                <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usersWithDebts.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900">{user.full_name}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="font-black text-lg text-slate-900">
                      ${(user.total_debt / 100).toFixed(0)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`font-bold ${user.days_overdue > 30 ? 'text-red-600' : user.days_overdue > 15 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Math.floor(user.days_overdue)} días
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(user.days_overdue, user.is_active)}`}>
                      {user.is_active ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Activo
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Suspendido
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      disabled={toggling === user.id}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        user.is_active 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
        <h3 className="font-black text-blue-900 mb-2">Información</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• <span className="font-bold">Verde:</span> 0-15 días de atraso</li>
          <li>• <span className="font-bold">Amarillo:</span> 16-30 días de atraso</li>
          <li>• <span className="font-bold">Rojo:</span> Más de 30 días - SUSPENDIDO automáticamente</li>
        </ul>
      </div>
    </div>
  );
};