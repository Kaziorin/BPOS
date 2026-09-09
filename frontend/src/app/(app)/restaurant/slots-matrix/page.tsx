"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TableProperties,
  Clock,
  ArrowLeft,
  Save,
  Search,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb, CustomButton, CustomInput } from "@/components/custom";
import { toast } from "react-toastify";

interface MatrixProduct {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  sellingPrice: number;
  imageUrl?: string;
  timeSlotIds: string[];
  allTimeSlots: boolean;
}

interface SlotInfo {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color?: string;
  isActive: boolean | number;
}

export default function RestaurantSlotsMatrixPage() {
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [products, setProducts] = useState<MatrixProduct[]>([]);
  const [initialProducts, setInitialProducts] = useState<MatrixProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const fetchMatrixData = async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/v1/restaurant/time-slots/matrix");
      const sData = res?.data?.slots || res?.slots || [];
      const pData = res?.data?.products || res?.products || [];

      setSlots(sData);
      setProducts(pData);
      setInitialProducts(JSON.parse(JSON.stringify(pData)));
    } catch (err: any) {
      toast.error(err.message || "Failed to load shift matrix data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrixData();
  }, []);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || p.categoryName === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // Check if any product was modified
  const hasChanges = useMemo(() => {
    return JSON.stringify(products) !== JSON.stringify(initialProducts);
  }, [products, initialProducts]);

  const handleToggleAllShifts = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextAll = !p.allTimeSlots;
        return {
          ...p,
          allTimeSlots: nextAll,
          timeSlotIds: nextAll ? [] : (p.timeSlotIds.length > 0 ? p.timeSlotIds : slots.map((s) => s.id)),
        };
      })
    );
  };

  const handleToggleSlot = (productId: string, slotId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const currentSlots = p.timeSlotIds || [];
        const isSelected = currentSlots.includes(slotId);
        let nextSlots = isSelected
          ? currentSlots.filter((id) => id !== slotId)
          : [...currentSlots, slotId];

        return {
          ...p,
          allTimeSlots: false,
          timeSlotIds: nextSlots,
        };
      })
    );
  };

  const handleSelectAllForSlot = (slotId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        const currentSlots = p.timeSlotIds || [];
        if (!currentSlots.includes(slotId)) {
          return {
            ...p,
            allTimeSlots: false,
            timeSlotIds: [...currentSlots, slotId],
          };
        }
        return p;
      })
    );
    toast.info("Selected all dishes for this shift");
  };

  const handleClearAllForSlot = (slotId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        return {
          ...p,
          timeSlotIds: (p.timeSlotIds || []).filter((id) => id !== slotId),
        };
      })
    );
    toast.info("Cleared all dishes from this shift");
  };

  const handleMarkAll24Seven = () => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        allTimeSlots: true,
        timeSlotIds: [],
      }))
    );
    toast.info("Set all dishes to 24/7 (All Shifts)");
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const assignments = products.map((p) => ({
        productId: p.id,
        timeSlotIds: p.timeSlotIds,
        allTimeSlots: p.allTimeSlots,
      }));

      await api.put("/v1/restaurant/time-slots/matrix", { assignments });
      setInitialProducts(JSON.parse(JSON.stringify(products)));
      toast.success("✓ All food time-slot assignments saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save slot assignments");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 w-full min-h-screen bg-slate-50/50">
      {/* Breadcrumb Header */}
      <CustomBreadcrumb
        title="Food Shifts & Time Slots Matrix"
        description="Quickly assign and unassign meal shift serving hours across your entire restaurant food catalog in bulk."
        icon={<TableProperties size={18} className="text-teal-600" />}
        items={[
          { label: "Restaurant", href: "/restaurant" },
          { label: "Food Shifts Matrix" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href="/restaurant"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-2xs"
            >
              <ArrowLeft size={14} /> Back to Hub
            </Link>

            <CustomButton
              onClick={handleSaveChanges}
              disabled={!hasChanges || saving}
              className={`px-5 py-2 font-bold text-xs shadow-md transition ${
                hasChanges
                  ? "bg-teal-600 hover:bg-teal-700 text-white animate-pulse"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Save size={14} className="mr-1.5" />
              {saving ? "Saving Matrix..." : hasChanges ? "Save Matrix Changes" : "No Changes"}
            </CustomButton>
          </div>
        }
      />

      {/* Control Bar: Filters & Quick Bulk Tools */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search foods by name or SKU..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAll24Seven}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Mark All 24/7 (All Shifts)
          </button>
          <button
            onClick={fetchMatrixData}
            className="p-2 text-slate-500 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-xl transition cursor-pointer"
            title="Reload Matrix Data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Matrix Table Grid Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <RefreshCw size={28} className="mx-auto animate-spin text-teal-600" />
            <p className="text-xs font-semibold text-slate-600">Loading Food Shifts Matrix...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 min-w-[240px]">Food Product Item</th>
                  <th className="py-3 px-3 min-w-[100px]">Category</th>
                  <th className="py-3 px-3 min-w-[90px] text-right">Price</th>
                  
                  {/* Column 1: All Shifts (24/7) */}
                  <th className="py-3 px-4 text-center bg-teal-50/50 min-w-[130px] border-l border-r border-teal-100">
                    <span className="block text-teal-900 font-extrabold">All Shifts (24/7)</span>
                    <span className="text-[9px] text-teal-600 normal-case font-normal">Available Anytime</span>
                  </th>

                  {/* Columns for Each Configured Slot */}
                  {slots.map((slot) => (
                    <th key={slot.id} className="py-3 px-4 text-center min-w-[140px] border-r border-slate-100">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: slot.color || "#0d9488" }}
                          />
                          {slot.name}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 font-normal">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => handleSelectAllForSlot(slot.id)}
                            className="text-[9px] text-teal-600 hover:underline font-bold"
                          >
                            + All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleClearAllForSlot(slot.id)}
                            className="text-[9px] text-rose-500 hover:underline font-bold"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const isAll = prod.allTimeSlots;
                  const activeSlotsCount = isAll ? slots.length : prod.timeSlotIds.length;

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isAll ? "bg-white" : activeSlotsCount === 0 ? "bg-amber-50/20" : "bg-white"
                      }`}
                    >
                      {/* Product Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                              {prod.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate max-w-[220px]">
                              {prod.name}
                            </h4>
                            <span className="font-mono text-[10px] text-slate-400">
                              SKU: {prod.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {prod.categoryName}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-800 tabular-nums">
                        ৳{prod.sellingPrice.toLocaleString()}
                      </td>

                      {/* All Shifts 24/7 Checkbox Cell */}
                      <td className="py-3 px-4 text-center bg-teal-50/30 border-l border-r border-teal-100">
                        <label className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-teal-100/50 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAll}
                            onChange={() => handleToggleAllShifts(prod.id)}
                            className="h-4.5 w-4.5 rounded border-teal-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Individual Slots Checkbox Cells */}
                      {slots.map((slot) => {
                        const isChecked = isAll || (prod.timeSlotIds || []).includes(slot.id);

                        return (
                          <td key={slot.id} className="py-3 px-4 text-center border-r border-slate-100">
                            <label className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSlot(prod.id, slot.id)}
                                className={`h-4.5 w-4.5 rounded cursor-pointer ${
                                  isAll
                                    ? "border-teal-400 text-teal-600 opacity-60"
                                    : "border-slate-300 text-teal-600 focus:ring-teal-500"
                                }`}
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={4 + slots.length} className="py-12 text-center text-slate-500">
                      <p className="font-semibold text-sm">No food items found matching criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-teal-600" />
            <span>
              Items with <strong>All Shifts</strong> checked are served 24/7 across every shift. Individual shift checks restrict items to specific hours when the POS filter is enabled.
            </span>
          </div>

          <CustomButton
            onClick={handleSaveChanges}
            disabled={!hasChanges || saving}
            size="sm"
            className={`font-bold text-xs ${
              hasChanges
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Save size={13} className="mr-1" />
            {saving ? "Saving Changes..." : "Save Matrix"}
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
