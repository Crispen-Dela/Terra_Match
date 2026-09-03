import { useState, useEffect } from "react";
import { adminApi } from "../../../services/authApi";
import { cn } from "../../../utils/cn";

export default function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.listProjects()
      .then((res) => setProjects(res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Construction Projects</h2>
        <p className="text-sm text-slate-400 mt-1">Manage active construction and development projects.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Budget Range</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Bids</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 animate-pulse">Loading projects...</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No projects found.</td></tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200">{project.title}</p>
                      <p className="text-[11px] text-slate-500">{project.category} • {project.location}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <p className="font-medium text-slate-200">{project.client?.name}</p>
                    </td>
                    <td className="px-6 py-4 text-emerald-400">{project.budgetRange}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-md px-2 py-1 text-[10px] font-semibold uppercase",
                        project.status === "OPEN" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-slate-800 text-slate-400 border border-slate-700"
                      )}>
                        {project.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {project.bidsCount}
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
