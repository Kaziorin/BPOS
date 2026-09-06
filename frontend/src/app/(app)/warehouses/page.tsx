"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Warehouse, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { StatusBadge } from "@/components/custom/CustomBadge";

interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string | null;
  status: "ACTIVE" | "INACTIVE";
  branch: { id: string; name: string; code: string };
  _count: { stockRows: number; terminals: number };
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Warehouse[] }>("/api/v1/warehouses")
      .then((res) => setWarehouses(res.data))
      .catch((err) => console.error("Failed to load warehouses:", err))
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
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your warehouses and inventory locations</p>
        </div>
        <CustomButton>
          <Plus size={16} className="mr-2" />
          Add Warehouse
        </CustomButton>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {warehouses.map((warehouse) => (
                <tr key={warehouse.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{warehouse.code}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Warehouse size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{warehouse.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{warehouse.branch.name} ({warehouse.branch.code})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{warehouse.type || "Standard"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex gap-4">
                      <span title="Stock Items">{warehouse._count.stockRows} Items</span>
                      <span title="Terminals">{warehouse._count.terminals} POS</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={warehouse.status} />
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
              ))}
              {warehouses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No warehouses found. Create your first warehouse to manage inventory.
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