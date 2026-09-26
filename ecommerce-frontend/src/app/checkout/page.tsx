"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  Store,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ChevronRight
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { StorefrontAPI } from "@/lib/api";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, clearCart } = useCart();
  const { customer } = useAuth();

  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [deliveryMethod, setDeliveryMethod] = useState("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery costs
  const deliveryCosts: Record<string, number> = {
    STANDARD: 60,
    EXPRESS: 120,
    STORE_PICKUP: 0,
  };

  const currentDeliveryCost = cartSubtotal >= 2000 && deliveryMethod === "STANDARD" ? 0 : deliveryCosts[deliveryMethod];
  const grandTotal = cartSubtotal + currentDeliveryCost;

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add products to your cart before proceeding to checkout.</p>
        <Link href="/products" className="inline-block px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-semibold">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill in your Full Name, Phone Number, and Delivery Address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        shippingAddress: `${address.trim()}, ${city}`,
        paymentMethod,
        shippingCost: currentDeliveryCost,
        notes: `Delivery: ${deliveryMethod} | ${notes}`.trim(),
        items: cart.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          unitPrice: item.price,
        })),
      };

      const res = await StorefrontAPI.checkout(orderPayload);

      if (res && res.orderNo) {
        clearCart();
        toast.success("Order Placed Successfully!");
        router.push(`/order-success?orderNo=${encodeURIComponent(res.orderNo)}&phone=${encodeURIComponent(phone)}`);
      } else {
        toast.error("Could not place order. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to process checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* ── Breadcrumb & Title ── */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <Link href="/cart" className="inline-flex items-center gap-1 text-xs text-sky-600 font-semibold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Checkout</h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <Lock className="w-3.5 h-3.5" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Customer & Delivery Details */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. Contact Information */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">1</span>
              <span>Contact Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Phone Number (For Order Verification) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address (Optional for Invoice)</label>
                <input
                  type="email"
                  placeholder="e.g. tanvir@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Address */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">2</span>
              <span>Delivery Address</span>
            </h2>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">City / Division *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="Dhaka">Dhaka (Inside City)</option>
                    <option value="Chattogram">Chattogram</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barishal">Barishal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Delivery Preference</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("STANDARD")}
                      className={`flex-1 p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        deliveryMethod === "STANDARD"
                          ? "bg-sky-50 border-sky-500 text-sky-700 shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Standard (৳60)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("EXPRESS")}
                      className={`flex-1 p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        deliveryMethod === "EXPRESS"
                          ? "bg-sky-50 border-sky-500 text-sky-700 shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Express (৳120)
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Detailed Street Address / Area / House No *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="House #, Road #, Sector / Area, Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Special Order Instructions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Please deliver after 5 PM or call upon arrival"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">3</span>
              <span>Select Payment Method</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === "COD"
                    ? "border-sky-600 bg-sky-50/70 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="sr-only"
                />
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Cash on Delivery</span>
                <span className="text-[10px] text-slate-400">Pay when you receive</span>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === "BKASH"
                    ? "border-sky-600 bg-sky-50/70 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="BKASH"
                  checked={paymentMethod === "BKASH"}
                  onChange={() => setPaymentMethod("BKASH")}
                  className="sr-only"
                />
                <Smartphone className="w-6 h-6 text-pink-600" />
                <span className="text-xs font-bold text-slate-800">bKash / Nagad</span>
                <span className="text-[10px] text-slate-400">Direct mobile pay</span>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === "CARD"
                    ? "border-sky-600 bg-sky-50/70 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="CARD"
                  checked={paymentMethod === "CARD"}
                  onChange={() => setPaymentMethod("CARD")}
                  className="sr-only"
                />
                <CreditCard className="w-6 h-6 text-sky-600" />
                <span className="text-xs font-bold text-slate-800">Debit / Credit Card</span>
                <span className="text-[10px] text-slate-400">Visa / Mastercard</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6 sticky top-24">
          <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
            Order Review ({cart.length} items)
          </h2>

          <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.variant || ""}`} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 line-clamp-1">{item.name}</h4>
                    <span className="text-slate-400">Qty: {item.qty} × ৳{item.price.toLocaleString()}</span>
                  </div>
                </div>
                <span className="font-bold text-slate-900">
                  ৳{(item.price * item.qty).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 text-xs pt-4 border-t border-slate-100">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">৳{cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery Cost</span>
              <span className="font-bold text-slate-800">
                {currentDeliveryCost === 0 ? "FREE" : `৳${currentDeliveryCost}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
              <span>Grand Total</span>
              <span>৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Confirming Order...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Place Order</span>
              </>
            )}
          </button>

          <div className="text-[11px] text-slate-400 text-center leading-relaxed">
            By clicking Confirm, your order will be submitted directly to our store management system and inventory reserved.
          </div>
        </div>

      </form>
    </div>
  );
}
