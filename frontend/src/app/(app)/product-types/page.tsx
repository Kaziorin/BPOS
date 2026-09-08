"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Layers,
  Loader2,
  CheckCircle2,
  Edit3,
  Trash2,
  Search,
  Check,
  Shield,
  Tag,
  Sparkles,
  ShoppingBag,
  Utensils,
  Pill,
  ShoppingCart,
  Truck,
  Factory,
  Wrench,
  Building2,
} from "lucide-react";
import { api } from "@/lib/api";
import { ConfirmModal } from "@/components/custom/ConfirmModal";
import { CustomTable, CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { toast } from "react-toastify";

interface ProductTypeItem {
  id: string;
  name: string;
  status: string;
  businessTypes?: string | null;
  createdAt?: string;
}

const BUSINESS_VERTICALS = [
  { id: "RETAIL", label: "Retail", icon: ShoppingBag },
  { id: "RESTAURANT", label: "Restaurant", icon: Utensils },
  { id: "PHARMACY", label: "Pharmacy", icon: Pill },
  { id: "GROCERY", label: "Grocery", icon: ShoppingCart },
  { id: "WHOLESALE", label: "Wholesale", icon: Truck },
  { id: "MANUFACTURING", label: "Manufacturing", icon: Factory },
  { id: "SALON", label: "Salon", icon: Sparkles },
  { id: "REPAIR", label: "Repair", icon: Wrench },
  { id: "FRANCHISE", label: "Franchise", icon: Building2 },
];

export default function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [verticalFilter, setVerticalFilter] = useState<string>("");

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductTypeItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleBusinessType(vId: string) {
    setSelectedBusinessTypes((prev) =>
      prev.includes(vId) ? prev.filter((id) => id !== vId) : [...prev, vId]
    );
  }

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res: any = await api.get("/v1/product-types", {
        params: {
          search: searchQuery || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          businessType: verticalFilter || undefined,
        },
      });

      const rows = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      setProductTypes(rows);
    } catch (e: any) {
      console.error("Failed to load product types", e);
      setErrorMsg("Failed to load product types. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, verticalFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleOpenAddModal() {
    setEditingItem(null);
    setFormName("");
    setFormStatus("ACTIVE");
    setSelectedBusinessTypes([]);
    setModalOpen(true);
  }

  function handleOpenEditModal(item: ProductTypeItem) {
    setEditingItem(item);
    setFormName(item.name);
    setFormStatus(item.status || "ACTIVE");
    const parsedBt = item.businessTypes ? item.businessTypes.split(",").filter(Boolean) : [];
    setSelectedBusinessTypes(parsedBt);
    setModalOpen(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/v1/product-types/${editingItem.id}`, {
          name: formName,
          status: formStatus,
          businessTypes: selectedBusinessTypes,
        });
        toast.success("Product Type updated successfully!");
      } else {
        await api.post("/v1/product-types", {
          name: formName,
          status: formStatus,
          businessTypes: selectedBusinessTypes,
        });
        toast.success("New Product Type created successfully!");
      }
      setModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to save product type");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/v1/product-types/${deleteId}`);
      toast.success("Product Type deleted successfully.");
      setDeleteId(null);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product type");
    } finally {
      setDeleting(false);
    }
  }

  // Summary counts
  const totalTypes = productTypes.length;
  const activeTypes = productTypes.filter((t) => t.status === "ACTIVE").length;
  const inactiveTypes = productTypes.filter((t) => t.status === "INACTIVE").length;

  const tableColumns: CustomTableColumn<ProductTypeItem>[] = [
    {
      header: "#",
      key: "index",
      className: "w-14",
      render: (row) => (
        <span className="text-xs text-slate-400 font-semibold">{productTypes.indexOf(row) + 1}</span>
      ),
    },
    {
      header: "Product Type Name",
      key: "name",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
            <Layers size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-700 block">{row.name}</span>
          </div>
        </div>
      ),
    },

    {
      header: "Status",
      key: "status",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
            row.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition cursor-pointer"
            title="Edit Type"
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteId(row.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
            title="Delete Type"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Breadcrumb Header */}
      <CustomBreadcrumb
        title="Product Types Management"
        icon={<Layers size={20} />}
        items={[{ label: "Catalog", href: "/products" }, { label: "Product Types" }]}
        actions={
          <CustomButton
            type="button"
            size="sm"
            onClick={handleOpenAddModal}
            leftIcon={<Plus size={15} />}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
          >
            Add Product Type
          </CustomButton>
        }
      />

      {msg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          {msg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          ⚠️ {errorMsg}
        </div>
      )}



      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-md border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Types</div>
          <div className="text-lg font-bold text-gray-700 mt-0.5">{totalTypes}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Active Types</div>
          <div className="text-lg font-bold text-gray-700 mt-0.5">{activeTypes}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Inactive Types</div>
          <div className="text-lg font-bold text-gray-700 mt-0.5">{inactiveTypes}</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product types..."
              className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-600 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <CustomTable<ProductTypeItem>
          columns={tableColumns}
          data={productTypes}
          loading={loading}
          emptyMessage="No product types found."
        />
      </div>

      {/* ADD / EDIT MODAL */}
      <CustomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Product Type" : "Add New Product Type"}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">
              Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Gift Card, Medicine, Menu Item..."
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-gray-600 focus:border-teal-500 focus:outline-none"
              required
              autoFocus
            />
          </div>



          <div>
            <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-gray-600 focus:border-teal-500 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="rounded-md text-xs font-semibold"
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              size="sm"
              loading={saving}
              leftIcon={<Check size={14} />}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              {editingItem ? "Update Type" : "Create Type"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product Type"
        message="Are you sure you want to delete this product type? This action cannot be undone."
        type="DANGER"
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
