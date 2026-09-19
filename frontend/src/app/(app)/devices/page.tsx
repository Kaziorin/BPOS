"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Monitor, Smartphone, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { StatusBadge } from "@/components/custom/CustomBadge";
import { CustomTable, CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";

interface Device {
  id: string;
  code: string;
  name: string;
  deviceType: "POS" | "KIOSK" | "KDS" | "MOBILE" | "WEB";
  os: string | null;
  appVersion: string | null;
  status: "PENDING" | "ACTIVE" | "DISABLED" | "BLOCKED";
  lastSyncAt: string | null;
  branch: { id: string; name: string; code: string } | null;
}

const DEVICE_ICONS: Record<Device["deviceType"], any> = {
  POS: Monitor,
  KIOSK: Monitor,
  KDS: Monitor,
  MOBILE: Smartphone,
  WEB: Monitor,
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Device[] }>("/api/v1/devices")
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? (res as any)
          : [];
        setDevices(list);
      })
      .catch((err) => console.error("Failed to load devices:", err))
      .finally(() => setLoading(false));
  }, []);

  const columns: CustomTableColumn<Device>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (d) => <span className="font-mono font-semibold text-gray-600 text-xs">{d.code}</span>,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (d) => {
        const Icon = DEVICE_ICONS[d.deviceType] || Monitor;
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand-50 text-brand-primary border border-brand-border shrink-0">
              <Icon size={14} />
            </div>
            <span className="text-xs font-bold text-gray-600">{d.name}</span>
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
          {d.deviceType}
        </span>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      render: (d) =>
        d.branch ? (
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-slate-400" />
            <span className="text-xs text-slate-600 font-medium">
              {d.branch.name} ({d.branch.code})
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Unassigned</span>
        ),
    },
    {
      key: "os",
      header: "System",
      render: (d) => (
        <div className="space-y-0.5 text-xs text-slate-600 font-medium">
          {d.os && <div>{d.os}</div>}
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
      render: (d) => <StatusBadge status={d.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: () => (
        <div className="flex justify-end gap-1.5">
          <button className="p-1.5 text-slate-500 hover:text-brand-primary hover:bg-brand-50 rounded-sm transition cursor-pointer">
            <Edit size={14} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition cursor-pointer">
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
    </div>
  );
}