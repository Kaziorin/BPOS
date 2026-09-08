'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  Scale,
  Barcode,
  Receipt,
  Search,
  ArrowRight,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  RefreshCw,
  Printer,
  ChevronRight,
  PlusCircle,
  Truck,
  Building2,
  FileText,
  DollarSign,
  Users,
  ShieldAlert,
  Monitor,
  Radio,
  Globe,
  Sliders,
  Store,
  Layers,
  Sparkles,
  PauseCircle,
  Tag,
  CreditCard,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { api } from '@/lib/api';
import GroceryHubPage from '@/app/(app)/grocery/page';
import WholesaleHubPage from '@/app/(app)/wholesale/page';

// ─── Mode Configurations ──────────────────────────────────────────────

type OmnichannelMode = 'omnichannel' | 'grocery' | 'wholesale' | 'retail';

interface Channel { id: string; code: string; name: string; isEnabled: boolean; config: any; }
interface ChannelOrder { id: string; orderNo: string; status: string; channelCode: string; customerName: string; customerPhone: string; totalAmount: number; items: any; createdAt: string; }
interface Adapter { id: string; platform: string; name: string; status: string; config: any; lastSyncAt: string | null; productsSynced: number; ordersImported: number; }
interface KioskSession { id: string; kioskId: string; status: string; cart: any[]; totalAmount: number; createdAt: string; }
interface QRMenu { id: string; name: string; branchId: string; branchName: string; isActive: boolean; categoryFilter: any; }

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  VALIDATED: 'bg-purple-100 text-purple-800',
  ALLOCATED: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SUCCESS: 'bg-green-100 text-green-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
};

// ─── Main Content Component (Wrapped in Suspense) ─────────────────────

function OmnichannelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Determine current active mode from URL query parameter (?mode=grocery|wholesale|retail|omnichannel)
  const rawMode = searchParams.get('mode')?.toLowerCase() || 'omnichannel';
  const activeMode: OmnichannelMode = useMemo(() => {
    if (rawMode === 'grocery' || rawMode === 'supermarket') return 'grocery';
    if (rawMode === 'wholesale' || rawMode === 'b2b') return 'wholesale';
    if (rawMode === 'retail' || rawMode === 'pos') return 'retail';
    return 'omnichannel';
  }, [rawMode]);

  const handleModeChange = (newMode: OmnichannelMode) => {
    if (newMode === 'omnichannel') {
      router.push('/omnichannel');
    } else {
      router.push(`/omnichannel?mode=${newMode}`);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ─── Top Universal Multi-Mode Switcher ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => handleModeChange('omnichannel')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'omnichannel'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Radio size={14} className={activeMode === 'omnichannel' ? 'text-primary-400' : 'text-slate-400'} />
            Omnichannel & Online Orders
          </button>

          <button
            onClick={() => handleModeChange('grocery')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'grocery'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <Scale size={14} className={activeMode === 'grocery' ? 'text-emerald-300' : 'text-emerald-600'} />
            Grocery & Supermarket Lane
          </button>

          <button
            onClick={() => handleModeChange('wholesale')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'wholesale'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <Truck size={14} className={activeMode === 'wholesale' ? 'text-blue-300' : 'text-blue-600'} />
            Wholesale & B2B Distribution
          </button>

          <button
            onClick={() => handleModeChange('retail')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'retail'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-800'
            }`}
          >
            <Store size={14} className={activeMode === 'retail' ? 'text-indigo-300' : 'text-indigo-600'} />
            Retail POS & Counter Hub
          </button>
        </div>

        {/* Quick Launch Direct Route Shortcut */}
        <div className="flex items-center gap-2 text-xs">
          {activeMode === 'grocery' && (
            <Link
              href="/grocery/pos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition shadow-xs"
            >
              <ShoppingCart size={13} /> Open Grocery POS
            </Link>
          )}
          {activeMode === 'wholesale' && (
            <Link
              href="/wholesale/pos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
            >
              <Truck size={13} /> New B2B Order
            </Link>
          )}
          {activeMode === 'retail' && (
            <Link
              href="/pos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs"
            >
              <ShoppingCart size={13} /> Standard Checkout
            </Link>
          )}
        </div>
      </div>

      {/* ─── Mode Specific View Rendering ─── */}
      {activeMode === 'grocery' && <GroceryHubPage />}
      {activeMode === 'wholesale' && <WholesaleHubPage />}
      {activeMode === 'retail' && <RetailHubView />}
      {activeMode === 'omnichannel' && <OmnichannelManagementView />}
    </div>
  );
}

// ─── Retail POS & Counter Hub View ────────────────────────────────────

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
            <Store size={15} /> Industry Vertical 1 · Retail & POS Checkout Counter
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
            <Barcode size={18} className="text-teal-600" />
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

      {/* Receipt Modal */}
      {selectedSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center border-b border-dashed border-slate-200 pb-4">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Retail POS Slip</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Invoice: {selectedSale.invoiceNo || selectedSale.id}</p>
              <p className="text-[11px] text-slate-400">{new Date(selectedSale.createdAt).toLocaleString()}</p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(selectedSale.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-800">{item.productName || item.product?.name || 'Item'}</span>
                    <span className="block text-[10px] text-slate-400">
                      {item.qty} × {fmt(Number(item.unitPrice || 0))}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 tabular-nums">
                    {fmt(Number(item.qty || 1) * Number(item.unitPrice || 0))}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-slate-600">
                <span>Subtotal:</span>
                <span>{fmt(Number(selectedSale.subTotal || selectedSale.grandTotal || selectedSale.total || 0))}</span>
              </div>
              <div className="flex justify-between font-black text-base text-indigo-700 pt-1">
                <span>Grand Total:</span>
                <span>{fmt(Number(selectedSale.grandTotal || selectedSale.totalAmount || selectedSale.total || 0))}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 p-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Omnichannel Management View (Orders, Channels, Adapters, Kiosk, QR) ───

function OmnichannelManagementView() {
  const [tab, setTab] = useState<'orders' | 'channels' | 'marketplace' | 'kiosk' | 'qr'>('orders');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [orders, setOrders] = useState<ChannelOrder[]>([]);
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [kiosks, setKiosks] = useState<KioskSession[]>([]);
  const [qrMenus, setQRMenus] = useState<QRMenu[]>([]);
  const [orderFilter, setOrderFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewAdapter, setShowNewAdapter] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [chRes, orRes, adRes, ksRes, qrRes] = await Promise.allSettled([
        api.get('/channels'),
        api.get(`/omnichannel/orders${orderFilter ? `?status=${orderFilter}` : ''}`),
        api.get('/marketplace/adapters'),
        api.get('/kiosk/sessions'),
        api.get('/qr/menus'),
      ]);

      if (chRes.status === 'fulfilled') {
        const d = (chRes.value.data as any)?.data ?? chRes.value.data ?? [];
        setChannels(Array.isArray(d) ? d : []);
      }
      if (orRes.status === 'fulfilled') {
        const d = (orRes.value.data as any)?.data ?? orRes.value.data ?? [];
        setOrders(Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []);
      }
      if (adRes.status === 'fulfilled') {
        const d = (adRes.value.data as any)?.data ?? adRes.value.data ?? [];
        setAdapters(Array.isArray(d) ? d : []);
      }
      if (ksRes.status === 'fulfilled') {
        const d = (ksRes.value.data as any)?.data ?? ksRes.value.data ?? [];
        setKiosks(Array.isArray(d) ? d : []);
      }
      if (qrRes.status === 'fulfilled') {
        const d = (qrRes.value.data as any)?.data ?? qrRes.value.data ?? [];
        setQRMenus(Array.isArray(d) ? d : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderFilter]);

  useEffect(() => {
    load();
  }, [load, tab]);

  const advanceOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const flow: Record<string, string> = {
      RECEIVED: 'VALIDATED',
      VALIDATED: 'ALLOCATED',
      ALLOCATED: 'SHIPPED',
      SHIPPED: 'DELIVERED',
    };
    const next = flow[order.status];
    if (!next) return;
    try {
      await api.patch(`/omnichannel/orders/${orderId}/status`, { status: next });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleChannel = async (code: string, enabled: boolean) => {
    try {
      await api.patch(`/channels/${code}`, { isEnabled: !enabled });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const syncAdapter = async (adapterId: string, type: string) => {
    try {
      await api.post(`/marketplace/adapters/${adapterId}/sync/${type}`);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const createChannel = async (code: string, name: string) => {
    try {
      await api.post('/channels', { code, name, isEnabled: true });
      setShowNewChannel(false);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const createAdapter = async (platform: string, name: string) => {
    try {
      await api.post('/marketplace/adapters', { platform, name, config: {} });
      setShowNewAdapter(false);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    { key: 'orders', label: 'Online Orders', icon: Package },
    { key: 'channels', label: 'Order Channels', icon: Radio },
    { key: 'marketplace', label: 'Marketplace Sync', icon: Globe },
    { key: 'kiosk', label: 'Kiosk Sessions', icon: Monitor },
    { key: 'qr', label: 'QR Menu Orders', icon: QrCode },
  ];

  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Omnichannel & E-Commerce Hub</h1>
          <p className="text-xs text-slate-500">Unified order dispatch across Website, Mobile App, Kiosk, QR & Marketplaces</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-xs font-bold transition shadow-xs"
        >
          <RefreshCw size={13} /> Refresh Data
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['RECEIVED', 'VALIDATED', 'ALLOCATED', 'SHIPPED', 'DELIVERED'].map((st) => (
          <div key={st} className="bg-white rounded-2xl border border-slate-200/80 p-4 text-center shadow-2xs">
            <div className="text-2xl font-black text-slate-900">{statusCounts[st] || 0}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{st}</div>
          </div>
        ))}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map((t) => {
          const TabIcon = t.icon;
          const isAct = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isAct
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <TabIcon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="">All Statuses</option>
              {['RECEIVED', 'VALIDATED', 'ALLOCATED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
              <Package size={40} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No online channel orders</p>
              <p className="text-xs">Orders from Website, Mobile App, Kiosk, QR menu or Shopify will appear here automatically.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Order #</th>
                    <th className="px-4 py-3.5">Channel</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5 text-right">Total (৳)</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{o.orderNo}</td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-700">
                          {o.channelCode || 'ONLINE'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{o.customerName || 'Guest Patron'}</td>
                      <td className="px-4 py-3 text-right font-black tabular-nums text-slate-900">
                        ৳{Number(o.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-700'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                          <button
                            onClick={() => advanceOrder(o.id)}
                            className="text-xs bg-slate-900 text-white font-bold px-3 py-1 rounded-lg hover:bg-slate-800 transition"
                          >
                            Advance ➔
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Channels Tab */}
      {tab === 'channels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">Order Channels</h3>
              <p className="text-xs text-slate-500">Enable or disable incoming sales touchpoints</p>
            </div>
            <button
              onClick={() => setShowNewChannel(true)}
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              + New Channel
            </button>
          </div>
          {showNewChannel && (
            <NewChannelForm onSubmit={createChannel} onCancel={() => setShowNewChannel(false)} />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <div key={ch.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{ch.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{ch.code}</p>
                  </div>
                  <button
                    onClick={() => toggleChannel(ch.code, ch.isEnabled)}
                    className={`w-11 h-6 rounded-full relative transition-colors ${ch.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ch.isEnabled ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Status: <span className={ch.isEnabled ? 'font-bold text-emerald-600' : 'text-slate-400'}>{ch.isEnabled ? 'Enabled & Listening' : 'Disabled'}</span>
                </div>
              </div>
            ))}
            {channels.length === 0 && (
              <div className="col-span-3 bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
                No custom channels configured. Create WEBSITE, MOBILE, or PHONE channels.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Marketplace Tab */}
      {tab === 'marketplace' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">Marketplace Adapters</h3>
              <p className="text-xs text-slate-500">Sync products and orders with Shopify, WooCommerce, Amazon</p>
            </div>
            <button
              onClick={() => setShowNewAdapter(true)}
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              + New Adapter
            </button>
          </div>
          {showNewAdapter && (
            <NewAdapterForm onSubmit={createAdapter} onCancel={() => setShowNewAdapter(false)} />
          )}
          {adapters.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
              <Globe size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No marketplace adapters connected</p>
              <p className="text-xs">Connect Shopify, WooCommerce, eBay or Amazon to sync inventory and orders automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adapters.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{a.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{a.platform}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-700'}`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                    <div>Products: <span className="font-bold text-slate-800">{a.productsSynced || 0}</span></div>
                    <div>Orders: <span className="font-bold text-slate-800">{a.ordersImported || 0}</span></div>
                    <div className="col-span-2 text-[11px]">
                      Last sync: {a.lastSyncAt ? new Date(a.lastSyncAt).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => syncAdapter(a.id, 'products')}
                      className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Sync Products
                    </button>
                    <button
                      onClick={() => syncAdapter(a.id, 'orders')}
                      className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Sync Orders
                    </button>
                    <button
                      onClick={() => syncAdapter(a.id, 'inventory')}
                      className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Push Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kiosk Tab */}
      {tab === 'kiosk' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">Self-Checkout Kiosks</h3>
              <p className="text-xs text-slate-500">Live touchscreen customer checkout sessions</p>
            </div>
            <Link
              href="/pos/self-checkout"
              className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Monitor size={14} /> Open Kiosk Terminal
            </Link>
          </div>
          {kiosks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
              <Monitor size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No active kiosk sessions</p>
              <p className="text-xs">Self-service kiosks will report active shopper carts here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Kiosk Station</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center">Cart Items</th>
                    <th className="px-4 py-3.5 text-right">Subtotal (৳)</th>
                    <th className="px-4 py-3.5 text-left">Started At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {kiosks.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{k.kioskId}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[k.status] || 'bg-slate-100 text-slate-700'}`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{Array.isArray(k.cart) ? k.cart.length : 0}</td>
                      <td className="px-4 py-3 text-right font-black tabular-nums text-slate-900">
                        ৳{Number(k.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(k.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QR Menu Tab */}
      {tab === 'qr' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">QR Code Table Ordering</h3>
              <p className="text-xs text-slate-500">Contactless QR menus for dining tables and counters</p>
            </div>
          </div>
          {qrMenus.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
              <QrCode size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No QR menus configured</p>
              <p className="text-xs">Create QR menus for tables, rooms, or express counter ordering.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qrMenus.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900">{m.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Branch: {m.branchName || 'All Outlets'}</p>
                  <p className="text-xs font-mono text-indigo-600 bg-indigo-50 p-2 rounded-xl">URL: /qr/{m.id}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && <div className="text-center text-slate-400 text-xs py-4">Syncing omnichannel hub data...</div>}
    </div>
  );
}

// ─── Forms ────────────────────────────────────────────────────────────

function NewChannelForm({ onSubmit, onCancel }: { onSubmit: (code: string, name: string) => void; onCancel: () => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <h4 className="font-bold text-slate-900 text-sm">Add New Order Channel</h4>
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="CODE (e.g. WEBSITE)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-slate-400"
        />
        <input
          placeholder="Channel Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-slate-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => code && onSubmit(code, name || code)}
          className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
        >
          Create Channel
        </button>
        <button
          onClick={onCancel}
          className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function NewAdapterForm({ onSubmit, onCancel }: { onSubmit: (platform: string, name: string) => void; onCancel: () => void }) {
  const [platform, setPlatform] = useState('SHOPIFY');
  const [name, setName] = useState('');
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <h4 className="font-bold text-slate-900 text-sm">Add New Marketplace Adapter</h4>
      <div className="grid grid-cols-2 gap-3">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-slate-400"
        >
          {['SHOPIFY', 'WOOCOMMERCE', 'EBAY', 'AMAZON', 'FACEBOOK', 'CUSTOM'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          placeholder="Adapter Name (e.g. My Shopify Store)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-slate-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit(platform, name || platform)}
          className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
        >
          Connect Adapter
        </button>
        <button
          onClick={onCancel}
          className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Default Page Export (Wrapped with Suspense for Next.js useSearchParams) ───

export default function OmnichannelPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw size={24} className="mx-auto animate-spin text-slate-400" />
          <p className="font-bold">Loading Omnichannel Hub...</p>
        </div>
      }
    >
      <OmnichannelContent />
    </Suspense>
  );
}
