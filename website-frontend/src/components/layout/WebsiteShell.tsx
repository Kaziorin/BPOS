"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, Info, Mail, MapPin, Phone, X } from "lucide-react";
import { HeroBgStyle, useWebsite } from "@/context/WebsiteContext";
import { INDUSTRY_PRESETS } from "@/lib/presets";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/highlights", label: "Highlights" },
  { href: "/showcase", label: "Showcase" },
  { href: "/contact", label: "Contact" },
];

export default function WebsiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    site,
    categories,
    isAdmin,
    isSuperAdmin,
    configVersion,
    adminOpen,
    setAdminOpen,
    setPreviewDraft,
    setIndustryPreview,
    adminLogin,
    adminLogout,
    saveConfig,
    fetchInquiries,
    toasts,
    notify,
    dismissToast,
  } = useWebsite();

  const navItems = [
    { href: "/", label: site.navHome },
    { href: "/about", label: site.navAbout },
    { href: "/highlights", label: site.navHighlights },
    { href: "/showcase", label: site.navShowcase },
    { href: "/contact", label: site.navContact },
  ];

  const [cmsTab, setCmsTab] = useState<"content" | "header_footer" | "highlights" | "inquiries">("content");
  const [admEmail, setAdmEmail] = useState("");
  const [admPass, setAdmPass] = useState("");
  const [inquiries, setInquiries] = useState<Array<{ id: string; name: string; phone: string; message?: string }>>([]);

  // Form states
  const [name, setName] = useState(site.storeName);
  const [tagline, setTagline] = useState(site.tagline);
  const [logoUrl, setLogoUrl] = useState(site.logoUrl);
  const [heroBgStyle, setHeroBgStyle] = useState<HeroBgStyle>(site.heroBgStyle);
  const [heroImages, setHeroImages] = useState<string[]>(site.heroImages);
  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [industry, setIndustry] = useState(site.key);
  const [accentColor, setAccentColor] = useState(site.accent);
  const [heroPill, setHeroPill] = useState(site.pill);
  const [heroTitle, setHeroTitle] = useState(site.title);
  const [heroDesc, setHeroDesc] = useState(site.desc);
  const [aboutTitle, setAboutTitle] = useState(site.aboutTitle);
  const [aboutText, setAboutText] = useState(site.aboutText);
  const [years, setYears] = useState(site.years);
  const [ctaText, setCtaText] = useState(site.cta);
  const [phone, setPhone] = useState(site.phone);
  const [email, setEmail] = useState(site.email);
  const [address, setAddress] = useState(site.address);
  const [hours, setHours] = useState(site.hours);
  const [highlights, setHighlights] = useState<[string, string][]>(site.highlights);
  const [navHome, setNavHome] = useState(site.navHome);
  const [navAbout, setNavAbout] = useState(site.navAbout);
  const [navHighlights, setNavHighlights] = useState(site.navHighlights);
  const [navShowcase, setNavShowcase] = useState(site.navShowcase);
  const [navContact, setNavContact] = useState(site.navContact);
  const [headerCtaText, setHeaderCtaText] = useState(site.headerCtaText);
  const [headerCtaHref, setHeaderCtaHref] = useState(site.headerCtaHref);
  const [footerDesc, setFooterDesc] = useState(site.footerDesc);
  const [footerBadge, setFooterBadge] = useState(site.footerBadge);
  const [footerCtaText, setFooterCtaText] = useState(site.footerCtaText);
  const [footerCopyright, setFooterCopyright] = useState(site.footerCopyright);
  const [footerBgColor, setFooterBgColor] = useState(site.footerBgColor);

  useEffect(() => {
    setName(site.storeName);
    setTagline(site.tagline);
    setLogoUrl(site.logoUrl);
    setHeroBgStyle(site.heroBgStyle);
    setHeroImages(site.heroImages);
    setIndustry(site.key);
    setAccentColor(site.accent);
    setHeroPill(site.pill);
    setHeroTitle(site.title);
    setHeroDesc(site.desc);
    setAboutTitle(site.aboutTitle);
    setAboutText(site.aboutText);
    setYears(site.years);
    setCtaText(site.cta);
    setPhone(site.phone);
    setEmail(site.email);
    setAddress(site.address);
    setHours(site.hours);
    setHighlights(site.highlights);
    setNavHome(site.navHome);
    setNavAbout(site.navAbout);
    setNavHighlights(site.navHighlights);
    setNavShowcase(site.navShowcase);
    setNavContact(site.navContact);
    setHeaderCtaText(site.headerCtaText);
    setHeaderCtaHref(site.headerCtaHref);
    setFooterDesc(site.footerDesc);
    setFooterBadge(site.footerBadge);
    setFooterCtaText(site.footerCtaText);
    setFooterCopyright(site.footerCopyright);
    setFooterBgColor(site.footerBgColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configVersion, adminOpen]);

  // Live instant preview while editing inside the CMS drawer
  useEffect(() => {
    if (!adminOpen) return;
    setPreviewDraft({
      businessName: name,
      tagline,
      logoUrl,
      heroBgStyle,
      heroImages,
      industry,
      accentColor,
      heroPill,
      heroTitle,
      heroDesc,
      aboutTitle,
      aboutText,
      years,
      ctaText,
      phone,
      email,
      address,
      hours,
      highlights,
      navHome,
      navAbout,
      navHighlights,
      navShowcase,
      navContact,
      headerCtaText,
      headerCtaHref,
      footerDesc,
      footerBadge,
      footerCtaText,
      footerCopyright,
      footerBgColor,
    });
  }, [
    adminOpen,
    name,
    tagline,
    logoUrl,
    heroBgStyle,
    heroImages,
    industry,
    accentColor,
    heroPill,
    heroTitle,
    heroDesc,
    aboutTitle,
    aboutText,
    years,
    ctaText,
    phone,
    email,
    address,
    hours,
    highlights,
    navHome,
    navAbout,
    navHighlights,
    navShowcase,
    navContact,
    headerCtaText,
    headerCtaHref,
    footerDesc,
    footerBadge,
    footerCtaText,
    footerCopyright,
    footerBgColor,
    setPreviewDraft,
  ]);

  useEffect(() => {
    if (cmsTab === "inquiries" && isAdmin) {
      fetchInquiries().then(setInquiries);
    }
  }, [cmsTab, isAdmin, fetchInquiries]);

  const handleSave = async () => {
    const ok = await saveConfig({
      businessName: name.trim(),
      tagline: tagline.trim(),
      logoUrl: logoUrl.trim(),
      heroBgStyle,
      heroImages,
      industry,
      accentColor,
      heroPill: heroPill.trim(),
      heroTitle: heroTitle.trim(),
      heroDesc: heroDesc.trim(),
      aboutTitle: aboutTitle.trim(),
      aboutText: aboutText.trim(),
      years: years.trim(),
      ctaText: ctaText.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      hours: hours.trim(),
      highlights,
      navHome: navHome.trim(),
      navAbout: navAbout.trim(),
      navHighlights: navHighlights.trim(),
      navShowcase: navShowcase.trim(),
      navContact: navContact.trim(),
      headerCtaText: headerCtaText.trim(),
      headerCtaHref,
      footerDesc: footerDesc.trim(),
      footerBadge: footerBadge.trim(),
      footerCtaText: footerCtaText.trim(),
      footerCopyright: footerCopyright.trim(),
      footerBgColor,
    });
    if (ok) {
      setAdminOpen(false);
      notify("Website updated & published to database!", "success");
    } else {
      notify("Failed to save. Please sign in again.", "error");
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-[padding] duration-300 ${adminOpen ? "lg:pr-[430px]" : ""
        }`}
    >
      {/* Admin Top Bar (ONLY visible when Admin is signed in) */}
      {isAdmin && (
        <div className="w-full bg-slate-950 text-white text-xs py-2 border-b border-white/10">
          <div className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold tracking-wide">Admin Mode</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-sky-300 font-semibold">
                {site.preset.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {isSuperAdmin && (
                <>
                  <span className="text-slate-400">Industry:</span>
                  <select
                    value={site.key}
                    onChange={(e) => setIndustryPreview(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none"
                  >
                    {Object.entries(INDUSTRY_PRESETS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <button
                onClick={() => setAdminOpen(true)}
                className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 font-extrabold text-xs shadow transition"
              >
                Customize Website
              </button>
              <button
                onClick={adminLogout}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Navbar */}
      <header className="w-full sticky top-0 z-40 glass-nav border-b border-slate-200/80">
        <div className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src={site.logoUrl || "/logos/salepay-logo-blue.png"}
              alt={site.storeName}
              onError={(e) => {
                e.currentTarget.src = "/logos/salepay-logo-blue.png";
              }}
              className="h-9 w-auto max-w-[140px] object-contain"
            />
            <div>
              <div className="font-extrabold text-base text-slate-900 leading-tight">
                {site.storeName}
              </div>
              <div
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: site.accent }}
              >
                {site.tagline}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-slate-900 transition relative py-1"
                  style={active ? { color: site.accent } : undefined}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute left-0 right-0 -bottom-1 h-0.5 rounded-full"
                      style={{ backgroundColor: site.accent }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <Link
            href={site.headerCtaHref || "/contact"}
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:opacity-95 transition"
            style={{ backgroundColor: site.accent }}
          >
            {site.headerCtaText}
          </Link>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-4 overflow-x-auto px-6 pb-2.5 text-xs font-bold text-slate-600">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap"
              style={pathname === item.href ? { color: site.accent } : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>

      {/* Premium Dynamic Footer */}
      <footer
        className="relative w-full text-slate-300 border-t border-white/10 overflow-hidden"
        style={{ backgroundColor: site.footerBgColor || "#060913" }}
      >
        <div
          className="h-1 w-full opacity-80"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${site.accent} 50%, transparent 100%)` }}
        />
        <div className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={site.logoUrl || "/logos/salepay-logo-blue.png"}
                alt={site.storeName}
                onError={(e) => {
                  e.currentTarget.src = "/logos/salepay-logo-blue.png";
                }}
                className="h-9 w-auto max-w-[130px] object-contain rounded-lg bg-white px-2 py-1"
              />
              <div>
                <div className="text-white font-black text-lg leading-tight">{site.storeName}</div>
                <div
                  className="text-[11px] font-bold uppercase tracking-wider mt-0.5"
                  style={{ color: site.accent }}
                >
                  {site.tagline}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm line-clamp-3">
              {site.footerDesc}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{site.footerBadge}</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="text-xs font-extrabold uppercase tracking-widest text-white">Explore</div>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex items-center gap-1 hover:text-white transition">
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Offerings / Highlights */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="text-xs font-extrabold uppercase tracking-widest text-white">
              {categories.length > 0 ? "Featured Categories" : "Brand Highlights"}
            </div>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {categories.length > 0
                ? categories.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link href="/showcase" className="hover:text-white transition font-medium">
                      {c.name}
                    </Link>
                  </li>
                ))
                : site.highlights.map((h, i) => (
                  <li key={i}>
                    <Link href="/highlights" className="hover:text-white transition font-medium">
                      {h[0]}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="text-xs font-extrabold uppercase tracking-widest text-white">Visit &amp; Contact</div>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                <span>{site.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{site.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{site.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{site.hours}</span>
              </div>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow hover:opacity-95 transition mt-1"
              style={{ backgroundColor: site.accent }}
            >
              <span>{site.footerCtaText}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom Legal & Fixed Software Credit Bar */}
        <div className="border-t border-white/10 bg-black/30">
          <div className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>{site.footerCopyright}</div>
            <div className="flex items-center gap-4">
              <span>Software By Blue Oceans Technologies Ltd</span>
              <button
                onClick={() => setAdminOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-semibold transition"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Live Unblurred Admin CMS Sidebar */}
      {adminOpen && (
        <div className="fixed top-0 right-0 z-50 h-full w-full max-w-[430px] bg-white border-l border-slate-200 shadow-2xl overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Website Dynamic CMS</h3>
              <p className="text-xs text-emerald-600 font-semibold">Live Preview Active — changes show immediately</p>
            </div>
            <button
              onClick={() => {
                setPreviewDraft(null);
                setAdminOpen(false);
              }}
              className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              title="Discard unsaved preview & close"
            >
              ✕
            </button>
          </div>

          {!isAdmin && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-slate-700">Admin Sign In Required to Publish</div>
              <input
                type="email"
                value={admEmail}
                onChange={(e) => setAdmEmail(e.target.value)}
                placeholder="Admin Email"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
              <input
                type="password"
                value={admPass}
                onChange={(e) => setAdmPass(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
              <button
                onClick={async () => {
                  const ok = await adminLogin(admEmail.trim(), admPass);
                  if (ok) {
                    notify("Signed in to Admin CMS!", "success");
                  } else {
                    notify("Invalid credentials.", "error");
                  }
                }}
                className="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
              >
                Sign In
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-b pb-2 text-xs font-bold">
            {([
              ["content", "Content"],
              ["header_footer", "Header & Footer"],
              ["highlights", "Highlights"],
              ["inquiries", "Inquiries"],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setCmsTab(tab)}
                className={`px-3 py-1.5 rounded-lg ${cmsTab === tab ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {cmsTab === "header_footer" && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="font-extrabold text-slate-900">Header Navigation &amp; CTA</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-600">Home Label</label>
                    <input value={navHome} onChange={(e) => setNavHome(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600">About Label</label>
                    <input value={navAbout} onChange={(e) => setNavAbout(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600">Highlights Label</label>
                    <input value={navHighlights} onChange={(e) => setNavHighlights(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600">Showcase Label</label>
                    <input value={navShowcase} onChange={(e) => setNavShowcase(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600">Contact Label</label>
                    <input value={navContact} onChange={(e) => setNavContact(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600">Header CTA Link</label>
                    <select value={headerCtaHref} onChange={(e) => setHeaderCtaHref(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                      <option value="/contact">Contact Page</option>
                      <option value="/showcase">Showcase Page</option>
                      <option value="/about">About Page</option>
                      <option value="/highlights">Highlights Page</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-600">Header CTA Button Text</label>
                  <input value={headerCtaText} onChange={(e) => setHeaderCtaText(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="font-extrabold text-slate-900">Footer Customization</div>
                <div>
                  <label className="font-bold text-slate-600">Footer Description</label>
                  <textarea rows={2} value={footerDesc} onChange={(e) => setFooterDesc(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-600">Footer Status Badge</label>
                    <input value={footerBadge} onChange={(e) => setFooterBadge(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600">Footer CTA Text</label>
                    <input value={footerCtaText} onChange={(e) => setFooterCtaText(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-600">Footer Background</label>
                    <input type="color" value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-slate-200 cursor-pointer" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600">Copyright Text</label>
                    <input value={footerCopyright} onChange={(e) => setFooterCopyright(e.target.value)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                  Fixed Credit: <strong>Software By Blue Oceans Technologies Ltd</strong> (always locked)
                </div>
              </div>
            </div>
          )}

          {cmsTab === "content" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Brand Logo (URL or Upload)</label>
                <div className="mt-1 flex items-center gap-2">
                  <img
                    src={logoUrl || "/logos/salepay-logo-blue.png"}
                    alt="Logo Preview"
                    onError={(e) => {
                      e.currentTarget.src = "/logos/salepay-logo-blue.png";
                    }}
                    className="h-9 w-14 object-contain rounded border border-slate-200 bg-slate-50 p-1 shrink-0"
                  />
                  <input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://... or /logos/..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200"
                  />
                  <label className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer shrink-0">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") setLogoUrl(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Business / Brand Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Tagline / Subtitle</label>
                  <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder={site.preset.label} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Industry Vertical</label>
                  {isSuperAdmin ? (
                    <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-200">
                      {Object.entries(INDUSTRY_PRESETS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-700 font-semibold">
                      {site.preset.label} (Locked)
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700">Brand Accent Color</label>
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-slate-200 cursor-pointer" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div>
                  <label className="font-bold text-slate-700">Hero Background / Animation Style</label>
                  <select
                    value={heroBgStyle}
                    onChange={(e) => setHeroBgStyle(e.target.value as HeroBgStyle)}
                    className="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    <option value="constellation">Constellation Network (3D VFX)</option>
                    <option value="aurora">Aurora Waves (Animated VFX)</option>
                    <option value="particles">3D Floating Orbs (VFX)</option>
                    <option value="grid">Cyber 3D Perspective Grid (VFX)</option>
                    <option value="slider">Banner Image Slider (Auto-Slide)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">
                    Hero Banner Images ({heroImages.length}) — Auto-Slides when Slider is selected
                  </label>
                  <div className="mt-1 flex items-center gap-1.5">
                    <input
                      value={newBannerUrl}
                      onChange={(e) => setNewBannerUrl(e.target.value)}
                      placeholder="Paste banner image URL..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newBannerUrl.trim()) return;
                        setHeroImages((prev) => [...prev, newBannerUrl.trim()]);
                        setNewBannerUrl("");
                        setHeroBgStyle("slider");
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white font-bold"
                    >
                      Add
                    </button>
                    <label className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                const imgUrl = reader.result;
                                setHeroImages((prev) => [...prev, imgUrl]);
                                setHeroBgStyle("slider");
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>
                  </div>
                  {heroImages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {heroImages.map((img, idx) => (
                        <div key={idx} className="relative group w-16 h-11 rounded-lg overflow-hidden border border-slate-300 bg-white">
                          <img src={img} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setHeroImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/75 text-white text-[10px] leading-none flex items-center justify-center opacity-90 hover:opacity-100"
                            title="Remove banner"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700">Hero Badge</label>
                <input value={heroPill} onChange={(e) => setHeroPill(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="font-bold text-slate-700">Hero Title</label>
                <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="font-bold text-slate-700">Hero Description</label>
                <textarea rows={2} value={heroDesc} onChange={(e) => setHeroDesc(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="font-bold text-slate-700">About Us Title</label>
                <input value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="font-bold text-slate-700">About Us Story</label>
                <textarea rows={3} value={aboutText} onChange={(e) => setAboutText(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Years Experience</label>
                  <input value={years} onChange={(e) => setYears(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
                </div>
                <div>
                  <label className="font-bold text-slate-700">CTA Button Text</label>
                  <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700">Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="font-bold text-slate-700">Opening Hours</label>
                <input value={hours} onChange={(e) => setHours(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
            </div>
          )}

          {cmsTab === "highlights" && (
            <div className="space-y-3 text-xs">
              {highlights.map((h, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">Highlight Card {i + 1}</div>
                  <input
                    value={h[0]}
                    onChange={(e) => {
                      const next = [...highlights];
                      next[i] = [e.target.value, next[i][1]];
                      setHighlights(next);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                  <textarea
                    rows={2}
                    value={h[1]}
                    onChange={(e) => {
                      const next = [...highlights];
                      next[i] = [next[i][0], e.target.value];
                      setHighlights(next);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              ))}
            </div>
          )}

          {cmsTab === "inquiries" && (
            <div className="space-y-2 text-xs text-slate-600">
              {!isAdmin
                ? "Sign in above to view customer inquiries."
                : inquiries.length === 0
                  ? "No inquiries received yet."
                  : inquiries.map((q) => (
                    <div key={q.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900">{q.name} • {q.phone}</div>
                      <div>{q.message || "No message"}</div>
                    </div>
                  ))}
            </div>
          )}

          {cmsTab !== "inquiries" && (
            <button
              onClick={handleSave}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow"
            >
              Save & Publish Live
            </button>
          )}
        </div>
      )}

      {/* Toast Notification Stack */}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-bold transition-all animate-[fadeSlideUp_0.25s_ease-out] ${t.type === "error"
                ? "bg-rose-950/95 border-rose-500/40 text-rose-100"
                : t.type === "info"
                  ? "bg-slate-900/95 border-sky-500/40 text-sky-100"
                  : "bg-slate-950/95 border-emerald-500/40 text-white"
                }`}
            >
              {t.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : t.type === "info" ? (
                <Info className="w-5 h-5 text-sky-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-white/60 hover:text-white transition shrink-0"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
