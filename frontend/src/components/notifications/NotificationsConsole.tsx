"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell, CheckCheck, RefreshCw, Loader2, Inbox, Send, SlidersHorizontal,
  FileText, Plus, Search, Trash2, Mail, MessageSquare, Smartphone, Megaphone,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";

const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString("en-GB") : "—");
const CHIP: Record<string, string> = {
  SENT: "bg-emerald-500/10 text-emerald-700",
  PENDING: "bg-amber-500/10 text-amber-700",
  FAILED: "bg-rose-500/10 text-rose-700",
  SKIPPED_OPTOUT: "bg-gray-400/10 text-gray-500",
  CHANNEL_OFF: "bg-gray-400/10 text-gray-500",
};
const CH_ICON: Record<string, any> = {
  IN_APP: Bell, PUSH: Smartphone, EMAIL: Mail, SMS: MessageSquare, WHATSAPP: Megaphone,
};
const CHANNEL_LIST = ["IN_APP", "PUSH", "EMAIL", "SMS", "WHATSAPP"];
const STATUSES = ["SENT", "PENDING", "FAILED", "SKIPPED_OPTOUT", "CHANNEL_OFF"];

export default function NotificationsConsole({
  tab: initialTab = "inbox",
  autoCreate = false,
}: {
  tab?: "inbox" | "logs" | "channels" | "consent" | "templates";
  autoCreate?: boolean;
}) {
  const [tab, setTab] = useState(initialTab);
  const [message, setMessage] = useState<string | null>(null);
  const show = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  // ── inbox ──
  const [inbox, setInbox] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [onlyUnread, setOnlyUnread] = useState(false);

  // ── logs (outbox) ──
  const [logs, setLogs] = useState<any[]>([]);
  const [logStatus, setLogStatus] = useState("");
  const [logChannel, setLogChannel] = useState("");
  const [logEvent, setLogEvent] = useState("");
  const [events, setEvents] = useState<any[]>([]);

  // ── channels ──
  const [channels, setChannels] = useState<any[]>([]);

  // ── consent ──
  const [custSearch, setCustSearch] = useState("");
  const [custOptions, setCustOptions] = useState<any[]>([]);
  const [consentCust, setConsentCust] = useState<any>(null);
  const [consents, setConsents] = useState<any>(null);

  // ── templates ──
  const [templates, setTemplates] = useState<any[]>([]);
  const [tplFilter, setTplFilter] = useState("");
  const [showTpl, setShowTpl] = useState(autoCreate);
  const [tplForm, setTplForm] = useState<any>({ eventType: "PAYMENT", channel: "EMAIL", name: "", subject: "", body: "" });

  async function loadInbox() {
    try {
      const res = await api.get<{ data: any }>(`/v1/notifications${onlyUnread ? "?unreadOnly=true" : ""}`);
      setInbox(res.data.items ?? []);
      setUnread(res.data.unread ?? 0);
    } catch (err: any) { console.error(err); }
  }
  const loadLogs = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (logStatus) q.set("status", logStatus);
      if (logChannel) q.set("channel", logChannel);
      if (logEvent) q.set("eventType", logEvent);
      const res = await api.get<{ data: any[] }>(`/v1/notify/logs?${q.toString()}`);
      setLogs(res.data);
    } catch (err: any) { console.error(err); }
  }, [logStatus, logChannel, logEvent]);
  async function loadChannels() {
    try {
      const res = await api.get<{ data: any[] }>("/v1/notify/channels");
      setChannels(res.data);
    } catch (err: any) { console.error(err); }
  }
  async function loadEvents() {
    try {
      const res = await api.get<{ data: any[] }>("/v1/notify/events");
      setEvents(res.data);
    } catch (err: any) { console.error(err); }
  }
  const loadTemplates = useCallback(async () => {
    try {
      const res = await api.get<{ data: any[] }>("/v1/notify/templates");
      setTemplates(res.data);
    } catch (err: any) { console.error(err); }
  }, []);

  useEffect(() => { loadInbox(); /* eslint-disable-next-line */ }, [onlyUnread]);
  useEffect(() => { loadLogs(); }, [loadLogs]);
  useEffect(() => { loadChannels(); loadEvents(); loadTemplates(); }, [loadTemplates]);
  useEffect(() => {
    if (tab === "consent" && custOptions.length === 0) loadCustomers("");
  }, [tab]); // eslint-disable-line

  async function loadCustomers(q: string) {
    try {
      const res = await api.get<{ data: any[] }>(`/v1/customers?limit=50${q ? `&search=${encodeURIComponent(q)}` : ""}`);
      setCustOptions(res.data);
    } catch (err: any) { console.error(err); }
  }

  async function markRead(id: string) {
    try { await api.patch(`/v1/notifications/${id}/read`, {}); loadInbox(); }
    catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function readAll() {
    try { await api.post("/v1/notifications/read-all", {}); loadInbox(); show("All marked as read"); }
    catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function toggleChannel(code: string, enabled: boolean) {
    try {
      await api.patch(`/v1/notify/channels/${code}`, { isEnabled: !enabled });
      show(`${code} ${!enabled ? "enabled" : "disabled"}`);
      loadChannels();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function openConsent(cust: any) {
    setConsentCust(cust);
    setConsents(null);
    try {
      const res = await api.get<{ data: any }>(`/v1/customers/${cust.id}/consents`);
      setConsents(res.data);
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function setConsent(channel: string, status: string) {
    if (!consentCust) return;
    try {
      await api.put(`/v1/customers/${consentCust.id}/consents`, { channel, status });
      const res = await api.get<{ data: any }>(`/v1/customers/${consentCust.id}/consents`);
      setConsents(res.data);
      show(`${channel} → ${status === "OPTED_IN" ? "opted in" : "opted out"}`);
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function createTemplate() {
    if (!tplForm.eventType || !tplForm.channel) { alert("Event + channel required"); return; }
    try {
      await api.post("/v1/notify/templates", { ...tplForm, eventType: tplForm.eventType, channel: tplForm.channel, isActive: 1 });
      setShowTpl(false); show("Template created — overrides the built-in wording for this event/channel");
      loadTemplates();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function deleteTemplate(t: any) {
    if (!confirm(`Delete template “${t.name || t.eventType}”?`)) return;
    try { await api.del(`/v1/notify/templates/${t.id}`); show("Template deleted"); loadTemplates(); }
    catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function retryLog(l: any) {
    try { await api.post(`/v1/notify/logs/${l.id}/retry`, {}); show("Retry sent"); loadLogs(); }
    catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function runChecks() {
    try {
      const res = await api.post<{ data: any }>("/v1/notify/check", {});
      const fired = res.data?.fired ?? {};
      const parts = Object.entries(fired).map(([k, v]) => `${k}×${v}`).join(", ");
      show(`Scheduled scan done — ${parts || "nothing due"}`);
      loadInbox();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }

  const logKpis = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of logs) c[l.status] = (c[l.status] || 0) + 1;
    return c;
  }, [logs]);

  return (
    <div className="space-y-6">
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Bell size={22} className="text-primary-600" /> Notification Engine
          </h1>
          <p className="mt-1 text-sm text-gray-500">In-app, email, SMS, WhatsApp &amp; push — one engine, consent checked centrally per customer/channel</p>
        </div>
        <div className="flex items-center gap-2">
          <CustomButton variant="outline" onClick={runChecks}><SlidersHorizontal size={14} /> Run scheduled checks</CustomButton>
          {tab === "templates" && <CustomButton onClick={() => setShowTpl(true)}><Plus size={15} /> New template</CustomButton>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Inbox size={13} /> Unread in-app</p>
          <p className="mt-1 text-2xl font-bold text-primary-600">{unread}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Send size={13} /> Sent (outbox)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{logKpis.SENT || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><CheckCheck size={13} /> Skipped (opt-out)</p>
          <p className="mt-1 text-2xl font-bold text-gray-500">{logKpis.SKIPPED_OPTOUT || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><FileText size={13} /> Templates</p>
          <p className="mt-1 text-2xl font-bold text-violet-600">{templates.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-100 pb-2">
        {([["inbox", "Inbox", Inbox], ["logs", "Outbox logs", Send], ["templates", "Templates", FileText],
           ["consent", "Customer consent", CheckCheck], ["channels", "Channels", Bell]] as [any, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${tab === id ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ════ INBOX ════ */}
      {tab === "inbox" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} className="rounded border-gray-300" /> Unread only
            </label>
            <CustomButton variant="outline" size="sm" onClick={readAll}><CheckCheck size={13} /> Mark all read</CustomButton>
          </div>
          {inbox.length === 0 && <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center"><p className="text-sm text-gray-400">No notifications — approvals, low stock, delivery updates and sync alerts land here.</p></div>}
          <div className="space-y-2">
            {inbox.map((n) => (
              <div key={n.id} onClick={() => { if (!n.isRead) markRead(n.id); }}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 shadow-sm transition ${n.isRead ? "border-gray-100 bg-white" : "border-primary-100 bg-primary-50/40"}`}>
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.isRead ? "bg-gray-100 text-gray-400" : "bg-primary-100 text-primary-600"}`}>
                  {(CH_ICON[n.eventType === "APPROVAL_REQUIRED" ? "IN_APP" : "IN_APP"]) ? <Bell size={15} /> : <Bell size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm ${n.isRead ? "font-medium text-gray-700" : "font-semibold text-gray-900"}`}>{n.title}</p>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{n.eventType}</span>
                    {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{n.body}</p>
                  <p className="mt-1 text-[10px] text-gray-400">{fmt(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ OUTBOX ════ */}
      {tab === "logs" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect value={logStatus} onChange={(e) => setLogStatus(e.target.value)}
              options={[{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))]} containerClassName="w-44" />
            <CustomSelect value={logChannel} onChange={(e) => setLogChannel(e.target.value)}
              options={[{ value: "", label: "All channels" }, ...CHANNEL_LIST.map((c) => ({ value: c, label: c }))]} containerClassName="w-40" />
            <CustomSelect value={logEvent} onChange={(e) => setLogEvent(e.target.value)}
              options={[{ value: "", label: "All events" }, ...events.map((e) => ({ value: e.code, label: e.label }))]} containerClassName="w-52" />
            <button onClick={() => { setLogStatus(""); setLogChannel(""); setLogEvent(""); }} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Event / channel</th><th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Subject</th><th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => {
                  const Icon = CH_ICON[l.channel] || Send;
                  return (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500"><Icon size={13} /></span>
                          <div>
                            <p className="font-semibold text-gray-800">{l.eventType}</p>
                            <p className="text-[10px] text-gray-400">{l.channel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800">{l.recipientName || "—"}</p>
                        <p className="text-[11px] text-gray-400">{l.recipientAddress || (l.recipientType === "USER" ? "in-app" : "")}</p>
                      </td>
                      <td className="max-w-[220px] px-4 py-3">
                        <p className="truncate text-xs font-medium text-gray-700">{l.subject}</p>
                        <p className="truncate text-[11px] text-gray-400">{l.body}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${CHIP[l.status] || "bg-gray-100 text-gray-500"}`}>
                          {l.status === "SKIPPED_OPTOUT" ? "OPTED OUT" : l.status}
                        </span>
                        {l.errorMsg && <p className="mt-0.5 text-[10px] text-gray-400">{l.errorMsg}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmt(l.sentAt || l.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {["FAILED", "PENDING"].includes(l.status) && (
                          <button onClick={() => retryLog(l)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">Retry</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">No outbound messages match the filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ TEMPLATES ════ */}
      {tab === "templates" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <CustomSelect value={tplFilter} onChange={(e) => setTplFilter(e.target.value)}
              options={[{ value: "", label: "All events" }, ...events.map((e) => ({ value: e.code, label: e.label }))]} containerClassName="w-56" />
          </div>
          {templates.length === 0 && <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center"><p className="text-sm text-gray-400">No custom templates — built-in wording is used for every event/channel.</p></div>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.filter((t) => !tplFilter || t.eventType === tplFilter).map((t) => (
              <div key={t.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">{t.eventType}</span>
                    <span className="ml-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{t.channel}</span>
                  </div>
                  <button onClick={() => deleteTemplate(t)} className="text-gray-300 hover:text-rose-500"><Trash2 size={13} /></button>
                </div>
                <p className="mt-2 font-semibold text-gray-900">{t.name || t.eventType}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{t.subject}</p>
                <p className="mt-2 line-clamp-2 rounded-lg bg-gray-50 p-2 text-[11px] text-gray-500">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ CONSENT ════ */}
      {tab === "consent" && (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="relative mb-3">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={custSearch} onChange={(e) => { setCustSearch(e.target.value); loadCustomers(e.target.value); }}
                  placeholder="Search customers…"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-primary-400" />
              </div>
              <div className="max-h-[420px] space-y-1 overflow-y-auto">
                {custOptions.map((c) => (
                  <button key={c.id} onClick={() => openConsent(c)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${consentCust?.id === c.id ? "bg-primary-50 text-primary-700" : "text-gray-700"}`}>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-[11px] text-gray-400">{c.phone || ""}{c.email ? ` · ${c.email}` : ""}</p>
                  </button>
                ))}
                {custOptions.length === 0 && <p className="py-6 text-center text-xs text-gray-400">No customers found</p>}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            {!consentCust ? (
              <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                <p className="text-sm text-gray-400">Pick a customer to manage their per-channel marketing consent.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-base font-bold text-gray-900">{consentCust.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">Communication consent per channel — opt-outs are enforced by the engine at send time, everywhere.</p>
                <div className="mt-4 space-y-3">
                  {consents && CHANNEL_LIST.map((ch) => {
                    const st = consents[ch]?.status;
                    const Icon = CH_ICON[ch] || Bell;
                    const opted = st === "OPTED_IN";
                    return (
                      <div key={ch} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${opted ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}><Icon size={16} /></span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{ch}</p>
                            <p className="text-[11px] text-gray-400">{ch === "IN_APP" ? "In-app bell" : ch === "SMS" ? "Text message" : ch === "EMAIL" ? "Email" : ch === "WHATSAPP" ? "WhatsApp" : "Mobile push"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {opted
                            ? <CustomButton variant="outline" size="sm" onClick={() => setConsent(ch, "OPTED_OUT")}>Opt out</CustomButton>
                            : <CustomButton size="sm" onClick={() => setConsent(ch, "OPTED_IN")}>Opt in</CustomButton>}
                          <span className={`w-20 text-center text-[11px] font-bold ${opted ? "text-emerald-600" : "text-rose-500"}`}>{opted ? "SUBSCRIBED" : "OPTED OUT"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ CHANNELS ════ */}
      {tab === "channels" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {channels.map((ch) => {
            const Icon = CH_ICON[ch.code] || Bell;
            const on = !!ch.isEnabled;
            return (
              <div key={ch.code} className={`rounded-xl border p-5 shadow-sm ${on ? "border-emerald-100 bg-white" : "border-gray-200 bg-gray-50"}`}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${on ? "bg-emerald-50 text-emerald-600" : "bg-gray-200 text-gray-400"}`}><Icon size={18} /></span>
                <p className="mt-3 font-semibold text-gray-900">{ch.code}</p>
                <p className="text-xs text-gray-400">{ch.name}</p>
                <div className="mt-4">
                  <button onClick={() => toggleChannel(ch.code, on)}
                    className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition ${on ? "bg-gray-900 text-white hover:bg-gray-700" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                    {on ? "Disable channel" : "Enable channel"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── New template modal ── */}
      <CustomModal open={showTpl} onClose={() => setShowTpl(false)} title="Notification template override">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Event *" value={tplForm.eventType} onChange={(e: any) => setTplForm({ ...tplForm, eventType: e.target.value })}
              options={events.map((e) => ({ value: e.code, label: e.label }))} />
            <CustomSelect label="Channel *" value={tplForm.channel} onChange={(e: any) => setTplForm({ ...tplForm, channel: e.target.value })}
              options={CHANNEL_LIST.map((c) => ({ value: c, label: c }))} />
          </div>
          <CustomInput label="Template name" value={tplForm.name} onChange={(e: any) => setTplForm({ ...tplForm, name: e.target.value })} placeholder="e.g. Payment confirmation" />
          <CustomInput label="Subject" value={tplForm.subject} onChange={(e: any) => setTplForm({ ...tplForm, subject: e.target.value })} placeholder="Receipt {invoiceNo}" />
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Body</p>
            <textarea value={tplForm.body} onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })} rows={5}
              placeholder="Dear {name}, your total is ৳{amount}…"
              className="w-full rounded-lg border border-gray-200 bg-white p-3 font-mono text-xs outline-none focus:border-primary-400" />
            <p className="mt-1 text-[11px] text-gray-400">Placeholders: {'{name} {amount} {invoiceNo} {deliveryNo} {status} {product} {coupon} …'}</p>
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowTpl(false)}>Cancel</CustomButton>
            <CustomButton onClick={createTemplate}><Plus size={14} /> Create template</CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
