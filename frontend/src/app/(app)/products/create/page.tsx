"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Image as ImageIcon,
  Barcode as BarcodeIcon,
  Layers,
  Tag,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Upload,
  Percent,
  Calculator,
  CheckCircle2,
  RefreshCw,
  Info,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { SearchableSelect, SearchableSelectOption } from "@/components/custom/SearchableSelect";

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}
interface Brand {
  id: string;
  name: string;
}
interface Unit {
  id: string;
  name: string;
  code?: string;
}
interface Supplier {
  id: string;
  name: string;
  company?: string;
}

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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Product Type Pill selection
  const [productType, setProductType] = useState<string>("Standard");

  // Pricing Mode: PERCENTAGE or FLAT
  const [marginType, setMarginType] = useState<string>("PERCENTAGE");
  const [marginValue, setMarginValue] = useState<string>("25.00");

  // Barcode type
  const [barcodeSymbology, setBarcodeSymbology] = useState<string>("CODE128");

  // Form State
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    categoryId: "",
    subCategoryId: "",
    brandId: "",
    unitId: "",
    saleUnitId: "",
    purchaseUnitId: "",
    supplierId: "",
    manufacturer: "",
    costPrice: "",
    sellingPrice: "",
    wholesalePrice: "",
    taxRate: "0",
    taxMethod: "Inclusive",
    warrantyValue: "",
    warrantyUnit: "Months",
    guaranteeValue: "",
    guaranteeUnit: "Months",
    dailySaleObjective: "",
    alertQuantity: "10",
    description: "",
    imageUrl: "",
    isFeatured: false,
    isEmbeddedBarcode: false,
    hasPromoPrice: false,
    hasVariants: false,
    hasInitialStock: false,
    hasDiffPriceWarehouse: false,
    hasBatchExpiry: false,
    hasSerial: false,
    kitchen: "",
    menuType: "",
    publishSocial: false,
    socialTitle: "",
    socialDescription: "",
    socialImageUrl: "",
  });

  const [variants, setVariants] = useState<VariantForm[]>([]);

  // Load Categories, Brands, Units, Suppliers
  async function loadFormData() {
    try {
      const [catRes, brandRes, unitRes, supRes] = await Promise.all([
        api.get<any>("/v1/products/categories").catch(() => ({ data: [] })),
        api.get<any>("/v1/brands").catch(() => ({ data: [] })),
        api.get<any>("/v1/units").catch(() => ({ data: [] })),
        api.get<any>("/v1/suppliers").catch(() => ({ data: [] })),
      ]);

      setCategories(Array.isArray(catRes.data || catRes) ? catRes.data || catRes : []);
      setBrands(Array.isArray(brandRes.data || brandRes) ? brandRes.data || brandRes : []);
      setUnits(Array.isArray(unitRes.data || unitRes) ? unitRes.data || unitRes : []);
      setSuppliers(Array.isArray(supRes.data || supRes) ? supRes.data || supRes : []);

      // Auto generate initial Product Code
      generateSku();
    } catch (err) {
      console.error("Failed to load options:", err);
    }
  }

  useEffect(() => {
    loadFormData();
  }, []);

  function generateSku() {
    const code = "PRD-" + Math.floor(100000 + Math.random() * 900000);
    setForm((prev) => ({ ...prev, sku: code }));
  }

  function generateBarcode() {
    let generated = "";
    if (barcodeSymbology === "EAN13") {
      generated = "890" + Math.floor(100000000 + Math.random() * 900000000);
    } else if (barcodeSymbology === "UPCA") {
      generated = "0" + Math.floor(10000000000 + Math.random() * 90000000000);
    } else {
      generated = "BC-" + Math.floor(10000000 + Math.random() * 90000000);
    }
    setForm((prev) => ({ ...prev, barcode: generated }));
  }

  function updateForm(field: string, value: any) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "categoryId") {
        next.subCategoryId = "";
      }
      return next;
    });
  }

  // Price calculations
  function handleCostChange(cost: string) {
    updateForm("costPrice", cost);
    computeSellingPrice(cost, marginType, marginValue);
  }

  function handleMarginTypeChange(typeVal: string) {
    setMarginType(typeVal);
    computeSellingPrice(form.costPrice, typeVal, marginValue);
  }

  function handleMarginValueChange(val: string) {
    setMarginValue(val);
    computeSellingPrice(form.costPrice, marginType, val);
  }

  function computeSellingPrice(costStr: string, typeVal: string, valStr: string) {
    const cost = parseFloat(costStr);
    const val = parseFloat(valStr);
    if (isNaN(cost) || cost <= 0 || isNaN(val)) return;

    let selling = cost;
    if (typeVal === "PERCENTAGE") {
      selling = cost + (cost * val) / 100;
    } else {
      selling = cost + val;
    }
    updateForm("sellingPrice", selling.toFixed(2));
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { name: "", sku: "", barcode: "", costPrice: "", sellingPrice: "", wholesalePrice: "" },
    ]);
  }

  function updateVariant(index: number, field: string, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent, andInsertAnother = false) {
    if (e) e.preventDefault();
    if (!form.name || !form.sku) {
      setError("Product Name and Product Code (SKU) are required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    // Map ProductType string to DB Enum
    const typeEnumMap: Record<string, string> = {
      Standard: "SIMPLE",
      Combo: "BUNDLE",
      Digital: "SERVICE",
      Service: "SERVICE",
      Weighted: "WEIGHTED",
      "Batch Controlled": "BATCH_CONTROLLED",
      Serialized: "SERIALIZED",
    };

    try {
      const body: any = {
        name: form.name,
        sku: form.sku,
        barcode: form.barcode || undefined,
        categoryId: form.categoryId || undefined,
        subCategoryId: form.subCategoryId || undefined,
        brandId: form.brandId || undefined,
        unitId: form.unitId || undefined,
        supplierId: form.supplierId || undefined,
        manufacturer: form.manufacturer || undefined,
        productType: typeEnumMap[productType] || "SIMPLE",
        costPrice: form.costPrice ? parseFloat(form.costPrice) : 0,
        sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : 0,
        wholesalePrice: form.wholesalePrice ? parseFloat(form.wholesalePrice) : undefined,
        taxRate: form.taxRate ? parseFloat(form.taxRate) : undefined,
        warrantyDays: form.warrantyValue ? parseInt(form.warrantyValue) * 30 : undefined,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
      };

      if (variants.length > 0 && form.hasVariants) {
        body.variants = variants
          .filter((v) => v.name && v.sku)
          .map((v) => ({
            name: v.name,
            sku: v.sku,
            barcode: v.barcode || undefined,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : undefined,
            sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : undefined,
            wholesalePrice: v.wholesalePrice ? parseFloat(v.wholesalePrice) : undefined,
          }));
      }

      await api.post("/v1/products", body);
      setSuccessMsg("Product added successfully!");

      if (andInsertAnother) {
        setForm({
          name: "",
          sku: "PRD-" + Math.floor(100000 + Math.random() * 900000),
          barcode: "",
          categoryId: "",
          subCategoryId: "",
          brandId: "",
          unitId: "",
          saleUnitId: "",
          purchaseUnitId: "",
          supplierId: "",
          manufacturer: "",
          costPrice: "",
          sellingPrice: "",
          wholesalePrice: "",
          taxRate: "0",
          taxMethod: "Inclusive",
          warrantyValue: "",
          warrantyUnit: "Months",
          guaranteeValue: "",
          guaranteeUnit: "Months",
          dailySaleObjective: "",
          alertQuantity: "10",
          description: "",
          imageUrl: "",
          isFeatured: false,
          isEmbeddedBarcode: false,
          hasPromoPrice: false,
          hasVariants: false,
          hasInitialStock: false,
          hasDiffPriceWarehouse: false,
          hasBatchExpiry: false,
          hasSerial: false,
          kitchen: "",
          menuType: "",
          publishSocial: false,
          socialTitle: "",
          socialDescription: "",
          socialImageUrl: "",
        });
        setVariants([]);
      } else {
        setTimeout(() => {
          router.push("/products");
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  // Dropdown options formatting for SearchableSelect
  const barcodeOptions: SearchableSelectOption[] = [
    { value: "CODE128", label: "Code 128 (Standard)" },
    { value: "EAN13", label: "EAN-13 (Standard Retail)" },
    { value: "UPCA", label: "UPC-A (Universal)" },
    { value: "QRCODE", label: "QR Code Symbology" },
  ];

  const marginTypeOptions: SearchableSelectOption[] = [
    { value: "PERCENTAGE", label: "Percentage (%)" },
    { value: "FLAT", label: "Flat Amount (৳)" },
  ];

  const taxMethodOptions: SearchableSelectOption[] = [
    { value: "Inclusive", label: "Inclusive" },
    { value: "Exclusive", label: "Exclusive" },
  ];

  const periodUnitOptions: SearchableSelectOption[] = [
    { value: "Months", label: "Months" },
    { value: "Years", label: "Years" },
    { value: "Days", label: "Days" },
  ];

  const brandOptions: SearchableSelectOption[] = brands.map((b) => ({
    value: b.id,
    label: b.name,
  }));

  const parentCatList = categories.filter((c) => !c.parentId);
  const categoryOptions: SearchableSelectOption[] = parentCatList.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const subCatList = form.categoryId
    ? categories.filter((c) => c.parentId === form.categoryId)
    : [];
  const subCategoryOptions: SearchableSelectOption[] = subCatList.map((sc) => ({
    value: sc.id,
    label: sc.name,
  }));

  const unitOptions: SearchableSelectOption[] = units.map((u) => ({
    value: u.id,
    label: `${u.name} ${u.code ? `(${u.code})` : ""}`,
  }));

  const supplierOptions: SearchableSelectOption[] = suppliers.map((s) => ({
    value: s.id,
    label: `${s.name} ${s.company ? `(${s.company})` : ""}`,
  }));

  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1";

  return (
    <div className="w-full max-w-full space-y-4 p-2 sm:p-4 bg-slate-50/50 min-h-screen">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-md border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Add Product</h1>
            <p className="text-[11px] text-slate-500">Create new item with pricing, barcode & inventory</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={saving}
            className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            Save and Insert Another
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            ✓ Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Main Grid: Left Column (70%) & Right Sidebar (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN - 8 out of 12 cols (~70%) */}
        <div className="lg:col-span-8 space-y-4">
          {/* BOX 1: Basic Information */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3.5 text-slate-800">
              <Package className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Basic Information
              </h2>
            </div>

            {/* Product Type Pills */}
            <div className="mb-4">
              <label className={labelClass}>
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  "Standard",
                  "Combo",
                  "Digital",
                  "Service",
                  "Weighted",
                  "Batch Controlled",
                  "Serialized",
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProductType(type)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
                      productType === type
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className={inputClass}
                  placeholder="Enter product title..."
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Product Code (SKU) <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => updateForm("sku", e.target.value)}
                    className={`${inputClass} pr-8`}
                    placeholder="e.g. PRD-1001"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateSku}
                    className="absolute right-2 text-slate-400 hover:text-indigo-600 transition"
                    title="Generate New SKU"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <SearchableSelect
                  label="Barcode Symbology"
                  required
                  options={barcodeOptions}
                  value={barcodeSymbology}
                  onChange={(val) => setBarcodeSymbology(val)}
                  placeholder="Select Code..."
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Barcode Value</label>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" /> Auto Generate Barcode
                  </button>
                </div>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => updateForm("barcode", e.target.value)}
                  className={inputClass}
                  placeholder="Enter barcode or click Auto Generate"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Product Details / Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  className={`${inputClass} min-h-[90px]`}
                  rows={3}
                  placeholder="Enter detailed description of the product..."
                />
              </div>
            </div>
          </div>

          {/* BOX 2: Media */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3.5">
              <div className="flex items-center gap-2 text-slate-800">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Media</h2>
              </div>
              <span className="text-[11px] text-slate-400">JPEG, JPG, PNG, GIF • Direct URL or Drag Image</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-12 items-center">
              <div className="sm:col-span-8 space-y-2">
                <label className={labelClass}>Product Image Link (URL)</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => updateForm("imageUrl", e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-[11px] text-slate-400">Paste direct web image link to preview below</p>
              </div>

              <div className="sm:col-span-4 flex justify-center">
                <div className="flex h-24 w-full items-center justify-center rounded-md border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 overflow-hidden">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="mx-auto h-5 w-5 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 block">Drop image URL here</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BOX 3: Pricing */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3.5">
              <div className="flex items-center gap-2 text-slate-800">
                <DollarSign className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Pricing</h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>
                  Product Cost <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => handleCostChange(e.target.value)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Profit Margin Type"
                  required
                  options={marginTypeOptions}
                  value={marginType}
                  onChange={(val) => handleMarginTypeChange(val)}
                  placeholder="Select Type..."
                />
              </div>

              <div>
                <label className={labelClass}>Profit Margin</label>
                <input
                  type="number"
                  step="0.01"
                  value={marginValue}
                  onChange={(e) => handleMarginValueChange(e.target.value)}
                  className={inputClass}
                  placeholder="25.00"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Product Price (Selling) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => updateForm("sellingPrice", e.target.value)}
                  className={`${inputClass} font-bold text-indigo-700`}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Wholesale Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.wholesalePrice}
                  onChange={(e) => updateForm("wholesalePrice", e.target.value)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={labelClass}>Product Tax (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(e) => updateForm("taxRate", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 15"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Tax Method"
                  options={taxMethodOptions}
                  value={form.taxMethod}
                  onChange={(val) => updateForm("taxMethod", val)}
                  placeholder="Select Method..."
                />
              </div>

              <div className="sm:col-span-2 flex items-center mt-5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasPromoPrice}
                    onChange={(e) => updateForm("hasPromoPrice", e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Add Promotional Price
                </label>
              </div>
            </div>
          </div>

          {/* BOX 4: Units */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3.5 text-slate-800">
              <Layers className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Units</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <SearchableSelect
                  label="Product Unit"
                  required
                  options={unitOptions}
                  value={form.unitId}
                  onChange={(val) => updateForm("unitId", val)}
                  placeholder="Select Product Unit..."
                  onAddClick={() => alert("Add Unit Modal")}
                />
              </div>

              <div>
                <SearchableSelect
                  label="Sale Unit"
                  options={unitOptions}
                  value={form.saleUnitId}
                  onChange={(val) => updateForm("saleUnitId", val)}
                  placeholder="Nothing selected"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Purchase Unit"
                  options={unitOptions}
                  value={form.purchaseUnitId}
                  onChange={(val) => updateForm("purchaseUnitId", val)}
                  placeholder="Nothing selected"
                />
              </div>
            </div>
          </div>

          {/* BOX 5: Variants */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3.5">
              <div className="flex items-center gap-2 text-slate-800">
                <Tag className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Variants</h2>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasVariants}
                  onChange={(e) => updateForm("hasVariants", e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                This product has variant (e.g. Size, Color)
              </label>

              {form.hasVariants && (
                <div className="pt-2 space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Variant Item
                    </button>
                  </div>

                  {variants.map((variant, idx) => (
                    <div key={idx} className="rounded-md border border-slate-200 bg-slate-50 p-3 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600">Variant #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(idx, "name", e.target.value)}
                          className={inputClass}
                          placeholder="Name (Red / XL)"
                        />
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                          className={inputClass}
                          placeholder="SKU"
                        />
                        <input
                          type="text"
                          value={variant.barcode}
                          onChange={(e) => updateVariant(idx, "barcode", e.target.value)}
                          className={inputClass}
                          placeholder="Barcode"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={variant.costPrice}
                          onChange={(e) => updateVariant(idx, "costPrice", e.target.value)}
                          className={inputClass}
                          placeholder="Cost"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={variant.sellingPrice}
                          onChange={(e) => updateVariant(idx, "sellingPrice", e.target.value)}
                          className={inputClass}
                          placeholder="Selling"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={variant.wholesalePrice}
                          onChange={(e) => updateVariant(idx, "wholesalePrice", e.target.value)}
                          className={inputClass}
                          placeholder="Wholesale"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BOX 6: Inventory Controls */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3.5 text-slate-800">
              <Package className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Inventory</h2>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasInitialStock}
                  onChange={(e) => updateForm("hasInitialStock", e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Initial Stock <span className="text-[11px] text-slate-400 ml-1">(This feature will not work for product with variants and batches)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasDiffPriceWarehouse}
                  onChange={(e) => updateForm("hasDiffPriceWarehouse", e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                This product has different price for different warehouse
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasBatchExpiry}
                  onChange={(e) => updateForm("hasBatchExpiry", e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                This product has batch and expired date
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasSerial}
                  onChange={(e) => updateForm("hasSerial", e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                This product has IMEI or Serial numbers
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - 4 out of 12 cols (~30% Sidebar) */}
        <div className="lg:col-span-4 space-y-4">
          {/* SIDEBAR BOX 1: Status */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3.5 text-slate-800">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Status</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Featured</div>
                  <div className="text-[10px] text-slate-400">Featured product will be displayed in POS</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm("isFeatured", !form.isFeatured)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.isFeatured ? "bg-indigo-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      form.isFeatured ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Embedded Barcode</div>
                  <div className="text-[10px] text-slate-400">Check this if product will be used in weight scale machine</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm("isEmbeddedBarcode", !form.isEmbeddedBarcode)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.isEmbeddedBarcode ? "bg-indigo-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      form.isEmbeddedBarcode ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SIDEBAR BOX 2: Organization */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3.5 text-slate-800">
              <Layers className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Organization</h2>
            </div>

            <div className="space-y-3">
              <div>
                <SearchableSelect
                  label="Brand"
                  options={brandOptions}
                  value={form.brandId}
                  onChange={(val) => updateForm("brandId", val)}
                  placeholder="Select Brand..."
                  onAddClick={() => alert("Add Brand Modal")}
                />
              </div>

              <div>
                <SearchableSelect
                  label="Category"
                  required
                  options={categoryOptions}
                  value={form.categoryId}
                  onChange={(val) => updateForm("categoryId", val)}
                  placeholder="Select Category..."
                  onAddClick={() => alert("Add Category Modal")}
                />
              </div>

              <div>
                <SearchableSelect
                  label="Sub Category"
                  options={subCategoryOptions}
                  value={form.subCategoryId}
                  onChange={(val) => updateForm("subCategoryId", val)}
                  disabled={!form.categoryId}
                  placeholder={
                    form.categoryId
                      ? subCategoryOptions.length > 0
                        ? "Select Sub Category..."
                        : "No Subcategories Found"
                      : "Select Category First"
                  }
                  onAddClick={() => alert("Add Subcategory Modal")}
                />
              </div>

              <div>
                <SearchableSelect
                  label="Supplier"
                  options={supplierOptions}
                  value={form.supplierId}
                  onChange={(val) => updateForm("supplierId", val)}
                  placeholder="Select Supplier..."
                  onAddClick={() => alert("Add Supplier Modal")}
                />
              </div>
            </div>
          </div>

          {/* SIDEBAR BOX 3: Warranty & Guarantee */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3.5 text-slate-800">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Warranty & Guarantee
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Warranty</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={form.warrantyValue}
                    onChange={(e) => updateForm("warrantyValue", e.target.value)}
                    className={inputClass}
                    placeholder="eg. 1"
                  />
                  <SearchableSelect
                    options={periodUnitOptions}
                    value={form.warrantyUnit}
                    onChange={(val) => updateForm("warrantyUnit", val)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Guarantee</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={form.guaranteeValue}
                    onChange={(e) => updateForm("guaranteeValue", e.target.value)}
                    className={inputClass}
                    placeholder="eg. 1"
                  />
                  <SearchableSelect
                    options={periodUnitOptions}
                    value={form.guaranteeUnit}
                    onChange={(val) => updateForm("guaranteeUnit", val)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR BOX 4: Inventory Settings */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3.5 text-slate-800">
              <Info className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Inventory Settings
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Daily Sale Objective</label>
                <input
                  type="number"
                  value={form.dailySaleObjective}
                  onChange={(e) => updateForm("dailySaleObjective", e.target.value)}
                  className={inputClass}
                  placeholder="0"
                />
              </div>

              <div>
                <label className={labelClass}>Alert Quantity (Reorder Level)</label>
                <input
                  type="number"
                  value={form.alertQuantity}
                  onChange={(e) => updateForm("alertQuantity", e.target.value)}
                  className={inputClass}
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
