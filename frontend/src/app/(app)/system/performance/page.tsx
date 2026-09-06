"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

const TABS = ["Observability", "Background Jobs", "Cache", "Performance", "Backup & DR"];

function Stat({ label, value, sub, tone = "default" }: { label: string; value: any; sub?: string; tone?: string }) {
  const tones: Record<string, string> = {
    default: "text-gray-900", ok: "text-green-600", warn: "text-yellow-600", bad: "text-red-600",
  };
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tones[tone] ?? tones.default}`}>{value ?? "-"}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function Indicator({ ind, name }: { ind: any; name: string }) {
  const color = ind?.ok ? "bg-green-500" : "bg-red-500";
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-start gap-3">
      <span className={`mt-1 h-3 w-3 rounded-full shrink-0 ${color} ${ind?.ok ? "" : "animate-pulse"}`} />
      <div className="min-w-0">
        <div className="text-xs text-gray-500 uppercase tracking-wide">{ind?.label ?? name}</div>
        <div className="text-sm font-medium mt-0.5 break-words">{ind?.detail ?? "unknown"}</div>
      </div>
    </div>
  );
}

function Badge({ ok }: { ok: boolean }) {
  return ok
    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ target met</span>
    : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">✗ over target</span>;
}

function StatusChip({ s }: { s: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700", VERIFIED: "bg-blue-100 text-blue-700",
    RESTORED: "bg-indigo-100 text-indigo-700", RUNNING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-gray-100 text-gray-600"}`}>{s}</span>;
}

export default function SystemPerformancePage() {
  const [tab, setTab] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobStats, setJobStats] = useState<any>(null);
  const [cache, setCache] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string>("");
  const [auto, setAuto] = useState(true);
  const [restoreDb, setRestoreDb] = useState("");

  const load = useCallback(async () => {
    try {
      if (tab === 0) {
        const [m, h] = await Promise.all([
          api.get<any>("/v1/system/metrics"),
          api.get<any>("/v1/system/health"),
        ]);
        setMetrics(m.data);
        setHealth(h.data);
      }
      if (tab === 1) {
        const [js, jst] = await Promise.all([
          api.get<any>("/v1/system/jobs?limit=100"),
          api.get<any>("/v1/system/jobs/stats"),
        ]);
        setJobs(js.data || []);
        setJobStats(jst.data || {});
      }
      if (tab === 2) {
        const c = await api.get<any>("/v1/system/cache/stats");
        setCache(c.data);
      }
      if (tab === 3) {
        const [p, c] = await Promise.all([
          api.get<any>("/v1/system/performance"),
          api.get<any>("/v1/system/cache/stats"),
        ]);
        setPerf(p.data);
        setCache(c.data);
      }
      if (tab === 4) {
        const b = await api.get<any>("/v1/system/backups");
        setBackups(b.data || []);
      }
    } catch (e: any) {
      console.error(e);
      setNotice(e?.message || "Failed to load");
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!auto || tab === 2 || tab === 4) return;
    const iv = setInterval(load, 7000);
    return () => clearInterval(iv);
  }, [auto, tab, load]);

  async function action(fn: () => Promise<any>, msg: string, thenLoad = true) {
    try {
      setLoading(true);
      const r = await fn();
      setNotice(`${msg} — ${JSON.stringify(r?.data ?? r ?? {}).slice(0, 160)}`);
      if (thenLoad) await load();
    } catch (e: any) {
      setNotice(e?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (d: string) => (d ? new Date(d).toLocaleString() : "-");
  const inds = (metrics?.indicators ?? health?.indicators ?? {}) as Record<string, any>;
  const lat = metrics?.api ?? {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">⚡ System — Observability, Performance & Backup</h1>
      <p className="text-sm text-gray-500 mb-5">Live health dashboard + background jobs + backups (Prompts 39–40 · spec §25–26)</p>

      <div className="flex flex-wrap items-center gap-3 mb-5 border-b pb-2">
        <div className="flex gap-2">
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium ${tab === i ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1 text-xs text-gray-500">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> auto-refresh 7s
        </label>
      </div>

      {notice && <div className="mb-4 text-xs bg-blue-50 text-blue-700 rounded px-3 py-2">{notice}</div>}
      {loading && <div className="text-gray-500 py-2 text-sm">Loading...</div>}

      {/* ═══════════ OBSERVABILITY ═══════════ */}
      {tab === 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {Object.keys(inds).length > 0 && Object.entries(inds).map(([k, v]: any) => (
              <Indicator key={k} ind={v} name={k} />
            ))}
          </div>

          {metrics && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Stat label="API p95" value={`${lat?.p95Ms ?? "-"} ms`} tone={(lat?.p95Ms ?? 0) <= 300 ? "ok" : "warn"} sub={`p50 ${lat?.p50Ms ?? "-"} ms · p99 ${lat?.p99Ms ?? "-"} ms`} />
                <Stat label="Requests" value={lat?.requestCount ?? 0} sub={`5xx ${lat?.error5xx ?? 0} · 4xx ${lat?.error4xx ?? 0} (rate ${lat?.errorRate5xx ?? 0}%)`} tone={(lat?.error5xx ?? 0) === 0 ? "ok" : "bad"} />
                <Stat label="Worker processed" value={metrics.worker?.processed ?? 0} sub={`failed ${metrics.worker?.failed ?? 0} · polls ${metrics.worker?.queuePolls ?? 0}`} />
                <Stat label="Cache entries" value={metrics.cache?.size ?? 0} sub={`hit rate ${metrics.cache?.hitRate ?? 0}% · ${metrics.cache?.invalidations ?? 0} invalidations`} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Stat label="CPU load" value={`${metrics.sys?.loadAvg?.["1m"] ?? "-"}`} sub={`5m ${metrics.sys?.loadAvg?.["5m"] ?? "-"} · 15m ${metrics.sys?.loadAvg?.["15m"] ?? "-"}`} />
                <Stat label="Memory" value={`${metrics.sys?.memUsedPercent ?? "-"}%`} sub={`${metrics.sys?.memAvailableMb ?? "-"} MB free of ${metrics.sys?.memTotalMb ?? "-"} MB`} />
                <Stat label="App RSS" value={`${metrics.sys?.processRssMb ?? "-"} MB`} sub={`server up ${Math.round((metrics.sys?.uptimeSec ?? 0) / 60)} min`} />
                <Stat label="Disk (root)" value={`${metrics.sys?.disk?.freeGb ?? "-"} GB free`} tone={(metrics.sys?.disk?.freeGb ?? 1) > 1 ? "ok" : "bad"} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Stat label="Sync devices" value={metrics.sync?.devices ?? 0} sub={`${metrics.sync?.active ?? 0} active · ${metrics.sync?.stale ?? 0} stale · ${metrics.sync?.syncedToday ?? 0} synced today`} />
                <Stat label="Sync pending/failed" value={`${metrics.sync?.pending ?? 0}/${metrics.sync?.failed ?? 0}`} tone={(metrics.sync?.failed ?? 0) === 0 ? "default" : "bad"} sub={`${metrics.sync?.conflicts ?? 0} conflicts`} />
                <Stat label="Notif failures (24h)" value={metrics.notifications?.failed24h ?? 0} tone={(metrics.notifications?.failed24h ?? 0) === 0 ? "ok" : "bad"} sub={`${metrics.notifications?.attempted24h ?? 0} attempted · ${metrics.notifications?.unreadInApp ?? 0} unread in-app`} />
                <Stat label="Backups on disk" value={metrics.backups?.count ?? 0} sub={`retention ${metrics.storage?.retention ?? 30}`} />
              </div>

              {metrics.sync?.deviceRows?.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
                  <div className="px-4 pt-4 pb-2 text-sm font-semibold">Devices</div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-3 py-2 text-left">Device</th><th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Last sync</th><th className="px-3 py-2 text-left">Pending</th>
                      <th className="px-3 py-2 text-left">Failed</th>
                    </tr></thead>
                    <tbody>
                      {metrics.sync.deviceRows.map((d: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs">{d.deviceId}</td>
                          <td className="px-3 py-2 text-xs"><span className={d.stale ? "text-red-600 font-medium" : "text-green-600"}>{d.stale ? "STALE" : d.status}</span>{d.isLocked ? " 🔒" : ""}</td>
                          <td className="px-3 py-2 text-xs">{d.lastSyncAt ?? "never"}</td>
                          <td className="px-3 py-2 text-xs">{d.pendingCount}</td>
                          <td className="px-3 py-2 text-xs">{d.failedCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════ BACKGROUND JOBS ═══════════ */}
      {tab === 1 && jobStats && (
        <div>
          <div className="flex flex-wrap gap-3 mb-6">
            <Stat label="Queued" value={jobStats.byStatus?.find((s: any) => s.status === "QUEUED")?.count ?? 0} />
            <Stat label="Running" value={jobStats.byStatus?.find((s: any) => s.status === "RUNNING")?.count ?? 0} tone="warn" />
            <Stat label="Succeeded" value={jobStats.byStatus?.find((s: any) => s.status === "SUCCEEDED")?.count ?? 0} tone="ok" />
            <Stat label="Failed" value={jobStats.byStatus?.find((s: any) => s.status === "FAILED")?.count ?? 0} tone={(jobStats.byStatus?.find((s: any) => s.status === "FAILED")?.count ?? 0) > 0 ? "bad" : "default"} />
          </div>

          <div className="flex gap-3 mb-4">
            <button disabled={loading} onClick={() => action(() =>
              api.post("/v1/system/jobs/enqueue", { type: "notification", payload: { title: "Demo job", body: "Triggered from the dashboard", eventType: "QUEUE_NOTIFICATION", userId: null } }), "Enqueued demo notification job")}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">Enqueue demo job</button>
            <button onClick={load} className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200">Refresh</button>
          </div>

          {jobStats.byType?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h3 className="font-semibold text-sm mb-3">By type</h3>
              <div className="flex flex-wrap gap-2">
                {jobStats.byType.map((t: any, i: number) => (
                  <span key={i} className="text-xs bg-gray-100 rounded px-2 py-1">
                    <b>{t.type}</b>: {t.count} ({t.succeeded} ok / {t.failed} failed)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Attempts</th><th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Finished</th><th className="px-3 py-2 text-left">Error / Result</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr></thead>
              <tbody>
                {jobs.map((j: any) => (
                  <tr key={j.id} className="border-t hover:bg-gray-50 align-top">
                    <td className="px-3 py-2 font-mono text-xs">{j.type}</td>
                    <td className="px-3 py-2"><StatusChip s={j.status} /></td>
                    <td className="px-3 py-2 text-xs">{j.attempts}/{j.maxAttempts}</td>
                    <td className="px-3 py-2 text-xs">{fmt(j.createdAt)}</td>
                    <td className="px-3 py-2 text-xs">{j.finishedAt ? fmt(j.finishedAt) : "-"}</td>
                    <td className="px-3 py-2 text-xs max-w-xs truncate text-gray-500">
                      {j.lastError || (j.result ? JSON.stringify(j.result).slice(0, 90) : "-")}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {(j.status === "FAILED" || j.status === "CANCELLED") && (
                        <button onClick={() => action(() => api.post(`/v1/system/jobs/${j.id}/retry`), "Retried")}
                          className="text-blue-600 hover:underline mr-2">retry</button>
                      )}
                      {j.status === "QUEUED" && (
                        <button onClick={() => action(() => api.post(`/v1/system/jobs/${j.id}/cancel`), "Cancelled")}
                          className="text-red-600 hover:underline">cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No jobs yet — enqueue one or wait for a scheduled pass (recurring expenses, scheduled reports, webhook retries, daily backup)</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ CACHE ═══════════ */}
      {tab === 2 && cache && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Stat label="Entries" value={cache.size} />
            <Stat label="Hits" value={cache.hits} tone="ok" />
            <Stat label="Misses" value={cache.misses} />
            <Stat label="Hit rate" value={`${cache.hitRate}%`} />
            <Stat label="Invalidations" value={cache.invalidations} />
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold mb-2">Never-cache financial data ✓</h3>
            <p className="text-sm text-gray-500 mb-3">
              Financial source-of-truth (sales, invoices, payments, GL, ledgers) is never stored in the cache — the namespace whitelist refuses it.
              {cache.financialNamespacesCached?.length === 0
                ? " No financial namespace is cached."
                : ` ⚠ ${cache.financialNamespacesCached.join(", ")} IS cached!`}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries((cache.namespaces ?? {}) as Record<string, number>).map(([ns, n]) => (
                <span key={ns} className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-1 font-mono">{ns}: {n}</span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-3">TTL by namespace</h3>
            <div className="flex flex-wrap gap-2 mb-5">
              {Object.entries((cache.ttlSecondsByNamespace ?? {}) as Record<string, number>).map(([ns, ttl]) => (
                <span key={ns} className="text-xs bg-gray-100 rounded px-2 py-1 font-mono">{ns}: {ttl}s</span>
              ))}
            </div>
            <button disabled={loading} onClick={() => action(() => api.post("/v1/system/cache/clear"), "Cache cleared")}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50">Clear entire cache</button>
          </div>
        </div>
      )}

      {/* ═══════════ PERFORMANCE ═══════════ */}
      {tab === 3 && perf && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Stat label="p50" value={`${perf.latency?.p50Ms ?? "-"} ms`} sub="near-instant target" />
            <Stat label="p95" value={`${perf.latency?.p95Ms ?? "-"} ms`} sub="product search ≤ 300 ms" />
            <Stat label="p99" value={`${perf.latency?.p99Ms ?? "-"} ms`} />
            <Stat label="Samples" value={perf.latency?.samples ?? 0} sub={`worker processed ${perf.worker?.processed ?? 0}`} />
          </div>

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="font-semibold text-sm mb-3">§25 targets under current load</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between"><span className="text-gray-500">Product search</span><Badge ok={(perf.latency?.p95Ms ?? 0) <= (perf.targets?.productSearchMs ?? 300)} /></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Cart ops</span><Badge ok={(perf.latency?.p95Ms ?? 0) <= (perf.targets?.cartOpsMs ?? 100)} /></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Checkout</span><Badge ok={(perf.latency?.p95Ms ?? 0) <= (perf.targets?.checkoutMs ?? 800)} /></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h3 className="font-semibold text-sm px-4 pt-4 pb-2">Slowest routes (by total time)</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-2 text-left">Route</th><th className="px-3 py-2 text-left">Calls</th>
                <th className="px-3 py-2 text-left">Avg</th><th className="px-3 py-2 text-left">Worst</th>
                <th className="px-3 py-2 text-left">5xx</th>
              </tr></thead>
              <tbody>
                {(perf.latency?.slowest ?? []).map((r: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{r.route}</td>
                    <td className="px-3 py-2 text-xs">{r.count}</td>
                    <td className="px-3 py-2 text-xs">{r.avgMs} ms</td>
                    <td className="px-3 py-2 text-xs text-red-600">{r.worstMs} ms</td>
                    <td className="px-3 py-2 text-xs">{r.errors5xx ?? 0}</td>
                  </tr>
                ))}
                {(!perf.latency?.slowest || perf.latency.slowest.length === 0) &&
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No traffic recorded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ BACKUP & DR ═══════════ */}
      {tab === 4 && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button disabled={loading} onClick={() => action(() => api.post("/v1/system/backups", {}), "Backup created")}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">🛡 Create FULL backup now</button>
            <button disabled={loading} onClick={() => action(() => api.post("/v1/system/backups/retention"), "Retention enforced")}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50">Enforce retention</button>
            <button onClick={load} className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200">Refresh</button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-2 text-left">File</th><th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Size</th><th className="px-3 py-2 text-left">Tables</th>
                <th className="px-3 py-2 text-left">Trigger</th><th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr></thead>
              <tbody>
                {backups.map((b: any) => (
                  <tr key={b.id} className="border-t hover:bg-gray-50 align-top">
                    <td className="px-3 py-2 font-mono text-xs break-all">{b.fileName}</td>
                    <td className="px-3 py-2"><StatusChip s={b.status} /></td>
                    <td className="px-3 py-2 text-xs">{(b.sizeBytes / 1024).toFixed(0)} KB</td>
                    <td className="px-3 py-2 text-xs">{b.tableCount}</td>
                    <td className="px-3 py-2 text-xs">{b.triggeredBy}</td>
                    <td className="px-3 py-2 text-xs">{fmt(b.createdAt)}</td>
                    <td className="px-3 py-2 text-xs space-x-2">
                      <button disabled={loading} onClick={() => action(() => api.post(`/v1/system/backups/${b.id}/verify`), "Verify report:")}
                        className="text-blue-600 hover:underline disabled:opacity-50">verify</button>
                      <button disabled={loading} onClick={() => action(async () => {
                        const dbName = restoreDb || `restored_${b.id.slice(0, 8)}`;
                        const r = await api.post<any>(`/v1/system/backups/${b.id}/restore`, { targetDb: dbName });
                        setRestoreDb(dbName);
                        return r;
                      }, "Restore drill into:")} className="text-indigo-600 hover:underline disabled:opacity-50">restore drill</button>
                      <button disabled={loading} onClick={() => action(() => api.del(`/v1/system/backups/${b.id}`), "Deleted")}
                        className="text-red-600 hover:underline disabled:opacity-50">delete</button>
                    </td>
                  </tr>
                ))}
                {backups.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No backups yet — create one (automated daily backup also runs via the job queue)</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h3 className="font-semibold mb-2">Restore drill target database</h3>
            <input value={restoreDb} onChange={(e) => setRestoreDb(e.target.value)} placeholder="restored_xxxx (default)"
              className="border rounded px-3 py-2 text-sm w-full max-w-md" />
            <p className="text-xs text-gray-400 mt-2">Restores into a NEW DB (never overwrites the live one). Verify restores to a scratch DB and compares every table with live, then drops it.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-3">Disaster recovery at a glance (§26)</h3>
            <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
              <li><b>Automated:</b> one FULL mysqldump per 24 h via the job queue (backup_full), SHA-256 recorded, newest 30 kept.</li>
              <li><b>Verify:</b> restore-to-scratch compares 195 tables + 20 core tables with live → status VERIFIED = restorable.</li>
              <li><b>Full restore to a working system:</b> restore drill into a target DB, then boot the app against it (db.py migrations self-apply at boot).</li>
              <li><b>Tenant/branch restore:</b> restore dump to scratch, export that tenantId/branchId with mysqldump --where, re-import. Full runbook in <code>DISASTER-RECOVERY.md</code>.</li>
              <li><b>PITR/replication:</b> enable binlog for point-in-time recovery + read replica — steps in the runbook.</li>
              <li><b>Offline durability:</b> device outbox (IndexedDB) + server sync_transactions idempotency survive crash/restart — no lost or duplicate offline sales.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
