"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  BarChart3, TrendingUp, Package, DollarSign, Users, CreditCard,
  FileText, RefreshCw, Calendar, Download, Clock, Target,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, PieChart,
  Wallet, Filter, ChevronDown, Save, Trash2, Plus,
} from "lucide-react";

type TabType =
  | "sales" | "inventory" | "financial" | "commission"
  | "installments" | "saved" | "scheduled";

const currency = (v: number) => `৳${(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
const pct = (v: number) => `${v >= 0 ? "+" : ""}${(v || 0).toFixed(1)}%`;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white p-4 shadow-sm border border-gray-100 ${className}`}>{children}</div>;
}

function Stat({ label, value, icon: Icon, color = "text-indigo-600" }: { label: string; value: string | number; icon: any; color?: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gray-50`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: any[] }) {
  if (!rows.length) return <p className="text-sm text-gray-400 py-4">No data found</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((c) => (
              <th key={c} className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c} className="py-2 px-3 text-sm">
                  {typeof row[c] === "number" ? row[c].toLocaleString() : row[c] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sales");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [branches, setBranches] = useState<any[]>([]);

  // Sales data
  const [salesSummary, setSalesSummary] = useState<any[]>([]);
  const [salesByProduct, setSalesByProduct] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [salesByPayment, setSalesByPayment] = useState<any[]>([]);

  // Inventory data
  const [stockValuation, setStockValuation] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [aging, setAging] = useState<any>({ items: [], totalStockValue: 0 });
  const [expiry, setExpiry] = useState<any>({ items: [], totalAtRisk: 0 });

  // Financial
  const [pnl, setPnl] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [ar, setAr] = useState<any>(null);
  const [ap, setAp] = useState<any>(null);

  // Commission
  const [commissions, setCommissions] = useState<any>(null);

  // Installments
  const [installmentSummary, setInstallmentSummary] = useState<any>(null);
  const [overdueInstallments, setOverdueInstallments] = useState<any[]>([]);

  // Saved / Scheduled
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    api.get<any[]>("/api/v1/branches").then((r) => setBranches(r)).catch(() => {});
  }, []);

  const buildParams = useCallback(() => {
    const p: Record<string, string> = {};
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    if (branchFilter) p.branchId = branchFilter;
    return p;
  }, [startDate, endDate, branchFilter]);

  const qs = useCallback((extra: Record<string, string> = {}) => {
    const p = { ...buildParams(), ...extra };
    return Object.entries(p).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  }, [buildParams]);

  // ── Load functions ──

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = qs();
      const [sum, prod, cat, pay] = await Promise.all([
        api.get<any[]>(`/api/v1/reports/sales/summary?${params}`),
        api.get<any[]>(`/api/v1/reports/sales/by-product?${params}`),
        api.get<any[]>(`/api/v1/reports/sales/by-category?${params}`),
        api.get<any[]>(`/api/v1/reports/sales/by-payment?${params}`),
      ]);
      setSalesSummary(Array.isArray(sum) ? sum : sum?.data || []);
      setSalesByProduct(Array.isArray(prod) ? prod : prod?.data || []);
      setSalesByCategory(Array.isArray(cat) ? cat : cat?.data || []);
      setSalesByPayment(Array.isArray(pay) ? pay : pay?.data || []);
    } catch { /* empty */ }
    setLoading(false);
  }, [qs]);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = qs();
      const [val, low, ag, ex] = await Promise.all([
        api.get<any[]>(`/api/v1/reports/inventory/valuation?${params}`),
        api.get<any[]>(`/api/v1/reports/inventory/low-stock?${params}`),
        api.get<any>(`/api/v1/reports/inventory/aging?${params}`),
        api.get<any>(`/api/v1/reports/inventory/expiry?${params}`),
      ]);
      setStockValuation(Array.isArray(val) ? val : val?.data || []);
      setLowStock(Array.isArray(low) ? low : low?.data || []);
      setAging(ag?.data || ag || { items: [] });
      setExpiry(ex?.data || ex || { items: [] });
    } catch { /* empty */ }
    setLoading(false);
  }, [qs]);

  const loadFinancial = useCallback(async () => {
    setLoading(true);
    try {
      const params = qs();
      const [p, bs, arData, apData] = await Promise.all([
        api.get<any>(`/api/v1/reports/financial/pnl?${params}`),
        api.get<any>(`/api/v1/reports/financial/balance-sheet?${params}`),
        api.get<any>(`/api/v1/reports/financial/ar?${params}&aging=true`),
        api.get<any>(`/api/v1/reports/financial/ap?${params}`),
      ]);
      setPnl(p?.data || p);
      setBalanceSheet(bs?.data || bs);
      setAr(arData?.data || arData);
      setAp(apData?.data || apData);
    } catch { /* empty */ }
    setLoading(false);
  }, [qs]);

  const loadCommission = useCallback(async () => {
    setLoading(true);
    try {
      const params = qs();
      const r = await api.get<any>(`/api/v1/reports/commission/summary?${params}`);
      setCommissions(r?.data || r);
    } catch { /* empty */ }
    setLoading(false);
  }, [qs]);

  const loadInstallments = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, over] = await Promise.all([
        api.get<any>(`/api/v1/reports/installments/summary`),
        api.get<any[]>(`/api/v1/reports/installments/overdue`),
      ]);
      setInstallmentSummary(sum?.data || sum);
      setOverdueInstallments(Array.isArray(over) ? over : over?.data || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    try {
      const [saved, sched] = await Promise.all([
        api.get<any[]>(`/api/v1/reports/saved`),
        api.get<any[]>(`/api/v1/reports/scheduled`),
      ]);
      setSavedReports(Array.isArray(saved) ? saved : saved?.data || []);
      setScheduledReports(Array.isArray(sched) ? sched : sched?.data || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "sales") loadSales();
    else if (activeTab === "inventory") loadInventory();
    else if (activeTab === "financial") loadFinancial();
    else if (activeTab === "commission") loadCommission();
    else if (activeTab === "installments") loadInstallments();
    else if (activeTab === "saved" || activeTab === "scheduled") loadSaved();
  }, [activeTab, loadSales, loadInventory, loadFinancial, loadCommission, loadInstallments, loadSaved]);

  const handleExport = (reportType: string) => {
    const params = qs();
    window.open(`/api/v1/reports/export?reportType=${reportType}&format=csv&${params}`, "_blank");
  };

  const saveReport = async () => {
    if (!saveName) return;
    await api.post("/api/v1/reports/saved", {
      name: saveName, reportType: activeTab.toUpperCase(),
      config: { startDate, endDate, branchId: branchFilter },
    });
    setShowSaveDialog(false);
    setSaveName("");
    loadSaved();
  };

  const deleteSaved = async (id: string) => {
    await api.delete(`/api/v1/reports/saved/${id}`);
    loadSaved();
  };

  const deleteScheduled = async (id: string) => {
    await api.delete(`/api/v1/reports/scheduled/${id}`);
    loadSaved();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Sales, inventory, finance, commissions & installments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Save className="w-4 h-4" /> Save View
          </button>
          <button
            onClick={() => handleExport(`sales_by_product`)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg"
            placeholder="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg"
            placeholder="End date"
          />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            <option value="">All Branches</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button onClick={() => {}} className="p-1.5 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["sales", "inventory", "financial", "commission", "installments", "saved", "scheduled"] as TabType[]).map((tab) => (
          <TabBtn key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </TabBtn>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ════════ SALES TAB ════════ */}
          {activeTab === "sales" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Sales" value={salesSummary.reduce((s: number, r: any) => s + (r.total || 0), 0)} icon={DollarSign} color="text-green-600" />
                <Stat label="Total Orders" value={salesSummary.reduce((s: number, r: any) => s + (r.saleCount || 0), 0)} icon={ShoppingCart} color="text-blue-600" />
                <Stat label="Paid" value={currency(salesSummary.reduce((s: number, r: any) => s + (r.paidTotal || 0), 0))} icon={CreditCard} color="text-emerald-600" />
                <Stat label="Due" value={currency(salesSummary.reduce((s: number, r: any) => s + (r.dueTotal || 0), 0))} icon={AlertTriangle} color="text-amber-600" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <h3 className="font-semibold mb-3">Sales by Product</h3>
                  <DataTable
                    columns={["productName", "totalQty", "totalRevenue"]}
                    rows={salesByProduct.map((r: any) => ({
                      productName: r.productName,
                      totalQty: r.totalQty,
                      totalRevenue: currency(r.totalRevenue),
                    }))}
                  />
                </Card>
                <Card>
                  <h3 className="font-semibold mb-3">Sales by Category</h3>
                  <DataTable
                    columns={["categoryName", "totalQty", "totalRevenue"]}
                    rows={salesByCategory.map((r: any) => ({
                      categoryName: r.categoryName,
                      totalQty: r.totalQty,
                      totalRevenue: currency(r.totalRevenue),
                    }))}
                  />
                </Card>
              </div>
              <Card>
                <h3 className="font-semibold mb-3">Sales by Payment Method</h3>
                <DataTable
                  columns={["method", "saleCount", "totalAmount"]}
                  rows={salesByPayment.map((r: any) => ({
                    method: r.method,
                    saleCount: r.saleCount,
                    totalAmount: currency(r.totalAmount),
                  }))}
                />
              </Card>
            </>
          )}

          {/* ════════ INVENTORY TAB ════════ */}
          {activeTab === "inventory" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Stock Value" value={currency(aging.totalStockValue || 0)} icon={Package} color="text-blue-600" />
                <Stat label="Low Stock Items" value={lowStock.length} icon={AlertTriangle} color="text-amber-600" />
                <Stat label="Expiring Soon" value={expiry.expiringCount || 0} icon={Clock} color="text-orange-600" />
                <Stat label="Value at Risk (Expiry)" value={currency(expiry.totalAtRisk || 0)} icon={AlertTriangle} color="text-red-600" />
              </div>
              <Card>
                <h3 className="font-semibold mb-3">Stock Valuation</h3>
                <DataTable
                  columns={["productName", "qtyOnHand", "costValue", "retailValue", "warehouseName"]}
                  rows={stockValuation.map((r: any) => ({
                    productName: r.productName,
                    qtyOnHand: r.qtyOnHand,
                    costValue: currency(r.costValue),
                    retailValue: currency(r.retailValue),
                    warehouseName: r.warehouseName,
                  }))}
                />
              </Card>
              {(aging.items?.length || 0) > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3">Inventory Aging</h3>
                  <DataTable
                    columns={["productName", "qtyOnHand", "stockValue", "agingBucket", "warehouseName"]}
                    rows={(aging.items || []).map((r: any) => ({
                      productName: r.productName,
                      qtyOnHand: r.qtyOnHand,
                      stockValue: currency(r.stockValue),
                      agingBucket: r.agingBucket,
                      warehouseName: r.warehouseName,
                    }))}
                  />
                </Card>
              )}
              {(expiry.items?.length || 0) > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3">Expiry Tracking</h3>
                  <DataTable
                    columns={["productName", "batchNo", "qty", "expiryDate", "daysUntilExpiry", "valueAtRisk"]}
                    rows={(expiry.items || []).map((r: any) => ({
                      productName: r.productName,
                      batchNo: r.batchNo,
                      qty: r.qty,
                      expiryDate: r.expiryDate,
                      daysUntilExpiry: r.daysUntilExpiry,
                      valueAtRisk: currency(r.valueAtRisk),
                    }))}
                  />
                </Card>
              )}
            </>
          )}

          {/* ════════ FINANCIAL TAB ════════ */}
          {activeTab === "financial" && (
            <>
              {pnl && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Stat label="Revenue" value={currency(pnl.revenue)} icon={DollarSign} color="text-green-600" />
                  <Stat label="COGS" value={currency(pnl.cogs)} icon={Package} color="text-orange-600" />
                  <Stat label="Gross Profit" value={currency(pnl.grossProfit)} icon={TrendingUp} color="text-blue-600" />
                  <Stat label="Net Profit" value={currency(pnl.netProfit)} icon={Wallet} color="text-indigo-600" />
                </div>
              )}
              {balanceSheet && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card>
                    <h3 className="font-semibold mb-2 text-green-700">Assets</h3>
                    <p className="text-2xl font-bold">{currency(balanceSheet.totalAssets)}</p>
                    {(balanceSheet.assets || []).map((a: any) => (
                      <div key={a.code} className="flex justify-between text-sm py-1 border-b">
                        <span>{a.name}</span><span>{currency(a.balance)}</span>
                      </div>
                    ))}
                  </Card>
                  <Card>
                    <h3 className="font-semibold mb-2 text-red-700">Liabilities</h3>
                    <p className="text-2xl font-bold">{currency(balanceSheet.totalLiabilities)}</p>
                    {(balanceSheet.liabilities || []).map((l: any) => (
                      <div key={l.code} className="flex justify-between text-sm py-1 border-b">
                        <span>{l.name}</span><span>{currency(l.balance)}</span>
                      </div>
                    ))}
                  </Card>
                  <Card>
                    <h3 className="font-semibold mb-2 text-blue-700">Equity</h3>
                    <p className="text-2xl font-bold">{currency(balanceSheet.totalEquity)}</p>
                    {(balanceSheet.equity || []).map((e: any) => (
                      <div key={e.code} className="flex justify-between text-sm py-1 border-b">
                        <span>{e.name}</span><span>{currency(e.balance)}</span>
                      </div>
                    ))}
                  </Card>
                </div>
              )}
              {ar && (
                <Card>
                  <h3 className="font-semibold mb-3">Accounts Receivable — {currency(ar.totalOutstanding)}</h3>
                  <div className="grid grid-cols-5 gap-2 mb-3 text-center">
                    {ar.aging && Object.entries(ar.aging).map(([k, v]: [string, any]) => (
                      <div key={k} className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">{k.replace("_", "-")}</p>
                        <p className="font-semibold text-sm">{currency(v)}</p>
                      </div>
                    ))}
                  </div>
                  <DataTable
                    columns={["invoiceNo", "customerName", "balance", "dueDate", "agingDays"]}
                    rows={(ar.invoices || []).map((r: any) => ({
                      invoiceNo: r.invoiceNo,
                      customerName: r.customerName,
                      balance: currency(r.balance),
                      dueDate: r.dueDate?.split("T")[0] || "",
                      agingDays: r.agingDays,
                    }))}
                  />
                </Card>
              )}
              {ap && (
                <Card>
                  <h3 className="font-semibold mb-3">Accounts Payable — {currency(ap.totalOutstanding)}</h3>
                  <DataTable
                    columns={["piNo", "supplierName", "balance", "invoiceDate", "status"]}
                    rows={(ap.invoices || []).map((r: any) => ({
                      piNo: r.piNo,
                      supplierName: r.supplierName,
                      balance: currency(r.balance),
                      invoiceDate: r.invoiceDate?.split("T")[0] || "",
                      status: r.status,
                    }))}
                  />
                </Card>
              )}
            </>
          )}

          {/* ════════ COMMISSION TAB ════════ */}
          {activeTab === "commission" && commissions && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Stat label="Total Earned" value={currency(commissions.totalEarned)} icon={DollarSign} color="text-green-600" />
                <Stat label="Total Paid" value={currency(commissions.totalPaid)} icon={CreditCard} color="text-blue-600" />
                <Stat label="Pending" value={currency(commissions.totalPending)} icon={Clock} color="text-amber-600" />
              </div>
              <Card>
                <h3 className="font-semibold mb-3">Commission by Agent</h3>
                <DataTable
                  columns={["agentName", "saleCount", "totalSales", "totalCommission", "paidCommission", "pendingCommission"]}
                  rows={(commissions.agents || []).map((r: any) => ({
                    agentName: r.agentName,
                    saleCount: r.saleCount,
                    totalSales: currency(r.totalSales),
                    totalCommission: currency(r.totalCommission),
                    paidCommission: currency(r.paidCommission),
                    pendingCommission: currency(r.pendingCommission),
                  }))}
                />
              </Card>
            </>
          )}

          {/* ════════ INSTALLMENTS TAB ════════ */}
          {activeTab === "installments" && installmentSummary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Stat label="Total Financed" value={currency(installmentSummary.totalFinanced)} icon={DollarSign} color="text-blue-600" />
                <Stat label="Collected" value={currency(installmentSummary.totalCollected)} icon={CreditCard} color="text-green-600" />
                <Stat label="Outstanding" value={currency(installmentSummary.totalOutstanding)} icon={AlertTriangle} color="text-amber-600" />
                <Stat label="Overdue" value={currency(installmentSummary.totalOverdue)} icon={AlertTriangle} color="text-red-600" />
                <Stat label="Due This Week" value={currency(installmentSummary.dueThisWeek)} icon={Clock} color="text-orange-600" />
              </div>
              {overdueInstallments.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3 text-red-600">Overdue Installments</h3>
                  <DataTable
                    columns={["customerName", "customerPhone", "planNo", "sequenceNo", "dueDate", "amount", "paidAmount", "daysOverdue"]}
                    rows={overdueInstallments.map((r: any) => ({
                      customerName: r.customerName,
                      customerPhone: r.customerPhone,
                      planNo: r.planNo,
                      sequenceNo: r.sequenceNo,
                      dueDate: r.dueDate?.split("T")[0] || "",
                      amount: currency(r.amount),
                      paidAmount: currency(r.paidAmount),
                      daysOverdue: r.daysOverdue,
                    }))}
                  />
                </Card>
              )}
            </>
          )}

          {/* ════════ SAVED REPORTS ════════ */}
          {activeTab === "saved" && (
            <Card>
              <h3 className="font-semibold mb-3">Saved Report Presets</h3>
              {savedReports.length === 0 ? (
                <p className="text-sm text-gray-400">No saved reports. Use "Save View" to save a filter preset.</p>
              ) : (
                <div className="space-y-2">
                  {savedReports.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.reportType} — {r.config?.startDate || "All time"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {}} className="text-sm text-indigo-600 hover:underline">Load</button>
                        <button onClick={() => deleteSaved(r.id)} className="text-sm text-red-500 hover:underline">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* ════════ SCHEDULED REPORTS ════════ */}
          {activeTab === "scheduled" && (
            <Card>
              <h3 className="font-semibold mb-3">Scheduled Reports</h3>
              {scheduledReports.length === 0 ? (
                <p className="text-sm text-gray-400">No scheduled reports configured.</p>
              ) : (
                <div className="space-y-2">
                  {scheduledReports.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.reportType} — {r.frequency} via {r.deliveryChannel}</p>
                        <p className="text-xs text-gray-400">Next run: {r.nextRunAt?.split("T")[0] || "—"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => deleteScheduled(r.id)} className="text-sm text-red-500 hover:underline">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="font-semibold mb-4">Save Report View</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Report name"
              className="w-full px-3 py-2 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={saveReport} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
