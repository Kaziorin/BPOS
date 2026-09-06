"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Bot, Send, TrendingUp, TrendingDown, AlertTriangle, Package,
  DollarSign, ShoppingCart, Users, Shield, Brain, RefreshCw,
  ArrowRight, CheckCircle, XCircle, MessageSquare, Zap,
  BarChart3, Target, Truck, Clock, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronRight,
} from "lucide-react";

const currency = (v: number) => `৳${(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

type TabType = "copilot" | "demand" | "profit" | "inventory" | "fraud" | "customers" | "procurement" | "insights";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white p-5 shadow-sm border border-gray-100 ${className}`}>{children}</div>;
}

function TabBtn({ active, onClick, children, icon: Icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: any }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
      active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`}>
      <Icon className="w-4 h-4" /> {children}
    </button>
  );
}

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

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "USER", text: userMsg }]);
    setLoading(true);
    try {
      const r = await api.post<any>("/api/v1/ai/copilot", { message: userMsg, sessionId });
      const data = r?.data || r;
      setMessages((m) => [...m, { role: "ASSISTANT", text: data.answer }]);
      if (data.sessionId) setSessionId(data.sessionId);
    } catch {
      setMessages((m) => [...m, { role: "ASSISTANT", text: "Sorry, I couldn't process that. Try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Business Copilot</p>
            <p className="text-sm mt-1">Ask me anything about your business data</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["What were today's sales?", "Which products need reorder?", "Show overdue installments", "Which branch is worst?"].map((q) => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-gray-200">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
              m.role === "USER" ? "bg-indigo-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-md">
              <div className="flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" /></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about sales, inventory, profit..." className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={send} disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
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
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (activeTab !== "copilot") loadTab(activeTab); }, [activeTab, loadTab]);

  const generateInsights = async () => {
    await api.post("/api/v1/ai/insights/generate");
    loadTab("insights");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-600" /> AI Intelligence
          </h1>
          <p className="text-sm text-gray-500">Demand forecasting, profit analysis, fraud detection & business copilot</p>
        </div>
        {activeTab !== "copilot" && (
          <button onClick={() => loadTab(activeTab)} className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <TabBtn active={activeTab === "copilot"} onClick={() => setActiveTab("copilot")} icon={MessageSquare}>Copilot</TabBtn>
        <TabBtn active={activeTab === "demand"} onClick={() => setActiveTab("demand")} icon={TrendingUp}>Demand</TabBtn>
        <TabBtn active={activeTab === "profit"} onClick={() => setActiveTab("profit")} icon={DollarSign}>Profit AI</TabBtn>
        <TabBtn active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")} icon={Package}>Inventory AI</TabBtn>
        <TabBtn active={activeTab === "fraud"} onClick={() => setActiveTab("fraud")} icon={Shield}>Fraud</TabBtn>
        <TabBtn active={activeTab === "customers"} onClick={() => setActiveTab("customers")} icon={Users}>Customer AI</TabBtn>
        <TabBtn active={activeTab === "procurement"} onClick={() => setActiveTab("procurement")} icon={Truck}>Procurement</TabBtn>
        <TabBtn active={activeTab === "insights"} onClick={() => setActiveTab("insights")} icon={Zap}>Insights</TabBtn>
      </div>

      {loading && activeTab !== "copilot" && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
        </div>
      )}

      {/* ═══ COPILOT ═══ */}
      {activeTab === "copilot" && (
        <Card className="p-0 overflow-hidden">
          <CopilotChat />
        </Card>
      )}

      {/* ═══ DEMAND FORECAST ═══ */}
      {activeTab === "demand" && demand && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-3">Demand Forecast ({demand.period})</h3>
            <p className="text-xs text-gray-500 mb-3">Based on: {demand.basedOn}</p>
            <div className="space-y-2">
              {(demand.forecasts || []).map((f: any) => (
                <div key={f.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{f.productName}</p>
                    <p className="text-xs text-gray-500">Avg daily: {f.avgDailySales} units</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{f.forecastQty} units</p>
                    <p className={`text-xs ${f.trendDirection === "up" ? "text-green-600" : f.trendDirection === "down" ? "text-red-600" : "text-gray-500"}`}>
                      {f.trendDirection === "up" ? "↑" : f.trendDirection === "down" ? "↓" : "→"} {f.trendPct}%
                    </p>
                  </div>
                </div>
              ))}
              {(!demand.forecasts || demand.forecasts.length === 0) && (
                <p className="text-sm text-gray-400 py-4">No sales data available for forecasting yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ═══ PROFIT AI ═══ */}
      {activeTab === "profit" && profit && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-lg ${profit.verdict?.includes("✅") ? "bg-green-100" : profit.verdict?.includes("⚠️") ? "bg-amber-100" : "bg-gray-100"}`}>
                <DollarSign className={`w-5 h-5 ${profit.verdict?.includes("✅") ? "text-green-600" : profit.verdict?.includes("⚠️") ? "text-amber-600" : "text-gray-600"}`} />
              </div>
              <div>
                <h3 className="font-semibold">{profit.verdict}</h3>
                <p className="text-sm text-gray-600">{profit.explanation}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "This Month Revenue", value: currency(profit.thisMonth?.revenue), color: "text-green-600" },
                { label: "This Month Profit", value: currency(profit.thisMonth?.grossProfit), color: "text-blue-600" },
                { label: "Margin", value: `${profit.thisMonth?.marginPct}%`, color: "text-indigo-600" },
                { label: "Orders", value: profit.thisMonth?.orders, color: "text-gray-600" },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </Card>
          {(profit.lowMarginProducts?.length || 0) > 0 && (
            <Card>
              <h3 className="font-semibold mb-3 text-amber-600">⚠️ Low Margin Products ({`<`}10%)</h3>
              <div className="space-y-2">
                {profit.lowMarginProducts.map((p: any) => (
                  <div key={p.productId} className="flex justify-between p-2 bg-amber-50 rounded-lg text-sm">
                    <span>{p.name}</span>
                    <span className="font-medium text-amber-700">{p.marginPct}% margin</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══ INVENTORY AI ═══ */}
      {activeTab === "inventory" && invAI && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-xs text-gray-500">Reorder Needed</p>
              <p className="text-2xl font-bold text-amber-600">{invAI.reorderCount || 0}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">Dead Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{invAI.deadStockCount || 0}</p>
            </Card>
          </div>
          {(invAI.insights || []).map((ins: any, i: number) => (
            <Card key={i}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ins.type === "REORDER" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {ins.type}
                  </span>
                  <p className="font-medium mt-1">{ins.productName} <span className="text-gray-400 text-xs">{ins.sku}</span></p>
                  <p className="text-sm text-gray-600 mt-1">{ins.explanation}</p>
                </div>
                {ins.suggestedQty && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Suggested</p>
                    <p className="font-bold text-amber-600">{ins.suggestedQty}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {(!invAI.insights || invAI.insights.length === 0) && (
            <Card><p className="text-sm text-gray-400 py-4 text-center">All inventory looks healthy!</p></Card>
          )}
        </div>
      )}

      {/* ═══ FRAUD AI ═══ */}
      {activeTab === "fraud" && fraud && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold">Fraud Detection Alerts</h3>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{fraud.count || 0} alerts</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{fraud.note}</p>
            <div className="space-y-2">
              {(fraud.alerts || []).map((a: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  a.severity === "HIGH" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${a.severity === "HIGH" ? "text-red-500" : "text-amber-500"}`} />
                    <span className="font-medium text-sm">{a.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${a.severity === "HIGH" ? "bg-red-200 text-red-700" : "bg-amber-200 text-amber-700"}`}>{a.severity}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 ml-6">{a.detail}</p>
                </div>
              ))}
              {(!fraud.alerts || fraud.alerts.length === 0) && (
                <p className="text-sm text-gray-400 py-4 text-center">No fraud alerts detected ✅</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ═══ CUSTOMER AI ═══ */}
      {activeTab === "customers" && custAI && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-3">High-Value Customers</h3>
            <div className="space-y-2">
              {(custAI.highValue || []).map((c: any) => (
                <div key={c.id} className="flex justify-between p-2 bg-green-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.orderCount} orders • Last: {c.daysSinceLastOrder}d ago</p>
                  </div>
                  <p className="font-semibold text-green-700">{currency(c.totalSpend)}</p>
                </div>
              ))}
            </div>
          </Card>
          {(custAI.churnRisk?.length || 0) > 0 && (
            <Card>
              <h3 className="font-semibold mb-3 text-red-600">⚠️ Churn Risk (inactive 60+ days)</h3>
              <div className="space-y-2">
                {custAI.churnRisk.map((c: any) => (
                  <div key={c.id} className="flex justify-between p-2 bg-red-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.orderCount} orders • {c.daysInactive} days inactive</p>
                    </div>
                    <p className="font-semibold text-red-700">{currency(c.totalSpend)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══ PROCUREMENT AI ═══ */}
      {activeTab === "procurement" && procurement && (
        <div className="space-y-4">
          <Card>
            <p className="text-xs text-gray-500 mb-2">Total estimated purchase cost: <strong>{currency(procurement.totalEstimatedCost || 0)}</strong></p>
            <div className="space-y-3">
              {(procurement.recommendations || []).map((r: any) => (
                <div key={r.productId} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{r.productName} <span className="text-gray-400 text-xs">{r.sku}</span></p>
                      <p className="text-xs text-gray-600 mt-1">{r.explanation}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Buy</p>
                      <p className="font-bold text-indigo-600">{r.recommendedPurchase}</p>
                      <p className="text-xs text-gray-500">{currency(r.totalCost)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!procurement.recommendations || procurement.recommendations.length === 0) && (
                <p className="text-sm text-gray-400 py-4 text-center">No reorder needed right now</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ═══ INSIGHTS ═══ */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={generateInsights} className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Zap className="w-4 h-4" /> Generate Insights
            </button>
          </div>
          {(insights || []).map((ins: any) => (
            <Card key={ins.id}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ins.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                    ins.severity === "HIGH" ? "bg-orange-100 text-orange-700" :
                    ins.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>{ins.severity}</span>
                  <span className="text-xs text-gray-400 ml-2">{ins.insightType}</span>
                  <h4 className="font-medium mt-1">{ins.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{ins.summary}</p>
                </div>
                <button onClick={async () => { await api.patch(`/api/v1/ai/insights/${ins.id}/dismiss`); loadTab("insights"); }}
                  className="text-gray-400 hover:text-red-500"><XCircle className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
          {(!insights || insights.length === 0) && (
            <Card><p className="text-sm text-gray-400 py-8 text-center">No insights yet. Click "Generate Insights" to analyze your data.</p></Card>
          )}
        </div>
      )}
    </div>
  );
}
