"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Plus,
  Trash2,
  GripVertical,
  BarChart3,
  PieChart,
  Table2,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  Clock,
  CreditCard,
  TrendingUp,
  Settings,
  Save,
  ArrowLeft,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  LayoutDashboard,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const currency = (v: number) =>
  `৳${(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

const WIDGET_TYPES = [
  { type: "KPI_CARD", label: "KPI Metric Card", icon: DollarSign, color: "bg-primary-50 text-primary-700 border-primary-200" },
  { type: "CHART", label: "Bar / Trend Chart", icon: BarChart3, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { type: "TABLE", label: "Summary Table", icon: Table2, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { type: "LIST", label: "Activity List", icon: Users, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { type: "GAUGE", label: "Target Gauge", icon: TrendingUp, color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const KPI_OPTIONS = [
  { kpiType: "totalSales", label: "Total Sales (30 Days)" },
  { kpiType: "totalCustomers", label: "Active Customers" },
  { kpiType: "lowStock", label: "Low Stock Inventory Items" },
  { kpiType: "arOutstanding", label: "Accounts Receivable (AR) Due" },
  { kpiType: "overdueInstallments", label: "Overdue Installments" },
];

interface Dashboard {
  id: string;
  name: string;
  isDefault: boolean;
  layout: any;
}

interface Widget {
  id: string;
  widgetType: string;
  title: string;
  config: any;
  posX: number;
  posY: number;
  width: number;
  height: number;
}

function WidgetCard({
  widget,
  onEdit,
  onDelete,
  onDragStart,
}: {
  widget: Widget;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any>(`/api/v1/dashboards/widgets/${widget.id}/data`)
      .then((r: any) => {
        setData(r?.data || r);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [widget.id]);

  const iconInfo =
    WIDGET_TYPES.find((w) => w.type === widget.widgetType) || WIDGET_TYPES[0];

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden group hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between"
      style={{ minHeight: Math.max(160, widget.height * 36) }}
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
          <div className={`p-1.5 rounded-lg border ${iconInfo.color}`}>
            <iconInfo.icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            {widget.title || widget.widgetType}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
            title="Remove Widget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <RefreshCw className="h-5 w-5 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="text-center w-full">
            {widget.widgetType === "KPI_CARD" && data && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {data.label || widget.title}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {typeof data.value === "number" ? currency(data.value) : data.value ?? 0}
                </p>
                {data.change !== undefined && (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                    +{data.change}% vs prev
                  </span>
                )}
              </div>
            )}

            {widget.widgetType === "CHART" && (
              <div className="w-full space-y-2">
                <div className="flex items-end justify-between gap-1.5 h-24 px-4 pt-2">
                  {[35, 65, 45, 90, 60, 80, 50].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary-500/80 hover:bg-primary-600 rounded-t-md transition-all"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[9px] text-slate-400 font-medium">D{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {widget.widgetType === "TABLE" && (
              <div className="space-y-2 w-full text-xs">
                {[
                  { name: "Retail Store POS", val: "৳14,200" },
                  { name: "Wholesale Order #410", val: "৳38,500" },
                  { name: "Online Checkout", val: "৳9,800" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-slate-700"
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="font-bold text-slate-900">{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {widget.widgetType === "GAUGE" && (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-primary-100 border-t-primary-600 animate-pulse" />
                  <span className="absolute font-black text-sm text-slate-800">84%</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Monthly Target Realized</span>
              </div>
            )}

            {widget.widgetType === "LIST" && (
              <div className="space-y-2 text-left w-full text-xs">
                {[
                  { title: "New Quotation Generated", time: "10m ago" },
                  { title: "Invoice INV-0091 Settled", time: "42m ago" },
                  { title: "Credit Hold Released", time: "1h ago" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                      <span className="font-medium text-slate-700">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardBuilderPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  
  // Modal & Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState("KPI_CARD");
  const [newWidgetTitle, setNewWidgetTitle] = useState("");
  const [newWidgetKpi, setNewWidgetKpi] = useState("totalSales");
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadDashboards = useCallback(async () => {
    setLoading(true);
    try {
      const r: any = await api.get("/api/v1/dashboards");
      const list = Array.isArray(r) ? r : r?.data || [];
      setDashboards(list);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWidgets = useCallback(async (dashboardId: string) => {
    try {
      const r: any = await api.get(`/api/v1/dashboards/${dashboardId}/widgets`);
      const list = Array.isArray(r) ? r : r?.data || [];
      setWidgets(list);
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  useEffect(() => {
    if (activeDashboard) loadWidgets(activeDashboard.id);
  }, [activeDashboard, loadWidgets]);

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboardName.trim()) {
      showToast("Please enter a dashboard name", "error");
      return;
    }
    try {
      const r: any = await api.post("/api/v1/dashboards", { name: newDashboardName.trim() });
      showToast("Dashboard created successfully!");
      setShowCreateModal(false);
      setNewDashboardName("");
      await loadDashboards();
      const newId = r?.data?.id || r?.id;
      if (newId) {
        const updated: any = await api.get("/api/v1/dashboards");
        const list = Array.isArray(updated) ? updated : updated?.data || [];
        setActiveDashboard(list.find((d: any) => d.id === newId) || list[0]);
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to create dashboard", "error");
    }
  };

  const addWidget = async () => {
    if (!activeDashboard) return;
    const config: any = {};
    if (newWidgetType === "KPI_CARD") config.kpiType = newWidgetKpi;
    if (newWidgetType === "CHART") config.chartType = "bar";

    try {
      await api.post(`/api/v1/dashboards/${activeDashboard.id}/widgets`, {
        widgetType: newWidgetType,
        title: newWidgetTitle || WIDGET_TYPES.find((w) => w.type === newWidgetType)?.label,
        config,
        posX: (widgets.length % 3) * 4,
        posY: Math.floor(widgets.length / 3) * 4,
        width: 4,
        height: 4,
      });
      showToast("Widget added to dashboard!");
      setShowAddWidget(false);
      setNewWidgetTitle("");
      loadWidgets(activeDashboard.id);
    } catch (err: any) {
      showToast(err?.message || "Failed to add widget", "error");
    }
  };

  const deleteWidget = async (widgetId: string) => {
    if (!activeDashboard) return;
    try {
      await api.delete(`/api/v1/dashboards/${activeDashboard.id}/widgets/${widgetId}`);
      showToast("Widget removed");
      loadWidgets(activeDashboard.id);
    } catch (err: any) {
      showToast(err?.message || "Failed to remove widget", "error");
    }
  };

  if (!activeDashboard) {
    return (
      <div className="min-h-screen bg-background pb-20 font-sans">
        {/* Toast */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 ${
              toastMessage.type === "success" ? "bg-slate-900 ring-1 ring-slate-800" : "bg-rose-600"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="border-b border-slate-200/80 bg-white px-4 sm:px-6 py-5 shadow-xs">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/25">
                  <LayoutDashboard size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      Dashboard Builder & BI Canvas
                    </h1>
                    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary-700 ring-1 ring-primary-200">
                      Drag & Drop
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Create customized executive KPI boards, sales charts, AR gauges, and commercial analytics.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs shadow-primary-500/25 transition hover:bg-primary-700 active:scale-95"
              >
                <Plus size={15} />
                New Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Dashboards List */}
        <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map((d) => (
              <div
                key={d.id}
                onClick={() => setActiveDashboard(d)}
                className="p-6 bg-white rounded-2xl border border-slate-200/80 hover:border-primary-300 hover:shadow-md cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 border border-primary-100 group-hover:scale-105 transition-transform">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{d.name}</h3>
                  </div>
                  {d.isDefault && (
                    <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>Custom Analytics Board</span>
                  <span className="text-primary-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Open Builder <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}

            {dashboards.length === 0 && !loading && (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
                <LayoutGrid className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="font-bold text-slate-900 text-base">No Custom Dashboards Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Build custom KPI boards for your branch managers, cashier shifts, executive sales reviews, and AR aging tracking.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition"
                >
                  Create Your First Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Dashboard Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-primary-50 text-primary-600">
                    <LayoutDashboard className="w-5 h-5" />
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Create Dashboard</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDashboard} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dashboard Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                    placeholder="e.g. Executive Sales & Recovery Board"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-semibold"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs shadow-primary-500/25"
                  >
                    Create Canvas
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success" ? "bg-slate-900 ring-1 ring-slate-800" : "bg-rose-600"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="border-b border-slate-200/80 bg-white px-4 sm:px-6 py-5 shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveDashboard(null)}
              className="p-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              title="Back to Dashboard List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {activeDashboard.name}
                </h1>
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary-700 ring-1 ring-primary-200">
                  Active Canvas
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">{widgets.length} Widgets Configured</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddWidget(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs shadow-primary-500/25 transition hover:bg-primary-700 active:scale-95"
            >
              <Plus size={15} /> Add Widget
            </button>
          </div>
        </div>
      </div>

      {/* Widgets Canvas Grid */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((w) => (
            <WidgetCard
              key={w.id}
              widget={w}
              onEdit={() => setEditingWidget(w)}
              onDelete={() => deleteWidget(w.id)}
              onDragStart={() => {}}
            />
          ))}

          {widgets.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
              <LayoutGrid className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-900 text-base">This Dashboard Canvas is Empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add KPI cards, sales trend charts, AR aging metrics, and customer lists to populate your board.
              </p>
              <button
                onClick={() => setShowAddWidget(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition"
              >
                Add Your First Widget
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <Plus className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Add Analytics Widget</h3>
              </div>
              <button
                onClick={() => setShowAddWidget(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Widget Display Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {WIDGET_TYPES.map((wt) => (
                    <button
                      key={wt.type}
                      type="button"
                      onClick={() => setNewWidgetType(wt.type)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                        newWidgetType === wt.type
                          ? "border-primary-500 bg-primary-50/60 shadow-2xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg border ${wt.color}`}>
                        <wt.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 text-center line-clamp-1">
                        {wt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Widget Title / Header
                </label>
                <input
                  type="text"
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                  placeholder={WIDGET_TYPES.find((w) => w.type === newWidgetType)?.label}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                />
              </div>

              {newWidgetType === "KPI_CARD" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Live Metric Source
                  </label>
                  <select
                    value={newWidgetKpi}
                    onChange={(e) => setNewWidgetKpi(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-semibold"
                  >
                    {KPI_OPTIONS.map((opt) => (
                      <option key={opt.kpiType} value={opt.kpiType}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddWidget(false)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addWidget}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs shadow-primary-500/25"
              >
                Add to Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
