"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Flame,
  CheckCircle,
  Clock,
  RefreshCw,
  ChefHat,
  UtensilsCrossed,
  Wine,
  IceCream,
  AlertTriangle,
  Play,
  CheckCheck,
} from "lucide-react";

interface KOTItem {
  id: string;
  name: string;
  qty: number;
  notes?: string;
  status: string;
}

interface KOTTicket {
  id: string;
  kotNo: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  station: "KITCHEN" | "GRILL" | "BAR" | "DESSERT";
  status: "NEW" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED";
  tableNo?: string;
  waiterName?: string;
  notes?: string;
  createdAt: string;
  items: KOTItem[];
}

const STATION_ICONS: Record<string, React.ReactNode> = {
  KITCHEN: <ChefHat className="w-4 h-4 text-orange-400" />,
  GRILL: <Flame className="w-4 h-4 text-red-400" />,
  BAR: <Wine className="w-4 h-4 text-purple-400" />,
  DESSERT: <IceCream className="w-4 h-4 text-pink-400" />,
};

const KDS_STATUS_COLORS: Record<KOTTicket["status"], { bg: string; border: string; text: string }> = {
  NEW: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400" },
  ACCEPTED: { bg: "bg-indigo-500/10", border: "border-indigo-500/40", text: "text-indigo-400" },
  PREPARING: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-400" },
  READY: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400" },
  SERVED: { bg: "bg-slate-500/10", border: "border-slate-500/40", text: "text-slate-400" },
};

export default function KDSView() {
  const [tickets, setTickets] = useState<KOTTicket[]>([]);
  const [stationFilter, setStationFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchKDS = async () => {
    setLoading(true);
    try {
      const url =
        stationFilter === "ALL"
          ? "/v1/restaurant/kds"
          : `/v1/restaurant/kds?station=${stationFilter}`;
      const res = await api.get<{ data: KOTTicket[] }>(url);
      setTickets(res.data || []);
    } catch (err: any) {
      console.error("KDS fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKDS();
  }, [stationFilter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchKDS, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, stationFilter]);

  const handleUpdateStatus = async (kotId: string, nextStatus: KOTTicket["status"]) => {
    try {
      await api.patch(`/v1/restaurant/kot/${kotId}/status`, { status: nextStatus });
      fetchKDS();
    } catch (err: any) {
      alert("KDS action failed: " + err.message);
    }
  };

  const getElapsedTime = (createdAtStr: string) => {
    const mins = Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 60000);
    return mins < 0 ? 0 : mins;
  };

  return (
    <div className="space-y-6">
      {/* Station Filters & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          {["ALL", "KITCHEN", "GRILL", "BAR", "DESSERT"].map((st) => (
            <button
              key={st}
              id={`kds-filter-${st}`}
              onClick={() => setStationFilter(st)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                stationFilter === st
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {STATION_ICONS[st]}
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            Auto-refresh (10s)
          </label>
          <button
            id="btn-refresh-kds"
            onClick={fetchKDS}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KDS Ticket Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {tickets.map((t) => {
          const mins = getElapsedTime(t.createdAt);
          const isUrgent = mins > 15;
          const isWarning = mins > 8 && mins <= 15;
          const statusStyle = KDS_STATUS_COLORS[t.status] || KDS_STATUS_COLORS.NEW;

          return (
            <div
              key={t.id}
              id={`kds-card-${t.kotNo}`}
              className={`flex flex-col justify-between p-5 rounded-2xl border ${statusStyle.bg} ${statusStyle.border} shadow-xl transition-all hover:border-slate-600`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 tracking-wide uppercase">
                      {t.kotNo}
                    </span>
                    <h4 className="text-lg font-extrabold text-white flex items-center gap-2 mt-0.5">
                      {t.tableNo ? `Table ${t.tableNo}` : t.orderType}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isUrgent
                          ? "bg-rose-500 text-white animate-pulse"
                          : isWarning
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {mins}m ago
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {t.station}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2.5 my-3">
                  {t.items.map((it) => (
                    <div key={it.id} className="flex items-start justify-between text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 flex items-center justify-center font-bold text-white bg-indigo-600 rounded text-[11px]">
                          {it.qty}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-200">{it.name}</p>
                          {it.notes && (
                            <p className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> {it.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {t.notes && (
                  <div className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mb-3">
                    <strong>Order Note:</strong> {t.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800">
                {t.status === "NEW" && (
                  <button
                    id={`btn-kds-accept-${t.id}`}
                    onClick={() => handleUpdateStatus(t.id, "ACCEPTED")}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-all"
                  >
                    <Play className="w-3.5 h-3.5" /> Accept Order
                  </button>
                )}
                {t.status === "ACCEPTED" && (
                  <button
                    id={`btn-kds-prep-${t.id}`}
                    onClick={() => handleUpdateStatus(t.id, "PREPARING")}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-all"
                  >
                    <Flame className="w-3.5 h-3.5" /> Start Cooking
                  </button>
                )}
                {t.status === "PREPARING" && (
                  <button
                    id={`btn-kds-ready-${t.id}`}
                    onClick={() => handleUpdateStatus(t.id, "READY")}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Ready
                  </button>
                )}
                {t.status === "READY" && (
                  <button
                    id={`btn-kds-served-${t.id}`}
                    onClick={() => handleUpdateStatus(t.id, "SERVED")}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Serve & Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {tickets.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-center">
            <UtensilsCrossed className="w-12 h-12 mb-3 text-slate-600" />
            <p className="font-semibold text-slate-400">No active kitchen orders</p>
            <p className="text-xs mt-1">Orders sent to KOT will appear here in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
