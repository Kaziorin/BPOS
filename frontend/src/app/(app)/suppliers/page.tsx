"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, Search, Truck, Eye, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const loadSuppliers = useCallback(async (p: number, status: string, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (q) params.set("search", q);
      if (status) params.set("status", status);

      const result = await api.get<{ data: Supplier[]; pagination: Pagination }>(`/v1/suppliers?${params}`);
      setSuppliers(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error("Failed to load suppliers:", err);
      setError(err.message || "Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers(page, filterStatus, search);
  }, [page, filterStatus, loadSuppliers]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadSuppliers(1, filterStatus, search);
  }

  async function deleteSupplier(id: string) {
    if (!confirm("Delete this supplier?")) return;
    try {
      await api.del(`/v1/suppliers/${id}`);
      loadSuppliers(page, filterStatus, search);
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage suppliers & procurement</p>
        </div>
        <Link
          href="/suppliers/create"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Add Supplier
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Search
          </button>
        </form>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <span className="text-sm text-gray-500">{pagination.total} suppliers</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Error loading suppliers</p>
          <p className="mt-1">{error}</p>
          <button onClick={() => loadSuppliers(page, filterStatus, search)} className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-800">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Truck size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No suppliers found</p>
          <Link href="/suppliers/create" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
            <Plus size={14} /> Add your first supplier
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3 text-right">Due</th>
                <th className="px-4 py-3 text-center">Delivery Score</th>
                <th className="px-4 py-3 text-center">Quality</th>
                <th className="px-4 py-3 text-center">POs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      {s.company && <p className="text-xs text-gray-500">{s.company}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-600">{s.contactPerson || "—"}</p>
                    <p className="text-xs text-gray-500">{s.phone || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.city || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={Number(s.currentDue) > 0 ? "text-red-600 font-medium" : "text-gray-600"}>
                      ৳{Number(s.currentDue).toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.deliveryPerformanceScore != null ? (
                      <span className={`text-sm font-medium ${s.deliveryPerformanceScore >= 90 ? "text-green-600" : s.deliveryPerformanceScore >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                        {s.deliveryPerformanceScore}%
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.qualityScore != null ? (
                      <span className={`text-sm font-medium ${s.qualityScore >= 90 ? "text-green-600" : s.qualityScore >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                        {s.qualityScore}%
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{s._count.purchaseOrders}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/suppliers/${s.id}`} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="View">
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => deleteSupplier(s.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
