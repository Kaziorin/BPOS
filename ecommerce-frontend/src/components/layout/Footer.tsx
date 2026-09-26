"use client";

import React from "react";
import Link from "next/link";
import { Store, ShieldCheck, Truck, RefreshCw, Headphones, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
      {/* Value Proposition Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Fast Nationwide Delivery</h4>
              <p className="text-xs text-slate-400">Directly from physical stores</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Genuine Products</h4>
              <p className="text-xs text-slate-400">Verified retail inventory</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Easy Returns & Exchange</h4>
              <p className="text-xs text-slate-400">7 Days return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">24/7 Dedicated Support</h4>
              <p className="text-xs text-slate-400">Call or chat anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                BlueOceans
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Omnichannel retail & e-commerce platform. Connects your physical POS retail store with our digital storefront for seamless real-time stock sync.
            </p>
            <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Cloud Inventory Active</span>
            </div>
          </div>

          {/* Business Sectors */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              9 Business Types
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/products?businessType=FASHION" className="hover:text-white transition-colors">Fashion & Apparel</Link></li>
              <li><Link href="/products?businessType=GROCERY" className="hover:text-white transition-colors">Grocery & Supermarket</Link></li>
              <li><Link href="/products?businessType=PHARMACY" className="hover:text-white transition-colors">Pharmacy & Healthcare</Link></li>
              <li><Link href="/products?businessType=RESTAURANT" className="hover:text-white transition-colors">Restaurant & Cafe</Link></li>
              <li><Link href="/products?businessType=ELECTRONICS" className="hover:text-white transition-colors">Electronics & Gadgets</Link></li>
              <li><Link href="/products?businessType=FOOTWEAR" className="hover:text-white transition-colors">Footwear & Bags</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Customer Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/track-order" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link href="/checkout" className="hover:text-white transition-colors">Instant Checkout</Link></li>
              <li><span className="text-slate-500">Shipping & Delivery Info</span></li>
              <li><span className="text-slate-500">Terms & Privacy Policy</span></li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Payment Methods
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center font-bold text-slate-300">
                Cash on Delivery
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center font-bold text-pink-400">
                bKash
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center font-bold text-amber-400">
                Nagad
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center font-bold text-sky-400">
                Visa / Master
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} BlueOceans E-Commerce. Powered by BlueOceans POS Platform.</p>
        <p className="flex items-center gap-1">
          Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Next-Gen Omnichannel Commerce
        </p>
      </div>
    </footer>
  );
}
