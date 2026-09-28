"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

export default function StoreLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSetupPage = pathname === "/setup";

  if (isSetupPage) {
    return (
      <>
        <CartDrawer />
        {children}
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
