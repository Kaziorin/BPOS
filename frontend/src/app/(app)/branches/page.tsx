"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, MapPin, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { StatusBadge } from "@/components/custom/CustomBadge";

interface Branch {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: "ACTIVE" | "INACTIVE";
  company: { id: string; name: string };
  _count: { warehouses: number; userAccounts: number; devices: number };
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Branch[] }>("/api/v1/branches")
      .then((res) => setBranches(res.data))
      .catch((err) => console.error("Failed to load branches:", err))
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
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your business branches</p>
        </div>
        <CustomButton>
          <Plus size={16} className="mr-2" />
          Add Branch
        </CustomButton>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{branch.code}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{branch.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{branch.company.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="space-y-1">
                      {branch.phone && <div>{branch.phone}</div>}
                      {branch.email && <div className="text-xs">{branch.email}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex gap-4">
                      <span title="Warehouses">{branch._count.warehouses} WH</span>
                      <span title="Users">{branch._count.userAccounts} Users</span>
                      <span title="Devices">{branch._count.devices} Devices</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={branch.status} />
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
              {branches.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No branches found. Create your first branch to get started.
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