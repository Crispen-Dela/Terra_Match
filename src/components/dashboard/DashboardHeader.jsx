import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

function ShieldCheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 3l7 3v5.5c0 4.6-3 8.4-7 9.5-4-1.1-7-4.9-7-9.5V6l7-3z" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4.2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path
        d="M12 3l1.8 5.4L19 10.2l-5.2 1.8L12 17.4l-1.8-5.4L5 10.2l5.2-1.8L12 3z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardHeader({
  user,
  plan,
  verification,
  profileCompletion = 100,
  onOpenPlans,
  roleLabel = "VERIFIED LAND OWNER",
}) {
  const [imgError, setImgError] = useState(false);
  const isVerified = verification?.status === "VERIFIED" || user?.ghanaCardVerified || true;

  const displayName = user?.name || "Kwame Owusu";
  const displayEmail = user?.email || "kwame.owusu@email.com";
  const displayPhone = user?.phone || "+233 24 123 4567";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#063929] p-6 text-white shadow-xl sm:p-7 border border-[#0d4f3b]">
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: User Avatar & Info */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="relative shrink-0">
            {user?.avatarUrl && !imgError ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="h-16 w-16 rounded-2xl border-2 border-emerald-400/40 object-cover shadow-md sm:h-20 sm:w-20"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-400/40 bg-[#0d4d38] text-2xl font-black text-white shadow-md sm:h-20 sm:w-20">
                {(displayName[0] || "K").toUpperCase()}
              </div>
            )}
            {isVerified && (
              <span
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#059669] text-white shadow-sm ring-2 ring-[#063929]"
                title="Ghana Card Identity Verified"
              >
                <ShieldCheckIcon className="h-4 w-4" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl lg:text-3xl">
                Welcome back, {displayName}
              </h1>
              <span className="rounded-lg bg-[#184837] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 border border-emerald-600/30">
                {roleLabel}
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-emerald-100/80 sm:text-sm font-medium">
              {displayEmail} {displayPhone ? `• ${displayPhone}` : ""}
            </p>

            {/* Ghana Card Verified & Profile Completion */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#134232] px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-600/30">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                Ghana Card Verified
              </span>

              <div className="inline-flex items-center gap-2.5 rounded-full bg-[#134232] px-3.5 py-1 text-xs font-semibold text-white border border-emerald-600/30">
                <span>Profile: {profileCompletion}%</span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-emerald-950">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Subscription Card & Actions */}
        <div className="flex flex-col gap-3.5 lg:items-end">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-700/40 bg-[#042a1e]/80 px-4 py-3 shadow-inner">
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-emerald-200/70">
                SUBSCRIPTION PLAN
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-extrabold text-white sm:text-sm">
                  {plan?.name || "Standard Land Owner"}
                </span>
                <span className="rounded bg-emerald-900/80 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-300 border border-emerald-600/40">
                  FREE
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPlans}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/40 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-white/20 active:scale-95 shadow-xs"
            >
              <SparklesIcon className="h-3.5 w-3.5 text-emerald-300" />
              + Upgrade
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/profile"
              className="inline-flex items-center rounded-xl bg-[#144737] border border-emerald-700/40 px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1c5a47] shadow-xs"
            >
              Edit Profile
            </Link>
            <Link
              to="/messages"
              className="inline-flex items-center rounded-xl bg-[#144737] border border-emerald-700/40 px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1c5a47] shadow-xs"
            >
              Messages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
