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
        "group relative flex flex-col justify-between h-full min-h-[145px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        to && "cursor-pointer",
        className
      )}
    >
      {/* Top row: Icon on left, Badge on right (never squishing title width horizontally) */}
      <div className="flex items-center justify-between gap-2">
        {Icon ? (
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#059669] transition group-hover:bg-emerald-100">
            <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
          </div>
        ) : <div />}

        {badgeText && (
          <span
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold leading-normal",
              badgeVariant === "forest" && "bg-emerald-100 text-emerald-800",
              badgeVariant === "amber" && "bg-amber-100 text-amber-800",
              badgeVariant === "ink" && "bg-slate-100 text-slate-700"
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Middle content: Title with full card width and natural word-break + Value */}
      <div className="mt-3.5 flex-1 min-w-0">
        <span className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 leading-snug break-normal">
          {title}
        </span>
        <div className="mt-1.5 truncate text-2xl font-black text-slate-900 sm:text-3xl">
          {value}
        </div>
      </div>

      {/* Bottom row: Subtitle / Link */}
      {subtitle && (
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-semibold text-slate-500">
          <span className="truncate">{subtitle}</span>
          {to && (
            <span className="ml-1 font-bold text-[#059669] transition group-hover:translate-x-1 shrink-0">
              &rarr;
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
