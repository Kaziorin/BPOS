"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  Calendar,
  AlertCircle,
  Phone
} from "lucide-react";
import { StorefrontAPI } from "@/lib/api";
import toast from "react-hot-toast";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderNo = searchParams.get("orderNo") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [orderNo, setOrderNo] = useState(initialOrderNo);
  const [phone, setPhone] = useState(initialPhone);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialOrderNo) {
      handleTrack(initialOrderNo, initialPhone);
    }
  }, [initialOrderNo, initialPhone]);

  const handleTrack = async (ono?: string, ph?: string) => {
    const targetNo = ono || orderNo;
    if (!targetNo.trim()) {
      toast.error("Please enter an Order Number");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const data = await StorefrontAPI.trackOrder(targetNo.trim(), (ph !== undefined ? ph : phone).trim());
      setOrderDetails(data);
    } catch (e: any) {
      setOrderDetails(null);
      toast.error(e.response?.data?.message || "Order not found with this number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
          <Truck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Track Your Online Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter your Order Number (e.g. ECO-XXXXXX) to see live fulfillment and courier delivery updates.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs max-w-xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Order Number *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. ECO-000123"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phone Number (Optional)</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="e.g. 01712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {loading ? "Locating Order..." : "Track Status"}
          </button>
        </form>
      </div>

      {/* Result Display */}
      {orderDetails && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in duration-300">
          
          {/* Order Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="px-2.5 py-1 bg-sky-100 text-sky-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Order Tracking
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1 font-mono">{orderDetails.orderNo}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on {new Date(orderDetails.createdAt).toLocaleString()}</span>
              </p>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-xs text-slate-400 block">Current Status</span>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold mt-0.5">
                {orderDetails.status || "CONFIRMED"}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {orderDetails.timeline && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fulfillment Timeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {orderDetails.timeline.map((step: any, idx: number) => (
                  <div
                    key={step.key}
                    className={`p-4 rounded-2xl border text-center space-y-2 ${
                      step.done
                        ? "bg-sky-50/80 border-sky-300 text-sky-900 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                        step.done ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className="block text-xs font-bold">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer & Shipping Note */}
          {orderDetails.note && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Shipping & Order Details</span>
                <p className="mt-0.5">{orderDetails.note}</p>
              </div>
            </div>
          )}

          {/* Order Items Table */}
          {orderDetails.items && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchased Items</h3>
              <div className="divide-y divide-slate-100 border-y border-slate-100">
                {orderDetails.items.map((item: any) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800">{item.productName || "Product Item"}</h4>
                      <span className="text-slate-400">Qty: {item.qtyOrdered} × ৳{item.unitPrice?.toLocaleString()}</span>
                    </div>
                    <span className="font-black text-slate-900">৳{item.lineTotal?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-2">
                <span>Total Amount:</span>
                <span>৳{orderDetails.total?.toLocaleString()}</span>
              </div>
            </div>
          )}

        </div>
      )}

      {searched && !orderDetails && !loading && (
        <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 p-6 space-y-2 max-w-xl mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Order Found</h3>
          <p className="text-xs text-slate-400">
            Please double check your Order Number or phone number and try again.
          </p>
        </div>
      )}

    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
