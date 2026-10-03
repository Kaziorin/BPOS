"use client";

import React from "react";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  MessageCircle,
  Youtube,
  CreditCard,
} from "lucide-react";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useTheme } from "@/context/ThemeContext";

export default function Footer() {
  const { config, storeName, businessType } = useStoreConfig();
  const { theme } = useTheme();

  const brandName = theme.headerLogoText || storeName || "ShopEase";
  const aboutText =
    theme.footerAboutText ||
    config?.tenant?.tagline ||
    `Shop 100% authentic products online with real-time stock sync and express home delivery from ${brandName}.`;

  const phone = theme.footerPhone || config?.tenant?.phone || "+880 1700-000000";
  const email = theme.footerEmail || config?.tenant?.email || "support@shopease.com";
  const address = theme.footerAddress || config?.tenant?.address || "Dhaka, Bangladesh";
  const copyright = theme.footerCopyright || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;

  return (
    <footer className="bg-slate-950 text-slate-300 pt-14 pb-8 border-t border-slate-800/80">
      {/* Value Proposition Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
              style={{ backgroundColor: `${theme.primaryColor || "#2563eb"}15`, color: theme.primaryColor || "#2563eb" }}
            >
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Fast Store Delivery</h4>
              <p className="text-xs text-slate-400">Directly dispatched to you</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Authentic</h4>
              <p className="text-xs text-slate-400">Directly verified stock</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Direct Store Pickup</h4>
              <p className="text-xs text-slate-400">Click & Collect available</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">24/7 Support</h4>
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
              {theme.headerLogo ? (
                <img
                  src={theme.headerLogo}
                  alt={brandName}
                  className="h-9 max-w-[150px] object-contain rounded-lg"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                  style={{ backgroundColor: theme.primaryColor || "#2563eb" }}
                >
                  <Store className="w-5 h-5" />
                </div>
              )}
              <span className="text-xl font-extrabold tracking-tight text-white">{brandName}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">{aboutText}</p>
            
            {address && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{address}</span>
              </div>
            )}

            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-2">
              {theme.footerFacebook && (
                <a
                  href={theme.footerFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-sky-600 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {theme.footerInstagram && (
                <a
                  href={theme.footerInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-pink-600 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {theme.footerWhatsapp && (
                <a
                  href={`https://wa.me/${theme.footerWhatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {theme.footerYoutube && (
                <a
                  href={theme.footerYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  📦 Track Your Order
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
              <li>
                <Link href="/setup" className="text-sky-400 hover:underline transition-colors font-medium">
                  🛠 Visual Store Builder
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-4">Contact & Support</h4>
            <ul className="space-y-2.5 text-xs">
              {phone && (
                <li className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{phone}</span>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{email}</span>
                </li>
              )}
              <li className="text-slate-400 text-[11px] pt-2">
                Business Type: <strong className="text-sky-300 font-semibold">{businessType}</strong>
              </li>
            </ul>

            {/* Payment Methods Badges */}
            {theme.footerShowPaymentIcons !== false && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-1.5 uppercase font-bold tracking-wider">
                  Accepted Payments
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-pink-950/60 text-pink-400 border border-pink-500/30 text-[10px] font-bold">
                    bKash
                  </span>
                  <span className="px-2 py-0.5 rounded bg-orange-950/60 text-orange-400 border border-orange-500/30 text-[10px] font-bold">
                    Nagad
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                    Cards
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    Cash On Delivery
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>{copyright}</p>
        <p className="text-[11px] flex items-center gap-1">
          <span>Powered by</span>
          <strong className="text-slate-300 font-bold">BlueOceans POS & E-Commerce</strong>
        </p>
      </div>
    </footer>
  );
}
