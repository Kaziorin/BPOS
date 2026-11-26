"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { useWebsite } from "@/context/WebsiteContext";
import HeroVfxCanvas from "@/components/HeroVfxCanvas";

const INQUIRY_TOPICS = [
  "General Inquiry",
  "Visit / Reservation",
  "Product / Service Info",
  "Corporate / Partnership",
];

export default function ContactPage() {
  const { site, submitInquiry, notify } = useWebsite();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(INQUIRY_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const fullMessage = message.trim()
      ? `[${topic}] ${message.trim()}`
      : `[${topic}] Inquiry from website`;
    const res = await submitInquiry({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: fullMessage,
    });
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
      {/* VFX Hero Header */}
      <section
        className="relative w-full overflow-hidden py-16 sm:py-20 text-white"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${site.accent}55 0%, transparent 45%), linear-gradient(135deg, #060913 0%, #0f172a 50%, ${site.accent} 100%)`,
        }}
      >
        <HeroVfxCanvas variant={site.heroBgStyle} accent={site.accent} />
        <div className="relative z-10 max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-white/90">
            <MessageSquare className="w-3.5 h-3.5" />
            Get In Touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Contact &amp; Reservations
          </h1>
          <p className="text-white/85 max-w-2xl text-base sm:text-lg">
            Reach out to {site.storeName} anytime for bookings, branch visits, partnerships, or personalized inquiries.
          </p>
        </div>
      </section>

      {/* Quick Contact Info Strip */}
      <section className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 -mt-8 relative z-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Phone, label: "Call Us", value: site.phone, href: `tel:${site.phone}` },
          { icon: Mail, label: "Email Desk", value: site.email, href: `mailto:${site.email}` },
          { icon: MapPin, label: "Flagship Address", value: site.address, href: undefined },
          { icon: Clock, label: "Opening Hours", value: site.hours, href: undefined },
        ].map((item) => {
          const Icon = item.icon;
          const inner = (
            <div className="card-3d h-full bg-white rounded-2xl border border-slate-200 p-5 shadow-md flex items-start gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: site.accent }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {item.label}
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5 break-words">
                  {item.value}
                </div>
              </div>
            </div>
          );
          return item.href ? (
            <a key={item.label} href={item.href} className="block">
              {inner}
            </a>
          ) : (
            <div key={item.label}>{inner}</div>
          );
        })}
      </section>

      {/* Main Content: Two Equal Animated 3D Cards (Branch Information + Inquiry Form) */}
      <section className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 py-12 grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: Branch Information Card */}
        <div className="card-3d bg-white rounded-[28px] border border-slate-200 p-8 sm:p-10 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div
                  className="text-xs font-extrabold uppercase tracking-widest"
                  style={{ color: site.accent }}
                >
                  {site.tagline}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Branch Information
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open Today
              </span>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0" style={{ color: site.accent }} />
                <div><strong>Phone:</strong> {site.phone}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0" style={{ color: site.accent }} />
                <div><strong>Email:</strong> {site.email}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: site.accent }} />
                <div><strong>Address:</strong> {site.address}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Clock className="w-4 h-4 shrink-0" style={{ color: site.accent }} />
                <div><strong>Opening Hours:</strong> {site.hours}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
            {[
              "Fast response directly from our branch desk",
              "Dedicated assistance for reservations & bulk inquiries",
              `${site.years} years of trusted customer hospitality`,
            ].map((point) => (
              <div key={point} className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Inquiry Form Card */}
        <form
          onSubmit={handleSubmit}
          className="card-3d bg-white rounded-[28px] border border-slate-200 p-8 sm:p-10 shadow-sm space-y-5"
        >
          <div className="space-y-1">
            <div
              className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest"
              style={{ color: site.accent }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Direct Message
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Send an Inquiry or Reservation
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Inquiry Topic
            </label>
            <div className="flex flex-wrap gap-2">
              {INQUIRY_TOPICS.map((item) => {
                const active = topic === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTopic(item)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${active
                        ? "text-white border-transparent shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    style={active ? { backgroundColor: site.accent } : undefined}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Your Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                required
                placeholder="e.g. Tariq Hasan"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number *
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="text"
                required
                placeholder="+880 1XXX-XXXXXX"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address (Optional)
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Message / Booking Details
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Tell us about your preferred date, inquiry, or request..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-extrabold text-sm shadow-xl hover:opacity-95 transition disabled:opacity-60"
            style={{ backgroundColor: site.accent }}
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Sending Inquiry..." : "Send Message / Inquiry"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
