"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, Monitor, Smartphone, Building2, Lock, Unlock } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { StatusBadge } from "@/components/custom/CustomBadge";
import { CustomTable, CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomDropdownSelect } from "@/components/custom/CustomDropdownSelect";

interface Device {
  id: string;
  deviceId?: string;
  code?: string;
  deviceName?: string;
  name?: string;
  deviceType?: "POS" | "KIOSK" | "KDS" | "MOBILE" | "WEB";
  os: string | null;
  appVersion?: string | null;
  status: "PENDING" | "ACTIVE" | "DISABLED" | "BLOCKED";
  isLocked?: boolean | number;
  lastSyncAt: string | null;
  userName?: string | null;
  branch?: { id: string; name: string; code: string } | null;
}

const DEVICE_ICONS: Record<string, any> = {
  POS: Monitor,
  KIOSK: Monitor,
  KDS: Monitor,
  MOBILE: Smartphone,
  WEB: Monitor,
};

const OS_OPTIONS = [
  { value: "Web Browser", label: "Web Browser" },
  { value: "Windows", label: "Windows" },
  { value: "Linux", label: "Linux" },
  { value: "Android", label: "Android" },
  { value: "iOS", label: "iOS" },
];

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ deviceId: "", deviceName: "", os: "Web Browser" });

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Device[] }>("/api/v1/devices");
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? (res as any) : [];
      setDevices(list);
    } catch (err) {
      console.error("Failed to load devices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const openRegister = () => {
    setEditingId(null);
    setForm({ deviceId: `TERM-${Math.floor(100 + Math.random() * 900)}`, deviceName: "", os: "Web Browser" });
    setModalOpen(true);
  };

  const openEdit = (d: Device) => {
    const devId = d.deviceId || d.code || d.id;
    setEditingId(devId);
    setForm({
      deviceId: devId,
      deviceName: d.deviceName || d.name || "",
      os: d.os || "Web Browser",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.deviceId.trim() || !form.deviceName.trim()) return;
    setSaving(true);
    try {
      await api.post("/api/v1/devices/register", {
        deviceId: form.deviceId.trim(),
        deviceName: form.deviceName.trim(),
        os: form.os,
      });
      setModalOpen(false);
      await loadDevices();
    } catch (err) {
      console.error("Failed to register device:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async (d: Device) => {
    const devId = d.deviceId || d.code || d.id;
    try {
      await api.post(`/api/v1/devices/${encodeURIComponent(devId)}/${d.isLocked ? "unlock" : "lock"}`, {});
      await loadDevices();
    } catch (err) {
      console.error("Failed to toggle device lock:", err);
    }
  };

  const handleDelete = async (d: Device) => {
    const devId = d.deviceId || d.code || d.id;
    try {
      await api.delete(`/api/v1/devices/${encodeURIComponent(devId)}`);
      await loadDevices();
    } catch (err) {
      console.error("Failed to delete device:", err);
    }
  };

  const columns: CustomTableColumn<Device>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (d) => (
        <span className="font-mono font-semibold text-gray-600 text-xs">
          {d.deviceId || d.code || d.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (d) => {
        const Icon = DEVICE_ICONS[d.deviceType || "POS"] || Monitor;
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand-50 text-brand-primary border border-brand-border shrink-0">
              <Icon size={14} />
            </div>
            <span className="text-xs font-bold text-gray-600">{d.deviceName || d.name || "Unnamed Terminal"}</span>
          </div>
        );
      },
    },
    {
      key: "deviceType",
      header: "Type",
      align: "center",
      render: (d) => (
        <span className="inline-flex items-center rounded-sm bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 border border-slate-200">
          {d.deviceType || "POS"}
        </span>
      ),
    },
    {
      key: "branch",
      header: "User / Branch",
      render: (d) =>
        d.branch ? (
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-slate-400" />
            <span className="text-xs text-slate-600 font-medium">
              {d.branch.name} ({d.branch.code})
            </span>
          </div>
        ) : d.userName ? (
          <span className="text-xs text-slate-600 font-medium">{d.userName}</span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Unassigned</span>
        ),
    },
    {
      key: "os",
      header: "System",
      render: (d) => (
        <div className="space-y-0.5 text-xs text-slate-600 font-medium">
          <div>{d.os || "—"}</div>
          {d.appVersion && <div className="text-[11px] text-slate-400">v{d.appVersion}</div>}
        </div>
      ),
    },
    {
      key: "lastSyncAt",
      header: "Last Sync",
      render: (d) => (
        <span className="text-xs text-slate-600 font-medium">
          {d.lastSyncAt ? new Date(d.lastSyncAt).toLocaleString() : "Never"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (d) => <StatusBadge status={d.isLocked ? "LOCKED" : d.status || "ACTIVE"} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (d) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            title={d.isLocked ? "Unlock device" : "Lock device"}
            onClick={() => handleToggleLock(d)}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-sm transition cursor-pointer"
          >
            {d.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
          </button>
          <button
            type="button"
            title="Edit device"
            onClick={() => openEdit(d)}
            className="p-1.5 text-slate-500 hover:text-brand-primary hover:bg-brand-50 rounded-sm transition cursor-pointer"
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            title="Remove device"
            onClick={() => handleDelete(d)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      <CustomBreadcrumb
        title="Devices & Terminals"
        icon={<Monitor size={20} />}
        items={[{ label: "Settings", href: "/settings" }, { label: "Devices" }]}
        actions={
          <CustomButton
            size="sm"
            onClick={openRegister}
            leftIcon={<Plus size={15} />}
            className="bg-brand-primary hover:bg-brand-dark text-white rounded-sm text-xs font-semibold"
          >
            Register Device
          </CustomButton>
        }
      />

      <div className="bg-white rounded-sm border border-slate-200 p-4 shadow-2xs">
        <CustomTable<Device>
          columns={columns}
          data={devices}
          loading={loading}
          emptyMessage="No devices found. Register your first device to start using POS."
        />
      </div>

      <CustomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Device / Terminal" : "Register Device / Terminal"}
      >
        <div className="space-y-3">
          <CustomInput
            label="Device Code / ID"
            placeholder="e.g. TERM-101"
            value={form.deviceId}
            disabled={Boolean(editingId)}
            onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
          />
          <CustomInput
            label="Device Name"
            placeholder="e.g. Main Counter POS 1"
            value={form.deviceName}
            onChange={(e) => setForm({ ...form, deviceName: e.target.value })}
          />
          <CustomDropdownSelect
            label="Operating System"
            options={OS_OPTIONS}
            value={form.os}
            onChange={(val) => setForm({ ...form, os: val })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton
              size="sm"
              loading={saving}
              onClick={handleSave}
              className="bg-brand-primary hover:bg-brand-dark text-white"
            >
              {editingId ? "Save Changes" : "Register"}
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
