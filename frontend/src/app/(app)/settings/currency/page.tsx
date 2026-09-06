'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function CurrencyLocalizationPage() {
  const [tab, setTab] = useState<'currency' | 'rates' | 'localization'>('currency');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Currency & Localization</h1>
      <div className="flex gap-2 border-b pb-2">
        {([['currency', '💱 Currency'], ['rates', '📊 Exchange Rates'], ['localization', '🌐 Localization']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${tab === k ? 'bg-white border border-b-0 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'currency' && <CurrencyTab />}
      {tab === 'rates' && <RatesTab />}
      {tab === 'localization' && <LocalizationTab />}
    </div>
  );
}

function CurrencyTab() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [tenantCurrency, setTenantCurrency] = useState('BDT');
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState({ amount: 100, fromCurrency: 'BDT', toCurrency: 'USD' });
  const [convertResult, setConvertResult] = useState<any>(null);

  const load = async () => {
    const [curr, tc] = await Promise.all([api.get('/api/v1/currencies'), api.get('/api/v1/tenant/currency')]);
    setCurrencies(curr.data?.data || []);
    setTenantCurrency(tc.data?.data?.baseCurrency || 'BDT');
  };
  useEffect(() => { load(); }, []);

  const setBase = async (code: string) => {
    await api.patch('/api/v1/tenant/currency', { baseCurrency: code });
    setTenantCurrency(code);
  };

  const doConvert = async () => {
    setConverting(true);
    const r = await api.post('/api/v1/exchange-rates/convert', convertForm);
    setConvertResult(r.data?.data || r.data?.error);
    setConverting(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-2">Base Currency: <span className="text-blue-600">{tenantCurrency}</span></h3>
        <p className="text-sm text-gray-500 mb-3">The base currency is used for all financial reporting and accounting.</p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-2 text-left">Code</th><th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-center">Symbol</th><th className="px-4 py-2 text-center">Decimals</th>
            <th className="px-4 py-2 text-center">Action</th>
          </tr></thead>
          <tbody>
            {currencies.map((c: any) => (
              <tr key={c.code} className="border-t">
                <td className="px-4 py-2 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2 text-center text-lg">{c.symbol}</td>
                <td className="px-4 py-2 text-center">{c.decimalPlaces}</td>
                <td className="px-4 py-2 text-center">
                  {c.code === tenantCurrency
                    ? <span className="text-xs text-green-600 font-medium">✓ Base Currency</span>
                    : <button onClick={() => setBase(c.code)} className="text-xs text-blue-600 hover:underline">Set as Base</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Quick Convert</h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500">Amount</label>
            <input type="number" value={convertForm.amount} onChange={e => setConvertForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-24 border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">From</label>
            <select value={convertForm.fromCurrency} onChange={e => setConvertForm(f => ({ ...f, fromCurrency: e.target.value }))} className="border rounded px-3 py-2 text-sm">
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <div className="text-lg pb-2">→</div>
          <div>
            <label className="text-xs text-gray-500">To</label>
            <select value={convertForm.toCurrency} onChange={e => setConvertForm(f => ({ ...f, toCurrency: e.target.value }))} className="border rounded px-3 py-2 text-sm">
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <button onClick={doConvert} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Convert</button>
        </div>
        {convertResult && (
          <div className="bg-blue-50 rounded p-3 text-sm">
            {typeof convertResult === 'string'
              ? <span className="text-red-600">{convertResult}</span>
              : <span>{convertResult.amount} {convertResult.from} = <strong>{convertResult.converted} {convertResult.to}</strong> (rate: {convertResult.rate})</span>
            }
          </div>
        )}
      </div>
    </div>
  );
}

function RatesTab() {
  const [rates, setRates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromCurrency: 'BDT', toCurrency: 'USD', rate: 0.0085, source: 'MANUAL' });

  const load = async () => { const r = await api.get('/api/v1/exchange-rates'); setRates(r.data?.data || []); };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.rate) return;
    await api.post('/api/v1/exchange-rates', form);
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Exchange Rate History</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">+ New Rate</button>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
        ⚠️ Exchange rates are <strong>immutable once set</strong>. Historical transactions always use the rate that was active at the time of the transaction. Creating a new rate auto-deactivates the previous one.
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <select value={form.fromCurrency} onChange={e => setForm(f => ({ ...f, fromCurrency: e.target.value }))} className="border rounded px-3 py-2 text-sm">
              {['BDT', 'USD', 'EUR', 'GBP', 'INR', 'SAR', 'AED'].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.toCurrency} onChange={e => setForm(f => ({ ...f, toCurrency: e.target.value }))} className="border rounded px-3 py-2 text-sm">
              {['USD', 'BDT', 'EUR', 'GBP', 'INR', 'SAR', 'AED'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" step="0.000001" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: Number(e.target.value) }))} className="border rounded px-3 py-2 text-sm" placeholder="Rate" />
            <button onClick={create} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Set Rate</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-2 text-left">Pair</th><th className="px-4 py-2 text-right">Rate</th>
            <th className="px-4 py-2 text-center">Status</th><th className="px-4 py-2 text-left">Source</th>
            <th className="px-4 py-2 text-left">Effective</th>
          </tr></thead>
          <tbody>
            {rates.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2 font-mono">{r.fromCurrency} → {r.toCurrency}</td>
                <td className="px-4 py-2 text-right font-mono">{r.rate}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {r.isActive ? 'Active' : 'Historical'}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs">{r.source}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{new Date(r.effectiveFrom).toLocaleString()}</td>
              </tr>
            ))}
            {rates.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No exchange rates set</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LocalizationTab() {
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [localeSettings, setLocaleSettings] = useState<any>({});
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState<any[]>([]);
  const [selectedLocale, setSelectedLocale] = useState('en');

  const load = async () => {
    const [ls, st] = await Promise.all([api.get('/api/v1/tenant/locale'), api.get('/api/v1/locales/stats')]);
    setLocaleSettings(ls.data?.data || {});
    setLocale(ls.data?.data?.locale || 'en');
    setStats(st.data?.data || []);
  };
  useEffect(() => { load(); }, []);

  const loadTranslations = async (loc: string) => {
    setSelectedLocale(loc);
    const r = await api.get(`/api/v1/locales/translations/${loc}`);
    setTranslations(r.data?.data || {});
  };
  useEffect(() => { loadTranslations(locale || 'en'); }, [locale]);

  const saveLocale = async () => {
    await api.post('/api/v1/tenant/locale', localeSettings);
    load();
  };

  const supportedLocales = [
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  ];

  const filteredTranslations = filter
    ? Object.fromEntries(Object.entries(translations).filter(([k]) => k.includes(filter)))
    : translations;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Locale Settings</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500">Language</label>
            <select value={localeSettings.locale || 'en'} onChange={e => setLocaleSettings((s: any) => ({ ...s, locale: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm">
              {supportedLocales.map(l => <option key={l.code} value={l.code}>{l.flag} {l.native} ({l.name})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Date Format</label>
            <select value={localeSettings.dateFormat || 'YYYY-MM-DD'} onChange={e => setLocaleSettings((s: any) => ({ ...s, dateFormat: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm">
              {['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Timezone</label>
            <select value={localeSettings.timezone || 'Asia/Dhaka'} onChange={e => setLocaleSettings((s: any) => ({ ...s, timezone: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm">
              {['Asia/Dhaka', 'Asia/Kolkata', 'Asia/Riyadh', 'Europe/London', 'America/New_York'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button onClick={saveLocale} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Save Settings</button>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Translation Strings ({selectedLocale.toUpperCase()})</h3>
        <div className="flex gap-2 mb-3">
          {supportedLocales.map(l => (
            <button key={l.code} onClick={() => loadTranslations(l.code)}
              className={`px-3 py-1 rounded text-sm ${selectedLocale === l.code ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {l.flag} {l.native}
            </button>
          ))}
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter keys..." className="ml-auto border rounded px-3 py-1 text-sm" />
        </div>
        <div className="max-h-96 overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0"><tr>
              <th className="px-3 py-2 text-left text-xs">Key</th><th className="px-3 py-2 text-left text-xs">Value</th>
            </tr></thead>
            <tbody>
              {Object.entries(filteredTranslations).map(([k, v]) => (
                <tr key={k} className="border-t"><td className="px-3 py-1.5 text-xs font-mono text-gray-500">{k}</td><td className="px-3 py-1.5 text-sm">{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {Object.keys(filteredTranslations).length} translations shown
          {stats.map(s => <span key={s.locale} className="ml-2">{s.locale.toUpperCase()}: {s.count} strings</span>)}
        </div>
      </div>
    </div>
  );
}
