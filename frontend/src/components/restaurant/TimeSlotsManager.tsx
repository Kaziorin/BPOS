"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sliders,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Sparkles,
  AlertCircle,
  TableProperties,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton, CustomModal, CustomInput } from "@/components/custom";
import { toast } from "react-toastify";

export interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek?: string;
  isActive: boolean | number;
  color?: string;
  description?: string;
}

const SHIFT_PRESETS = [
  { name: "Breakfast / Morning", startTime: "07:00", endTime: "11:30", color: "#f59e0b", icon: Coffee, desc: "Morning breakfast, tea/coffee, bakery items" },
  { name: "Lunch Shift", startTime: "12:00", endTime: "16:00", color: "#0d9488", icon: Sun, desc: "Lunch combo sets, biryani, thali, regular meals" },
  { name: "Evening Snacks", startTime: "16:00", endTime: "19:00", color: "#6366f1", icon: Sparkles, desc: "Tea, street food snacks, quick bites, fries" },
  { name: "Dinner Shift", startTime: "19:00", endTime: "23:30", color: "#ec4899", icon: Moon, desc: "Dinner menu, grills, steaks, family platters" },
  { name: "Late Night Express", startTime: "23:30", endTime: "04:00", color: "#8b5cf6", icon: Moon, desc: "Late night midnight cravings & takeaway" },
];

export default function TimeSlotsManager() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<TimeSlot | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [filterEnabled, setFilterEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bpos_restaurant_time_slot_filter");
      if (cached !== null) return cached === "true";
    }
    return false;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [savingFilter, setSavingFilter] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [formName, setFormName] = useState("");
  const [formStartTime, setFormStartTime] = useState("12:00");
  const [formEndTime, setFormEndTime] = useState("16:00");
  const [formColor, setFormColor] = useState("#0d9488");
  const [formDesc, setFormDesc] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const [resSlots, resSettings] = await Promise.all([
        api.get<any>("/v1/restaurant/time-slots").catch(() => ({ data: {} })),
        api.get<any>("/v1/restaurant/time-slots/settings").catch(() => ({ data: {} })),
      ]);

      const sData = resSlots.data?.slots || resSlots.slots || resSlots.data || [];
      if (Array.isArray(sData)) {
        setSlots(sData);
      }
      setActiveSlot(resSlots.data?.activeSlot || resSlots.activeSlot || null);
      setCurrentTime(resSlots.data?.currentTime || resSlots.currentTime || "");

      let fEnabled = filterEnabled;
      if (resSettings.data?.timeSlotFilterEnabled !== undefined) {
        fEnabled = Boolean(resSettings.data.timeSlotFilterEnabled);
      } else if (resSlots.data?.timeSlotFilterEnabled !== undefined) {
        fEnabled = Boolean(resSlots.data.timeSlotFilterEnabled);
      }
      setFilterEnabled(fEnabled);
      if (typeof window !== "undefined") {
        localStorage.setItem("bpos_restaurant_time_slot_filter", String(fEnabled));
      }
    } catch (err) {
      console.error("Failed to fetch time slots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const handleToggleGlobalFilter = async () => {
    const nextVal = !filterEnabled;
    setFilterEnabled(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("bpos_restaurant_time_slot_filter", String(nextVal));
    }
    setSavingFilter(true);
    try {
      await api.put("/v1/restaurant/time-slots/settings", {
        timeSlotFilterEnabled: nextVal,
      });
      toast.success(
        nextVal
          ? "✓ POS Shift Filter is now ON!"
          : "POS Shift Filter is now OFF (All menu items shown)."
      );
    } catch (err: any) {
      console.error("Failed to update filter setting on server:", err);
      toast.info(
        nextVal
          ? "✓ POS Shift Filter is ON"
          : "POS Shift Filter is OFF"
      );
    } finally {
      setSavingFilter(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingSlot(null);
    setFormName("");
    setFormStartTime("12:00");
    setFormEndTime("16:00");
    setFormColor("#0d9488");
    setFormDesc("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setFormName(slot.name);
    setFormStartTime(slot.startTime);
    setFormEndTime(slot.endTime);
    setFormColor(slot.color || "#0d9488");
    setFormDesc(slot.description || "");
    setFormIsActive(Boolean(slot.isActive));
    setIsModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formStartTime || !formEndTime) {
      toast.warn("Shift Name, Start Time, and End Time are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        startTime: formStartTime,
        endTime: formEndTime,
        color: formColor,
        description: formDesc,
        isActive: formIsActive,
      };

      if (editingSlot) {
        await api.put(`/v1/restaurant/time-slots/${editingSlot.id}`, payload);
        toast.success("Meal Shift updated successfully!");
      } else {
        await api.post("/v1/restaurant/time-slots", payload);
        toast.success("Meal Shift created successfully!");
      }

      setIsModalOpen(false);
      fetchTimeSlots();
    } catch (err: any) {
      toast.error(err.message || "Failed to save meal shift");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" meal shift?`)) return;
    try {
      await api.delete(`/v1/restaurant/time-slots/${id}`);
      toast.success("Meal shift deleted!");
      fetchTimeSlots();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete meal shift");
    }
  };

  const handleLoadStandardPresets = async () => {
    setLoading(true);
    try {
      for (const p of SHIFT_PRESETS) {
        await api.post("/v1/restaurant/time-slots", {
          name: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          color: p.color,
          description: p.desc,
          isActive: true,
        });
      }
      toast.success("Loaded 5 standard restaurant meal shift presets!");
      fetchTimeSlots();
    } catch (err: any) {
      toast.error(err.message || "Failed to load presets");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Controls Card: Global Filter & Navigation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
            <Clock size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Restaurant Time Slots &amp; Meal Shifts
              </h2>
              {currentTime && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Clock: {currentTime}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control when specific foods/menus appear at the Restaurant POS based on shift schedules.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Global Filter Switcher */}
          <button
            type="button"
            onClick={handleToggleGlobalFilter}
            disabled={savingFilter}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs ${
              filterEnabled
                ? "bg-teal-50 border-teal-400 text-teal-950 ring-2 ring-teal-200/60"
                : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
            title="Toggle time-slot based product filtering on POS"
          >
            <div className="flex flex-col text-left">
              <span className="text-xs font-extrabold leading-tight">
                POS Shift Filter
              </span>
              <span className="text-[11px] font-bold mt-0.5">
                {filterEnabled ? (
                  <span className="text-teal-700 font-bold">🟢 ON (Filtered by Shift)</span>
                ) : (
                  <span className="text-slate-500 font-semibold">⚪ OFF (Show All Items)</span>
                )}
              </span>
            </div>
            <div
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                filterEnabled ? "bg-teal-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  filterEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
          </button>

          <Link
            href="/restaurant/slots-matrix"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold shadow-xs transition"
          >
            <TableProperties size={15} />
            Bulk Food Slot Matrix
            <ArrowRight size={13} />
          </Link>

          <CustomButton
            onClick={handleOpenCreateModal}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2"
          >
            <Plus size={15} className="mr-1" /> Add Meal Shift
          </CustomButton>
        </div>
      </div>

      {/* Active Shift Indicator Banner */}
      {activeSlot && (
        <div className="p-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/90 to-orange-50/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Sun size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Current Active Meal Shift:
                </span>
                <span className="font-extrabold text-sm text-slate-900">
                  {activeSlot.name}
                </span>
              </div>
              <p className="text-xs text-amber-800 font-mono mt-0.5">
                Schedule: {activeSlot.startTime} – {activeSlot.endTime} • Foods assigned to this shift are prioritized at POS.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            ● Live Shift
          </span>
        </div>
      )}

      {/* Time Slots Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot) => {
          const isCurrentActive = activeSlot?.id === slot.id;
          const isActive = Boolean(slot.isActive);

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border bg-white p-4 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                isCurrentActive
                  ? "border-teal-400 ring-2 ring-teal-100"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Top Row: Shift Name & Status */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: slot.color || "#0d9488" }}
                    />
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {slot.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isCurrentActive
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {isCurrentActive ? "Active Now" : isActive ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Timing Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-800 my-2">
                  <Clock size={13} className="text-teal-600" />
                  {slot.startTime} – {slot.endTime}
                </div>

                {slot.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {slot.description}
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  {slot.daysOfWeek === "ALL" || !slot.daysOfWeek ? "Every Day (Mon–Sun)" : slot.daysOfWeek}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(slot)}
                    className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                    title="Edit Shift"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(slot.id, slot.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete Shift"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {slots.length === 0 && !loading && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center space-y-3">
            <Clock size={36} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">No Meal Shifts Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create meal shifts (like Breakfast, Lunch, Dinner) so you can assign foods to specific serving times.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <CustomButton
                onClick={handleLoadStandardPresets}
                variant="outline"
                size="sm"
                className="text-xs font-bold"
              >
                ✨ Load 5 Standard Presets
              </CustomButton>
              <CustomButton
                onClick={handleOpenCreateModal}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
              >
                <Plus size={14} className="mr-1" /> Add Custom Shift
              </CustomButton>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Shift Modal */}
      <CustomModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlot ? "Edit Meal Shift" : "Add New Meal Shift"}
        size="md"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          <CustomInput
            label="Shift / Slot Name *"
            placeholder="e.g., Breakfast / Morning or Lunch Shift"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Start Time (24hr) *"
              type="time"
              value={formStartTime}
              onChange={(e) => setFormStartTime(e.target.value)}
            />
            <CustomInput
              label="End Time (24hr) *"
              type="time"
              value={formEndTime}
              onChange={(e) => setFormEndTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Badge Color Tag
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-9 w-12 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white"
                />
                <span className="font-mono text-xs text-slate-600 font-bold">{formColor}</span>
              </div>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Enable this shift
              </label>
            </div>
          </div>

          <CustomInput
            label="Description (Optional)"
            placeholder="e.g., Fast morning snacks, tea, paratha"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5"
            >
              {submitting ? "Saving..." : editingSlot ? "Update Shift" : "Create Shift"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>
    </div>
  );
}
