"use client";

import { useEffect, useState } from "react";
import {
  Plus, Warehouse as WhIcon, Building2, Layers,
  Grid3X3, Package, ArrowRightLeft, Sparkles,
  Boxes, Trash2
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { StatusBadge, CustomBadge } from "@/components/custom/CustomBadge";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string | null;
  status: "ACTIVE" | "INACTIVE";
  isLocationBased: boolean;
  branch: { id: string; name: string; code: string };
  _count: { stockRows: number; terminals: number; binCount?: number };
}

interface LocationBin {
  id: string;
  rowCode: string;
  colCode: string;
  rackCode: string;
  binCode: string;
  fullCode: string;
  name: string;
  type: string;
  maxCapacity: number | null;
  status: "ACTIVE" | "INACTIVE" | "FULL" | "LOCKED";
  totalQty?: number;
  productCount?: number;
}

interface HierarchyRack {
  rackCode: string;
  bins: LocationBin[];
}

interface HierarchyCol {
  colCode: string;
  racks: HierarchyRack[];
}

interface HierarchyRow {
  rowCode: string;
  cols: HierarchyCol[];
}

interface LocationsPayload {
  warehouse: { id: string; name: string; code: string; isLocationBased: boolean };
  totalBins: number;
  locations: LocationBin[];
  hierarchy: HierarchyRow[];
}

interface BinStockRow {
  id: string;
  binId: string;
  binCode: string;
  binName: string;
  rowCode: string;
  colCode: string;
  rackCode: string;
  productId: string;
  productName: string;
  productSku: string;
  productBarcode?: string;
  qtyOnHand: number;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Warehouse Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whBranchId, setWhBranchId] = useState("");
  const [whType, setWhType] = useState("BRANCH");
  const [isLocationBased, setIsLocationBased] = useState(false);
  const [creating, setCreating] = useState(false);

  // Manage Locations Drawer/Modal
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [locationData, setLocationData] = useState<LocationsPayload | null>(null);
  const [binStocks, setBinStocks] = useState<BinStockRow[]>([]);
  const [locTab, setLocTab] = useState<"grid" | "generator" | "inventory" | "single">("grid");
  const [locLoading, setLocLoading] = useState(false);

  // Bulk Generator State (4-Steps: Row, Col, Rack, Bin)
  const [genRows, setGenRows] = useState(2);
  const [genCols, setGenCols] = useState(3);
  const [genRacks, setGenRacks] = useState(4);
  const [genBins, setGenBins] = useState(2);
  const [genGenerating, setGenGenerating] = useState(false);

  // Single Bin State
  const [singleRow, setSingleRow] = useState("R01");
  const [singleCol, setSingleCol] = useState("C01");
  const [singleRack, setSingleRack] = useState("RK01");
  const [singleBin, setSingleBin] = useState("B01");
  const [singleAdding, setSingleAdding] = useState(false);

  // Bin Stock Transfer Modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveFromBin, setMoveFromBin] = useState("");
  const [moveToBin, setMoveToBin] = useState("");
  const [moveProduct, setMoveProduct] = useState("");
  const [moveQty, setMoveQty] = useState(1);
  const [moving, setMoving] = useState(false);

  function loadWarehouses() {
    setLoading(true);
    Promise.all([
      api.get<{ data: Warehouse[] }>("/api/v1/warehouses"),
      api.get<{ data: Branch[] }>("/api/v1/branches").catch(() => ({ data: [] })),
    ])
      .then(([whRes, brRes]) => {
        setWarehouses(whRes.data || []);
        setBranches(brRes.data || []);
        if (brRes.data?.[0]?.id) {
          setWhBranchId(brRes.data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadWarehouses();
  }, []);

  async function handleCreateWarehouse() {
    if (!whName.trim()) return alert("Please enter warehouse name");
    setCreating(true);
    try {
      await api.post("/api/v1/warehouses", {
        branchId: whBranchId,
        name: whName.trim(),
        code: whCode.trim() || undefined,
        type: whType,
        isLocationBased,
      });
      setShowCreateModal(false);
      setWhName("");
      setWhCode("");
      setIsLocationBased(false);
      loadWarehouses();
    } catch (e: any) {
      alert(e.message || "Failed to create warehouse");
    } finally {
      setCreating(false);
    }
  }

  async function openLocationManager(wh: Warehouse) {
    setSelectedWarehouse(wh);
    setLocTab("grid");
    setLocLoading(true);
    try {
      const [locRes, stockRes] = await Promise.all([
        api.get<{ data: LocationsPayload }>(`/api/v1/warehouses/${wh.id}/locations`),
        api.get<{ data: BinStockRow[] }>(`/api/v1/warehouses/${wh.id}/bin-stocks`).catch(() => ({ data: [] })),
      ]);
      setLocationData(locRes.data);
      setBinStocks(stockRes.data || []);
    } catch (e: any) {
      alert(e.message || "Failed to load locations");
    } finally {
      setLocLoading(false);
    }
  }

  async function reloadLocations(whId: string) {
    setLocLoading(true);
    try {
      const [locRes, stockRes] = await Promise.all([
        api.get<{ data: LocationsPayload }>(`/api/v1/warehouses/${whId}/locations`),
        api.get<{ data: BinStockRow[] }>(`/api/v1/warehouses/${whId}/bin-stocks`).catch(() => ({ data: [] })),
      ]);
      setLocationData(locRes.data);
      setBinStocks(stockRes.data || []);
      loadWarehouses();
    } catch (e: any) {
      console.error(e);
    } finally {
      setLocLoading(false);
    }
  }

  async function handleBulkGenerate() {
    if (!selectedWarehouse) return;
    setGenGenerating(true);
    try {
      const res = await api.post<{ data: any }>(`/api/v1/warehouses/${selectedWarehouse.id}/locations/bulk-generate`, {
        rows: { prefix: "R", count: genRows, pad: 2 },
        cols: { prefix: "C", count: genCols, pad: 2 },
        racks: { prefix: "RK", count: genRacks, pad: 2 },
        bins: { prefix: "B", count: genBins, pad: 2 },
      });
      alert(res.data?.message || "Locations generated successfully!");
      setLocTab("grid");
      reloadLocations(selectedWarehouse.id);
    } catch (e: any) {
      alert(e.message || "Generation failed");
    } finally {
      setGenGenerating(false);
    }
  }

  async function handleAddSingleBin() {
    if (!selectedWarehouse) return;
    setSingleAdding(true);
    try {
      await api.post(`/api/v1/warehouses/${selectedWarehouse.id}/locations`, {
        rowCode: singleRow.trim(),
        colCode: singleCol.trim(),
        rackCode: singleRack.trim(),
        binCode: singleBin.trim(),
      });
      setLocTab("grid");
      reloadLocations(selectedWarehouse.id);
    } catch (e: any) {
      alert(e.message || "Failed to add bin");
    } finally {
      setSingleAdding(false);
    }
  }

  async function handleDeleteBin(binId: string) {
    if (!selectedWarehouse) return;
    if (!confirm("Are you sure you want to delete this bin location?")) return;
    try {
      await api.del(`/api/v1/warehouses/${selectedWarehouse.id}/locations/${binId}`);
      reloadLocations(selectedWarehouse.id);
    } catch (e: any) {
      alert(e.message || "Cannot delete bin");
    }
  }

  async function handleMoveStock() {
    if (!selectedWarehouse) return;
    if (!moveFromBin || !moveToBin || !moveProduct || moveQty <= 0) {
      return alert("Please fill in all move parameters");
    }
    setMoving(true);
    try {
      await api.post(`/api/v1/warehouses/${selectedWarehouse.id}/bin-stocks/transfer`, {
        fromBinId: moveFromBin,
        toBinId: moveToBin,
        productId: moveProduct,
        qty: Number(moveQty),
      });
      setShowMoveModal(false);
      setMoveFromBin("");
      setMoveToBin("");
      setMoveProduct("");
      reloadLocations(selectedWarehouse.id);
    } catch (e: any) {
      alert(e.message || "Stock transfer failed");
    } finally {
      setMoving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses & Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your physical warehouses, storage hubs, and 4-tier bin locations (Row → Col → Rack → Bin).
          </p>
        </div>
        <CustomButton onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="mr-2" />
          Add Warehouse
        </CustomButton>
      </div>

      {/* Warehouses Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase text-gray-500">
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Branch</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Location Tracking</th>
                <th className="px-6 py-3.5">Inventory Stats</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {warehouses.map((warehouse) => (
                <tr key={warehouse.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">{warehouse.code}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <WhIcon size={16} />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{warehouse.name}</span>
                        {warehouse.isLocationBased && (
                          <div className="text-xs text-primary-600 font-medium">4-Tier Bin Enabled</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 size={15} className="text-gray-400" />
                      <span>{warehouse.branch?.name || "Unassigned"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <CustomBadge tone="gray">{warehouse.type || "BRANCH"}</CustomBadge>
                  </td>
                  <td className="px-6 py-4">
                    {warehouse.isLocationBased ? (
                      <div className="flex items-center gap-1.5">
                        <CustomBadge tone="primary">
                          <Layers size={12} className="mr-1 inline" />
                          {warehouse._count?.binCount || 0} Bins
                        </CustomBadge>
                      </div>
                    ) : (
                      <CustomBadge tone="gray">Standard (No Bins)</CustomBadge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Package size={13} className="text-gray-400" />
                        {warehouse._count?.stockRows || 0} Stock SKUs
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={warehouse.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {warehouse.isLocationBased && (
                        <CustomButton
                          size="sm"
                          variant="outline"
                          onClick={() => openLocationManager(warehouse)}
                        >
                          <Grid3X3 size={14} className="mr-1.5 text-primary-600" />
                          Manage Bins
                        </CustomButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {warehouses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    No warehouses found. Click &quot;Add Warehouse&quot; to create your first storage location.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE WAREHOUSE MODAL */}
      <CustomModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Warehouse"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CustomInput
              label="Warehouse Name *"
              placeholder="e.g. Central Hub / Store Room 1"
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
            />
            <CustomInput
              label="Warehouse Code (Optional)"
              placeholder="e.g. WH-DHK-01"
              value={whCode}
              onChange={(e) => setWhCode(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CustomSelect
              label="Branch Outlet *"
              value={whBranchId}
              onChange={(e) => setWhBranchId(e.target.value)}
              options={branches.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` }))}
            />
            <CustomSelect
              label="Warehouse Type"
              value={whType}
              onChange={(e) => setWhType(e.target.value)}
              options={[
                { value: "BRANCH", label: "Branch On-Premise Store" },
                { value: "CENTRAL", label: "Central Distribution Warehouse" },
                { value: "RETAIL", label: "Retail Shelf & Display" },
                { value: "COLD_STORAGE", label: "Cold Storage / Refrigerated" },
                { value: "TRANSIT", label: "In-Transit Holding Hub" },
              ]}
            />
          </div>

          {/* Location-based checkbox feature */}
          <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3.5 transition-all">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isLocationBased}
                onChange={(e) => setIsLocationBased(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="space-y-0.5 text-left">
                <span className="text-sm font-semibold text-gray-900">
                  Enable Location-Based Warehouse (Row, Col, Rack, Bin)
                </span>
                <p className="text-xs text-gray-500">
                  If enabled, products in this warehouse can be assigned and tracked by a 4-tier bin hierarchy
                  (e.g. <span className="font-mono text-primary-700">R01-C01-RK01-B01</span>). You can generate all bins in 1-click.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </CustomButton>
            <CustomButton loading={creating} onClick={handleCreateWarehouse}>
              Create Warehouse
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* MANAGE LOCATIONS / BINS MODAL */}
      {selectedWarehouse && (
        <CustomModal
          open={!!selectedWarehouse}
          onClose={() => setSelectedWarehouse(null)}
          title={`Location Management — ${selectedWarehouse.name} (${selectedWarehouse.code})`}
          size="6xl"
        >
          <div className="space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
              <button
                type="button"
                onClick={() => setLocTab("grid")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                  locTab === "grid"
                    ? "bg-primary-50 text-primary-700 shadow-xs border border-primary-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                }`}
              >
                <Grid3X3 size={15} className={locTab === "grid" ? "text-primary-600" : "text-gray-400"} />
                <span>Hierarchy & Bin Grid</span>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-bold text-primary-800">
                  {locationData?.totalBins || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLocTab("inventory")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                  locTab === "inventory"
                    ? "bg-primary-50 text-primary-700 shadow-xs border border-primary-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                }`}
              >
                <Boxes size={15} className={locTab === "inventory" ? "text-primary-600" : "text-gray-400"} />
                <span>Bin Product Inventory</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                  {binStocks.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLocTab("generator")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                  locTab === "generator"
                    ? "bg-primary-50 text-primary-700 shadow-xs border border-primary-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                }`}
              >
                <Sparkles size={15} className={locTab === "generator" ? "text-primary-600" : "text-gray-400"} />
                <span>1-Click Bulk Generator</span>
              </button>
              <button
                type="button"
                onClick={() => setLocTab("single")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                  locTab === "single"
                    ? "bg-primary-50 text-primary-700 shadow-xs border border-primary-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                }`}
              >
                <Plus size={15} className={locTab === "single" ? "text-primary-600" : "text-gray-400"} />
                <span>Add Single Bin</span>
              </button>
            </div>

            {locLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-primary-600 mb-3" />
                <p className="text-xs text-gray-500 font-medium">Loading warehouse locations...</p>
              </div>
            ) : (
              <>
                {/* TAB 1: 4-TIER HIERARCHY / GRID VIEW */}
                {locTab === "grid" && (
                  <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
                    {locationData?.hierarchy && locationData.hierarchy.length > 0 ? (
                      locationData.hierarchy.map((row) => (
                        <div key={row.rowCode} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5 shadow-xs">
                          {/* Row Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-200/80">
                            <div className="flex items-center gap-2.5">
                              <span className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 font-mono text-xs font-bold text-white shadow-xs">
                                <Layers size={13} />
                                Row / Aisle: {row.rowCode}
                              </span>
                              <span className="text-xs font-semibold text-gray-500">
                                {row.cols.length} Column{row.cols.length > 1 ? "s" : ""}
                              </span>
                            </div>
                            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-gray-700 border border-gray-200 shadow-2xs">
                              {row.cols.reduce((acc, c) => acc + c.racks.reduce((rAcc, rk) => rAcc + rk.bins.length, 0), 0)} Bins in Row
                            </span>
                          </div>

                          {/* Columns Grid */}
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {row.cols.map((col) => (
                              <div key={col.colCode} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs flex flex-col justify-between">
                                <div>
                                  {/* Column Header */}
                                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                    <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-primary-500" />
                                      Column / Bay: <span className="font-mono text-primary-700 font-extrabold">{col.colCode}</span>
                                    </div>
                                    <span className="text-[11px] font-medium text-gray-400">
                                      {col.racks.length} Rack{col.racks.length > 1 ? "s" : ""}
                                    </span>
                                  </div>

                                  {/* Racks List */}
                                  <div className="space-y-3">
                                    {col.racks.map((rack) => (
                                      <div key={rack.rackCode} className="rounded-lg bg-gray-50/80 p-3 border border-gray-150">
                                        <div className="text-[11px] font-bold text-gray-600 mb-2 flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <span className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[10px] text-gray-700 font-semibold">
                                              Rack: {rack.rackCode}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-gray-400 font-medium">
                                            {rack.bins.length} Bin{rack.bins.length > 1 ? "s" : ""}
                                          </span>
                                        </div>

                                        {/* Bins Grid */}
                                        <div className="grid grid-cols-2 gap-2">
                                          {rack.bins.map((bin) => {
                                            const qty = Number(bin.totalQty || 0);
                                            const isOccupied = qty > 0;
                                            return (
                                              <div
                                                key={bin.id}
                                                className={`group relative rounded-lg border p-2.5 transition-all ${
                                                  isOccupied
                                                    ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 shadow-2xs"
                                                    : "border-gray-200 bg-white hover:border-primary-400 hover:shadow-xs"
                                                }`}
                                              >
                                                <div className="flex items-start justify-between">
                                                  <div className="font-mono text-xs font-black text-gray-900">
                                                    {bin.binCode}
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteBin(bin.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity p-0.5 rounded hover:bg-red-50"
                                                    title="Delete this bin location"
                                                  >
                                                    <Trash2 size={12} />
                                                  </button>
                                                </div>

                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate" title={bin.fullCode}>
                                                  {bin.fullCode}
                                                </div>

                                                <div className="mt-2 flex items-center justify-between">
                                                  <span
                                                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                                      isOccupied
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-gray-100 text-gray-500"
                                                    }`}
                                                  >
                                                    <Package size={10} />
                                                    {qty} Qty
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center bg-gray-50/50">
                        <Layers size={40} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-sm font-bold text-gray-800">No Bin Locations configured yet</h3>
                        <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5">
                          This location-based warehouse needs bins setup. You can generate all Rows, Columns, Racks, and Bins in 1 click!
                        </p>
                        <CustomButton size="sm" onClick={() => setLocTab("generator")}>
                          <Sparkles size={14} className="mr-1.5" />
                          Open 1-Click Bulk Generator
                        </CustomButton>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: BIN INVENTORY */}
                {locTab === "inventory" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Products currently placed inside specific bin locations in this warehouse.
                      </p>
                      {binStocks.length > 0 && (
                        <CustomButton size="sm" variant="outline" onClick={() => setShowMoveModal(true)}>
                          <ArrowRightLeft size={13} className="mr-1.5" />
                          Move Stock Between Bins
                        </CustomButton>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 overflow-hidden max-h-[50vh] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-500">
                            <th className="px-4 py-2.5">Bin Code</th>
                            <th className="px-4 py-2.5">Product Name</th>
                            <th className="px-4 py-2.5">SKU / Barcode</th>
                            <th className="px-4 py-2.5 text-right">Quantity In Bin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {binStocks.map((st) => (
                            <tr key={st.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 font-mono font-bold text-primary-700">{st.binCode}</td>
                              <td className="px-4 py-2.5 font-medium text-gray-900">{st.productName}</td>
                              <td className="px-4 py-2.5 text-gray-500">{st.productSku || st.productBarcode || "—"}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                                {Number(st.qtyOnHand).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {binStocks.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                No products placed in bins yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: 1-CLICK BULK GENERATOR */}
                {locTab === "generator" && (
                  <div className="space-y-4 rounded-xl border border-primary-100 bg-primary-50/20 p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-primary-600" />
                      <h3 className="text-sm font-bold text-gray-900">4-Tier Grid Location Generator</h3>
                    </div>
                    <p className="text-xs text-gray-500">
                      Configure your grid dimensions. The generator will create all Row × Column × Rack × Bin combinations automatically.
                    </p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
                      <CustomInput
                        label="1. Rows / Aisles"
                        type="number"
                        min={1}
                        max={50}
                        value={genRows}
                        onChange={(e) => setGenRows(Number(e.target.value))}
                        helperText="Prefix: R01, R02..."
                      />
                      <CustomInput
                        label="2. Columns / Bays"
                        type="number"
                        min={1}
                        max={50}
                        value={genCols}
                        onChange={(e) => setGenCols(Number(e.target.value))}
                        helperText="Prefix: C01, C02..."
                      />
                      <CustomInput
                        label="3. Racks / Levels"
                        type="number"
                        min={1}
                        max={50}
                        value={genRacks}
                        onChange={(e) => setGenRacks(Number(e.target.value))}
                        helperText="Prefix: RK01, RK02..."
                      />
                      <CustomInput
                        label="4. Bins per Rack"
                        type="number"
                        min={1}
                        max={50}
                        value={genBins}
                        onChange={(e) => setGenBins(Number(e.target.value))}
                        helperText="Prefix: B01, B02..."
                      />
                    </div>

                    <div className="rounded-lg bg-white p-3 border border-gray-200 text-xs">
                      <div className="flex items-center justify-between font-medium text-gray-700">
                        <span>Total Bins to Generate:</span>
                        <span className="font-bold text-primary-600 text-sm">
                          {genRows * genCols * genRacks * genBins} Bins
                        </span>
                      </div>
                      <div className="mt-1 text-gray-400 font-mono">
                        Sample Bin Code: R01-C01-RK01-B01
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <CustomButton loading={genGenerating} onClick={handleBulkGenerate}>
                        <Sparkles size={14} className="mr-1.5" />
                        Generate {genRows * genCols * genRacks * genBins} Bin Locations
                      </CustomButton>
                    </div>
                  </div>
                )}

                {/* TAB 4: ADD SINGLE BIN */}
                {locTab === "single" && (
                  <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-gray-900">Add a Single Custom Bin</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <CustomInput
                        label="Row Code"
                        placeholder="R01"
                        value={singleRow}
                        onChange={(e) => setSingleRow(e.target.value)}
                      />
                      <CustomInput
                        label="Column Code"
                        placeholder="C01"
                        value={singleCol}
                        onChange={(e) => setSingleCol(e.target.value)}
                      />
                      <CustomInput
                        label="Rack Code"
                        placeholder="RK01"
                        value={singleRack}
                        onChange={(e) => setSingleRack(e.target.value)}
                      />
                      <CustomInput
                        label="Bin Code"
                        placeholder="B01"
                        value={singleBin}
                        onChange={(e) => setSingleBin(e.target.value)}
                      />
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      Generated Code: {singleRow.trim()}-{singleCol.trim()}-{singleRack.trim()}-{singleBin.trim()}
                    </div>
                    <div className="flex justify-end pt-2">
                      <CustomButton loading={singleAdding} onClick={handleAddSingleBin}>
                        <Plus size={14} className="mr-1.5" />
                        Save Bin Location
                      </CustomButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CustomModal>
      )}

      {/* INTERNAL BIN TO BIN MOVE MODAL */}
      {showMoveModal && selectedWarehouse && (
        <CustomModal
          open={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          title="Move Stock Between Bins"
          size="lg"
        >
          <div className="space-y-4">
            <CustomSelect
              label="Product to Move *"
              value={moveProduct}
              onChange={(e) => setMoveProduct(e.target.value)}
              options={binStocks.map((st) => ({
                value: st.productId,
                label: `${st.productName} (In: ${st.binCode}, Avail: ${st.qtyOnHand})`,
              }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <CustomSelect
                label="From Bin *"
                value={moveFromBin}
                onChange={(e) => setMoveFromBin(e.target.value)}
                options={(locationData?.locations || []).map((l) => ({
                  value: l.id,
                  label: l.fullCode,
                }))}
              />
              <CustomSelect
                label="To Destination Bin *"
                value={moveToBin}
                onChange={(e) => setMoveToBin(e.target.value)}
                options={(locationData?.locations || [])
                  .filter((l) => l.id !== moveFromBin)
                  .map((l) => ({
                    value: l.id,
                    label: l.fullCode,
                  }))}
              />
            </div>

            <CustomInput
              label="Quantity to Move *"
              type="number"
              min={1}
              value={moveQty}
              onChange={(e) => setMoveQty(Number(e.target.value))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <CustomButton variant="outline" onClick={() => setShowMoveModal(false)}>
                Cancel
              </CustomButton>
              <CustomButton loading={moving} onClick={handleMoveStock}>
                Confirm Internal Transfer
              </CustomButton>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
}