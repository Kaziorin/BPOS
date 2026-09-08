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
  Layers,
  Tag,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Info,
  Check,
  X,
  ShoppingBag,
  Utensils,
  Pill,
  ShoppingCart,
  Truck,
  Factory,
  Wrench,
  Building2,
} from "lucide-react";
import { api, axiosClient } from "@/lib/api";
import { SearchableSelect, SearchableSelectOption } from "@/components/custom/SearchableSelect";
import { ImageUploader } from "@/components/custom/ImageUploader";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomCheckbox } from "@/components/custom/CustomCheckbox";
import { toast } from "react-toastify";
import {
  renderVerticalProductFields,
  initialVerticalFormState,
  VerticalFormState,
} from "@/components/products/ProductFormRegistry";

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

const BUSINESS_VERTICALS = [
  { id: "RETAIL", label: "Retail & Apparel", icon: ShoppingBag },
  { id: "RESTAURANT", label: "Restaurant & Food", icon: Utensils },
  { id: "PHARMACY", label: "Pharmacy & Medicine", icon: Pill },
  { id: "GROCERY", label: "Grocery & Scale", icon: ShoppingCart },
  { id: "WHOLESALE", label: "Wholesale B2B", icon: Truck },
  { id: "MANUFACTURING", label: "Manufacturing", icon: Factory },
  { id: "SALON", label: "Salon & Spa", icon: Sparkles },
  { id: "REPAIR", label: "Repair & Service", icon: Wrench },
  { id: "FRANCHISE", label: "Franchise Control", icon: Building2 },
];

export default function CreateProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Vertical Business Type Selector state
  const [selectedVertical, setSelectedVertical] = useState<string>("RETAIL");
  const [verticalFormState, setVerticalFormState] = useState<VerticalFormState>(initialVerticalFormState);

  const handleUpdateVertical = (module: keyof VerticalFormState, field: string, val: any) => {
    setVerticalFormState((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [field]: val,
      },
    }));
  };

  // Quick Create Modal state
  const [activeModal, setActiveModal] = useState<"BRAND" | "CATEGORY" | "SUBCATEGORY" | "UNIT" | "SUPPLIER" | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCode, setNewItemCode] = useState("");
  const [creatingItem, setCreatingItem] = useState(false);

  // Product Type selection
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
  });

  const [fetchedProductTypes, setFetchedProductTypes] = useState<any[]>([]);
  const [variants, setVariants] = useState<VariantForm[]>([]);

  const defaultTypeOptions: SearchableSelectOption[] = [
    { value: "Standard", label: "Standard Product (Physical item)" },
    { value: "Combo", label: "Combo / Kit (Package deal)" },
    { value: "Digital", label: "Digital / License (Non-physical download)" },
    { value: "Service", label: "Service (Labor or consulting)" },
    { value: "Weighted", label: "Weighted Product (Sold by weight/volume)" },
    { value: "Batch Controlled", label: "Batch Controlled (Lot & Expiry)" },
    { value: "Serialized", label: "Serialized (Unique serial number per item)" },
  ];

  const filteredFetchedProductTypes = fetchedProductTypes.filter((pt: any) => {
    if (!pt.businessTypes || pt.businessTypes.trim() === "") return true;
    const bts = pt.businessTypes.split(",").map((s: string) => s.trim().toUpperCase());
    return bts.length === 0 || bts.includes(selectedVertical.toUpperCase());
  });

  const productTypeOptions: SearchableSelectOption[] = (
    filteredFetchedProductTypes.length > 0 ? filteredFetchedProductTypes : (fetchedProductTypes.length === 0 ? defaultTypeOptions : filteredFetchedProductTypes)
  ).map((pt: any) => ({
    value: typeof pt === "string" ? pt : pt.name || pt.value,
    label: typeof pt === "string" ? pt : pt.name || pt.label,
  }));

  async function loadFormData() {
    try {
      const [catRes, brandRes, unitRes, supRes, typeRes] = await Promise.all([
        api.get<any>("/v1/products/categories").catch(() => ({ data: [] })),
        api.get<any>("/v1/brands").catch(() => ({ data: [] })),
        api.get<any>("/v1/units").catch(() => ({ data: [] })),
        api.get<any>("/v1/suppliers").catch(() => ({ data: [] })),
        api.get<any>("/v1/product-types").catch(() => ({ data: [] })),
      ]);

      setCategories(Array.isArray(catRes.data || catRes) ? catRes.data || catRes : []);
      setBrands(Array.isArray(brandRes.data || brandRes) ? brandRes.data || brandRes : []);
      setUnits(Array.isArray(unitRes.data || unitRes) ? unitRes.data || unitRes : []);
      setSuppliers(Array.isArray(supRes.data || supRes) ? supRes.data || supRes : []);
      setFetchedProductTypes(Array.isArray(typeRes.data || typeRes) ? typeRes.data || typeRes : []);

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

  async function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim() || !activeModal) return;
    setCreatingItem(true);
    try {
      if (activeModal === "BRAND") {
        const res: any = await api.post("/v1/brands", { name: newItemName });
        const newBrand = { id: res.id || res.data?.id, name: newItemName };
        setBrands((prev) => [...prev, newBrand]);
        updateForm("brandId", newBrand.id);
      } else if (activeModal === "CATEGORY") {
        const res: any = await api.post("/v1/products/categories", {
          name: newItemName,
          businessTypes: [selectedVertical],
        });
        const newCat = { id: res.id || res.data?.id, name: newItemName, parentId: null, businessTypes: selectedVertical };
        setCategories((prev) => [...prev, newCat]);
        updateForm("categoryId", newCat.id);
      } else if (activeModal === "SUBCATEGORY") {
        const res: any = await api.post("/v1/products/categories", {
          name: newItemName,
          parentId: form.categoryId || undefined,
          businessTypes: [selectedVertical],
        });
        const newSubCat = { id: res.id || res.data?.id, name: newItemName, parentId: form.categoryId, businessTypes: selectedVertical };
        setCategories((prev) => [...prev, newSubCat]);
        updateForm("subCategoryId", newSubCat.id);
      } else if (activeModal === "UNIT") {
        const res: any = await api.post("/v1/units", {
          name: newItemName,
          code: newItemCode || newItemName.toLowerCase().slice(0, 5),
        });
        const newUnit = { id: res.id || res.data?.id, name: newItemName, code: newItemCode };
        setUnits((prev) => [...prev, newUnit]);
        updateForm("unitId", newUnit.id);
      } else if (activeModal === "SUPPLIER") {
        const res: any = await api.post("/v1/suppliers", { name: newItemName, company: newItemCode });
        const newSup = { id: res.id || res.data?.id, name: newItemName, company: newItemCode };
        setSuppliers((prev) => [...prev, newSup]);
        updateForm("supplierId", newSup.id);
      }

      const modalLabel = activeModal === "BRAND" ? "Brand" : activeModal === "CATEGORY" ? "Category" : activeModal === "SUBCATEGORY" ? "Sub Category" : activeModal === "UNIT" ? "Unit" : "Supplier";
      toast.success(`${modalLabel} created successfully!`);

      setActiveModal(null);
      setNewItemName("");
      setNewItemCode("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create item");
    } finally {
      setCreatingItem(false);
    }
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
      let finalImageUrl = form.imageUrl || undefined;
      if (form.imageUrl && form.imageUrl.startsWith("data:")) {
        try {
          const res = await fetch(form.imageUrl);
          const blob = await res.blob();
          const formData = new FormData();
          formData.append("file", blob, "product_image.png");
          const uploadRes: any = await axiosClient.post("/api/v1/media/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          finalImageUrl = uploadRes?.data?.data?.url || uploadRes?.data?.url || uploadRes?.url || form.imageUrl;
        } catch (uploadErr) {
          console.warn("Failed to upload image during product submit:", uploadErr);
        }
      }

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
        imageUrl: finalImageUrl,
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
      setSuccessMsg("Product created successfully!");

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

  const barcodeOptions: SearchableSelectOption[] = [
    { value: "CODE128", label: "Code 128 (Standard)" },
    { value: "EAN13", label: "EAN-13 (Standard Retail)" },
    { value: "UPCA", label: "UPC-A (Universal)" },
    { value: "QRCODE", label: "QR Code Symbology" },
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

  const parentCatList = categories.filter((c: any) => {
    if (c.parentId) return false;
    if (!c.businessTypes) return true; // All Verticals
    const bts = c.businessTypes.split(",").map((s: string) => s.trim().toUpperCase());
    return bts.length === 0 || bts.includes(selectedVertical.toUpperCase());
  });
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
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize";

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Reusable Custom Breadcrumb Header */}
      <CustomBreadcrumb
        title="Add New Product"
        icon={<Package size={20} />}
        items={[{ label: "Catalog", href: "/products" }, { label: "Create Product" }]}
        actions={
          <div className="flex items-center gap-2">
            <CustomButton
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving}
              className="rounded-md text-xs font-semibold"
            >
              Save and Insert Another
            </CustomButton>
            <CustomButton
              type="button"
              size="sm"
              onClick={(e) => handleSubmit(e, false)}
              loading={saving}
              leftIcon={<Check size={14} />}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              Add Product
            </CustomButton>
          </div>
        }
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 animate-in slide-in-from-top-2">
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Main Grid Layout: Left Column (70%) & Right Sidebar (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-4">



          {/* DYNAMIC BUSINESS VERTICAL FORM FIELDS */}
          <div>
            {renderVerticalProductFields(selectedVertical, verticalFormState, handleUpdateVertical)}
          </div>

          {/* BOX 1: Basic Information */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Package className="h-4 w-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Basic Information
              </h2>
            </div>

            <div className="mb-4">
              <SearchableSelect
                label="Product Type"
                required
                options={productTypeOptions}
                value={productType}
                onChange={(val) => setProductType(val)}
                placeholder="Select Product Type..."
                onAddClick={() => router.push("/product-types")}
              />
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Wireless Ergonomic Mouse"
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
                    className="absolute right-2 text-slate-400 hover:text-teal-600 transition cursor-pointer"
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[15px] font-semibold text-gray-600 capitalize">Barcode Value</label>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Auto Generate Barcode
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
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ImageIcon className="h-4 w-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Product Media & Image
              </h2>
            </div>

            <ImageUploader
              value={form.imageUrl}
              onChange={(url) => updateForm("imageUrl", url)}
              label="Upload Product Feature Image"
            />
          </div>

          {/* BOX 3: Pricing */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4 text-teal-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">Pricing</h2>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <label className={labelClass}>
                  Product Cost (৳) <span className="text-red-500">*</span>
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

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[15px] font-semibold text-gray-600 capitalize">Profit Margin Mode & Value</label>

                  {/* Compact Sleek Toggle Button */}
                  <div className="inline-flex rounded-xs border border-slate-200 bg-slate-100/90 p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleMarginTypeChange("PERCENTAGE")}
                      className={`px-3 py-1 text-[11px] rounded-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                        marginType === "PERCENTAGE"
                          ? "bg-teal-600 text-white shadow-2xs scale-[1.02]"
                          : "text-slate-600 hover:text-gray-900 hover:bg-slate-200/60"
                      }`}
                    >
                      % Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarginTypeChange("FLAT")}
                      className={`px-3 py-1 text-[11px] rounded-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                        marginType === "FLAT"
                          ? "bg-teal-600 text-white shadow-2xs scale-[1.02]"
                          : "text-slate-600 hover:text-gray-900 hover:bg-slate-200/60"
                      }`}
                    >
                      Flat (৳)
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={marginValue}
                    onChange={(e) => handleMarginValueChange(e.target.value)}
                    className={`${inputClass} pr-8`}
                    placeholder={marginType === "PERCENTAGE" ? "25.00" : "50.00"}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                    {marginType === "PERCENTAGE" ? "%" : "৳"}
                  </span>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Selling Price (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => updateForm("sellingPrice", e.target.value)}
                  className={`${inputClass} font-bold text-teal-700 bg-teal-50/50`}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Wholesale Price (৳)</label>
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

              <div className="sm:col-span-2 flex items-center mt-3">
                <CustomCheckbox
                  label="Add Promotional Price"
                  checked={form.hasPromoPrice}
                  onChange={(e) => updateForm("hasPromoPrice", e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* BOX 4: Units */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Layers className="h-4 w-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">Units</h2>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <SearchableSelect
                  label="Product Unit"
                  required
                  options={unitOptions}
                  value={form.unitId}
                  onChange={(val) => updateForm("unitId", val)}
                  placeholder="Select Product Unit..."
                  onAddClick={() => setActiveModal("UNIT")}
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
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-4 w-4 text-teal-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">Variants</h2>
              </div>
            </div>

            <div className="space-y-3">
              <CustomCheckbox
                label="This product has variants (e.g. Size, Color)"
                checked={form.hasVariants}
                onChange={(e) => updateForm("hasVariants", e.target.checked)}
              />

              {form.hasVariants && (
                <div className="pt-2 space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-md border border-teal-200 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Variant Item
                    </button>
                  </div>

                  {variants.map((variant, idx) => (
                    <div key={idx} className="rounded-md border border-slate-200 bg-slate-50/60 p-3 relative space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-600">Variant #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
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
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Package className="h-4 w-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">Inventory Controls</h2>
            </div>

            <div className="space-y-3">
              <CustomCheckbox
                label="Initial Stock"
                description="Initial stock addition is available for single non-variant products"
                checked={form.hasInitialStock}
                onChange={(e) => updateForm("hasInitialStock", e.target.checked)}
              />

              <CustomCheckbox
                label="Warehouse Specific Pricing"
                description="Set custom prices for different warehouse locations"
                checked={form.hasDiffPriceWarehouse}
                onChange={(e) => updateForm("hasDiffPriceWarehouse", e.target.checked)}
              />

              <CustomCheckbox
                label="Batch & Expiry Date Tracking"
                description="Track lot numbers, manufacturing and expiry dates"
                checked={form.hasBatchExpiry}
                onChange={(e) => updateForm("hasBatchExpiry", e.target.checked)}
              />

              <CustomCheckbox
                label="IMEI / Serial Number Tracking"
                description="Track unique serial or IMEI numbers per item"
                checked={form.hasSerial}
                onChange={(e) => updateForm("hasSerial", e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN SIDEBAR (30%) */}
        <div className="lg:col-span-4 space-y-4">
          {/* SIDEBAR 1: Organization */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Layers className="h-4 w-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">Organization</h2>
            </div>

            <div className="space-y-3.5">
              <div>
                <SearchableSelect
                  label="Brand"
                  options={brandOptions}
                  value={form.brandId}
                  onChange={(val) => updateForm("brandId", val)}
                  placeholder="Select Brand..."
                  onAddClick={() => setActiveModal("BRAND")}
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
                  onAddClick={() => setActiveModal("CATEGORY")}
                />
              </div>

              <div>
                <SearchableSelect
                  label="Sub Category"
                  options={subCategoryOptions}
                  value={form.subCategoryId}
                  onChange={(val) => updateForm("subCategoryId", val)}
                  disabled={!form.categoryId}
                  disabledHint="Select Main Category First"
                  placeholder={
                    form.categoryId
                      ? subCategoryOptions.length > 0
                        ? "Select Sub Category..."
                        : "No Subcategories Found"
                      : "Select Main Category First"
                  }
                  onAddClick={() => setActiveModal("SUBCATEGORY")}
                />
              </div>

              <div>
                <SearchableSelect
                  label="Supplier"
                  options={supplierOptions}
                  value={form.supplierId}
                  onChange={(val) => updateForm("supplierId", val)}
                  placeholder="Select Supplier..."
                  onAddClick={() => setActiveModal("SUPPLIER")}
                />
              </div>
            </div>
          </div>

          {/* SIDEBAR 2: Status & Badges */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">Status & Badges</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-600">Featured Item</div>
                  <div className="text-[10px] text-slate-400">Featured product will be displayed in POS grid</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm("isFeatured", !form.isFeatured)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.isFeatured ? "bg-teal-600" : "bg-slate-200"
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
                  <div className="text-xs font-semibold text-gray-600">Embedded Barcode</div>
                  <div className="text-[10px] text-slate-400">Check for weight scale barcode scanning</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm("isEmbeddedBarcode", !form.isEmbeddedBarcode)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.isEmbeddedBarcode ? "bg-teal-600" : "bg-slate-200"
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

          {/* SIDEBAR 3: Warranty & Guarantee */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">
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

          {/* SIDEBAR 4: Inventory Settings */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Info className="h-4 w-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">
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

      {/* QUICK CREATE POPUP MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-gray-600">
                Quick Add {activeModal === "BRAND" ? "Brand" : activeModal === "CATEGORY" ? "Main Category" : activeModal === "SUBCATEGORY" ? "Sub Category" : activeModal === "UNIT" ? "Unit" : "Supplier"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreate} className="space-y-3">
              <div>
                <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter ${activeModal.toLowerCase()} name...`}
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>

              {(activeModal === "UNIT" || activeModal === "SUPPLIER") && (
                <div>
                  <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">
                    {activeModal === "UNIT" ? "Unit Abbreviation / Code" : "Company Name (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    placeholder={activeModal === "UNIT" ? "e.g. kg, box, pcs" : "e.g. Company Ltd."}
                    className={inputClass}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                  className="rounded-md text-xs"
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  size="sm"
                  loading={creatingItem}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs"
                >
                  Save & Select
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
