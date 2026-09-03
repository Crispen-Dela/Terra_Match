import { SearchIcon } from "../AdminIcons";
import { cn } from "../../../utils/cn";

export default function UsersTab({ users, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, handleToggleUserStatus }) {
  
  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">User Management</h2>
          <p className="text-sm text-slate-400 mt-1">Manage platform users, roles, and access.</p>
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
              placeholder="Search users..."
              className="block w-full sm:w-64 rounded-md border border-slate-700 bg-[#111827] py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
            />
          </div>
          <select 
            value={userRoleFilter} 
            onChange={(e) => setUserRoleFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-[#111827] py-1.5 pl-3 pr-8 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="CLIENT">Client</option>
            <option value="LAND_OWNER">Land Owner</option>
            <option value="CONTRACTOR">Contractor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
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
                          {u.name[0].toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-slate-200">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-slate-800/80 px-2 py-1 text-[11px] font-semibold text-slate-300 tracking-wide">
                        {u.role.replace('_', ' ')}
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
                        {u.status === "ACTIVE" ? "Active" : "Suspended"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={cn(
                            "rounded text-[11px] font-semibold transition-colors px-2.5 py-1",
                            u.status === "ACTIVE"
                              ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              : "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                          )}
                        >
                          {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
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
          <span>Showing {filteredUsers.length} results</span>
          <div className="flex items-center gap-2">
            <button className="rounded px-2 py-1 hover:bg-slate-800 disabled:opacity-50" disabled>Previous</button>
            <button className="rounded px-2 py-1 hover:bg-slate-800 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
