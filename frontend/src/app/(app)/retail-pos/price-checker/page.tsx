"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Tag,
  Package,
  Barcode,
  RotateCcw,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  History,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getAccessiblePosTerminals, getTenantEntitlementContext } from "@/lib/pos-terminals";
import { CustomBreadcrumb, CustomButton } from "@/components/custom";
import {
  useBarcodeScanner,
  playScanSuccessBeep,
  playScanErrorBeep,
} from "@/lib/useBarcodeScanner";

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string | null;
}

interface ProductResult {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: string;
  purchasePrice: string;
  unit: string;
  totalStock?: number;
  category: { name: string } | null;
  variants: ProductVariant[];
}

function formatMoney(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeProduct(raw: any): ProductResult | null {
  if (!raw || !raw.id) return null;
  const sell = raw.sellingPrice ?? raw.selling_price ?? raw.price ?? 0;
  const buy = raw.purchasePrice ?? raw.costPrice ?? raw.cost_price ?? 0;
  const unitName =
    typeof raw.unit === "string" ? raw.unit : raw.unit?.name || raw.unitName || "pcs";
  const categoryObj =
    raw.category && typeof raw.category === "object"
      ? { name: raw.category.name || "General" }
      : typeof raw.categoryName === "string"
      ? { name: raw.categoryName }
      : null;

  return {
    id: String(raw.id),
    name: String(raw.name || "Unnamed Product"),
    sku: String(raw.sku || ""),
    barcode: raw.barcode ? String(raw.barcode) : null,
    sellingPrice: String(sell),
    purchasePrice: String(buy),
    unit: unitName,
    totalStock:
      raw.totalStock !== undefined && raw.totalStock !== null ? Number(raw.totalStock) : undefined,
    category: categoryObj,
    variants: Array.isArray(raw.variants) ? raw.variants : [],
  };
}

export default function PriceCheckerPage() {
  const router = useRouter();
  const { user, subscription } = useAuth();
  const entCtx = getTenantEntitlementContext(user, subscription);
  const primaryTerminalHref = getAccessiblePosTerminals(user, subscription)[0]?.href || "/retail-pos";
  const businessLabel =
    entCtx.businessType.charAt(0) + entCtx.businessType.slice(1).toLowerCase();
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showStaffCost, setShowStaffCost] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [recentLookups, setRecentLookups] = useState<ProductResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function lookup(searchCode?: string) {
    const q = (searchCode || query).trim();
    if (!q) return;
    setLoading(true);
    setNotFound(false);
    try {
      let resolved: ProductResult | null = null;

      try {
        const listRes: any = await api.get(
          `/api/v1/products?search=${encodeURIComponent(q)}&limit=10`
        );
        const list: any[] = Array.isArray(listRes)
          ? listRes
          : listRes?.data?.data || listRes?.data || [];
        if (list.length > 0) {
          const exact =
            list.find(
              (p) =>
                (p.barcode && String(p.barcode).toLowerCase() === q.toLowerCase()) ||
                (p.sku && String(p.sku).toLowerCase() === q.toLowerCase())
            ) || list[0];
          resolved = normalizeProduct(exact);
        }
      } catch {
        // Fallback to POS barcode endpoint
      }

      if (!resolved) {
        const checkRes: any = await api.get(
          `/api/v1/pos/price-check?barcode=${encodeURIComponent(q)}`
        );
        const payload = checkRes?.data?.id ? checkRes.data : checkRes;
        resolved = normalizeProduct(payload);
      }

      if (resolved && resolved.id) {
        setProduct(resolved);
        playScanSuccessBeep();
        setRecentLookups((prev) => {
          const filtered = prev.filter((p) => p.id !== resolved!.id);
          return [resolved!, ...filtered].slice(0, 6);
        });
      } else {
        setNotFound(true);
        setProduct(null);
        playScanErrorBeep();
      }
    } catch {
      setNotFound(true);
      setProduct(null);
      playScanErrorBeep();
    } finally {
      setLoading(false);
    }
  }

  useBarcodeScanner({
    onScan: (code) => {
      setQuery(code);
      lookup(code);
    },
    enabled: true,
  });

  const copyToClipboard = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleClear = () => {
    setQuery("");
    setProduct(null);
    setNotFound(false);
    inputRef.current?.focus();
  };

  const calculateMargin = (selling: string, cost: string) => {
    const sell = parseFloat(selling) || 0;
    const buy = parseFloat(cost) || 0;
    if (sell <= 0) return "0.0";
    return (((sell - buy) / sell) * 100).toFixed(1);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <CustomBreadcrumb
        title="Price & Stock Verifier"
        description="Scan barcodes or enter SKUs to check customer shelf prices, stock levels, and catalog specifications"
        icon={<Tag size={15} />}
        items={[
          { label: businessLabel, href: primaryTerminalHref },
          { label: "POS Terminal", href: primaryTerminalHref },
          { label: "Price Checker" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CustomButton variant="outline" size="sm" icon={RotateCcw} onClick={handleClear}>
              Reset
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              icon={ShoppingCart}
              onClick={() => router.push(primaryTerminalHref)}
            >
              Open POS Register
            </CustomButton>
          </div>
        }
      />

      <div className="bg-white p-5 rounded-sm border border-brand-border shadow-2xs space-y-2.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Barcode / SKU / Product Name Scanner
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="Scan barcode with handheld scanner or type SKU / Name and press Enter..."
              className="w-full h-10 pl-10 pr-10 text-sm rounded-sm border border-brand-border focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-border/40 transition text-slate-800 placeholder:text-slate-400 bg-white"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                aria-label="Clear query"
              >
                ✕
              </button>
            )}
          </div>
          <CustomButton
            variant="primary"
            size="md"
            loading={loading}
            icon={Search}
            onClick={() => lookup()}
            className="sm:w-auto w-full shrink-0"
          >
            Check Price
          </CustomButton>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hardware Barcode Scanner listening active
          </span>
          <span>Press Enter to verify</span>
        </div>
      </div>

      {notFound && (
        <div className="p-4 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-2xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold">Product Not Found</p>
            <p className="text-rose-700">
              No matching merchandise found for &ldquo;<span className="font-semibold">{query}</span>&rdquo;. Check barcode or verify inventory in product management.
            </p>
          </div>
        </div>
      )}

      {!product && !notFound && (
        <div className="bg-white rounded-sm border border-brand-border p-10 sm:p-14 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-sm bg-brand-50 border border-brand-border flex items-center justify-center mx-auto text-brand-primary">
            <Barcode size={28} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-brand-dark">Ready for Barcode Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scan any retail barcode with a USB/Bluetooth scanner or type a SKU or product name above to display shelf pricing, stock availability, and margin details.
            </p>
          </div>
        </div>
      )}

      {product && (
        <div className="bg-white rounded-sm border border-brand-border shadow-2xs overflow-hidden animate-in fade-in">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-sm bg-brand-50 border border-brand-border flex items-center justify-center text-brand-primary shrink-0">
                <Package size={24} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-dark border border-brand-border">
                    {product.category?.name || "General Merchandise"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Active Catalog
                  </span>
                  {product.totalStock !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        product.totalStock > 0
                          ? "bg-slate-50 text-slate-700 border-slate-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      Stock: {product.totalStock} {product.unit}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-brand-dark break-words">{product.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {product.sku && (
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">SKU:</span>
                      <span className="font-mono font-semibold text-slate-700">{product.sku}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(product.sku, "sku")}
                        className="text-slate-400 hover:text-brand-primary transition cursor-pointer"
                        title="Copy SKU"
                      >
                        {copiedField === "sku" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                    </div>
                  )}
                  {product.barcode && (
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Barcode:</span>
                      <span className="font-mono font-semibold text-slate-700">{product.barcode}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(product.barcode || "", "barcode")}
                        className="text-slate-400 hover:text-brand-primary transition cursor-pointer"
                        title="Copy Barcode"
                      >
                        {copiedField === "barcode" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <CustomButton
              variant="outline"
              size="sm"
              icon={showStaffCost ? EyeOff : Eye}
              onClick={() => setShowStaffCost(!showStaffCost)}
            >
              {showStaffCost ? "Hide Cost Price" : "Staff Margin View"}
            </CustomButton>
          </div>

          <div className="p-5 sm:p-6 bg-slate-50/50">
            <div className={`grid gap-4 ${showStaffCost ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"}`}>
              <div className="p-6 rounded-sm bg-brand-gradient text-white shadow-sm text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/85">
                  Customer Selling Price
                </span>
                <div className="text-4xl font-black text-white tabular-nums">
                  {formatMoney(product.sellingPrice)}
                </div>
                <p className="text-xs text-white/90 font-medium">
                  per <strong className="text-white">{product.unit || "unit"}</strong> &bull; Inclusive of standard VAT
                </p>
              </div>

              {showStaffCost && (
                <div className="p-6 rounded-sm bg-white border border-brand-border shadow-2xs text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                    Purchase / Landing Cost
                  </span>
                  <div className="text-3xl font-black text-slate-700 tabular-nums">
                    {formatMoney(product.purchasePrice)}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Supplier unit cost per {product.unit || "unit"}
                  </p>
                </div>
              )}

              {showStaffCost && (
                <div className="p-6 rounded-sm bg-white border border-brand-border shadow-2xs text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    Gross Margin %
                  </span>
                  <div className="text-3xl font-black text-emerald-600 tabular-nums">
                    {calculateMargin(product.sellingPrice, product.purchasePrice)}%
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Estimated unit markup margin
                  </p>
                </div>
              )}
            </div>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Layers size={14} className="text-brand-primary" />
                <span>Available Product Variants ({product.variants.length})</span>
              </div>
              <div className="border border-slate-200 rounded-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Variant Specification</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {product.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{v.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{v.sku}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-800 tabular-nums">
                          {v.sellingPrice ? formatMoney(v.sellingPrice) : formatMoney(product.sellingPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">Want to bill this product directly?</span>
            <CustomButton
              variant="primary"
              size="sm"
              icon={ShoppingCart}
              onClick={() => router.push(primaryTerminalHref)}
            >
              Add to POS Cart &amp; Bill
            </CustomButton>
          </div>
        </div>
      )}

      {recentLookups.length > 0 && (
        <div className="bg-white p-5 rounded-sm border border-brand-border shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <History size={14} className="text-brand-primary" />
              <span>Recently Verified In This Session</span>
            </div>
            <button
              type="button"
              onClick={() => setRecentLookups([])}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              Clear Reel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentLookups.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setProduct(item)}
                className={`p-3 rounded-sm border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                  product?.id === item.id
                    ? "border-brand-primary bg-brand-50/70 shadow-2xs"
                    : "border-slate-200 hover:border-brand-border bg-white"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.sku || item.barcode}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-brand-dark tabular-nums">
                    {formatMoney(item.sellingPrice)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
