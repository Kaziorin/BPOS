"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
  ArrowRight,
  MessageCircle,
  FileText,
  ShoppingBag,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { StorefrontAPI } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import toast from "react-hot-toast";

const ORDER_STEPS = [
  { key: "PENDING", label: "Order Placed", desc: "Order details received in system" },
  { key: "CONFIRMED", label: "Confirmed", desc: "Verified by store sales manager" },
  { key: "PROCESSING", label: "Packed & Ready", desc: "Goods prepared at warehouse" },
  { key: "SHIPPED", label: "In Transit", desc: "Dispatched via delivery rider" },
  { key: "DELIVERED", label: "Delivered", desc: "Successfully completed" },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderNo = searchParams.get("orderNo") || "";
  const initialPhone = searchParams.get("phone") || "";

  const { theme } = useTheme();
  const [orderNo, setOrderNo] = useState(initialOrderNo);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialOrderNo) {
      setOrderNo(initialOrderNo);
      setPhone(initialPhone);
      executeTracking(initialOrderNo, initialPhone);
    }
  }, [initialOrderNo, initialPhone]);

  const executeTracking = async (searchNum: string, phoneNum?: string) => {
    try {
      setLoading(true);
      setSearched(true);
      const res = await StorefrontAPI.trackOrder(searchNum.trim(), phoneNum?.trim() || undefined);
      if (res && (res.id || res.orderNo)) {
        setOrder(res);
      } else {
        setOrder(null);
      }
    } catch (err) {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNo.trim()) {
      toast.error("Please enter an order or invoice number");
      return;
    }
    executeTracking(orderNo, phone);
  };

  const getStepIndex = (status?: string) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") return 4;
    if (s === "SHIPPED" || s === "IN_TRANSIT" || s === "DISPATCHED") return 3;
    if (s === "PROCESSING" || s === "PACKED") return 2;
    if (s === "CONFIRMED" || s === "PAID") return 1;
    return 0;
  };

  const currentStep = getStepIndex(order?.status);

  return (
    <div className={`min-h-screen flex flex-col ${theme.isDarkMode ? "bg-zinc-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <Navbar isDarkMode={theme.isDarkMode} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header Title */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1"
            style={{ backgroundColor: `${theme.primaryColor || "#2563eb"}15`, color: theme.primaryColor || "#2563eb" }}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Live Delivery Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Track Your Order Status
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter your Order ID / Invoice Number to view real-time shipping progression and items summary.
          </p>
        </div>

        {/* Search Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl mb-10 ${theme.isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
          <form onSubmit={handleTrack} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            <div className="md:col-span-6 space-y-1.5">
              <label className="block text-xs font-bold text-slate-400">Order ID or Invoice Number *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. ORD-2026-0001"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-mono border focus:outline-none ${
                    theme.isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
              </div>
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-400">Customer Phone Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 01700000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none ${
                  theme.isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                style={{
                  backgroundColor: theme.primaryColor || "#2563eb",
                  boxShadow: `0 6px 20px ${theme.primaryColor || "#2563eb"}40`,
                }}
              >
                {loading ? (
                  <span>Searching...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {searched && (
          <div>
            {order ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Order Meta Header Card */}
                <div className={`p-6 rounded-3xl border ${theme.isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black font-mono text-white">
                          #{order.orderNo || order.id}
                        </h2>
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {order.status || "PROCESSING"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Placed on: {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${(theme.whatsappOrderPhone || "+8801700000000").replace(/[^0-9]/g, "")}?text=Inquiry about order ${order.orderNo || order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-transform active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Ask on WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* 5-Step Progress Timeline */}
                  <div className="py-8">
                    <div className="relative">
                      {/* Connecting Line */}
                      <div className="absolute top-5 left-4 right-4 h-1 bg-slate-800 -z-0 hidden sm:block">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            backgroundColor: theme.primaryColor || "#2563eb",
                            width: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Steps Icons */}
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                        {ORDER_STEPS.map((st, i) => {
                          const isDone = i <= currentStep;
                          const isCurrent = i === currentStep;

                          return (
                            <div key={st.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                                  isDone
                                    ? "text-white"
                                    : "bg-slate-800 text-slate-500 border border-slate-700"
                                } ${isCurrent ? "ring-4 ring-offset-2 ring-offset-slate-900" : ""}`}
                                style={isDone ? { backgroundColor: theme.primaryColor || "#2563eb" } : {}}
                              >
                                {isDone ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                              </div>
                              <div>
                                <span className={`block text-xs font-bold ${isDone ? "text-white" : "text-slate-500"}`}>
                                  {st.label}
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                  {st.desc}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Customer & Shipping Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-800/40 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Delivery Destination
                      </span>
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        <span>{order.customerName || "Customer"}</span>
                      </p>
                      <p className="text-slate-300">{order.shippingAddress || "Standard Delivery Address"}</p>
                      {order.customerPhone && (
                        <p className="text-slate-400 flex items-center gap-1 pt-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{order.customerPhone}</span>
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Payment & Order Summary
                      </span>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Payment Method:</span>
                        <strong className="text-white uppercase">{order.paymentMethod || "Cash on Delivery"}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Delivery Fee:</span>
                        <span>৳{order.shippingCost || 60}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 font-bold text-sm text-white">
                        <span>Total Payable:</span>
                        <span style={{ color: theme.primaryColor || "#2563eb" }}>
                          ৳{(order.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ordered Items List */}
                {order.items && order.items.length > 0 && (
                  <div className={`p-6 rounded-3xl border ${theme.isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                    <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-sky-400" />
                      <span>Package Contents ({order.items.length} Items)</span>
                    </h3>

                    <div className="divide-y divide-slate-800/60">
                      {order.items.map((it: any, idx: number) => (
                        <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold overflow-hidden shrink-0">
                              {it.image ? (
                                <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white">{it.name || it.productName || `Item #${idx + 1}`}</h4>
                              <span className="text-[11px] text-slate-400">
                                Qty: <strong>{it.qty || it.quantity || 1}</strong> × ৳{it.unitPrice || it.price || 0}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-white">
                            ৳{((it.qty || it.quantity || 1) * (it.unitPrice || it.price || 0)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`p-10 rounded-3xl border text-center space-y-3 ${theme.isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-white">No Order Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  We could not locate an active order matching <strong>"{orderNo}"</strong>. Please double-check your receipt or contact our support team.
                </p>
                <div className="pt-2">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
                  >
                    <span>Browse Store Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading tracking data...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}

