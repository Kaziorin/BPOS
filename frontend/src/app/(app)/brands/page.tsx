"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Building2,
  Loader2,
  CheckCircle2,
  Edit3,
  Trash2,
  Search,
  Check,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { ConfirmModal } from "@/components/custom/ConfirmModal";
import { CustomTable, CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";

interface Brand {
  id: string;
  name: string;
  status?: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // API Pagination & Filter State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status toggle
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>("/v1/brands", {
        params: {
          page,
          limit,
          search: searchQuery || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        },
      });

      const rows = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const totalCount = typeof res?.data?.total === "number"
        ? res.data.total
        : typeof res?.total === "number"
        ? res.total
        : rows.length;

      setBrands(rows);
      setTotal(totalCount);
    } catch (e) {
      console.error("Failed to load brands", e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleOpenAddModal() {
    setEditingBrand(null);
    setFormName("");
    setModalOpen(true);
  }

  function handleOpenEditModal(brand: Brand) {
    setEditingBrand(brand);
    setFormName(brand.name);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingBrand) {
        await api.put(`/v1/brands/${editingBrand.id}`, { name: formName });
        setMsg("Brand updated successfully!");
      } else {
        await api.post("/v1/brands", { name: formName });
        setMsg("Brand created successfully!");
      }
      setModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save brand");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res: any = await api.del(`/v1/brands/${deleteId}`);
      if (res?.deactivated) {
        setMsg(`Brand deactivated (${res.reason})`);
      } else {
        setMsg("Brand deleted!");
      }
      setDeleteId(null);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(b: Brand) {
    setTogglingId(b.id);
    const newStatus = b.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.put(`/v1/brands/${b.id}`, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  }

  const columns: CustomTableColumn<Brand>[] = [
    {
      key: "name",
      header: "Brand",
      sortable: true,
      render: (b) => (
        <span className="font-bold text-gray-600 text-sm">{b.name}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (b) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(b);
          }}
          disabled={togglingId === b.id}
          className="flex items-center justify-center gap-1 group cursor-pointer"
          title="Toggle status"
        >
          {togglingId === b.id ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : b.status === "ACTIVE" ? (
            <>
              <ToggleRight className="h-4.5 w-4.5 text-emerald-600" />
              <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 group-hover:bg-emerald-100 transition">
                Active
              </span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-4.5 w-4.5 text-red-400" />
              <span className="rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 group-hover:bg-red-100 transition">
                Inactive
              </span>
            </>
          )}
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (b) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEditModal(b)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 transition"
            title="Edit Brand"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteId(b.id)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
            title="Delete Brand"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Reusable Custom Breadcrumb Header */}
      <CustomBreadcrumb
        title="Brands & Manufacturers"
        icon={<Building2 size={20} />}
        items={[{ label: "Catalog", href: "/products" }, { label: "Brands" }]}
        actions={
          <CustomButton
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={handleOpenAddModal}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
          >
            Add New Brand
          </CustomButton>
        }
      />

      {/* Toast Notification */}
      {msg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {msg}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Search & Status Filter Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search brands..."
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Total Brands: {total}
          </span>
        </div>

        {/* Custom Table with API Pagination & Sorting */}
        <CustomTable
          columns={columns}
          data={brands}
          rowKey={(b) => b.id}
          loading={loading}
          pageSize={limit}
          totalItems={total}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setLimit(s);
            setPage(1);
          }}
          emptyMessage="No brands found matching your query."
        />
      </div>

      {/* Add / Edit Brand Modal */}
      <CustomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBrand ? "Edit Brand" : "Create New Brand"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Sony, Samsung, Nestlé, Unilever"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 focus:border-teal-500 focus:outline-none"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="rounded-md text-xs"
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              size="sm"
              loading={saving}
              leftIcon={<Check size={14} />}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs"
            >
              {editingBrand ? "Update Brand" : "Save Brand"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Brand"
        message="If brand is assigned to existing products, it will be safely deactivated instead of deleted."
        type="DANGER"
        loading={deleting}
      />
    </div>
  );
}
