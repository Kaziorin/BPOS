"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";
import { CartPanel } from "../CartPanel";
import { PaymentPanel } from "../PaymentPanel";
import { ReceiptModal } from "../ReceiptModal";
import type { CartItem, PaymentLine, SaleResult } from "../pos-types";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: string;
  unit: string;
}

interface TenantInfo {
  branch: { id: string } | null;
  warehouse: { id: string } | null;
}

function calcLine(item: CartItem): CartItem {
  return { ...item, lineTotal: item.qty * item.unitPrice - item.discountAmount };
}

export default function SelfCheckoutPage() {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<TenantInfo>("/api/v1/tenant").then(setTenantInfo).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!search) { setProducts([]); return; }
      api
        .get<Product[]>(`/products?search=${encodeURIComponent(search)}`)
        .then(setProducts)
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  const total = useMemo(() => cart.reduce((s, i) => s + i.lineTotal, 0), [cart]);

  useEffect(() => {
    if (payments.length === 1) setPayments([{ ...payments[0], amount: total }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  function addProduct(p: Product) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = calcLine({ ...updated[idx], qty: updated[idx].qty + 1 });
        return updated;
      }
      return [...prev, calcLine({
        productId: p.id, variantId: null, name: p.name,
        qty: 1, unitPrice: Number(p.sellingPrice), discountAmount: 0, lineTotal: 0,
      })];
    });
    setSearch("");
    searchRef.current?.focus();
  }

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && search.trim()) {
      const match = products.find(
        (p) => p.barcode === search.trim() || p.sku === search.trim(),
      );
      if (match) addProduct(match);
    }
  }

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetSale() {
    setCart([]);
    setPayments([{ method: "CASH", amount: 0 }]);
    setResult(null);
    setError(null);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-md">
        <ReceiptModal result={result} onNewSale={resetSale} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700 font-medium">
        Self Checkout — Scan your items and pay
      </div>

      <CustomInput
        ref={searchRef}
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleSearchKey}
        placeholder="Scan barcode or search product…"
        leftIcon={<Search size={15} />}
      />

      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              className="rounded-xl border border-gray-100 bg-white p-3 text-left hover:border-primary-300 hover:shadow-sm"
            >
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{p.name}</p>
              <p className="mt-1 text-sm font-bold text-primary-600 tabular-nums">
                {Number(p.sellingPrice).toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <ShoppingCart size={15} />
          Your Cart ({cart.length} items)
        </div>

        {/* selfCheckout=true disables discount/price-override inputs */}
        <CartPanel
          items={cart}
          selfCheckout
          onQtyChange={(idx, qty) => {
            if (qty <= 0) setCart((p) => p.filter((_, i) => i !== idx));
            else setCart((p) => p.map((item, i) => i === idx ? calcLine({ ...item, qty }) : item));
          }}
          onRemove={(idx) => setCart((p) => p.filter((_, i) => i !== idx))}
          onDiscountChange={() => {}}
          onPriceOverride={() => {}}
        />

        <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-900">
          <span>Total</span>
          <span className="tabular-nums">{total.toFixed(2)}</span>
        </div>

        <PaymentPanel total={total} payments={payments} onChange={setPayments} />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <CustomButton
          fullWidth size="lg"
          loading={submitting}
          disabled={cart.length === 0}
          onClick={confirmSale}
        >
          Pay Now
        </CustomButton>
      </div>
    </div>
  );
}
