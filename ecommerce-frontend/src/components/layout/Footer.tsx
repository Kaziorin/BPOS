"use client";

import React from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  MessageCircle,
  Youtube,
  ArrowUpRight,
} from "lucide-react";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useTheme } from "@/context/ThemeContext";

const SHOP_LINKS = [
  { label: "All Products", href: "/products" },
  { label: "New Arrivals", href: "/products?sort=newest" },
  { label: "Popular Items", href: "/products?sort=popular" },
  { label: "Shopping Cart", href: "/cart" },
];

const INFO_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Track Order", href: "/track-order" },
  { label: "Checkout", href: "/checkout" },
];

const PAYMENT_BADGES = [
  { name: "bKash", cls: "bg-pink-500/15 text-pink-300 border-pink-500/30" },
  { name: "Nagad", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  { name: "Cards", cls: "bg-stone-800 text-stone-200 border-stone-700" },
  { name: "Cash on Delivery", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
];

export default function Footer() {
  const { config, storeName } = useStoreConfig();
  const { theme } = useTheme();

  const rawBrand = theme.headerLogoText;
  const brandName = rawBrand && rawBrand !== "ShopEase" ? rawBrand : storeName || "SalePay";
  const aboutText =
    theme.footerAboutText ||
    config?.tenant?.tagline ||
    `Shop authentic essentials with live store inventory, transparent pricing, and reliable home delivery from ${brandName}.`;

  const phone = theme.footerPhone || config?.tenant?.phone || "+880 1700-000000";
  const email = theme.footerEmail || config?.tenant?.email || "support@salepay.com";
  const address = theme.footerAddress || config?.tenant?.address || "Dhaka, Bangladesh";
  const copyright =
    theme.footerCopyright || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;

  const socialItems = [
    theme.footerFacebook && {
      href: theme.footerFacebook,
      label: "Facebook",
      icon: Facebook,
    },
    theme.footerInstagram && {
      href: theme.footerInstagram,
      label: "Instagram",
      icon: Instagram,
    },
    theme.footerWhatsapp && {
      href: `https://wa.me/${theme.footerWhatsapp.replace(/[^0-9]/g, "")}`,
      label: "WhatsApp",
      icon: MessageCircle,
    },
    theme.footerYoutube && {
      href: theme.footerYoutube,
      label: "YouTube",
      icon: Youtube,
    },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>;

  return (
    <footer className="relative overflow-hidden bg-[#1C1917] text-stone-300 border-t-2 border-orange-600/80">
      {/* Subtle Top Warm Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[720px] h-52 rounded-full bg-orange-600/10 blur-3xl"
      />

      {/* Main Footer Grid */}
      <div className="relative z-10 max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 py-12 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              {theme.headerLogo ? (
                <img
                  src={theme.headerLogo}
                  alt={brandName}
                  className="h-9 max-w-[150px] object-contain rounded-lg"
                />
              ) : (
                <img
                  src="/logos/salepay-logo-white.png"
                  alt="SalePay"
                  className="h-9 max-w-[150px] object-contain"
                />
              )}
              <span className="text-sm font-semibold !text-stone-200 border-l border-stone-700 pl-3">
                {brandName}
              </span>
            </div>

            <p className="text-xs sm:text-[13px] !text-stone-400 leading-relaxed max-w-md">
              {aboutText}
            </p>

            {address && (
              <div className="flex items-center gap-2.5 text-xs !text-stone-300 pt-1">
                <span className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700/80 text-orange-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </span>
                <span>{address}</span>
              </div>
            )}

            {socialItems.length > 0 && (
              <div className="flex items-center gap-2.5 pt-2">
                {socialItems.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 hover:bg-orange-600 hover:border-orange-600 !text-stone-300 hover:!text-white flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop Links */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider !text-white mb-4">
              Shop
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              {SHOP_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="!text-stone-400 hover:!text-orange-400 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information Links */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider !text-white mb-4">
              Information
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              {INFO_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="!text-stone-400 hover:!text-orange-400 transition-colors inline-flex items-center gap-1"
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Payments */}
          <div className="md:col-span-3 space-y-5">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider !text-white mb-4">
                Customer Support
              </h4>
              <ul className="space-y-3 text-xs sm:text-[13px]">
                {phone && (
                  <li className="flex items-center gap-2.5 !text-stone-300">
                    <span className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700/80 text-orange-400 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <a href={`tel:${phone}`} className="hover:!text-orange-400 transition-colors">
                      {phone}
                    </a>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-2.5 !text-stone-300">
                    <span className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700/80 text-orange-400 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <a href={`mailto:${email}`} className="hover:!text-orange-400 transition-colors truncate">
                      {email}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {theme.footerShowPaymentIcons !== false && (
              <div className="pt-4 border-t border-stone-800/90">
                <span className="text-[11px] font-semibold uppercase tracking-wider !text-stone-500 block mb-2.5">
                  Accepted Payments
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PAYMENT_BADGES.map((badge) => (
                    <span
                      key={badge.name}
                      className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold ${badge.cls}`}
                    >
                      {badge.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="relative z-10 border-t border-stone-800/90 bg-stone-950/50">
        <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs !text-stone-400">
          <p>{copyright}</p>
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 !text-orange-400 hover:!text-orange-300 font-medium transition-colors"
            >
              <span>Browse Store</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-stone-700">•</span>
            <span className="text-[11px]">
              Powered by <strong className="!text-stone-200 font-semibold">SalePay</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
