import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreConfigProvider } from "@/context/StoreConfigContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import StoreLayoutShell from "@/components/layout/StoreLayoutShell";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopEase | Real-Time Omnichannel Retail & Visual Store Builder",
  description: "Shop online with real-time stock sync, visual drag-and-drop themes and express delivery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased`}>
        <StoreConfigProvider>
          <AuthProvider>
            <CartProvider>
              <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
              <StoreLayoutShell>{children}</StoreLayoutShell>
            </CartProvider>
          </AuthProvider>
        </StoreConfigProvider>
      </body>
    </html>
  );
}
