'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Channel { id: string; code: string; name: string; isEnabled: boolean; config: any; }
interface ChannelOrder { id: string; orderNo: string; status: string; channelCode: string; customerName: string; customerPhone: string; totalAmount: number; items: any; createdAt: string; }
interface Adapter { id: string; platform: string; name: string; status: string; config: any; lastSyncAt: string | null; productsSynced: number; ordersImported: number; }
interface KioskSession { id: string; kioskId: string; status: string; cart: any[]; totalAmount: number; createdAt: string; }
interface QRMenu { id: string; name: string; branchId: string; branchName: string; isActive: boolean; categoryFilter: any; }

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800', VALIDATED: 'bg-purple-100 text-purple-800',
  ALLOCATED: 'bg-yellow-100 text-yellow-800', SHIPPED: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-green-100 text-green-800', INACTIVE: 'bg-gray-100 text-gray-800',
  SUCCESS: 'bg-green-100 text-green-800', RUNNING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function OmnichannelPage() {
  const [tab, setTab] = useState<'channels' | 'orders' | 'marketplace' | 'kiosk' | 'qr'>('orders');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [orders, setOrders] = useState<ChannelOrder[]>([]);
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [kiosks, setKiosks] = useState<KioskSession[]>([]);
  const [qrMenus, setQRMenus] = useState<QRMenu[]>([]);
  const [orderFilter, setOrderFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewAdapter, setShowNewAdapter] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [chRes, orRes, adRes, ksRes, qrRes] = await Promise.all([
        api.get('/api/v1/channels'),
        api.get(`/api/v1/omnichannel/orders${orderFilter ? `?status=${orderFilter}` : ''}`),
        api.get('/api/v1/marketplace/adapters'),
        api.get('/api/v1/kiosk/sessions'),
        api.get('/api/v1/qr/menus'),
      ]);
      setChannels(chRes.data?.data || []);
      const orderData = orRes.data?.data;
      setOrders(orderData?.items || orderData || []);
      setAdapters(adRes.data?.data || []);
      setKiosks(ksRes.data?.data || []);
      setQRMenus(qrRes.data?.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab, orderFilter]);

  const advanceOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const flow: Record<string, string> = { RECEIVED: 'VALIDATED', VALIDATED: 'ALLOCATED', ALLOCATED: 'SHIPPED', SHIPPED: 'DELIVERED' };
    const next = flow[order.status];
    if (!next) return;
    await api.patch(`/api/v1/omnichannel/orders/${orderId}/status`, { status: next });
    load();
  };

  const toggleChannel = async (code: string, enabled: boolean) => {
    await api.patch(`/api/v1/channels/${code}`, { isEnabled: !enabled });
    load();
  };

  const syncAdapter = async (adapterId: string, type: string) => {
    await api.post(`/api/v1/marketplace/adapters/${adapterId}/sync/${type}`);
    load();
  };

  const createChannel = async (code: string, name: string) => {
    await api.post('/api/v1/channels', { code, name, isEnabled: true });
    setShowNewChannel(false);
    load();
  };

  const createAdapter = async (platform: string, name: string) => {
    await api.post('/api/v1/marketplace/adapters', { platform, name, config: {} });
    setShowNewAdapter(false);
    load();
  };

  const tabs = [
    { key: 'orders', label: '📦 Online Orders' },
    { key: 'channels', label: '📡 Channels' },
    { key: 'marketplace', label: '🛒 Marketplace' },
    { key: 'kiosk', label: '🖥️ Kiosk' },
    { key: 'qr', label: '📱 QR Menu' },
  ];

  const statusCounts = orders.reduce((acc: Record<string, number>, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Omnichannel Management</h1>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          🔄 Refresh
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="bg-white rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs text-gray-500">{status}</div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="bg-white rounded-lg border p-3 text-center col-span-5 text-gray-400">No orders yet</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap ${tab === t.key ? 'bg-white border border-b-0 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select value={orderFilter} onChange={e => setOrderFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm">
              <option value="">All Status</option>
              {['RECEIVED', 'VALIDATED', 'ALLOCATED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
              No online orders. Orders from Website, Mobile, Kiosk, QR, or Marketplace will appear here.
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Order #</th>
                    <th className="px-4 py-3 text-left">Channel</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{o.orderNo}</td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{o.channelCode || 'POS'}</span>
                      </td>
                      <td className="px-4 py-3">{o.customerName || 'Guest'}</td>
                      <td className="px-4 py-3 text-right font-medium">৳{Number(o.totalAmount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                          <button onClick={() => advanceOrder(o.id)}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                            ➡️ Advance
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Channels Tab */}
      {tab === 'channels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Order Channels</h3>
            <button onClick={() => setShowNewChannel(true)} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">
              + New Channel
            </button>
          </div>
          {showNewChannel && (
            <NewChannelForm onSubmit={createChannel} onCancel={() => setShowNewChannel(false)} />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(ch => (
              <div key={ch.id} className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{ch.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{ch.code}</p>
                  </div>
                  <button onClick={() => toggleChannel(ch.code, ch.isEnabled)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${ch.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ch.isEnabled ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Status: <span className={ch.isEnabled ? 'text-green-600' : 'text-gray-500'}>{ch.isEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            ))}
            {channels.length === 0 && (
              <div className="col-span-3 bg-white rounded-lg border p-8 text-center text-gray-500">
                No channels configured. Create WEBSITE, MOBILE, PHONE channels.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Marketplace Tab */}
      {tab === 'marketplace' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Marketplace Adapters</h3>
            <button onClick={() => setShowNewAdapter(true)} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">
              + New Adapter
            </button>
          </div>
          {showNewAdapter && (
            <NewAdapterForm onSubmit={createAdapter} onCancel={() => setShowNewAdapter(false)} />
          )}
          {adapters.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
              No marketplace adapters. Connect Shopify, WooCommerce, eBay, etc.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adapters.map(a => (
                <div key={a.id} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{a.name}</h4>
                      <p className="text-xs text-gray-500">{a.platform}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[a.status] || 'bg-gray-100'}`}>{a.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>Products: {a.productsSynced || 0}</div>
                    <div>Orders: {a.ordersImported || 0}</div>
                    <div className="col-span-2">Last sync: {a.lastSyncAt ? new Date(a.lastSyncAt).toLocaleString() : 'Never'}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => syncAdapter(a.id, 'products')}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">📥 Sync Products</button>
                    <button onClick={() => syncAdapter(a.id, 'orders')}
                      className="text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600">📥 Sync Orders</button>
                    <button onClick={() => syncAdapter(a.id, 'inventory')}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">📤 Push Stock</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kiosk Tab */}
      {tab === 'kiosk' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Kiosk Sessions</h3>
          {kiosks.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
              No kiosk sessions. Customers will see the kiosk ordering interface.
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Kiosk</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-left">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {kiosks.map(k => (
                    <tr key={k.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{k.kioskId}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[k.status] || 'bg-gray-100'}`}>{k.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{Array.isArray(k.cart) ? k.cart.length : 0}</td>
                      <td className="px-4 py-3 text-right">৳{Number(k.totalAmount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(k.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QR Menu Tab */}
      {tab === 'qr' && (
        <div className="space-y-4">
          <h3 className="font-semibold">QR Menu Orders</h3>
          {qrMenus.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
              No QR menus created. Create a menu and print the QR code for table ordering.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qrMenus.map(m => (
                <div key={m.id} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{m.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${m.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Branch: {m.branchName || 'All'}</p>
                  <p className="text-xs text-gray-500">QR: /qr/{m.id}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && <div className="text-center text-gray-400 text-sm">Loading...</div>}
    </div>
  );
}

function NewChannelForm({ onSubmit, onCancel }: { onSubmit: (code: string, name: string) => void; onCancel: () => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <h4 className="font-semibold">New Channel</h4>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="CODE (e.g. WEBSITE)" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          className="border rounded px-3 py-2 text-sm" />
        <input placeholder="Channel Name" value={name} onChange={e => setName(e.target.value)}
          className="border rounded px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => code && onSubmit(code, name || code)} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">Create</button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm">Cancel</button>
      </div>
    </div>
  );
}

function NewAdapterForm({ onSubmit, onCancel }: { onSubmit: (platform: string, name: string) => void; onCancel: () => void }) {
  const [platform, setPlatform] = useState('SHOPIFY');
  const [name, setName] = useState('');
  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <h4 className="font-semibold">New Marketplace Adapter</h4>
      <div className="grid grid-cols-2 gap-3">
        <select value={platform} onChange={e => setPlatform(e.target.value)} className="border rounded px-3 py-2 text-sm">
          {['SHOPIFY', 'WOOCOMMERCE', 'EBAY', 'AMAZON', 'FACEBOOK', 'CUSTOM'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input placeholder="Adapter Name" value={name} onChange={e => setName(e.target.value)}
          className="border rounded px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSubmit(platform, name || platform)} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">Create</button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm">Cancel</button>
      </div>
    </div>
  );
}
