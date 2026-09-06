"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Utensils,
  UserCheck,
  Clock,
  ArrowRightLeft,
  Plus,
  RefreshCw,
  AlertCircle,
  Users,
  Layers,
} from "lucide-react";

interface Floor {
  id: string;
  name: string;
  sortOrder: number;
}

interface Table {
  id: string;
  tableNo: string;
  name: string;
  capacity: number;
  status:
    | "AVAILABLE"
    | "RESERVED"
    | "OCCUPIED"
    | "ORDERING"
    | "PREPARING"
    | "BILL_REQUESTED"
    | "PAYMENT_PENDING"
    | "CLEANING";
  currentOrderNo?: string;
  waiter?: { id: string; name: string } | null;
  floor?: { id: string; name: string } | null;
}

const STATUS_COLORS: Record<Table["status"], { bg: string; border: string; text: string }> = {
  AVAILABLE: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  RESERVED: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  OCCUPIED: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  ORDERING: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  PREPARING: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  BILL_REQUESTED: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
  PAYMENT_PENDING: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400" },
  CLEANING: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-400" },
};

export default function FloorPlanView() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New Table modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNo, setNewTableNo] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);

  // New Floor modal state
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromTableId, setFromTableId] = useState("");
  const [toTableId, setToTableId] = useState("");

  // Dynamic branch ID
  const [branchId, setBranchId] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch branches to resolve branchId dynamically
      const resBranches = await api.get<{ data: { id: string; name: string }[] }>("/v1/branches");
      const branches = resBranches.data || [];
      if (branches.length > 0 && !branchId) {
        setBranchId(branches[0].id);
      }
      const activeBranch = branchId || (branches[0]?.id || "");

      const [resFloors, resTables] = await Promise.all([
        api.get<{ data: Floor[] }>(`/v1/restaurant/floors?branchId=${activeBranch}`),
        api.get<{ data: Table[] }>(`/v1/restaurant/tables?branchId=${activeBranch}`),
      ]);
      setFloors(resFloors.data || []);
      setTables(resTables.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load floor plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (tableId: string, newStatus: Table["status"]) => {
    try {
      await api.patch(`/v1/restaurant/tables/${tableId}/status`, { status: newStatus });
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      alert("Status update failed: " + err.message);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNo) return;
    try {
      const res = await api.post<{ data: Table }>("/v1/restaurant/tables", {
        branchId: branchId,
        floorId: selectedFloorId || undefined,
        tableNo: newTableNo,
        name: newTableName || `Table ${newTableNo}`,
        capacity: Number(newCapacity),
      });
      setShowAddModal(false);
      setNewTableNo("");
      setNewTableName("");
      loadData();
    } catch (err: any) {
      alert("Failed to create table: " + err.message);
    }
  };

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName) return;
    try {
      await api.post("/v1/restaurant/floors", {
        branchId: branchId,
        name: newFloorName,
        sortOrder: floors.length + 1,
      });
      setShowFloorModal(false);
      setNewFloorName("");
      loadData();
    } catch (err: any) {
      alert("Failed to create floor: " + err.message);
    }
  };

  const handleTransferTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromTableId || !toTableId) return;
    try {
      await api.post("/v1/restaurant/tables/transfer", {
        fromTableId,
        toTableId,
      });
      setShowTransferModal(false);
      setFromTableId("");
      setToTableId("");
      loadData();
    } catch (err: any) {
      alert("Table transfer failed: " + err.message);
    }
  };

  const filteredTables = selectedFloorId
    ? tables.filter((t) => t.floor?.id === selectedFloorId)
    : tables;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            id="btn-floor-all"
            onClick={() => setSelectedFloorId("")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedFloorId === ""
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Floors ({tables.length})
          </button>
          {floors.map((f) => (
            <button
              key={f.id}
              id={`btn-floor-${f.id}`}
              onClick={() => setSelectedFloorId(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFloorId === f.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {f.name} ({tables.filter((t) => t.floor?.id === f.id).length})
            </button>
          ))}
          <button
            id="btn-add-floor"
            onClick={() => setShowFloorModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-indigo-400 border border-indigo-500/30 rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New Floor
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-transfer-table"
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer Table
          </button>
          <button
            id="btn-add-table"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Table
          </button>
          <button
            id="btn-refresh-tables"
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Grid Floor Plan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredTables.map((t) => {
          const style = STATUS_COLORS[t.status] || STATUS_COLORS.AVAILABLE;
          return (
            <div
              key={t.id}
              id={`table-card-${t.tableNo}`}
              className={`relative flex flex-col justify-between p-5 rounded-2xl border ${style.bg} ${style.border} transition-all hover:scale-[1.02] shadow-lg`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-indigo-400" />
                      {t.name}
                    </h3>
                    <span className="text-xs text-slate-400">No. {t.tableNo}</span>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full tracking-wider ${style.bg} ${style.text} border ${style.border}`}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Capacity: <strong className="text-white">{t.capacity} Seats</strong></span>
                  </div>
                  {t.waiter && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      <span>Waiter: <strong className="text-indigo-300">{t.waiter.name}</strong></span>
                    </div>
                  )}
                  {t.currentOrderNo && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Order: <strong className="text-amber-300">{t.currentOrderNo}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Change Selector */}
              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Update State
                </label>
                <select
                  id={`select-status-${t.id}`}
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value as Table["status"])}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="AVAILABLE">AVAILABLE (Green)</option>
                  <option value="RESERVED">RESERVED (Purple)</option>
                  <option value="OCCUPIED">OCCUPIED (Blue)</option>
                  <option value="ORDERING">ORDERING (Orange)</option>
                  <option value="PREPARING">PREPARING (Yellow)</option>
                  <option value="BILL_REQUESTED">BILL REQUESTED (Teal)</option>
                  <option value="PAYMENT_PENDING">PAYMENT PENDING (Red)</option>
                  <option value="CLEANING">CLEANING (Slate)</option>
                </select>
              </div>
            </div>
          );
        })}

        {filteredTables.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-center">
            <Utensils className="w-12 h-12 mb-3 text-slate-600" />
            <p className="font-semibold text-slate-400">No tables on this floor yet</p>
            <p className="text-xs mt-1">Click &quot;Add Table&quot; above to add your first restaurant table.</p>
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateTable}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Add New Table
            </h3>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Table Number</label>
              <input
                id="input-table-no"
                type="text"
                required
                placeholder="e.g. T-12"
                value={newTableNo}
                onChange={(e) => setNewTableNo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Table Display Name</label>
              <input
                id="input-table-name"
                type="text"
                placeholder="e.g. VIP Window Table 12"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Seating Capacity</label>
              <input
                id="input-table-capacity"
                type="number"
                min="1"
                max="30"
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800 rounded-lg hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-md shadow-indigo-500/20"
              >
                Create Table
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Floor Modal */}
      {showFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateFloor}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Add New Floor
            </h3>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Floor Name</label>
              <input
                id="input-floor-name"
                type="text"
                required
                placeholder="e.g. Rooftop Terrace / Ground Floor"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowFloorModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800 rounded-lg hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-md shadow-indigo-500/20"
              >
                Create Floor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Table Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleTransferTable}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-400" /> Transfer / Merge Table
            </h3>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Source Table (Current Order)</label>
              <select
                id="select-from-table"
                value={fromTableId}
                onChange={(e) => setFromTableId(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm focus:border-indigo-500"
              >
                <option value="">Select source table...</option>
                {tables
                  .filter((t) => t.status !== "AVAILABLE")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Destination Table</label>
              <select
                id="select-to-table"
                value={toTableId}
                onChange={(e) => setToTableId(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm focus:border-indigo-500"
              >
                <option value="">Select destination table...</option>
                {tables
                  .filter((t) => t.id !== fromTableId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800 rounded-lg hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 shadow-md shadow-amber-500/20"
              >
                Transfer Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
