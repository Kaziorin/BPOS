"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Edit,
  Save,
  Plus,
  Trash2,
  Barcode,
  Tag,
  Package,
  DollarSign,
  Building,
  Layers,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
  Sparkles,
  Info,
  Warehouse,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { ConfirmModal } from "@/components/custom/ConfirmModal";
import { toast } from "react-toastify";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (searchParams?.get("edit") === "true") {
      setEditing(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {
    try {
      const result = await api.get<{ data: any }>(`/v1/products/${id}`);
      const data = result?.data || result;
      setProduct(data);
      setForm(data);
    } catch (err) {
      console.error("Failed to load product:", err);
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/v1/products/${id}`, form);
      toast.success("Product updated successfully!");
      setEditing(false);
      await loadProduct();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.del(`/v1/products/${id}`);
      toast.success("Product deleted successfully.");
      router.push("/products");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center bg-white rounded-md border border-slate-200 m-4">
        <AlertCircle className="mx-auto h-10 w-10 text-slate-400 mb-2" />
        <h3 className="text-base font-bold text-gray-700">Product Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested product could not be found or has been removed.</p>
        <Link href="/products">
          <CustomButton size="sm" className="bg-teal-600 text-white hover:bg-teal-700">
            Back to Products Catalog
          </CustomButton>
        </Link>
      </div>
    );
  }

  const cost = parseFloat(editing ? form.costPrice : product.costPrice) || 0;
  const selling = parseFloat(editing ? form.sellingPrice : product.sellingPrice) || 0;
  const profit = selling - cost;
  const marginPct = cost > 0 ? ((profit / cost) * 100).toFixed(1) : "0.0";

  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1";

  const imgUrl = product.imageUrl || product.images?.[0]?.url;

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Header Breadcrumb & Actions */}
      <CustomBreadcrumb
        title={product.name}
        icon={<Package size={20} />}
        items={[
          { label: "Catalog", href: "/products" },
          { label: "Products", href: "/products" },
          { label: product.sku || "Details" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/products")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>

            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm(product);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <CustomButton
                  size="sm"
                  onClick={handleSave}
                  loading={saving}
                  leftIcon={<Save size={14} />}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
                >
                  Save Changes
                </CustomButton>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/products/create?id=${id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100 transition cursor-pointer"
                >
                  <Edit size={14} /> Edit Product
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/labels/barcode/${id}?qty=4`,
                      "_blank"
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
                >
                  <Barcode size={14} /> Barcode
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/labels/shelf/${id}?qty=4`,
                      "_blank"
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
                >
                  <Tag size={14} /> Shelf Label
                </button>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
          </div>
        }
      />

      {/* TOP PROFILE HERO BANNER CARD */}
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={product.name}
                className="h-16 w-16 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-50 shadow-2xs"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-teal-50 text-teal-600 border border-teal-100 shrink-0 shadow-2xs">
                <Package size={30} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-800">{product.name}</h1>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    product.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {product.status}
                </span>
                <span className="inline-flex rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-200">
                  {product.productType}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                <span>
                  SKU: <strong className="font-mono text-gray-700">{product.sku}</strong>
                </span>
                {product.barcode && (
                  <span>
                    • Barcode: <strong className="font-mono text-gray-700">{product.barcode}</strong>
                  </span>
                )}
                {product.category && (
                  <span>
                    • Category: <strong className="text-gray-700">{product.category.name}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Financial Summary Pill Cards */}
          <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
            <div className="bg-slate-50 rounded-md border border-slate-200 px-3.5 py-2 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cost</span>
              <span className="text-sm font-bold text-gray-700">৳{Number(cost).toFixed(2)}</span>
            </div>
            <div className="bg-teal-50 rounded-md border border-teal-200 px-3.5 py-2 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block">Selling</span>
              <span className="text-sm font-bold text-teal-700">৳{Number(selling).toFixed(2)}</span>
            </div>
            <div className="bg-emerald-50 rounded-md border border-emerald-200 px-3.5 py-2 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Margin</span>
              <span className="text-sm font-bold text-emerald-700">+{marginPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Basic Info & Pricing */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Basic Information */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Info size={16} className="text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Product Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-xs font-semibold text-gray-800">{product.name}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>SKU Code</label>
                <p className="text-xs font-mono font-bold text-gray-700">{product.sku}</p>
              </div>

              <div>
                <label className={labelClass}>Barcode / EAN</label>
                {editing ? (
                  <input
                    type="text"
                    value={form.barcode || ""}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-xs font-mono font-semibold text-gray-700">{product.barcode || "—"}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Product Type</label>
                <p className="text-xs font-semibold text-gray-700">{product.productType}</p>
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <p className="text-xs font-semibold text-gray-700">{product.category?.name || "—"}</p>
              </div>

              <div>
                <label className={labelClass}>Sub Category</label>
                <p className="text-xs font-semibold text-gray-700">{product.subCategory?.name || "—"}</p>
              </div>

              <div>
                <label className={labelClass}>Brand</label>
                <p className="text-xs font-semibold text-gray-700">{product.brand?.name || "—"}</p>
              </div>

              <div>
                <label className={labelClass}>Unit of Measure</label>
                <p className="text-xs font-semibold text-gray-700">{product.unit?.name || "—"}</p>
              </div>

              <div>
                <label className={labelClass}>Supplier</label>
                <p className="text-xs font-semibold text-gray-700">{product.supplier?.name || "—"}</p>
              </div>

              <div>
                <label className={labelClass}>Manufacturer</label>
                {editing ? (
                  <input
                    type="text"
                    value={form.manufacturer || ""}
                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-xs font-semibold text-gray-700">{product.manufacturer || "—"}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Warranty (Days)</label>
                {editing ? (
                  <input
                    type="number"
                    value={form.warrantyDays || ""}
                    onChange={(e) => setForm({ ...form, warrantyDays: e.target.value })}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-xs font-semibold text-gray-700">{product.warrantyDays ? `${product.warrantyDays} Days` : "—"}</p>
                )}
              </div>
            </div>

            {product.description && (
              <div className="pt-2 border-t border-slate-100">
                <label className={labelClass}>Description</label>
                <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>

          {/* Card 2: Stock & Inventory Levels */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Warehouse size={16} className="text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Warehouse Stock & Inventory ({product.stockRows?.length || 0})
              </h2>
            </div>

            {product.stockRows?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2 px-3">Warehouse</th>
                      <th className="py-2 px-3 text-right">On Hand</th>
                      <th className="py-2 px-3 text-right">Reserved</th>
                      <th className="py-2 px-3 text-right">Net Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.stockRows.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-gray-700">
                          {s.warehouseName || s.warehouse?.name || "Main Warehouse"}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-600">{s.qtyOnHand || 0}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-400">{s.qtyReserved || 0}</td>
                        <td className="py-2 px-3 text-right font-bold text-teal-700">
                          {(s.qtyOnHand || 0) - (s.qtyReserved || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No warehouse stock records linked to this product.</p>
            )}
          </div>

          {/* Card 3: Variants Table (If variable) */}
          {product.variants?.length > 0 && (
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers size={16} className="text-teal-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Product Variants ({product.variants.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2 px-3">Variant Name</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Barcode</th>
                      <th className="py-2 px-3 text-right">Cost</th>
                      <th className="py-2 px-3 text-right">Selling</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.variants.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-gray-700">{v.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{v.sku}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{v.barcode || "—"}</td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {v.costPrice ? `৳${Number(v.costPrice).toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-gray-700">
                          {v.sellingPrice ? `৳${Number(v.sellingPrice).toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              v.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: Pricing & Margins Card */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Pricing Breakdown */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign size={16} className="text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Pricing & Tax Breakdown</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-xs text-slate-500">Cost Price:</span>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={form.costPrice || ""}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="w-28 rounded border border-slate-200 px-2 py-1 text-xs text-right font-bold"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-700">৳{Number(product.costPrice || 0).toFixed(2)}</span>
                )}
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-xs text-slate-500">Selling Price:</span>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={form.sellingPrice || ""}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    className="w-28 rounded border border-slate-200 px-2 py-1 text-xs text-right font-bold text-teal-700"
                  />
                ) : (
                  <span className="text-xs font-bold text-teal-700">৳{Number(product.sellingPrice || 0).toFixed(2)}</span>
                )}
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-xs text-slate-500">Wholesale Price:</span>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={form.wholesalePrice || ""}
                    onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                    className="w-28 rounded border border-slate-200 px-2 py-1 text-xs text-right"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-700">
                    {product.wholesalePrice ? `৳${Number(product.wholesalePrice).toFixed(2)}` : "—"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-xs text-slate-500">Min / Max Price:</span>
                <span className="text-xs font-medium text-slate-600">
                  {product.minPrice ? `৳${product.minPrice}` : "—"} / {product.maxPrice ? `৳${product.maxPrice}` : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-xs text-slate-500">Tax Rate (%):</span>
                {editing ? (
                  <input
                    type="number"
                    step="0.1"
                    value={form.taxRate || ""}
                    onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                    className="w-24 rounded border border-slate-200 px-2 py-1 text-xs text-right"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-700">
                    {product.taxRate ? `${product.taxRate}%` : "—"}
                  </span>
                )}
              </div>
            </div>

            {/* Calculated Profit Margin Banner */}
            <div className="rounded-md bg-teal-50 border border-teal-200 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-teal-800">
                <span>Profit per Unit:</span>
                <span>৳{profit.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-teal-600">
                <span>Profit Margin (%):</span>
                <span>+{marginPct}%</span>
              </div>
            </div>
          </div>

          {/* Card: Extended System Metadata */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles size={16} className="text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Metadata & System Info</h2>
            </div>

            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>Product ID:</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">{product.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created At:</span>
                <span className="font-medium text-slate-700">
                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        type="DANGER"
        loading={deleting}
      />
    </div>
  );
}

