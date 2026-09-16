"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Scale,
  Barcode,
  Receipt,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  RefreshCw,
  Printer,
  ChevronRight,
  PlusCircle,
  Users,
  Layers,
  Zap,
  LayoutDashboard,
  History,
  Activity,
  Monitor,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { UniversalInvoiceModal } from "@/components/invoices/UniversalInvoiceModal";

function getCustomerTier(pts: number) {
  if (pts >= 4000) return { name: "VIP", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200/80" };
  if (pts >= 1500) return { name: "Gold", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200/80" };
  if (pts >= 500) return { name: "Silver", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200/80" };
  return { name: "Bronze", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200/80" };
}

export default function GroceryHubPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, prodRes] = await Promise.allSettled([
        api.get("/pos/sales", { params: { limit: 50 } }),
        api.get("/products", { params: { limit: 100 } }),
      ]);
      const sData = salesRes.status === "fulfilled" ? ((salesRes.value as any)?.data ?? salesRes.value ?? []) : [];
      const pData = prodRes.status === "fulfilled" ? ((prodRes.value as any)?.data ?? prodRes.value ?? []) : [];
      setSales(Array.isArray(sData) ? sData : []);
      setProducts(Array.isArray(pData) ? pData : []);
    } catch (err) {
      console.error("Failed to load grocery data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalGrocerySales = sales.reduce((acc, s) => acc + Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0), 0);
  const totalItemsSold = sales.reduce((acc, s) => acc + (s.items || []).reduce((sum: number, it: any) => sum + Number(it.qty || 1), 0), 0);
  const weightedProducts = products.filter(
    (p) =>
      p.uom?.toLowerCase().includes("kg") ||
      p.uom?.toLowerCase().includes("gm") ||
      p.name?.toLowerCase().includes("kg") ||
      p.category?.name?.toLowerCase().includes("produce") ||
      p.category?.name?.toLowerCase().includes("vegetable") ||
      p.category?.name?.toLowerCase().includes("fruit") ||
      p.category?.name?.toLowerCase().includes("meat") ||
      p.category?.name?.toLowerCase().includes("fish")
  );

  const filteredSales = sales.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const custName = s.customer?.name || s.customerName || "";
    return (
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
      (custName && custName.toLowerCase().includes(q)) ||
      (s.cashier?.name && s.cashier.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── Breadcrumb & Actions ── */}
      <CustomBreadcrumb
        title="Grocery & Supermarket Hub"
        subtitle="Real-time supermarket lanes monitoring, weighing scale PLUs, and checkout throughput."
        icon={<Scale size={20} />}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Grocery Hub" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/customer-display" target="_blank">
              <CustomButton
                variant="outline"
                size="sm"
                className="border-sky-200/90 text-[#0369A1] hover:bg-sky-50"
              >
                <Monitor size={14} className="text-[#0284C7]" />
                Customer Display
              </CustomButton>
            </Link>

            <Link href="/grocery/pos">
              <CustomButton
                variant="primary"
                size="sm"
              >
                <Zap size={14} />
                Launch POS Lane
              </CustomButton>
            </Link>
          </div>
        }
      />

      {/* ── KPI Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: "Lane Revenue", val: fmt(totalGrocerySales), sub: "Total checkout volume", icon: TrendingUp },
          { label: "Transactions", val: sales.length, sub: "Completed receipts", icon: Receipt },
          { label: "Items Scanned", val: totalItemsSold, sub: "Products checked out", icon: Barcode },
          { label: "Active PLUs", val: weightedProducts.length || products.length, sub: "Weight-based items", icon: Scale },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-sm border border-sky-100/90 bg-white p-4 shadow-xs hover:border-sky-300/80 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0369A1]">{stat.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80">
                <stat.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stat.val}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Content: Lane Activity & Scale PLU ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Supermarket Lane Transactions */}
        <div className="lg:col-span-2 rounded-sm border border-sky-100/90 bg-white shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-sky-100/90 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0369A1] flex items-center gap-2">
                <History className="text-[#0284C7]" size={16} /> Lane Activity
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Real-time checkout transaction stream</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice, cashier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-sm border border-sky-200/90 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] focus:outline-none transition w-56"
                />
              </div>
              <button
                onClick={loadData}
                className="rounded-sm border border-sky-200/90 p-1.5 text-[#0369A1] hover:bg-sky-50 transition"
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-[#0284C7]" : ""} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2">
                <RefreshCw size={24} className="animate-spin text-[#0284C7]" />
                <p className="text-xs font-semibold text-[#0369A1]">Syncing lane receipts...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="py-24 text-center space-y-2">
                <Receipt size={32} className="mx-auto text-sky-300" />
                <p className="text-sm font-bold text-gray-700">No Lane Activity</p>
                <p className="text-xs text-gray-400">Launch a POS lane to start processing supermarket baskets</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-sky-100/90 bg-gradient-to-r from-sky-50/60 via-white to-sky-50/40 text-[11px] font-semibold uppercase tracking-wider text-[#0369A1]">
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Customer & Tier</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/60">
                  {filteredSales.map((s) => {
                    const points = s.customer?.loyaltyPoints || 0;
                    const tier = getCustomerTier(points);
                    const custName = s.customer?.name || s.customerName || "Walk-in Customer";
                    const itemCount = Array.isArray(s.items) && s.items.length > 0 ? s.items.length : (s.itemsCount || 0);
                    const totalAmt = Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0);
                    return (
                      <tr key={s.id} className="hover:bg-sky-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#0369A1]">
                          {s.invoiceNo || s.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{custName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm border uppercase ${tier.color} ${tier.bg} ${tier.border}`}>
                                {tier.name}
                              </span>
                              <span className="text-[10px] text-gray-400 uppercase">{s.paymentMethod || "CASH"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div>
                            <span className="font-medium">{new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                            <p className="text-[10px] text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-sm bg-sky-50 text-[#0284C7] font-bold text-xs border border-sky-200/80">
                            {itemCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900 text-xs">
                          {fmt(totalAmt)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedSale(s)}
                            className="rounded-sm border border-sky-200/90 bg-white px-3 py-1 text-[11px] font-semibold text-[#0369A1] hover:bg-sky-50 transition shadow-2xs"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Col: Produce & Scale PLU Price List */}
        <div className="rounded-sm border border-sky-100/90 bg-white shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-sky-100/90 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0369A1] flex items-center gap-2">
                <Activity className="text-[#0284C7]" size={16} /> Scale PLU Catalog
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Weight-based produce rates</p>
            </div>
            <Link
              href="/products/create"
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white hover:brightness-105 transition shadow-2xs"
              title="Add PLU Product"
            >
              <PlusCircle size={15} />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[460px] custom-scrollbar">
            {products.slice(0, 15).map((p) => {
              const isKg = p.uom?.toLowerCase().includes("kg") || p.uom?.toLowerCase().includes("gm");
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-sm border border-sky-100/90 bg-white hover:border-sky-300 transition shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80 flex items-center justify-center shrink-0 font-bold text-xs">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate text-xs">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono text-gray-400">{p.sku || "NO-SKU"}</span>
                        {isKg && <span className="text-[8px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200/60 px-1 rounded-sm">SCALE</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-gray-900 block">{fmt(Number(p.sellingPrice || 0))}</span>
                    <span className="text-[9px] text-gray-400 uppercase">per {p.uom || "kg"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-sky-100/90 bg-sky-50/40">
            <Link href="/grocery/pos" className="w-full block">
              <CustomButton
                variant="primary"
                size="sm"
                fullWidth
              >
                Open Scale Register <ArrowRight size={14} />
              </CustomButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Specialized Grocery Scale Slip Modal */}
      {selectedSale && (
        <UniversalInvoiceModal
          open={Boolean(selectedSale)}
          invoice={{
            id: selectedSale.id,
            invoiceNo: selectedSale.invoiceNo || `GRO-${selectedSale.id.slice(0, 8)}`,
            saleDate: selectedSale.createdAt,
            vertical: "grocery",
            customer: selectedSale.customer || { name: selectedSale.customerName || "Walk-in Customer" },
            items: (selectedSale.items || []).map((it: any) => ({
              name: it.productName || it.name || it.product?.name || "Produce Item",
              productName: it.productName || it.name || it.product?.name || "Produce Item",
              qty: Number(it.qty || 1),
              unitPrice: Number(it.unitPrice || 0),
              weightKg: Number(it.qty || 1),
              pluCode: it.pluCode || "4011",
              uom: it.uom || "kg",
            })),
            subTotal: Number(selectedSale.subTotal || selectedSale.subtotal || selectedSale.total || selectedSale.grandTotal || 0),
            grandTotal: Number(selectedSale.grandTotal ?? selectedSale.totalAmount ?? selectedSale.total ?? 0),
            total: Number(selectedSale.grandTotal ?? selectedSale.totalAmount ?? selectedSale.total ?? 0),
            paidTotal: Number(selectedSale.paidTotal ?? selectedSale.grandTotal ?? selectedSale.total ?? 0),
            dueTotal: Number(selectedSale.dueTotal || 0),
            paymentMethod: selectedSale.paymentMethod || "CASH",
          }}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
