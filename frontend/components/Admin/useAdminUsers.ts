import { useState, useEffect } from "react";
import { api } from "../../services/api";

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

export function useAdminUsers() {
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
  const [confirmMode, setConfirmMode] = useState<'delete' | 'reset'>('reset');
  const [confirmData, setConfirmData] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => { loadUsers(); }, []);

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
        u.id === userId ? { ...u, is_active: !currentActive, status: !currentActive ? "active" : "suspended" } : u
      ));
    } catch (e) {
      console.error("Error toggling:", e);
      alert(e instanceof Error ? e.message : "Error al cambiar estado");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setConfirmMode('delete');
    setConfirmData({ id: userId, name: user.full_name || user.email, email: user.email });
    setShowConfirmModal(true);
  };

  const executeDelete = async () => {
    if (!confirmData) return;
    setShowConfirmModal(false);
    setDeleting(confirmData.id);
    try {
      await api.deleteUser(confirmData.id);
      setUsers(users.map(u =>
        u.id === confirmData.id ? { ...u, is_deleted: true, is_active: false, status: "deleted" } : u
      ));
    } catch (e) {
      console.error("Error deleting:", e);
      alert(e instanceof Error ? e.message : "Error al eliminar usuario");
    } finally {
      setDeleting(null);
      setConfirmData(null);
    }
  };

  const handleResetPassword = (user: AdminUser) => {
    setConfirmMode('reset');
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

  return {
    search, setSearch, filter, setFilter, isLoading, error,
    filteredUsers, filterButtons,
    toggling, deleting, resetting,
    showConfirmModal, confirmData, confirmMode,
    setShowConfirmModal, setConfirmData,
    executeDelete, handleDelete, handleResetPassword, executeResetPassword,
    showPasswordModal, setShowPasswordModal, generatedPassword, passwordUserName, passwordUserEmail,
    passwordCopied, copyPassword, handleToggleActive,
  };
}
