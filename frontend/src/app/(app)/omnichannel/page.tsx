'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  TrendingUp,
  Package,
  Receipt,
  RefreshCw,
  PauseCircle,
  Monitor,
  Store,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { api } from '@/lib/api';
import { UniversalInvoiceModal } from '@/components/invoices/UniversalInvoiceModal';

function OmnichannelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode');

  useEffect(() => {
    if (mode !== 'retail') {
      router.replace('/omnichannel?mode=retail');
    }
  }, [mode, router]);

  if (mode !== 'retail') {
    return (
      <div className="p-8 text-center text-xs text-slate-400 space-y-2">
        <RefreshCw size={24} className="mx-auto animate-spin text-slate-400" />
        <p className="font-bold">Redirecting to Retail POS...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <RetailHubView />
    </div>
  );
}

function RetailHubView() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, prodRes] = await Promise.allSettled([
        api.get('/sales', { params: { limit: 50 } }),
        api.get('/products', { params: { limit: 50 } }),
      ]);
      if (salesRes.status === 'fulfilled') {
        const d = (salesRes.value.data as any)?.data ?? salesRes.value.data ?? [];
        setSales(Array.isArray(d) ? d : []);
      }
      if (prodRes.status === 'fulfilled') {
        const d = (prodRes.value.data as any)?.data ?? prodRes.value.data ?? [];
        setProducts(Array.isArray(d) ? d : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalCounterSales = sales.reduce((acc, s) => acc + Number(s.grandTotal || s.totalAmount || s.total || 0), 0);
  const totalItemsSold = sales.reduce((acc, s) => acc + (s.items || []).length, 0);

  const filteredSales = sales.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(q)) ||
      (s.cashier?.name && s.cashier.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">
            <Store size={15} /> Retail & POS Checkout Counter
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Retail Counter & POS Hub</h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl">
            High-speed retail counter operations, dual-screen customer display, multi-tender split payments, barcode scanner, cart holding & instant cash drawer reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/pos"
            className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-6 py-3.5 text-sm font-black text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/30 transition transform hover:-translate-y-0.5"
          >
            <ShoppingCart size={18} /> Launch Retail Checkout
          </Link>
          <Link
            href="/pos/holds"
            className="flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-3.5 text-xs font-bold text-white border border-white/10 transition"
          >
            <PauseCircle size={15} /> Held Carts
          </Link>
          <Link
            href="/customer-display"
            target="_blank"
            className="flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-3.5 text-xs font-bold text-white border border-white/10 transition"
          >
            <Monitor size={15} /> Customer Display
          </Link>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link
          href="/pos"
          className="group flex flex-col justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <ShoppingCart size={18} />
            </span>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Express</span>
          </div>
          <div className="mt-3">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">Standard POS</h4>
            <p className="text-[11px] text-slate-400">Barcode scanner & quick tender</p>
          </div>
        </Link>

        <Link
          href="/pos/price-checker"
          className="group flex flex-col justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-purple-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <Search size={18} />
            </span>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Kiosk</span>
          </div>
          <div className="mt-3">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600">Price Checker</h4>
            <p className="text-[11px] text-slate-400">Customer scanner station</p>
          </div>
        </Link>

        <Link
          href="/pos/self-checkout"
          className="group flex flex-col justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-teal-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
              <Monitor size={18} />
            </span>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">Self-Service</span>
          </div>
          <div className="mt-3">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600">Self-Checkout Kiosk</h4>
            <p className="text-[11px] text-slate-400">Touchscreen patron checkout</p>
          </div>
        </Link>

        <Link
          href="/cash-register"
          className="group flex flex-col justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <DollarSign size={18} />
            </span>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Shift</span>
          </div>
          <div className="mt-3">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600">Cash Register</h4>
            <p className="text-[11px] text-slate-400">Open/close shift & drawer</p>
          </div>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Counter Revenue</span>
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{fmt(totalCounterSales)}</p>
          <span className="text-[11px] text-slate-400">Total processed counter sales</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Invoices Cleared</span>
            <Receipt size={18} className="text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{sales.length}</p>
          <span className="text-[11px] text-slate-400">Completed receipts</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Items Checked Out</span>
            <Package size={18} className="text-teal-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalItemsSold}</p>
          <span className="text-[11px] text-slate-400">Individual products scanned</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog SKUs</span>
            <Package size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{products.length}</p>
          <span className="text-[11px] text-slate-400">Active retail products</span>
        </div>
      </div>

      {/* Main Table: Recent Retail Counter Transactions */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Recent Retail Counter Invoices</h3>
            <p className="text-xs text-slate-500">Real-time point-of-sale receipt journal and payment status</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-semibold focus:border-indigo-500 focus:outline-none focus:bg-white"
              />
            </div>
            <button
              onClick={loadData}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading counter transactions...</div>
        ) : filteredSales.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Receipt size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No retail counter transactions found</p>
            <p className="text-xs">Launch the Standard POS Checkout to start scanning customer items.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date / Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Tender Method</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-3 text-right">Total (৳)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                      {s.invoiceNo || `POS-${s.id.slice(0, 8)}`}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">{s.customer?.name || 'Walk-in Customer'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        <CreditCard size={11} /> {s.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {(s.items || []).length}
                    </td>
                    <td className="py-3 px-3 text-right font-black tabular-nums text-slate-900">
                      {fmt(Number(s.grandTotal || s.totalAmount || s.total || 0))}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2.5 py-1 text-xs font-bold text-slate-700 transition"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Specialized Retail Invoice & Print Modal */}
      {selectedSale && (
        <UniversalInvoiceModal
          data={{
            id: selectedSale.id,
            invoiceNo: selectedSale.invoiceNo || `POS-${selectedSale.id.slice(0, 8)}`,
            saleDate: selectedSale.createdAt,
            vertical: "retail",
            customer: selectedSale.customer,
            items: (selectedSale.items || []).map((it: any) => ({
              name: it.productName || it.product?.name || "Retail Product",
              productName: it.productName || it.product?.name || "Retail Product",
              qty: Number(it.qty || 1),
              unitPrice: Number(it.unitPrice || 0),
              sku: it.sku || "POS-SKU",
            })),
            subTotal: Number(selectedSale.subTotal || selectedSale.grandTotal || selectedSale.total || 0),
            grandTotal: Number(selectedSale.grandTotal || selectedSale.totalAmount || selectedSale.total || 0),
            paidTotal: Number(selectedSale.paidTotal || selectedSale.grandTotal || selectedSale.total || 0),
            dueTotal: Number(selectedSale.dueTotal || 0),
            paymentMethod: selectedSale.paymentMethod || "CASH",
          }}
          initialVertical="retail"
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}

export default function OmnichannelPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw size={24} className="mx-auto animate-spin text-slate-400" />
          <p className="font-bold">Loading Retail POS Hub...</p>
        </div>
      }
    >
      <OmnichannelContent />
    </Suspense>
  );
}
