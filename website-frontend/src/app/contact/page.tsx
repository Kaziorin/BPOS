"use client";

import React, { useState } from "react";
import { useWebsite } from "@/context/WebsiteContext";

export default function ContactPage() {
  const { site, submitInquiry, notify } = useWebsite();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await submitInquiry({ name: name.trim(), phone: phone.trim(), email: email.trim(), message: message.trim() });
    setSubmitting(false);
    notify(res.message, res.ok ? "success" : "error");
    if (res.ok) {
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    }
  };

  return (
    <div className="page-enter w-full">
      <section
        className="w-full py-14 text-white"
        style={{ background: `linear-gradient(135deg, #0f172a 0%, ${site.accent} 100%)` }}
      >
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-xs font-bold uppercase tracking-widest text-white/75 mb-2">Get In Touch</div>
          <h1 className="text-4xl font-black">Contact &amp; Reservations</h1>
          <p className="text-white/85 mt-2">Reach out to {site.storeName} anytime for bookings, visits, or inquiries.</p>
        </div>
      </section>
      <section className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 grid lg:grid-cols-2 gap-8">
        <div className="card-3d bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
          <h2 className="text-2xl font-black text-slate-900">Branch Information</h2>
          <div className="space-y-3 text-sm text-slate-700 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><strong>Phone:</strong> {site.phone}</div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><strong>Email:</strong> {site.email}</div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><strong>Address:</strong> {site.address}</div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><strong>Opening Hours:</strong> {site.hours}</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="card-3d bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
          <h2 className="text-2xl font-black text-slate-900">Send an Inquiry</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} type="text" required placeholder="Your Name *" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="text" required placeholder="Phone Number *" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (Optional)" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Your message or booking details..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-lg transition disabled:opacity-60"
            style={{ backgroundColor: site.accent }}
          >
            {submitting ? "Sending..." : "Send Message / Inquiry"}
          </button>
        </form>
      </section>
    </div>
  );
}
