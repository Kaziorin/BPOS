"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChefHat,
  Flame,
  Wine,
  IceCream,
  CheckCircle2,
  Clock,
  RefreshCw,
  Play,
  CheckCheck,
  Tv,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Search,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Clock3,
  Sparkles,
  Layers,
  Utensils,
  User,
  Bell,
  Settings,
  LogOut,
  XCircle,
  Check,
  ChevronDown,
  FileText,
  Ban,
  TrendingUp,
  PlusCircle,
} from "lucide-react";
import { api } from "@/lib/api";

// ── Types & Interfaces ────────────────────────────────────────────────
export type KDSColumnStatus = "QUEUED" | "PREPARING" | "READY";

export interface KOTItem {
  id: string;
  name: string;
  qty: number;
  notes?: string;
  completed?: boolean;
}

export interface KOTTicket {
  id: string;
  orderNo: string;
  tokenNo?: string;
  tableNo?: string;
  orderType: "Dine-in" | "Takeaway" | "Delivery";
  timePlaced: string;
  station: "KITCHEN" | "GRILL" | "BAR" | "DESSERT";
  status: KDSColumnStatus;
  chefRole?: string;
  customerName?: string;
  createdAt: string;
  items: KOTItem[];
  readyAt?: string;
}

// Staff / Chef Role Options
const CHEF_ROLES = ["Head chef", "Sous chef", "Line cook", "Grill master", "Barista", "Pastry chef"];

const STATION_ICONS: Record<string, React.ReactNode> = {
  KITCHEN: <ChefHat className="w-4 h-4 text-amber-600" />,
  GRILL: <Flame className="w-4 h-4 text-rose-600" />,
  BAR: <Wine className="w-4 h-4 text-purple-600" />,
  DESSERT: <IceCream className="w-4 h-4 text-pink-600" />,
};

export default function KitchenManagementPage() {
  // Mode Switcher: "OPERATOR" (Kanban Control Board) vs "FACING" (Customer Overhead TV)
  const [viewMode, setViewMode] = useState<"OPERATOR" | "FACING">("OPERATOR");

  // Core State
  const [tickets, setTickets] = useState<KOTTicket[]>([]);
  const [activeFilterPill, setActiveFilterPill] = useState<string>("ALL");
  const [stationFilter, setStationFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [nowTime, setNowTime] = useState<Date>(new Date());

  const containerRef = useRef<HTMLDivElement>(null);

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Broadcast & Local Storage Sync across tabs/screens
  const broadcastSync = (updated: KOTTicket[]) => {
    try {
      localStorage.setItem("bpos_kitchen_kanban_tickets", JSON.stringify(updated));
      const bc = new BroadcastChannel("bpos_kitchen_kanban_sync");
      bc.postMessage({ type: "SYNC_TICKETS", tickets: updated });
      bc.close();
    } catch (e) {
      console.warn("Broadcast error:", e);
    }
  };

  // Fetch Tickets from Real API Endpoint
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/v1/restaurant/kds").catch(() => null);
      const serverData = res?.data?.data || res?.data;
      if (Array.isArray(serverData)) {
        const mapped: KOTTicket[] = serverData.map((t: any) => ({
          id: t.id,
          orderNo: t.orderNo || t.kotNo || `KOT-${t.id.slice(0, 4)}`,
          tokenNo: t.tokenNo,
          tableNo: t.tableNo,
          orderType: t.orderType === "TAKEAWAY" ? "Takeaway" : t.orderType === "DELIVERY" ? "Delivery" : "Dine-in",
          timePlaced: t.timePlaced || new Date(t.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          station: t.station || "KITCHEN",
          status: t.status === "READY" || t.status === "READY_TO_SERVE" || t.status === "SERVED" ? "READY" : t.status === "PREPARING" || t.status === "COOKING" || t.status === "PLATING" || t.status === "ACCEPTED" ? "PREPARING" : "QUEUED",
          chefRole: t.chefRole || "Head chef",
          customerName: t.customerName,
          createdAt: t.createdAt || new Date().toISOString(),
          readyAt: t.readyAt,
          items: Array.isArray(t.items)
            ? t.items.map((i: any) => ({
                id: i.id || crypto.randomUUID(),
                name: i.name,
                qty: i.qty || 1,
                notes: i.notes || "",
                completed: i.completed ?? (t.status === "READY" || t.status === "READY_TO_SERVE" || t.status === "SERVED"),
              }))
            : [],
        }));
        setTickets(mapped);
        broadcastSync(mapped);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.warn("KDS API fetch error:", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchTickets, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTickets]);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("bpos_kitchen_kanban_sync");
      bc.onmessage = (event) => {
        if (event.data && event.data.type === "SYNC_TICKETS" && Array.isArray(event.data.tickets)) {
          setTickets(event.data.tickets);
        }
      };
    } catch {}
    return () => {
      if (bc) bc.close();
    };
  }, []);

  // Chime Sound
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {}
  };

  // Status Shift Handler
  const moveTicketStatus = (ticketId: string, nextStatus: KDSColumnStatus) => {
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const isReady = nextStatus === "READY";
        return {
          ...t,
          status: nextStatus,
          readyAt: isReady ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t.readyAt,
          items: t.items.map((i) => ({ ...i, completed: isReady ? true : i.completed })),
        };
      }
      return t;
    });

    setTickets(updated);
    broadcastSync(updated);
    playChime();

    try {
      const backendSt = nextStatus === "READY" ? "READY" : nextStatus === "PREPARING" ? "PREPARING" : "ACCEPTED";
      api.patch(`/v1/restaurant/kot/${ticketId}/status`, { status: backendSt }).catch(() => {});
    } catch {}
  };

  // Toggle Item Checklist Box
  const toggleItemCompleted = (ticketId: string, itemId: string) => {
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const nextItems = t.items.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i));
        const allDone = nextItems.length > 0 && nextItems.every((i) => i.completed);
        const nextStatus: KDSColumnStatus = allDone ? "READY" : t.status === "QUEUED" ? "PREPARING" : t.status;

        return {
          ...t,
          status: nextStatus,
          readyAt: allDone ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t.readyAt,
          items: nextItems,
        };
      }
      return t;
    });

    setTickets(updated);
    broadcastSync(updated);
  };

  // Change Chef Assigned Role
  const changeChefRole = (ticketId: string, newRole: string) => {
    const updated = tickets.map((t) => (t.id === ticketId ? { ...t, chefRole: newRole } : t));
    setTickets(updated);
    broadcastSync(updated);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Elapsed mins
  const getElapsedMins = (createdAtStr: string) => {
    return Math.max(0, Math.floor((nowTime.getTime() - new Date(createdAtStr).getTime()) / 60000));
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesStation = stationFilter === "ALL" || t.station === stationFilter;
    const matchesPill =
      activeFilterPill === "ALL" ||
      (activeFilterPill === "QUEUED" && t.status === "QUEUED") ||
      (activeFilterPill === "PREPARING" && t.status === "PREPARING") ||
      (activeFilterPill === "READY" && t.status === "READY");
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.orderNo.toLowerCase().includes(q) ||
      (t.tableNo && t.tableNo.toLowerCase().includes(q)) ||
      (t.tokenNo && t.tokenNo.toLowerCase().includes(q)) ||
      t.items.some((i) => i.name.toLowerCase().includes(q));
    return matchesStation && matchesPill && matchesSearch;
  });

  // Kanban Columns
  const queuedColumnTickets = filteredTickets.filter((t) => t.status === "QUEUED");
  const preparingColumnTickets = filteredTickets.filter((t) => t.status === "PREPARING");
  const readyColumnTickets = filteredTickets.filter((t) => t.status === "READY");

  // KPI Metrics
  const newOrdersCount = tickets.filter((t) => t.status === "QUEUED").length;
  const preparingCount = tickets.filter((t) => t.status === "PREPARING").length;
  const completedCount = tickets.filter((t) => t.status === "READY").length;
  const cancelledCount = tickets.filter((t) => (t as any).status === "CANCELLED").length;

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-[#f4f5f8] text-slate-800 font-sans select-none pb-12"
    >
      {/* ── 1. TOP NAVBAR (MATCHING SCREENSHOT HEADER) ────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 shadow-xs">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left Title & Search */}
          <div className="flex items-center gap-4 flex-1 min-w-[280px]">
            <Link
              href="/restaurant"
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition"
              title="Back to Restaurant Hub"
            >
              <ArrowLeft size={18} />
            </Link>

            {/* Top Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, orders, tokens..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
          </div>

          {/* Right User & Control Widgets */}
          <div className="flex items-center gap-3">
            {/* View Mode Switcher: Operator vs Facing TV */}
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-inner">
              <button
                id="btn-switch-operator-mode"
                onClick={() => setViewMode("OPERATOR")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                  viewMode === "OPERATOR"
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <ChefHat size={15} />
                <span>Kitchen Operator</span>
              </button>
              <button
                id="btn-switch-facing-mode"
                onClick={() => setViewMode("FACING")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                  viewMode === "FACING"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Tv size={15} />
                <span>Facing Display</span>
              </button>
            </div>

            {/* Chime Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`rounded-xl border p-2 transition ${
                soundEnabled
                  ? "border-orange-500/40 bg-orange-50 text-orange-600"
                  : "border-slate-200 bg-slate-100 text-slate-400"
              }`}
              title={soundEnabled ? "Audio Chime Enabled" : "Muted"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>



            {/* Manual Sync */}
            <button
              onClick={fetchTickets}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 transition"
              title="Refresh KDS"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-orange-500" : ""} />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              title="Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
            </button>

            {/* Notification & User Profile Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition relative">
                <Bell size={16} />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-orange-500" />
              </button>
              
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  EG
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">Elina Gilbert</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Cashier / Chef</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. MAIN CONTENT AREA ───────────────────────── */}
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 space-y-6">
        {viewMode === "OPERATOR" && (
          <div className="space-y-6">
            {/* KPI SCORECARDS ROW (MATCHING SCREENSHOT) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: New Orders */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between transition hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-slate-500">New Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{newOrdersCount.toString().padStart(2, "0")}</h3>
            </div>
            <div className="rounded-2xl bg-orange-50 p-3 text-orange-500 border border-orange-100">
              <FileText size={22} />
            </div>
          </div>

          {/* Card 2: Preparing */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between transition hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-slate-500">Preparing</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{preparingCount.toString().padStart(2, "0")}</h3>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-500 border border-amber-100">
              <Flame size={22} />
            </div>
          </div>

          {/* Card 3: Completed Orders */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between transition hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-slate-500">Completed Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{completedCount.toString().padStart(2, "0")}</h3>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-500 border border-emerald-100">
              <CheckCircle2 size={22} />
            </div>
          </div>

          {/* Card 4: Cancelled Orders */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between transition hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-slate-500">Cancelled Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{cancelledCount.toString().padStart(2, "0")}</h3>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-500 border border-rose-100">
              <Ban size={22} />
            </div>
          </div>
        </div>

        {/* ── 3. FILTER PILLS BAR (MATCHING SCREENSHOT) ────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveFilterPill("ALL")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition border ${
                activeFilterPill === "ALL"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <UtensilsCrossed size={14} />
              <span>All Orders</span>
            </button>

            <button
              onClick={() => setActiveFilterPill("QUEUED")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition border ${
                activeFilterPill === "QUEUED"
                  ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <FileText size={14} className="text-purple-600" />
              <span>Queued ({queuedColumnTickets.length})</span>
            </button>

            <button
              onClick={() => setActiveFilterPill("PREPARING")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition border ${
                activeFilterPill === "PREPARING"
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Flame size={14} className="text-amber-600" />
              <span>Preparing ({preparingColumnTickets.length})</span>
            </button>

            <button
              onClick={() => setActiveFilterPill("READY")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition border ${
                activeFilterPill === "READY"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Bell size={14} className="text-emerald-600" />
              <span>Ready ({readyColumnTickets.length})</span>
            </button>
          </div>
        </div>

            {/* ── 4. OPERATOR VIEW: 3-COLUMN KANBAN BOARD ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* 🟣 COLUMN 1: QUEUED */}
            <div className="flex flex-col rounded-3xl bg-[#efedf8] border border-purple-200/80 overflow-hidden shadow-xs">
              {/* Header */}
              <div className="bg-[#701a75] px-5 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <FileText size={18} />
                  <span>Queued</span>
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black">
                  {queuedColumnTickets.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="p-3.5 space-y-3.5 min-h-[60vh]">
                {queuedColumnTickets.map((t) => {
                  const elapsedMins = getElapsedMins(t.createdAt);
                  return (
                    <div
                      key={t.id}
                      className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3.5 transition hover:shadow-md"
                    >
                      {/* Ticket Title & Badge */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">Order # {t.orderNo}</h4>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                t.orderType === "Takeaway"
                                  ? "bg-sky-500 text-white"
                                  : "bg-emerald-500 text-white"
                              }`}
                            >
                              {t.orderType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium mt-1">Time : {t.timePlaced}</p>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-sm text-slate-800">
                            {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "01"}`}
                          </span>
                          <div className="flex items-center justify-end gap-1 text-xs text-slate-400 font-semibold mt-1">
                            <Clock size={12} />
                            <span>{elapsedMins}m</span>
                          </div>
                        </div>
                      </div>

                      {/* Staff Role Selector Dropdown */}
                      <div className="relative">
                        <select
                          value={t.chefRole || "Sous chef"}
                          onChange={(e) => changeChefRole(t.id, e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                        >
                          {CHEF_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 pt-1">
                        {t.items.map((item) => (
                          <div key={item.id} className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="text-orange-600">{item.qty}x</span>
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button: Start Preparing */}
                      <button
                        onClick={() => moveTicketStatus(t.id, "PREPARING")}
                        className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-black tracking-wide shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        Start Preparing
                      </button>
                    </div>
                  );
                })}

                {queuedColumnTickets.length === 0 && (
                  <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                    No queued orders in line
                  </div>
                )}
              </div>
            </div>

            {/* 🟠 COLUMN 2: PREPARING */}
            <div className="flex flex-col rounded-3xl bg-[#fff5ea] border border-orange-200/80 overflow-hidden shadow-xs">
              {/* Header */}
              <div className="bg-[#ea580c] px-5 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Flame size={18} />
                  <span>Preparing</span>
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black">
                  {preparingColumnTickets.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="p-3.5 space-y-3.5 min-h-[60vh]">
                {preparingColumnTickets.map((t) => {
                  const elapsedMins = getElapsedMins(t.createdAt);
                  const completedItems = t.items.filter((i) => i.completed).length;
                  const progressPct =
                    t.items.length > 0 ? Math.round((completedItems / t.items.length) * 100) : 0;

                  return (
                    <div
                      key={t.id}
                      className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3.5 transition hover:shadow-md"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">Order # {t.orderNo}</h4>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                t.orderType === "Takeaway"
                                  ? "bg-sky-500 text-white"
                                  : "bg-emerald-500 text-white"
                              }`}
                            >
                              {t.orderType}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-sm text-slate-800">
                            {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "12"}`}
                          </span>
                          <div className="flex items-center justify-end gap-1 text-xs text-orange-600 font-bold mt-0.5 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                            <Clock size={11} />
                            <span>{elapsedMins}m</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                          <span>Progress</span>
                          <span className="text-slate-800 font-black">{progressPct}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Staff Role Selector */}
                      <div className="relative">
                        <select
                          value={t.chefRole || "Head chef"}
                          onChange={(e) => changeChefRole(t.id, e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                        >
                          {CHEF_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Items Checklist */}
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        {t.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleItemCompleted(t.id, item.id)}
                            className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer select-none group"
                          >
                            <span
                              className={`h-5 w-5 rounded-full flex items-center justify-center transition border ${
                                item.completed
                                  ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                                  : "border-slate-300 bg-slate-50 group-hover:border-orange-400"
                              }`}
                            >
                              {item.completed && <Check size={13} strokeWidth={3} />}
                            </span>
                            <span className={item.completed ? "line-through opacity-60 text-slate-500" : ""}>
                              <strong className="text-orange-600 mr-1">{item.qty}x</strong>
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button: Move to Ready */}
                      <button
                        onClick={() => moveTicketStatus(t.id, "READY")}
                        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-2.5 text-xs font-black tracking-wide shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={15} /> Mark Ready to Serve
                      </button>
                    </div>
                  );
                })}

                {preparingColumnTickets.length === 0 && (
                  <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                    No orders currently preparing
                  </div>
                )}
              </div>
            </div>

            {/* 🟢 COLUMN 3: READY */}
            <div className="flex flex-col rounded-3xl bg-[#ecfdf5] border border-emerald-200/80 overflow-hidden shadow-xs">
              {/* Header */}
              <div className="bg-[#16a34a] px-5 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Bell size={18} />
                  <span>Ready</span>
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black">
                  {readyColumnTickets.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="p-3.5 space-y-3.5 min-h-[60vh]">
                {readyColumnTickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm space-y-3 transition hover:shadow-md"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">Order # {t.orderNo}</h4>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              t.orderType === "Takeaway"
                                ? "bg-sky-500 text-white"
                                : "bg-emerald-500 text-white"
                            }`}
                          >
                            {t.orderType}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-slate-800">
                          {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "07"}`}
                        </span>
                        <div className="mt-0.5">
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[10px] font-black">
                            • On Time
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Checked Items List */}
                    <div className="space-y-1.5 pt-1">
                      {t.items.map((item) => (
                        <div key={item.id} className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0">
                            <Check size={11} strokeWidth={3} />
                          </div>
                          <span>
                            <strong className="text-slate-600 mr-1">{item.qty}x</strong>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Ready Time & Checked Icon */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                      <span>Ready at {t.readyAt || "11:45 AM"}</span>
                      <CheckCircle2 size={18} className="text-emerald-600" />
                    </div>
                  </div>
                ))}

                {readyColumnTickets.length === 0 && (
                  <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                    No orders ready to serve yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ── 5. FACING MODE: KITCHEN FACING DISPLAY ─────────────────────── */}
        {viewMode === "FACING" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Tv className="text-indigo-600" size={24} />
                  KITCHEN FACING DISPLAY
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Live Facing Screen — Track order progress from In Kitchen to Ready to Serve
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-right">
                <span className="font-mono text-2xl font-black text-indigo-600">
                  {nowTime.toLocaleTimeString()}
                </span>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Live Sync Clock
                </span>
              </div>
            </div>

            {/* DUAL COLUMN OVERHEAD DISPLAY (MATCHING LIGHT MODE KANBAN) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[65vh]">
              {/* Left: Preparing Orders */}
              <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-amber-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                      <Flame size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-wider uppercase text-amber-600">
                        PREPARING & COOKING ({preparingColumnTickets.length})
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">Orders currently being cooked by chefs</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-3.5 py-1 text-xs font-black">
                    IN KITCHEN
                  </span>
                </div>

                <div className="space-y-3.5">
                  {preparingColumnTickets.map((t) => {
                    const elapsedMins = getElapsedMins(t.createdAt);
                    const completedItems = t.items.filter((i) => i.completed).length;
                    const progressPct =
                      t.items.length > 0 ? Math.round((completedItems / t.items.length) * 100) : 0;

                    return (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-2xl text-orange-600">
                              Order # {t.orderNo}
                            </span>
                            <span className="rounded-lg bg-white border border-slate-200 text-slate-800 px-3 py-0.5 text-xs font-black">
                              {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "01"}`}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-700 truncate">
                            {t.items.map((i) => `${i.qty}x ${i.name}`).join(" · ")}
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-base font-black px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                            {elapsedMins}m ago
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Ready to Serve Orders */}
              <div className="rounded-3xl border border-emerald-300 bg-white p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-wider uppercase text-emerald-600">
                        READY TO SERVE ({readyColumnTickets.length})
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">Please collect order from serving counter</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-600 text-white px-3.5 py-1 text-xs font-black shadow-md animate-pulse">
                    READY TO SERVE
                  </span>
                </div>

                <div className="space-y-3.5">
                  {readyColumnTickets.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 p-4.5 shadow-md flex items-center justify-between gap-4 animate-in zoom-in-95 duration-200"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-3xl text-emerald-700">
                            Order # {t.orderNo}
                          </span>
                          <span className="rounded-lg bg-emerald-600 text-white px-3 py-1 text-xs font-black shadow-2xs">
                            {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "01"}`}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-emerald-900 truncate">
                          {t.items.map((i) => `${i.qty}x ${i.name}`).join(" · ")}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-md animate-bounce">
                          <BadgeCheck size={18} /> READY TO SERVE
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
