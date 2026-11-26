"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Heart, Plus, Minus } from "lucide-react";
import { ProductItem, MEDIA_BASE_URL } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useStoreConfig } from "@/context/StoreConfigContext";
import toast from "react-hot-toast";

const FALLBACK_IMAGE_RULES: Array<{ match: RegExp; url: string }> = [
  { match: /bread|wheat|loaf|roti/i, url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80" },
  { match: /cake|croissant|pastry|bakery|muffin|donut/i, url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80" },
  { match: /cookie|biscuit|chip|lays|snack|cracker/i, url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80" },
  { match: /coca|cola|drink|soda|beverage|juice|tea|coffee/i, url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80" },
  { match: /bun|burger/i, url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80" },
  { match: /flour|raw|dairy|milk|egg|grocery|sugar|rice/i, url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80" },
];

const CURATED_FALLBACKS = [
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80",
];

function resolveFallbackImage(product: ProductItem): string {
  const haystack = `${product.name || ""} ${product.categoryName || ""}`;
  const matched = FALLBACK_IMAGE_RULES.find((r) => r.match.test(haystack));
  if (matched) return matched.url;
  const seed = (product.id || product.name || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CURATED_FALLBACKS[seed % CURATED_FALLBACKS.length];
}

function resolveProductImage(product: ProductItem, imgFailed: boolean): string {
  const raw = (product.imageUrl || "").trim();
  if (!imgFailed && raw && !raw.includes("photo-1523275335684-37898b6baf30")) {
    return raw.startsWith("/") ? `${MEDIA_BASE_URL}${raw}` : raw;
  }
  return resolveFallbackImage(product);
}

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

  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || "");
  const [selectedColor] = useState<string>(product.colors?.[0] || "");
  const [isSaved, setIsSaved] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const displayImage = resolveProductImage(product, imgFailed);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.sellingPrice,
      qty: 1,
      imageUrl: displayImage,
      sku: product.sku,
      unitName: product.unitName,
      maxStock: product.totalStock,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
    });
    toast.success(`${product.name} added to cart!`);
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

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    toast.success(nextSaved ? `${product.name} saved to wishlist!` : `${product.name} removed from wishlist.`);
  };

  return (
    <article className="group relative rounded-xl overflow-hidden border border-orange-200/80 hover:border-orange-500 bg-white flex flex-col hover:shadow-[0_8px_20px_rgba(234,88,12,0.08)] transition-all">
      {/* Edge-to-Edge Image Stage */}
      <Link href={`/products/${product.id}`} className="block relative h-[195px] sm:h-[215px] w-full bg-[#FAF5EE] overflow-hidden">
        <img
          src={displayImage}
          alt={product.name}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      {/* Optional Fashion Sizes */}
      {businessType === "FASHION" && product.sizes && product.sizes.length > 0 && (
        <div className="flex items-center gap-1 px-3 pt-2.5 flex-wrap">
          {product.sizes.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSize(s)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                selectedSize === s
                  ? "bg-orange-600 !text-white border-orange-600"
                  : "bg-[#FAF5EE] text-stone-700 border-orange-200/80 hover:border-orange-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Single-line Title */}
      <Link href={`/products/${product.id}`} className="block px-3 pt-3 pb-1.5">
        <h3 className="text-[14px] font-semibold truncate leading-[1.35] !text-stone-900 group-hover:!text-orange-600 transition-colors">
          {product.name}
        </h3>
      </Link>

      {/* Price + Unit */}
      <div className="px-3 flex items-baseline">
        <span className="text-[15px] font-bold text-orange-600 tabular-nums">
          {formatPrice(product.sellingPrice)}
        </span>
        <span className="text-[11px] font-semibold !text-stone-500 ml-0.5">
          /{product.unitName || "Pc"}
        </span>
      </div>

      {/* Bottom Actions: Orange Add/Stepper + Soft Peach Wishlist */}
      <div className="mt-auto px-3 pt-2.5 pb-3 flex items-stretch gap-2">
        {currentQty > 0 ? (
          <div className="flex-1 h-[38px] rounded-lg bg-[#FFF1E0] border border-orange-200 px-1.5 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={handleDecrement}
              className="w-7 h-7 rounded-md bg-white !text-stone-800 hover:bg-orange-600 hover:!text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title="Decrease"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold !text-orange-800 px-1.5 tabular-nums">
              {currentQty}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              className="w-7 h-7 rounded-md bg-orange-600 hover:bg-orange-700 !text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
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
            className={`flex-1 h-[38px] px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              inStock
                ? "bg-orange-600 hover:bg-orange-700 !text-white"
                : "bg-stone-200 !text-stone-500 cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="w-[15px] h-[15px]" strokeWidth={2.2} />
            <span>{inStock ? (businessType === "RESTAURANT" ? "Order" : "Add to Cart") : "Out of Stock"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          title={isSaved ? "Saved in wishlist" : "Save to wishlist"}
          className={`w-[38px] h-[38px] shrink-0 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
            isSaved
              ? "bg-rose-600 border-rose-600 hover:opacity-90 !text-white"
              : "bg-[#FFF1E0] border-orange-200 hover:bg-orange-100 hover:border-orange-300 !text-orange-600"
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} strokeWidth={2} />
        </button>
      </div>
    </article>
  );
}
