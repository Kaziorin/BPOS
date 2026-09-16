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
export type KDSColumnStatus = "QUEUED" | "PREPARING" | "READY" | "SERVED";

export interface KOTItem {
  id: string;
  name: string;
  qty: number;
  notes?: string;
  modifiers?: any[];
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
  notes?: string;
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
          status: t.status === "SERVED" ? "SERVED" : t.status === "READY" || t.status === "READY_TO_SERVE" ? "READY" : t.status === "PREPARING" || t.status === "COOKING" || t.status === "PLATING" || t.status === "ACCEPTED" ? "PREPARING" : "QUEUED",
          chefRole: t.chefRole || "Head chef",
          customerName: t.customerName,
          notes: t.notes || "",
          createdAt: t.createdAt || new Date().toISOString(),
          readyAt: t.readyAt,
          items: Array.isArray(t.items)
            ? t.items.map((i: any) => {
                let parsedModifiers: any[] = [];
                if (typeof i.modifiersJson === "string") {
                  try { parsedModifiers = JSON.parse(i.modifiersJson); } catch {}
                } else if (Array.isArray(i.modifiersJson)) {
                  parsedModifiers = i.modifiersJson;
                } else if (Array.isArray(i.modifiers)) {
                  parsedModifiers = i.modifiers;
                } else if (Array.isArray(i.addons)) {
                  parsedModifiers = i.addons;
                }
                return {
                  id: i.id || crypto.randomUUID(),
                  name: i.name,
                  qty: i.qty || 1,
                  notes: i.notes || "",
                  modifiers: parsedModifiers,
                  completed: i.completed ?? (t.status === "READY" || t.status === "READY_TO_SERVE" || t.status === "SERVED"),
                };
              })
            : [],
        }));
        mapped.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
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
  const moveTicketStatus = async (ticketId: string, nextStatus: KDSColumnStatus) => {
    const isReadyOrServed = nextStatus === "READY" || nextStatus === "SERVED";
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: nextStatus,
          readyAt: isReadyOrServed ? (t.readyAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : t.readyAt,
          items: t.items.map((i) => ({ ...i, completed: isReadyOrServed ? true : i.completed })),
        };
      }
      return t;
    });

    setTickets(updated);
    broadcastSync(updated);
    playChime();

    try {
      const backendSt = nextStatus === "SERVED" ? "SERVED" : nextStatus === "READY" ? "READY" : nextStatus === "PREPARING" ? "PREPARING" : "ACCEPTED";
      await api.patch(`/v1/restaurant/kot/${ticketId}/status`, { status: backendSt });
    } catch (err) {
      console.error("KDS status update error:", err);
    }
  };

  // Toggle Item Checklist Box
  const toggleItemCompleted = async (ticketId: string, itemId: string) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

    const nextItems = targetTicket.items.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i));
    const allDone = nextItems.length > 0 && nextItems.every((i) => i.completed);
    const nextStatus: KDSColumnStatus = allDone ? "READY" : targetTicket.status === "QUEUED" ? "PREPARING" : targetTicket.status;

    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: nextStatus,
          readyAt: allDone ? (t.readyAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : t.readyAt,
          items: nextItems,
        };
      }
      return t;
    });

    setTickets(updated);
    broadcastSync(updated);

    if (nextStatus !== targetTicket.status) {
      try {
        const backendSt = nextStatus === "SERVED" ? "SERVED" : nextStatus === "READY" ? "READY" : nextStatus === "PREPARING" ? "PREPARING" : "ACCEPTED";
        await api.patch(`/v1/restaurant/kot/${ticketId}/status`, { status: backendSt });
      } catch (err) {
        console.error("KDS item toggle status error:", err);
      }
    }
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
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (containerRef.current?.requestFullscreen) {
        containerRef.current?.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  // Keyboard shortcut (Press 'F' for Fullscreen toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      (activeFilterPill === "READY" && t.status === "READY") ||
      (activeFilterPill === "SERVED" && t.status === "SERVED");
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
  const servedColumnTickets = filteredTickets.filter((t) => t.status === "SERVED");

  // KPI Metrics
  const newOrdersCount = tickets.filter((t) => t.status === "QUEUED").length;
  const preparingCount = tickets.filter((t) => t.status === "PREPARING").length;
  const readyCount = tickets.filter((t) => t.status === "READY").length;
  const servedCount = tickets.filter((t) => t.status === "SERVED").length;
  const completedCount = readyCount + servedCount;
  const cancelledCount = tickets.filter((t) => (t as any).status === "CANCELLED").length;

  return (
    <div
      ref={containerRef}
      className={`w-full bg-[#f4f5f8] text-slate-800 font-sans select-none pb-12 overflow-y-auto ${
        isFullscreen ? "h-screen max-h-screen overflow-y-auto" : "min-h-screen"
      }`}
    >
      {/* ── 1. TOP NAVBAR (MATCHING SCREENSHOT HEADER) ────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
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
                className="w-full rounded-sm border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
          </div>

          {/* Right User & Control Widgets */}
          <div className="flex items-center gap-3">
            {/* View Mode Switcher: Operator vs Facing TV */}
            <div className="flex items-center rounded-sm border border-slate-200 bg-slate-100 p-1 shadow-inner">
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
              title={isFullscreen ? "Exit Fullscreen (F)" : "Toggle Fullscreen (F)"}
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
              
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-sm">
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
          <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between transition hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-slate-500">New Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{newOrdersCount.toString().padStart(2, "0")}</h3>
            </div>
            <div className="rounded-sm bg-orange-50 p-3 text-orange-500 border border-orange-100">
              <FileText size={22} />
            </div>
          </div>

          {/* Card 2: Preparing */}
          <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between transition hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-slate-500">Preparing</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{preparingCount.toString().padStart(2, "0")}</h3>
            </div>
            <div className="rounded-sm bg-amber-50 p-3 text-amber-500 border border-amber-100">
              <Flame size={22} />
            </div>
          </div>

          {/* Card 3: Completed Orders */}
          <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between transition hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-slate-500">Completed Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{completedCount.toString().padStart(2, "0")}</h3>
            </div>
            <div className="rounded-sm bg-emerald-50 p-3 text-emerald-500 border border-emerald-100">
              <CheckCircle2 size={22} />
            </div>
          </div>

          {/* Card 4: Cancelled Orders */}
          <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between transition hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-slate-500">Cancelled Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{cancelledCount.toString().padStart(2, "0")}</h3>
            </div>
            <div className="rounded-sm bg-rose-50 p-3 text-rose-500 border border-rose-100">
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

            <button
              onClick={() => setActiveFilterPill("SERVED")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition border ${
                activeFilterPill === "SERVED"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <BadgeCheck size={14} className="text-blue-600" />
              <span>Served ({servedColumnTickets.length})</span>
            </button>
          </div>
        </div>

            {/* ── 4. OPERATOR VIEW: 4-COLUMN KANBAN BOARD ─────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            
            {/* 🟣 COLUMN 1: QUEUED */}
            <div className="flex flex-col rounded-sm bg-[#efedf8] border border-purple-200/80 overflow-hidden shadow-xs">
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
              <div className="p-3.5 space-y-3.5 min-h-[60vh] max-h-[calc(100vh-250px)] overflow-y-auto">
                {queuedColumnTickets.map((t) => {
                  const elapsedMins = getElapsedMins(t.createdAt);
                  return (
                    <div
                      key={t.id}
                      className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm space-y-3.5 transition hover:shadow-md"
                    >
                      {/* Ticket Title & Badge */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-mono font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[130px]" title={`Order # ${t.orderNo}`}>
                              Order # {t.orderNo}
                            </h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                                t.orderType === "Takeaway"
                                  ? "bg-orange-500 text-white"
                                  : "bg-emerald-500 text-white"
                              }`}
                            >
                              {t.orderType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Time: {t.timePlaced}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                            {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "01"}`}
                          </span>
                          <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 font-semibold mt-0.5">
                            <Clock size={11} />
                            <span>{elapsedMins}m</span>
                          </div>
                        </div>
                      </div>

                      {/* Staff Role Selector Dropdown */}
                      <div className="relative">
                        <select
                          value={t.chefRole || "Sous chef"}
                          onChange={(e) => changeChefRole(t.id, e.target.value)}
                          className="w-full rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                        >
                          {CHEF_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Order Level Note */}
                      {t.notes && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                          <FileText size={13} className="text-amber-600 shrink-0" />
                          <span className="truncate">Note: {t.notes}</span>
                        </div>
                      )}

                      {/* Items List */}
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        {t.items.map((item) => (
                          <div key={item.id} className="space-y-1">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="text-orange-600 font-black">{item.qty}x</span>
                              <span>{item.name}</span>
                            </div>

                            {/* Addons / Modifiers */}
                            {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 pl-5">
                                {item.modifiers.map((mod: any, idx: number) => {
                                  const label = typeof mod === "string" ? mod : mod.name || mod.label || mod.title;
                                  const val = typeof mod === "object" && mod.value ? `: ${mod.value}` : "";
                                  return label ? (
                                    <span key={idx} className="rounded-md bg-orange-100/90 border border-orange-200 text-orange-900 px-1.5 py-0.5 text-[10px] font-bold">
                                      +{label}{val}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}

                            {/* Item Special Note */}
                            {item.notes && (
                              <div className="text-[10px] font-semibold text-rose-600 italic pl-5">
                                * {item.notes}
                              </div>
                            )}
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
            <div className="flex flex-col rounded-sm bg-[#fff5ea] border border-orange-200/80 overflow-hidden shadow-xs">
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
              <div className="p-3.5 space-y-3.5 min-h-[60vh] max-h-[calc(100vh-250px)] overflow-y-auto">
                {preparingColumnTickets.map((t) => {
                  const elapsedMins = getElapsedMins(t.createdAt);
                  const completedItems = t.items.filter((i) => i.completed).length;
                  const progressPct =
                    t.items.length > 0 ? Math.round((completedItems / t.items.length) * 100) : 0;

                  return (
                    <div
                      key={t.id}
                      className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm space-y-3.5 transition hover:shadow-md"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-mono font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[130px]" title={`Order # ${t.orderNo}`}>
                              Order # {t.orderNo}
                            </h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                                t.orderType === "Takeaway"
                                  ? "bg-orange-500 text-white"
                                  : "bg-emerald-500 text-white"
                              }`}
                            >
                              {t.orderType}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                            {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "12"}`}
                          </span>
                          <div className="flex items-center justify-end gap-1 text-[11px] text-orange-600 font-bold mt-0.5 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
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
                          className="w-full rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                        >
                          {CHEF_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Order Level Note */}
                      {t.notes && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                          <FileText size={13} className="text-amber-600 shrink-0" />
                          <span className="truncate">Note: {t.notes}</span>
                        </div>
                      )}

                      {/* Items Checklist */}
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        {t.items.map((item) => (
                          <div key={item.id} className="space-y-1">
                            <div
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

                            {/* Addons / Modifiers */}
                            {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 pl-7">
                                {item.modifiers.map((mod: any, idx: number) => {
                                  const label = typeof mod === "string" ? mod : mod.name || mod.label || mod.title;
                                  const val = typeof mod === "object" && mod.value ? `: ${mod.value}` : "";
                                  return label ? (
                                    <span key={idx} className="rounded-md bg-orange-100/90 border border-orange-200 text-orange-900 px-1.5 py-0.5 text-[10px] font-bold">
                                      +{label}{val}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}

                            {/* Item Special Note */}
                            {item.notes && (
                              <div className="text-[10px] font-semibold text-rose-600 italic pl-7">
                                * {item.notes}
                              </div>
                            )}
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
            <div className="flex flex-col rounded-sm bg-[#ecfdf5] border border-emerald-200/80 overflow-hidden shadow-xs">
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
              <div className="p-3.5 space-y-3.5 min-h-[60vh] max-h-[calc(100vh-250px)] overflow-y-auto">
                {readyColumnTickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-sm border border-emerald-200 bg-white p-4 shadow-sm space-y-3 transition hover:shadow-md"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-mono font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[130px]" title={`Order # ${t.orderNo}`}>
                            Order # {t.orderNo}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                              t.orderType === "Takeaway"
                                ? "bg-orange-500 text-white"
                                : "bg-emerald-500 text-white"
                            }`}
                          >
                            {t.orderType}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                          {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "07"}`}
                        </span>
                        <div className="mt-0.5">
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                            • On Time
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Level Note */}
                    {t.notes && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                        <FileText size={13} className="text-emerald-600 shrink-0" />
                        <span className="truncate">Note: {t.notes}</span>
                      </div>
                    )}

                    {/* Checked Items List */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      {t.items.map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check size={11} strokeWidth={3} />
                            </div>
                            <span>
                              <strong className="text-slate-600 mr-1">{item.qty}x</strong>
                              {item.name}
                            </span>
                          </div>

                          {/* Addons / Modifiers */}
                          {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-6">
                              {item.modifiers.map((mod: any, idx: number) => {
                                const label = typeof mod === "string" ? mod : mod.name || mod.label || mod.title;
                                const val = typeof mod === "object" && mod.value ? `: ${mod.value}` : "";
                                return label ? (
                                  <span key={idx} className="rounded-md bg-emerald-100/90 border border-emerald-200 text-emerald-900 px-1.5 py-0.5 text-[10px] font-bold">
                                    +{label}{val}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}

                          {/* Item Special Note */}
                          {item.notes && (
                            <div className="text-[10px] font-semibold text-rose-600 italic pl-6">
                              * {item.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Footer Ready Time & Checked Icon */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                      <span>Ready at {t.readyAt || "11:45 AM"}</span>
                      <CheckCircle2 size={18} className="text-emerald-600" />
                    </div>

                    {/* Action Button: Serve Order */}
                    <button
                      onClick={() => moveTicketStatus(t.id, "SERVED")}
                      className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-black tracking-wide shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCheck size={15} /> Serve Order
                    </button>
                  </div>
                ))}

                {readyColumnTickets.length === 0 && (
                  <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                    No orders ready to serve yet
                  </div>
                )}
              </div>
            </div>

            {/* 🔵 COLUMN 4: SERVED */}
            <div className="flex flex-col rounded-sm bg-[#edf4ff] border border-blue-200/80 overflow-hidden shadow-xs">
              {/* Header */}
              <div className="bg-[#1d4ed8] px-5 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <BadgeCheck size={18} />
                  <span>Served</span>
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black">
                  {servedColumnTickets.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="p-3.5 space-y-3.5 min-h-[60vh] max-h-[calc(100vh-250px)] overflow-y-auto">
                {servedColumnTickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-sm border border-blue-200 bg-white p-4 shadow-sm space-y-3 transition hover:shadow-md"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-mono font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[130px]" title={`Order # ${t.orderNo}`}>
                            Order # {t.orderNo}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                              t.orderType === "Takeaway"
                                ? "bg-orange-500 text-white"
                                : "bg-emerald-500 text-white"
                            }`}
                          >
                            {t.orderType}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                          {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "N/A"}`}
                        </span>
                        <div className="mt-0.5">
                          <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                            ✓ Served
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Level Note */}
                    {t.notes && (
                      <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                        <FileText size={13} className="text-blue-600 shrink-0" />
                        <span className="truncate">Note: {t.notes}</span>
                      </div>
                    )}

                    {/* Checked Items List */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      {t.items.map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Check size={11} strokeWidth={3} />
                            </div>
                            <span className="line-through text-slate-400">
                              <strong className="text-slate-500 mr-1">{item.qty}x</strong>
                              {item.name}
                            </span>
                          </div>

                          {/* Addons / Modifiers */}
                          {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-6">
                              {item.modifiers.map((mod: any, idx: number) => {
                                const label = typeof mod === "string" ? mod : mod.name || mod.label || mod.title;
                                const val = typeof mod === "object" && mod.value ? `: ${mod.value}` : "";
                                return label ? (
                                  <span key={idx} className="rounded-md bg-blue-100/90 border border-blue-200 text-blue-900 px-1.5 py-0.5 text-[10px] font-bold">
                                    +{label}{val}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}

                          {/* Item Special Note */}
                          {item.notes && (
                            <div className="text-[10px] font-semibold text-rose-600 italic pl-6">
                              * {item.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Footer Served Indicator */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-bold">
                      <span>Served at {t.readyAt || "Just now"}</span>
                      <BadgeCheck size={18} className="text-blue-600" />
                    </div>
                  </div>
                ))}

                {servedColumnTickets.length === 0 && (
                  <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                    No served orders yet
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
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Tv className="text-indigo-600" size={24} />
                  KITCHEN FACING DISPLAY
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Live Facing Screen — Track order progress from In Kitchen to Ready to Serve
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-sm text-right">
                <span className="font-mono text-2xl font-black text-indigo-600">
                  {nowTime.toLocaleTimeString()}
                </span>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Live Sync Clock
                </span>
              </div>
            </div>

            {/* 3-COLUMN OVERHEAD FACING DISPLAY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[65vh]">
              {/* Left: Preparing Orders */}
              <div className="rounded-sm border border-amber-200 bg-white p-5 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-amber-100 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                      <Flame size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-wider uppercase text-amber-600">
                        PREPARING & COOKING ({preparingColumnTickets.length})
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">In Kitchen Cooking</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-3 py-0.5 text-xs font-bold shrink-0">
                    IN KITCHEN
                  </span>
                </div>

                <div className="space-y-3">
                  {preparingColumnTickets.map((t) => {
                    const elapsedMins = getElapsedMins(t.createdAt);
                    const completedItems = t.items.filter((i) => i.completed).length;
                    const progressPct =
                      t.items.length > 0 ? Math.round((completedItems / t.items.length) * 100) : 0;

                    return (
                      <div
                        key={t.id}
                        className="rounded-sm border border-amber-200/80 bg-amber-50/50 p-4 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-mono font-black text-base sm:text-lg text-amber-900 truncate max-w-[70%]" title={`Order # ${t.orderNo}`}>
                            Order # {t.orderNo}
                          </h4>
                          <span className="rounded-lg bg-amber-600 text-white px-2.5 py-0.5 text-xs font-bold shrink-0">
                            {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "N/A"}`}
                          </span>
                        </div>

                        {/* Order Level Note */}
                        {t.notes && (
                          <div className="bg-amber-100/90 border border-amber-300 text-amber-950 rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1.5">
                            <FileText size={13} className="text-amber-700 shrink-0" />
                            <span className="truncate">Note: {t.notes}</span>
                          </div>
                        )}

                        <div className="text-xs font-semibold text-slate-800 bg-white/80 p-2.5 rounded-xl border border-amber-100 space-y-1">
                          {t.items.map((i) => (
                            <div key={i.id} className="space-y-0.5">
                              <div><strong className="text-orange-600 mr-1">{i.qty}x</strong>{i.name}</div>
                              {Array.isArray(i.modifiers) && i.modifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {i.modifiers.map((mod: any, idx: number) => {
                                    const label = typeof mod === "string" ? mod : mod.name || mod.label || mod.title;
                                    const val = typeof mod === "object" && mod.value ? `: ${mod.value}` : "";
                                    return label ? (
                                      <span key={idx} className="rounded bg-orange-100 text-orange-800 border border-orange-200 px-1 py-0.2 text-[9px] font-bold">
                                        +{label}{val}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="h-2 flex-1 bg-amber-200 rounded-full overflow-hidden mr-3">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-amber-800 shrink-0">{elapsedMins}m ago</span>
                        </div>
                      </div>
                    );
                  })}
                  {preparingColumnTickets.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                      No orders preparing
                    </div>
                  )}
                </div>
              </div>

              {/* Middle: Ready to Serve Orders */}
              <div className="rounded-sm border border-emerald-300 bg-white p-5 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-emerald-100 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-wider uppercase text-emerald-600">
                        READY TO SERVE ({readyColumnTickets.length})
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">Ready at Serving Counter</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-600 text-white px-3 py-0.5 text-xs font-bold shadow-xs animate-pulse shrink-0">
                    READY
                  </span>
                </div>

                <div className="space-y-3">
                  {readyColumnTickets.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-sm border-2 border-emerald-500 bg-emerald-50/80 p-4 shadow-md space-y-2.5 animate-in zoom-in-95 duration-200"
                    >
                      {/* Top Row: Order No & Table Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-mono font-black text-base sm:text-lg text-emerald-900 truncate max-w-[70%]" title={`Order # ${t.orderNo}`}>
                          Order # {t.orderNo}
                        </h4>
                        <span className="rounded-lg bg-emerald-700 text-white px-2.5 py-0.5 text-xs font-bold shrink-0">
                          {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "N/A"}`}
                        </span>
                      </div>

                      {/* Order Level Note */}
                      {t.notes && (
                        <div className="bg-emerald-100/90 border border-emerald-300 text-emerald-950 rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1.5">
                          <FileText size={13} className="text-emerald-700 shrink-0" />
                          <span className="truncate">Note: {t.notes}</span>
                        </div>
                      )}

                      {/* Middle: Items List */}
                      <div className="text-xs font-bold text-emerald-950 bg-white/80 p-2.5 rounded-xl border border-emerald-200/80 space-y-1">
                        {t.items.map((i) => (
                          <div key={i.id} className="space-y-0.5">
                            <div><strong className="text-emerald-700 mr-1">{i.qty}x</strong>{i.name}</div>
                            {Array.isArray(i.modifiers) && i.modifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {i.modifiers.map((mod: any, idx: number) => {
                                  const label = typeof mod === "string" ? mod : mod.name || mod.label || mod.title;
                                  const val = typeof mod === "object" && mod.value ? `: ${mod.value}` : "";
                                  return label ? (
                                    <span key={idx} className="rounded bg-emerald-100 text-emerald-900 border border-emerald-200 px-1 py-0.2 text-[9px] font-bold">
                                      +{label}{val}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Bottom: Ready Badge */}
                      <div className="flex items-center justify-between pt-1 text-xs text-emerald-800 font-bold border-t border-emerald-200/60 mt-1">
                        <span className="text-[11px] font-medium text-emerald-700">Collect at Counter</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-[11px] uppercase tracking-wider shadow-xs">
                          <BadgeCheck size={14} /> READY
                        </span>
                      </div>
                    </div>
                  ))}
                  {readyColumnTickets.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                      No orders ready to serve
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Served Orders */}
              <div className="rounded-sm border border-blue-300 bg-white p-5 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-blue-100 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <BadgeCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-wider uppercase text-blue-600">
                        SERVED ORDERS ({servedColumnTickets.length})
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">Delivered to Tables</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-600 text-white px-3 py-0.5 text-xs font-bold shrink-0">
                    SERVED
                  </span>
                </div>

                <div className="space-y-3">
                  {servedColumnTickets.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-sm border border-blue-200 bg-blue-50/50 p-4 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-mono font-black text-base sm:text-lg text-blue-900 truncate max-w-[70%]" title={`Order # ${t.orderNo}`}>
                          Order # {t.orderNo}
                        </h4>
                        <span className="rounded-lg bg-blue-600 text-white px-2.5 py-0.5 text-xs font-bold shrink-0">
                          {t.tokenNo ? `Token #${t.tokenNo}` : `Table ${t.tableNo || "N/A"}`}
                        </span>
                      </div>

                      {/* Order Level Note */}
                      {t.notes && (
                        <div className="bg-blue-100/90 border border-blue-300 text-blue-950 rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1.5">
                          <FileText size={13} className="text-blue-700 shrink-0" />
                          <span className="truncate">Note: {t.notes}</span>
                        </div>
                      )}

                      <div className="text-xs font-semibold text-slate-700 bg-white/80 p-2.5 rounded-xl border border-blue-100 space-y-1">
                        {t.items.map((i) => (
                          <div key={i.id} className="space-y-0.5">
                            <div><strong className="text-blue-700 mr-1">{i.qty}x</strong>{i.name}</div>
                            {Array.isArray(i.modifiers) && i.modifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {i.modifiers.map((mod: any, idx: number) => {
                                  const label = typeof mod === "string" ? mod : mod.name || mod.label || mod.title;
                                  const val = typeof mod === "object" && mod.value ? `: ${mod.value}` : "";
                                  return label ? (
                                    <span key={idx} className="rounded bg-blue-100 text-blue-900 border border-blue-200 px-1 py-0.2 text-[9px] font-bold">
                                      +{label}{val}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs text-blue-700 font-bold border-t border-blue-100">
                        <span className="text-[11px] font-medium text-blue-600">Delivered</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                          <BadgeCheck size={14} /> SERVED
                        </span>
                      </div>
                    </div>
                  ))}
                  {servedColumnTickets.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                      No served orders yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
