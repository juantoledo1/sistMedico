import { UserSettings } from "../../types";
import { ArrowLeft, Search, Loader2, Shield } from "lucide-react";
import { Button } from "../ui/Button";
import { AdminUserTable } from "./AdminUserTable";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { AdminPasswordModal } from "./AdminPasswordModal";
import { useAdminUsers } from "./useAdminUsers";

interface AdminViewProps {
  settings: UserSettings;
  onBack: () => void;
}

export function AdminView({ settings, onBack }: AdminViewProps) {
  const {
    search, setSearch, filter, setFilter, isLoading, error,
    filteredUsers, filterButtons,
    toggling, deleting, resetting,
    showConfirmModal, confirmData, confirmMode,
    setShowConfirmModal, setConfirmData,
    executeDelete, handleDelete, handleResetPassword, executeResetPassword,
    showPasswordModal, setShowPasswordModal, generatedPassword, passwordUserName, passwordUserEmail,
    passwordCopied, copyPassword, handleToggleActive,
  } = useAdminUsers();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Panel de Administración</h1>
            <p className="text-sm text-slate-500 mt-1">Gestión de médicos y suscripciones</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Buscar por email, nombre o teléfono..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(btn => (
            <Button key={btn.key} size="sm" variant={filter === btn.key ? "primary" : "secondary"}
              onClick={() => setFilter(btn.key)}>
              {btn.label}
              <span className={`ml-2 text-xs ${filter === btn.key ? "text-white/80" : "text-slate-400"}`}>{btn.count}</span>
            </Button>
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
          <p className="text-slate-500 font-medium">{search ? "No se encontraron usuarios con ese criterio" : "No hay usuarios en esta categoría"}</p>
        </div>
      ) : (
        <AdminUserTable users={filteredUsers} toggling={toggling} resetting={resetting} deleting={deleting}
          onToggleActive={handleToggleActive} onResetPassword={handleResetPassword} onDelete={handleDelete} />
      )}

      <AdminConfirmModal show={showConfirmModal} data={confirmData} mode={confirmMode}
        onClose={() => { setShowConfirmModal(false); setConfirmData(null); }}
        onConfirm={confirmMode === 'delete' ? executeDelete : executeResetPassword} />

      <AdminPasswordModal show={showPasswordModal} password={generatedPassword} userName={passwordUserName}
        userEmail={passwordUserEmail} copied={passwordCopied} onCopy={copyPassword}
        onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};
