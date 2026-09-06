"use client";

import { useEffect, useState } from "react";
import { PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import type { HeldSale } from "../pos-types";

export default function HoldsPage() {
  const router = useRouter();
  const [holds, setHolds] = useState<HeldSale[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get<HeldSale[]>("/api/v1/pos/holds")
      .then(setHolds)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteHold(id: string) {
    await api.del(`/api/v1/pos/holds/${id}`);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Held Sales</h1>
          <p className="mt-1 text-sm text-gray-500">Parked carts — resume from any terminal</p>
        </div>
        <CustomButton onClick={() => router.push("/pos")}>
          Go to POS
        </CustomButton>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
        </div>
      )}

      {!loading && holds.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
          <PauseCircle size={32} />
          <p className="text-sm">No held sales</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {holds.map((h) => (
          <div
            key={h.id}
            className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm font-semibold text-gray-900">{h.holdNo}</p>
                <p className="text-xs text-gray-400">
                  {new Date(h.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                HELD
              </span>
            </div>

            <div className="text-sm text-gray-600">
              <p>{h.cartSnapshot.length} item{h.cartSnapshot.length !== 1 ? "s" : ""}</p>
              {h.note && <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>}
            </div>

            <div className="space-y-1 text-xs text-gray-500">
              {h.cartSnapshot.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="truncate">{item.name}</span>
                  <span className="tabular-nums ml-2">×{item.qty}</span>
                </div>
              ))}
              {h.cartSnapshot.length > 3 && (
                <p className="text-gray-400">+{h.cartSnapshot.length - 3} more</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <CustomButton
                size="sm"
                fullWidth
                leftIcon={<PlayCircle size={13} />}
                onClick={() => router.push("/pos")}
              >
                Resume
              </CustomButton>
              <button
                onClick={() => deleteHold(h.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
