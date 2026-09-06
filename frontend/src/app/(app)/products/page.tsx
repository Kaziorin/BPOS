"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, Search, Package, Edit, Eye, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  productType: string;
  costPrice: string;
  sellingPrice: string;
  wholesalePrice: string | null;
  status: string;
  createdAt: string;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  unit?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
  _count: { variants: number; stockRows: number };
  images?: { url: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadProducts = useCallback(async (p: number, type: string, status: string, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: "20",
      });
      if (q) params.set("search", q);
      if (type) params.set("productType", type);
      if (status) params.set("status", status);

      const result = await api.get<{ data: Product[]; pagination: Pagination }>(`/v1/products?${params}`);
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error("Failed to load products:", err);
      setError(err.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(page, filterType, filterStatus, search);
  }, [page, filterType, filterStatus, loadProducts]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadProducts(1, filterType, filterStatus, search);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await api.del(`/v1/products/${id}`);
      loadProducts(page, filterType, filterStatus, search);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  }

  const typeColors: Record<string, string> = {
    SIMPLE: "bg-gray-100 text-gray-700",
    VARIABLE: "bg-blue-100 text-blue-700",
    SERVICE: "bg-purple-100 text-purple-700",
    BUNDLE: "bg-orange-100 text-orange-700",
    KIT: "bg-yellow-100 text-yellow-700",
    RECIPE: "bg-green-100 text-green-700",
    BATCH_CONTROLLED: "bg-red-100 text-red-700",
    SERIALIZED: "bg-indigo-100 text-indigo-700",
    WEIGHTED: "bg-pink-100 text-pink-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your product catalog</p>
        </div>
        <Link
          href="/products/create"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
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
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="SIMPLE">Simple</option>
          <option value="VARIABLE">Variable</option>
          <option value="SERVICE">Service</option>
          <option value="BUNDLE">Bundle</option>
          <option value="KIT">Kit</option>
          <option value="RECIPE">Recipe</option>
          <option value="BATCH_CONTROLLED">Batch Controlled</option>
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
        <span className="text-sm text-gray-500">
          {pagination.total} products
        </span>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Error loading products</p>
          <p className="mt-1">{error}</p>
          <button onClick={() => loadProducts(page, filterType, filterStatus, search)} className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No products found</p>
          <Link href="/products/create" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
            <Plus size={14} /> Add your first product
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Variants</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.brand && <p className="text-xs text-gray-500">{product.brand.name}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{product.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[product.productType] || "bg-gray-100 text-gray-700"}`}>
                      {product.productType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{Number(product.costPrice).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{Number(product.sellingPrice).toFixed(0)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{product._count.variants}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${product.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/products/${product.id}`} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="View">
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        disabled={deleting === product.id}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
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
