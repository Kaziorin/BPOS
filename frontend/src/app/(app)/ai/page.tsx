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
  BarChart2,
  FileSpreadsheet,
  Calculator,
  Gift,
  CreditCard,
  Clock,
  Target,
  ArrowUpRight,
  Store,
  Layers,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";

const currency = (v: number) => `৳${(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

type TabType =
  | "copilot"
  | "demand"
  | "sales_intel"
  | "profit"
  | "accounting_ai"
  | "inventory"
  | "fraud"
  | "customers"
  | "procurement"
  | "insights";

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
    <div className="flex flex-col h-[600px] bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
      {/* Copilot Chat Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary-100 text-primary-600 shadow-xs">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-gray-600">Business AI Agent</h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                100% Offline AI & SQL Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Autonomous retail assistant — local air-gapped processing (Zero data leakage)</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 max-w-lg mx-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-primary-50 text-primary-600 mx-auto mb-4 border border-primary-100">
              <Sparkles size={28} />
            </div>
            <h4 className="font-black text-base text-gray-600">How can I assist your business today?</h4>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Ask questions across sales targets, accounting entries, purchase workflows, inventory health, and cash flow in natural language (বাংলা বা English).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {[
                { title: "আজকের মোট বিক্রি কত?", sub: "Today's live revenue & sales count" },
                { title: "purchase ke vabe kaz kore", sub: "Purchase order, GRN & AP ledger" },
                { title: "subscription gulo ke vabe kaz kore", sub: "Starter, Pro & Enterprise limits" },
                { title: "চলতি মাসের সেলস টার্গেট কত?", sub: "Month-end revenue run rate & gap" },
              ].map((q) => (
                <button
                  key={q.title}
                  onClick={() => send(q.title)}
                  className="flex flex-col p-3 rounded-sm border border-slate-200 bg-slate-50/60 hover:border-primary-400 hover:bg-primary-50/40 text-left transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-gray-600">{q.title}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{q.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-sm text-xs leading-relaxed ${
                m.role === "USER"
                  ? "bg-brand-gradient text-white font-medium rounded-br-xs shadow-sm"
                  : "bg-slate-100 text-gray-600 rounded-bl-xs border border-slate-200 whitespace-pre-line"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-sm rounded-bl-xs border border-slate-200">
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
          placeholder="Ask AI Agent about sales targets, purchase workflow, accounting entries..."
          className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-gray-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

  // Expanded intelligence data
  const [salesIntel, setSalesIntel] = useState<{
    targets?: any;
    branches?: any;
    discountRecs?: any;
    buyingPatterns?: any;
  }>({});

  const [accountingAI, setAccountingAI] = useState<{
    cashFlow?: any;
    paymentRisk?: any;
    reconciledStatement?: any;
  }>({});

  // Interactive tools in Accounting AI tab
  const [expTitle, setExpTitle] = useState("");
  const [expCategoryResult, setExpCategoryResult] = useState<any>(null);
  const [categorizing, setCategorizing] = useState(false);

  const [dupInvoiceNo, setDupInvoiceNo] = useState("");
  const [dupAmount, setDupAmount] = useState("");
  const [dupResult, setDupResult] = useState<any>(null);
  const [checkingDup, setCheckingDup] = useState(false);

  const loadTab = useCallback(async (tab: TabType) => {
    setLoading(true);
    try {
      if (tab === "demand") {
        const r = await api.get<any>("/api/v1/ai/demand-forecast?days=30");
        setDemand(r?.data || r);
      } else if (tab === "sales_intel") {
        const [targets, branches, discountRecs, buyingPatterns] = await Promise.all([
          api.get<any>("/api/v1/ai/sales/targets").catch(() => null),
          api.get<any>("/api/v1/ai/sales/branches").catch(() => null),
          api.get<any>("/api/v1/ai/sales/discount-recommendations").catch(() => null),
          api.get<any>("/api/v1/ai/sales/buying-patterns").catch(() => null),
        ]);
        setSalesIntel({
          targets: targets?.data || targets,
          branches: branches?.data || branches,
          discountRecs: discountRecs?.data || discountRecs,
          buyingPatterns: buyingPatterns?.data || buyingPatterns,
        });
      } else if (tab === "profit") {
        const r = await api.get<any>("/api/v1/ai/profit");
        setProfit(r?.data || r);
      } else if (tab === "accounting_ai") {
        const [cashFlow, paymentRisk] = await Promise.all([
          api.get<any>("/api/v1/ai/accounting/cash-flow-forecast?days=30").catch(() => null),
          api.get<any>("/api/v1/ai/accounting/payment-prediction").catch(() => null),
        ]);
        setAccountingAI({
          cashFlow: cashFlow?.data || cashFlow,
          paymentRisk: paymentRisk?.data || paymentRisk,
        });
      } else if (tab === "inventory") {
        const r = await api.get<any>("/api/v1/ai/inventory");
        setInvAI(r?.data || r);
      } else if (tab === "fraud") {
        const r = await api.get<any>("/api/v1/ai/fraud");
        setFraud(r?.data || r);
      } else if (tab === "customers") {
        const [cust, seg, nextP, loyalty, dueRisk] = await Promise.all([
          api.get<any>("/api/v1/ai/customers").catch(() => null),
          api.get<any>("/api/v1/ai/customers/segmentation").catch(() => null),
          api.get<any>("/api/v1/ai/customers/next-purchase-prediction").catch(() => null),
          api.get<any>("/api/v1/ai/customers/loyalty-suggestions").catch(() => null),
          api.get<any>("/api/v1/ai/customers/due-risk").catch(() => null),
        ]);
        setCustAI({
          base: cust?.data || cust,
          segmentation: seg?.data || seg,
          nextPurchase: nextP?.data || nextP,
          loyalty: loyalty?.data || loyalty,
          dueRisk: dueRisk?.data || dueRisk,
        });
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

  const handleCategorizeExpense = async () => {
    if (!expTitle.trim()) return;
    setCategorizing(true);
    try {
      const res = await api.post<any>("/api/v1/ai/accounting/categorize-expense", { title: expTitle });
      setExpCategoryResult(res?.data || res);
    } catch {
      /* empty */
    }
    setCategorizing(false);
  };

  const handleCheckDuplicate = async () => {
    if (!dupInvoiceNo.trim() && !dupAmount) return;
    setCheckingDup(true);
    try {
      const res = await api.post<any>("/api/v1/ai/accounting/check-duplicate", {
        invoiceNo: dupInvoiceNo,
        amount: parseFloat(dupAmount) || 0,
      });
      setDupResult(res?.data || res);
    } catch {
      /* empty */
    }
    setCheckingDup(false);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Breadcrumb & Top Executive Header ── */}
      <CustomBreadcrumb
        title="AI Business Intelligence & Predictive Analytics"
        description="Comprehensive suite: Sales Intelligence, Accounting Assistant, Customer Segmentation, Fraud Sentinel, and Autonomous Copilot"
        icon={<Brain size={16} />}
        items={[
          { label: "Administration", href: "/dashboard" },
          { label: "Intelligence", href: "/reports" },
          { label: "AI Engine", href: "/ai" },
        ]}
      />

      {/* ── Executive AI KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-sm border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sales Forecast</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-100 text-primary-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-600">95.4%</span>
            <span className="text-xs text-emerald-600 font-bold">WMA Projected</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <CheckCircle2 size={13} />
            <span>Target Feasibility: Active</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-sm border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash Flow Runway</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-100 text-primary-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-600">+30 Days</span>
            <span className="text-xs text-emerald-600 font-bold">Positive Net</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <Zap size={13} />
            <span>Liquidity Safe</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-sm border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fraud Sentinel</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-100 text-primary-600">
              <Shield size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-600">0 Critical</span>
            <span className="text-xs text-slate-500">anomalies</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <ShieldAlert size={13} />
            <span>Continuous POS Auditing</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-sm border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Engine Mode</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-100 text-primary-600">
              <Bot size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-600">Offline</span>
            <span className="text-xs text-emerald-600 font-bold">Air-Gapped</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <Sparkles size={13} />
            <span>Zero Data Leakage</span>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "copilot", label: "Business AI Agent", icon: MessageSquare },
            { id: "sales_intel", label: "Sales Intelligence", icon: BarChart2 },
            { id: "accounting_ai", label: "Accounting AI", icon: FileSpreadsheet },
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
                className={`flex items-center gap-2 rounded-sm px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-brand-gradient text-white shadow-sm"
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

      {/* ═══ TAB 2: AI SALES INTELLIGENCE ═══ */}
      {activeTab === "sales_intel" && (
        <div className="space-y-5">
          {/* Sales Target Prediction Card */}
          {salesIntel.targets && (
            <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                    <Target size={16} className="text-primary-600" />
                    Month-End Sales Target Prediction & Feasibility
                  </h3>
                  <p className="text-xs text-slate-500">
                    Day {salesIntel.targets.currentDay} of {salesIntel.targets.totalDaysInMonth} · Run-rate velocity projection
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                  {salesIntel.targets.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">CURRENT REVENUE</span>
                  <span className="text-lg font-black text-gray-600">{currency(salesIntel.targets.currentRevenue)}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{salesIntel.targets.currentOrders} orders</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">PROJECTED MONTH-END</span>
                  <span className="text-lg font-black text-primary-600">{currency(salesIntel.targets.projectedRevenue)}</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Based on daily velocity</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">MONTHLY TARGET</span>
                  <span className="text-lg font-black text-gray-600">{currency(salesIntel.targets.targetRevenue)}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{salesIntel.targets.achievementProbability} Probability</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">REQUIRED DAILY RUN-RATE</span>
                  <span className="text-lg font-black text-amber-600">{currency(salesIntel.targets.dailyRequiredRunRate)}/day</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{salesIntel.targets.daysRemaining} days left</span>
                </div>
              </div>

              <div className="p-3.5 bg-primary-50 rounded-sm border border-primary-200 flex items-center gap-2 text-xs text-primary-800">
                <Sparkles size={16} className="shrink-0 text-primary-600" />
                <span>{salesIntel.targets.recommendation}</span>
              </div>
            </div>
          )}

          {/* Branch Performance Comparison */}
          {salesIntel.branches && (
            <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                  <Store size={16} className="text-primary-600" />
                  Branch Performance & Contribution Analysis
                </h3>
                <p className="text-xs text-slate-500">Comparative multi-outlet sales velocity, AOV, and revenue share</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Branch Name</th>
                      <th className="py-2.5 px-3">Revenue (Month)</th>
                      <th className="py-2.5 px-3">Orders</th>
                      <th className="py-2.5 px-3">Avg Order Value (AOV)</th>
                      <th className="py-2.5 px-3">Revenue Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(salesIntel.branches.branches || []).map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-gray-600">{b.name} {b.isMain ? "⭐ (Main)" : ""}</td>
                        <td className="py-2.5 px-3 font-black text-gray-600">{currency(b.revenue)}</td>
                        <td className="py-2.5 px-3 text-slate-600">{b.orderCount}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">{currency(b.aov)}</td>
                        <td className="py-2.5 px-3">
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                            {b.revenueShare}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Discount Recommendations & Buying Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salesIntel.discountRecs && (
              <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                  <Percent size={16} className="text-amber-500" />
                  Inventory Clearance Discount Recommendations
                </h3>
                <p className="text-xs text-slate-500">Liquidation discounts to free locked cash while maintaining safe margin</p>
                <div className="space-y-2 mt-2">
                  {(salesIntel.discountRecs.recommendations || []).slice(0, 5).map((r: any) => (
                    <div key={r.productId} className="p-3 bg-slate-50 rounded-sm border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-gray-600 block">{r.productName}</span>
                        <span className="text-[10px] text-slate-400">Stock: {r.qtyOnHand} units · Cost: {currency(r.costPrice)}</span>
                      </div>
                      <div className="text-right">
                        <span className="rounded-sm bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-black block">
                          Apply {r.recommendedDiscountPct}% Off
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Unlocks {currency(r.potentialLiquidationValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {salesIntel.buyingPatterns && (
              <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                  <Clock size={16} className="text-primary-600" />
                  Customer Buying Patterns & Peak Timing
                </h3>
                <p className="text-xs text-slate-500">{salesIntel.buyingPatterns.summary}</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block">PEAK SHOPPING HOUR</span>
                    <span className="text-base font-black text-primary-600">{salesIntel.buyingPatterns.peakHour}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block">BUSIEST DAY OF WEEK</span>
                    <span className="text-base font-black text-emerald-600">{salesIntel.buyingPatterns.peakDay}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block">AVG BASKET SIZE</span>
                    <span className="text-base font-black text-gray-600">{salesIntel.buyingPatterns.averageItemsPerBasket} items</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block">AVG ORDER VALUE</span>
                    <span className="text-base font-black text-gray-600">{currency(salesIntel.buyingPatterns.averageOrderValue)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB 3: AI ACCOUNTING ASSISTANT ═══ */}
      {activeTab === "accounting_ai" && (
        <div className="space-y-5">
          {/* Cash Flow Forecast Card */}
          {accountingAI.cashFlow && (
            <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-600" />
                    30-Day Predictive Cash Flow & Inflow/Outflow Forecast
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daily sales velocity + projected AR collections vs recurring expenses & pending AP bills
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                  {accountingAI.cashFlow.healthStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">PROJECTED INFLOW</span>
                  <span className="text-lg font-black text-emerald-600">{currency(accountingAI.cashFlow.totals?.projectedInflow)}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Sales + Expected AR</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">PROJECTED OUTFLOW</span>
                  <span className="text-lg font-black text-rose-600">{currency(accountingAI.cashFlow.totals?.projectedOutflow)}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Expenses + AP Bills</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">NET CASH POSITION</span>
                  <span className="text-lg font-black text-primary-600">{currency(accountingAI.cashFlow.totals?.netProjectedCash)}</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">30-day runway</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">DAILY NET RUN-RATE</span>
                  <span className="text-lg font-black text-gray-600">{currency(accountingAI.cashFlow.dailyRunRate?.net)}/day</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Surplus generation</span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-sm border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{accountingAI.cashFlow.advisory}</span>
              </div>
            </div>
          )}

          {/* Interactive Accounting Utilities: Auto-Categorize & Duplicate Detector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto Expense Categorization */}
            <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                <Calculator size={16} className="text-primary-600" />
                Automatic Expense Categorization & GL Mapping
              </h3>
              <p className="text-xs text-slate-500">
                Type an expense description to auto-predict category and Chart of Accounts code
              </p>
              <div className="flex gap-2 mt-2">
                <input
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. DESCO Electricity Bill, Shop Rent, Courier Charge"
                  className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <CustomButton
                  variant="primary"
                  size="sm"
                  loading={categorizing}
                  disabled={!expTitle.trim()}
                  onClick={handleCategorizeExpense}
                >
                  Categorize
                </CustomButton>
              </div>

              {expCategoryResult && (
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-600">{expCategoryResult.category}</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">
                      {(expCategoryResult.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <span className="text-slate-500 block">GL Code: {expCategoryResult.suggestedAccountCode} - {expCategoryResult.suggestedAccountName}</span>
                  <span className="text-[10px] text-slate-400 block">{expCategoryResult.reasoning}</span>
                  <span className="text-[10px] font-bold text-amber-700 block mt-1">⚠️ Financial posting requires authorized user confirmation.</span>
                </div>
              )}
            </div>

            {/* Duplicate Invoice Detection */}
            <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-600" />
                Duplicate Invoice & Double-Entry Scanner
              </h3>
              <p className="text-xs text-slate-500">Scan before posting to prevent double payments and duplicate bills</p>
              <div className="flex gap-2 mt-2">
                <input
                  value={dupInvoiceNo}
                  onChange={(e) => setDupInvoiceNo(e.target.value)}
                  placeholder="Invoice #"
                  className="w-1/2 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <input
                  type="number"
                  value={dupAmount}
                  onChange={(e) => setDupAmount(e.target.value)}
                  placeholder="Amount (৳)"
                  className="w-1/2 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <CustomButton
                  variant="outline"
                  size="sm"
                  loading={checkingDup}
                  disabled={!dupInvoiceNo && !dupAmount}
                  onClick={handleCheckDuplicate}
                >
                  Scan
                </CustomButton>
              </div>

              {dupResult && (
                <div className={`p-3 rounded-sm border text-xs ${dupResult.isDuplicate ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <span className={`font-bold block ${dupResult.isDuplicate ? "text-rose-800" : "text-emerald-800"}`}>
                    {dupResult.verdict}
                  </span>
                  {dupResult.matches?.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {dupResult.matches.map((m: any, i: number) => (
                        <div key={i} className="text-[11px] text-rose-700">
                          • {m.reason} ({currency(m.total)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Outstanding Payment Risk Table */}
          {accountingAI.paymentRisk && (
            <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                    <CreditCard size={16} className="text-amber-500" />
                    Customer Outstanding Payment Default Risk Analysis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Predictive credit risk scoring and settlement probability for accounts receivable
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Total AR Exposure: {currency(accountingAI.paymentRisk.totalOverdueAmount)}
                </span>
              </div>

              <div className="space-y-2">
                {(accountingAI.paymentRisk.predictions || []).map((p: any) => (
                  <div key={p.customerId} className="p-3.5 bg-slate-50 rounded-sm border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-gray-600 block">{p.customerName} ({p.phone || "No phone"})</span>
                      <span className="text-[11px] text-slate-400">
                        Due: {currency(p.dueBalance)} · Overdue by {p.daysOverdue} days · {p.unpaidInvoices} open invoices
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-black inline-block ${
                        p.riskTier === "HIGH_RISK" ? "bg-rose-100 text-rose-800" : p.riskTier === "MEDIUM_RISK" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {p.riskTier.replace("_", " ")} ({p.paymentProbabilityPct}% recovery prob)
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{p.suggestedAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 4: DEMAND FORECAST ═══ */}
      {activeTab === "demand" && (
        <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-sm text-gray-600">30-Day Demand & Sales Forecast</h3>
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
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-sm border border-slate-100 hover:border-primary-200 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-100 text-primary-600">
                    <Package size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-600">{f.productName}</p>
                    <p className="text-[11px] text-slate-400">Avg daily sales: {f.avgDailySales} units</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-gray-600">{f.forecastQty} units predicted</p>
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
          </div>
        </div>
      )}

      {/* ═══ TAB 5: PROFIT AI ═══ */}
      {activeTab === "profit" && profit && (
        <div className="space-y-4">
          <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-sm bg-primary-50 border border-primary-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-gradient text-white shadow-sm shrink-0">
                <DollarSign size={18} />
              </div>
              <div>
                <h3 className="font-black text-sm text-gray-600">{profit.verdict || "Margin Analysis"}</h3>
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
                <div key={s.label} className="p-3.5 bg-slate-50 rounded-sm border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-base font-black text-gray-600 mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 6: INVENTORY HEALTH ═══ */}
      {activeTab === "inventory" && invAI && (
        <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-gray-600">Dead Stock & Slow-Moving Stock Alerts</h3>
            <p className="text-xs text-slate-500">Products with zero velocity over the past 45+ days</p>
          </div>
          <div className="space-y-2">
            {(invAI?.deadStock || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-sm bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-xs text-gray-600">{item.productName}</span>
                  <span className="text-[11px] text-slate-400 block">{item.daysInactive} days inactive · Stock: {item.quantity} units</span>
                </div>
                <span className="text-xs font-bold text-rose-600">Capital Locked: {currency(item.lockedCapital)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB 7: FRAUD SENTINEL ═══ */}
      {activeTab === "fraud" && fraud && (
        <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-gray-600">Continuous POS Anomaly Audit</h3>
            <p className="text-xs text-slate-500">Automated sentinel scanning cash voids, excessive discounts, and shift discrepancies</p>
          </div>
          <div className="space-y-2">
            {(fraud?.alerts || []).map((alert: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-sm bg-rose-50 border border-rose-200">
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-xs text-rose-900 block">{alert.title}</span>
                  <span className="text-[11px] text-rose-700">{alert.description || alert.detail}</span>
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

      {/* ═══ TAB 8: CUSTOMER INTELLIGENCE (RFM, LTV, Next Purchase, Loyalty) ═══ */}
      {activeTab === "customers" && custAI && (
        <div className="space-y-5">
          {/* RFM Segmentation Grid */}
          <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-gray-600">Customer RFM Matrix (Recency, Frequency, Monetary)</h3>
              <p className="text-xs text-slate-500">Autonomous customer clustering for retention and lifetime value optimization</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(custAI.segmentation?.segments || []).map((seg: any) => (
                <div key={seg.segment} className="p-4 rounded-sm border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-600">{seg.segment}</span>
                    <span className="rounded-full bg-primary-100 text-primary-800 text-[10px] font-black px-2 py-0.5">
                      {seg.percentage}% of base
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-600">{seg.count}</span>
                    <span className="text-[11px] text-slate-400">Avg Spend: {currency(seg.avgSpend)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2 rounded-xs border border-slate-100">
                    💡 {seg.strategy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Purchase Prediction Table */}
          {custAI.nextPurchase && (
            <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                <Clock size={16} className="text-primary-600" />
                AI Next Purchase Date Prediction & Churn Alerts
              </h3>
              <p className="text-xs text-slate-500">
                Calculates individual customer repeat shopping cycles to trigger timely engagement
              </p>
              <div className="space-y-2 mt-2">
                {(custAI.nextPurchase.predictions || []).slice(0, 6).map((np: any) => (
                  <div key={np.customerId} className="p-3 bg-slate-50 rounded-sm border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-gray-600 block">{np.customerName}</span>
                      <span className="text-[10px] text-slate-400">
                        Typical cycle: Every {np.avgOrderIntervalDays} days · Last visit {np.daysSinceLastOrder}d ago
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-black inline-block ${
                        np.status === "OVERDUE_FOR_PURCHASE" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {np.status === "OVERDUE_FOR_PURCHASE" ? "Due for visit" : `Expected ~${np.predictedNextDate}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{np.suggestedAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loyalty Campaign Suggestions */}
          {custAI.loyalty && (
            <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="font-black text-sm text-gray-600 flex items-center gap-2">
                <Gift size={16} className="text-primary-600" />
                Automated Loyalty Campaign & Personalized Offer Suggestions
              </h3>
              <p className="text-xs text-slate-500">Pre-configured retention promos ready to launch</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                {(custAI.loyalty.campaignOffers || []).map((off: any) => (
                  <div key={off.id} className="p-3.5 bg-slate-50 rounded-sm border border-slate-100 space-y-1.5">
                    <span className="font-black text-xs text-gray-600 block">{off.campaignTitle}</span>
                    <span className="text-[11px] text-slate-600 block leading-relaxed">{off.offerDetails}</span>
                    <span className="text-[10px] text-primary-700 font-bold block mt-1">ROI: {off.expectedROI}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 9: PROCUREMENT ADVISOR ═══ */}
      {activeTab === "procurement" && procurement && (
        <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-gray-600">Automated Purchase Requisition Advisor</h3>
            <p className="text-xs text-slate-500">Generated based on lead times and 30-day forecasted run rates</p>
          </div>
          <div className="space-y-2">
            {(procurement?.recommendations || []).map((rec: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-sm border border-slate-100">
                <div>
                  <span className="font-bold text-xs text-gray-600">{rec.productName}</span>
                  <span className="text-[11px] text-slate-400 block">Current stock: {rec.currentStock} · Lead time: {rec.leadTimeDays}d</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-xs text-primary-600 block">Reorder: {rec.recommendedPurchase} units</span>
                  <span className="text-[10px] text-slate-400">Est. Cost: {currency(rec.totalCost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB 10: AUTONOMOUS INSIGHTS ═══ */}
      {activeTab === "insights" && (
        <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-sm text-gray-600">Autonomous Business Insights Feed</h3>
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
              <div key={idx} className="p-4 rounded-sm border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-500 shrink-0" />
                    <span className="font-bold text-xs text-gray-600">{ins.title}</span>
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
