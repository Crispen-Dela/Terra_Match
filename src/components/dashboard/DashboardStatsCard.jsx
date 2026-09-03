import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

export default function DashboardStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = "forest",
  to,
  className,
}) {
  const content = (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        to && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#059669] transition group-hover:bg-emerald-100">
              <Icon className="h-5.5 w-5.5" />
            </div>
          )}
          <div className="min-w-0">
            <span className="block truncate text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {title}
            </span>
          </div>
        </div>

        {badgeText && (
          <span
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold leading-normal",
              badgeVariant === "forest" && "bg-emerald-100 text-emerald-800",
              badgeVariant === "amber" && "bg-amber-100 text-amber-800",
              badgeVariant === "ink" && "bg-slate-100 text-slate-700"
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-3 truncate text-2xl font-black text-slate-900 sm:text-3xl">
        {value}
      </div>

      {subtitle && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-semibold text-slate-500">
          <span className="truncate">{subtitle}</span>
          {to && (
            <span className="ml-1 font-bold text-[#059669] transition group-hover:translate-x-1">
              &rarr;
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
}
