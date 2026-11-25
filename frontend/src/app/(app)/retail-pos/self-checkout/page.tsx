"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Barcode,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Package,
  ArrowRight,
  Store,
  QrCode,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomModal,
} from "@/components/custom";
import { ReceiptModal } from "../ReceiptModal";
import type { CartItem, PaymentLine, SaleResult } from "../pos-types";
import { toast } from "react-toastify";
import {
  useBarcodeScanner,
  playScanSuccessBeep,
  playScanErrorBeep,
} from "@/lib/useBarcodeScanner";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: string;
  unit: string;
}

interface TenantInfo {
  branch: { id: string; name?: string } | null;
  warehouse: { id: string } | null;
}

function calcLine(item: CartItem): CartItem {
  return { ...item, lineTotal: item.qty * item.unitPrice - item.discountAmount };
}

function formatMoney(amount: number): string {
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SelfCheckoutPage() {
  const router = useRouter();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"CASH" | "CARD" | "BKASH" | "NAGAD">("CASH");
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<TenantInfo>("/api/v1/tenant").then(setTenantInfo).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!search.trim()) {
        setProducts([]);
        return;
      }
      api
        .get<Product[]>(`/products?search=${encodeURIComponent(search.trim())}`)
        .then(setProducts)
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.lineTotal, 0), [cart]);
  const total = subtotal;

  useEffect(() => {
    setPayments([{ method: selectedMethod, amount: total }]);
  }, [total, selectedMethod]);

  function addProduct(p: Product) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = calcLine({ ...updated[idx], qty: updated[idx].qty + 1 });
        return updated;
      }
      return [
        ...prev,
        calcLine({
          productId: p.id,
          variantId: null,
          name: p.name,
          qty: 1,
          unitPrice: Number(p.sellingPrice),
          discountAmount: 0,
          lineTotal: 0,
          sku: p.sku,
        }),
      ];
    });
    setSearch("");
    searchRef.current?.focus();
    playScanSuccessBeep();
  }

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && search.trim()) {
      const match = products.find(
        (p) => p.barcode === search.trim() || p.sku === search.trim() || p.name.toLowerCase().includes(search.toLowerCase().trim())
      );
      if (match) {
        addProduct(match);
      }
    }
  }

  useBarcodeScanner({
    onScan: async (code) => {
      const trimmed = code.trim().toLowerCase();
      const match = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === trimmed) ||
          (p.sku && p.sku.toLowerCase() === trimmed) ||
          p.id.toLowerCase() === trimmed ||
          p.name.toLowerCase() === trimmed
      );
      if (match) {
        addProduct(match);
        toast.success(`Scanned: ${match.name}`);
        return;
      }

      try {
        const res: any = await api.get(`/api/v1/products?search=${encodeURIComponent(code.trim())}&limit=1`);
        const item = res?.data?.data?.[0] || res?.data?.[0] || (Array.isArray(res) ? res[0] : null);
        if (item) {
          const mapped: Product = {
            id: item.id,
            name: item.name,
            sku: item.sku || "",
            barcode: item.barcode || null,
            sellingPrice: String(item.sellingPrice || item.selling_price || item.price || 0),
            unit: item.unit || "pcs",
          };
          addProduct(mapped);
          toast.success(`Scanned: ${mapped.name}`);
          return;
        }
      } catch {}

      playScanErrorBeep();
      toast.error(`Barcode not recognized: ${code}`);
    },
    enabled: true,
  });

  const updateQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const item = prev[idx];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      const updated = [...prev];
      updated[idx] = calcLine({ ...item, qty: newQty });
      return updated;
    });
  };

  const removeItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  async function confirmSale() {
    if (cart.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<SaleResult>("/api/v1/pos/confirm", {
        branchId: tenantInfo?.branch?.id,
        warehouseId: tenantInfo?.warehouse?.id,
        items: cart,
        payments,
        selfCheckout: true,
      });
      setResult(res);
      playScanSuccessBeep();
    } catch (err: any) {
      setError(err?.message || "Checkout transaction failed. Please request attendant assistance.");
      playScanErrorBeep();
    } finally {
      setSubmitting(false);
    }
  }

  function resetSale() {
    setCart([]);
    setSelectedMethod("CASH");
    setPayments([{ method: "CASH", amount: 0 }]);
    setResult(null);
    setError(null);
    searchRef.current?.focus();
  }

  if (result) {
    return (
      <div className="w-full max-w-xl mx-auto py-6 animate-in fade-in">
        <ReceiptModal
          result={result}
          cart={cart}
          payments={payments}
          cashierName="Self-Service Kiosk #01"
          customerName="Self-Checkout Walk-in"
          onNewSale={resetSale}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Top Bar ── */}
      <CustomBreadcrumb
        title="Self-Service Express Checkout"
        description="Autonomous customer kiosk — scan items, verify totals, and complete digital or cash payment"
        icon={<Store className="w-4 h-4 text-sky-600" />}
        items={[
          { label: "Retail", href: "/retail-pos" },
          { label: "POS Terminal", href: "/retail-pos" },
          { label: "Self Checkout Kiosk" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-1.5 rounded-sm border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition cursor-pointer"
            >
              <HelpCircle size={14} className="text-amber-500" />
              <span>Call Attendant</span>
            </button>
            <CustomButton
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={resetSale}
              disabled={cart.length === 0}
            >
              Start Over
            </CustomButton>
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={() => router.push("/retail-pos")}
            >
              Staff POS
            </CustomButton>
          </div>
        }
      />

      {/* ── Main Kiosk 2-Column Interface ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scanner & Cart List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Scanner Input Bar */}
          <div className="bg-white p-5 rounded-sm border border-slate-200/90 shadow-2xs space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Kiosk Barcode Scanner
            </label>
            <div className="relative">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder="Scan item barcode or search catalog..."
                className="w-full pl-10 pr-4 py-3 text-sm rounded-sm border border-slate-300 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition text-slate-800 placeholder:text-slate-400 bg-white"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Hold barcode 2 inches from laser reader
              </span>
              <span>Fast audio chime enabled</span>
            </div>
          </div>

          {/* Quick Search Results Grid (when typing) */}
          {products.length > 0 && (
            <div className="bg-white p-4 rounded-sm border border-slate-200/90 shadow-2xs space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Matching Catalog Products
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addProduct(p)}
                    className="p-3 rounded-sm border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-left transition flex items-center justify-between gap-2 cursor-pointer bg-white"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                    </div>
                    <span className="text-xs font-black text-slate-800 shrink-0 tabular-nums">
                      {formatMoney(Number(p.sellingPrice))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scanned Items Feed */}
          <div className="bg-white rounded-sm border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-sky-600" />
                <h3 className="text-sm font-bold text-slate-800">Scanned Items</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {cart.length} unique &bull; {cart.reduce((a, b) => a + b.qty, 0)} units
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-12 text-center space-y-3 text-slate-400">
                <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
                  <Barcode size={28} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-600">Your basket is currently empty</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Scan any product barcode or search above to begin your self-checkout session.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatMoney(item.unitPrice)} each
                        {item.sku && ` · SKU: ${item.sku}`}
                      </p>
                    </div>

                    {/* Touch Qty Controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-sm bg-slate-50 overflow-hidden">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-800 tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="text-xs font-black text-slate-800 tabular-nums w-20 text-right">
                        {formatMoney(item.lineTotal)}
                      </span>

                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1.5 rounded-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Fast Payment (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-sm border border-slate-200/90 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Payment Summary
            </h3>

            {/* Calculations */}
            <div className="space-y-2 border-b border-slate-100 pb-4 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({cart.reduce((a, b) => a + b.qty, 0)} items)</span>
                <span className="font-semibold tabular-nums">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimated VAT / Tax (Inclusive)</span>
                <span className="tabular-nums">৳0.00</span>
              </div>
            </div>

            {/* Total Grand Highlight */}
            <div className="p-4 rounded-sm bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Amount Due
              </span>
              <div className="text-3xl font-black text-slate-900 tabular-nums">
                {formatMoney(total)}
              </div>
              <p className="text-[11px] text-slate-400">All prices in Bangladeshi Taka (BDT)</p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("CASH")}
                  className={`p-3 rounded-sm border text-left transition flex flex-col justify-between h-20 cursor-pointer ${
                    selectedMethod === "CASH"
                      ? "border-sky-500 bg-sky-50/60 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Banknote size={18} className={selectedMethod === "CASH" ? "text-sky-600" : "text-slate-400"} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cash Tender</p>
                    <p className="text-[10px] text-slate-400">Pay at kiosk / desk</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("BKASH")}
                  className={`p-3 rounded-sm border text-left transition flex flex-col justify-between h-20 cursor-pointer ${
                    selectedMethod === "BKASH"
                      ? "border-pink-500 bg-pink-50/60 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Smartphone size={18} className={selectedMethod === "BKASH" ? "text-pink-600" : "text-slate-400"} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">bKash QR</p>
                    <p className="text-[10px] text-slate-400">Scan & pay mobile</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("CARD")}
                  className={`p-3 rounded-sm border text-left transition flex flex-col justify-between h-20 cursor-pointer ${
                    selectedMethod === "CARD"
                      ? "border-sky-500 bg-sky-50/60 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <CreditCard size={18} className={selectedMethod === "CARD" ? "text-sky-600" : "text-slate-400"} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Debit / Card</p>
                    <p className="text-[10px] text-slate-400">Tap / chip terminal</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("NAGAD")}
                  className={`p-3 rounded-sm border text-left transition flex flex-col justify-between h-20 cursor-pointer ${
                    selectedMethod === "NAGAD"
                      ? "border-orange-500 bg-orange-50/60 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <QrCode size={18} className={selectedMethod === "NAGAD" ? "text-orange-600" : "text-slate-400"} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Nagad Pay</p>
                    <p className="text-[10px] text-slate-400">Post payment OTP</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Giant Pay Button */}
            <CustomButton
              variant="primary"
              size="lg"
              className="w-full text-sm font-black py-3.5 shadow-sm"
              loading={submitting}
              disabled={cart.length === 0}
              icon={ArrowRight}
              onClick={confirmSale}
            >
              Complete Payment &bull; {formatMoney(total)}
            </CustomButton>

            <p className="text-[11px] text-slate-400 text-center">
              Receipt will automatically print upon successful payment.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal: Call Attendant / Help ── */}
      <CustomModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Attendant Assistance Requested"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-sm bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">Store Associate Dispatched</p>
              <p>
                An attendant has been notified to assist you at Self-Checkout Terminal #01. Please remain at the kiosk.
              </p>
            </div>
          </div>
          <div className="space-y-1.5 text-slate-600">
            <p className="font-semibold">Common assistance topics:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500">
              <li>Item barcode not scanning or damaged label</li>
              <li>Price verification / promotion inquiry</li>
              <li>Age-restricted item approval</li>
              <li>Voiding an accidental item entry</li>
            </ul>
          </div>
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => setShowHelpModal(false)}
            >
              Dismiss Notification
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
