"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { checkRouteEntitlement, getAccessiblePosTerminals } from "@/lib/pos-terminals";

import { syncManager } from "@/lib/offline/sync";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, subscription, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Initialize sync manager on mount
  useEffect(() => {
    syncManager.init();
    return () => syncManager.destroy();
  }, []);

  // Mobile: open the drawer from the header hamburger
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const on = () => setMenuOpen(true);
    window.addEventListener("omni:open-mobile-menu", on);
    return () => window.removeEventListener("omni:open-mobile-menu", on);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const accessCheck = checkRouteEntitlement(pathname || "", user, subscription);
  const primaryTerminal = getAccessiblePosTerminals(user, subscription)[0]?.href || "/retail-pos";

  const gatedContent = accessCheck.allowed ? (
    children
  ) : (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600 shadow-xs">
        <Lock size={24} />
      </div>
      <h2 className="text-lg font-extrabold text-slate-800">
        Access Restricted for Current Plan / Vertical
      </h2>
      <p className="mt-1.5 max-w-md text-xs text-slate-600 leading-relaxed">
        {accessCheck.reason || "This feature is not included in your current subscription tier or business type."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <Link
          href={primaryTerminal}
          className="inline-flex items-center gap-1.5 rounded-sm bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark transition"
        >
          <span>Open My POS Terminal</span>
          <ArrowRight size={13} />
        </Link>
        <Link
          href="/settings?tab=subscription"
          className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <span>View My Subscription</span>
        </Link>
      </div>
    </div>
  );

  // POS, KDS Kitchen Display & Customer/Patient Display screens are dedicated full-screen applications without sidebar/header layout chrome
  const isPosPage =
    pathname?.endsWith("/pos") ||
    pathname === "/retail-pos" ||
    pathname?.endsWith("/customer-display") ||
    pathname?.endsWith("/patient-display") ||
    pathname === "/restaurant/kitchen" ||
    pathname?.includes("/kitchen");

  if (isPosPage) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background">

        {gatedContent}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: "var(--theme-page-bg, #edf5fd)" }}
    >
      {/* Full-width Top Ocean Wave Header */}
      <Header />

      {/* Main Body: Sidebar on Left + Content & Footer on Right */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-5 pt-1 sm:pt-1.5 lg:pt-2 pb-8 custom-scrollbar">
            <div className="min-h-full w-full rounded-2xl border border-brand-border/60 bg-white/95 p-4 sm:p-6 shadow-xs">
              {gatedContent}
            </div>
          </main>

          {/* Footer sits next to sidebar with rounded top-left tab */}
          <Footer />
        </div>
      </div>
      <MobileNav open={menuOpen} onOpenChange={setMenuOpen} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

