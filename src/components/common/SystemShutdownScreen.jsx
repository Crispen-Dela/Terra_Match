import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSystemStatus } from "../../context/SystemStatusContext";

export default function SystemShutdownScreen() {
  const { shutdownInfo, checkStatus } = useSystemStatus();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date());

  const handleManualCheck = async () => {
    setChecking(true);
    await checkStatus();
    setLastChecked(new Date());
    setTimeout(() => setChecking(false), 600);
  };

  const shutdownTime = shutdownInfo?.shutdownAt
    ? new Date(shutdownInfo.shutdownAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="relative min-h-screen w-full bg-[#0B0F14] text-slate-200 font-sans flex flex-col justify-between overflow-hidden selection:bg-rose-500/30">
      {/* Background glowing gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-rose-900/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-96 w-96 rounded-full bg-amber-900/10 blur-3xl" />

      {/* Top Brand Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#111827]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forest-600 to-forest-800 text-white font-extrabold shadow-lg shadow-forest-950/40 text-sm">
            TM
          </span>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white tracking-wide">
              TerraMatch Ghana
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Verified Land & Construction Ecosystem
            </span>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span>Maintenance Mode Active</span>
        </div>
      </header>

      {/* Center Hero Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#111827]/90 p-6 sm:p-10 shadow-2xl shadow-black/80 backdrop-blur-xl text-center">
          {/* Animated Power/Lock Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-950/50 border border-rose-500/30 shadow-inner shadow-rose-900/30">
            <svg
              className="h-10 w-10 text-rose-400 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Maintenance in Progress
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            {shutdownInfo?.message ||
              "TerraMatch has been temporarily taken offline by system administrators for scheduled platform maintenance and security updates."}
          </p>

          {/* System Status Details Box */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left space-y-3.5">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2.5">
              <span className="text-slate-400">Current System State:</span>
              <span className="font-bold text-rose-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                SHUT DOWN (Public Access Suspended)
              </span>
            </div>

            {shutdownTime && (
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2.5">
                <span className="text-slate-400">Shutdown Initiated:</span>
                <span className="font-medium text-slate-200">{shutdownTime}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2.5">
              <span className="text-slate-400">Data & Bids Integrity:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                ✓ 100% Preserved & Secured
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Automatic Reconnection:</span>
              <span className="font-medium text-slate-300">
                Polling live status every 4s
              </span>
            </div>
          </div>

          {/* Reconnect & Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={checking}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg
                className={`h-3.5 w-3.5 ${checking ? "animate-spin text-emerald-400" : "text-slate-400"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{checking ? "Checking System Status..." : "Check Status Now"}</span>
            </button>
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            This page will automatically refresh and resume all operations as soon as the website is restarted.
          </p>
        </div>
      </main>

      {/* Footer with Discreet Admin Portal Link */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 px-6 py-4 bg-[#111827]/40 text-xs text-slate-500 gap-2">
        <span>© {new Date().getFullYear()} TerraMatch Ghana. All Rights Reserved.</span>

        <div className="flex items-center gap-4">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 font-medium transition-colors cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Admin Portal Access &rarr;</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
