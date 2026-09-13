"use client";

import { useState } from "react";
import { Search, Tag, Package } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";

interface ProductResult {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: string;
  purchasePrice: string;
  unit: string;
  category: { name: string } | null;
  variants: { id: string; name: string; sku: string; sellingPrice: string | null }[];
}

export default function PriceCheckerPage() {
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function lookup() {
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    setProduct(null);
    try {
      const res = await api.get<ProductResult>(
        `/api/v1/pos/price-check?q=${encodeURIComponent(query.trim())}`,
      );
      setProduct(res);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Checker</h1>
        <p className="mt-1 text-sm text-gray-500">
          Scan barcode or enter SKU — no cart, no checkout
        </p>
      </div>

      <div className="flex gap-2">
        <CustomInput
          autoFocus
          containerClassName="flex-1"
          placeholder="Barcode, SKU, or product ID…"
          leftIcon={<Search size={15} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
        />
        <CustomButton loading={loading} onClick={lookup}>
          Check
        </CustomButton>
      </div>

      {notFound && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          Product not found for &ldquo;{query}&rdquo;
        </div>
      )}

      {product && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-400">
                SKU: {product.sku}
                {product.barcode && ` · Barcode: ${product.barcode}`}
                {product.category && ` · ${product.category.name}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary-50 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Selling Price</p>
              <p className="text-3xl font-bold text-primary-700 tabular-nums">
                {Number(product.sellingPrice).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">per {product.unit}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Purchase Price</p>
              <p className="text-2xl font-semibold text-gray-600 tabular-nums">
                {Number(product.purchasePrice).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">per {product.unit}</p>
            </div>
          </div>

          {product.variants.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Variants</p>
              <div className="space-y-1">
                {product.variants.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-gray-400" />
                      <span className="font-medium">{v.name}</span>
                      <span className="text-gray-400">{v.sku}</span>
                    </div>
                    <span className="font-bold tabular-nums text-primary-600">
                      {v.sellingPrice ? Number(v.sellingPrice).toFixed(2) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
