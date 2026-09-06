'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

const DEVICE_ICONS: Record<string, string> = {
  THERMAL_PRINTER: '🖨️', A4_PRINTER: '📄', BARCODE_SCANNER: '📷',
  CASH_DRAWER: '💰', CUSTOMER_DISPLAY: '🖥️', WEIGHING_SCALE: '⚖️',
  LABEL_PRINTER: '🏷️', KDS_DISPLAY: '🍳', KIOSK: '📱', QR_SCANNER: '📱',
};
const STATUS_COLORS: Record<string, string> = {
  ONLINE: 'bg-green-100 text-green-800', OFFLINE: 'bg-gray-100 text-gray-800',
  ERROR: 'bg-red-100 text-red-800', MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-blue-100 text-blue-800', PROCESSING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800', FAILED: 'bg-red-100 text-red-800',
};

export default function HardwarePage() {
  const [tab, setTab] = useState<'devices' | 'jobs' | 'scanner' | 'realtime'>('devices');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hardware & Real-Time Engine</h1>
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {([['devices', '🖨️ Devices'], ['jobs', '📋 Jobs'], ['scanner', '📷 Scanner'], ['realtime', '⚡ Real-Time']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap ${tab === k ? 'bg-white border border-b-0 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'devices' && <DevicesTab />}
      {tab === 'jobs' && <JobsTab />}
      {tab === 'scanner' && <ScannerTab />}
      {tab === 'realtime' && <RealtimeTab />}
    </div>
  );
}

function DevicesTab() {
  const [devices, setDevices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<any>({});
  const [form, setForm] = useState({ name: '', deviceType: 'THERMAL_PRINTER', driver: 'mock', connectionType: 'VIRTUAL', connectionConfig: {} });

  const load = async () => {
    const [d, dt] = await Promise.all([api.get('/api/v1/hardware/devices'), api.get('/api/v1/hardware/device-types')]);
    setDevices(d.data?.data || []);
    setDeviceTypes(dt.data?.data || {});
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) return;
    await api.post('/api/v1/hardware/devices', form);
    setShowForm(false); load();
  };
  const toggle = async (id: string, status: string) => {
    await api.patch(`/api/v1/hardware/devices/${id}`, { status: status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Registered Devices</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">+ Register Device</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Device Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
            <select value={form.deviceType} onChange={e => setForm(f => ({ ...f, deviceType: e.target.value, driver: (deviceTypes[e.target.value]?.drivers || [])[0] || 'mock' }))} className="border rounded px-3 py-2 text-sm">
              {Object.keys(deviceTypes).map(t => <option key={t} value={t}>{DEVICE_ICONS[t] || '📦'} {t}</option>)}
            </select>
            <select value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} className="border rounded px-3 py-2 text-sm">
              {(deviceTypes[form.deviceType]?.drivers || []).map((d: string) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={form.connectionType} onChange={e => setForm(f => ({ ...f, connectionType: e.target.value }))} className="border rounded px-3 py-2 text-sm">
              {['USB', 'SERIAL', 'NETWORK', 'BLUETOOTH', 'VIRTUAL'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-1.5 bg-green-600 text-white rounded text-sm">Register</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-gray-200 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d: any) => (
          <div key={d.id} className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{DEVICE_ICONS[d.deviceType] || '📦'} {d.name}</h4>
                <p className="text-xs text-gray-500">{d.deviceType} • {d.driver} • {d.connectionType}</p>
              </div>
              <button onClick={() => toggle(d.id, d.status)} className={`w-10 h-5 rounded-full relative transition-colors ${d.status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${d.status === 'ONLINE' ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="mt-2"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[d.status] || ''}`}>{d.status}</span></div>
          </div>
        ))}
        {devices.length === 0 && <div className="col-span-3 bg-white rounded-lg border p-8 text-center text-gray-400">No devices registered. Add printers, scanners, and displays.</div>}
      </div>
    </div>
  );
}

function JobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const load = async () => { const r = await api.get('/api/v1/hardware/jobs'); setJobs(r.data?.data || []); };
  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr>
          <th className="px-4 py-2 text-left">Job ID</th><th className="px-4 py-2 text-left">Type</th>
          <th className="px-4 py-2 text-left">Device</th><th className="px-4 py-2 text-center">Status</th>
          <th className="px-4 py-2 text-left">Created</th>
        </tr></thead>
        <tbody>
          {jobs.map((j: any) => (
            <tr key={j.id} className="border-t">
              <td className="px-4 py-2 font-mono text-xs">{j.id.slice(0, 8)}</td>
              <td className="px-4 py-2 text-xs">{j.jobType}</td>
              <td className="px-4 py-2 text-xs">{j.deviceType}</td>
              <td className="px-4 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[j.status] || ''}`}>{j.status}</span></td>
              <td className="px-4 py-2 text-xs text-gray-500">{new Date(j.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {jobs.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No jobs yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ScannerTab() {
  const [code, setCode] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const process = async () => {
    if (!code) return;
    const r = await api.post('/api/v1/hardware/scan/process', { code });
    setResults(prev => [r.data?.data, ...prev].slice(0, 20));
    setCode('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Barcode / QR Scanner</h3>
        <div className="flex gap-3">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Scan or type barcode..." onKeyDown={e => e.key === 'Enter' && process()}
            className="flex-1 border rounded px-3 py-2 text-sm" autoFocus />
          <button onClick={process} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Process</button>
        </div>
      </div>
      {results.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Code</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-center">Status</th></tr></thead>
            <tbody>
              {results.map((r: any, i: number) => (
                <tr key={i} className="border-t"><td className="px-4 py-2 font-mono text-xs">{r.code}</td><td className="px-4 py-2 text-xs">{r.type}</td><td className="px-4 py-2 text-center text-xs text-green-600">{r.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RealtimeTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [channel, setChannel] = useState('KDS');
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    api.get('/api/v1/realtime/stats').then(r => setStats(r.data?.data || {}));
    api.get('/api/v1/realtime/events?limit=20').then(r => setEvents(r.data?.data || []));
  }, []);

  const connect = () => {
    if (esRef.current) { esRef.current.close(); setConnected(false); }
    const es = new EventSource(`/api/v1/realtime/stream?channel=${channel}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents(prev => [data, ...prev].slice(0, 50));
      } catch {}
    };
    es.onerror = () => setConnected(false);
    es.onopen = () => setConnected(true);
    esRef.current = es;
  };

  const disconnect = () => {
    esRef.current?.close(); setConnected(false);
  };

  const publishTest = async () => {
    await api.post('/api/v1/realtime/publish', { channel, eventType: 'TEST_EVENT', payload: { message: 'Hello from real-time engine!' } });
    api.get('/api/v1/realtime/events?limit=20').then(r => setEvents(r.data?.data || []));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded border p-3 text-center"><div className="text-2xl font-bold">{stats.activeChannels || 0}</div><div className="text-xs text-gray-500">Channels</div></div>
        <div className="bg-white rounded border p-3 text-center"><div className="text-2xl font-bold text-green-600">{stats.eventsToday || 0}</div><div className="text-xs text-gray-500">Events Today</div></div>
        <div className="bg-white rounded border p-3 text-center"><div className="text-2xl font-bold">{connected ? '🟢' : '🔴'}</div><div className="text-xs text-gray-500">{connected ? 'Connected' : 'Disconnected'}</div></div>
      </div>
      <div className="flex items-center gap-3">
        <select value={channel} onChange={e => setChannel(e.target.value)} className="border rounded px-3 py-2 text-sm">
          {['KDS', 'DASHBOARD', 'SYNC', 'DELIVERY', 'INVENTORY', 'POS'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={connect} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Connect SSE</button>
        <button onClick={disconnect} className="px-4 py-2 bg-gray-200 rounded text-sm">Disconnect</button>
        <button onClick={publishTest} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Publish Test Event</button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-2 text-left">Event</th><th className="px-4 py-2 text-left">Channel</th><th className="px-4 py-2 text-left">Time</th></tr></thead>
          <tbody>
            {events.map((e: any, i: number) => (
              <tr key={i} className="border-t"><td className="px-4 py-2 text-xs font-mono">{e.eventType || e.type}</td><td className="px-4 py-2 text-xs">{e.channelType || e.channel}</td><td className="px-4 py-2 text-xs text-gray-500">{new Date(e.timestamp || e.createdAt).toLocaleTimeString()}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
