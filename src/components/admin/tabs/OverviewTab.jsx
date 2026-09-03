import { UsersIcon, MapIcon, GavelIcon, ShieldCheckIcon } from "../AdminIcons";

export default function OverviewTab({ stats, user }) {
  if (!stats) return <OverviewSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
          Good morning, {user?.name?.split(' ')[0] || "Admin"}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Here's what's happening across TerraMatch today.
        </p>
      </div>

      {/* KPI Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1 */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Users</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <UsersIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-slate-100">{stats.users.total.toLocaleString()}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-400">
                +12%
              </span>
              <span className="text-slate-500">from last month</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Verified Contractors</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <ShieldCheckIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-slate-100">{stats.users.contractors.toLocaleString()}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-slate-400">
                <strong className="text-slate-300">{stats.users.verified}</strong> total verified
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Listings</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <MapIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-slate-100">{stats.lands.active.toLocaleString()}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-400">
                +4%
              </span>
              <span className="text-slate-500">from last month</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Verifications</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <GavelIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-slate-100">{stats.verifications.pending}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-amber-500 font-medium">Requires attention</span>
            </div>
          </div>
        </div>

      </div>

      {/* Analytics & Activity */}
      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        
        {/* Left: Platform Distribution (Placeholder for Chart) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-200">Platform Growth</h3>
            <select className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/20">
            <p className="text-sm text-slate-500">Activity Chart Visualization</p>
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-6">Recent Registrations</h3>
          <div className="space-y-4">
            {stats.recentUsers?.map((u) => (
              <div key={u.id} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                  {u.name[0].toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <div>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    {u.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-slate-800 mb-2"></div>
      <div className="h-4 w-48 rounded bg-slate-800 mb-8"></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-xl bg-[#111827] border border-slate-800"></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 h-80 rounded-xl bg-[#111827] border border-slate-800"></div>
        <div className="h-80 rounded-xl bg-[#111827] border border-slate-800"></div>
      </div>
    </div>
  );
}
