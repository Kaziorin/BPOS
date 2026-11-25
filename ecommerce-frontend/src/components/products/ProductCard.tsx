"use client";

import React from "react";
import Link from "next/link";
import { Check, AlertCircle, Eye, ShoppingCart } from "lucide-react";
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
    <div className="group relative flex flex-col bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Badges Overlay */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        {product.categoryName ? (
          <span className="px-2 py-0.5 bg-white/90 backdrop-blur-xs text-slate-700 rounded text-[10px] font-semibold tracking-wide border border-slate-200 shadow-2xs">
            {product.categoryName}
          </span>
        ) : (
          <span />
        )}
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide shadow-2xs flex items-center gap-1 ${
            inStock
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {inStock ? (
            <>
              <Check className="w-2.5 h-2.5" /> In stock
            </>
          ) : (
            <>
              <AlertCircle className="w-2.5 h-2.5" /> Out of stock
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
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            <div className="w-12 h-12 rounded-lg bg-white shadow-2xs flex items-center justify-center text-sky-600 font-bold text-xl border border-slate-200">
              {product.name.charAt(0)}
            </div>
            <span className="text-[11px] font-normal text-slate-400 mt-2">No image</span>
          </div>
        )}

        {/* Hover Quick View overlay */}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-medium shadow-md flex items-center gap-1.5 border border-slate-200">
            <Eye className="w-3.5 h-3.5 text-slate-600" /> View details
          </span>
        </div>
      </Link>

      {/* Product Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {product.brandName && (
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
              {product.brandName}
            </p>
          )}
          <Link href={`/products/${product.id}`}>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
          {product.sku && (
            <p className="text-[10px] font-mono text-slate-400 mt-1">SKU: {product.sku}</p>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums font-mono">
                ৳{Number(product.sellingPrice || 0).toLocaleString()}
              </span>
              {product.unitName && (
                <span className="text-[10px] text-slate-400">/{product.unitName}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!inStock}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
              inStock
                ? "bg-slate-900 text-white hover:bg-sky-600 cursor-pointer shadow-2xs"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
            title={inStock ? "Add to cart" : "Out of stock"}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
