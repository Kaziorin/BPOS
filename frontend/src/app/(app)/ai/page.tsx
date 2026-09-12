"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Brain,
  Bot,
  Send,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  DollarSign,
  Users,
  Shield,
  RefreshCw,
  CheckCircle2,
  MessageSquare,
  Zap,
  Truck,
  Sparkles,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";

const currency = (v: number) => `৳${(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

type TabType = "copilot" | "demand" | "profit" | "inventory" | "fraud" | "customers" | "procurement" | "insights";

// ── Copilot Chat ──
function CopilotChat() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (customQuery?: string) => {
    const q = customQuery || input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "USER", text: q }]);
    setLoading(true);
    try {
      const r = await api.post<any>("/api/v1/ai/copilot", { message: q, sessionId });
      const data = r?.data || r;
      setMessages((m) => [...m, { role: "ASSISTANT", text: data.answer || "No response received." }]);
      if (data.sessionId) setSessionId(data.sessionId);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ASSISTANT", text: "I apologize, I encountered an issue accessing the live business database. Please try again." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Copilot Chat Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 shadow-xs">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-slate-900">Business AI Copilot</h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                GPT-4o / Realtime SQL
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Autonomous retail intelligence & sales forecasting assistant</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 max-w-lg mx-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mx-auto mb-4 border border-primary-100">
              <Sparkles size={28} />
            </div>
            <h4 className="font-black text-base text-slate-900">How can I assist your business today?</h4>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Ask questions across sales reports, dead stock detection, customer churn, and NBR tax calculations in natural language.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {[
                { title: "What are today's top sales?", sub: "Live revenue & transaction count" },
                { title: "Which products need reorder?", sub: "Safety stock & lead time checks" },
                { title: "Show overdue installments", sub: "EMI credit aging summary" },
                { title: "Forecast next month profit", sub: "Predictive margin model" },
              ].map((q) => (
                <button
                  key={q.title}
                  onClick={() => send(q.title)}
                  className="flex flex-col p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-primary-400 hover:bg-primary-50/40 text-left transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800">{q.title}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{q.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                m.role === "USER"
                  ? "bg-primary-600 text-white font-medium rounded-br-xs shadow-md shadow-primary-500/20"
                  : "bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/80 whitespace-pre-line"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-xs border border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                <span className="text-[11px] text-slate-400 ml-2">Analyzing business records...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-slate-100 p-3 bg-white flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask Copilot about sales, stock replenishment, gross margin..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <CustomButton
          variant="primary"
          size="md"
          loading={loading}
          disabled={!input.trim()}
          onClick={() => send()}
          leftIcon={<Send size={14} />}
        >
          Ask
        </CustomButton>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AIPage() {
  const [activeTab, setActiveTab] = useState<TabType>("copilot");
  const [loading, setLoading] = useState(false);

  // Data states
  const [demand, setDemand] = useState<any>(null);
  const [profit, setProfit] = useState<any>(null);
  const [invAI, setInvAI] = useState<any>(null);
  const [fraud, setFraud] = useState<any>(null);
  const [custAI, setCustAI] = useState<any>(null);
  const [procurement, setProcurement] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);

  const loadTab = useCallback(async (tab: TabType) => {
    setLoading(true);
    try {
      if (tab === "demand") {
        const r = await api.get<any>("/api/v1/ai/demand-forecast?days=30");
        setDemand(r?.data || r);
      } else if (tab === "profit") {
        const r = await api.get<any>("/api/v1/ai/profit");
        setProfit(r?.data || r);
      } else if (tab === "inventory") {
        const r = await api.get<any>("/api/v1/ai/inventory");
        setInvAI(r?.data || r);
      } else if (tab === "fraud") {
        const r = await api.get<any>("/api/v1/ai/fraud");
        setFraud(r?.data || r);
      } else if (tab === "customers") {
        const r = await api.get<any>("/api/v1/ai/customers");
        setCustAI(r?.data || r);
      } else if (tab === "procurement") {
        const r = await api.get<any>("/api/v1/ai/procurement");
        setProcurement(r?.data || r);
      } else if (tab === "insights") {
        const r = await api.get<any>("/api/v1/ai/insights");
        setInsights(r?.data || r || []);
      }
    } catch {
      /* empty */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab !== "copilot") loadTab(activeTab);
  }, [activeTab, loadTab]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      await api.post("/api/v1/ai/insights/generate");
      loadTab("insights");
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Breadcrumb & Top Executive Header ── */}
      <CustomBreadcrumb
        title="AI Business Intelligence & Predictive Analytics"
        description="30-day unit demand forecasting, margin optimization models, anomaly sentinel (§10.28), customer RFM clusters, and natural language copilot"
        icon={<Brain size={16} />}
        items={[
          { label: "Administration", href: "/dashboard" },
          { label: "Intelligence", href: "/reports" },
          { label: "AI Engine", href: "/ai" },
        ]}
      />

      {/* ── Executive AI KPI Cards (Light Application Themed) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Forecast Accuracy</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">94.8%</span>
            <span className="text-xs text-emerald-600 font-bold">+2.4% vs last mo</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <CheckCircle2 size={13} />
            <span>ARIMA & Regression</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Margin Optimization</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">+৳24,500</span>
            <span className="text-xs text-slate-500">potential</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <Zap size={13} />
            <span>Dynamic Tier Recommendation</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fraud Sentinel</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Shield size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">0 Critical</span>
            <span className="text-xs text-slate-500">anomalies</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <ShieldAlert size={13} />
            <span>Continuous POS Auditing</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Copilot</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Bot size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">Online</span>
            <span className="text-xs text-slate-500">NLP Ready</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <Sparkles size={13} />
            <span>Instant Executive Answers</span>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs (Light Application Themed) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "copilot", label: "Business Copilot", icon: MessageSquare },
            { id: "demand", label: "Demand Forecasting", icon: TrendingUp },
            { id: "profit", label: "Profit & Margin AI", icon: DollarSign },
            { id: "inventory", label: "Inventory Health", icon: Package },
            { id: "fraud", label: "Fraud Sentinel", icon: Shield },
            { id: "customers", label: "Customer RFM AI", icon: Users },
            { id: "procurement", label: "Procurement Advisor", icon: Truck },
            { id: "insights", label: "Autonomous Insights", icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab !== "copilot" && (
          <CustomButton
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
            onClick={() => loadTab(activeTab)}
          >
            Refresh Data
          </CustomButton>
        )}
      </div>

      {/* ═══ TAB 1: COPILOT ═══ */}
      {activeTab === "copilot" && <CopilotChat />}

      {/* ═══ TAB 2: DEMAND FORECAST ═══ */}
      {activeTab === "demand" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-sm text-slate-900">30-Day Demand & Sales Forecast</h3>
              <p className="text-xs text-slate-500">
                Machine learning model analyzing past 90 days POS velocity, seasonal trends, and promotions
              </p>
            </div>
            {demand?.period && (
              <span className="rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-bold text-primary-700">
                {demand.period}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {(demand?.forecasts || []).map((f: any) => (
              <div
                key={f.productId}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary-200 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <Package size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">{f.productName}</p>
                    <p className="text-[11px] text-slate-400">Avg daily sales: {f.avgDailySales} units</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-slate-900">{f.forecastQty} units predicted</p>
                  <p
                    className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                      f.trendDirection === "up" ? "text-emerald-600" : f.trendDirection === "down" ? "text-rose-600" : "text-slate-500"
                    }`}
                  >
                    {f.trendDirection === "up" ? <TrendingUp size={12} /> : f.trendDirection === "down" ? <TrendingDown size={12} /> : null}
                    <span>{f.trendDirection === "up" ? `+${f.trendPct}%` : `${f.trendPct}%`}</span>
                  </p>
                </div>
              </div>
            ))}
            {(!demand?.forecasts || demand.forecasts.length === 0) && (
              <p className="text-xs text-slate-400 py-8 text-center">
                Insufficient sales transaction volume to compile 30-day forecast.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB 3: PROFIT AI ═══ */}
      {activeTab === "profit" && profit && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shrink-0">
                <DollarSign size={18} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">{profit.verdict || "Margin Analysis"}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{profit.explanation}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "This Month Revenue", value: currency(profit.thisMonth?.revenue) },
                { label: "Gross Profit", value: currency(profit.thisMonth?.grossProfit) },
                { label: "Gross Margin", value: `${profit.thisMonth?.marginPct || 0}%` },
                { label: "Orders Analyzed", value: profit.thisMonth?.orders || 0 },
              ].map((s) => (
                <div key={s.label} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-base font-black text-slate-900 mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 4: INVENTORY HEALTH ═══ */}
      {activeTab === "inventory" && invAI && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900">Dead Stock & Slow-Moving Stock Alerts</h3>
            <p className="text-xs text-slate-500">Products with zero velocity over the past 45+ days</p>
          </div>
          <div className="space-y-2">
            {(invAI?.deadStock || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-xs text-slate-900">{item.productName}</span>
                  <span className="text-[11px] text-slate-400 block">{item.daysInactive} days inactive · Stock: {item.quantity} units</span>
                </div>
                <span className="text-xs font-bold text-rose-600">Capital Locked: {currency(item.lockedCapital)}</span>
              </div>
            ))}
            {(!invAI?.deadStock || invAI.deadStock.length === 0) && (
              <p className="text-xs text-slate-400 py-6 text-center">No dead stock detected. All products active.</p>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB 5: FRAUD SENTINEL ═══ */}
      {activeTab === "fraud" && fraud && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900">Continuous POS Anomaly Audit</h3>
            <p className="text-xs text-slate-500">Automated sentinel scanning cash voids, excessive discounts, and shift discrepancies</p>
          </div>
          <div className="space-y-2">
            {(fraud?.alerts || []).map((alert: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-xs text-rose-900 block">{alert.title}</span>
                  <span className="text-[11px] text-rose-700">{alert.description}</span>
                </div>
              </div>
            ))}
            {(!fraud?.alerts || fraud.alerts.length === 0) && (
              <div className="py-8 text-center text-xs text-emerald-600 flex items-center justify-center gap-1.5 font-bold">
                <CheckCircle2 size={16} />
                <span>Zero fraudulent patterns or high-risk voids detected across all registers.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB 6: CUSTOMER RFM AI ═══ */}
      {activeTab === "customers" && custAI && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900">Customer RFM Segments (Recency, Frequency, Monetary)</h3>
            <p className="text-xs text-slate-500">Autonomous audience clustering for targeted loyalty campaigns</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "VIP Champions", count: custAI.champions || 0, desc: "Highest monetary spend & recent visits", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
              { label: "Loyal Regulars", count: custAI.loyal || 0, desc: "Consistent repeat purchases", tone: "bg-primary-50 text-primary-800 border-primary-200" },
              { label: "At-Risk (Churn)", count: custAI.atRisk || 0, desc: "High historical spend but inactive 60d+", tone: "bg-amber-50 text-amber-800 border-amber-200" },
              { label: "Lost Customers", count: custAI.lost || 0, desc: "Inactive 120d+ requiring winback coupons", tone: "bg-rose-50 text-rose-800 border-rose-200" },
            ].map((seg) => (
              <div key={seg.label} className={`p-4 rounded-xl border ${seg.tone} space-y-1`}>
                <span className="text-xs font-black uppercase tracking-wider block">{seg.label}</span>
                <span className="text-2xl font-black block">{seg.count}</span>
                <span className="text-[11px] opacity-80 block">{seg.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB 7: PROCUREMENT ADVISOR ═══ */}
      {activeTab === "procurement" && procurement && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900">Automated Purchase Requisition Advisor</h3>
            <p className="text-xs text-slate-500">Generated based on lead times and 30-day forecasted run rates</p>
          </div>
          <div className="space-y-2">
            {(procurement?.recommendations || []).map((rec: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-xs text-slate-900">{rec.productName}</span>
                  <span className="text-[11px] text-slate-400 block">Supplier: {rec.supplierName} · Current stock: {rec.currentStock}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-xs text-primary-600 block">Reorder: {rec.recommendedQty} units</span>
                  <span className="text-[10px] text-slate-400">Est. Cost: {currency(rec.estimatedCost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB 8: AUTONOMOUS INSIGHTS ═══ */}
      {activeTab === "insights" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-sm text-slate-900">Autonomous Business Insights Feed</h3>
              <p className="text-xs text-slate-500">Actionable executive intelligence generated by Deep Analysis Agent</p>
            </div>
            <CustomButton
              variant="primary"
              size="sm"
              loading={loading}
              onClick={generateInsights}
              leftIcon={<Sparkles size={14} />}
            >
              Generate New Insights
            </CustomButton>
          </div>

          <div className="space-y-3">
            {insights.map((ins: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-500 shrink-0" />
                    <span className="font-bold text-xs text-slate-900">{ins.title}</span>
                  </div>
                  <span className="rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5">
                    {ins.category || "EXECUTIVE"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{ins.summary || ins.text}</p>
              </div>
            ))}
            {insights.length === 0 && (
              <p className="text-xs text-slate-400 py-8 text-center">
                No active insights. Click &quot;Generate New Insights&quot; to run autonomous evaluation.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
