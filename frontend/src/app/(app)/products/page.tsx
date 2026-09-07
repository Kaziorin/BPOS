"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, Search, Package, Eye, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomTable, CustomTableColumn } from "@/components/custom/CustomTable";
import { ConfirmModal } from "@/components/custom/ConfirmModal";

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadProducts = useCallback(async (p: number, l: number, type: string, status: string, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(l),
      });
      if (q) params.set("search", q);
      if (type) params.set("productType", type);
      if (status) params.set("status", status);

      const result = await api.get<any>(`/v1/products?${params}`);
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

      setProducts(rows);
      setTotal(totalCount);
    } catch (err: any) {
      console.error("Failed to load products:", err);
      setError(err.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(page, limit, filterType, filterStatus, search);
  }, [page, limit, filterType, filterStatus, loadProducts]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.del(`/v1/products/${deleteId}`);
      setDeleteId(null);
      loadProducts(page, limit, filterType, filterStatus, search);
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const columns: CustomTableColumn<Product>[] = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      render: (product) => {
        const imgUrl = (product as any).imageUrl || product.images?.[0]?.url;
        return (
          <div className="flex items-center gap-2.5">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={product.name}
                className="h-9 w-9 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-50"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                <Package size={16} />
              </div>
            )}
            <div>
              <p className="font-bold text-gray-600 text-sm">{product.name}</p>
              {product.brand && <p className="text-xs text-slate-400">{product.brand.name}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      render: (product) => <span className="font-mono text-xs text-slate-600">{product.sku}</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (product) => <span className="text-gray-600 text-sm">{product.category?.name || "—"}</span>,
    },
    {
      key: "productType",
      header: "Type",
      align: "center",
      render: (product) => (
        <span className="inline-flex rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 border border-teal-100">
          {product.productType}
        </span>
      ),
    },
    {
      key: "costPrice",
      header: "Cost",
      align: "right",
      render: (product) => <span className="text-gray-600">৳{Number(product.costPrice).toFixed(0)}</span>,
    },
    {
      key: "sellingPrice",
      header: "Selling Price",
      align: "right",
      render: (product) => <span className="font-bold text-gray-600">৳{Number(product.sellingPrice).toFixed(0)}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (product) => (
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
            product.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
          }`}
        >
          {product.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (product) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/products/${product.id}`}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 transition"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteId(product.id)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
            title="Delete Product"
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
        title="Products Catalog"
        icon={<Package size={20} />}
        items={[{ label: "Catalog", href: "/products" }, { label: "Products" }]}
        actions={
          <Link href="/products/create">
            <CustomButton
              size="sm"
              leftIcon={<Plus size={14} />}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              Add Product
            </CustomButton>
          </Link>
        }
      />

      {/* Error Display */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
          Error loading products: {error}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="">All Types</option>
              <option value="SIMPLE">Simple</option>
              <option value="VARIABLE">Variable</option>
              <option value="SERVICE">Service</option>
              <option value="BUNDLE">Bundle</option>
            </select>
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
          <span className="text-xs font-semibold text-slate-500">Total Products: {total}</span>
        </div>

        {/* Custom Table with Server Pagination */}
        <CustomTable
          columns={columns}
          data={products}
          rowKey={(p) => p.id}
          loading={loading}
          pageSize={limit}
          totalItems={total}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setLimit(s);
            setPage(1);
          }}
          emptyMessage="No products found."
        />
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        type="DANGER"
        loading={deleting}
      />
    </div>
  );
}
