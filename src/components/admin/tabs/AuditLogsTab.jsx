import { useState, useEffect } from "react";
import { adminApi } from "../../../services/authApi";
import { cn } from "../../../utils/cn";

export default function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.listAuditLogs()
      .then((res) => setLogs(res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Audit Logs</h2>
        <p className="text-sm text-slate-400 mt-1">Immutable chronological record of administrative actions.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Administrator</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 animate-pulse">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No audit logs recorded yet.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200">{log.admin?.name || "System"}</p>
                      <p className="text-[11px] text-slate-500">{log.admin?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-slate-800/50 px-2 py-1 text-[10px] font-mono font-medium text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 truncate max-w-xs" title={log.details}>
                      {log.details || "-"}
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
