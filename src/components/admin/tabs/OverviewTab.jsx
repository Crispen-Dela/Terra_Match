import { UsersIcon, MapIcon, GavelIcon, ShieldCheckIcon, DollarSignIcon, BuildingIcon } from "../AdminIcons";

export default function OverviewTab({ stats, users = [], user, onNavigateTab }) {
  if (!stats) return <OverviewSkeleton />;

  // Dynamic role counts calculated from live users list or stats fallback
  const totalUsersCount = users.length > 0 ? users.length : (stats.users?.total || 0);
  const clientUsersCount = users.filter((u) => u.role === "CLIENT").length || (stats.users?.clients || 0);
  const landOwnersCount = users.filter((u) => u.role === "LAND_OWNER").length || (stats.users?.landOwners || 0);
  const contractorsCount = users.filter((u) => u.role === "CONTRACTOR").length || (stats.users?.contractors || 0);
  const adminUsersCount = users.filter((u) => u.role === "ADMIN").length || (stats.users?.admins || 0);
  const totalRevenueDisplay = stats?.revenue?.totalFormatted || "GH₵ 1,485,000";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Welcome & Real-Time Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Welcome, {user?.name?.split(" ")[0] || user?.name || "Admin"}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Real-Time Feed
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time client analytics, role distribution, and ongoing activity across TerraMatch.
          </p>
        </div>

        {/* Quick App Revenue Badge */}
        <button
          onClick={() => onNavigateTab && onNavigateTab("profile")}
          className="group flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-950/70 p-3 text-left transition-all shadow-sm"
          title="Click to view full Revenue breakdown in Admin Profile"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
            <DollarSignIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">Total App Revenue</span>
            <span className="text-base font-extrabold text-white">{totalRevenueDisplay}</span>
          </div>
        </button>
      </div>

      {/* Main KPI Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        
        {/* KPI 1: Total Clients */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab("users")}
          className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm transition-all hover:border-slate-700 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 break-normal">Total Registered Clients</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <UsersIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-slate-100">{totalUsersCount.toLocaleString()}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-400">
                Live Active
              </span>
              <span className="text-slate-500">across all roles</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Verified Contractors */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab("contractors")}
          className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm transition-all hover:border-slate-700 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 break-normal">Verified Contractors</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <ShieldCheckIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-slate-100">{contractorsCount.toLocaleString()}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-slate-400">
                <strong className="text-slate-300">{stats.users?.verified || contractorsCount}</strong> verified pros
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Active Listings */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab("listings")}
          className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm transition-all hover:border-slate-700 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 break-normal">Active Land Listings</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <MapIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-slate-100">{(stats.lands?.active || stats.lands?.total || 0).toLocaleString()}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-400">
                +4%
              </span>
              <span className="text-slate-500">from last month</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Pending Verifications */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab("verifications")}
          className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-sm transition-all hover:border-slate-700 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 break-normal">Pending Verifications</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <GavelIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-slate-100">{stats.verifications?.pending || 0}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-amber-500 font-medium">Requires review</span>
            </div>
          </div>
        </div>

      </div>

      {/* Real-time Client Role Analytics Grid */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Client Roles & Account Analytics</h3>
            <p className="text-xs text-slate-400">Real-time breakdown of all platform participants currently registered on TerraMatch.</p>
          </div>
          <button 
            onClick={() => onNavigateTab && onNavigateTab("users")}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold self-start sm:self-auto"
          >
            Manage All Clients &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {/* Role 1: Clients / Buyers */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Buyers / Clients</span>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-100">{clientUsersCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalUsersCount > 0 ? Math.round((clientUsersCount / totalUsersCount) * 100) : 0}% of platform
            </p>
          </div>

          {/* Role 2: Land Owners */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Land Owners</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-100">{landOwnersCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalUsersCount > 0 ? Math.round((landOwnersCount / totalUsersCount) * 100) : 0}% of platform
            </p>
          </div>

          {/* Role 3: Contractors */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Contractors</span>
              <span className="h-2 w-2 rounded-full bg-purple-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-100">{contractorsCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalUsersCount > 0 ? Math.round((contractorsCount / totalUsersCount) * 100) : 0}% of platform
            </p>
          </div>

          {/* Role 4: System Admins */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Administrators</span>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-100">{adminUsersCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Full System Access</p>
          </div>
        </div>
      </div>

      {/* Analytics & Activity */}
      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        
        {/* Left: Platform Distribution / Live Activity Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Platform Growth & Activity</h3>
              <p className="text-xs text-slate-400">Live registrations and engagement trends</p>
            </div>
            <select className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option>Real-Time</option>
              <option>Last 30 days</option>
              <option>This Year</option>
            </select>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Client Roles Ratio</span>
                <span className="text-slate-300 font-medium">{totalUsersCount} Total Clients</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                <div 
                  style={{ width: `${totalUsersCount ? (clientUsersCount / totalUsersCount) * 100 : 25}%` }} 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  title={`Clients: ${clientUsersCount}`}
                />
                <div 
                  style={{ width: `${totalUsersCount ? (landOwnersCount / totalUsersCount) * 100 : 25}%` }} 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  title={`Land Owners: ${landOwnersCount}`}
                />
                <div 
                  style={{ width: `${totalUsersCount ? (contractorsCount / totalUsersCount) * 100 : 25}%` }} 
                  className="bg-purple-500 h-full transition-all duration-500" 
                  title={`Contractors: ${contractorsCount}`}
                />
                <div 
                  style={{ width: `${totalUsersCount ? (adminUsersCount / totalUsersCount) * 100 : 25}%` }} 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  title={`Admins: ${adminUsersCount}`}
                />
              </div>
              <div className="flex flex-wrap gap-4 text-xs pt-2">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Buyers ({clientUsersCount})
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Land Owners ({landOwnersCount})
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> Contractors ({contractorsCount})
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Admins ({adminUsersCount})
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Revenue Stream Performance</span>
              <span className="font-bold text-emerald-400">GH₵ 1,485,000 App Revenue</span>
            </div>
          </div>
        </div>

        {/* Right: Recent Registrations Feed */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Recent Registrations</h3>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {(users.length > 0 ? users.slice(0, 6) : stats.recentUsers || []).map((u) => (
              <div key={u.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-800/40 transition-colors">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                  {u.name ? u.name[0].toUpperCase() : "U"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <div>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {u.role ? u.role.replace('_', ' ') : 'USER'}
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
