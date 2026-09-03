import { useState, useEffect } from "react";
import { adminApi } from "../../../services/authApi";
import { cn } from "../../../utils/cn";

export default function BidsTab() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.listBids()
      .then((res) => {
        setBids(res || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Bid Transactions</h2>
        <p className="text-sm text-slate-400 mt-1">Monitor bidding activity on land listings.</p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 animate-pulse">Loading bids...</td></tr>
              ) : bids.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No bidding activity found.</td></tr>
              ) : (
                bids.map((bid) => (
                  <tr key={bid.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-[11px] text-slate-500">{new Date(bid.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200">{bid.bidder?.name}</p>
                      <p className="text-[11px] text-slate-500">{bid.bidder?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{bid.land?.title}</td>
                    <td className="px-6 py-4 font-mono text-emerald-400">GH₵{bid.amount?.toLocaleString()}</td>
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
