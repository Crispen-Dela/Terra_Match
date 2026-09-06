import { SearchIcon, Trash2Icon, UserXIcon, UserCheckIcon, UsersIcon } from "../AdminIcons";
import { cn } from "../../../utils/cn";

export default function UsersTab({
  users,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  handleToggleUserStatus,
  handleDeleteUser,
}) {
  const filteredUsers =
    users?.filter((u) => {
      const matchesSearch =
        !userSearch ||
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole =
        userRoleFilter === "ALL"
          ? true
          : userRoleFilter === "SUSPENDED"
          ? u.status === "SUSPENDED"
          : u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    }) || [];

  // Summary counts
  const totalCount = users?.length || 0;
  const clientCount = users?.filter((u) => u.role === "CLIENT")?.length || 0;
  const landOwnerCount = users?.filter((u) => u.role === "LAND_OWNER")?.length || 0;
  const contractorCount = users?.filter((u) => u.role === "CONTRACTOR")?.length || 0;
  const adminCount = users?.filter((u) => u.role === "ADMIN")?.length || 0;
  const suspendedCount = users?.filter((u) => u.status === "SUSPENDED")?.length || 0;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Client & User Management</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage platform clients, delete unwanted accounts, toggle suspensions, and inspect roles.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="block w-full sm:w-64 rounded-md border border-slate-700 bg-[#111827] py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
            />
          </div>
          <select 
            value={userRoleFilter} 
            onChange={(e) => setUserRoleFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-[#111827] py-1.5 pl-3 pr-8 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          >
            <option value="ALL">All Roles ({totalCount})</option>
            <option value="CLIENT">Clients / Buyers ({clientCount})</option>
            <option value="LAND_OWNER">Land Owners ({landOwnerCount})</option>
            <option value="CONTRACTOR">Contractors ({contractorCount})</option>
            <option value="ADMIN">Admins ({adminCount})</option>
            <option value="SUSPENDED">Suspended ({suspendedCount})</option>
          </select>
        </div>
      </div>

      {/* Role Quick-Filter Bar */}
      <div className="flex flex-wrap gap-2 pt-1 pb-1">
        {[
          { id: "ALL", label: "All Clients", count: totalCount },
          { id: "CLIENT", label: "Buyers / Clients", count: clientCount },
          { id: "LAND_OWNER", label: "Land Owners", count: landOwnerCount },
          { id: "CONTRACTOR", label: "Contractors", count: contractorCount },
          { id: "ADMIN", label: "Admins", count: adminCount },
          { id: "SUSPENDED", label: "Suspended Accounts", count: suspendedCount },
        ].map((filter) => {
          const isActive = userRoleFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setUserRoleFilter(filter.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border",
                isActive
                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm"
                  : "bg-[#111827] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              )}
            >
              <span>{filter.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  isActive ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                )}
              >
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User / Client</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                          {u.name ? u.name[0].toUpperCase() : "U"}
                        </span>
                        <div>
                          <p className="font-medium text-slate-200">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide border",
                        u.role === "CLIENT" ? "bg-blue-500/10 text-blue-300 border-blue-500/20" :
                        u.role === "LAND_OWNER" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" :
                        u.role === "CONTRACTOR" ? "bg-purple-500/10 text-purple-300 border-purple-500/20" :
                        "bg-slate-800 text-slate-300 border-slate-700"
                      )}>
                        {u.role ? u.role.replace('_', ' ') : 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.ghanaCardVerified ? (
                        <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verified
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">Unverified</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn("h-1.5 w-1.5 rounded-full", u.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500")} />
                        <span className={u.status === "ACTIVE" ? "text-slate-300" : "text-red-400 font-medium"}>
                          {u.status === "ACTIVE" ? "Active" : "Suspended"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== "ADMIN" && (
                        <div className="flex items-center justify-end gap-2">
                          {/* Suspend / Activate Button */}
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={cn(
                              "rounded-lg text-xs font-medium transition-colors px-2.5 py-1 border",
                              u.status === "ACTIVE"
                                ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                                : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            )}
                            title={u.status === "ACTIVE" ? "Suspend user account" : "Re-activate user account"}
                          >
                            {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </button>

                          {/* Delete User Button */}
                          <button
                            onClick={() => handleDeleteUser && handleDeleteUser(u.id, u.name)}
                            className="flex items-center gap-1 rounded-lg text-xs font-medium transition-colors px-2.5 py-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            title={`Delete ${u.name} permanently`}
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 text-xs text-slate-500">
          <span>Showing {filteredUsers.length} of {totalCount} total clients</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Real-Time Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}
