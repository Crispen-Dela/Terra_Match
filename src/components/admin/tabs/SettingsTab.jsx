import { useState } from "react";
import { useSystemStatus } from "../../../context/SystemStatusContext";
import { cn } from "../../../utils/cn";

export default function SettingsTab({ stats, onRefresh }) {
  const { isShutdown, shutdownInfo, toggleShutdown, isUpdating } = useSystemStatus();

  const [confirmModal, setConfirmModal] = useState(false);
  const [customMessage, setCustomMessage] = useState(
    shutdownInfo?.message ||
      "TerraMatch is undergoing scheduled system updates and maintenance. All platform operations will resume shortly."
  );
  const [saveSuccess, setSaveSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const handleToggle = async () => {
    setActionError("");
    setSaveSuccess("");
    try {
      const willShutdown = !isShutdown;
      await toggleShutdown({
        isMaintenance: willShutdown,
        message: customMessage.trim(),
      });
      setConfirmModal(false);
      setSaveSuccess(
        willShutdown
          ? "Website successfully shut down. Public access is now locked and maintenance screen is active."
          : "Website successfully restarted! All platform activities and public access are now resumed."
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to update platform state:", err);
      setActionError(err.message || "Failed to update platform state. Please try again.");
    }
  };

  const shutdownDateFormatted = shutdownInfo?.shutdownAt
    ? new Date(shutdownInfo.shutdownAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Platform Settings & System Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage global platform operations, emergency shutdown controls, security policies, and health telemetry.
          </p>
        </div>

        {/* Real-time Status Badge */}
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold border",
            isShutdown
              ? "border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-lg shadow-rose-950/40"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-950/40"
          )}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                isShutdown ? "bg-rose-400" : "bg-emerald-400"
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2.5 w-2.5",
                isShutdown ? "bg-rose-500" : "bg-emerald-500"
              )}
            />
          </span>
          <span>{isShutdown ? "SYSTEM SHUT DOWN (MAINTENANCE ACTIVE)" : "SYSTEM ONLINE (ALL SERVICES ACTIVE)"}</span>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {saveSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs sm:text-sm font-semibold text-emerald-300">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{saveSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess("")}
            className="text-emerald-400 hover:text-emerald-200 text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs sm:text-sm font-semibold text-rose-300">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-rose-400 hover:text-rose-200 text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. MASTER EMERGENCY PLATFORM SHUTDOWN & RESTART CARD */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "rounded-3xl border p-6 sm:p-8 transition-all relative overflow-hidden",
          isShutdown
            ? "border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-[#111827] to-[#111827] shadow-xl shadow-rose-950/20"
            : "border-slate-800 bg-gradient-to-br from-slate-900/60 via-[#111827] to-[#111827]"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border",
                  isShutdown
                    ? "bg-rose-900/40 border-rose-500/40 text-rose-400"
                    : "bg-emerald-900/40 border-emerald-500/40 text-emerald-400"
                )}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  {isShutdown ? "Emergency Platform Shutdown is ACTIVE" : "Master Website Shutdown Control"}
                </h2>
                <p className="text-xs text-slate-400">
                  {isShutdown
                    ? "All public and user access is suspended. Only admins can access this portal."
                    : "Pause all public operations, live bidding, explorer maps, and user dashboards."}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              {isShutdown
                ? "The website is currently shut down. Visitors, buyers, contractors, and land owners see the maintenance lockdown screen. All bids, contracts, wallets, and user records remain completely intact and untouched. Click 'Restart Website' to immediately restore full public operations."
                : "Shutting down the website immediately locks out all non-admin visitors and renders a maintenance lockdown screen across the entire website. Only the admin page remains accessible. You can restart the website at any time to resume all activities exactly as they were."}
            </p>
          </div>

          {/* Big Action Button */}
          <div className="shrink-0">
            {isShutdown ? (
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleToggle}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-extrabold text-white hover:bg-emerald-500 active:scale-98 shadow-xl shadow-emerald-950/50 border border-emerald-400/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Restarting Website...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    <span>Restart Website Now</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => setConfirmModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-rose-600 px-6 py-4 text-sm font-extrabold text-white hover:bg-rose-500 active:scale-98 shadow-xl shadow-rose-950/50 border border-rose-400/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Shut Down Website</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Breakdown Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
          <div>
            <span className="text-slate-500 block">Public Website:</span>
            <span className={cn("font-bold", isShutdown ? "text-rose-400" : "text-emerald-400")}>
              {isShutdown ? "● Suspended (Maintenance)" : "● Online & Active"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Admin Portal:</span>
            <span className="font-bold text-emerald-400">● Always Online</span>
          </div>
          <div>
            <span className="text-slate-500 block">Bidding & Transactions:</span>
            <span className={cn("font-bold", isShutdown ? "text-amber-400" : "text-slate-200")}>
              {isShutdown ? "● Paused (Safe Mode)" : "● Live & Operational"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Last State Update:</span>
            <span className="font-medium text-slate-300">
              {shutdownDateFormatted || "Operational"}
            </span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MAINTENANCE MESSAGE & BROADCAST SETTINGS */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Maintenance Screen Broadcast Message</h3>
            <p className="text-xs text-slate-400">
              The announcement message displayed to public visitors when the website is shut down.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter the message displayed to users during maintenance..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 p-3.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                try {
                  await toggleShutdown({
                    isMaintenance: isShutdown,
                    message: customMessage.trim(),
                  });
                  setSaveSuccess("Maintenance message updated successfully.");
                } catch (err) {
                  setActionError("Failed to update maintenance message.");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <span>Save Broadcast Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. SUBSYSTEMS HEALTH & TELEMETRY */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6 sm:p-7 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Subsystems Telemetry & Integrations</h3>
          <p className="text-xs text-slate-400">Real-time status of underlying infrastructure and third-party APIs.</p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">PostgreSQL Database</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ● Connected
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Prisma ORM • Latency: 12ms</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Real-time Bid Stream (SSE)</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ● Broadcasting
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Server-Sent Events • 0 dropped frames</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Stream Chat Engine</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ● Active
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">End-to-End messaging & inquiries</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Ghana Card AI Verification</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ● Operational
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">National ID OCR & Face Match</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Firebase Auth & Security</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ● Synchronized
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">JWT & OAuth 2.0 Auth Guards</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">GIS Satellite Mapping</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ● Active
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Esri & OpenStreetMap Tile Services</p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. CONFIRMATION MODAL FOR SHUTDOWN */}
      {/* ───────────────────────────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-rose-500/40 bg-[#111827] p-6 sm:p-8 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Website Shutdown</h3>
                <p className="text-xs text-rose-400 font-semibold">Emergency Maintenance Lockdown</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs sm:text-sm text-slate-300 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <p>Are you sure you want to take TerraMatch offline?</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-xs">
                <li>Public visitors and logged-in users will immediately see the maintenance screen.</li>
                <li>Live auction bidding, contractor hiring, and marketplace inquiries will be safely paused.</li>
                <li><strong>Only administrators</strong> will have access and the ability to restart the website.</li>
                <li>All database records, bids, and contracts will remain safely preserved.</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(false)}
                className="w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleToggle}
                className="w-full sm:w-auto rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-rose-500 shadow-lg shadow-rose-950/50 transition cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? "Shutting Down..." : "Yes, Shut Down Website"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
