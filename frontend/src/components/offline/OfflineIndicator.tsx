"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, CloudOff, AlertTriangle } from "lucide-react";
import { syncManager, type SyncStatusInfo } from "@/lib/offline/sync";

/**
 * OfflineIndicator (§13 / §10.37).
 *
 * Sticky top bar showing:
 *  - Online/offline status with icon
 *  - Pending transaction count
 *  - Sync status (syncing, last sync time)
 *  - Manual sync button
 */
export default function OfflineIndicator() {
  const [info, setInfo] = useState<SyncStatusInfo>({
    online: true,
    syncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncAt: null,
  });

  useEffect(() => {
    return syncManager.subscribe(setInfo);
  }, []);

  const handleSync = async () => {
    await syncManager.syncPending();
  };

  // Don't render anything if online with no pending — clean POS screen
  if (info.online && info.pendingCount === 0 && info.failedCount === 0) return null;

  return (
    <div
      className={`sticky top-0 z-50 flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors ${
        info.online
          ? info.pendingCount > 0
            ? "bg-amber-500 text-white"
            : "bg-emerald-500 text-white"
          : "bg-red-500 text-white animate-pulse"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        {info.online ? (
          <Wifi size={16} />
        ) : (
          <WifiOff size={16} />
        )}

        {/* Status text */}
        <span>
          {info.online ? "Online" : "OFFLINE — Sales will sync when connected"}
        </span>

        {/* Syncing spinner */}
        {info.syncing && (
          <span className="flex items-center gap-1">
            <RefreshCw size={14} className="animate-spin" />
            Syncing…
          </span>
        )}

        {/* Pending count */}
        {info.pendingCount > 0 && !info.syncing && (
          <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {info.pendingCount} pending
          </span>
        )}

        {/* Failed count */}
        {info.failedCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-red-700 px-2 py-0.5 text-xs">
            <AlertTriangle size={12} />
            {info.failedCount} failed
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Last sync time */}
        {info.lastSyncAt && (
          <span className="text-xs opacity-75">
            Last sync: {new Date(info.lastSyncAt).toLocaleTimeString()}
          </span>
        )}

        {/* Manual sync button */}
        {info.online && (info.pendingCount > 0 || info.failedCount > 0) && (
          <button
            onClick={handleSync}
            disabled={info.syncing}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold transition hover:bg-white/30 disabled:opacity-50"
          >
            <RefreshCw size={12} className={info.syncing ? "animate-spin" : ""} />
            Sync Now
          </button>
        )}

        {/* Offline mode indicator */}
        {!info.online && (
          <span className="flex items-center gap-1 text-xs">
            <CloudOff size={12} />
            Offline Mode
          </span>
        )}
      </div>
    </div>
  );
}
