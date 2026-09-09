"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Package, Eye, Edit3, Trash2, RotateCcw, Filter, Image as ImageIcon, Warehouse } from "lucide-react";
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
  totalStock?: number;
  status: string;
  createdAt: string;
  imageUrl?: string | null;
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
  
  // Filters & Search
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
  }, [page, limit, filterType, filterStatus, search, loadProducts]);

  function handleResetFilters() {
    setSearch("");
    setFilterType("");
    setFilterStatus("");
    setPage(1);
  }

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
      align: "left",
      sortable: true,
      render: (product) => {
        const imgUrl = (product as any).imageUrl || product.images?.[0]?.url;
        return (
          <div className="flex items-center gap-3">
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
            <Link
              href={`/products/${product.id}`}
              className="font-bold text-gray-700 text-xs hover:text-teal-600 transition block truncate max-w-[180px]"
            >
              {product.name}
            </Link>
          </div>
        );
      },
    },
    {
      key: "sku",
      header: "SKU",
      align: "center",
      sortable: true,
      render: (product) => (
        <span className="font-mono text-xs font-semibold text-slate-700">{product.sku}</span>
      ),
    },
    {
      key: "barcode",
      header: "Barcode",
      align: "center",
      sortable: true,
      render: (product) => (
        product.barcode ? (
          <span className="font-mono text-xs text-slate-600">{product.barcode}</span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "category",
      header: "Category",
      align: "center",
      sortable: true,
      render: (product) => (
        <span className="text-xs font-medium text-slate-600">{product.category?.name || "—"}</span>
      ),
    },
    {
      key: "subCategory" as any,
      header: "Sub Category",
      align: "center",
      sortable: true,
      render: (product: any) => (
        product.subCategory?.name ? (
          <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 border border-teal-200">
            {product.subCategory.name}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "brand",
      header: "Brand",
      align: "center",
      sortable: true,
      render: (product) => (
        <span className="text-xs font-medium text-slate-600">{product.brand?.name || "—"}</span>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      align: "center",
      sortable: true,
      render: (product) => (
        <span className="text-xs font-semibold text-slate-700">{product.unit?.name || "—"}</span>
      ),
    },
    {
      key: "productType",
      header: "Type",
      align: "center",
      sortable: true,
      render: (product) => (
        <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
          {product.productType}
        </span>
      ),
    },
    {
      key: "totalStock",
      header: "Stock Qty",
      align: "center",
      sortable: true,
      getSortValue: (product) => product.totalStock ?? 0,
      render: (product: any) => {
        const stock = product.totalStock ?? 0;
        const variantCount = product.variants?.length || product._count?.variants || 0;
        return (
          <div className="flex flex-col items-center gap-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md border ${
                stock > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-600 border-rose-200"
              }`}
            >
              <Warehouse size={12} />
              <span>{stock} {product.unit?.name ? `(${product.unit.name})` : ""}</span>
            </span>
            {variantCount > 0 && (
              <span className="text-[10px] font-semibold text-teal-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                {variantCount} Variants
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "costPrice",
      header: "Cost Price",
      align: "center",
      sortable: true,
      render: (product) => (
        <span className="text-xs text-slate-600 font-medium">৳{Number(product.costPrice || 0).toFixed(2)}</span>
      ),
    },
    {
      key: "sellingPrice",
      header: "Selling Price",
      align: "center",
      sortable: true,
      render: (product) => (
        <span className="text-xs font-bold text-gray-700">৳{Number(product.sellingPrice || 0).toFixed(2)}</span>
      ),
    },
    {
      key: "wholesalePrice",
      header: "Wholesale Price",
      align: "center",
      sortable: true,
      render: (product) => (
        product.wholesalePrice ? (
          <span className="text-xs text-slate-600 font-semibold">৳{Number(product.wholesalePrice).toFixed(2)}</span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "supplier" as any,
      header: "Supplier",
      align: "center",
      sortable: true,
      render: (product: any) => (
        <span className="text-xs font-medium text-slate-600">{product.supplier?.name || "—"}</span>
      ),
    },
    {
      key: "manufacturer" as any,
      header: "Manufacturer",
      align: "center",
      sortable: true,
      render: (product: any) => (
        <span className="text-xs font-medium text-slate-600">{product.manufacturer || "—"}</span>
      ),
    },
    {
      key: "taxRate" as any,
      header: "Tax Rate",
      align: "center",
      sortable: true,
      render: (product: any) => (
        product.taxRate ? (
          <span className="text-xs font-semibold text-slate-700">{product.taxRate}%</span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "warrantyDays" as any,
      header: "Warranty",
      align: "center",
      sortable: true,
      render: (product: any) => (
        product.warrantyDays ? (
          <span className="text-xs font-semibold text-slate-700">{Math.round(product.warrantyDays / 30)} Mos</span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "symbology" as any,
      header: "Symbology",
      align: "center",
      sortable: true,
      render: (product: any) => (
        product.attributes?.barcodeSymbology ? (
          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {product.attributes.barcodeSymbology}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "saleUnit" as any,
      header: "Sale Unit",
      align: "center",
      sortable: true,
      render: (product: any) => (
        <span className="text-xs font-medium text-slate-600">{product.attributes?.saleUnitName || "—"}</span>
      ),
    },
    {
      key: "purchaseUnit" as any,
      header: "Purchase Unit",
      align: "center",
      sortable: true,
      render: (product: any) => (
        <span className="text-xs font-medium text-slate-600">{product.attributes?.purchaseUnitName || "—"}</span>
      ),
    },
    {
      key: "taxMethod" as any,
      header: "Tax & Method",
      align: "center",
      sortable: true,
      render: (product: any) => (
        product.taxRate ? (
          <span className="text-xs font-semibold text-slate-700">
            {product.taxRate}% {product.attributes?.taxMethod ? `(${product.attributes.taxMethod})` : ""}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "guarantee" as any,
      header: "Guarantee",
      align: "center",
      sortable: true,
      render: (product: any) => (
        product.attributes?.guaranteeValue ? (
          <span className="text-xs font-semibold text-slate-700">
            {product.attributes.guaranteeValue} {product.attributes.guaranteeUnit || "Months"}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "dailyTarget" as any,
      header: "Daily Target",
      align: "center",
      sortable: true,
      render: (product: any) => (
        product.attributes?.dailySaleObjective ? (
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            {product.attributes.dailySaleObjective} Qty
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "reorderPoint" as any,
      header: "Reorder Alert",
      align: "center",
      sortable: true,
      render: (product: any) => (
        product.reorderPoint !== undefined && product.reorderPoint !== null ? (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {product.reorderPoint}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      sortable: true,
      render: (product) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            product.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-500 border border-slate-200"
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
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/products/create?id=${product.id}`}
            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"
            title="Edit Product"
          >
            <Edit3 size={15} />
          </Link>
          <Link
            href={`/products/${product.id}`}
            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"
            title="View Details"
          >
            <Eye size={15} />
          </Link>
          <button
            onClick={() => setDeleteId(product.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
            title="Delete Product"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const hasActiveFilters = Boolean(search || filterType || filterStatus);

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Custom Breadcrumb Header */}
      <CustomBreadcrumb
        title="Products Catalog"
        icon={<Package size={20} />}
        items={[{ label: "Catalog", href: "/products" }, { label: "Products" }]}
        actions={
          <Link href="/products/create">
            <CustomButton
              size="sm"
              leftIcon={<Plus size={15} />}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              Add Product
            </CustomButton>
          </Link>
        }
      />

      {/* Error Notification */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Table & Controls Container */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or barcode..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>

            {/* Product Type Filter */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="">All Product Types</option>
              <option value="Standard">Standard Product</option>
              <option value="SIMPLE">Simple Item</option>
              <option value="Combo">Combo / Kit</option>
              <option value="Digital">Digital / License</option>
              <option value="Service">Service</option>
              <option value="Weighted">Weighted</option>
              <option value="Batch Controlled">Batch Controlled</option>
              <option value="Serialized">Serialized</option>
            </select>

            {/* Status Filter */}
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

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 hover:border-teal-300 transition"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Total Items: <strong className="text-gray-700">{total}</strong>
          </div>
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
          emptyMessage="No products found in catalog."
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

