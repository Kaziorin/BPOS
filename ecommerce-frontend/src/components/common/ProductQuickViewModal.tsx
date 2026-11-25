"use client";

import React, { useState } from "react";
import {
  X,
  ShoppingBag,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  Check,
  Minus,
  Plus,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { ProductItem } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import toast from "react-hot-toast";

interface ProductQuickViewModalProps {
  product: ProductItem | null;
  onClose: () => void;
}

export default function ProductQuickViewModal({ product, onClose }: ProductQuickViewModalProps) {
  const { addToCart } = useCart();
  const { theme } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!product) return null;

  const currentPrice = Number(product.sellingPrice || 0);
  const regularPrice = currentPrice * 1.25;
  const discountPercent = 20;

  const activeImg =
    selectedImage ||
    product.imageUrl ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: currentPrice,
      qty: quantity,
      imageUrl: product.imageUrl,
      sku: product.sku,
    });
    toast.success(`Added ${quantity}x ${product.name} to cart!`);
    onClose();
  };

  const handleWhatsAppOrder = () => {
    const rawPhone = theme.whatsappOrderPhone || theme.footerWhatsapp || "+8801700000000";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const msg = `Hello! I would like to order:\n\n*Product:* ${product.name}\n*Quantity:* ${quantity}\n*Price:* ৳${currentPrice * quantity}\n*SKU:* ${product.sku || product.id}\n\nPlease confirm my order.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Product Image */}
        <div className="md:w-1/2 p-6 bg-slate-50 dark:bg-zinc-950/60 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white dark:bg-zinc-900 flex items-center justify-center border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
            <img
              src={activeImg}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-rose-600 text-white font-medium text-[10px] shadow-2xs">
              -{discountPercent}% OFF
            </span>
          </div>
        </div>

        {/* Right: Product Details & Actions */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Category & Code */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                {(product as any).categoryName || product.productType || "Product"}
              </span>
              {product.sku && (
                <span className="text-[10px] font-mono text-slate-400">SKU: {product.sku}</span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">{product.name}</h3>

            {/* Rating & Stock */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-slate-600 dark:text-zinc-300 font-medium ml-1.5 tabular-nums">4.9</span>
              </div>
              <span className="text-slate-300 dark:text-zinc-700">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 text-xs">
                <Check className="w-3.5 h-3.5" />
                <span>{product.totalStock !== undefined ? `${product.totalStock} in stock` : "In stock"}</span>
              </span>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2.5 pt-1">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                ৳{currentPrice.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 line-through tabular-nums font-mono">
                ৳{regularPrice.toLocaleString()}
              </span>
            </div>

            {/* Description Excerpt */}
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
              {product.description ||
                "Premium authentic product directly synchronized with our physical POS warehouse. 100% genuine quality assured."}
            </p>

            {/* Quantity Selector */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-slate-400">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="text-xs text-slate-500 font-medium">
                  Total: <strong className="text-slate-900 dark:text-white tabular-nums font-mono">৳{(currentPrice * quantity).toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors bg-slate-900 hover:bg-sky-600 active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to cart</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp order</span>
              </button>
            </div>

            <Link
              href={`/products/${product.id}`}
              onClick={onClose}
              className="block text-center py-1.5 text-xs font-medium text-slate-500 hover:text-sky-600 transition-colors"
            >
              View full specifications & details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
