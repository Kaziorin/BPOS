"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function ContactPage() {
  const { config, storeName } = useStoreConfig();
  const phone = config?.tenant?.phone || "Not listed";
  const email = config?.tenant?.email || "Not listed";
  const address = config?.tenant?.address || "Dhaka, Bangladesh";

  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    setSubmitted(true);
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <div className="min-h-[70vh] bg-[#FAF8F5] text-stone-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Store Contact Info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">Contact {storeName}</h1>
              <p className="text-xs text-stone-500 mt-1">
                Questions about products, stock, or an order? Get in touch with our store team.
              </p>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-stone-400 font-medium">Phone</div>
                  <div className="font-semibold text-stone-800 mt-0.5">{phone}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-stone-400 font-medium">Email</div>
                  <div className="font-semibold text-stone-800 mt-0.5">{email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-stone-400 font-medium">Location</div>
                  <div className="font-semibold text-stone-800 mt-0.5">{address}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Send a Message</h2>

            {submitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold">Message received</div>
                  <p className="text-emerald-700 mt-0.5">
                    Thank you for contacting {storeName}. Our team will get back to you shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1.5">Phone / Email</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we help?"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
