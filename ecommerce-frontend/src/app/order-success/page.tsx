"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Truck, ShoppingBag, ArrowRight, Store, Copy } from "lucide-react";
import toast from "react-hot-toast";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get("orderNo") || "ECO-XXXXXX";
  const phone = searchParams.get("phone") || "";

  const handleCopyOrderNo = () => {
    navigator.clipboard.writeText(orderNo);
    toast.success("Order number copied to clipboard!");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/15">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          Order Received & Synced
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Thank You For Your Order!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Your order has been recorded in the physical store database. Our fulfillment team is preparing your items.
        </p>
      </div>

      {/* Order No Card */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Order Tracking Number</p>
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-xl font-black text-sky-700 bg-sky-50 px-4 py-2 rounded-xl border border-sky-100">
            {orderNo}
          </span>
          <button
            onClick={handleCopyOrderNo}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Copy Order Number"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400">Save this code to track your delivery status anytime.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href={`/track-order?orderNo=${encodeURIComponent(orderNo)}${phone ? `&phone=${encodeURIComponent(phone)}` : ""}`}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <Truck className="w-4 h-4" />
          <span>Track Order Status</span>
        </Link>

        <Link
          href="/products"
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading receipt...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
