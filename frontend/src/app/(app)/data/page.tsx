'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

const ENTITY_TYPES = ['PRODUCTS', 'CUSTOMERS', 'SUPPLIERS', 'SALES', 'INVENTORY', 'ACCOUNTING', 'ORDERS'];

export default function DataPage() {
  const [tab, setTab] = useState<'search' | 'import' | 'export' | 'bulk' | 'migration'>('search');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search, Import/Export & Migration</h1>
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {([['search', '🔍 Global Search'], ['import', '📥 Import'], ['export', '📤 Export'], ['bulk', '⚡ Bulk Ops'], ['migration', '🔄 Migration']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap ${tab === k ? 'bg-white border border-b-0 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'search' && <SearchTab />}
      {tab === 'import' && <ImportTab />}
      {tab === 'export' && <ExportTab />}
      {tab === 'bulk' && <BulkTab />}
      {tab === 'migration' && <MigrationTab />}
    </div>
  );
}

function SearchTab() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<any>(null);

  const search = async (q: string) => {
    if (!q || q.length < 1) { setResults([]); return; }
    setLoading(true);
    const params = [`q=${encodeURIComponent(q)}`, 'limit=30'];
    if (type) params.push(`type=${type}`);
    const r = await api.get(`/api/v1/search?${params.join('&')}`);
    setResults(r.data?.data || []);
    setLoading(false);
  };

  const onInput = (val: string) => {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(val), 300);
  };

  const TYPE_COLORS: Record<string, string> = {
    PRODUCTS: 'bg-blue-100 text-blue-800', CUSTOMERS: 'bg-green-100 text-green-800',
    SUPPLIERS: 'bg-purple-100 text-purple-800', INVOICES: 'bg-yellow-100 text-yellow-800',
    SALES: 'bg-orange-100 text-orange-800', ORDERS: 'bg-red-100 text-red-800',
    QUOTATIONS: 'bg-indigo-100 text-indigo-800', PAYMENTS: 'bg-pink-100 text-pink-800',
    EMPLOYEES: 'bg-cyan-100 text-cyan-800', CATEGORIES: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={query} onChange={e => onInput(e.target.value)}
          placeholder="Search products, customers, invoices, orders... (min 1 char)"
          className="flex-1 border rounded-lg px-4 py-3 text-sm" autoFocus />
        <select value={type} onChange={e => { setType(e.target.value); if (query) search(query); }}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="text-sm text-gray-500">{results.length} results found {loading && '...'}</div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-2 text-left">Name / Number</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-left">Details</th></tr>
          </thead>
          <tbody>
            {results.map((r: any, i: number) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{r.name || r.invoiceNo || r.orderNo || r.quotationNo || r.reference || r.id}</td>
                <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLORS[r.entityType] || 'bg-gray-100'}`}>{r.entityType}</span></td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {r.sku && `SKU: ${r.sku}`}
                  {r.phone && ` | ${r.phone}`}
                  {r.total && ` | ৳${r.total}`}
                  {r.email && ` | ${r.email}`}
                  {r.status && ` | ${r.status}`}
                </td>
              </tr>
            ))}
            {results.length === 0 && !loading && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Type to search across all entities</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImportTab() {
  const [entityType, setEntityType] = useState('PRODUCTS');
  const [importResult, setImportResult] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadJobs = async () => { const r = await api.get('/api/v1/import/jobs'); setJobs(r.data?.data || []); };
  useEffect(() => { loadJobs(); }, []);

  const upload = async () => {
    if (!fileRef.current?.files?.[0]) return;
    const fd = new FormData();
    fd.append("file", fileRef.current.files[0]);
    fd.append("entityType", entityType);
    const r = await api.post('/api/v1/import/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setImportResult(r.data?.data || null);
    loadJobs();
  };

  const confirmImport = async () => {
    if (!importResult?.jobId) return;
    await api.post(`/api/v1/import/${importResult.jobId}/confirm`, { mapping: importResult.mapping, skipErrors: true });
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = '';
    loadJobs();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">CSV Import</h3>
        <div className="flex gap-3 items-center">
          <select value={entityType} onChange={e => setEntityType(e.target.value)} className="border rounded px-3 py-2 text-sm">
            {['PRODUCTS', 'CUSTOMERS', 'SUPPLIERS', 'STOCK', 'EMPLOYEES'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
          <button onClick={upload} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Upload & Validate</button>
        </div>
      </div>
      {importResult && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold">Validation Results</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>Total: {importResult.totalRows} rows</div>
            <div className="text-green-600">Valid: {importResult.validatedRows}</div>
            <div className="text-red-600">Errors: {importResult.errorRows}</div>
          </div>
          {importResult.mapping && (
            <div className="text-xs text-gray-500">
              Column mapping: {Object.entries(importResult.mapping).map(([k, v]) => `${k}→${v}`).join(', ')}
            </div>
          )}
          {importResult.errors?.length > 0 && (
            <div className="max-h-40 overflow-y-auto text-xs bg-red-50 p-2 rounded">
              {importResult.errors.slice(0, 10).map((e: any, i: number) => (
                <div key={i}>Row {e.row}: {e.errors?.map((er: any) => `${er.field}: ${er.error}`).join(', ')}</div>
              ))}
            </div>
          )}
          <button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Confirm Import</button>
        </div>
      )}
      <div className="bg-white rounded-lg border overflow-hidden">
        <h3 className="font-semibold p-4 border-b">Import History</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">File</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-center">Rows</th><th className="px-4 py-2 text-center">Status</th></tr></thead>
          <tbody>
            {jobs.map((j: any) => (
              <tr key={j.id} className="border-t">
                <td className="px-4 py-2 text-xs">{j.fileName}</td>
                <td className="px-4 py-2 text-xs">{j.entityType}</td>
                <td className="px-4 py-2 text-center text-xs">{j.totalRows}</td>
                <td className="px-4 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${j.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{j.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportTab() {
  const [entityType, setEntityType] = useState('PRODUCTS');
  const [exporting, setExporting] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const loadJobs = async () => { const r = await api.get('/api/v1/export/jobs'); setJobs(r.data?.data || []); };
  useEffect(() => { loadJobs(); }, []);

  const doExport = async () => {
    setExporting(true);
    try {
      const r = await api.post('/api/v1/export', { entityType, format: 'CSV', filters: {} }, { responseType: 'blob' } as any);
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = `${entityType.toLowerCase()}_export.csv`; a.click();
      URL.revokeObjectURL(url);
      loadJobs();
    } catch (e) { console.error(e); }
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">CSV Export</h3>
        <div className="flex gap-3 items-center">
          <select value={entityType} onChange={e => setEntityType(e.target.value)} className="border rounded px-3 py-2 text-sm">
            {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={doExport} disabled={exporting} className="px-4 py-2 bg-green-600 text-white rounded text-sm">
            {exporting ? 'Exporting...' : '📥 Download CSV'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <h3 className="font-semibold p-4 border-b">Export History</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-center">Format</th><th className="px-4 py-2 text-center">Rows</th><th className="px-4 py-2 text-center">Status</th><th className="px-4 py-2 text-left">Date</th></tr></thead>
          <tbody>
            {jobs.map((j: any) => (
              <tr key={j.id} className="border-t">
                <td className="px-4 py-2 text-xs">{j.entityType}</td>
                <td className="px-4 py-2 text-center text-xs">{j.format}</td>
                <td className="px-4 py-2 text-center text-xs">{j.totalRows}</td>
                <td className="px-4 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${j.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{j.status}</span></td>
                <td className="px-4 py-2 text-xs text-gray-500">{new Date(j.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BulkTab() {
  const [operation, setOperation] = useState('update-products');
  const [result, setResult] = useState('');

  const ops = [
    { key: 'update-products', label: 'Update Product Prices', desc: 'Bulk update sellingPrice, costPrice, categoryId, etc.' },
    { key: 'update-customers', label: 'Update Customer Limits', desc: 'Bulk update creditLimit, status, loyaltyPoints' },
    { key: 'assign-category', label: 'Assign Category', desc: 'Bulk assign products to a category' },
    { key: 'stock-adjust', label: 'Stock Adjustment', desc: 'Bulk adjust stock quantities across warehouse' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {ops.map(o => (
          <button key={o.key} onClick={() => setOperation(o.key)}
            className={`text-left p-4 rounded-lg border ${operation === o.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <div className="font-medium text-sm">{o.label}</div>
            <div className="text-xs text-gray-500 mt-1">{o.desc}</div>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3">{ops.find(o => o.key === operation)?.label}</h3>
        <p className="text-sm text-gray-500">
          Bulk operations accept a list of entity IDs and update fields in batch.
          Use the API endpoints: <code className="bg-gray-100 px-1 rounded">POST /api/v1/bulk/{operation}</code>
        </p>
        <div className="mt-3 text-xs text-gray-400">
          Example payload: {`{ "productIds": ["id1", "id2"], "updates": { "sellingPrice": 99.99 } }`}
        </div>
      </div>
    </div>
  );
}

function MigrationTab() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const load = async () => { const r = await api.get('/api/v1/migration/sessions'); setSessions(r.data?.data || []); };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return;
    const r = await api.post('/api/v1/migration/sessions', { name, sourceSystem: source });
    setShowCreate(false); setName(''); setSource('');
    load();
  };

  const run = async (id: string) => {
    await api.post(`/api/v1/migration/sessions/${id}/run`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Data Migration Wizard</h3>
        <button onClick={() => setShowCreate(!showCreate)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">+ New Migration</button>
      </div>
      <div className="bg-white rounded-lg border p-4 text-sm text-gray-500">
        🔄 Migration flow: <strong>Create Session</strong> → <strong>Upload CSV per table</strong> → <strong>Map Columns</strong> → <strong>Validate</strong> → <strong>Run Import</strong> → <strong>Review Results</strong>
      </div>
      {showCreate && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Migration name (e.g. 'From Square POS')" value={name} onChange={e => setName(e.target.value)} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Source system (e.g. Square, Lightspeed)" value={source} onChange={e => setSource(e.target.value)} className="border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-1.5 bg-green-600 text-white rounded text-sm">Create Session</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 bg-gray-200 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Source</th><th className="px-4 py-2 text-center">Tables</th><th className="px-4 py-2 text-center">Status</th><th className="px-4 py-2 text-center">Action</th></tr></thead>
          <tbody>
            {sessions.map((s: any) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                <td className="px-4 py-2 text-xs">{s.sourceSystem || '-'}</td>
                <td className="px-4 py-2 text-center text-xs">{Array.isArray(s.tables) ? s.tables.length : 0}</td>
                <td className="px-4 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${s.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{s.status}</span></td>
                <td className="px-4 py-2 text-center">
                  {s.status !== 'COMPLETED' && (
                    <button onClick={() => run(s.id)} className="text-xs bg-green-500 text-white px-3 py-1 rounded">▶ Run</button>
                  )}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No migration sessions. Create one to start migrating data from another POS.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
