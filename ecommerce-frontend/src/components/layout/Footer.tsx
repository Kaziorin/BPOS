"use client";

import React from "react";
import Link from "next/link";
import { Store, ShieldCheck, Truck, RefreshCw, Headphones, Phone, Mail, MapPin } from "lucide-react";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function Footer() {
  const { config, storeName, businessType } = useStoreConfig();

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
              <h4 className="text-sm font-bold text-white">Fast Store Delivery</h4>
              <p className="text-xs text-slate-400">Directly dispatched to you</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Authentic</h4>
              <p className="text-xs text-slate-400">Directly verified stock</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Direct Store Pickup</h4>
              <p className="text-xs text-slate-400">Click & Collect available</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Instant Customer Support</h4>
              <p className="text-xs text-slate-400">Call or chat directly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">{storeName}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              {config?.tenant?.tagline || `Shop quality authentic products online with real-time stock sync directly from ${storeName}.`}
            </p>
            {config?.tenant?.address && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{config.tenant.address}</span>
              </div>
            )}
          </div>

          {/* Customer Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-white transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Contact & Support</h4>
            <ul className="space-y-2.5 text-xs">
              {config?.tenant?.phone && (
                <li className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{config.tenant.phone}</span>
                </li>
              )}
              {config?.tenant?.email && (
                <li className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>{config.tenant.email}</span>
                </li>
              )}
              <li className="text-slate-400 text-[11px] pt-2">
                Business Type: <strong className="text-sky-300 font-semibold">{businessType}</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        <p className="text-[11px]">Powered by <span className="text-slate-400 font-semibold">BlueOceans POS</span></p>
      </div>
    </footer>
  );
}
