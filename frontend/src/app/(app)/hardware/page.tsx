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
  Radio,
  Plus,
  Cpu,
} from 'lucide-react';
import { CustomBreadcrumb } from '@/components/custom/CustomBreadcrumb';
import { CustomTabs } from '@/components/custom/CustomTabs';
import { CustomTable, CustomTableColumn } from '@/components/custom/CustomTable';
import { CustomButton } from '@/components/custom/CustomButton';
import { CustomInput } from '@/components/custom/CustomInput';
import { CustomDropdownSelect } from '@/components/custom/CustomDropdownSelect';
import { CustomModal } from '@/components/custom/CustomModal';

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
  OFFLINE: 'bg-slate-100 text-gray-600 border-slate-200',
  ERROR: 'bg-rose-50 text-rose-700 border-rose-200',
  MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-brand-50 text-brand-primary border-brand-border',
  PROCESSING: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function HardwarePage() {
  const [tab, setTab] = useState('devices');
  const tabs = [
    { id: 'devices', label: 'Devices', icon: <Printer size={16} /> },
    { id: 'jobs', label: 'Print & Action Jobs', icon: <FileText size={16} /> },
    { id: 'scanner', label: 'Barcode Scanner', icon: <ScanBarcode size={16} /> },
    { id: 'realtime', label: 'Real-Time SSE', icon: <Radio size={16} /> },
  ];

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      <CustomBreadcrumb
        title="Hardware & Real-Time Peripherals"
        icon={<Cpu size={20} />}
        items={[{ label: "System", href: "/settings" }, { label: "Hardware" }]}
      />

      <CustomTabs
        tabs={tabs}
        activeTab={tab}
        onChange={(id) => setTab(id)}
        variant="pills"
        themeColor="primary"
      />

      {tab === 'devices' && <DevicesTab />}
      {tab === 'jobs' && <JobsTab />}
      {tab === 'scanner' && <ScannerTab />}
      {tab === 'realtime' && <RealtimeTab />}
    </div>
  );
}

function DevicesTab() {
  const [devices, setDevices] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<any>({});
  const [form, setForm] = useState({ name: '', deviceType: 'THERMAL_PRINTER', driver: 'mock', connectionType: 'VIRTUAL', connectionConfig: {} });

  const load = async () => {
    const [d, dt] = await Promise.all([api.get<any>('/api/v1/hardware/devices'), api.get<any>('/api/v1/hardware/device-types')]);
    setDevices(d.data?.data || []);
    setDeviceTypes(dt.data?.data || {});
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) return;
    await api.post('/api/v1/hardware/devices', form);
    setShowModal(false);
    setForm({ name: '', deviceType: 'THERMAL_PRINTER', driver: 'mock', connectionType: 'VIRTUAL', connectionConfig: {} });
    load();
  };

  const toggle = async (id: string, status: string) => {
    await api.patch(`/api/v1/hardware/devices/${id}`, { status: status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' });
    load();
  };

  const deviceTypeOptions = Object.keys(deviceTypes).map((t) => ({ label: t, value: t }));
  const driverOptions = (deviceTypes[form.deviceType]?.drivers || []).map((d: string) => ({ label: d, value: d }));
  const connectionOptions = ['USB', 'SERIAL', 'NETWORK', 'BLUETOOTH', 'VIRTUAL'].map((c) => ({ label: c, value: c }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-sm border border-slate-200">
        <div>
          <h3 className="font-bold text-gray-600 text-sm">Registered Peripherals</h3>
          <p className="text-xs text-slate-500">Thermal receipt printers, barcode scanners, customer displays, and scales</p>
        </div>
        <CustomButton
          onClick={() => setShowModal(true)}
          size="sm"
          leftIcon={<Plus size={14} />}
          className="bg-brand-primary hover:bg-brand-dark text-white rounded-sm text-xs font-semibold"
        >
          Register Device
        </CustomButton>
      </div>

      <CustomModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Register New Hardware Device"
        size="md"
      >
        <div className="space-y-3">
          <CustomInput
            label="Device Name"
            placeholder="e.g. Counter 1 Thermal Printer"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CustomDropdownSelect
              label="Device Type"
              options={deviceTypeOptions.length > 0 ? deviceTypeOptions : [{ label: "THERMAL_PRINTER", value: "THERMAL_PRINTER" }]}
              value={form.deviceType}
              onChange={(val) => setForm((f) => ({ ...f, deviceType: val, driver: (deviceTypes[val]?.drivers || [])[0] || 'mock' }))}
            />
            <CustomDropdownSelect
              label="Driver"
              options={driverOptions.length > 0 ? driverOptions : [{ label: "mock", value: "mock" }]}
              value={form.driver}
              onChange={(val) => setForm((f) => ({ ...f, driver: val }))}
            />
            <CustomDropdownSelect
              label="Connection"
              options={connectionOptions}
              value={form.connectionType}
              onChange={(val) => setForm((f) => ({ ...f, connectionType: val }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setShowModal(false)}>
              Cancel
            </CustomButton>
            <CustomButton
              size="sm"
              onClick={create}
              className="bg-brand-primary hover:bg-brand-dark text-white rounded-sm font-semibold"
            >
              Register
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d: any) => (
          <div key={d.id} className="bg-white rounded-sm border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 border border-brand-border rounded-sm">
                  <DeviceIcon type={d.deviceType} className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-600 text-xs">{d.name}</h4>
                  <p className="text-[11px] text-slate-500">{d.deviceType} • {d.driver} • {d.connectionType}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(d.id, d.status)}
                className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${d.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                title="Toggle Online / Offline"
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${d.status === 'ONLINE' ? 'left-4.5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${STATUS_COLORS[d.status] || 'bg-slate-100 text-gray-600'}`}>{d.status}</span>
              <span className="text-[11px] text-slate-400 font-mono">ID: {d.id?.slice(0, 8)}</span>
            </div>
          </div>
        ))}
        {devices.length === 0 && (
          <div className="col-span-3 bg-white rounded-sm border border-slate-200 p-8 text-center text-slate-400 text-xs font-medium">
            No devices registered. Add printers, scanners, and displays.
          </div>
        )}
      </div>
    </div>
  );
}

function JobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<any>('/api/v1/hardware/jobs');
      setJobs(r.data?.data || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const columns: CustomTableColumn<any>[] = [
    {
      key: "id",
      header: "Job ID",
      render: (j) => <span className="font-mono text-xs text-gray-600 font-semibold">{j.id?.slice(0, 8)}</span>,
    },
    {
      key: "jobType",
      header: "Type",
      render: (j) => <span className="text-xs font-medium text-gray-600">{j.jobType}</span>,
    },
    {
      key: "deviceType",
      header: "Device",
      render: (j) => <span className="text-xs text-slate-600">{j.deviceType}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (j) => (
        <span className={`text-[10px] px-2.5 py-0.5 rounded-sm font-bold border ${STATUS_COLORS[j.status] || 'bg-slate-100 text-slate-600'}`}>
          {j.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (j) => <span className="text-xs text-slate-400">{new Date(j.createdAt).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="bg-white rounded-sm border border-slate-200 p-4 shadow-2xs">
      <CustomTable
        columns={columns}
        data={jobs}
        loading={loading}
        emptyMessage="No hardware jobs recorded yet."
      />
    </div>
  );
}

function ScannerTab() {
  const [code, setCode] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const process = async () => {
    if (!code) return;
    const r = await api.post<any>('/api/v1/hardware/scan/process', { code });
    setResults((prev) => [r.data?.data, ...prev].slice(0, 20));
    setCode('');
  };

  const columns: CustomTableColumn<any>[] = [
    {
      key: "code",
      header: "Scanned Code / Barcode",
      render: (r) => <span className="font-mono text-xs font-bold text-gray-600">{r.code}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (r) => <span className="text-xs text-slate-600 font-medium">{r.type}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r) => (
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-sm border border-emerald-200">
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-sm border border-slate-200 p-4 shadow-2xs">
        <h3 className="font-bold text-gray-600 text-sm mb-3">Barcode / QR Scanner Interface</h3>
        <div className="flex gap-3 max-w-lg">
          <div className="flex-1">
            <CustomInput
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Scan or type barcode..."
              onKeyDown={(e) => e.key === 'Enter' && process()}
              autoFocus
              className="py-1.5"
            />
          </div>
          <CustomButton
            onClick={process}
            size="sm"
            className="bg-brand-primary hover:bg-brand-dark text-white rounded-sm font-semibold text-xs py-2"
          >
            Process
          </CustomButton>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-sm border border-slate-200 p-4 shadow-2xs">
          <CustomTable
            columns={columns}
            data={results}
            emptyMessage="No scan results."
          />
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
    api.get<any>('/api/v1/realtime/stats').then((r) => setStats(r.data?.data || {}));
    api.get<any>('/api/v1/realtime/events?limit=20').then((r) => setEvents(r.data?.data || []));
  }, []);

  const connect = () => {
    if (esRef.current) { esRef.current.close(); setConnected(false); }
    const es = new EventSource(`/api/v1/realtime/stream?channel=${channel}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents((prev) => [data, ...prev].slice(0, 50));
      } catch {}
    };
    es.onerror = () => setConnected(false);
    es.onopen = () => setConnected(true);
    esRef.current = es;
  };

  const disconnect = () => {
    esRef.current?.close();
    setConnected(false);
  };

  const publishTest = async () => {
    await api.post<any>('/api/v1/realtime/publish', { channel, eventType: 'TEST_EVENT', payload: { message: 'Hello from real-time engine!' } });
    api.get<any>('/api/v1/realtime/events?limit=20').then((r) => setEvents(r.data?.data || []));
  };

  const channelOptions = ['KDS', 'DASHBOARD', 'SYNC', 'DELIVERY', 'INVENTORY', 'POS'].map((c) => ({
    label: c,
    value: c,
  }));

  const columns: CustomTableColumn<any>[] = [
    {
      key: "eventType",
      header: "Event",
      render: (e) => <span className="font-mono text-brand-primary text-xs font-bold">{e.eventType || e.type}</span>,
    },
    {
      key: "channel",
      header: "Channel",
      render: (e) => <span className="text-xs text-gray-600 font-medium">{e.channelType || e.channel}</span>,
    },
    {
      key: "time",
      header: "Time",
      render: (e) => <span className="text-xs text-slate-400">{new Date(e.timestamp || e.createdAt).toLocaleTimeString()}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-sm border border-slate-200 p-4 text-center shadow-2xs">
          <div className="text-2xl font-bold text-gray-600">{stats.activeChannels || 0}</div>
          <div className="text-xs text-slate-500 mt-0.5">Active Channels</div>
        </div>
        <div className="bg-white rounded-sm border border-slate-200 p-4 text-center shadow-2xs">
          <div className="text-2xl font-bold text-emerald-600">{stats.eventsToday || 0}</div>
          <div className="text-xs text-slate-500 mt-0.5">Events Today</div>
        </div>
        <div className="bg-white rounded-sm border border-slate-200 p-4 text-center shadow-2xs">
          <div className="flex items-center justify-center gap-1.5 text-lg font-bold">
            {connected ? (
              <span className="flex items-center gap-1.5 text-emerald-600 text-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
                Disconnected
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Live Stream Status</div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-sm border border-slate-200">
        <div className="w-40">
          <CustomDropdownSelect
            label="Channel"
            options={channelOptions}
            value={channel}
            onChange={(val) => setChannel(val)}
            className="py-1.5"
          />
        </div>
        <CustomButton
          onClick={connect}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-semibold text-xs py-2"
        >
          Connect SSE
        </CustomButton>
        <CustomButton
          onClick={disconnect}
          variant="outline"
          size="sm"
          className="rounded-sm text-xs py-2"
        >
          Disconnect
        </CustomButton>
        <CustomButton
          onClick={publishTest}
          size="sm"
          className="bg-brand-primary hover:bg-brand-dark text-white rounded-sm font-semibold text-xs py-2"
        >
          Publish Test Event
        </CustomButton>
      </div>

      <div className="bg-white rounded-sm border border-slate-200 p-4 shadow-2xs max-h-96 overflow-y-auto">
        <CustomTable
          columns={columns}
          data={events}
          emptyMessage="No events received yet. Click Connect SSE or Publish Test Event."
        />
      </div>
    </div>
  );
}
