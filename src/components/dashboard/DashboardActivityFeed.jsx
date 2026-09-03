import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" />
      <path d="M10 6v4.5l3 1.5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function timeAgo(dateString) {
  if (!dateString) return "Recently";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function DashboardActivityFeed({ activity = [], title = "Recent Activity & Timeline" }) {
  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between border-b border-ink-900/10 pb-4">
        <h2 className="text-base font-bold text-ink-900 sm:text-lg">{title}</h2>
        <span className="text-xs font-semibold text-forest-700">Live Updates</span>
      </div>

      {activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mist-100 text-ink-400">
            <ClockIcon className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium text-ink-700">No recent activity yet</p>
          <p className="mt-1 max-w-xs text-xs text-ink-500">
            Activity like bids placed, reviews, inquiries, and verifications will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-ink-900/5">
          {activity.map((item) => (
            <div key={item.id} className="flex items-start gap-3.5 py-3.5 first:pt-1 last:pb-1">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                <span className="h-2 w-2 rounded-full bg-forest-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink-900">{item.title}</p>
                  <span className="shrink-0 text-[11px] text-ink-400">{timeAgo(item.timestamp)}</span>
                </div>
                {item.description && (
                  <p className="mt-0.5 text-xs text-ink-600 line-clamp-2">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
