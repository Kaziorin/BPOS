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

const STATUS_COLORS: Record<Table["status"], { bg: string; border: string; text: string; dot: string }> = {
  AVAILABLE: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  RESERVED: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  OCCUPIED: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  ORDERING: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-600" },
  PREPARING: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  BILL_REQUESTED: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", dot: "bg-cyan-500" },
  PAYMENT_PENDING: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  CLEANING: { bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-700", dot: "bg-slate-500" },
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
      await api.post<{ data: Table }>("/v1/restaurant/tables", {
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
    <div className="space-y-6 w-full">
      {/* Top Action Bar (Full Width Card) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-md border border-slate-200 shadow-2xs w-full">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            id="btn-floor-all"
            onClick={() => setSelectedFloorId("")}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${
              selectedFloorId === ""
                ? "bg-orange-600 text-white shadow-2xs"
                : "bg-slate-100 text-gray-600 hover:text-gray-900 hover:bg-slate-200"
            }`}
          >
            All Floors ({tables.length})
          </button>
          {floors.map((f) => (
            <button
              key={f.id}
              id={`btn-floor-${f.id}`}
              onClick={() => setSelectedFloorId(f.id)}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${
                selectedFloorId === f.id
                  ? "bg-orange-600 text-white shadow-2xs"
                  : "bg-slate-100 text-gray-600 hover:text-gray-900 hover:bg-slate-200"
              }`}
            >
              {f.name} ({tables.filter((t) => t.floor?.id === f.id).length})
            </button>
          ))}
          <button
            id="btn-add-floor"
            onClick={() => setShowFloorModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New Floor
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-transfer-table"
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer Table
          </button>
          <button
            id="btn-add-table"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-md shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4" /> Add Table
          </button>
          <button
            id="btn-refresh-tables"
            onClick={loadData}
            className="p-2 text-gray-600 hover:text-gray-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-all"
            title="Refresh floor plan"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-sm w-full">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Grid Floor Plan (Full Width Grid Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {filteredTables.map((t) => {
          const style = STATUS_COLORS[t.status] || STATUS_COLORS.AVAILABLE;
          return (
            <div
              key={t.id}
              id={`table-card-${t.tableNo}`}
              className={`relative flex flex-col justify-between p-5 rounded-md border ${style.bg} ${style.border} transition-all duration-200 hover:shadow-2xs hover:border-orange-300 bg-white w-full`}
            >
              <div className="w-full">
                <div className="flex items-start justify-between w-full">
                  <div>
                    <h3 className="text-base font-bold text-gray-600 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-orange-600" />
                      {t.name}
                    </h3>
                    <span className="text-xs text-gray-500 font-medium">No. {t.tableNo}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${style.bg} ${style.text} border ${style.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {t.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-600 w-full">
                  <div className="flex items-center gap-2 w-full">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>Capacity: <strong className="text-gray-600">{t.capacity} Seats</strong></span>
                  </div>
                  {t.waiter && (
                    <div className="flex items-center gap-2 w-full">
                      <UserCheck className="w-4 h-4 text-orange-600" />
                      <span>Waiter: <strong className="text-orange-700">{t.waiter.name}</strong></span>
                    </div>
                  )}
                  {t.currentOrderNo && (
                    <div className="flex items-center gap-2 w-full">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Order: <strong className="text-amber-800">{t.currentOrderNo}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Change Selector (Full Width Inside Card) */}
              <div className="mt-5 pt-3 border-t border-slate-100 w-full">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Update Table State
                </label>
                <select
                  id={`select-status-${t.id}`}
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value as Table["status"])}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-gray-600 font-medium rounded-md px-3 py-2 focus:outline-none focus:border-orange-500 transition-all"
                >
                  <option value="AVAILABLE">AVAILABLE (Emerald Green)</option>
                  <option value="RESERVED">RESERVED (Purple)</option>
                  <option value="OCCUPIED">OCCUPIED (Blue)</option>
                  <option value="ORDERING">ORDERING (Flame Orange)</option>
                  <option value="PREPARING">PREPARING (Amber Yellow)</option>
                  <option value="BILL_REQUESTED">BILL REQUESTED (Teal)</option>
                  <option value="PAYMENT_PENDING">PAYMENT PENDING (Rose Red)</option>
                  <option value="CLEANING">CLEANING (Slate)</option>
                </select>
              </div>
            </div>
          );
        })}

        {filteredTables.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white border border-dashed border-slate-200 rounded-md text-gray-500 text-center shadow-2xs w-full">
            <Utensils className="w-10 h-10 mb-3 text-gray-400" />
            <p className="font-bold text-gray-600">No tables on this floor yet</p>
            <p className="text-xs text-gray-500 mt-1">Click &quot;Add Table&quot; above to add your first restaurant dining table.</p>
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateTable}
            className="bg-white border border-slate-200 p-6 rounded-md max-w-lg w-full space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-gray-600 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-600" /> Add New Table
            </h3>
            <div className="w-full">
              <label className="text-xs text-gray-600 font-bold mb-1 block">Table Number</label>
              <input
                id="input-table-no"
                type="text"
                required
                placeholder="e.g. T-12"
                value={newTableNo}
                onChange={(e) => setNewTableNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-gray-600 rounded-md p-2.5 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="w-full">
              <label className="text-xs text-gray-600 font-bold mb-1 block">Table Display Name</label>
              <input
                id="input-table-name"
                type="text"
                placeholder="e.g. VIP Window Table 12"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-gray-600 rounded-md p-2.5 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="w-full">
              <label className="text-xs text-gray-600 font-bold mb-1 block">Seating Capacity</label>
              <input
                id="input-table-capacity"
                type="number"
                min="1"
                max="30"
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-gray-600 rounded-md p-2.5 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 w-full">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-slate-100 rounded-md hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-2xs"
              >
                Create Table
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Floor Modal */}
      {showFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateFloor}
            className="bg-white border border-slate-200 p-6 rounded-md max-w-lg w-full space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-gray-600 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" /> Add New Floor
            </h3>
            <div className="w-full">
              <label className="text-xs text-gray-600 font-bold mb-1 block">Floor Name</label>
              <input
                id="input-floor-name"
                type="text"
                required
                placeholder="e.g. Rooftop Terrace / Ground Floor"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-gray-600 rounded-md p-2.5 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 w-full">
              <button
                type="button"
                onClick={() => setShowFloorModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-slate-100 rounded-md hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-2xs"
              >
                Create Floor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Table Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleTransferTable}
            className="bg-white border border-slate-200 p-6 rounded-md max-w-lg w-full space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-gray-600 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-600" /> Transfer / Merge Table
            </h3>
            <div className="w-full">
              <label className="text-xs text-gray-600 font-bold mb-1 block">Source Table (Current Order)</label>
              <select
                id="select-from-table"
                value={fromTableId}
                onChange={(e) => setFromTableId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-gray-600 rounded-md p-2.5 text-sm focus:border-orange-500 focus:outline-none"
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
            <div className="w-full">
              <label className="text-xs text-gray-600 font-bold mb-1 block">Destination Table</label>
              <select
                id="select-to-table"
                value={toTableId}
                onChange={(e) => setToTableId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-gray-600 rounded-md p-2.5 text-sm focus:border-orange-500 focus:outline-none"
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
            <div className="flex justify-end gap-3 pt-3 w-full">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-slate-100 rounded-md hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-2xs"
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
