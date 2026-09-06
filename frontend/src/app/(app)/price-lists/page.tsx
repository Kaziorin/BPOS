"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, DollarSign } from "lucide-react";
import { api } from "@/lib/api";

interface PriceList {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
  validFrom: string | null;
  validTo: string | null;
  status: string;
  _count: { items: number };
}

export default function PriceListsPage() {
  const [lists, setLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCurrency, setNewCurrency] = useState("BDT");

  useEffect(() => { loadLists(); }, []);

  async function loadLists() {
    try {
      const result = await api.get<{ data: PriceList[] }>("/v1/price-lists");
      setLists(result.data);
    } catch (err) {
      console.error("Failed to load price lists:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createList() {
    if (!newName.trim()) return;
    try {
      await api.post("/v1/price-lists", { name: newName, currency: newCurrency });
      setShowCreate(false);
      setNewName("");
      setNewCurrency("BDT");
      await loadLists();
    } catch (err: any) {
      alert(err.message || "Failed to create");
    }
  }

  async function deleteList(id: string) {
    if (!confirm("Delete this price list?")) return;
    try {
      await api.del(`/v1/price-lists/${id}`);
      await loadLists();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Lists</h1>
          <p className="mt-1 text-sm text-gray-500">Manage pricing tiers (Retail, Wholesale, Dealer, etc.)</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus size={16} /> Create Price List
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : lists.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No price lists yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((pl) => (
            <div key={pl.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{pl.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{pl.currency} · {pl._count.items} items</p>
                  {pl.isDefault && <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Default</span>}
                </div>
                <button onClick={() => deleteList(pl.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {pl.validFrom && <span>From: {new Date(pl.validFrom).toLocaleDateString()}</span>}
                {pl.validTo && <span> · To: {new Date(pl.validTo).toLocaleDateString()}</span>}
                {!pl.validFrom && !pl.validTo && <span>No expiry</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Create Price List</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Wholesale Pricing" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={createList} disabled={!newName.trim()} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
