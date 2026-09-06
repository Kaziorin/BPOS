'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const CATEGORIES = ['PAYMENT', 'SMS', 'EMAIL', 'ACCOUNTING', 'MARKETPLACE', 'LOGISTICS', 'POS'];
const CAT_COLORS: Record<string, string> = {
  PAYMENT: 'bg-green-100 text-green-800', SMS: 'bg-blue-100 text-blue-800',
  EMAIL: 'bg-purple-100 text-purple-800', ACCOUNTING: 'bg-yellow-100 text-yellow-800',
  MARKETPLACE: 'bg-orange-100 text-orange-800', LOGISTICS: 'bg-red-100 text-red-800',
  POS: 'bg-gray-100 text-gray-800',
};
const WEBHOOK_EVENTS = [
  'invoice.created', 'invoice.paid', 'order.created', 'order.completed',
  'payment.received', 'stock.low', 'customer.created', 'installment.due',
  'commission.generated', 'sync.failed', 'delivery.completed',
];

export default function IntegrationsPage() {
  const [tab, setTab] = useState<'marketplace' | 'webhooks' | 'api-keys' | 'workflow'>('marketplace');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Integrations & API Management</h1>
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {([['marketplace', '🛒 Marketplace'], ['webhooks', '🔔 Webhooks'], ['api-keys', '🔑 API Keys'], ['workflow', '⚙️ Workflow Builder']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap ${tab === k ? 'bg-white border border-b-0 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'marketplace' && <MarketplaceTab />}
      {tab === 'webhooks' && <WebhooksTab />}
      {tab === 'api-keys' && <APIKeysTab />}
      {tab === 'workflow' && <WorkflowTab />}
    </div>
  );
}

// ═══════════════ MARKETPLACE ═══════════════
function MarketplaceTab() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [enabled, setEnabled] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const load = async () => {
    const [catRes, enRes] = await Promise.all([api.get('/api/v1/integrations/catalog'), api.get('/api/v1/integrations')]);
    setCatalog(catRes.data?.data || []);
    setEnabled(enRes.data?.data || []);
  };
  useEffect(() => { load(); }, []);

  const enabledCodes = new Set(enabled.map((e: any) => e.code));
  const toggle = async (code: string, isOn: boolean) => {
    if (isOn) { await api.post(`/api/v1/integrations/${code}/disable`); }
    else { await api.post(`/api/v1/integrations/${code}/enable`, { config: {} }); }
    load();
  };

  const filtered = filter ? catalog.filter((c: any) => c.category === filter) : catalog;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1 rounded text-sm ${!filter ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded text-sm ${filter === c ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{c}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item: any) => (
          <div key={item.code} className="bg-white rounded-lg border p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${CAT_COLORS[item.category] || 'bg-gray-100'}`}>{item.category}</span>
              </div>
              <button onClick={() => toggle(item.code, enabledCodes.has(item.code))}
                className={`w-12 h-6 rounded-full relative transition-colors ${enabledCodes.has(item.code) ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabledCodes.has(item.code) ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2 flex-1">{item.description}</p>
            {enabledCodes.has(item.code) && <span className="text-xs text-green-600 mt-2">✓ Enabled</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════ WEBHOOKS ═══════════════
function WebhooksTab() {
  const [subs, setSubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', events: [] as string[], description: '' });

  const load = async () => {
    const [s, e, st] = await Promise.all([api.get('/api/v1/webhooks'), api.get('/api/v1/webhooks/events'), api.get('/api/v1/webhooks/stats')]);
    setSubs(s.data?.data || []);
    setEvents(e.data?.data || []);
    setStats(st.data?.data || {});
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.url || form.events.length === 0) return;
    await api.post('/api/v1/webhooks', form);
    setShowForm(false); setForm({ url: '', events: [], description: '' });
    load();
  };
  const toggleEvent = (e: string) => {
    setForm(f => ({ ...f, events: f.events.includes(e) ? f.events.filter(x => x !== e) : [...f.events, e] }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded border p-3 text-center"><div className="text-2xl font-bold">{stats.activeSubscriptions || 0}</div><div className="text-xs text-gray-500">Active Subscriptions</div></div>
        <div className="bg-white rounded border p-3 text-center"><div className="text-2xl font-bold text-green-600">{stats.success || 0}</div><div className="text-xs text-gray-500">Delivered</div></div>
        <div className="bg-white rounded border p-3 text-center"><div className="text-2xl font-bold text-red-600">{stats.failed || 0}</div><div className="text-xs text-gray-500">Failed</div></div>
        <div className="bg-white rounded border p-3 text-center"><div className="text-2xl font-bold">{stats.successRate || 0}%</div><div className="text-xs text-gray-500">Success Rate</div></div>
      </div>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Subscriptions</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">+ New Webhook</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <input placeholder="https://your-server.com/webhook" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
          <input placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Events:</div>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map(e => (
                <button key={e} onClick={() => toggleEvent(e)} className={`px-2 py-1 rounded text-xs ${form.events.includes(e) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-1.5 bg-green-600 text-white rounded text-sm">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-gray-200 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">URL</th><th className="px-4 py-2 text-left">Events</th><th className="px-4 py-2 text-center">Active</th></tr></thead>
          <tbody>
            {subs.map((s: any) => (
              <tr key={s.id} className="border-t"><td className="px-4 py-2 font-mono text-xs truncate max-w-xs">{s.url}</td>
                <td className="px-4 py-2 text-xs">{Array.isArray(s.events) ? s.events.join(', ') : ''}</td>
                <td className="px-4 py-2 text-center">{s.isActive ? '✅' : '❌'}</td></tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No webhooks configured</td></tr>}
          </tbody>
        </table>
      </div>
      <h3 className="font-semibold">Recent Events</h3>
      <div className="bg-white rounded-lg border overflow-hidden max-h-60 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-2 text-left">Event</th><th className="px-4 py-2 text-center">Status</th><th className="px-4 py-2 text-center">Attempts</th><th className="px-4 py-2 text-left">Time</th></tr></thead>
          <tbody>
            {events.map((e: any) => (
              <tr key={e.id} className="border-t"><td className="px-4 py-2 text-xs font-mono">{e.eventType}</td>
                <td className="px-4 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${e.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : e.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{e.status}</span></td>
                <td className="px-4 py-2 text-center text-xs">{e.attemptCount}/{e.maxAttempts}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</td></tr>
            ))}
            {events.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No events yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════ API KEYS ═══════════════
function APIKeysTab() {
  const [keys, setKeys] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', scopes: [] as string[], expiresInDays: 365 });
  const [newKey, setNewKey] = useState('');

  const ALL_SCOPES = ['sales.read','sales.write','products.read','products.write','customers.read','customers.write',
    'invoices.read','invoices.write','orders.read','orders.write','payments.read','payments.write',
    'reports.read','delivery.read','delivery.write','webhooks.manage','integrations.manage','admin.full'];

  const load = async () => { const r = await api.get('/api/v1/api-keys'); setKeys(r.data?.data || []); };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || form.scopes.length === 0) return;
    const r = await api.post('/api/v1/api-keys', form);
    if (r.data?.data?.key) setNewKey(r.data.data.key);
    setShowForm(false); setForm({ name: '', scopes: [], expiresInDays: 365 });
    load();
  };
  const revoke = async (id: string) => { await api.post(`/api/v1/api-keys/${id}/revoke`, { reason: 'Manual revoke' }); load(); };

  return (
    <div className="space-y-4">
      {newKey && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm font-medium text-yellow-800">🔑 Your new API key (save it now — won't be shown again):</div>
          <code className="block mt-2 p-2 bg-white rounded text-xs break-all">{newKey}</code>
          <button onClick={() => setNewKey('')} className="mt-2 text-xs text-yellow-600">Dismiss</button>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">API Keys</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">+ New Key</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <input placeholder="Key name (e.g. Zapier Integration)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Scopes:</div>
            <div className="flex flex-wrap gap-2">
              {ALL_SCOPES.map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter(x => x !== s) : [...f.scopes, s] }))}
                  className={`px-2 py-1 rounded text-xs ${form.scopes.includes(s) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-1.5 bg-green-600 text-white rounded text-sm">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-gray-200 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Prefix</th><th className="px-4 py-2 text-left">Scopes</th><th className="px-4 py-2 text-center">Status</th><th className="px-4 py-2 text-left">Created</th><th className="px-4 py-2 text-center">Action</th></tr></thead>
          <tbody>
            {keys.map((k: any) => (
              <tr key={k.id} className="border-t">
                <td className="px-4 py-2 font-medium">{k.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{k.keyPrefix}...</td>
                <td className="px-4 py-2 text-xs">{Array.isArray(k.scopes) ? k.scopes.slice(0, 3).join(', ') + (k.scopes.length > 3 ? '...' : '') : ''}</td>
                <td className="px-4 py-2 text-center">{k.revokedAt ? <span className="text-red-600 text-xs">Revoked</span> : k.isActive ? <span className="text-green-600 text-xs">Active</span> : <span className="text-gray-400 text-xs">Inactive</span>}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-center">{!k.revokedAt && <button onClick={() => revoke(k.id)} className="text-xs text-red-600 hover:underline">Revoke</button>}</td>
              </tr>
            ))}
            {keys.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No API keys</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════ WORKFLOW BUILDER ═══════════════
function WorkflowTab() {
  const [rules, setRules] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', entityType: 'EXPENSE', conditions: { field: 'amount', operator: 'gte', value: 5000 }, approvers: [{ level: 1, roleName: 'Manager', required: true }], escalationHours: 24, notifyChannels: ['IN_APP'], priority: 100, description: '' });

  const load = async () => {
    const [r, et] = await Promise.all([api.get('/api/v1/workflow-builder/rules'), api.get('/api/v1/workflow-builder/entity-types')]);
    setRules(r.data?.data || []);
    setEntityTypes(et.data?.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.entityType) return;
    await api.post('/api/v1/workflow-builder/rules', form);
    setShowForm(false); load();
  };
  const toggleRule = async (id: string, isActive: boolean) => {
    await api.patch(`/api/v1/workflow-builder/rules/${id}`, { isActive: !isActive });
    load();
  };
  const deleteRule = async (id: string) => {
    await api.delete(`/api/v1/workflow-builder/rules/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Approval Rules (no code changes needed)</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">+ New Rule</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Rule name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
            <select value={form.entityType} onChange={e => setForm(f => ({ ...f, entityType: e.target.value }))} className="border rounded px-3 py-2 text-sm">
              {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">Condition field</label>
              <input value={form.conditions.field} onChange={e => setForm(f => ({ ...f, conditions: { ...f.conditions, field: e.target.value } }))} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Operator</label>
              <select value={form.conditions.operator} onChange={e => setForm(f => ({ ...f, conditions: { ...f.conditions, operator: e.target.value } }))} className="w-full border rounded px-3 py-1.5 text-sm">
                {['gte', 'lte', 'eq', 'gt', 'lt', 'contains'].map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Value</label>
              <input type="number" value={form.conditions.value} onChange={e => setForm(f => ({ ...f, conditions: { ...f.conditions, value: Number(e.target.value) } }))} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Approver Role</label>
              <input value={form.approvers[0]?.roleName || ''} onChange={e => setForm(f => ({ ...f, approvers: [{ ...f.approvers[0], roleName: e.target.value }] }))} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Escalation (hours)</label>
              <input type="number" value={form.escalationHours} onChange={e => setForm(f => ({ ...f, escalationHours: Number(e.target.value) }))} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-1.5 bg-green-600 text-white rounded text-sm">Create Rule</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-gray-200 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Rule</th><th className="px-4 py-2 text-left">Entity</th><th className="px-4 py-2 text-left">Condition</th><th className="px-4 py-2 text-left">Approver</th><th className="px-4 py-2 text-center">Active</th><th className="px-4 py-2 text-center">Actions</th></tr></thead>
          <tbody>
            {rules.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-xs"><span className="bg-gray-100 px-2 py-0.5 rounded">{r.entityType}</span></td>
                <td className="px-4 py-2 text-xs font-mono">{r.conditions?.field} {r.conditions?.operator} {r.conditions?.value}</td>
                <td className="px-4 py-2 text-xs">{Array.isArray(r.approvers) ? r.approvers.map((a: any) => a.roleName).join(', ') : ''}</td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => toggleRule(r.id, r.isActive)} className={`w-10 h-5 rounded-full relative transition-colors ${r.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${r.isActive ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => deleteRule(r.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No workflow rules. Create one to start approving changes automatically.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
