"use client";

import React from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { cart, cartCount, cartSubtotal, updateQty, removeFromCart, clearCart } = useCart();

  const shippingCost = cartSubtotal >= 2000 || cartSubtotal === 0 ? 0 : 60;
  const grandTotal = cartSubtotal + shippingCost;

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-20 h-20 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Your Cart is Currently Empty</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Explore our store products across 9 business categories and add your favorite items to your order.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-1">{cartCount} items selected</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Items Table / List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 divide-y divide-slate-100">
          {cart.map((item) => (
            <div key={`${item.productId}-${item.variant || ""}`} className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-4 flex-1">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                  {item.variant && (
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md">
                      Variant: {item.variant}
                    </span>
                  )}
                  <p className="text-xs font-semibold text-slate-500">
                    Unit Price: ৳{item.price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Quantity & Line Total */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => updateQty(item.productId, item.qty - 1)}
                    className="p-1.5 hover:bg-white text-slate-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-800">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.productId, item.qty + 1)}
                    className="p-1.5 hover:bg-white text-slate-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <span className="text-sm font-black text-slate-900">
                    ৳{(item.price * item.qty).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Items Subtotal</span>
              <span className="font-bold text-slate-800">৳{cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery Fee</span>
              <span className="font-bold text-slate-800">
                {shippingCost === 0 ? "FREE" : `৳${shippingCost}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-200">
              <span>Grand Total</span>
              <span>৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full py-4 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Real-Time Stock Protected</span>
            </div>
            <p>Your order items will be instantly reserved at our warehouse once submitted.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
