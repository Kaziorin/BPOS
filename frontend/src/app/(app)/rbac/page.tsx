"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Lock,
  Unlock,
  Key,
  Layers,
  Settings,
  AlertTriangle,
  FileText,
  Activity,
  Filter,
  ArrowRight,
  Eye,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  status?: string;
  permCount?: number;
  userCount?: number;
  _count?: {
    rolePermissions: number;
    userAccounts: number;
  };
  permissions?: Permission[];
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  roleId?: string;
  roleName?: string;
  role?: {
    id: string;
    name: string;
    isSystem?: boolean;
    _count?: {
      rolePermissions: number;
    };
  };
}

// ─── Module Metadata & Categories ────────────────────────────────────────────
const MODULE_CATEGORIES: Record<string, { label: string; icon: string }> = {
  pos: { label: "Point of Sale & Checkout", icon: "ShoppingCart" },
  sales: { label: "Sales & Invoicing", icon: "Receipt" },
  inventory: { label: "Inventory & Warehousing", icon: "Package" },
  purchases: { label: "Purchasing & Suppliers", icon: "ClipboardList" },
  customers: { label: "Customers & CRM", icon: "Users" },
  accounting: { label: "Finance & General Ledger", icon: "Landmark" },
  tax: { label: "Tax & NBR VAT (Mushak)", icon: "Scale" },
  expenses: { label: "Expenses & Petty Cash", icon: "DollarSign" },
  workflow: { label: "Approvals & Engine Rules", icon: "GitMerge" },
  rbac: { label: "Roles & RBAC Governance", icon: "Shield" },
  settings: { label: "Tenant & Store Settings", icon: "Settings" },
  audit: { label: "Audit & SIEM Security", icon: "Eye" },
  hrm: { label: "HRM & Staff Attendance", icon: "UserCog" },
  saas: { label: "Platform & Multi-Tenant", icon: "Layers" },
};

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  view: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  create: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
  edit: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  delete: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800" },
  approve: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  refund: { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-800" },
  export: { bg: "bg-teal-50 dark:bg-teal-950/30", text: "text-teal-700 dark:text-teal-400", border: "border-teal-200 dark:border-teal-800" },
};

const HIGH_RISK_ACTIONS = ["delete", "refund", "roles.delete", "tenant.delete", "accounting.journals.edit"];

export default function RBACPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState<Set<string>>(new Set());
  const [initialRolePerms, setInitialRolePerms] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [permLoading, setPermLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"matrix" | "users" | "registry" | "governance">("matrix");
  
  // Search & Filters
  const [roleSearch, setRoleSearch] = useState("");
  const [permSearch, setPermSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePreset, setNewRolePreset] = useState<"BLANK" | "CASHIER" | "MANAGER" | "ACCOUNTANT">("BLANK");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editRoleId, setEditRoleId] = useState("");
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDesc, setEditRoleDesc] = useState("");

  const [userInspectTarget, setUserInspectTarget] = useState<User | null>(null);
  const [assignRoleTarget, setAssignRoleTarget] = useState<User | null>(null);
  const [newAssignedRoleId, setNewAssignedRoleId] = useState("");
  const [assigningRole, setAssigningRole] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        api.get<any>("/api/v1/rbac/roles"),
        api.get<any>("/api/v1/rbac/permissions/modules"),
        api.get<any>("/api/v1/rbac/users"),
      ]);

      const rData: Role[] = rolesRes?.data || rolesRes || [];
      const pData: Record<string, Permission[]> = permsRes?.data || permsRes || {};
      const uData: User[] = usersRes?.data || usersRes || [];

      setRoles(rData);
      setPermissions(pData);
      setUsers(uData);

      if (rData.length > 0 && !selectedRoleId) {
        selectRole(rData[0]);
      }
    } catch (err: any) {
      console.error("Failed to load RBAC data:", err);
      notify(err?.message || "Failed to load RBAC data", "error");
    } finally {
      setLoading(false);
    }
  }

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const hasUnsavedPermChanges = useMemo(() => {
    if (selectedRolePerms.size !== initialRolePerms.size) return true;
    for (const code of selectedRolePerms) {
      if (!initialRolePerms.has(code)) return true;
    }
    return false;
  }, [selectedRolePerms, initialRolePerms]);

  async function selectRole(role: Role) {
    setSelectedRoleId(role.id);
    setPermLoading(true);
    try {
      const res = await api.get<any>(`/api/v1/rbac/roles/${role.id}/permissions`);
      const list: Permission[] = res?.data || res || [];
      const permSet = new Set(list.map((p) => p.code));
      setSelectedRolePerms(permSet);
      setInitialRolePerms(new Set(permSet));
    } catch (err) {
      console.error("Failed to load role permissions:", err);
      setSelectedRolePerms(new Set());
      setInitialRolePerms(new Set());
    } finally {
      setPermLoading(false);
    }
  }

  async function savePermissions() {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await api.put(`/api/v1/rbac/roles/${selectedRole.id}/permissions`, {
        permissionCodes: Array.from(selectedRolePerms),
      });
      setInitialRolePerms(new Set(selectedRolePerms));
      
      // Update perm count in role list
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id
            ? { ...r, permCount: selectedRolePerms.size, _count: { ...(r._count || { userAccounts: 0 }), rolePermissions: selectedRolePerms.size } }
            : r
        )
      );

      notify(`Permissions updated successfully for role "${selectedRole.name}"!`);
    } catch (err: any) {
      notify(err?.message || "Failed to save permissions", "error");
    } finally {
      setSaving(false);
    }
  }

  function togglePerm(code: string) {
    setSelectedRolePerms((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleModulePerms(modulePerms: Permission[]) {
    const allChecked = modulePerms.every((p) => selectedRolePerms.has(p.code));
    setSelectedRolePerms((prev) => {
      const next = new Set(prev);
      for (const p of modulePerms) {
        if (allChecked) next.delete(p.code);
        else next.add(p.code);
      }
      return next;
    });
  }

  function applyPreset(presetType: "ALL" | "NONE" | "VIEW_ONLY") {
    const allAvailable = Object.values(permissions).flat();
    setSelectedRolePerms((prev) => {
      const next = new Set<string>();
      if (presetType === "ALL") {
        allAvailable.forEach((p) => next.add(p.code));
      } else if (presetType === "VIEW_ONLY") {
        allAvailable.filter((p) => p.action === "view").forEach((p) => next.add(p.code));
      }
      return next;
    });
  }

  async function createRole() {
    if (!newRoleName.trim()) return;
    try {
      const res = await api.post<any>("/api/v1/rbac/roles", {
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
      });
      const created = res?.data || res;
      
      // If preset selected, apply permission codes right away
      if (newRolePreset !== "BLANK" && created?.id) {
        const allPerms = Object.values(permissions).flat();
        let targetCodes: string[] = [];
        if (newRolePreset === "CASHIER") {
          targetCodes = allPerms
            .filter((p) => p.module === "pos" || (p.module === "sales" && p.action === "create") || (p.module === "customers" && p.action === "view"))
            .map((p) => p.code);
        } else if (newRolePreset === "MANAGER") {
          targetCodes = allPerms
            .filter((p) => p.module !== "saas" && !(p.module === "rbac" && p.action === "delete"))
            .map((p) => p.code);
        } else if (newRolePreset === "ACCOUNTANT") {
          targetCodes = allPerms
            .filter((p) => p.module === "accounting" || p.module === "tax" || p.module === "expenses" || p.module === "sales")
            .map((p) => p.code);
        }
        if (targetCodes.length > 0) {
          await api.put(`/api/v1/rbac/roles/${created.id}/permissions`, { permissionCodes: targetCodes });
        }
      }

      setShowCreateModal(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setNewRolePreset("BLANK");
      notify(`Role "${newRoleName}" created successfully!`);
      await loadData();
    } catch (err: any) {
      notify(err?.message || "Failed to create role", "error");
    }
  }

  async function saveEditedRole() {
    if (!editRoleName.trim() || !editRoleId) return;
    try {
      await api.put(`/api/v1/rbac/roles/${editRoleId}`, {
        name: editRoleName.trim(),
        description: editRoleDesc.trim() || null,
      });
      setShowEditModal(false);
      notify("Role metadata updated!");
      await loadData();
    } catch (err: any) {
      notify(err?.message || "Failed to update role", "error");
    }
  }

  async function deleteRole(role: Role) {
    if (role.isSystem) {
      notify("System protected roles cannot be deleted.", "error");
      return;
    }
    const count = role.userCount ?? role._count?.userAccounts ?? 0;
    if (count > 0) {
      notify(`Cannot delete role "${role.name}" because ${count} staff user(s) are assigned to it.`, "error");
      return;
    }
    if (!confirm(`Are you sure you want to delete custom role "${role.name}"? This action cannot be undone.`)) return;

    try {
      await api.del(`/api/v1/rbac/roles/${role.id}`);
      notify(`Role "${role.name}" deleted.`);
      if (selectedRoleId === role.id) {
        setSelectedRoleId(null);
      }
      await loadData();
    } catch (err: any) {
      notify(err?.message || "Failed to delete role", "error");
    }
  }

  async function handleAssignRole() {
    if (!assignRoleTarget || !newAssignedRoleId) return;
    setAssigningRole(true);
    try {
      await api.put(`/api/v1/rbac/users/${assignRoleTarget.id}/role`, {
        roleId: newAssignedRoleId,
      });
      notify(`User ${assignRoleTarget.name} assigned new role successfully!`);
      setAssignRoleTarget(null);
      await loadData();
    } catch (err: any) {
      notify(err?.message || "Failed to assign role", "error");
    } finally {
      setAssigningRole(false);
    }
  }

  // Filtered lists
  const filteredRoles = useMemo(() => {
    return roles.filter((r) =>
      r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(roleSearch.toLowerCase())
    );
  }, [roles, roleSearch]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole =
        userRoleFilter === "ALL" ||
        u.roleId === userRoleFilter ||
        u.role?.id === userRoleFilter ||
        (userRoleFilter === "NO_ROLE" && !u.roleId && !u.role?.id);
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const allPermissionsList = useMemo(() => {
    return Object.entries(permissions).flatMap(([mod, perms]) =>
      perms.map((p) => ({ ...p, module: mod }))
    );
  }, [permissions]);

  const totalPermNodes = useMemo(() => {
    return Object.values(permissions).reduce((acc, list) => acc + list.length, 0);
  }, [permissions]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Breadcrumb & Top Executive Header ── */}
      <CustomBreadcrumb
        title="Role-Based Access Control (RBAC)"
        description="Fine-grained multi-level permission matrix, staff role assignments, SOC segregation of duties, and zero-trust security policies (§5)"
        icon={<Shield size={16} />}
        items={[
          { label: "Administration", href: "/dashboard" },
          { label: "Security & Governance", href: "/audit-security" },
          { label: "RBAC Matrix", href: "/rbac" },
        ]}
      />

      {/* ── Toast Alert Banner ── */}
      {toastMsg && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border shadow-lg animate-in slide-in-from-top duration-300 ${
            toastMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMsg.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
            <span className="text-sm font-semibold">{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="p-1 rounded hover:bg-black/5">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Executive KPI Cards & Glow Overview ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Roles</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/50 text-primary-600">
              <Shield size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{roles.length}</span>
            <span className="text-xs text-slate-500">configured</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={13} />
            <span>{roles.filter((r) => r.isSystem).length} System Built-ins</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Staff</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</span>
            <span className="text-xs text-slate-500">total accounts</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
            <UserCheck size={13} />
            <span>{users.filter((u) => u.status === "ACTIVE").length} Active Users</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Permission Nodes</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600">
              <Key size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalPermNodes}</span>
            <span className="text-xs text-slate-500">granular actions</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
            <Layers size={13} />
            <span>Across {Object.keys(permissions).length} Functional Modules</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Governance Engine</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
              <Activity size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">Zero-Trust Active</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span>Cache Invalidation on Update</span>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          {[
            { id: "matrix", label: "Roles & Permission Matrix", icon: Sliders, badge: roles.length },
            { id: "users", label: "Staff Role Assignments", icon: Users, badge: users.length },
            { id: "registry", label: "Permission Registry (§5)", icon: Key, badge: totalPermNodes },
            { id: "governance", label: "Security & SOD Governance", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  active
                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-500/20 hover:bg-primary-700 active:scale-95 transition"
        >
          <Plus size={15} />
          <span>Create Custom Role</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: ROLES & GRANULAR PERMISSION MATRIX                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "matrix" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Role Selector Directory */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Configured Roles</span>
                <span className="text-[11px] font-bold text-slate-400">{filteredRoles.length} Available</span>
              </div>

              <div className="mt-3 relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter roles..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mt-3 space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {filteredRoles.map((role) => {
                  const isSelected = selectedRole?.id === role.id;
                  const pCount = role.permCount ?? role._count?.rolePermissions ?? 0;
                  const uCount = role.userCount ?? role._count?.userAccounts ?? 0;
                  const coveragePct = Math.round((pCount / (totalPermNodes || 1)) * 100);

                  return (
                    <div
                      key={role.id}
                      onClick={() => selectRole(role)}
                      className={`group relative flex flex-col gap-2 rounded-xl p-3.5 border transition cursor-pointer ${
                        isSelected
                          ? "border-primary-500 bg-primary-50/60 dark:bg-primary-950/30 shadow-sm"
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                              role.isSystem
                                ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                                : "bg-primary-100 dark:bg-primary-950/50 text-primary-600"
                            }`}
                          >
                            <Shield size={14} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">{role.name}</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{role.description || "No description provided"}</span>
                          </div>
                        </div>

                        {role.isSystem ? (
                          <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[9px] font-extrabold tracking-wide uppercase text-amber-800 dark:text-amber-300">
                            System
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditRoleId(role.id);
                                setEditRoleName(role.name);
                                setEditRoleDesc(role.description || "");
                                setShowEditModal(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Edit Role Metadata"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => deleteRole(role)}
                              className="p-1 rounded text-rose-400 hover:text-rose-600"
                              title="Delete Role"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Stats & Progress */}
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Key size={11} className="text-slate-400" />
                          <strong className="text-slate-700 dark:text-slate-300">{pCount}</strong> perms ({coveragePct}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} className="text-slate-400" />
                          <strong className="text-slate-700 dark:text-slate-300">{uCount}</strong> staff
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            coveragePct > 70 ? "bg-emerald-500" : coveragePct > 30 ? "bg-primary-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(coveragePct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Permission Matrix */}
          <div className="lg:col-span-8 space-y-4">
            {selectedRole ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {/* Header & Role Controls */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md shadow-primary-500/20">
                        <Shield size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedRole.name}</h3>
                          {selectedRole.isSystem && (
                            <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              System Protected
                            </span>
                          )}
                          {hasUnsavedPermChanges && (
                            <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 animate-pulse">
                              Unsaved Modifications
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedRole.description || "Grant or revoke granular action privileges for this role profile."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={savePermissions}
                        disabled={saving || !hasUnsavedPermChanges}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                          hasUnsavedPermChanges
                            ? "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20 active:scale-95"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                        <span>{saving ? "Deploying..." : "Save Role Matrix"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Preset Buttons & Search bar */}
                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Quick Presets:</span>
                      <button
                        onClick={() => applyPreset("ALL")}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      >
                        Select All ({totalPermNodes})
                      </button>
                      <button
                        onClick={() => applyPreset("VIEW_ONLY")}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      >
                        Read-Only View
                      </button>
                      <button
                        onClick={() => applyPreset("NONE")}
                        className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search size={13} className="absolute left-3 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search permissions..."
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Permissions Tree / Accordion */}
                <div className="p-5 max-h-[640px] overflow-y-auto space-y-6">
                  {permLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                      <RefreshCw size={24} className="animate-spin text-primary-600" />
                      <span className="text-xs font-medium">Loading permission mappings...</span>
                    </div>
                  ) : (
                    Object.entries(permissions)
                      .filter(([mod, perms]) => {
                        if (!permSearch) return true;
                        const modMatch = mod.toLowerCase().includes(permSearch.toLowerCase());
                        const permMatch = perms.some(
                          (p) =>
                            p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
                            p.action.toLowerCase().includes(permSearch.toLowerCase()) ||
                            (p.description || "").toLowerCase().includes(permSearch.toLowerCase())
                        );
                        return modMatch || permMatch;
                      })
                      .map(([moduleKey, perms]) => {
                        const meta = MODULE_CATEGORIES[moduleKey] || { label: moduleKey.toUpperCase(), icon: "Layers" };
                        const filteredModulePerms = perms.filter((p) => {
                          if (!permSearch) return true;
                          return (
                            p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
                            p.action.toLowerCase().includes(permSearch.toLowerCase()) ||
                            (p.description || "").toLowerCase().includes(permSearch.toLowerCase())
                          );
                        });

                        const allChecked = perms.every((p) => selectedRolePerms.has(p.code));
                        const checkedCount = perms.filter((p) => selectedRolePerms.has(p.code)).length;

                        return (
                          <div key={moduleKey} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                            {/* Module Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  id={`module-${moduleKey}`}
                                  checked={allChecked}
                                  onChange={() => toggleModulePerms(perms)}
                                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                />
                                <label htmlFor={`module-${moduleKey}`} className="flex items-center gap-2 cursor-pointer select-none">
                                  <span className="text-xs font-black text-slate-900 dark:text-white capitalize">{meta.label}</span>
                                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    {moduleKey}
                                  </span>
                                </label>
                              </div>

                              <span className="text-[11px] font-bold text-slate-400">
                                <strong className={checkedCount > 0 ? "text-primary-600 dark:text-primary-400" : "text-slate-400"}>
                                  {checkedCount}
                                </strong>{" "}
                                / {perms.length} Active
                              </span>
                            </div>

                            {/* Action Pills Grid */}
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {filteredModulePerms.map((perm) => {
                                const isChecked = selectedRolePerms.has(perm.code);
                                const isHighRisk = HIGH_RISK_ACTIONS.some((h) => perm.code.includes(h) || perm.action === h);
                                const actColor = ACTION_COLORS[perm.action] || {
                                  bg: "bg-slate-50 dark:bg-slate-800",
                                  text: "text-slate-700 dark:text-slate-300",
                                  border: "border-slate-200 dark:border-slate-700",
                                };

                                return (
                                  <label
                                    key={perm.id || perm.code}
                                    className={`relative flex items-center justify-between gap-2 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                                      isChecked
                                        ? "border-primary-400 dark:border-primary-600 bg-primary-50/40 dark:bg-primary-950/20 shadow-xs"
                                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => togglePerm(perm.code)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                      />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                                            {perm.action}
                                          </span>
                                          {isHighRisk && (
                                            <span title="High-Risk Action" className="text-rose-500">
                                              <AlertTriangle size={11} />
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 truncate block">{perm.code}</span>
                                      </div>
                                    </div>

                                    <span
                                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${actColor.bg} ${actColor.text} ${actColor.border}`}
                                    >
                                      {perm.action}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Sticky Action Footer */}
                {hasUnsavedPermChanges && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/40 flex items-center justify-between animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <AlertTriangle size={15} className="text-amber-600" />
                      <span>You have unsaved changes in the permission matrix.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRolePerms(new Set(initialRolePerms))}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      >
                        Discard Changes
                      </button>
                      <button
                        onClick={savePermissions}
                        disabled={saving}
                        className="rounded-xl bg-primary-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-700 shadow-md shadow-primary-500/20"
                      >
                        {saving ? "Deploying..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 text-center">
                <Shield size={48} className="mx-auto text-slate-300 dark:text-slate-700" />
                <h4 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">Select a Role Profile</h4>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Select any system role or custom role from the left sidebar to audit or customize its granular permissions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: STAFF ROLE ASSIGNMENTS & DIRECTORY                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Staff Member Access Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign roles, review active permissions, and manage user security status (§5.3).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">All Roles ({users.length})</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.userCount ?? r._count?.userAccounts ?? 0})
                  </option>
                ))}
                <option value="NO_ROLE">No Role Assigned</option>
              </select>

              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Contact Email</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleName = user.roleName || user.role?.name || "Unassigned";
                    const isSystemRole = user.role?.isSystem;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{user.name}</span>
                              <span className="text-[10px] text-slate-400">ID: {user.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {user.email}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold ${
                              roleName === "Unassigned"
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                : isSystemRole
                                ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                                : "bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300"
                            }`}
                          >
                            <Shield size={12} />
                            {roleName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              user.status === "ACTIVE"
                                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setAssignRoleTarget(user);
                                setNewAssignedRoleId(user.roleId || user.role?.id || roles[0]?.id || "");
                              }}
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
                            >
                              Change Role
                            </button>
                            <button
                              onClick={() => setUserInspectTarget(user)}
                              className="rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              title="Inspect Effective Permissions"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: COMPLETE PERMISSION REGISTRY & AUDIT EXPLORER                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "registry" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Master Permission Registry (§5)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full catalog of functional codes, action types, and security risk classifications.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, module, or description..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Permission Code</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allPermissionsList
                  .filter((p) => {
                    if (!permSearch) return true;
                    return (
                      p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
                      p.module.toLowerCase().includes(permSearch.toLowerCase()) ||
                      p.action.toLowerCase().includes(permSearch.toLowerCase()) ||
                      (p.description || "").toLowerCase().includes(permSearch.toLowerCase())
                    );
                  })
                  .map((perm) => {
                    const isHighRisk = HIGH_RISK_ACTIONS.some((h) => perm.code.includes(h) || perm.action === h);
                    const actColor = ACTION_COLORS[perm.action] || {
                      bg: "bg-slate-50 dark:bg-slate-800",
                      text: "text-slate-700 dark:text-slate-300",
                      border: "border-slate-200 dark:border-slate-700",
                    };

                    return (
                      <tr key={perm.id || perm.code} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{perm.code}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 capitalize">
                            {perm.module}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${actColor.bg} ${actColor.text} ${actColor.border}`}
                          >
                            {perm.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isHighRisk ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                              <AlertTriangle size={11} />
                              High Risk
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {perm.description || `Allows staff to ${perm.action} operations in the ${perm.module} module.`}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: SECURITY & SOD GOVERNANCE                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "governance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Segregation of Duties (SOD Policy)</h4>
                <p className="text-xs text-slate-500">Dual-control checks and prohibited permission combinations</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { title: "POS Cashier vs Ledger Journals", desc: "Prevents cashiers from posting unverified general journal entries directly into accounting.", status: "ENFORCED" },
                { title: "Stock Manager vs Inventory Adjustment Approval", desc: "Requires a senior store manager approval for inventory write-offs exceeding ৳5,000.", status: "ENFORCED" },
                { title: "Invoice Creator vs Refund Processor", desc: "Ensures staff members cannot process full cash refunds on invoices they issued without manager pin.", status: "ENFORCED" },
              ].map((policy, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{policy.title}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{policy.desc}</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400">
                    {policy.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600">
                <Lock size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Session & Zero-Trust Policies</h4>
                <p className="text-xs text-slate-500">Cryptographic tokens, multi-branch scoping, and cache TTL</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { title: "Role Cache Invalidation", desc: "Permission cache immediately flushes across all active tenant POS nodes upon saving matrix.", value: "Zero-Latency" },
                { title: "Multi-Branch Scoping", desc: "Staff members only access data belonging to their assigned store outlet branch.", value: "Strict Branch Filter" },
                { title: "Break-Glass Super Admin", desc: "Emergency owner override capability with full immutable audit trail logging.", value: "Audit-Logged" },
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{item.title}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{item.desc}</span>
                  </div>
                  <span className="rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE CUSTOM ROLE                                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary-600">
                  <Shield size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Create Custom Role</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role Display Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Shift Supervisor"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the responsibility and scope of this role..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Permission Template</label>
                <select
                  value={newRolePreset}
                  onChange={(e) => setNewRolePreset(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="BLANK">Blank (0 Permissions)</option>
                  <option value="CASHIER">POS Cashier Standard Preset</option>
                  <option value="MANAGER">Store Manager Preset</option>
                  <option value="ACCOUNTANT">Accountant & Tax Officer Preset</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={createRole}
                disabled={!newRoleName.trim()}
                className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50 shadow-md shadow-primary-500/20"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: EDIT ROLE METADATA                                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary-600">
                  <Edit2 size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Role Details</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role Name *</label>
                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editRoleDesc}
                  onChange={(e) => setEditRoleDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedRole}
                disabled={!editRoleName.trim()}
                className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50 shadow-md shadow-primary-500/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ASSIGN ROLE TO STAFF USER                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {assignRoleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600">
                  <Users size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Assign Role to Staff</h3>
              </div>
              <button onClick={() => setAssignRoleTarget(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 text-[11px] block">Selected Staff Member:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">{assignRoleTarget.name}</span>
                <span className="text-slate-400 text-[11px] font-mono">{assignRoleTarget.email}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select New Role *</label>
                <select
                  value={newAssignedRoleId}
                  onChange={(e) => setNewAssignedRoleId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.isSystem ? "(System Protected)" : ""} — {r.permCount ?? r._count?.rolePermissions ?? 0} permissions
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setAssignRoleTarget(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRole}
                disabled={assigningRole || !newAssignedRoleId}
                className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50 shadow-md shadow-primary-500/20"
              >
                {assigningRole ? "Updating..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: USER EFFECTIVE PERMISSIONS INSPECTOR                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {userInspectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Effective Security Privileges</h3>
                  <span className="text-xs text-slate-400">{userInspectTarget.name} ({userInspectTarget.roleName || userInspectTarget.role?.name || "Unassigned"})</span>
                </div>
              </div>
              <button onClick={() => setUserInspectTarget(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs max-h-96 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Security Profile:</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">{userInspectTarget.roleName || userInspectTarget.role?.name || "No Role"}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">User Account Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{userInspectTarget.status}</span>
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Effective Module Scope:</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(permissions).map((mod) => (
                    <div key={mod} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setUserInspectTarget(null)}
                className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 shadow-md shadow-primary-500/20"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
