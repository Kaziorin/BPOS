"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Lock,
  Scale,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { api, axiosClient } from "@/lib/api";
import {
  SearchableSelect,
  SearchableSelectOption,
  ImageUploader,
  CustomBreadcrumb,
  CustomButton,
  CustomCheckbox,
  CustomInput,
  CustomSelect,
  CustomDropdownSelect,
  CustomTextarea,
  CustomSwitch,
  CustomModal,
} from "@/components/custom";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth";
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

function normalizeVertical(bt?: string): string {
  const upper = (bt || "").toUpperCase().trim();
  if (upper.includes("GROCERY") || upper.includes("SUPERMARKET")) return "GROCERY";
  if (upper.includes("RESTAURANT") || upper.includes("FOOD") || upper.includes("CAFE")) return "RESTAURANT";
  if (upper.includes("PHARMACY") || upper.includes("MEDICINE") || upper.includes("HEALTHCARE")) return "PHARMACY";
  if (upper.includes("WHOLESALE") || upper.includes("DISTRIBUTION")) return "WHOLESALE";
  if (upper.includes("MANUFACTURING") || upper.includes("BAKERY")) return "MANUFACTURING";
  if (upper.includes("SALON") || upper.includes("SPA")) return "SALON";
  if (upper.includes("REPAIR") || upper.includes("SERVICE")) return "REPAIR";
  if (upper.includes("FRANCHISE")) return "FRANCHISE";
  if (upper.includes("RETAIL") || upper.includes("APPAREL")) return "RETAIL";
  return "RETAIL";
}

const BUSINESS_VERTICALS = [
  { id: "RESTAURANT", label: "Restaurant & Food", icon: Utensils },
  { id: "RETAIL", label: "Retail & Apparel", icon: ShoppingBag },
  { id: "PHARMACY", label: "Pharmacy & Medicine", icon: Pill },
  { id: "GROCERY", label: "Grocery & Scale", icon: ShoppingCart },
  { id: "WHOLESALE", label: "Wholesale B2B", icon: Truck },
  { id: "MANUFACTURING", label: "Manufacturing", icon: Factory },
  { id: "SALON", label: "Salon & Spa", icon: Sparkles },
  { id: "REPAIR", label: "Repair & Service", icon: Wrench },
  { id: "FRANCHISE", label: "Franchise Control", icon: Building2 },
];

const VERTICAL_THEME_MAP: Record<string, string> = {
  RESTAURANT: "restaurant-flame",
  GROCERY: "grocery-emerald",
  PHARMACY: "pharmacy-cyan",
  RETAIL: "retail-blue",
  WHOLESALE: "wholesale-action",
  SALON: "salon-rose",
  MANUFACTURING: "manufacturing-amber",
  REPAIR: "repair-violet",
  FRANCHISE: "franchise-corporate",
};

export default function CreateProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("id");
  const isEditMode = Boolean(editId);
  const { user } = useAuth();
  const isSuperAdmin = Boolean(
    (user as any)?.isSuperAdmin ||
    user?.role?.toLowerCase().includes("super") ||
    user?.roleName?.toLowerCase().includes("super")
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Vertical Business Type state - auto-detected purely from tenant / user
  const [selectedVertical, setSelectedVertical] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const tenantStr = localStorage.getItem("blueoceans_tenant");
        if (tenantStr) {
          const parsed = JSON.parse(tenantStr);
          if (parsed?.businessType) return normalizeVertical(parsed.businessType);
        }
        const userStr = localStorage.getItem("modernpos_user");
        if (userStr) {
          const parsed = JSON.parse(userStr);
          if (parsed?.businessType) return normalizeVertical(parsed.businessType);
        }
      } catch (e) {}
    }
    return "GROCERY";
  });
  const [verticalFormState, setVerticalFormState] = useState<VerticalFormState>(initialVerticalFormState);

  useEffect(() => {
    async function resolveTenantBusinessType() {
      try {
        const res: any = await api.get("/v1/tenant");
        const tData = res?.data || res?.tenant || res;
        const bt = tData?.tenant?.businessType || tData?.businessType;
        if (bt) {
          const norm = normalizeVertical(bt);
          setSelectedVertical(norm);
          if (typeof window !== "undefined") {
            try {
              const current = localStorage.getItem("blueoceans_tenant");
              const parsed = current ? JSON.parse(current) : {};
              localStorage.setItem(
                "blueoceans_tenant",
                JSON.stringify({ ...parsed, businessType: norm })
              );
            } catch (e) {}
          }
          return;
        }
      } catch (e) {
        console.warn("Failed to fetch fresh tenant info:", e);
      }

      // Fallback to user or local storage
      let fallbackBt = user?.businessType || "";
      if (!fallbackBt && typeof window !== "undefined") {
        try {
          const tenantStr = localStorage.getItem("blueoceans_tenant");
          if (tenantStr) fallbackBt = JSON.parse(tenantStr)?.businessType || "";
          if (!fallbackBt) {
            const userStr = localStorage.getItem("modernpos_user");
            if (userStr) fallbackBt = JSON.parse(userStr)?.businessType || "";
          }
        } catch (e) {}
      }
      if (fallbackBt) {
        setSelectedVertical(normalizeVertical(fallbackBt));
      }
    }

    resolveTenantBusinessType();
  }, [user]);

  const handleUpdateVertical = (module: keyof VerticalFormState, field: string, val: any) => {
    setVerticalFormState((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [field]: val,
      },
    }));
  };

  const isRestaurant = selectedVertical === "RESTAURANT" || selectedVertical === "FOOD";

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
    hasInitialStock: true,
    openingStock: "100",
    warehouseId: "",
    hasDiffPriceWarehouse: false,
    hasBatchExpiry: false,
    hasSerial: false,
  });

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [fetchedProductTypes, setFetchedProductTypes] = useState<any[]>([]);
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [configuredTaxRates, setConfiguredTaxRates] = useState<any[]>([]);
  const [defaultTaxRateConfig, setDefaultTaxRateConfig] = useState<{ rate: string; method: string }>({
    rate: "0",
    method: "Inclusive",
  });

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
      const [catRes, brandRes, unitRes, supRes, typeRes, taxRes, whRes] = await Promise.all([
        api.get<any>("/v1/products/categories").catch(() => ({ data: [] })),
        api.get<any>("/v1/brands").catch(() => ({ data: [] })),
        api.get<any>("/v1/units").catch(() => ({ data: [] })),
        api.get<any>("/v1/suppliers").catch(() => ({ data: [] })),
        api.get<any>("/v1/product-types").catch(() => ({ data: [] })),
        api.get<any>("/tax/rates").catch(() => ({ data: [] })),
        api.get<any>("/api/v1/warehouses").catch(() => ({ data: [] })),
      ]);

      setCategories(Array.isArray(catRes.data || catRes) ? catRes.data || catRes : []);
      setBrands(Array.isArray(brandRes.data || brandRes) ? brandRes.data || brandRes : []);
      setUnits(Array.isArray(unitRes.data || unitRes) ? unitRes.data || unitRes : []);
      setSuppliers(Array.isArray(supRes.data || supRes) ? supRes.data || supRes : []);
      setFetchedProductTypes(Array.isArray(typeRes.data || typeRes) ? typeRes.data || typeRes : []);

      const rawWh = Array.isArray(whRes?.data) ? whRes.data : Array.isArray(whRes) ? whRes : [];
      setWarehouses(rawWh);
      if (rawWh.length > 0) {
        setForm((prev) => ({
          ...prev,
          warehouseId: prev.warehouseId || rawWh[0].id,
        }));
      }

      // Resolve default VAT / Tax configured in /tax settings
      const rawRates = Array.isArray(taxRes?.data) ? taxRes.data : Array.isArray(taxRes) ? taxRes : [];
      const activeRates = rawRates.filter((r: any) => r.isActive !== false && r.status !== "INACTIVE");
      setConfiguredTaxRates(activeRates);

      const defaultRateObj = activeRates.find((r: any) => Boolean(r.isDefault || r.is_default)) || activeRates[0];
      if (defaultRateObj) {
        const rateVal = defaultRateObj.rate !== undefined && defaultRateObj.rate !== null ? String(Number(defaultRateObj.rate)) : "0";
        const methodVal = defaultRateObj.taxInclusive ? "Inclusive" : "Exclusive";
        setDefaultTaxRateConfig({ rate: rateVal, method: methodVal });
        if (!editId) {
          setForm((prev) => ({
            ...prev,
            taxRate: prev.taxRate === "0" || prev.taxRate === "" ? rateVal : prev.taxRate,
            taxMethod: prev.taxMethod || methodVal,
          }));
        }
      }

      generateSku();
    } catch (err) {
      console.error("Failed to load options:", err);
    }
  }

  useEffect(() => {
    loadFormData();
    if (editId) {
      loadExistingProduct(editId);
    }
  }, [editId]);

  async function loadExistingProduct(idToEdit: string) {
    try {
      const res: any = await api.get(`/v1/products/${idToEdit}`);
      const p = res?.data || res;
      if (p) {
        const reverseTypeMap: Record<string, string> = {
          SIMPLE: "Standard",
          BUNDLE: "Combo",
          SERVICE: "Service",
          WEIGHTED: "Weighted",
          BATCH_CONTROLLED: "Batch Controlled",
          SERIALIZED: "Serialized",
          RECIPE: "Standard",
        };

        setForm((prev) => ({
          ...prev,
          name: p.name || "",
          sku: p.sku || "",
          barcode: p.barcode || "",
          categoryId: p.categoryId || p.category?.id || "",
          subCategoryId: p.subCategoryId || p.subCategory?.id || "",
          brandId: p.brandId || p.brand?.id || "",
          unitId: p.unitId || p.unit?.id || "",
          supplierId: p.supplierId || p.supplier?.id || "",
          manufacturer: p.manufacturer || "",
          costPrice: p.costPrice !== undefined ? String(p.costPrice) : "",
          sellingPrice: p.sellingPrice !== undefined ? String(p.sellingPrice) : "",
          wholesalePrice: p.wholesalePrice !== undefined ? String(p.wholesalePrice) : "",
          taxRate: p.taxRate !== undefined ? String(p.taxRate) : "0",
          warrantyValue: p.warrantyDays ? String(Math.round(p.warrantyDays / 30)) : "",
          alertQuantity: p.reorderPoint !== undefined && p.reorderPoint !== null ? String(p.reorderPoint) : "10",
          description: p.description || "",
          imageUrl: p.imageUrl || "",
          hasVariants: Array.isArray(p.variants) && p.variants.length > 0,
        }));

        if (p.productType) {
          setProductType(reverseTypeMap[p.productType] || p.productType);
        }

        if (p.attributes) {
          try {
            const attrObj = typeof p.attributes === "string" ? JSON.parse(p.attributes) : p.attributes;
            if (attrObj && typeof attrObj === "object") {
              setVerticalFormState(attrObj);
              if (attrObj.barcodeSymbology) setBarcodeSymbology(attrObj.barcodeSymbology);

              setForm((prev) => ({
                ...prev,
                taxMethod: attrObj.taxMethod || prev.taxMethod,
                saleUnitId: attrObj.saleUnitId || prev.saleUnitId,
                purchaseUnitId: attrObj.purchaseUnitId || prev.purchaseUnitId,
                guaranteeValue: attrObj.guaranteeValue || prev.guaranteeValue,
                guaranteeUnit: attrObj.guaranteeUnit || prev.guaranteeUnit,
                dailySaleObjective: attrObj.dailySaleObjective || prev.dailySaleObjective,
                alertQuantity: attrObj.alertQuantity || prev.alertQuantity,
                isFeatured: attrObj.isFeatured ?? prev.isFeatured,
                isEmbeddedBarcode: attrObj.isEmbeddedBarcode ?? prev.isEmbeddedBarcode,
                hasPromoPrice: attrObj.hasPromoPrice ?? prev.hasPromoPrice,
                hasBatchExpiry: attrObj.hasBatchExpiry ?? prev.hasBatchExpiry,
                hasSerial: attrObj.hasSerial ?? prev.hasSerial,
              }));
            }
          } catch (e) {
            console.warn("Failed to parse product attributes:", e);
          }
        }

        if (Array.isArray(p.variants) && p.variants.length > 0) {
          setVariants(
            p.variants.map((v: any) => ({
              name: v.name || "",
              sku: v.sku || "",
              barcode: v.barcode || "",
              costPrice: v.costPrice ? String(v.costPrice) : "",
              sellingPrice: v.sellingPrice ? String(v.sellingPrice) : "",
              wholesalePrice: v.wholesalePrice ? String(v.wholesalePrice) : "",
            }))
          );
        }
      }
    } catch (err) {
      console.error("Failed to load existing product:", err);
      toast.error("Failed to load product details for editing");
    }
  }

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
    const safeVal =
      value && typeof value === "object" && ("target" in value || "nativeEvent" in value)
        ? Boolean((value as any).target?.checked)
        : value;
    setForm((prev) => {
      const next = { ...prev, [field]: safeVal };
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
        productType: productType || "Standard",
        costPrice: form.costPrice ? parseFloat(form.costPrice) : 0,
        sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : 0,
        wholesalePrice: form.wholesalePrice ? parseFloat(form.wholesalePrice) : undefined,
        taxRate: form.taxRate ? parseFloat(form.taxRate) : undefined,
        openingStock: form.hasInitialStock && form.openingStock !== "" ? parseFloat(form.openingStock) : undefined,
        warehouseId: form.hasInitialStock && form.warehouseId ? form.warehouseId : undefined,
        warrantyDays: form.warrantyValue ? parseInt(form.warrantyValue) * 30 : undefined,
        reorderPoint: form.alertQuantity ? parseFloat(form.alertQuantity) : undefined,
        description: form.description || undefined,
        imageUrl: finalImageUrl,
        attributes: {
          ...verticalFormState,
          barcodeSymbology,
          taxMethod: form.taxMethod,
          saleUnitId: form.saleUnitId,
          saleUnitName: units.find((u) => u.id === form.saleUnitId)?.name || "",
          purchaseUnitId: form.purchaseUnitId,
          purchaseUnitName: units.find((u) => u.id === form.purchaseUnitId)?.name || "",
          guaranteeValue: form.guaranteeValue,
          guaranteeUnit: form.guaranteeUnit,
          dailySaleObjective: form.dailySaleObjective,
          alertQuantity: form.alertQuantity,
          isFeatured: form.isFeatured,
          isEmbeddedBarcode: form.isEmbeddedBarcode,
          hasPromoPrice: form.hasPromoPrice,
          hasVariants: form.hasVariants,
          hasInitialStock: form.hasInitialStock,
          hasDiffPriceWarehouse: form.hasDiffPriceWarehouse,
          hasBatchExpiry: form.hasBatchExpiry,
          hasSerial: form.hasSerial,
        },
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

      if (editId) {
        await api.put(`/v1/products/${editId}`, body);
        toast.success("Product updated successfully!");
        setSuccessMsg("Product updated successfully!");
        setTimeout(() => router.push("/products"), 1000);
      } else {
        await api.post("/v1/products", body);
        toast.success("Product created successfully!");
        setSuccessMsg("Product created successfully!");
      }

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
          taxRate: defaultTaxRateConfig.rate,
          taxMethod: defaultTaxRateConfig.method,
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
          hasInitialStock: true,
          openingStock: "100",
          warehouseId: warehouses[0]?.id || "",
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

  const isPharmacy = selectedVertical === "PHARMACY" || selectedVertical === "MEDICINE";
  const isSalon = selectedVertical === "SALON" || selectedVertical === "SPA";
  const isRepair = selectedVertical === "REPAIR" || selectedVertical === "SERVICE";
  const isGrocery = selectedVertical === "GROCERY" || selectedVertical === "SUPERMARKET";
  const isWholesale = selectedVertical === "WHOLESALE" || selectedVertical === "DISTRIBUTION";
  const isManufacturing = selectedVertical === "MANUFACTURING" || selectedVertical === "BAKERY";
  const isRetail = selectedVertical === "RETAIL" || selectedVertical === "APPAREL";
  const isFranchise = selectedVertical === "FRANCHISE";

  // Sidebar & Field Visibility rules per Business Type
  const showBrand = !isRestaurant && !isSalon && !isPharmacy;
  const showSupplier = !isRestaurant && !isSalon;
  const showWarranty = isRetail || isRepair || isWholesale || isManufacturing || isFranchise;
  const showEmbeddedBarcode = isGrocery || isRetail;
  const showSerialTracking = isRepair || isRetail || isWholesale;
  const showBatchExpiry = isPharmacy || isGrocery || isRestaurant;
  const isServiceOnly = isSalon || (isRepair && verticalFormState.service.laborChargeOnly);

  const supplierOptions: SearchableSelectOption[] = suppliers.map((s) => ({
    value: s.id,
    label: `${s.name} ${s.company ? `(${s.company})` : ""}`,
  }));

  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 placeholder:text-slate-400";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1.5 capitalize";

  return (
    <div
      data-theme={VERTICAL_THEME_MAP[selectedVertical] || undefined}
      className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen"
    >
      {/* Reusable Custom Breadcrumb Header */}
      <CustomBreadcrumb
        title={isEditMode ? "Edit Product" : "Add New Product"}
        icon={<Package size={20} />}
        items={[
          { label: "Catalog", href: "/products" },
          { label: isEditMode ? "Edit Product" : "Create Product" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isSuperAdmin ? (
              <div className="flex items-center gap-2 bg-brand-50 border border-brand-border rounded-sm px-2.5 py-1 text-xs shadow-xs">
                {React.createElement(
                  BUSINESS_VERTICALS.find((v) => v.id === selectedVertical)?.icon || Package,
                  { size: 14, className: "text-brand-dark shrink-0" }
                )}
                <span className="text-[10px] font-bold text-brand-dark uppercase tracking-wider">Vertical:</span>
                <select
                  value={selectedVertical}
                  onChange={(e) => setSelectedVertical(e.target.value)}
                  className="bg-transparent font-bold text-brand-dark text-xs outline-none cursor-pointer pr-1"
                >
                  {BUSINESS_VERTICALS.map((v) => (
                    <option key={v.id} value={v.id} className="text-gray-600 bg-white">
                      {v.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] font-semibold text-brand-dark bg-brand-50 px-1.5 py-0.5 rounded-sm ml-0.5">
                  Super Admin
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 rounded-sm px-2.5 py-1 text-xs select-none"
                title="Locked by Store Business Type"
              >
                {React.createElement(
                  BUSINESS_VERTICALS.find((v) => v.id === selectedVertical)?.icon || Package,
                  { size: 13, className: "text-brand-primary shrink-0" }
                )}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vertical:</span>
                <span className="font-bold text-gray-600 text-xs">
                  {BUSINESS_VERTICALS.find((v) => v.id === selectedVertical)?.label || selectedVertical}
                </span>
                <Lock size={11} className="text-slate-400 shrink-0 ml-0.5" />
              </div>
            )}

            {!isEditMode && (
              <CustomButton
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving}
                className="rounded-sm text-xs font-semibold"
              >
                Save and Insert Another
              </CustomButton>
            )}
            <CustomButton
              type="button"
              size="sm"
              onClick={(e) => handleSubmit(e, false)}
              loading={saving}
              leftIcon={<Check size={14} />}
              className="bg-brand-primary hover:opacity-90 text-white rounded-sm text-xs font-semibold"
            >
              {isEditMode ? "Update Product" : "Add Product"}
            </CustomButton>
          </div>
        }
      />

      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 animate-in slide-in-from-top-2">
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Main Grid Layout: Left Column (70%) & Right Sidebar (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-4">

          {/* BOX 1: Basic Information */}
          <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Package className="h-4 w-4 text-brand-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isRestaurant ? "Dish / Food Information" : isPharmacy ? "Medicine Information" : "Basic Information"}
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
                <CustomInput
                  label={
                    isRestaurant
                      ? "Dish / Item Name"
                      : isPharmacy
                      ? "Brand / Medicine Trade Name"
                      : isSalon
                      ? "Service / Package Name"
                      : "Product Name"
                  }
                  required
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder={
                    isRestaurant
                      ? "e.g. Grilled Chicken Burger / Cappuccino / Pasta Alfredo"
                      : isPharmacy
                      ? "e.g. Napa Extra / Ace Plus / Seclo 20"
                      : isSalon
                      ? "e.g. Hair Cut & Beard Styling / Facial Glow Package"
                      : "e.g. Wireless Ergonomic Mouse"
                  }
                />
              </div>

              <div>
                <CustomInput
                  label={isRestaurant ? "Menu Code / SKU" : "Product Code (SKU)"}
                  required
                  value={form.sku}
                  onChange={(e) => updateForm("sku", e.target.value)}
                  placeholder="e.g. PRD-1001"
                  rightIcon={
                    <button
                      type="button"
                      onClick={generateSku}
                      className="text-slate-400 hover:text-brand-primary transition cursor-pointer"
                      title="Generate New SKU"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  }
                />
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
                  <label className="text-xs font-bold text-gray-600 capitalize">Barcode Value</label>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="text-xs font-semibold text-brand-primary hover:text-brand-dark flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Auto Generate Barcode
                  </button>
                </div>
                <CustomInput
                  value={form.barcode}
                  onChange={(e) => updateForm("barcode", e.target.value)}
                  placeholder="Enter barcode or click Auto Generate"
                />
              </div>

              <div className="sm:col-span-2">
                <CustomTextarea
                  label={isRestaurant ? "Menu Description / Taste Notes" : "Product Details / Description"}
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  rows={3}
                  placeholder={
                    isRestaurant
                      ? "Describe flavor profile, ingredients, and allergen info..."
                      : "Enter detailed description of the product..."
                  }
                />
              </div>
            </div>
          </div>

          {/* BOX 2: Media */}
          <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ImageIcon className="h-4 w-4 text-brand-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isRestaurant ? "Dish Photo & POS Thumbnail" : "Product Media & Image"}
              </h2>
            </div>

            <ImageUploader
              value={form.imageUrl}
              onChange={(url) => updateForm("imageUrl", url)}
              label={isRestaurant ? "Upload Dish / Food Presentation Image" : "Upload Product Feature Image"}
            />
          </div>

          {/* BOX 3: Pricing */}
          <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-slate-700">
                <DollarSign className="h-4 w-4 text-brand-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {isRestaurant ? "MENU PRICING & COST" : "PRICING"}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Recipe / Base Cost */}
              <div className="sm:col-span-4 flex flex-col justify-end">
                <div className="flex items-center h-8 mb-1.5">
                  <label className="text-xs font-bold text-gray-600 capitalize">
                    {isRestaurant ? "Recipe / Base Cost (৳)" : "Product Cost (৳)"} <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                </div>
                <CustomInput
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => handleCostChange(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Profit Margin Mode & Value */}
              <div className="sm:col-span-8 flex flex-col justify-end">
                <div className="flex items-center justify-between h-8 mb-1.5">
                  <label className="text-xs font-bold text-gray-600 capitalize">Profit Margin Mode & Value</label>

                  {/* Compact Sleek Toggle Button */}
                  <div className="inline-flex rounded-sm border border-brand-border bg-slate-100/90 p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleMarginTypeChange("PERCENTAGE")}
                      className={cn(
                        "px-3 py-1 text-xs rounded-sm font-bold transition-all duration-150 cursor-pointer flex items-center gap-1",
                        marginType === "PERCENTAGE"
                          ? "bg-brand-primary text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      )}
                    >
                      % Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarginTypeChange("FLAT")}
                      className={cn(
                        "px-3 py-1 text-xs rounded-sm font-bold transition-all duration-150 cursor-pointer flex items-center gap-1",
                        marginType === "FLAT"
                          ? "bg-brand-primary text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      )}
                    >
                      Flat (৳)
                    </button>
                  </div>
                </div>
                <CustomInput
                  type="number"
                  step="0.01"
                  value={marginValue}
                  onChange={(e) => handleMarginValueChange(e.target.value)}
                  placeholder={marginType === "PERCENTAGE" ? "25.00" : "50.00"}
                  rightIcon={<span className="text-xs text-slate-400 font-bold">{marginType === "PERCENTAGE" ? "%" : "৳"}</span>}
                />
              </div>

              {/* Menu Price */}
              <div className={isRestaurant ? "sm:col-span-4" : "sm:col-span-3"}>
                <CustomInput
                  label={isRestaurant ? "Menu Price (৳)" : "Selling Price (৳)"}
                  required
                  type="number"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => updateForm("sellingPrice", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {!isRestaurant && (
                <div className="sm:col-span-3">
                  <CustomInput
                    label="Wholesale Price (৳)"
                    type="number"
                    step="0.01"
                    value={form.wholesalePrice}
                    onChange={(e) => updateForm("wholesalePrice", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* VAT / Tax */}
              <div className={isRestaurant ? "sm:col-span-4" : "sm:col-span-3"}>
                <CustomInput
                  label="VAT / Tax (%)"
                  type="number"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(e) => updateForm("taxRate", e.target.value)}
                  placeholder="0"
                  helperText={
                    defaultTaxRateConfig.rate !== "0"
                      ? `Default: ${defaultTaxRateConfig.rate}% (from Tax Settings)`
                      : undefined
                  }
                />
                {configuredTaxRates.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-gray-400 font-medium">Presets:</span>
                    {configuredTaxRates.map((tr: any) => {
                      const trVal = String(Number(tr.rate));
                      const isSel = form.taxRate === trVal;
                      return (
                        <button
                          key={tr.id || tr.code || tr.name}
                          type="button"
                          onClick={() => {
                            updateForm("taxRate", trVal);
                            if (tr.taxInclusive !== undefined) {
                              updateForm("taxMethod", tr.taxInclusive ? "Inclusive" : "Exclusive");
                            }
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-sm transition cursor-pointer border ${
                            isSel
                              ? "bg-brand-primary/10 border-brand-primary text-brand-primary font-bold"
                              : "bg-slate-50 border-slate-200 text-gray-500 hover:bg-slate-100"
                          }`}
                        >
                          {tr.name ? `${tr.name} (${trVal}%)` : `${trVal}%`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tax Method */}
              <div className={isRestaurant ? "sm:col-span-4" : "sm:col-span-3"}>
                <CustomDropdownSelect
                  label="Tax Method"
                  value={form.taxMethod || "Inclusive"}
                  onChange={(val) => updateForm("taxMethod", val)}
                  options={[
                    { label: "Inclusive", value: "Inclusive" },
                    { label: "Exclusive", value: "Exclusive" },
                  ]}
                />
              </div>

              {/* Promo Discount Checkbox */}
              <div className="sm:col-span-12 flex items-center mt-0.5">
                <CustomCheckbox
                  label="Add Promotional / Special Discount Price"
                  checked={form.hasPromoPrice}
                  onChange={(e) => updateForm("hasPromoPrice", e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC BUSINESS VERTICAL FORM FIELDS FOR RESTAURANT (Food Menu Setup) */}
          {isRestaurant && (
            <div>
              {renderVerticalProductFields(selectedVertical, verticalFormState, handleUpdateVertical)}
            </div>
          )}

          {/* BOX 4: Units */}
          <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Layers className="h-4 w-4 text-brand-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isRestaurant ? "Serving Unit" : "Units & Measurement"}
              </h2>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <SearchableSelect
                  label={isRestaurant ? "Serving Unit (e.g. Portion / Plate / Cup)" : "Product Unit"}
                  required
                  options={unitOptions}
                  value={form.unitId}
                  onChange={(val) => updateForm("unitId", val)}
                  placeholder="Select Unit..."
                  onAddClick={() => setActiveModal("UNIT")}
                />
              </div>

              {!isRestaurant && (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* BOX 5: Variants (Size, Color, Model - for Retail, Apparel, Wholesale) */}
          {!isRestaurant && (
            <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-700">
                  <Tag className="h-4 w-4 text-brand-primary" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Variants (Size, Color, Model)</h2>
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
                      <CustomButton
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={addVariant}
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                      >
                        Add Variant Item
                      </CustomButton>
                    </div>

                    {variants.map((variant, idx) => (
                      <div key={idx} className="rounded-sm border border-slate-200 bg-slate-50/60 p-3 relative space-y-2">
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
                          <CustomInput
                            value={variant.name}
                            onChange={(e) => updateVariant(idx, "name", e.target.value)}
                            placeholder="Name (Red / XL)"
                          />
                          <CustomInput
                            value={variant.sku}
                            onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                            placeholder="SKU"
                          />
                          <CustomInput
                            value={variant.barcode}
                            onChange={(e) => updateVariant(idx, "barcode", e.target.value)}
                            placeholder="Barcode"
                          />
                          <CustomInput
                            type="number"
                            step="0.01"
                            value={variant.costPrice}
                            onChange={(e) => updateVariant(idx, "costPrice", e.target.value)}
                            placeholder="Cost"
                          />
                          <CustomInput
                            type="number"
                            step="0.01"
                            value={variant.sellingPrice}
                            onChange={(e) => updateVariant(idx, "sellingPrice", e.target.value)}
                            placeholder="Selling"
                          />
                          <CustomInput
                            type="number"
                            step="0.01"
                            value={variant.wholesalePrice}
                            onChange={(e) => updateVariant(idx, "wholesalePrice", e.target.value)}
                            placeholder="Wholesale"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOX 6: Inventory Controls */}
          {!isServiceOnly && (
            <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Package className="h-4 w-4 text-brand-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Inventory & Stock Controls</h2>
              </div>

              <div className="space-y-3">
                <CustomCheckbox
                  label="Initial Stock / Opening Quantity"
                  description="Add opening inventory quantity for this product upon creation"
                  checked={form.hasInitialStock}
                  onChange={(e) => updateForm("hasInitialStock", e.target.checked)}
                />

                {form.hasInitialStock && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
                    <CustomInput
                      label="Opening Quantity (Stock)"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 100"
                      value={form.openingStock}
                      onChange={(e) => updateForm("openingStock", e.target.value)}
                      helperText="Initial inventory quantity added to stock"
                    />

                    {warehouses.length > 0 ? (
                      <CustomDropdownSelect
                        label="Warehouse / Storage Outlet"
                        value={form.warehouseId || warehouses[0]?.id || ""}
                        onChange={(val) => updateForm("warehouseId", val)}
                        options={warehouses.map((w: any) => ({
                          label: `${w.name} (${w.code || "WH"})`,
                          value: w.id,
                        }))}
                      />
                    ) : (
                      <CustomInput
                        label="Warehouse / Storage Outlet"
                        disabled
                        value="Main Warehouse (Default)"
                        helperText="Allocated to primary warehouse"
                      />
                    )}
                  </div>
                )}

                <CustomCheckbox
                  label="Warehouse / Branch Specific Pricing"
                  description="Set custom prices for different warehouse or outlet locations"
                  checked={form.hasDiffPriceWarehouse}
                  onChange={(e) => updateForm("hasDiffPriceWarehouse", e.target.checked)}
                />

                {showBatchExpiry && (
                  <CustomCheckbox
                    label="Batch & Expiry Date Tracking"
                    description="Track lot numbers, manufacturing and expiry dates"
                    checked={form.hasBatchExpiry}
                    onChange={(e) => updateForm("hasBatchExpiry", e.target.checked)}
                  />
                )}

                {showSerialTracking && (
                  <CustomCheckbox
                    label="IMEI / Serial Number Tracking"
                    description="Track unique serial or IMEI numbers per item"
                    checked={form.hasSerial}
                    onChange={(e) => updateForm("hasSerial", e.target.checked)}
                  />
                )}
              </div>
            </div>
          )}

          {/* DYNAMIC BUSINESS VERTICAL FORM FIELDS FOR NON-RESTAURANT */}
          {!isRestaurant && (
            <div>
              {renderVerticalProductFields(selectedVertical, verticalFormState, handleUpdateVertical)}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN SIDEBAR (30%) */}
        <div className="lg:col-span-4 space-y-4">
          {/* SIDEBAR 1: Organization */}
          <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Layers className="h-4 w-4 text-brand-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isRestaurant ? "Menu Category" : "Organization"}
              </h2>
            </div>

            <div className="space-y-3.5">
              {showBrand && (
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
              )}

              <div>
                <SearchableSelect
                  label={isRestaurant ? "Menu Category" : "Category"}
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
                  label={isRestaurant ? "Menu Sub-Category" : "Sub Category"}
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

              {showSupplier && (
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
              )}
            </div>
          </div>

          {/* SIDEBAR 2: Status & Badges */}
          <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ShieldCheck className="h-4 w-4 text-brand-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Status & Badges</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Featured Item</div>
                  <div className="text-[10px] text-slate-400">Featured product will be displayed in POS grid</div>
                </div>
                <CustomSwitch
                  size="sm"
                  themeColor="primary"
                  checked={form.isFeatured}
                  onChange={(val) => updateForm("isFeatured", val)}
                />
              </div>

              {showEmbeddedBarcode && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-gray-600">Embedded Barcode</div>
                    <div className="text-[10px] text-slate-400">Check for weight scale barcode scanning</div>
                  </div>
                  <CustomSwitch
                    size="sm"
                    themeColor="primary"
                    checked={form.isEmbeddedBarcode}
                    onChange={(val) => updateForm("isEmbeddedBarcode", val)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR 3: Warranty & Guarantee (Only for Retail, Repair, Wholesale, Mfg) */}
          {showWarranty && (
            <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <ShieldCheck className="h-4 w-4 text-brand-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Warranty & Guarantee
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600 capitalize">Warranty</label>
                  <div className="grid grid-cols-2 gap-2">
                    <CustomInput
                      type="number"
                      value={form.warrantyValue}
                      onChange={(e) => updateForm("warrantyValue", e.target.value)}
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
                  <label className="mb-1.5 block text-xs font-bold text-gray-600 capitalize">Guarantee</label>
                  <div className="grid grid-cols-2 gap-2">
                    <CustomInput
                      type="number"
                      value={form.guaranteeValue}
                      onChange={(e) => updateForm("guaranteeValue", e.target.value)}
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
          )}

          {/* SIDEBAR 4: Inventory Settings */}
          <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Info className="h-4 w-4 text-brand-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Inventory Settings
              </h2>
            </div>

            <div className="space-y-3">
              <CustomInput
                label="Daily Sale Objective"
                type="number"
                value={form.dailySaleObjective}
                onChange={(e) => updateForm("dailySaleObjective", e.target.value)}
                placeholder="0"
              />

              <CustomInput
                label="Alert Quantity (Reorder Level)"
                type="number"
                value={form.alertQuantity}
                onChange={(e) => updateForm("alertQuantity", e.target.value)}
                placeholder="10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK CREATE POPUP MODAL */}
      <CustomModal
        open={Boolean(activeModal)}
        onClose={() => setActiveModal(null)}
        title={`Quick Add ${
          activeModal === "BRAND"
            ? "Brand"
            : activeModal === "CATEGORY"
            ? "Main Category"
            : activeModal === "SUBCATEGORY"
            ? "Sub Category"
            : activeModal === "UNIT"
            ? "Unit"
            : "Supplier"
        }`}
        size="sm"
        themeColor="primary"
      >
        <form onSubmit={handleQuickCreate} className="space-y-4">
          <CustomInput
            label="Name"
            required
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={`Enter ${activeModal?.toLowerCase()} name...`}
            autoFocus
          />

          {(activeModal === "UNIT" || activeModal === "SUPPLIER") && (
            <CustomInput
              label={activeModal === "UNIT" ? "Unit Abbreviation / Code" : "Company Name (Optional)"}
              value={newItemCode}
              onChange={(e) => setNewItemCode(e.target.value)}
              placeholder={activeModal === "UNIT" ? "e.g. kg, box, pcs" : "e.g. Company Ltd."}
            />
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveModal(null)}
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              size="sm"
              loading={creatingItem}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Save & Select
            </CustomButton>
          </div>
        </form>
      </CustomModal>
    </div>
  );
}
