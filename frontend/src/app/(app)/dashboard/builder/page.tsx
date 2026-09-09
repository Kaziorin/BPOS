"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Plus, Trash2, GripVertical, BarChart3, PieChart, Table2,
  DollarSign, Package, Users, AlertTriangle, Clock, CreditCard,
  TrendingUp, Settings, Save, ArrowLeft, LayoutGrid,
} from "lucide-react";
import Link from "next/link";

const currency = (v: number) => `৳${(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

const WIDGET_TYPES = [
  { type: "KPI_CARD", label: "KPI Card", icon: DollarSign, color: "bg-blue-500" },
  { type: "CHART", label: "Chart", icon: BarChart3, color: "bg-green-500" },
  { type: "TABLE", label: "Table", icon: Table2, color: "bg-purple-500" },
  { type: "LIST", label: "List", icon: Users, color: "bg-orange-500" },
  { type: "GAUGE", label: "Gauge", icon: TrendingUp, color: "bg-red-500" },
];

const KPI_OPTIONS = [
  { kpiType: "totalSales", label: "Total Sales (30d)" },
  { kpiType: "totalCustomers", label: "Total Customers" },
  { kpiType: "lowStock", label: "Low Stock Items" },
  { kpiType: "arOutstanding", label: "AR Outstanding" },
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
    api.get<any>(`/api/v1/dashboards/widgets/${widget.id}/data`).then((r) => {
      setData(r?.data || r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [widget.id]);

  const iconInfo = WIDGET_TYPES.find((w) => w.type === widget.widgetType) || WIDGET_TYPES[0];

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
      style={{ minHeight: widget.height * 40 }}
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
          <div className={`p-1 rounded ${iconInfo.color}`}>
            <iconInfo.icon className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium">{widget.title || widget.widgetType}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 hover:bg-gray-200 rounded"><Settings className="w-3 h-3" /></button>
          <button onClick={onDelete} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
          </div>
        ) : (
          <div className="text-center">
            {widget.widgetType === "KPI_CARD" && data && (
              <>
                <p className="text-xs text-gray-500 mb-1">{data.label}</p>
                <p className="text-3xl font-bold">{typeof data.value === "number" ? currency(data.value) : data.value ?? 0}</p>
              </>
            )}
            {widget.widgetType === "CHART" && (
              <div className="flex items-end justify-center gap-1 h-24">
                {[40, 70, 55, 90, 65, 80, 45].map((h, i) => (
                  <div key={i} className="w-6 bg-indigo-400 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            )}
            {widget.widgetType === "TABLE" && (
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <div className="h-3 bg-gray-200 rounded flex-1" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </div>
            )}
            {widget.widgetType === "GAUGE" && (
              <div className="w-20 h-20 mx-auto rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            )}
            {widget.widgetType === "LIST" && (
              <div className="space-y-2 text-left">
                {["Item 1", "Item 2", "Item 3"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-gray-600">{item}</span>
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
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState("KPI_CARD");
  const [newWidgetTitle, setNewWidgetTitle] = useState("");
  const [newWidgetKpi, setNewWidgetKpi] = useState("totalSales");
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboards = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<any[]>("/api/v1/dashboards");
      setDashboards(Array.isArray(r) ? r : r?.data || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  const loadWidgets = useCallback(async (dashboardId: string) => {
    try {
      const r = await api.get<any[]>(`/api/v1/dashboards/${dashboardId}/widgets`);
      setWidgets(Array.isArray(r) ? r : r?.data || []);
    } catch { /* empty */ }
  }, []);

  useEffect(() => { loadDashboards(); }, [loadDashboards]);

  useEffect(() => {
    if (activeDashboard) loadWidgets(activeDashboard.id);
  }, [activeDashboard, loadWidgets]);

  const createDashboard = async () => {
    if (!newDashboardName) return;
    const r = await api.post<any>("/api/v1/dashboards", { name: newDashboardName });
    setShowCreateModal(false);
    setNewDashboardName("");
    await loadDashboards();
    const newId = r?.data?.id || r?.id;
    if (newId) {
      const updated = await api.get<any[]>("/api/v1/dashboards");
      const list = Array.isArray(updated) ? updated : updated?.data || [];
      setActiveDashboard(list.find((d: any) => d.id === newId) || list[0]);
    }
  };

  const addWidget = async () => {
    if (!activeDashboard) return;
    const config: any = {};
    if (newWidgetType === "KPI_CARD") config.kpiType = newWidgetKpi;
    if (newWidgetType === "CHART") config.chartType = "bar";

    await api.post(`/api/v1/dashboards/${activeDashboard.id}/widgets`, {
      widgetType: newWidgetType,
      title: newWidgetTitle || WIDGET_TYPES.find((w) => w.type === newWidgetType)?.label,
      config,
      posX: widgets.length % 3 * 4,
      posY: Math.floor(widgets.length / 3) * 4,
      width: 4,
      height: 4,
    });
    setShowAddWidget(false);
    setNewWidgetTitle("");
    loadWidgets(activeDashboard.id);
  };

  const deleteWidget = async (widgetId: string) => {
    if (!activeDashboard) return;
    await api.delete(`/api/v1/dashboards/${activeDashboard.id}/widgets/${widgetId}`);
    loadWidgets(activeDashboard.id);
  };

  if (!activeDashboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Builder</h1>
            <p className="text-sm text-gray-500">Create and customize your dashboards</p>
          </div>
          <button
            onClick={createDashboard}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> New Dashboard
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboards.map((d) => (
            <div
              key={d.id}
              onClick={() => setActiveDashboard(d)}
              className="p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <LayoutGrid className="w-6 h-6 text-indigo-600" />
                <h3 className="font-semibold">{d.name}</h3>
              </div>
              {d.isDefault && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Default</span>}
              <p className="text-sm text-gray-400 mt-2">Click to edit</p>
            </div>
          ))}
          {dashboards.length === 0 && !loading && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No dashboards yet. Create your first one!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveDashboard(null)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{activeDashboard.name}</h1>
            <p className="text-sm text-gray-500">{widgets.length} widgets</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddWidget(true)}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Add Widget
        </button>
      </div>

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
          <div className="col-span-3 text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 mb-4">This dashboard is empty</p>
            <button
              onClick={() => setShowAddWidget(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              Add your first widget
            </button>
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] shadow-xl">
            <h3 className="font-semibold text-lg mb-4">Add Widget</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Widget Type</label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {WIDGET_TYPES.map((wt) => (
                    <button
                      key={wt.type}
                      onClick={() => setNewWidgetType(wt.type)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                        newWidgetType === wt.type ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`p-2 rounded ${wt.color}`}>
                        <wt.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs">{wt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Title</label>
                <input
                  type="text"
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                  placeholder={WIDGET_TYPES.find((w) => w.type === newWidgetType)?.label}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              {newWidgetType === "KPI_CARD" && (
                <div>
                  <label className="text-sm font-medium text-gray-600">KPI Metric</label>
                  <select
                    value={newWidgetKpi}
                    onChange={(e) => setNewWidgetKpi(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  >
                    {KPI_OPTIONS.map((opt) => (
                      <option key={opt.kpiType} value={opt.kpiType}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddWidget(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={addWidget} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Widget</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
