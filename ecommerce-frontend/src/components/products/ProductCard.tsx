"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Check, AlertCircle, Eye } from "lucide-react";
import { ProductItem } from "@/lib/api";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: ProductItem;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const inStock = (product.totalStock ?? 0) > 0 || product.inStock;

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
    });
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-sky-300 shadow-xs hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 overflow-hidden">
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {product.categoryName && (
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-700 rounded-full text-[11px] font-semibold tracking-wide border border-slate-100 shadow-xs">
            {product.categoryName}
          </span>
        )}
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-xs flex items-center gap-1 ${
            inStock
              ? "bg-emerald-500/90 text-white backdrop-blur-xs"
              : "bg-rose-500/90 text-white backdrop-blur-xs"
          }`}
        >
          {inStock ? (
            <>
              <Check className="w-3 h-3" /> In Stock
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" /> Stock Out
            </>
          )}
        </span>
      </div>

      {/* Product Image */}
      <Link href={`/products/${product.id}`} className="block relative aspect-square bg-slate-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 to-sky-50 text-slate-400 group-hover:scale-105 transition-transform duration-500">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center text-sky-600 font-bold text-2xl border border-slate-100">
              {product.name.charAt(0)}
            </div>
            <span className="text-xs font-medium text-slate-400 mt-2">BlueOceans POS Catalog</span>
          </div>
        )}

        {/* Hover Quick View overlay */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-2 bg-white/95 text-slate-800 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
            <Eye className="w-3.5 h-3.5 text-sky-600" /> Quick View
          </span>
        </div>
      </Link>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {product.brandName && (
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              {product.brandName}
            </p>
          )}
          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
          {product.sku && (
            <p className="text-[11px] text-slate-400 mt-1">SKU: {product.sku}</p>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-slate-400 font-normal block">Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-slate-900">
                ৳{product.sellingPrice?.toLocaleString()}
              </span>
              {product.unitName && (
                <span className="text-[11px] text-slate-400">/{product.unitName}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={!inStock}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              inStock
                ? "bg-sky-600 hover:bg-sky-700 text-white hover:shadow-md hover:shadow-sky-500/20 active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
