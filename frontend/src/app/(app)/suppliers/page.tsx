"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Truck, Eye, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomTable, CustomTableColumn } from "@/components/custom/CustomTable";
import { ConfirmModal } from "@/components/custom/ConfirmModal";

interface Supplier {
  id: string;
  name: string;
  company: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  currentDue: string;
  creditLimit: string;
  deliveryPerformanceScore: number | null;
  qualityScore: number | null;
  status: string;
  createdAt: string;
  _count: { purchaseOrders: number; goodsReceipts: number; products: number };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadSuppliers = useCallback(async (p: number, l: number, status: string, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(l) });
      if (q) params.set("search", q);
      if (status) params.set("status", status);

      const result = await api.get<any>(`/v1/suppliers?${params}`);
      const rows = Array.isArray(result?.data?.data)
        ? result.data.data
        : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
        ? result
        : [];
      const totalCount = typeof result?.pagination?.total === "number"
        ? result.pagination.total
        : typeof result?.data?.total === "number"
        ? result.data.total
        : typeof result?.total === "number"
        ? result.total
        : rows.length;

      setSuppliers(rows);
      setTotal(totalCount);
    } catch (err: any) {
      console.error("Failed to load suppliers:", err);
      setError(err.message || "Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers(page, limit, filterStatus, search);
  }, [page, limit, filterStatus, loadSuppliers]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.del(`/v1/suppliers/${deleteId}`);
      setDeleteId(null);
      loadSuppliers(page, limit, filterStatus, search);
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const columns: CustomTableColumn<Supplier>[] = [
    {
      key: "name",
      header: "Supplier",
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-bold text-gray-600 text-sm">{s.name}</p>
          {s.company && <p className="text-xs text-slate-400">{s.company}</p>}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (s) => (
        <div>
          <p className="text-gray-600 text-sm">{s.contactPerson || "—"}</p>
          {s.phone && <p className="text-xs text-slate-400">{s.phone}</p>}
        </div>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (s) => <span className="text-gray-600 text-sm">{s.city || "—"}</span>,
    },
    {
      key: "currentDue",
      header: "Due Amount",
      align: "right",
      render: (s) => (
        <span className={Number(s.currentDue) > 0 ? "text-red-600 font-bold" : "text-gray-600 font-medium"}>
          ৳{Number(s.currentDue).toFixed(0)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (s) => (
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
            s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
          }`}
        >
          {s.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (s) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/suppliers/${s.id}`}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 transition"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteId(s.id)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
            title="Delete Supplier"
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
        title="Suppliers & Procurement"
        icon={<Truck size={20} />}
        items={[{ label: "Purchasing", href: "/purchasing/orders" }, { label: "Suppliers" }]}
        actions={
          <Link href="/suppliers/create">
            <CustomButton
              size="sm"
              leftIcon={<Plus size={14} />}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              Add Supplier
            </CustomButton>
          </Link>
        }
      />

      {/* Error Display */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
          Error loading suppliers: {error}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <span className="text-xs font-semibold text-slate-500">Total Suppliers: {total}</span>
        </div>

        {/* Custom Table with Server Pagination */}
        <CustomTable
          columns={columns}
          data={suppliers}
          rowKey={(s) => s.id}
          loading={loading}
          pageSize={limit}
          totalItems={total}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setLimit(s);
            setPage(1);
          }}
          emptyMessage="No suppliers found."
        />
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
        type="DANGER"
        loading={deleting}
      />
    </div>
  );
}
