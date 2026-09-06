"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Edit, Save, Plus, Trash2, Barcode, Tag } from "lucide-react";
import { api } from "@/lib/api";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => { loadProduct(); }, [id]);

  async function loadProduct() {
    try {
      const result = await api.get<{ data: any }>(`/v1/products/${id}`);
      setProduct(result.data);
      setForm(result.data);
    } catch (err) {
      console.error("Failed to load product:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/v1/products/${id}`, form);
      setEditing(false);
      await loadProduct();
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  if (!product) return <div className="p-6 text-center text-gray-500">Product not found</div>;

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/products")} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500">{product.sku} · {product.productType}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Edit size={14} /> Edit
            </button>
          )}
          {!editing && (
            <>
              <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/labels/barcode/${id}?qty=4`, "_blank")} className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Barcode size={14} /> Barcode Labels
              </button>
              <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/labels/shelf/${id}?qty=4`, "_blank")} className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Tag size={14} /> Shelf Labels
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Basic Info</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name</label>
              {editing ? <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{product.name}</p>}
            </div>
            <div>
              <label className={labelClass}>SKU</label>
              <p className="mt-1 font-mono text-sm text-gray-900">{product.sku}</p>
            </div>
            <div>
              <label className={labelClass}>Barcode</label>
              <p className="mt-1 font-mono text-sm text-gray-900">{product.barcode || "—"}</p>
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <p className="mt-1 text-sm text-gray-900">{product.productType}</p>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <p className="mt-1 text-sm text-gray-900">{product.category?.name || "—"}</p>
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <p className="mt-1 text-sm text-gray-900">{product.brand?.name || "—"}</p>
            </div>
            <div>
              <label className={labelClass}>Supplier</label>
              <p className="mt-1 text-sm text-gray-900">{product.supplier?.name || "—"}</p>
            </div>
            <div>
              <label className={labelClass}>Manufacturer</label>
              <p className="mt-1 text-sm text-gray-900">{product.manufacturer || "—"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Pricing</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Cost Price</label>
              {editing ? <input type="number" step="0.01" value={form.costPrice || ""} onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">৳{Number(product.costPrice).toFixed(2)}</p>}
            </div>
            <div>
              <label className={labelClass}>Selling Price</label>
              {editing ? <input type="number" step="0.01" value={form.sellingPrice || ""} onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) })} className={inputClass} /> : <p className="mt-1 text-sm font-medium text-gray-900">৳{Number(product.sellingPrice).toFixed(2)}</p>}
            </div>
            <div>
              <label className={labelClass}>Wholesale Price</label>
              <p className="mt-1 text-sm text-gray-900">{product.wholesalePrice ? `৳${Number(product.wholesalePrice).toFixed(2)}` : "—"}</p>
            </div>
            <div>
              <label className={labelClass}>Tax Rate</label>
              <p className="mt-1 text-sm text-gray-900">{product.taxRate ? `${product.taxRate}%` : "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Variants */}
      {product.variants?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Variants ({product.variants.length})</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="pb-2">Name</th><th className="pb-2">SKU</th><th className="pb-2">Barcode</th><th className="pb-2 text-right">Cost</th><th className="pb-2 text-right">Selling</th><th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {product.variants.map((v: any) => (
                <tr key={v.id}>
                  <td className="py-2 font-medium text-gray-900">{v.name}</td>
                  <td className="py-2 font-mono text-xs text-gray-600">{v.sku}</td>
                  <td className="py-2 font-mono text-xs text-gray-600">{v.barcode || "—"}</td>
                  <td className="py-2 text-right text-gray-600">{v.costPrice ? `৳${Number(v.costPrice).toFixed(2)}` : "—"}</td>
                  <td className="py-2 text-right font-medium text-gray-900">{v.sellingPrice ? `৳${Number(v.sellingPrice).toFixed(2)}` : "—"}</td>
                  <td className="py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${v.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{v.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock */}
      {product.stockRows?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Stock by Warehouse</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="pb-2">Warehouse</th><th className="pb-2 text-right">On Hand</th><th className="pb-2 text-right">Reserved</th><th className="pb-2 text-right">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {product.stockRows.map((s: any) => (
                <tr key={s.id}>
                  <td className="py-2 text-gray-900">{s.warehouse?.name || "—"}</td>
                  <td className="py-2 text-right text-gray-600">{s.qtyOnHand}</td>
                  <td className="py-2 text-right text-gray-600">{s.qtyReserved}</td>
                  <td className="py-2 text-right font-medium text-gray-900">{s.qtyOnHand - s.qtyReserved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
