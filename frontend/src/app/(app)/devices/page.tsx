"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Monitor, Smartphone, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { StatusBadge } from "@/components/custom/CustomBadge";

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
      .then((res) => setDevices(res.data))
      .catch((err) => console.error("Failed to load devices:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="mt-1 text-sm text-gray-500">Manage POS terminals, kiosks, and other devices</p>
        </div>
        <CustomButton>
          <Plus size={16} className="mr-2" />
          Register Device
        </CustomButton>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">System</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Sync</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {devices.map((device) => {
                const Icon = DEVICE_ICONS[device.deviceType];
                return (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{device.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {device.deviceType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {device.branch ? (
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{device.branch.name} ({device.branch.code})</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        {device.os && <div>{device.os}</div>}
                        {device.appVersion && <div className="text-xs">v{device.appVersion}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleString() : "Never"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={device.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    No devices found. Register your first device to start using POS.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}