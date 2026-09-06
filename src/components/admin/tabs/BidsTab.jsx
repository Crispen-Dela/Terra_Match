import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../../services/authApi";
import { subscribeToBidEvents } from "../../../services/bidEvents";
import { Trash2Icon, GavelIcon } from "../AdminIcons";
import { cn } from "../../../utils/cn";

export default function BidsTab({ onDeleteBid }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchBids = useCallback(async () => {
    try {
      const res = await adminApi.listBids();
      setBids(res || []);
    } catch (err) {
      console.error("Failed to load bids:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBids();

    // Subscribe to live SSE bid events for real-time dashboard updates
    const unsubscribe = subscribeToBidEvents({
      onEvent: () => {
        fetchBids();
      },
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchBids]);

  const handleDelete = async (bid) => {
    const confirmMsg = `Are you sure you want to permanently delete this bid of GH₵${bid.amount?.toLocaleString()} from ${bid.bidder?.name || 'bidder'}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      if (onDeleteBid) {
        await onDeleteBid(bid.id);
      } else {
        await adminApi.deleteBid(bid.id);
      }
      setBids((prev) => prev.filter((b) => b.id !== bid.id));
    } catch (err) {
      console.error("Failed to delete bid:", err);
      // Optimistically remove from state
      setBids((prev) => prev.filter((b) => b.id !== bid.id));
    }
  };

  const filteredBids = bids.filter((b) => {
    if (statusFilter === "ALL") return true;
    return b.status === statusFilter;
  });

  const activeBidsCount = bids.filter((b) => b.status === "ACTIVE").length;
  const acceptedBidsCount = bids.filter((b) => b.status === "ACCEPTED").length;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Bid Transactions & Moderation</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Feed
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Monitor real-time bidding activity across land listings and remove or cancel ongoing bids.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-[#111827] py-1.5 pl-3 pr-8 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          >
            <option value="ALL">All Bids ({bids.length})</option>
            <option value="ACTIVE">Active Bids ({activeBidsCount})</option>
            <option value="ACCEPTED">Accepted Bids ({acceptedBidsCount})</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Bidder</th>
                <th className="px-6 py-4">Land Listing</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 animate-pulse">Loading real-time bids...</td></tr>
              ) : filteredBids.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No bidding activity found.</td></tr>
              ) : (
                filteredBids.map((bid) => (
                  <tr key={bid.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-[11px] text-slate-500">{new Date(bid.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200">{bid.bidder?.name || "Client"}</p>
                      <p className="text-[11px] text-slate-500">{bid.bidder?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate">{bid.land?.title || "Land Listing"}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">GH₵{bid.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-md px-2 py-1 text-[10px] font-semibold uppercase",
                        bid.status === "ACTIVE" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        bid.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-slate-800 text-slate-400 border border-slate-700"
                      )}>
                        {bid.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(bid)}
                        className="inline-flex items-center gap-1 rounded-lg text-xs font-medium transition-colors px-2.5 py-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        title="Delete or cancel this bid"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                        <span>Delete Bid</span>
                      </button>
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
