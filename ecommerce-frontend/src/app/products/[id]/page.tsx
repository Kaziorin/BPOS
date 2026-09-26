"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Check,
  AlertCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Store,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Layers,
  ArrowLeft
} from "lucide-react";
import { StorefrontAPI, ProductItem } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/products/ProductCard";
import toast from "react-hot-toast";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const { addToCart, setIsDrawerOpen } = useCart();
  const [product, setProduct] = useState<(ProductItem & { relatedProducts?: ProductItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string>("");

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    StorefrontAPI.getProductById(productId)
      .then((data) => {
        setProduct(data);
        if (data.attributes && typeof data.attributes === "object") {
          // If variants exists (e.g. sizes or colors)
          const firstKey = Object.keys(data.attributes)[0];
          if (firstKey && Array.isArray(data.attributes[firstKey])) {
            setSelectedVariant(data.attributes[firstKey][0]);
          }
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error("Product not found");
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-6">
            <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
            <div className="h-6 bg-slate-200 rounded-lg w-1/4" />
            <div className="h-24 bg-slate-200 rounded-xl" />
            <div className="h-12 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-400">The product you are looking for might have been sold out or deactivated.</p>
        <Link href="/products" className="inline-block px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-semibold">
          Browse All Products
        </Link>
      </div>
    );
  }

  const inStock = (product.totalStock ?? 0) > 0 || product.inStock;
  const maxStock = product.totalStock ?? 999;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.sellingPrice,
      qty,
      imageUrl: product.imageUrl,
      sku: product.sku,
      variant: selectedVariant || undefined,
      unitName: product.unitName,
      maxStock: product.totalStock,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* ── Breadcrumb Navigation ── */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-sky-600 transition-colors">Catalog</Link>
        {product.categoryName && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/products?categoryId=${product.categoryId}`} className="hover:text-sky-600 transition-colors">
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* ── Product Main Showcase ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Product Image */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-8 shadow-xs">
          <div className="relative aspect-square rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain object-center"
              />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-4xl shadow-inner">
                {product.name.charAt(0)}
              </div>
            )}

            {/* In-Stock Float Tag */}
            <div className="absolute top-4 left-4">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 ${
                  inStock
                    ? "bg-emerald-500 text-white"
                    : "bg-rose-500 text-white"
                }`}
              >
                {inStock ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {inStock ? `In Stock (${product.totalStock || "Available"})` : "Out of Stock"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Product Buy Info */}
        <div className="lg:col-span-6 space-y-6">
          
          <div>
            {product.brandName && (
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                Brand: {product.brandName}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>
            {product.sku && (
              <p className="text-xs text-slate-400 mt-1">Barcode / SKU: <span className="font-mono">{product.sku}</span></p>
            )}
          </div>

          {/* Price Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100 flex items-baseline gap-3">
            <div className="text-3xl font-black text-slate-900">
              ৳{product.sellingPrice?.toLocaleString()}
            </div>
            {product.unitName && (
              <span className="text-xs font-semibold text-slate-500">per {product.unitName}</span>
            )}
            <span className="ml-auto text-[11px] font-bold text-sky-700 bg-sky-200/60 px-2.5 py-1 rounded-full">
              VAT Included
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2 border-y border-slate-100 py-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Dynamic Variant Selector (Attributes) */}
          {product.attributes && typeof product.attributes === "object" && (
            <div className="space-y-3">
              {Object.entries(product.attributes).map(([attrKey, attrVal]) => (
                <div key={attrKey} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {attrKey}:
                  </label>
                  {Array.isArray(attrVal) ? (
                    <div className="flex flex-wrap gap-2">
                      {attrVal.map((opt: string) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedVariant(opt)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            selectedVariant === opt
                              ? "bg-sky-600 text-white shadow-xs scale-105"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 font-medium">{String(attrVal)}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quantity Selector & Action CTAs */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity</span>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-slate-50 text-slate-600 disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-800">{qty}</span>
                <button
                  type="button"
                  disabled={qty >= maxStock}
                  onClick={() => setQty((q) => Math.min(maxStock, q + 1))}
                  className="p-2 hover:bg-slate-50 text-slate-600 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={!inStock}
                onClick={handleAddToCart}
                className="py-3.5 px-6 rounded-2xl border-2 border-sky-600 text-sky-700 hover:bg-sky-50 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                disabled={!inStock}
                onClick={handleBuyNow}
                className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Buy Now</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Delivery & Warranty Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Truck className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">Home Delivery</span>
                <span className="text-[11px] text-slate-400">2-3 days nationwide</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Store className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">Store Pickup</span>
                <span className="text-[11px] text-slate-400">Ready in 2 hours</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Related Products ── */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Related Products in this Category
            </h3>
            <Link href={`/products?categoryId=${product.categoryId}`} className="text-xs font-bold text-sky-600 hover:underline">
              View More
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {product.relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
