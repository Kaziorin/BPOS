"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";

import { syncManager } from "@/lib/offline/sync";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
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

  // POS & Customer Display screens are dedicated full-screen applications without sidebar/header layout chrome
  const isPosPage = pathname?.endsWith("/pos") || pathname?.includes("/pos/") || pathname?.includes("/customer-display");

  if (isPosPage) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background">

        {children}
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 sm:pb-6 lg:pb-6">
          <div className="min-h-full w-full rounded-md border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            {children}
          </div>
        </main>
        <Footer />
        <MobileNav open={menuOpen} onOpenChange={setMenuOpen} />
      </div>
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

