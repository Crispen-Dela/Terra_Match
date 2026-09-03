import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

export default function DashboardQuickActions({ actions = [], title = "Quick Actions & Shortcuts" }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
      <h2 className="text-base font-extrabold text-slate-900 sm:text-lg tracking-tight">{title}</h2>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          const isButton = typeof action.onClick === "function";

          const body = (
            <div
              className={cn(
                "group relative flex h-full min-h-[140px] w-full flex-col items-center justify-center p-5 text-center rounded-2xl border border-slate-200/80 bg-slate-50/50 transition-all duration-300 transform hover:-translate-y-1 hover:border-[#059669] hover:bg-emerald-50/30 hover:shadow-md cursor-pointer"
              )}
            >
              {/* Icon in dark green rounded square matching screenshot */}
              {Icon && (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0c392b] text-white shadow-xs group-hover:bg-[#059669] group-hover:scale-105 transition-all duration-300">
                  <Icon className="h-6 w-6" />
                </div>
              )}

              {/* Text content aligned below icon */}
              <div className="mt-3 flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight group-hover:text-[#059669] transition-colors">
                  {action.label}
                </span>
                {action.subtitle && (
                  <span className="mt-0.5 text-xs font-medium text-slate-500 leading-snug">
                    {action.subtitle}
                  </span>
                )}
              </div>
            </div>
          );

          if (isButton) {
            return (
              <button key={idx} type="button" onClick={action.onClick} className="flex h-full w-full text-left">
                {body}
              </button>
            );
          }

          return (
            <Link key={idx} to={action.to} className="flex h-full w-full">
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
