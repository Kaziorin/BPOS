'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Receipt,
  Package,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CustomBreadcrumb } from '@/components/custom/CustomBreadcrumb';
import { UniversalInvoiceModal } from '@/components/invoices/UniversalInvoiceModal';

function RetailContent() {
  return (
    <div data-theme="retail" className="theme-retail w-full space-y-6">
      <RetailHubView />
    </div>
  );
}

function RetailHubView() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Promise.allSettled([api.get<any>('/sales', { params: { limit: 50 } })]);
      if (res[0].status === 'fulfilled') {
        const d = res[0].value.data?.data ?? res[0].value.data ?? [];
        setSales(Array.isArray(d) ? d : []);
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

  const fmt = (n: number) =>
    `৳${Number(n || 0).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const totalCounterSales = sales.reduce(
    (acc, s) => acc + Number(s.grandTotal || s.totalAmount || s.total || 0),
    0,
  );
  const totalItemsSold = sales.reduce((acc, s) => acc + (s.items || []).length, 0);
  const averageBasket = sales.length ? totalCounterSales / sales.length : 0;

  const filteredSales = sales.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(q)) ||
      (s.cashier?.name && s.cashier.name.toLowerCase().includes(q))
    );
  });

  const metrics = [
    {
      label: 'Counter Revenue',
      value: fmt(totalCounterSales),
      caption: 'Total processed counter sales',
      icon: Receipt,
    },
    {
      label: 'Invoices Cleared',
      value: sales.length.toString(),
      caption: 'Completed retail receipts',
      icon: CreditCard,
    },
    {
      label: 'Items Checked Out',
      value: totalItemsSold.toString(),
      caption: 'Individual products scanned',
      icon: Package,
    },
    {
      label: 'Average Basket',
      value: fmt(averageBasket),
      caption: 'Revenue per completed invoice',
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <CustomBreadcrumb
        title="Retail & Apparel Hub"
        description="Live counter sales, receipt journal, and one-click access to the Retail POS terminal."
        icon={<ShoppingBag size={16} className="text-primary-600" />}
        iconClassName="flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 text-primary-600 border border-primary-200 shrink-0"
        items={[{ label: 'Retail', href: '/retail' }]}
        actions={
          <Link
            href="/retail-pos"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-700"
          >
            <ShoppingCart size={15} />
            Retail POS
          </Link>
        }
      />

      {/* Summary card — clean flat white with theme accent bar */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-600">
            <ShoppingBag size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Retail Counter Overview
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                Live
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {sales.length} completed invoices · {totalItemsSold} items sold at the counter
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Revenue
          </span>
          <p className="text-xl font-bold tabular-nums tracking-tight text-primary-700">
            {fmt(totalCounterSales)}
          </p>
        </div>
      </section>

      {/* KPI metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-primary-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {metric.label}
              </span>
              <span className="rounded-lg border border-primary-100 bg-primary-50 p-2 text-primary-600">
                <metric.icon size={15} />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold tabular-nums tracking-tight text-slate-900">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{metric.caption}</p>
          </div>
        ))}
      </section>

      {/* Recent invoices journal */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Recent Counter Invoices
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              POS receipt journal — click a row to open the invoice
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-semibold text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg border border-slate-100 bg-slate-50"
              />
            ))}
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="space-y-2 px-5 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-600">
              <Receipt size={22} />
            </span>
            <p className="text-sm font-semibold text-slate-700">No retail transactions found</p>
            <p className="text-xs text-slate-500">
              Open Retail POS and complete a checkout to populate this journal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Tender</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSales.map((s) => (
                  <tr
                    key={s.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelectedSale(s)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSale(s);
                      }
                    }}
                    className="cursor-pointer transition hover:bg-primary-50/60 focus:bg-primary-50 focus:outline-none"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-primary-700">
                      {s.invoiceNo || `POS-${s.id.slice(0, 8)}`}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(s.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {s.customer?.name || 'Walk-in Customer'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md border border-primary-100 bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">
                        <CreditCard size={11} />
                        {s.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {(s.items || []).length}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">
                      {fmt(Number(s.grandTotal || s.totalAmount || s.total || 0))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700">
                        View
                        <ChevronRight size={13} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedSale && (
        <UniversalInvoiceModal
          data={{
            id: selectedSale.id,
            invoiceNo: selectedSale.invoiceNo || `POS-${selectedSale.id.slice(0, 8)}`,
            saleDate: selectedSale.createdAt,
            vertical: 'retail',
            customer: selectedSale.customer,
            items: (selectedSale.items || []).map((it: any) => ({
              name: it.productName || it.product?.name || 'Retail Product',
              productName: it.productName || it.product?.name || 'Retail Product',
              qty: Number(it.qty || 1),
              unitPrice: Number(it.unitPrice || 0),
              sku: it.sku || 'POS-SKU',
            })),
            subTotal: Number(
              selectedSale.subTotal || selectedSale.grandTotal || selectedSale.total || 0,
            ),
            grandTotal: Number(
              selectedSale.grandTotal || selectedSale.totalAmount || selectedSale.total || 0,
            ),
            paidTotal: Number(
              selectedSale.paidTotal || selectedSale.grandTotal || selectedSale.total || 0,
            ),
            dueTotal: Number(selectedSale.dueTotal || 0),
            paymentMethod: selectedSale.paymentMethod || 'CASH',
          }}
          initialVertical="retail"
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}

export default function RetailPage() {
  return <RetailContent />;
}
