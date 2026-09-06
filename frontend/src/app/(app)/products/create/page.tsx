"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }
interface Unit { id: string; name: string; }
interface Supplier { id: string; name: string; }

interface VariantForm {
  name: string;
  sku: string;
  barcode: string;
  costPrice: string;
  sellingPrice: string;
  wholesalePrice: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [form, setForm] = useState({
    name: "", sku: "", barcode: "", categoryId: "", brandId: "", unitId: "",
    supplierId: "", manufacturer: "", productType: "SIMPLE", costPrice: "",
    sellingPrice: "", wholesalePrice: "", minPrice: "", maxPrice: "",
    taxRate: "", warrantyDays: "", description: "",
  });

  const [variants, setVariants] = useState<VariantForm[]>([]);

  async function loadFormData() {
    try {
      const [catRes, brandRes, unitRes, supRes] = await Promise.all([
        api.get<{ data: Category[] }>("/v1/products?limit=1").catch(() => ({ data: [] })),
        api.get<{ data: any }>("/v1/products?limit=1").catch(() => ({ data: [] })),
        api.get<{ data: any }>("/v1/products?limit=1").catch(() => ({ data: [] })),
        api.get<{ data: any }>("/v1/products?limit=1").catch(() => ({ data: [] })),
      ]);
      // Placeholder — in production these would be separate endpoints
    } catch (err) {
      console.error("Failed to load form data:", err);
    }
  }

  useEffect(() => {
    loadFormData();
  }, []);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { name: "", sku: "", barcode: "", costPrice: "", sellingPrice: "", wholesalePrice: "" }]);
  }

  function updateVariant(index: number, field: string, value: string) {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.sku) {
      setError("Name and SKU are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const body: any = {
        name: form.name,
        sku: form.sku,
        barcode: form.barcode || undefined,
        categoryId: form.categoryId || undefined,
        brandId: form.brandId || undefined,
        unitId: form.unitId || undefined,
        supplierId: form.supplierId || undefined,
        manufacturer: form.manufacturer || undefined,
        productType: form.productType,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : 0,
        sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : 0,
        wholesalePrice: form.wholesalePrice ? parseFloat(form.wholesalePrice) : undefined,
        minPrice: form.minPrice ? parseFloat(form.minPrice) : undefined,
        maxPrice: form.maxPrice ? parseFloat(form.maxPrice) : undefined,
        taxRate: form.taxRate ? parseFloat(form.taxRate) : undefined,
        warrantyDays: form.warrantyDays ? parseInt(form.warrantyDays) : undefined,
        description: form.description || undefined,
      };

      if (variants.length > 0) {
        body.variants = variants.filter((v) => v.name && v.sku).map((v) => ({
          name: v.name,
          sku: v.sku,
          barcode: v.barcode || undefined,
          costPrice: v.costPrice ? parseFloat(v.costPrice) : undefined,
          sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : undefined,
          wholesalePrice: v.wholesalePrice ? parseFloat(v.wholesalePrice) : undefined,
        }));
      }

      await api.post("/v1/products", body);
      router.push("/products");
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new product to your catalog</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Basic Info */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Basic Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Product Name *</label>
              <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className={inputClass} placeholder="e.g. Wireless Bluetooth Earbuds" required />
            </div>
            <div>
              <label className={labelClass}>SKU *</label>
              <input type="text" value={form.sku} onChange={(e) => updateForm("sku", e.target.value)} className={inputClass} placeholder="e.g. SKU-1001" required />
            </div>
            <div>
              <label className={labelClass}>Barcode</label>
              <input type="text" value={form.barcode} onChange={(e) => updateForm("barcode", e.target.value)} className={inputClass} placeholder="e.g. 6901234567890" />
            </div>
            <div>
              <label className={labelClass}>Product Type</label>
              <select value={form.productType} onChange={(e) => updateForm("productType", e.target.value)} className={inputClass}>
                <option value="SIMPLE">Simple</option>
                <option value="VARIABLE">Variable</option>
                <option value="SERVICE">Service</option>
                <option value="BUNDLE">Bundle</option>
                <option value="KIT">Kit</option>
                <option value="RECIPE">Recipe</option>
                <option value="BATCH_CONTROLLED">Batch Controlled</option>
                <option value="SERIALIZED">Serialized</option>
                <option value="WEIGHTED">Weighted</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Manufacturer</label>
              <input type="text" value={form.manufacturer} onChange={(e) => updateForm("manufacturer", e.target.value)} className={inputClass} placeholder="Manufacturer name" />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.categoryId} onChange={(e) => updateForm("categoryId", e.target.value)} className={inputClass}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <select value={form.brandId} onChange={(e) => updateForm("brandId", e.target.value)} className={inputClass}>
                <option value="">Select brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <select value={form.unitId} onChange={(e) => updateForm("unitId", e.target.value)} className={inputClass}>
                <option value="">Select unit</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Supplier</label>
              <select value={form.supplierId} onChange={(e) => updateForm("supplierId", e.target.value)} className={inputClass}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Pricing</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Cost Price</label>
              <input type="number" step="0.01" value={form.costPrice} onChange={(e) => updateForm("costPrice", e.target.value)} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Selling Price *</label>
              <input type="number" step="0.01" value={form.sellingPrice} onChange={(e) => updateForm("sellingPrice", e.target.value)} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Wholesale Price</label>
              <input type="number" step="0.01" value={form.wholesalePrice} onChange={(e) => updateForm("wholesalePrice", e.target.value)} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Min Price</label>
              <input type="number" step="0.01" value={form.minPrice} onChange={(e) => updateForm("minPrice", e.target.value)} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Max Price</label>
              <input type="number" step="0.01" value={form.maxPrice} onChange={(e) => updateForm("maxPrice", e.target.value)} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Tax Rate (%)</label>
              <input type="number" step="0.01" value={form.taxRate} onChange={(e) => updateForm("taxRate", e.target.value)} className={inputClass} placeholder="e.g. 15" />
            </div>
          </div>
        </div>

        {/* Other */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Additional Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Warranty (days)</label>
              <input type="number" value={form.warrantyDays} onChange={(e) => updateForm("warrantyDays", e.target.value)} className={inputClass} placeholder="e.g. 365" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className={inputClass} rows={3} placeholder="Product description..." />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Variants</h3>
            <button type="button" onClick={addVariant} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              <Plus size={14} /> Add Variant
            </button>
          </div>
          {variants.map((variant, idx) => (
            <div key={idx} className="mb-3 rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Variant {idx + 1}</span>
                <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input type="text" value={variant.name} onChange={(e) => updateVariant(idx, "name", e.target.value)} className={inputClass} placeholder="Variant name (e.g. Red / XL)" />
                <input type="text" value={variant.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} className={inputClass} placeholder="SKU" />
                <input type="text" value={variant.barcode} onChange={(e) => updateVariant(idx, "barcode", e.target.value)} className={inputClass} placeholder="Barcode" />
                <input type="number" step="0.01" value={variant.costPrice} onChange={(e) => updateVariant(idx, "costPrice", e.target.value)} className={inputClass} placeholder="Cost Price" />
                <input type="number" step="0.01" value={variant.sellingPrice} onChange={(e) => updateVariant(idx, "sellingPrice", e.target.value)} className={inputClass} placeholder="Selling Price" />
                <input type="number" step="0.01" value={variant.wholesalePrice} onChange={(e) => updateVariant(idx, "wholesalePrice", e.target.value)} className={inputClass} placeholder="Wholesale Price" />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={() => router.push("/products")} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Create Product
          </button>
        </div>
      </form>
    </div>
  );
}
