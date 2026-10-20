import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, CheckCircle2, X } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setDismissed(false);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (dismissed && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-fade-in pointer-events-auto">
      {!isOnline ? (
        <div className="flex items-start gap-3 p-3.5 bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100">
          <div className="p-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl shrink-0 mt-0.5">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-1 flex-1 pr-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 font-display">Offline Mode Active</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold">
                Local Save
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Critical UI assets and service worker cache active. You can continue editing your resumes — all changes are preserved locally on this device.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : showReconnected ? (
        <div className="flex items-center gap-3 p-3.5 bg-slate-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100">
          <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 font-display">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Back Online
            </h4>
            <p className="text-[11px] text-slate-300">
              Live network restored. Local edits are syncing with cloud backup.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
