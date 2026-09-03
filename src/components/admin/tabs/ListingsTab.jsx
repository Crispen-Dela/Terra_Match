import { useState, useEffect } from "react";
import { SearchIcon, MapIcon } from "../AdminIcons";
import { adminApi } from "../../../services/authApi";
import { cn } from "../../../utils/cn";

export default function ListingsTab() {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    loadLands();
  }, [statusFilter]);

  async function loadLands() {
    setLoading(true);
    try {
      const res = await adminApi.listLands({ status: statusFilter, search });
      setLands(res.lands || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Enter key for search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      loadLands();
    }
  };

  async function handleToggleStatus(land, newStatus) {
    try {
      await adminApi.updateLandStatus(land.id, newStatus);
      setLands((prev) => prev.map((l) => (l.id === land.id ? { ...l, status: newStatus } : l)));
    } catch (err) {
      alert("Failed to update status");
    }
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Land Listings</h2>
          <p className="text-sm text-slate-400 mt-1">Manage and moderate property listings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search listings... (Press Enter)"
              className="block w-full sm:w-64 rounded-md border border-slate-700 bg-[#111827] py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-[#111827] py-1.5 pl-3 pr-8 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Price / Size</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 animate-pulse">Loading listings...</td>
                </tr>
              ) : lands.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No listings found.</td>
                </tr>
              ) : (
                lands.map((land) => (
                  <tr key={land.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-200">{land.title}</p>
                        <p className="text-[11px] text-slate-500">Owner: {land.owner?.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{land.region}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-emerald-400">GH₵{land.totalPrice?.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500">{land.landSize}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                        land.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        land.status === "PENDING_REVIEW" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-slate-800 text-slate-400 border border-slate-700"
                      )}>
                        {land.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {land.status === "PENDING_REVIEW" && (
                        <button onClick={() => handleToggleStatus(land, "ACTIVE")} className="text-emerald-400 text-xs font-medium hover:underline mr-3">Approve</button>
                      )}
                      {land.status === "ACTIVE" && (
                        <button onClick={() => handleToggleStatus(land, "PENDING_REVIEW")} className="text-amber-400 text-xs font-medium hover:underline mr-3">Unlist</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
