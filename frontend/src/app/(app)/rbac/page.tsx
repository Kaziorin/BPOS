"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Shield, Users, Edit, Trash2, Check, X } from "lucide-react";

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
  status: string;
  _count: {
    rolePermissions: number;
    userAccounts: number;
  };
  permissions?: Permission[];
}

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  role: {
    id: string;
    name: string;
    isSystem: boolean;
    _count: {
      rolePermissions: number;
    };
  };
}

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  refund: "Refund",
  approve: "Approve",
  assign: "Assign",
  replace: "Replace",
  upload: "Upload",
};

export default function RBACPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const tenantId = localStorage.getItem("tenantId") || "demo-shop";
      const headers = { "x-tenant-id": tenantId };

      const [rolesRes, permsRes, usersRes] = await Promise.all([
        fetch("/api/v1/rbac/roles", { headers }),
        fetch("/api/v1/rbac/permissions/modules", { headers }),
        fetch("/api/v1/rbac/users", { headers }),
      ]);

      if (rolesRes.ok) {
        const { data } = await rolesRes.json();
        setRoles(data);
      }

      if (permsRes.ok) {
        const { data } = await permsRes.json();
        setPermissions(data);
      }

      if (usersRes.ok) {
        const { data } = await usersRes.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load RBAC data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadRolePermissions(role: Role) {
    setSelectedRole(role);
    try {
      const tenantId = localStorage.getItem("tenantId") || "demo-shop";
      const res = await fetch(`/api/v1/rbac/roles/${role.id}/permissions`, {
        headers: { "x-tenant-id": tenantId },
      });
      if (res.ok) {
        const { data } = await res.json();
        setSelectedRolePerms(new Set(data.permissions.map((p: Permission) => p.code)));
      }
    } catch (err) {
      console.error("Failed to load role permissions:", err);
    }
  }

  async function savePermissions() {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const tenantId = localStorage.getItem("tenantId") || "demo-shop";
      const res = await fetch(`/api/v1/rbac/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({ permissionCodes: Array.from(selectedRolePerms) }),
      });

      if (res.ok) {
        await loadData();
        alert("Permissions saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save permissions:", err);
    } finally {
      setSaving(false);
    }
  }

  async function createRole() {
    if (!newRoleName.trim()) return;
    try {
      const tenantId = localStorage.getItem("tenantId") || "demo-shop";
      const res = await fetch("/api/v1/rbac/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc || undefined,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewRoleName("");
        setNewRoleDesc("");
        await loadData();
      }
    } catch (err) {
      console.error("Failed to create role:", err);
    }
  }

  async function deleteRole(role: Role) {
    if (role.isSystem) {
      alert("Cannot delete system roles");
      return;
    }
    if (role._count.userAccounts > 0) {
      alert(`Cannot delete role "${role.name}" — ${role._count.userAccounts} user(s) are assigned.`);
      return;
    }
    if (!confirm(`Delete role "${role.name}"?`)) return;

    try {
      const tenantId = localStorage.getItem("tenantId") || "demo-shop";
      const res = await fetch(`/api/v1/rbac/roles/${role.id}`, {
        method: "DELETE",
        headers: { "x-tenant-id": tenantId },
      });

      if (res.ok) {
        if (selectedRole?.id === role.id) {
          setSelectedRole(null);
          setSelectedRolePerms(new Set());
        }
        await loadData();
      }
    } catch (err) {
      console.error("Failed to delete role:", err);
    }
  }

  function togglePerm(code: string) {
    setSelectedRolePerms((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  function toggleModulePerms(moduleName: string, perms: Permission[]) {
    const allSelected = perms.every((p) => selectedRolePerms.has(p.code));
    setSelectedRolePerms((prev) => {
      const next = new Set(prev);
      for (const p of perms) {
        if (allSelected) {
          next.delete(p.code);
        } else {
          next.add(p.code);
        }
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user roles and action-level permissions (spec §5)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Create Role
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("roles")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "roles"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Shield size={16} className="mr-1 inline" />
          Roles ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "users"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users size={16} className="mr-1 inline" />
          Users ({users.length})
        </button>
      </div>

      {activeTab === "roles" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Roles List */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-700">Roles</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between px-4 py-3 transition hover:bg-gray-50 cursor-pointer ${
                      selectedRole?.id === role.id ? "bg-primary-50" : ""
                    }`}
                    onClick={() => loadRolePermissions(role)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{role.name}</span>
                        {role.isSystem && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            System
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 truncate">
                        {role._count.rolePermissions} permissions · {role._count.userAccounts} users
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadRolePermissions(role);
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit permissions"
                      >
                        <Edit size={14} />
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRole(role);
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete role"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permission Matrix */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700">
                      Permissions: {selectedRole.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedRolePerms.size} of{" "}
                      {Object.values(permissions).flat().length} permissions selected
                    </p>
                  </div>
                  <button
                    onClick={savePermissions}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Save Changes
                  </button>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-4">
                  {Object.entries(permissions).map(([module, perms]) => {
                    const allSelected = perms.every((p) => selectedRolePerms.has(p.code));
                    const someSelected = perms.some((p) => selectedRolePerms.has(p.code));

                    return (
                      <div key={module} className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={() => toggleModulePerms(module, perms)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm font-semibold text-gray-700 capitalize">
                            {module}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({perms.filter((p) => selectedRolePerms.has(p.code)).length}/{perms.length})
                          </span>
                        </div>
                        <div className="ml-7 grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedRolePerms.has(perm.code)}
                                onChange={() => togglePerm(perm.code)}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-gray-600">
                                {ACTION_LABELS[perm.action] || perm.action}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                <Shield size={48} className="mx-auto text-gray-300" />
                <p className="mt-4 text-gray-500">Select a role to edit its permissions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Users & Role Assignment</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                        <Shield size={12} />
                        {user.role.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Create Custom Role</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a new role with custom permissions
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Senior Cashier"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoleName("");
                  setNewRoleDesc("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createRole}
                disabled={!newRoleName.trim()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
