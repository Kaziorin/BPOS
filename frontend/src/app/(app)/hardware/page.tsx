'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import {
  Printer,
  FileText,
  ScanBarcode,
  DollarSign,
  Tv,
  Scale,
  Tag,
  UtensilsCrossed,
  Tablet,
  QrCode,
  Package,
  Activity,
  Radio,
  Cpu,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

const DEVICE_ICON_MAP: Record<string, any> = {
  THERMAL_PRINTER: Printer,
  A4_PRINTER: FileText,
  BARCODE_SCANNER: ScanBarcode,
  CASH_DRAWER: DollarSign,
  CUSTOMER_DISPLAY: Tv,
  WEIGHING_SCALE: Scale,
  LABEL_PRINTER: Tag,
  KDS_DISPLAY: UtensilsCrossed,
  KIOSK: Tablet,
  QR_SCANNER: QrCode,
};

function DeviceIcon({ type, className = "w-5 h-5 text-gray-600" }: { type: string; className?: string }) {
  const Icon = DEVICE_ICON_MAP[type] || Package;
  return <Icon className={className} />;
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OFFLINE: 'bg-gray-100 text-gray-700 border-gray-200',
  ERROR: 'bg-rose-50 text-rose-700 border-rose-200',
  MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-sky-50 text-sky-700 border-sky-200',
  PROCESSING: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function HardwarePage() {
  const [tab, setTab] = useState<'devices' | 'jobs' | 'scanner' | 'realtime'>('devices');
  const tabs = [
    { id: 'devices', label: 'Devices', icon: Printer },
    { id: 'jobs', label: 'Print & Action Jobs', icon: FileText },
    { id: 'scanner', label: 'Barcode Scanner', icon: ScanBarcode },
    { id: 'realtime', label: 'Real-Time SSE', icon: Radio },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hardware & Real-Time Engine</h1>
        <p className="text-sm text-gray-500 mt-1">Manage physical peripherals, thermal printers, scanners, and live SSE event streams.</p>
      </div>
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
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
              {Object.keys(deviceTypes).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} className="border rounded px-3 py-2 text-sm">
              {(deviceTypes[form.deviceType]?.drivers || []).map((d: string) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={form.connectionType} onChange={e => setForm(f => ({ ...f, connectionType: e.target.value }))} className="border rounded px-3 py-2 text-sm">
              {['USB', 'SERIAL', 'NETWORK', 'BLUETOOTH', 'VIRTUAL'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Register</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d: any) => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <DeviceIcon type={d.deviceType} className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{d.name}</h4>
                  <p className="text-xs text-gray-500">{d.deviceType} • {d.driver} • {d.connectionType}</p>
                </div>
              </div>
              <button onClick={() => toggle(d.id, d.status)} className={`w-10 h-5 rounded-full relative transition-colors ${d.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${d.status === 'ONLINE' ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-700'}`}>{d.status}</span>
              <span className="text-[11px] text-gray-400 font-mono">ID: {d.id?.slice(0, 8)}</span>
            </div>
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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{stats.activeChannels || 0}</div>
          <div className="text-xs text-gray-500 mt-0.5">Active Channels</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{stats.eventsToday || 0}</div>
          <div className="text-xs text-gray-500 mt-0.5">Events Today</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-lg font-bold">
            {connected ? (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300"></span>
                Disconnected
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Live Stream Status</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select value={channel} onChange={e => setChannel(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {['KDS', 'DASHBOARD', 'SYNC', 'DELIVERY', 'INVENTORY', 'POS'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={connect} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">Connect SSE</button>
        <button onClick={disconnect} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">Disconnect</button>
        <button onClick={publishTest} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">Publish Test Event</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Event</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Channel</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Time</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e: any, i: number) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-2 text-xs font-mono text-blue-600 font-medium">{e.eventType || e.type}</td>
                <td className="px-4 py-2 text-xs text-gray-700">{e.channelType || e.channel}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{new Date(e.timestamp || e.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-xs text-gray-400">No events received yet. Click Connect SSE or Publish Test Event.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
