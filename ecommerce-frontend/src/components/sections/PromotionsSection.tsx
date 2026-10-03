"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, Sparkles, Copy, Check, Clock, Gift, Percent, ArrowRight, Flame } from "lucide-react";
import { StorefrontAPI, StorefrontPromotionItem, StorefrontCouponItem } from "@/lib/api";
import { SectionItem } from "@/lib/builderTypes";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useTheme } from "@/context/ThemeContext";
import toast from "react-hot-toast";

interface Props {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function PromotionsSection({ section, isDarkMode }: Props) {
  const { title, subtitle, badge, settings } = section;
  const { formatPrice } = useStoreConfig();
  const { primaryColor, accentColor } = useTheme();

  const [promos, setPromos] = useState<StorefrontPromotionItem[]>([]);
  const [coupons, setCoupons] = useState<StorefrontCouponItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback demo promotions if backend has no active records yet
  const defaultVouchers = settings?.customVouchers || [
    {
      id: "v-1",
      code: "WELCOME50",
      title: "New Customer Special",
      discount: "50% OFF",
      desc: "Get 50% discount on your first online checkout.",
      minSpend: "Min Order $30 / ৳300",
      expires: "Valid for 3 days",
      badge: "FIRST ORDER",
      bgGradient: "from-blue-600 via-indigo-600 to-purple-600",
    },
    {
      id: "v-2",
      code: "FLASH30",
      title: "Weekend Flash Voucher",
      discount: "30% OFF",
      desc: "Save 30% on all trending apparel, electronics & groceries.",
      minSpend: "Min Order $50 / ৳500",
      expires: "Ends Tonight at 11:59 PM",
      badge: "HOT DEAL",
      bgGradient: "from-amber-500 via-orange-600 to-rose-600",
    },
    {
      id: "v-3",
      code: "FREESHIP",
      title: "Zero Shipping Delivery",
      discount: "FREE SHIP",
      desc: "Free express doorstep delivery anywhere nationwide.",
      minSpend: "Min Order $25 / ৳250",
      expires: "Limited Time Offer",
      badge: "FREE DELIVERY",
      bgGradient: "from-emerald-600 via-teal-600 to-cyan-600",
    },
  ];

  useEffect(() => {
    async function loadPromos() {
      try {
        const res = await StorefrontAPI.getPromotions();
        if (res.promotions && res.promotions.length > 0) {
          setPromos(res.promotions);
        }
        if (res.coupons && res.coupons.length > 0) {
          setCoupons(res.coupons);
        }
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadPromos();
  }, []);

  const handleCopy = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  // Combine backend coupons with custom default vouchers
  const displayItems = coupons.length > 0
    ? coupons.map((c, i) => ({
        id: c.id,
        code: c.code,
        title: `${c.code} Voucher`,
        discount: c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `৳${c.discountValue} OFF`,
        desc: c.minOrderAmount ? `Applicable on orders above ${formatPrice(c.minOrderAmount)}` : "Applicable on all items in cart",
        minSpend: c.minOrderAmount ? `Min Order ${formatPrice(c.minOrderAmount)}` : "No Min Spend",
        expires: c.endDate ? `Valid until ${new Date(c.endDate).toLocaleDateString()}` : "Active Now",
        badge: "POS SYNCED",
        bgGradient: i % 3 === 0 ? "from-blue-600 to-indigo-700" : i % 3 === 1 ? "from-amber-600 to-orange-700" : "from-emerald-600 to-teal-700",
      }))
    : defaultVouchers;

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}40`,
                }}
              >
                <Tag className="w-3 h-3" />
                <span>{badge || "PROMOTIONS & VOUCHERS"}</span>
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                <Flame className="w-3 h-3" />
                <span>Live Synced</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {title || "Special Offers & Coupon Discounts"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
              {subtitle || "Copy coupon codes below and apply at checkout for instant savings!"}
            </p>
          </div>

          <Link
            href="/products?filter=deals"
            className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors group"
            style={{ color: primaryColor }}
          >
            <span>Browse All Promotional Items</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Vouchers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayItems.map((item: any, idx: number) => {
            const isCopied = copiedCode === item.code;
            return (
              <div
                key={item.id || idx}
                className={`relative rounded-3xl overflow-hidden border p-5 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 ${
                  isDarkMode
                    ? "bg-zinc-900/90 border-zinc-800 text-white"
                    : "bg-white border-slate-200/90 text-slate-900"
                }`}
              >
                {/* Decorative Top Gradient Accent */}
                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${item.bgGradient}`} />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.expires}</span>
                    </span>
                  </div>

                  {/* Discount Big Banner */}
                  <div className="flex items-baseline gap-2 my-2">
                    <span
                      className="text-2xl sm:text-3xl font-black tracking-tight"
                      style={{ color: primaryColor }}
                    >
                      {item.discount}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {item.title}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Voucher Code Box & Copy Button */}
                <div className="pt-3 border-t border-dashed border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Coupon Code</span>
                    <span className="text-sm font-black font-mono tracking-wider text-slate-900 dark:text-white">
                      {item.code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.code)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                      isCopied
                        ? "bg-emerald-600 text-white"
                        : "text-white"
                    }`}
                    style={
                      !isCopied
                        ? {
                            backgroundColor: primaryColor,
                            boxShadow: `0 4px 12px ${primaryColor}30`,
                          }
                        : {}
                    }
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
