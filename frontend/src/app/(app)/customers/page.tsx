"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, Search, Users, Eye, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  segmentation: string | null;
  currentDue: string;
  loyaltyPoints: number;
  status: string;
  createdAt: string;
  group?: { id: string; name: string } | null;
  _count: { sales: number; invoices: number; complaints: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSegmentation, setFilterSegmentation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const loadCustomers = useCallback(async (p: number, seg: string, status: string, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (q) params.set("search", q);
      if (seg) params.set("segmentation", seg);
      if (status) params.set("status", status);

      const result = await api.get<{ data: Customer[]; pagination: Pagination }>(`/v1/customers?${params}`);
      setCustomers(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error("Failed to load customers:", err);
      setError(err.message || "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers(page, filterSegmentation, filterStatus, search);
  }, [page, filterSegmentation, filterStatus, loadCustomers]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadCustomers(1, filterSegmentation, filterStatus, search);
  }

  async function deleteCustomer(id: string) {
    if (!confirm("Delete this customer?")) return;
    try {
      await api.del(`/v1/customers/${id}`);
      loadCustomers(page, filterSegmentation, filterStatus, search);
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  }

  const segColors: Record<string, string> = {
    VIP: "bg-yellow-100 text-yellow-700",
    REGULAR: "bg-gray-100 text-gray-700",
    WHOLESALE: "bg-blue-100 text-blue-700",
    CORPORATE: "bg-purple-100 text-purple-700",
    NEW: "bg-green-100 text-green-700",
    INACTIVE: "bg-red-100 text-red-700",
    HIGH_VALUE: "bg-orange-100 text-orange-700",
    AT_RISK: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your customer base & CRM</p>
        </div>
        <Link
          href="/customers/create"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Add Customer
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
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
          value={filterSegmentation}
          onChange={(e) => { setFilterSegmentation(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">All Segments</option>
          <option value="VIP">VIP</option>
          <option value="REGULAR">Regular</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="CORPORATE">Corporate</option>
          <option value="NEW">New</option>
          <option value="INACTIVE">Inactive</option>
          <option value="HIGH_VALUE">High Value</option>
          <option value="AT_RISK">At Risk</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <span className="text-sm text-gray-500">{pagination.total} customers</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Error loading customers</p>
          <p className="mt-1">{error}</p>
          <button onClick={() => loadCustomers(page, filterSegmentation, filterStatus, search)} className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-800">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No customers found</p>
          <Link href="/customers/create" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
            <Plus size={14} /> Add your first customer
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3 text-right">Due</th>
                <th className="px-4 py-3 text-right">Points</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{c.name}</p>
                      {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${segColors[c.segmentation || "REGULAR"] || "bg-gray-100 text-gray-700"}`}>
                      {c.segmentation || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.group?.name || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={Number(c.currentDue) > 0 ? "text-red-600 font-medium" : "text-gray-600"}>
                      {Number(c.currentDue).toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{c.loyaltyPoints}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{c._count.sales}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/customers/${c.id}`} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="View">
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => deleteCustomer(c.id)}
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
