"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Barcode,
  CreditCard,
  Croissant,
  PauseCircle,
  Pill,
  Printer,
  QrCode,
  Scissors,
  Search,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Truck,
  UtensilsCrossed,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface PosScreenSpec {
  id: string;
  businessType: string;
  terminalName: string;
  tagline: string;
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
  accentText: string;
  softPill: string;
  categories: string[];
  products: {
    name: string;
    sku: string;
    price: string;
    stock: string;
    badge?: string;
  }[];
  cartItems: {
    name: string;
    qty: number;
    unitPrice: string;
    lineTotal: string;
  }[];
  subtotal: string;
  vat: string;
  payableTotal: string;
  ctaLabel: string;
}

export const EIGHT_POS_SCREENS: PosScreenSpec[] = [
  {
    id: "retail-pos",
    businessType: "RETAIL",
    terminalName: "Retail & Apparel POS",
    tagline: "Barcode Scan • Size/Color Variants • Hold & Split Pay",
    icon: ShoppingBag,
    gradient: "from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]",
    glowColor: "rgba(56, 189, 248, 0.30)",
    accentText: "text-sky-600",
    softPill: "bg-sky-50 text-sky-700 border-sky-200",
    categories: ["All Items", "Menswear", "Footwear", "Accessories", "Denim"],
    products: [
      { name: "Slim Denim Jacket (L)", sku: "SKU-4410", price: "৳2,490", stock: "28 in stock", badge: "Popular" },
      { name: "Oxford Cotton Shirt", sku: "SKU-2198", price: "৳1,850", stock: "64 in stock" },
      { name: "Leather Crossbody Bag", sku: "SKU-8832", price: "৳3,200", stock: "14 in stock", badge: "New" },
      { name: "Canvas Sneakers (42)", sku: "SKU-6621", price: "৳2,890", stock: "19 in stock" },
      { name: "Chino Tapered Pant", sku: "SKU-5104", price: "৳1,650", stock: "42 in stock" },
      { name: "Merino Wool Scarf", sku: "SKU-7741", price: "৳980", stock: "31 in stock" },
    ],
    cartItems: [
      { name: "Slim Denim Jacket (L)", qty: 2, unitPrice: "৳2,490", lineTotal: "৳4,980" },
      { name: "Oxford Cotton Shirt", qty: 1, unitPrice: "৳1,850", lineTotal: "৳1,850" },
      { name: "Merino Wool Scarf", qty: 1, unitPrice: "৳980", lineTotal: "৳980" },
    ],
    subtotal: "৳7,810",
    vat: "৳390",
    payableTotal: "৳8,200",
    ctaLabel: "Charge ৳8,200 & Print 80mm",
  },
  {
    id: "restaurant-pos",
    businessType: "RESTAURANT",
    terminalName: "Restaurant & Cafe POS",
    tagline: "Table Map • Portion Modifiers • Instant KOT Firing",
    icon: UtensilsCrossed,
    gradient: "from-[#ea580c] via-[#f97316] to-[#fb923c]",
    glowColor: "rgba(251, 146, 60, 0.25)",
    accentText: "text-orange-600",
    softPill: "bg-orange-50 text-orange-700 border-orange-200",
    categories: ["All Menu", "Platters", "Biryani", "Grill", "Beverages"],
    products: [
      { name: "Smoked Chicken Platter", sku: "GRILL-04", price: "৳1,070", stock: "Table T-04", badge: "Grill KOT" },
      { name: "Beef Tehari Royal", sku: "KITCHEN-12", price: "৳550", stock: "Spicy / Mild", badge: "Chef Spec" },
      { name: "Grilled Ribeye Steak", sku: "GRILL-09", price: "৳1,890", stock: "Med-Rare" },
      { name: "Iced Caramel Latte", sku: "BAR-02", price: "৳340", stock: "Barista" },
      { name: "Mutton Kacchi Full", sku: "KITCHEN-01", price: "৳780", stock: "Basmati" },
      { name: "Classic Tiramisu Cup", sku: "DESSERT-05", price: "৳420", stock: "Cold" },
    ],
    cartItems: [
      { name: "Smoked Chicken Platter", qty: 2, unitPrice: "৳1,070", lineTotal: "৳2,140" },
      { name: "Beef Tehari Royal", qty: 1, unitPrice: "৳550", lineTotal: "৳550" },
      { name: "Iced Caramel Latte", qty: 2, unitPrice: "৳340", lineTotal: "৳680" },
    ],
    subtotal: "৳3,370",
    vat: "৳168",
    payableTotal: "৳3,538",
    ctaLabel: "Fire KOT & Settle Table T-04",
  },
  {
    id: "pharmacy-pos",
    businessType: "PHARMACY",
    terminalName: "Pharmacy & Rx POS",
    tagline: "FEFO Batch Expiry • Generic Search • Patient Display Sync",
    icon: Pill,
    gradient: "from-[#0891b2] via-[#06b6d4] to-[#22d3ee]",
    glowColor: "rgba(34, 211, 238, 0.28)",
    accentText: "text-cyan-700",
    softPill: "bg-cyan-50 text-cyan-700 border-cyan-200",
    categories: ["All Meds", "Tablets", "Capsules", "Syrups", "Devices"],
    products: [
      { name: "Napa Extend 665mg", sku: "BN-892 • Exp 09/27", price: "৳24", stock: "180 Strips", badge: "FEFO #1" },
      { name: "Sergel 20mg Capsule", sku: "SG-412 • Exp 11/26", price: "৳70", stock: "94 Strips", badge: "Rx" },
      { name: "Monas 10mg Tablet", sku: "MN-119 • Exp 05/27", price: "৳175", stock: "62 Strips" },
      { name: "Seclo 20mg Capsule", sku: "SC-301 • Exp 02/27", price: "৳60", stock: "110 Strips" },
      { name: "Azithromycin 500mg", sku: "AZ-518 • Exp 08/27", price: "৳180", stock: "48 Strips", badge: "Antibiotic" },
      { name: "Digital BP Monitor", sku: "OMR-9921", price: "৳3,250", stock: "7 Units" },
    ],
    cartItems: [
      { name: "Napa Extend 665mg", qty: 3, unitPrice: "৳24", lineTotal: "৳72" },
      { name: "Sergel 20mg Capsule", qty: 2, unitPrice: "৳70", lineTotal: "৳140" },
      { name: "Monas 10mg Tablet", qty: 1, unitPrice: "৳175", lineTotal: "৳175" },
    ],
    subtotal: "৳387",
    vat: "৳0",
    payableTotal: "৳387",
    ctaLabel: "Dispense Rx & Print Slip",
  },
  {
    id: "grocery-pos",
    businessType: "GROCERY",
    terminalName: "Grocery & Supermarket POS",
    tagline: "Weighing Scale Barcodes • Multi-Unit Packs • Express Hold",
    icon: ShoppingCart,
    gradient: "from-[#059669] via-[#10b981] to-[#34d399]",
    glowColor: "rgba(52, 211, 153, 0.25)",
    accentText: "text-emerald-700",
    softPill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    categories: ["All Aisle", "Staples", "Produce", "Dairy", "Beverages"],
    products: [
      { name: "Miniket Rice 5kg", sku: "EAN-89012", price: "৳430", stock: "92 Bags", badge: "Staple" },
      { name: "Alphonso Mango (1kg)", sku: "SCALE-204", price: "৳180", stock: "2.45kg Scaled", badge: "Weight" },
      { name: "Olive Oil 1L Bottle", sku: "EAN-33021", price: "৳1,450", stock: "32 Bottles" },
      { name: "Farm Fresh Eggs (12p)", sku: "DAIRY-102", price: "৳165", stock: "45 Trays" },
      { name: "Soybean Oil 5L Jar", sku: "EAN-77210", price: "৳845", stock: "60 Jars" },
      { name: "Fresh Whole Milk 1L", sku: "DAIRY-44", price: "৳95", stock: "38 Packs" },
    ],
    cartItems: [
      { name: "Miniket Rice 5kg", qty: 2, unitPrice: "৳430", lineTotal: "৳860" },
      { name: "Alphonso Mango (2.45kg)", qty: 1, unitPrice: "৳441", lineTotal: "৳441" },
      { name: "Olive Oil 1L Bottle", qty: 1, unitPrice: "৳1,450", lineTotal: "৳1,450" },
    ],
    subtotal: "৳2,751",
    vat: "৳0",
    payableTotal: "৳2,751",
    ctaLabel: "Fast Pay & Open Cash Drawer",
  },
  {
    id: "wholesale-pos",
    businessType: "WHOLESALE",
    terminalName: "Wholesale B2B POS",
    tagline: "Carton Conversion • Tiered Dealer Pricing • Credit Ledger",
    icon: Truck,
    gradient: "from-[#0052cc] via-[#0066ff] to-[#38bdf8]",
    glowColor: "rgba(59, 130, 246, 0.28)",
    accentText: "text-blue-700",
    softPill: "bg-blue-50 text-blue-700 border-blue-200",
    categories: ["All Bulk", "Cartons", "50kg Sacks", "FMCG Cases", "Tier A"],
    products: [
      { name: "Sunflower Oil (12×1L)", sku: "CTN-101 • MOQ 10", price: "৳2,880", stock: "180 Cartons", badge: "Tier A" },
      { name: "Basmati Rice (50kg)", sku: "SACK-22 • WH-01", price: "৳6,450", stock: "340 Sacks" },
      { name: "Water Case (24×500ml)", sku: "CASE-88", price: "৳360", stock: "520 Cases" },
      { name: "Detergent Master Box", sku: "BOX-410", price: "৳1,920", stock: "95 Boxes", badge: "4% Off" },
      { name: "Premium Flour (50kg)", sku: "SACK-19", price: "৳2,650", stock: "210 Sacks" },
      { name: "Tea Master Carton", sku: "CTN-509", price: "৳4,400", stock: "64 Cartons" },
    ],
    cartItems: [
      { name: "Sunflower Oil (12×1L)", qty: 25, unitPrice: "৳2,880", lineTotal: "৳72,000" },
      { name: "Basmati Rice (50kg)", qty: 12, unitPrice: "৳6,450", lineTotal: "৳77,400" },
      { name: "Water Case (24×500ml)", qty: 20, unitPrice: "৳360", lineTotal: "৳7,200" },
    ],
    subtotal: "৳1,56,600",
    vat: "৳0",
    payableTotal: "৳1,56,600",
    ctaLabel: "Issue B2B Challan & Credit",
  },
  {
    id: "bakery-pos",
    businessType: "MANUFACTURING",
    terminalName: "Bakery & Confectionery POS",
    tagline: "Fresh Oven Batches • Custom Cake Orders • BOM Costing",
    icon: Croissant,
    gradient: "from-[#b45309] via-[#d97706] to-[#fbbf24]",
    glowColor: "rgba(251, 191, 36, 0.25)",
    accentText: "text-amber-700",
    softPill: "bg-amber-50 text-amber-700 border-amber-200",
    categories: ["All Fresh", "Cakes", "Pastries", "Breads", "Custom Order"],
    products: [
      { name: "Belgian Truffle Cake 1kg", sku: "BK-14 • Fresh 8am", price: "৳1,650", stock: "6 Ready", badge: "Custom" },
      { name: "Butter Croissant (6 pcs)", sku: "OVEN-02", price: "৳540", stock: "12 Boxes", badge: "Hot" },
      { name: "Artisan Sourdough Loaf", sku: "BREAD-09", price: "৳380", stock: "18 Loaves" },
      { name: "Red Velvet Pastry Slice", sku: "PASTRY-03", price: "৳220", stock: "24 Slices" },
      { name: "Cheese Danish Roll", sku: "PASTRY-11", price: "৳160", stock: "19 Pieces" },
      { name: "Black Forest (500g)", sku: "CAKE-07", price: "৳890", stock: "9 Ready" },
    ],
    cartItems: [
      { name: "Belgian Truffle Cake 1kg", qty: 1, unitPrice: "৳1,650", lineTotal: "৳1,650" },
      { name: "Butter Croissant (6 pcs)", qty: 2, unitPrice: "৳540", lineTotal: "৳1,080" },
      { name: "Red Velvet Pastry Slice", qty: 3, unitPrice: "৳220", lineTotal: "৳660" },
    ],
    subtotal: "৳3,390",
    vat: "৳169",
    payableTotal: "৳3,559",
    ctaLabel: "Print Box Label & Receipt",
  },
  {
    id: "salon-pos",
    businessType: "SALON",
    terminalName: "Salon & Spa POS",
    tagline: "Stylist Commission Split • Chair Queue • Retail Add-ons",
    icon: Scissors,
    gradient: "from-[#be123c] via-[#e11d48] to-[#fb7185]",
    glowColor: "rgba(251, 113, 133, 0.25)",
    accentText: "text-rose-700",
    softPill: "bg-rose-50 text-rose-700 border-rose-200",
    categories: ["All Services", "Hair Care", "Facial & Spa", "Grooming", "Retail"],
    products: [
      { name: "Keratin Hair Treatment", sku: "Stylist: Nadia", price: "৳4,500", stock: "90 mins", badge: "20% Comm" },
      { name: "Bridal Glow Facial", sku: "Suite #02", price: "৳3,200", stock: "60 mins" },
      { name: "Executive Haircut & Beard", sku: "Stylist: Rafiq", price: "৳850", stock: "45 mins" },
      { name: "Argan Repair Serum", sku: "RETAIL-08", price: "৳1,450", stock: "11 Bottles", badge: "Product" },
      { name: "Deep Tissue Spa 60m", sku: "Suite #04", price: "৳2,600", stock: "60 mins" },
      { name: "Vitamin C Hair Mask", sku: "RETAIL-12", price: "৳1,100", stock: "16 Jars" },
    ],
    cartItems: [
      { name: "Keratin Hair Treatment", qty: 1, unitPrice: "৳4,500", lineTotal: "৳4,500" },
      { name: "Argan Repair Serum", qty: 1, unitPrice: "৳1,450", lineTotal: "৳1,450" },
    ],
    subtotal: "৳5,950",
    vat: "৳297",
    payableTotal: "৳6,247",
    ctaLabel: "Settle & Credit Commission",
  },
  {
    id: "repair-pos",
    businessType: "REPAIR",
    terminalName: "Repair & Service POS",
    tagline: "Diagnostic Job Cards • Serial Warranty • Spare Parts Billing",
    icon: Wrench,
    gradient: "from-[#6d28d9] via-[#7c3aed] to-[#a78bfa]",
    glowColor: "rgba(167, 139, 250, 0.28)",
    accentText: "text-violet-700",
    softPill: "bg-violet-50 text-violet-700 border-violet-200",
    categories: ["All Jobs", "Job Cards", "Spare Parts", "Warranty", "Diagnostics"],
    products: [
      { name: "iPhone 15 Pro Logic Repair", sku: "JOB #RMA-409", price: "৳14,500", stock: "90d Warranty", badge: "Ready" },
      { name: "OLED Display Assembly", sku: "PART-882 • Serial", price: "৳9,800", stock: "6 Units" },
      { name: "Laptop Thermal Service", sku: "SVC-104", price: "৳1,500", stock: "Tech: Tanvir" },
      { name: "Original Battery Pack", sku: "PART-301", price: "৳3,400", stock: "14 Units", badge: "OEM" },
      { name: "NVMe SSD 1TB Upgrade", sku: "PART-712", price: "৳7,200", stock: "11 Units" },
      { name: "Board Diagnostic Check", sku: "SVC-001", price: "৳500", stock: "Standard" },
    ],
    cartItems: [
      { name: "iPhone 15 Pro Logic Repair", qty: 1, unitPrice: "৳14,500", lineTotal: "৳14,500" },
      { name: "Original Battery Pack", qty: 1, unitPrice: "৳3,400", lineTotal: "৳3,400" },
    ],
    subtotal: "৳17,900",
    vat: "৳895",
    payableTotal: "৳18,795",
    ctaLabel: "Close Job Card & Print Warranty",
  },
];

export function DashboardShowcaseVFX({
  onSelectVertical,
}: {
  onSelectVertical?: (businessType: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = EIGHT_POS_SCREENS[activeIndex];
  const CurrentIcon = current.icon;

  // Seamless auto-cycling across all 8 POS Terminal screens
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % EIGHT_POS_SCREENS.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full select-none">
      {/* Soft Pastel Sky / Vertical Aura Halo */}
      <motion.div
        animate={{
          background: `radial-gradient(ellipse at 50% 45%, ${current.glowColor} 0%, transparent 68%)`,
        }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        className="pointer-events-none absolute -inset-8 sm:-inset-14 blur-3xl opacity-90"
        aria-hidden
      />

      {/* Light Frosted Crystal POS Terminal Frame */}
      <div className="relative z-10 w-full rounded-2xl border border-sky-200/90 bg-white/95 backdrop-blur-2xl shadow-[0_28px_80px_-16px_rgba(2,132,199,0.20)] overflow-hidden">
        {/* Laser Auto-Progress Bar */}
        <div className="h-[3.5px] w-full bg-sky-100 overflow-hidden">
          <motion.div
            key={current.id}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.6, ease: "linear" }}
            className={`h-full bg-gradient-to-r ${current.gradient}`}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 18, scale: 0.988 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.988 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {/* POS Header Bar with Silky Wave Highlight */}
            <div
              className={`relative overflow-hidden bg-gradient-to-r ${current.gradient} px-5 sm:px-7 py-4 text-white flex flex-wrap items-center justify-between gap-3`}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(circle at 85% 20%, rgba(255,255,255,0.65), transparent 50%)",
                }}
              />

              <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
                  <CurrentIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm sm:text-lg font-black tracking-tight">
                      {current.terminalName}
                    </h3>
                    <span className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-mono font-bold">
                      POS {activeIndex + 1} / 8
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-white/90 font-medium">
                    {current.tagline}
                  </p>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-2.5">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 px-3 py-1 text-[11px] font-bold">
                  <Wifi size={12} className="text-emerald-200" />
                  <span>Offline IndexedDB Ready</span>
                </span>
                {onSelectVertical && (
                  <button
                    type="button"
                    onClick={() => onSelectVertical(current.businessType)}
                    className="rounded-sm bg-white px-3.5 py-1.5 text-xs font-extrabold text-sky-900 shadow-sm hover:bg-sky-50 transition cursor-pointer"
                  >
                    Get This POS
                  </button>
                )}
              </div>
            </div>

            {/* Clean Light Split POS Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-sky-100">
              {/* LEFT: Search, Category Pills & Product Grid */}
              <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-6 space-y-4 bg-[#f8fbff]">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex-1 flex items-center gap-2.5 rounded-lg border border-sky-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-500 shadow-2xs">
                    <Search size={15} className="text-sky-600 shrink-0" />
                    <span className="truncate">
                      Scan barcode, SKU or search {current.terminalName.toLowerCase()}...
                    </span>
                    <span className="ml-auto rounded bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-sky-700">
                      F2
                    </span>
                  </div>
                  <div className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200/80 bg-white px-3.5 py-2.5 text-xs font-bold text-sky-700 shadow-2xs">
                    <Barcode size={15} />
                    <span>Scanner Ready</span>
                  </div>
                </div>

                {/* Category Strip */}
                <div className="flex items-center gap-2 overflow-hidden">
                  {current.categories.map((cat, idx) => (
                    <span
                      key={cat}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold whitespace-nowrap ${
                        idx === 0
                          ? `bg-gradient-to-r ${current.gradient} text-white shadow-xs`
                          : "border border-sky-100 bg-white text-slate-600"
                      }`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Product Catalog Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {current.products.map((prod, idx) => (
                    <motion.div
                      key={prod.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * idx, duration: 0.25 }}
                      className="rounded-xl border border-sky-100 bg-white p-3.5 shadow-2xs hover:border-sky-300 hover:shadow-md transition flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          {prod.sku}
                        </span>
                        {prod.badge && (
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[9px] font-extrabold shrink-0 ${current.softPill}`}
                          >
                            {prod.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug line-clamp-2">
                        {prod.name}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className={`text-sm font-black tabular-nums ${current.accentText}`}>
                          {prod.price}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {prod.stock}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Clean Light Billing Cart Panel */}
              <div className="lg:col-span-5 xl:col-span-4 bg-white p-4 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-sky-600" />
                      Active POS Ticket
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                      <PauseCircle size={11} /> Hold (F8)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {current.cartItems.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-lg border border-sky-100 bg-[#f6faff] px-3 py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {item.qty} × {item.unitPrice}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded bg-white border border-sky-200 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                            ×{item.qty}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                            {item.lineTotal}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="tabular-nums font-semibold">{current.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>VAT / Tax</span>
                      <span className="tabular-nums font-semibold">{current.vat}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-900">Total Payable</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                        {current.payableTotal}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold text-slate-700">
                    <div className="rounded border border-sky-100 bg-[#f7fbff] py-1.5 flex flex-col items-center gap-0.5">
                      <Banknote size={13} className="text-emerald-600" />
                      <span>Cash</span>
                    </div>
                    <div className="rounded border border-sky-100 bg-[#f7fbff] py-1.5 flex flex-col items-center gap-0.5">
                      <CreditCard size={13} className="text-sky-600" />
                      <span>Card</span>
                    </div>
                    <div className="rounded border border-sky-100 bg-[#f7fbff] py-1.5 flex flex-col items-center gap-0.5">
                      <Smartphone size={13} className="text-pink-600" />
                      <span>bKash</span>
                    </div>
                    <div className="rounded border border-sky-100 bg-[#f7fbff] py-1.5 flex flex-col items-center gap-0.5">
                      <QrCode size={13} className="text-amber-600" />
                      <span>QR</span>
                    </div>
                  </div>

                  <div
                    className={`w-full rounded-lg bg-gradient-to-r ${current.gradient} py-3 px-4 text-center text-xs font-black text-white shadow-md flex items-center justify-center gap-2`}
                  >
                    <Printer size={14} />
                    <span>{current.ctaLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Minimal Light Footer Progress Strip */}
        <div className="border-t border-sky-100 bg-[#f3f9ff] px-5 py-2.5 flex items-center justify-between text-[11px] font-semibold text-sky-800/75">
          <span>Auto-flowing across 8 specialized POS terminals</span>
          <div className="flex items-center gap-1.5">
            {EIGHT_POS_SCREENS.map((s, idx) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? "w-7 bg-sky-600" : "w-1.5 bg-sky-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
