"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Upload, FileText, CheckCircle2, Phone, Search, Pill } from "lucide-react";
import { StoreConfig, ProductItem, CategoryItem } from "@/lib/api";
import DynamicProductCard from "@/components/products/DynamicProductCard";
import toast from "react-hot-toast";

interface PharmacyStoreProps {
  config: StoreConfig;
  products: ProductItem[];
  categories: CategoryItem[];
}

export default function PharmacyStore({ config, products, categories }: PharmacyStoreProps) {
  const storeName = config.tenant.name || "Pharmacy & Healthcare";
  const [prescriptionPhone, setPrescriptionPhone] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handlePrescriptionUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionPhone.trim()) {
      toast.error("Please provide your phone number");
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setPrescriptionPhone("");
      toast.success("Prescription submitted! Our pharmacist will call you shortly to confirm your order.");
    }, 1000);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* ── 1. PHARMACY HERO & PRESCRIPTION UPLOAD BANNER ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-teal-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold backdrop-blur-md">
              <Pill className="w-3.5 h-3.5" />
              <span>Licensed Healthcare & Authentic Medicine Provider</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Order Authentic Medicines & <br />
              <span className="bg-gradient-to-r from-sky-300 via-teal-200 to-emerald-200 bg-clip-text text-transparent">
                Healthcare Essentials.
              </span>
            </h1>
            <p className="text-slate-300 text-base max-w-xl font-light">
              <strong className="text-white font-semibold">{storeName}</strong> provides 100% genuine OTC, prescription medications, vitamins, and healthcare supplies with direct pharmacist review.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2"
              >
                <span>Browse Medicines</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {config.tenant.phone && (
                <a
                  href={`tel:${config.tenant.phone}`}
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-md border border-white/15 transition-all flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Call Pharmacist</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Prescription Upload Form */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Have a Prescription?</h3>
                <p className="text-xs text-slate-300">Upload and our team will prepare the order</p>
              </div>
            </div>

            <form onSubmit={handlePrescriptionUpload} className="space-y-4">
              <div className="border-2 border-dashed border-sky-300/40 hover:border-sky-300 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-sky-950/30">
                <FileText className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-200">Click to upload prescription photo or PDF</p>
                <p className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG, PDF</p>
                <input type="file" className="hidden" id="prescriptionFile" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Your Contact Phone Number</label>
                <input
                  type="tel"
                  value={prescriptionPhone}
                  onChange={(e) => setPrescriptionPhone(e.target.value)}
                  placeholder="e.g. 01700-000000"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-sky-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
              >
                {isUploading ? "Uploading..." : "Submit Prescription"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── 2. PHARMACY TRUST BADGES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">100% Genuine Medicines</h4>
              <p className="text-xs text-slate-500">DGDA approved official manufacturers</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Pharmacist Supervised</h4>
              <p className="text-xs text-slate-500">Dose & prescription verification</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Emergency Support</h4>
              <p className="text-xs text-slate-500">Fast delivery for urgent healthcare</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. HEALTHCARE CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Medicine & Healthcare Departments</h2>
              <p className="text-sm text-slate-500 mt-1">Browse OTC, Prescriptions, Vitamins & Devices</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                className="group flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/10 transition-all text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 group-hover:scale-110 flex items-center justify-center font-bold text-lg mb-3 transition-transform">
                  💊
                </div>
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-1">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400 mt-0.5">{cat.productCount || 0} Medicines</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. MEDICINE LISTINGS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Essential Healthcare & Medicines</h2>
            <p className="text-sm text-slate-500 mt-1">In-stock products verified by {storeName}</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            <span>See All Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <DynamicProductCard key={prod.id} product={prod} businessType="PHARMACY" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <p className="text-slate-500">Medicines are currently being loaded into our catalogue.</p>
          </div>
        )}
      </section>
    </div>
  );
}
