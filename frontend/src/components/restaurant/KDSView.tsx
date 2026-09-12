"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { CustomTabs, CustomCheckbox, CustomButton } from "@/components/custom";
import { toast } from "react-toastify";
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
  KITCHEN: <ChefHat className="w-4 h-4 text-orange-600" />,
  GRILL: <Flame className="w-4 h-4 text-red-600" />,
  BAR: <Wine className="w-4 h-4 text-purple-600" />,
  DESSERT: <IceCream className="w-4 h-4 text-pink-600" />,
};

const KDS_STATUS_COLORS: Record<KOTTicket["status"], { bg: string; border: string; text: string }> = {
  NEW: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  ACCEPTED: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  PREPARING: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  READY: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  SERVED: { bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-700" },
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
      toast.error("KDS action failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const getElapsedTime = (createdAtStr: string) => {
    const mins = Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 60000);
    return mins < 0 ? 0 : mins;
  };

  return (
    <div className="space-y-6 w-full">
      {/* Station Filters & Controls (Full Width Card) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-md border border-slate-200 shadow-2xs w-full">
        <div className="flex-1 min-w-[280px]">
          <CustomTabs
            tabs={[
              { id: "ALL", label: "ALL" },
              { id: "KITCHEN", label: "KITCHEN", icon: <ChefHat className="w-4 h-4 text-orange-600" /> },
              { id: "GRILL", label: "GRILL", icon: <Flame className="w-4 h-4 text-red-600" /> },
              { id: "BAR", label: "BAR", icon: <Wine className="w-4 h-4 text-purple-600" /> },
              { id: "DESSERT", label: "DESSERT", icon: <IceCream className="w-4 h-4 text-pink-600" /> },
            ]}
            activeTab={stationFilter}
            onChange={(stId) => setStationFilter(stId)}
            themeColor="orange"
            className="border-none shadow-none p-0 bg-transparent"
          />
        </div>

        <div className="flex items-center gap-3">
          <CustomCheckbox
            label="Auto-refresh (10s)"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            themeColor="orange"
          />
          <button
            id="btn-refresh-kds"
            onClick={fetchKDS}
            className="p-2 text-gray-600 hover:text-gray-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-all cursor-pointer"
            title="Refresh KDS Tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* KDS Ticket Cards Grid (Full Width Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {tickets.map((t) => {
          const mins = getElapsedTime(t.createdAt);
          const isUrgent = mins > 15;
          const isWarning = mins > 8 && mins <= 15;
          const statusStyle = KDS_STATUS_COLORS[t.status] || KDS_STATUS_COLORS.NEW;

          return (
            <div
              key={t.id}
              id={`kds-card-${t.kotNo}`}
              className={`flex flex-col justify-between p-5 rounded-md border ${statusStyle.bg} ${statusStyle.border} shadow-2xs bg-white transition-all duration-200 hover:shadow-md hover:border-orange-300 w-full`}
            >
              <div className="w-full">
                {/* Card Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3 w-full">
                  <div>
                    <span className="text-xs font-bold text-orange-600 tracking-wide uppercase">
                      {t.kotNo}
                    </span>
                    <h4 className="text-base font-bold text-gray-600 flex items-center gap-2 mt-0.5">
                      {t.tableNo ? `Table ${t.tableNo}` : t.orderType}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isUrgent
                          ? "bg-rose-600 text-white shadow-2xs"
                          : isWarning
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {mins}m ago
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {t.station}
                    </span>
                  </div>
                </div>

                {/* Items List (Full Width Inside Card) */}
                <div className="space-y-2 my-3 w-full">
                  {t.items.map((it) => (
                    <div key={it.id} className="flex items-start justify-between text-xs bg-slate-50 p-2.5 rounded-md border border-slate-100 w-full">
                      <div className="flex items-start gap-2.5 w-full">
                        <span className="w-5 h-5 flex items-center justify-center font-bold text-white bg-orange-600 rounded text-[11px] shrink-0">
                          {it.qty}
                        </span>
                        <div className="w-full">
                          <p className="font-bold text-gray-600">{it.name}</p>
                          {it.notes && (
                            <p className="text-[10px] text-amber-700 mt-0.5 flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0 text-amber-600" /> {it.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {t.notes && (
                  <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-md border border-amber-200 mb-3 w-full">
                    <strong>Order Note:</strong> {t.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons (Full Width) */}
              <div className="pt-3 border-t border-slate-100 w-full">
                {t.status === "NEW" && (
                  <button
                    id={`btn-kds-accept-${t.id}`}
                    onClick={() => handleUpdateStatus(t.id, "ACCEPTED")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-md shadow-2xs transition-all"
                  >
                    <Play className="w-3.5 h-3.5" /> Accept Order
                  </button>
                )}
                {t.status === "ACCEPTED" && (
                  <button
                    id={`btn-kds-prep-${t.id}`}
                    onClick={() => handleUpdateStatus(t.id, "PREPARING")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-2xs transition-all"
                  >
                    <Flame className="w-3.5 h-3.5" /> Start Cooking
                  </button>
                )}
                {t.status === "PREPARING" && (
                  <button
                    id={`btn-kds-ready-${t.id}`}
                    onClick={() => handleUpdateStatus(t.id, "READY")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Ready
                  </button>
                )}
                {t.status === "READY" && (
                  <button
                    id={`btn-kds-served-${t.id}`}
                    onClick={() => handleUpdateStatus(t.id, "SERVED")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-gray-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Serve & Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {tickets.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white border border-dashed border-slate-200 rounded-md text-gray-500 text-center shadow-2xs w-full">
            <UtensilsCrossed className="w-10 h-10 mb-3 text-gray-400" />
            <p className="font-bold text-gray-600">No active kitchen orders</p>
            <p className="text-xs text-gray-500 mt-1">Orders sent to KOT from Restaurant POS will appear here in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
