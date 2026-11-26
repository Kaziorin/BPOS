import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WebsiteProvider } from "@/context/WebsiteContext";
import WebsiteShell from "@/components/layout/WebsiteShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SalePay | Dynamic Promotional Business Website",
  description: "Industry-tailored dynamic promotional website with live showcase & Admin CMS.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full antialiased`}>
        <WebsiteProvider>
          <WebsiteShell>{children}</WebsiteShell>
        </WebsiteProvider>
      </body>
    </html>
  );
}
