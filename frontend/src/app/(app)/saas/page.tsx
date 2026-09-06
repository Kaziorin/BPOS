"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  CreditCard, Flag, Layout, Plus, Trash2, Settings, Users, Building2,
  Database, Activity, Zap, ToggleLeft, ToggleRight, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, ChevronDown, FileText, Wrench,
  BarChart3, Shield, Package, Cpu,
} from "lucide-react";

type TabType = "overview" | "plans" | "subscription" | "usage" | "features" | "fields" | "forms" | "health" | "tickets";

const currency = (v: number) => `৳${(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white p-5 shadow-sm border border-gray-100 ${className}`}>{children}</div>;
}

function Stat({ label, value, icon: Icon, color = "text-indigo-600" }: { label: string; value: string | number; icon: any; color?: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-50"><Icon className={`w-5 h-5 ${color}`} /></div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
      active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`}>{children}</button>
  );
}

const ENTITY_TYPES = ["CUSTOMER", "PRODUCT", "SUPPLIER", "EMPLOYEE", "INVOICE", "REPAIR_TICKET"];
const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "BOOLEAN", "DROPDOWN", "MULTI_SELECT", "FILE", "CURRENCY"];

export default function SaaSPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(false);

  // Data
  const [overview, setOverview] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [health, setHealth] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [platformTenants, setPlatformTenants] = useState<any[]>([]);

  const load = useCallback(async (tab: TabType) => {
    setLoading(true);
    try {
      if (tab === "overview") {
        const [ov, st] = await Promise.all([
          api.get<any>("/api/v1/saas/platform/overview"),
          api.get<any>("/api/v1/saas/platform/tenants"),
        ]);
        setOverview(ov?.data || ov);
        setPlatformTenants(Array.isArray(st?.data) ? st.data : st || []);
      } else if (tab === "plans") {
        const r = await api.get<any[]>("/api/v1/saas/plans");
        setPlans(Array.isArray(r) ? r : r?.data || []);
      } else if (tab === "subscription") {
        const r = await api.get<any>("/api/v1/saas/subscription");
        setSubscription(r?.data || r);
      } else if (tab === "usage") {
        const r = await api.get<any>("/api/v1/saas/usage");
        setUsage(r?.data || r);
      } else if (tab === "features") {
        const r = await api.get<any[]>("/api/v1/saas/feature-flags");
        setFlags(Array.isArray(r) ? r : r?.data || []);
      } else if (tab === "fields") {
        const r = await api.get<any[]>("/api/v1/saas/custom-fields");
        setFields(Array.isArray(r) ? r : r?.data || []);
      } else if (tab === "forms") {
        const r = await api.get<any[]>("/api/v1/saas/form-templates");
        setForms(Array.isArray(r) ? r : r?.data || []);
      } else if (tab === "health") {
        const r = await api.get<any>("/api/v1/saas/platform/health");
        setHealth(r?.data || r || []);
      } else if (tab === "tickets") {
        const r = await api.get<any[]>("/api/v1/saas/tickets");
        setTickets(Array.isArray(r) ? r : r?.data || []);
      }
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  const toggleFlag = async (code: string, enabled: boolean) => {
    await api.patch(`/api/v1/saas/feature-flags/${code}`, { isEnabled: enabled });
    load("features");
  };

  const addField = async (entityType: string) => {
    const name = prompt(`Field name for ${entityType}:`);
    if (!name) return;
    const type = prompt(`Field type (${FIELD_TYPES.join("/")}):`, "TEXT") || "TEXT";
    const required = confirm("Is this field required?");
    await api.post("/api/v1/saas/custom-fields", { entityType, fieldName: name, fieldType: type.toUpperCase(), isRequired: required });
    load("fields");
  };

  const deleteField = async (id: string) => {
    await api.delete(`/api/v1/saas/custom-fields/${id}`);
    load("fields");
  };

  const addForm = async () => {
    const name = prompt("Form name:");
    if (!name) return;
    const formType = prompt("Form type (REPAIR_INTAKE/CUSTOM):", "CUSTOM") || "CUSTOM";
    await api.post("/api/v1/saas/form-templates", { name, formType, fields: [] });
    load("forms");
  };

  const runHealth = async () => {
    await api.post("/api/v1/saas/platform/health/check");
    load("health");
  };

  const addTicket = async () => {
    const subject = prompt("Ticket subject:");
    if (!subject) return;
    const desc = prompt("Description:") || "";
    await api.post("/api/v1/saas/tickets", { subject, description: desc });
    load("tickets");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" /> SaaS Management
          </h1>
          <p className="text-sm text-gray-500">Plans, subscriptions, feature flags, custom fields & platform admin</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["overview", "plans", "subscription", "usage", "features", "fields", "forms", "health", "tickets"] as TabType[]).map((tab) => (
          <TabBtn key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </TabBtn>
        ))}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ═══ OVERVIEW ═══ */}
          {activeTab === "overview" && overview && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Tenants" value={overview.totalTenants || 0} icon={Building2} />
                <Stat label="Active" value={overview.activeTenants || 0} icon={CheckCircle} color="text-green-600" />
                <Stat label="Trial" value={overview.trialTenants || 0} icon={Zap} color="text-amber-600" />
                <Stat label="Suspended" value={overview.suspendedTenants || 0} icon={XCircle} color="text-red-600" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Users" value={overview.totalUsers || 0} icon={Users} />
                <Stat label="Total Branches" value={overview.totalBranches || 0} icon={Building2} />
                <Stat label="Today's Sales" value={overview.dailyTransactions || 0} icon={BarChart3} color="text-blue-600" />
                <Stat label="Monthly Revenue" value={currency(overview.monthlySubscriptionRevenue || 0)} icon={CreditCard} color="text-green-600" />
              </div>
              <Card>
                <h3 className="font-semibold mb-3">Tenants</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-gray-500">
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-left py-2 px-3">Type</th>
                        <th className="text-left py-2 px-3">Users</th>
                        <th className="text-left py-2 px-3">Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {platformTenants.map((t: any) => (
                        <tr key={t.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{t.name}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              t.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                              t.status === "TRIAL" ? "bg-amber-100 text-amber-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>{t.status}</span>
                          </td>
                          <td className="py-2 px-3 text-gray-500">{t.businessType}</td>
                          <td className="py-2 px-3">{t.userCount}</td>
                          <td className="py-2 px-3">{t.saleCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ═══ PLANS ═══ */}
          {activeTab === "plans" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p: any) => (
                <Card key={p.id} className="relative">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <p className="text-xs text-gray-500">{p.code}</p>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between"><span className="text-gray-500">Monthly</span><span className="font-semibold">{currency(p.monthlyPrice)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Yearly</span><span className="font-semibold">{currency(p.yearlyPrice)}</span></div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 border-t pt-3">
                    <p>Users: {p.maxUsers} • Branches: {p.maxBranches}</p>
                    <p>Products: {p.maxProducts?.toLocaleString()} • POS: {p.maxPOS}</p>
                    <p>API calls/day: {p.maxAPICallsDaily?.toLocaleString()}</p>
                    <p>AI queries/day: {p.maxAIQueriesDaily}</p>
                  </div>
                </Card>
              ))}
              {plans.length === 0 && <Card><p className="text-sm text-gray-400 py-8 text-center">No plans configured yet.</p></Card>}
            </div>
          )}

          {/* ═══ SUBSCRIPTION ═══ */}
          {activeTab === "subscription" && (
            <Card>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      subscription.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      subscription.status === "TRIAL" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{subscription.status}</span>
                    <h3 className="font-semibold text-lg">{subscription.planName}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Billing</p><p className="font-medium">{subscription.billingCycle}</p></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Trial Ends</p><p className="font-medium">{subscription.trialEndsAt?.split("T")[0] || "—"}</p></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Period Start</p><p className="font-medium">{subscription.currentPeriodStart?.split("T")[0] || "—"}</p></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Period End</p><p className="font-medium">{subscription.currentPeriodEnd?.split("T")[0] || "—"}</p></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3">No subscription yet</p>
                  {plans.length > 0 && (
                    <button onClick={async () => {
                      if (confirm(`Subscribe to ${plans[0].name}?`)) {
                        await api.post("/api/v1/saas/subscription", { planId: plans[0].id, billingCycle: "MONTHLY" });
                        load("subscription");
                      }
                    }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                      Start Free Trial
                    </button>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* ═══ USAGE ═══ */}
          {activeTab === "usage" && usage && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Stat label="Users" value={`${usage.users || 0}/${usage.limits?.maxUsers || "∞"}`} icon={Users} />
                <Stat label="Branches" value={`${usage.branches || 0}/${usage.limits?.maxBranches || "∞"}`} icon={Building2} />
                <Stat label="POS" value={`${usage.pos || 0}/${usage.limits?.maxPOS || "∞"}`} icon={Package} />
                <Stat label="Products" value={`${usage.products || 0}/${usage.limits?.maxProducts || "∞"}`} icon={Database} />
                <Stat label="Transactions" value={usage.transactions || 0} icon={Activity} />
              </div>
              {(usage.warnings?.length || 0) > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="font-medium text-sm">Approaching limits: {usage.warnings.join(", ")}</p>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* ═══ FEATURE FLAGS ═══ */}
          {activeTab === "features" && (
            <Card>
              <h3 className="font-semibold mb-3">Module Feature Flags</h3>
              <div className="space-y-2">
                {flags.map((f: any) => (
                  <div key={f.moduleCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{f.moduleCode}</p>
                      {f.config && <p className="text-xs text-gray-400">Configured</p>}
                    </div>
                    <button onClick={() => toggleFlag(f.moduleCode, !f.isEnabled)}
                      className="flex items-center gap-1">
                      {f.isEnabled ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                      <span className={`text-xs ${f.isEnabled ? "text-green-600" : "text-gray-500"}`}>
                        {f.isEnabled ? "ON" : "OFF"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ═══ CUSTOM FIELDS ═══ */}
          {activeTab === "fields" && (
            <>
              <div className="flex gap-2 flex-wrap">
                {ENTITY_TYPES.map((et) => (
                  <button key={et} onClick={() => addField(et)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">
                    <Plus className="w-3 h-3" /> {et}
                  </button>
                ))}
              </div>
              {ENTITY_TYPES.map((et) => {
                const entityFields = fields.filter((f: any) => f.entityType === et);
                if (entityFields.length === 0) return null;
                return (
                  <Card key={et}>
                    <h3 className="font-semibold mb-3">{et} Fields</h3>
                    <div className="space-y-2">
                      {entityFields.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                          <div>
                            <span className="font-medium">{f.fieldName}</span>
                            <span className="text-xs text-gray-400 ml-2">{f.fieldType}</span>
                            {f.isRequired && <span className="text-xs text-red-500 ml-1">*</span>}
                          </div>
                          <button onClick={() => deleteField(f.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
              {fields.length === 0 && <Card><p className="text-sm text-gray-400 py-8 text-center">No custom fields yet. Click + to add one.</p></Card>}
            </>
          )}

          {/* ═══ FORM BUILDER ═══ */}
          {activeTab === "forms" && (
            <>
              <div className="flex justify-end">
                <button onClick={addForm} className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus className="w-4 h-4" /> New Form
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forms.map((f: any) => (
                  <Card key={f.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{f.name}</h3>
                        <p className="text-xs text-gray-500">{f.formType}</p>
                      </div>
                      <button onClick={async () => { await api.delete(`/api/v1/saas/form-templates/${f.id}`); load("forms"); }}
                        className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <p>{Array.isArray(f.fields) ? f.fields.length : 0} fields configured</p>
                    </div>
                  </Card>
                ))}
                {forms.length === 0 && <Card><p className="text-sm text-gray-400 py-8 text-center">No form templates yet.</p></Card>}
              </div>
            </>
          )}

          {/* ═══ HEALTH ═══ */}
          {activeTab === "health" && (
            <>
              <div className="flex justify-end">
                <button onClick={runHealth} className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Activity className="w-4 h-4" /> Run Health Check
                </button>
              </div>
              <div className="space-y-2">
                {health.map((h: any) => (
                  <Card key={h.id}>
                    <div className="flex items-center gap-3">
                      {h.status === "OK" ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                       h.status === "DEGRADED" ? <AlertTriangle className="w-5 h-5 text-amber-500" /> :
                       <XCircle className="w-5 h-5 text-red-500" />}
                      <div>
                        <p className="font-medium text-sm">{h.checkType}</p>
                        <p className="text-xs text-gray-500">{h.latencyMs ? `${h.latencyMs}ms` : "—"} • {h.checkedAt?.split("T")[0] || ""}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {health.length === 0 && <Card><p className="text-sm text-gray-400 py-8 text-center">No health checks yet.</p></Card>}
              </div>
            </>
          )}

          {/* ═══ TICKETS ═══ */}
          {activeTab === "tickets" && (
            <>
              <div className="flex justify-end">
                <button onClick={addTicket} className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus className="w-4 h-4" /> New Ticket
                </button>
              </div>
              <div className="space-y-2">
                {tickets.map((t: any) => (
                  <Card key={t.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            t.status === "OPEN" ? "bg-blue-100 text-blue-700" :
                            t.status === "RESOLVED" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>{t.status}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            t.priority === "URGENT" ? "bg-red-100 text-red-700" :
                            t.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{t.priority}</span>
                        </div>
                        <h4 className="font-medium mt-1">{t.subject}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {tickets.length === 0 && <Card><p className="text-sm text-gray-400 py-8 text-center">No support tickets.</p></Card>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
