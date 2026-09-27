"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Check,
  AlertCircle,
  Eye,
  Plus,
  Minus,
  Sparkles,
  Flame,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { ProductItem } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useStoreConfig } from "@/context/StoreConfigContext";

interface DynamicProductCardProps {
  product: ProductItem;
  businessType?: string;
}

export default function DynamicProductCard({ product, businessType: propBusinessType }: DynamicProductCardProps) {
  const { addToCart, updateQty, getItemQty } = useCart();
  const { businessType: contextBusinessType, formatPrice } = useStoreConfig();
  const businessType = propBusinessType || contextBusinessType || "RETAIL";

  const inStock = (product.totalStock ?? 0) > 0 || product.inStock !== false;
  const currentQty = getItemQty(product.id);

  // States for variants
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || "");

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.sellingPrice,
      qty: 1,
      imageUrl: product.imageUrl,
      sku: product.sku,
      unitName: product.unitName,
      maxStock: product.totalStock,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQty(product.id, currentQty + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQty(product.id, currentQty - 1);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 overflow-hidden">
      {/* ── 1. BUSINESS SPECIFIC BADGES ── */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-1.5">
        {/* Business Badge */}
        {businessType === "PHARMACY" && product.genericName ? (
          <span className="px-2 py-0.5 bg-sky-500/90 backdrop-blur-md text-white rounded-md text-[10px] font-bold tracking-wide shadow-xs flex items-center gap-1">
            💊 {product.genericName}
          </span>
        ) : businessType === "RESTAURANT" && product.spiceLevel ? (
          <span className="px-2 py-0.5 bg-amber-500/90 backdrop-blur-md text-white rounded-md text-[10px] font-bold tracking-wide shadow-xs flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-red-100" /> Spice Lvl {product.spiceLevel}
          </span>
        ) : product.categoryName ? (
          <span className="px-2.5 py-0.5 bg-white/95 backdrop-blur-md text-slate-700 rounded-full text-[11px] font-semibold tracking-wide border border-slate-100 shadow-xs truncate max-w-[120px]">
            {product.categoryName}
          </span>
        ) : <div />}

        {/* Stock Badge */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-xs flex items-center gap-1 shrink-0 ${
            inStock ? "bg-emerald-500/90 text-white backdrop-blur-xs" : "bg-rose-500/90 text-white backdrop-blur-xs"
          }`}
        >
          {inStock ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
          {inStock ? "In Stock" : "Sold Out"}
        </span>
      </div>

      {/* ── 2. PRODUCT IMAGE ── */}
      <Link href={`/products/${product.id}`} className="block relative aspect-square bg-slate-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 via-sky-50/50 to-slate-100 text-slate-400 group-hover:scale-105 transition-transform duration-500 p-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs flex items-center justify-center text-sky-600 font-bold text-2xl border border-slate-100">
              {product.name.charAt(0)}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-2 line-clamp-1">{product.unitName || "Item"}</span>
          </div>
        )}

        {/* Hover Quick View overlay */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3.5 py-1.5 bg-white/95 text-slate-800 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
            <Eye className="w-3.5 h-3.5 text-sky-600" /> View Details
          </span>
        </div>
      </Link>

      {/* ── 3. PRODUCT INFO & DETAILS ── */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand or Dosage info */}
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
            <span>{product.brandName || product.manufacturer || (businessType === "PHARMACY" ? "Standard Pack" : "")}</span>
            {product.warrantyDays ? (
              <span className="text-sky-600 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> {product.warrantyDays}d Warranty
              </span>
            ) : null}
          </div>

          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Business-specific info line */}
          {businessType === "PHARMACY" && product.dosage ? (
            <p className="text-xs text-sky-700 font-medium mt-1">Strength / Dose: {product.dosage}</p>
          ) : businessType === "GROCERY" && product.unitName ? (
            <p className="text-xs text-slate-500 font-medium mt-1">Pack Unit: 1 {product.unitName}</p>
          ) : null}

          {/* Fashion Sizes (if available) */}
          {businessType === "FASHION" && product.sizes && product.sizes.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {product.sizes.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                    selectedSize === s
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. PRICE & INTERACTIVE CART BUTTONS ── */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900">{formatPrice(product.sellingPrice)}</span>
              {product.wholesalePrice && product.wholesalePrice > product.sellingPrice && (
                <span className="text-xs text-slate-400 line-through">{formatPrice(product.wholesalePrice)}</span>
              )}
            </div>
            {product.unitName && (
              <span className="text-[10px] text-slate-400 font-normal">per {product.unitName}</span>
            )}
          </div>

          {/* Quick Action Button based on Type & Quantity */}
          <div>
            {currentQty > 0 ? (
              <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 rounded-xl p-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-sky-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                  title="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-sky-800 px-1.5 min-w-[20px] text-center">{currentQty}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-7 h-7 rounded-lg bg-sky-600 text-white hover:bg-sky-700 flex items-center justify-center transition-colors shadow-2xs"
                  title="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={!inStock}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  inStock
                    ? "bg-slate-900 hover:bg-sky-600 text-white active:scale-95"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{businessType === "RESTAURANT" ? "Order" : "Add"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
