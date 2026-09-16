"use client";

import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  DollarSign,
  GripVertical,
  LayoutDashboard,
  LayoutGrid,
  Plus,
  RefreshCw,
  Table2,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

const currency = (v: number) =>
  `৳${(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

const WIDGET_TYPES = [
  { type: "KPI_CARD", label: "KPI Metric Card", icon: DollarSign },
  { type: "CHART", label: "Bar / Trend Chart", icon: BarChart3 },
  { type: "TABLE", label: "Summary Table", icon: Table2 },
  { type: "LIST", label: "Activity List", icon: Users },
  { type: "GAUGE", label: "Target Gauge", icon: TrendingUp },
];

const KPI_OPTIONS = [
  { value: "totalSales", label: "Total Sales (30 Days)" },
  { value: "totalCustomers", label: "Active Customers" },
  { value: "lowStock", label: "Low Stock Inventory Items" },
  { value: "arOutstanding", label: "Accounts Receivable (AR) Due" },
  { value: "overdueInstallments", label: "Overdue Installments" },
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
  onDelete,
  onDragStart,
}: {
  widget: Widget;
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
  const IconComponent = iconInfo.icon;

  return (
    <div
      className="bg-white rounded-sm border border-sky-100/90 shadow-2xs overflow-hidden group hover:border-[#0284C7] hover:shadow-md transition-all flex flex-col justify-between"
      style={{ minHeight: Math.max(160, widget.height * 36) }}
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50 border-b border-sky-100/90">
        <div className="flex items-center gap-2.5">
          <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
          <div className="p-1.5 rounded-sm border border-sky-200/80 bg-sky-50 text-[#0284C7]">
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#0369A1]">
            {widget.title || widget.widgetType}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDelete}
            className="p-1 rounded-sm border border-rose-200 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
            title="Remove Widget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <RefreshCw className="h-5 w-5 animate-spin text-[#0284C7]" />
          </div>
        ) : (
          <div className="text-center w-full">
            {widget.widgetType === "KPI_CARD" && data && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {data.label || widget.title}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-[#0369A1] tracking-tight [font-variant-numeric:tabular-nums]">
                  {typeof data.value === "number" ? currency(data.value) : data.value ?? 0}
                </p>
                {data.change !== undefined && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm inline-block mt-1">
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
                        className="w-full bg-gradient-to-t from-[#0284C7] to-[#38BDF8] hover:brightness-110 rounded-t-xs transition-all"
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
                    className="flex justify-between items-center p-2 bg-sky-50/40 rounded-sm border border-sky-100 text-slate-700"
                  >
                    <span className="font-medium text-slate-700">{row.name}</span>
                    <span className="font-bold text-[#0369A1]">{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {widget.widgetType === "GAUGE" && (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-sky-100 border-t-[#0284C7] animate-spin" />
                  <span className="absolute font-black text-sm text-[#0369A1]">84%</span>
                </div>
                <span className="text-[11px] text-[#0284C7] font-semibold">Monthly Target Realized</span>
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
                    className="flex items-center justify-between p-2 bg-sky-50/40 rounded-sm border border-sky-100"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
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

  const addWidget = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="space-y-4 font-sans">
        {/* Toast */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-sm px-4 py-3 text-xs font-semibold text-white shadow-xl transition-all animate-in fade-in slide-in-from-bottom-5 ${
              toastMessage.type === "success" ? "bg-slate-900 ring-1 ring-slate-800" : "bg-rose-600"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Header Breadcrumb */}
        <CustomBreadcrumb
          title="Dashboard Builder & BI Canvas"
          icon={<LayoutDashboard size={16} />}
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Builder" },
          ]}
          actions={
            <CustomButton
              variant="primary"
              size="md"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus size={15} strokeWidth={2.5} className="shrink-0 text-white" />}
            >
              New Dashboard
            </CustomButton>
          }
        />

        {/* Dashboards List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pt-1">
          {dashboards.map((d) => (
            <div
              key={d.id}
              onClick={() => setActiveDashboard(d)}
              className="p-5 bg-white rounded-sm border border-sky-100/90 hover:border-[#0284C7] hover:shadow-md cursor-pointer transition-all space-y-3 group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80 group-hover:scale-105 transition-transform shrink-0">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[#0369A1] text-sm truncate">{d.name}</h3>
                </div>
                {d.isDefault && (
                  <span className="text-[10px] font-bold bg-sky-100 text-[#0284C7] border border-sky-200 px-2 py-0.5 rounded-sm shrink-0">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-sky-100">
                <span>Custom Board</span>
                <span className="text-[#0284C7] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Open Builder <ArrowRight size={12} />
                </span>
              </div>
            </div>
          ))}

          {dashboards.length === 0 && !loading && (
            <div className="col-span-full text-center py-16 bg-white rounded-sm border border-sky-100/90 p-8 space-y-3 shadow-2xs">
              <LayoutGrid className="w-10 h-10 mx-auto text-sky-300" />
              <h3 className="font-bold text-[#0369A1] text-base">No Custom Dashboards Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Build custom KPI boards for branch managers, cashier shifts, and executive reviews.
              </p>
              <CustomButton
                variant="primary"
                size="md"
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Plus size={15} strokeWidth={2.5} className="shrink-0 text-white" />}
              >
                Create Your First Dashboard
              </CustomButton>
            </div>
          )}
        </div>

        {/* Create Dashboard Modal */}
        <CustomModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Dashboard"
          size="md"
        >
          <form onSubmit={handleCreateDashboard} className="space-y-4">
            <CustomInput
              label="Dashboard Name *"
              required
              autoFocus
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              placeholder="e.g. Executive Sales & Recovery Board"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100">
              <CustomButton
                variant="outline"
                size="md"
                type="button"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton variant="primary" size="md" type="submit">
                Create Dashboard
              </CustomButton>
            </div>
          </form>
        </CustomModal>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-sm px-4 py-3 text-xs font-semibold text-white shadow-xl transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success" ? "bg-slate-900 ring-1 ring-slate-800" : "bg-rose-600"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Breadcrumb */}
      <CustomBreadcrumb
        title={activeDashboard.name}
        description={`${widgets.length} Widgets Configured on Canvas`}
        icon={<LayoutDashboard size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Builder", href: "/dashboard/builder" },
          { label: activeDashboard.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <CustomButton
              variant="outline"
              size="md"
              onClick={() => setActiveDashboard(null)}
              leftIcon={<ArrowLeft size={15} strokeWidth={2} className="shrink-0" />}
            >
              Back to List
            </CustomButton>
            <CustomButton
              variant="primary"
              size="md"
              onClick={() => setShowAddWidget(true)}
              leftIcon={<Plus size={15} strokeWidth={2.5} className="shrink-0 text-white" />}
            >
              Add Widget
            </CustomButton>
          </div>
        }
      />

      {/* Widgets Canvas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pt-1">
        {widgets.map((w) => (
          <WidgetCard
            key={w.id}
            widget={w}
            onDelete={() => deleteWidget(w.id)}
            onDragStart={() => {}}
          />
        ))}

        {widgets.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-sm border-2 border-dashed border-sky-200/80 p-8 space-y-3 shadow-2xs">
            <LayoutGrid className="w-10 h-10 mx-auto text-sky-300" />
            <h3 className="font-bold text-[#0369A1] text-base">This Dashboard Canvas is Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add KPI cards, sales trend charts, AR aging metrics, and customer lists to populate your board.
            </p>
            <CustomButton
              variant="primary"
              size="md"
              onClick={() => setShowAddWidget(true)}
              leftIcon={<Plus size={15} strokeWidth={2.5} className="shrink-0 text-white" />}
            >
              Add Your First Widget
            </CustomButton>
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      <CustomModal
        open={showAddWidget}
        onClose={() => setShowAddWidget(false)}
        title="Add Analytics Widget"
        size="lg"
      >
        <form onSubmit={addWidget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0369A1] mb-2">
              Widget Display Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {WIDGET_TYPES.map((wt) => {
                const WIcon = wt.icon;
                const isSelected = newWidgetType === wt.type;
                return (
                  <button
                    key={wt.type}
                    type="button"
                    onClick={() => setNewWidgetType(wt.type)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-sm border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#0284C7] bg-[#E0F2FE] shadow-2xs"
                        : "border-sky-100 hover:border-sky-300 bg-white"
                    }`}
                  >
                    <div className="p-1.5 rounded-sm border border-sky-200/80 bg-sky-50 text-[#0284C7]">
                      <WIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold text-center line-clamp-1 ${
                      isSelected ? "text-[#0369A1]" : "text-slate-700"
                    }`}>
                      {wt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <CustomInput
            label="Widget Title / Header"
            value={newWidgetTitle}
            onChange={(e) => setNewWidgetTitle(e.target.value)}
            placeholder={WIDGET_TYPES.find((w) => w.type === newWidgetType)?.label}
          />

          {newWidgetType === "KPI_CARD" && (
            <CustomSelect
              label="Live Metric Source"
              value={newWidgetKpi}
              onChange={(e) => setNewWidgetKpi(e.target.value)}
              options={KPI_OPTIONS}
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-sky-100">
            <CustomButton
              variant="outline"
              size="md"
              type="button"
              onClick={() => setShowAddWidget(false)}
            >
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="md" type="submit">
              Add to Canvas
            </CustomButton>
          </div>
        </form>
      </CustomModal>
    </div>
  );
}
