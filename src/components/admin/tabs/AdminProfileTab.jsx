import { DollarSignIcon, ShieldCheckIcon, UsersIcon, GavelIcon, MapIcon, BuildingIcon } from "../AdminIcons";

export default function AdminProfileTab({ user, stats }) {
  const adminEmail = user?.email || "admin@terramatch.com";
  const adminName = user?.name || "Super Administrator";
  const totalRevenueDisplay = stats?.revenue?.totalFormatted || "GH₵ 1,485,000";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Admin Profile & Platform Revenue</h2>
        <p className="text-sm text-slate-400 mt-1">
          Administrator account credentials and live financial revenue analytics for TerraMatch.
        </p>
      </div>

      {/* Admin Identity & Gmail Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900 border-2 border-emerald-500 text-emerald-300 font-black text-2xl shadow-inner ring-4 ring-emerald-500/10">
                {adminName[0]?.toUpperCase() || "A"}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] ring-2 ring-[#111827]">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">{adminName}</h3>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Super Admin
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <span className="text-slate-500 font-semibold">Admin Gmail:</span>
                <span className="font-mono text-emerald-400 font-bold bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                  {adminEmail}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Access Level</span>
              <span className="text-xs font-bold text-emerald-400">Full System Control</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Revenue Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#063929] via-[#0b291e] to-[#111827] p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <DollarSignIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>Total Revenue from App</span>
            </div>
            <h3 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">
              {totalRevenueDisplay}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-emerald-200/80 font-medium">
              Gross platform revenue generated across land bidding commissions, paid contractor subscriptions, and escrow settlement fees.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
            <div className="rounded-xl bg-slate-900/60 border border-emerald-500/20 p-3.5 text-center">
              <span className="block text-[10px] font-bold text-emerald-300/80 uppercase">Monthly Growth</span>
              <span className="text-lg font-black text-emerald-400">+18.4%</span>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-emerald-500/20 p-3.5 text-center">
              <span className="block text-[10px] font-bold text-emerald-300/80 uppercase">Settled Escrows</span>
              <span className="text-lg font-black text-white">99.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Revenue Stream Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {/* Stream 1 */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Pro Subscriptions</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <BuildingIcon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-100">GH₵ 640,000</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Paid Pro Contractor and Verified Landowner monthly/yearly subscription plans.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-bold">+12% this month</span>
            <span className="text-slate-500">43% of total</span>
          </div>
        </div>

        {/* Stream 2 */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Escrow & Bidding Fees</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <GavelIcon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-100">GH₵ 725,000</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              2.5% platform settlement fee on successfully closed land sales and building contracts.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-blue-400 font-bold">+24% this month</span>
            <span className="text-slate-500">49% of total</span>
          </div>
        </div>

        {/* Stream 3 */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Identity & Title Verification</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <ShieldCheckIcon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-100">GH₵ 120,000</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Fast-track Ghana Card biometric and Land Commission survey plan verification fees.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-amber-400 font-bold">+8% this month</span>
            <span className="text-slate-500">8% of total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
