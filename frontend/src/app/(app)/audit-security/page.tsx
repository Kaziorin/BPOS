"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const TABS = ["Audit Trail", "Security Events", "Security Health", "Settings"];

export default function AuditSecurityPage() {
  const [tab, setTab] = useState(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [secEvents, setSecEvents] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [secStats, setSecStats] = useState<any>(null);
  const [filter, setFilter] = useState({ action: "", entityType: "", limit: 50 });
  const [secFilter, setSecFilter] = useState({ eventType: "", severity: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadTab(); }, [tab]);

  async function loadTab() {
    setLoading(true);
    try {
      if (tab === 0) {
        const params = new URLSearchParams({ limit: String(filter.limit) });
        if (filter.action) params.set("action", filter.action);
        if (filter.entityType) params.set("entityType", filter.entityType);
        const [logsData, statsData] = await Promise.all([
          api.get<{ data: any[] }>(`/audit/logs?${params}`).then((r) => r.data || []),
          api.get<{ data: any }>(`/audit/stats`).then((r) => r.data || {}),
        ]);
        setAuditLogs(logsData);
        setStats(statsData);
      } else if (tab === 1) {
        const params = new URLSearchParams({ limit: "50" });
        if (secFilter.eventType) params.set("eventType", secFilter.eventType);
        if (secFilter.severity) params.set("severity", secFilter.severity);
        const [evData, stData] = await Promise.all([
          api.get<{ data: any[] }>(`/security/events?${params}`).then((r) => r.data || []),
          api.get<{ data: any }>(`/security/stats`).then((r) => r.data || {}),
        ]);
        setSecEvents(evData);
        setSecStats(stData);
      } else if (tab === 2) {
        const data = await api.get<{ data: any }>(`/security/health`).then((r) => r.data || {});
        setHealth(data);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function riskColor(level: string) {
    if (level === "HIGH") return "text-red-600 bg-red-50";
    if (level === "MEDIUM") return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  }

  function sevColor(sev: string) {
    if (sev === "CRITICAL" || sev === "HIGH") return "text-red-600 bg-red-50";
    if (sev === "MEDIUM") return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔐 Security & Audit Trail</h1>

      <div className="flex gap-2 mb-6 border-b pb-2">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${tab === i ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading && <div className="text-gray-500 py-4">Loading...</div>}

      {/* ── AUDIT TRAIL ── */}
      {tab === 0 && !loading && (
        <div>
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">Total Logs</div><div className="text-2xl font-bold">{stats.total || 0}</div></div>
              <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">Today</div><div className="text-2xl font-bold">{stats.today || 0}</div></div>
              <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">By Entity</div><div className="text-sm mt-1">{(stats.byEntity || []).map((e: any) => `${e.entityType}: ${e.count}`).join(", ") || "None"}</div></div>
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <select value={filter.action} onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
              className="border rounded px-3 py-2 text-sm">
              <option value="">All Actions</option>
              {["CREATE", "UPDATE", "DELETE", "ADJUST", "VOID", "REFUND", "PAYMENT", "EXPORT", "IMPORT", "LOGIN"].map(a =>
                <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filter.entityType} onChange={e => setFilter(f => ({ ...f, entityType: e.target.value }))}
              className="border rounded px-3 py-2 text-sm">
              <option value="">All Entities</option>
              {["SALE", "PRODUCT", "STOCK", "CUSTOMER", "ORDER", "EXPENSE", "USER"].map(e =>
                <option key={e} value={e}>{e}</option>)}
            </select>
            <button onClick={loadTab} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Filter</button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Entity</th>
                <th className="px-4 py-3 text-left">Entity ID</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr></thead>
              <tbody>
                {auditLogs.map((log: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{log.action}</span></td>
                    <td className="px-4 py-2">{log.entity}</td>
                    <td className="px-4 py-2 font-mono text-xs">{log.entityId || "-"}</td>
                    <td className="px-4 py-2">{log.userId || "-"}</td>
                    <td className="px-4 py-2 text-xs">{log.ipAddress || "-"}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit logs</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECURITY EVENTS ── */}
      {tab === 1 && !loading && (
        <div>
          {secStats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">Total Events</div><div className="text-2xl font-bold">{secStats.totalEvents || 0}</div></div>
              <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">Blocked IPs</div><div className="text-2xl font-bold text-orange-600">{secStats.blocked || 0}</div></div>
              <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">Critical</div><div className="text-2xl font-bold text-red-600">{secStats.critical || 0}</div></div>
              <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">Failed Logins</div><div className="text-2xl font-bold text-yellow-600">{secStats.failedLogins || 0}</div></div>
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <select value={secFilter.severity} onChange={e => setSecFilter(f => ({ ...f, severity: e.target.value }))}
              className="border rounded px-3 py-2 text-sm">
              <option value="">All Severities</option>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={secFilter.eventType} onChange={e => setSecFilter(f => ({ ...f, eventType: e.target.value }))}
              className="border rounded px-3 py-2 text-sm">
              <option value="">All Event Types</option>
              {["LOGIN_FAILED", "SQL_INJECTION_ATTEMPT", "XSS_ATTEMPT", "RATE_LIMIT", "PRIVILEGE_ESCALATION", "SUSPICIOUS_ACTIVITY"].map(t =>
                <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={loadTab} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Filter</button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-left">IP Address</th>
                <th className="px-4 py-3 text-left">Details</th>
              </tr></thead>
              <tbody>
                {secEvents.map((ev: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{new Date(ev.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{ev.eventType}</span></td>
                    <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs font-medium ${sevColor(ev.severity)}`}>{ev.severity}</span></td>
                    <td className="px-4 py-2 font-mono text-xs">{ev.ipAddress || "-"}</td>
                    <td className="px-4 py-2 text-xs max-w-xs truncate">{ev.details ? JSON.stringify(ev.details) : "-"}</td>
                  </tr>
                ))}
                {secEvents.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No security events</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECURITY HEALTH ── */}
      {tab === 2 && !loading && health && (
        <div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Security Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Risk Level</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${riskColor(health.riskLevel)}`}>{health.riskLevel}</span>
                </div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">Total Events</span><span className="font-medium">{health.totalEvents || 0}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">Critical Events</span><span className="font-medium text-red-600">{health.criticalEvents || 0}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">Failed Logins</span><span className="font-medium">{health.failedLogins || 0}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">Injection Attempts</span><span className="font-medium text-red-600">{health.injectionAttempts || 0}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Recommendations</h3>
              <ul className="space-y-2">
                {(health.recommendations || []).map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === 3 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Security Settings</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex justify-between items-center py-2 border-b">
              <span>Rate Limiting</span><span className="text-green-600 font-medium">Active (200 req/min)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>SQL Injection Detection</span><span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>XSS Protection</span><span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>Security Headers</span><span className="text-green-600 font-medium">Active (HSTS, CSP, X-Frame-Options)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>Audit Logging</span><span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Tenant Isolation</span><span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
