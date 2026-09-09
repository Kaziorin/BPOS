"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, MapPin, Building2, Search, Phone, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomModal } from "@/components/custom/CustomModal";
import { StatusBadge } from "@/components/custom/CustomBadge";

interface Branch {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: "ACTIVE" | "INACTIVE";
  company?: { id: string; name: string } | null;
  _count?: { warehouses?: number; userAccounts?: number; devices?: number };
}

interface BranchFormData {
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
}

const initialFormData: BranchFormData = {
  name: "",
  code: "",
  phone: "",
  email: "",
  address: "",
  status: "ACTIVE",
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/api/v1/branches");
      const list = Array.isArray(res) ? res : res?.data || [];
      setBranches(list);
    } catch (err: any) {
      console.error("Failed to load branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || "",
      code: branch.code || "",
      phone: branch.phone || "",
      email: branch.email || "",
      address: branch.address || "",
      status: branch.status || "ACTIVE",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Branch name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingBranch) {
        // Edit Branch
        await api.put(`/api/v1/branches/${editingBranch.id}`, formData);
      } else {
        // Create Branch
        const payload = {
          ...formData,
          code: formData.code.trim() || formData.name.trim().substring(0, 8).toUpperCase(),
        };
        await api.post("/api/v1/branches", payload);
      }

      setIsModalOpen(false);
      await fetchBranches();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save branch. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (branch: Branch) => {
    const confirmMessage = `Are you sure you want to delete branch "${branch.name}"?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setDeletingId(branch.id);
      await api.delete(`/api/v1/branches/${branch.id}`);
      await fetchBranches();
    } catch (err: any) {
      alert(err?.message || "Failed to delete branch.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches & Outlets</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all operational branches, outlets and their linked facilities</p>
        </div>
        <CustomButton onClick={handleOpenCreate}>
          <Plus size={16} className="mr-2" />
          Add Branch
        </CustomButton>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search branches by name, code, or location..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-teal-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch Code</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch Name</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Linked Resources</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-800">
                        {branch.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                          <Building2 size={16} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{branch.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {branch.company?.name || "Main Company"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="space-y-0.5">
                        {branch.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-700">
                            <Phone size={12} className="text-gray-400" />
                            {branch.phone}
                          </div>
                        )}
                        {branch.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail size={12} className="text-gray-400" />
                            {branch.email}
                          </div>
                        )}
                        {!branch.phone && !branch.email && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {branch.address ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate">{branch.address}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium" title="Warehouses">
                          {branch._count?.warehouses ?? 0} WH
                        </span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-medium" title="Users">
                          {branch._count?.userAccounts ?? 0} Users
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium" title="Terminals">
                          {branch._count?.devices ?? 0} POS
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={branch.status || "ACTIVE"} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(branch)}
                          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Edit Branch"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(branch)}
                          disabled={deletingId === branch.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete / Deactivate Branch"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredBranches.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm text-gray-500">
                      <Building2 size={36} className="mx-auto text-gray-300 mb-2" />
                      <p className="font-medium text-gray-700">No branches found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {search ? "No branches matching your search." : "Get started by adding your first branch or outlet."}
                      </p>
                      {!search && (
                        <CustomButton onClick={handleOpenCreate} className="mt-4">
                          <Plus size={14} className="mr-1.5" /> Add Branch
                        </CustomButton>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Branch Modal */}
      <CustomModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? "Edit Branch" : "Add New Branch"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <CustomInput
                type="text"
                placeholder="e.g. Gulshan Outlet"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Branch Code <span className="text-gray-400 font-normal">(e.g. BR-GULSHAN)</span>
              </label>
              <CustomInput
                type="text"
                placeholder="e.g. BR-GULSHAN"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <CustomInput
                type="text"
                placeholder="e.g. +880 1711-000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <CustomInput
                type="email"
                placeholder="e.g. branch@blueoceanspos.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Physical Address
            </label>
            <CustomInput
              type="text"
              placeholder="e.g. Level 2, Road 11, Gulshan-1, Dhaka"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <CustomButton type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingBranch ? "Update Branch" : "Create Branch"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>
    </div>
  );
}