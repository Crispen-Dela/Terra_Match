import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import DashboardStatsCard from "./DashboardStatsCard";
import DashboardActivityFeed from "./DashboardActivityFeed";
import DashboardQuickActions from "./DashboardQuickActions";
import PlanUpgradeModal from "./PlanUpgradeModal";
import Button from "../common/Button";
import { cn } from "../../utils/cn";

// Icons
function DocumentIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeWidth="1.5" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M6 9V4h12v5a6 6 0 01-12 0z" strokeWidth="1.5" />
      <path d="M6 5H3a2 2 0 00-2 2v1a4 4 0 004 4h1M18 5h3a2 2 0 012 2v1a4 4 0 01-4 4h-1M9 18h6M12 15v6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 3l1.8 5.4L19 10.2l-5.2 1.8L12 17.4l-1.8-5.4L5 10.2l5.2-1.8L12 3z" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function HammerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M15 12l-8.5 8.5a2.12 2.12 0 11-3-3L12 9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.64 15L22 10.64 13.36 2 9 6.36 17.64 15z" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function ContractorDashboard({ data, onRefresh }) {
  const [showPlansModal, setShowPlansModal] = useState(false);
  const { user, plan, allPlans, verification, profileCompletion, stats, bids, availableOpportunities, reviews, conversations, activity } = data;

  const quickActions = [
    { label: "Browse Projects", subtitle: "Find open tenders", icon: HammerIcon, to: "/find-contractor" },
    { label: "Messages & Inquiries", subtitle: "Chat with clients", icon: ChatIcon, to: "/messages" },
    { label: "My Public Profile", subtitle: "View verified page", icon: TrophyIcon, to: `/find-contractor/${user.id}` },
    { label: "AI Estimator", subtitle: plan?.isPaid ? "Unlocked" : "Upgrade to unlock", icon: SparklesIcon, onClick: () => setShowPlansModal(true), featured: true },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Welcome & Identity Header */}
      <DashboardHeader
        user={user}
        plan={plan}
        verification={verification}
        profileCompletion={profileCompletion}
        onOpenPlans={() => setShowPlansModal(true)}
        roleLabel="Licensed Contractor"
      />

      {/* 2. Key Performance Metrics */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
        <DashboardStatsCard
          title="Active Bids"
          value={stats?.activeBids ?? 0}
          subtitle="Proposals under client review"
          icon={DocumentIcon}
          badgeText={stats?.activeBids > 0 ? "In Review" : "None active"}
          badgeVariant="forest"
        />
        <DashboardStatsCard
          title="Accepted Contracts"
          value={stats?.acceptedBids ?? 0}
          subtitle="Won building projects"
          icon={TrophyIcon}
          badgeText="Verified Wins"
          badgeVariant="forest"
        />
        <DashboardStatsCard
          title="Client Rating"
          value={stats?.rating ? `${stats.rating} ★` : "5.0 ★"}
          subtitle={`Based on ${stats?.reviewCount || 0} reviews`}
          icon={StarIcon}
          badgeText={stats?.reviewCount > 0 ? "Real Reviews" : "New Builder"}
          badgeVariant="amber"
          to={`/find-contractor/${user.id}`}
        />
        <DashboardStatsCard
          title="Direct Chats"
          value={conversations?.length ?? 0}
          subtitle="Clients who messaged you"
          icon={ChatIcon}
          badgeText="Stream Chat"
          badgeVariant="ink"
          to="/messages"
        />
      </div>

      {/* 3. Main Command Columns */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Left Column: Bids & Available Opportunities */}
        <div className="space-y-6 sm:space-y-8 lg:col-span-2">
          {/* Active Bids & Tender Proposals */}
          <div className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-ink-900/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-ink-900 sm:text-lg">Your Submitted Bids & Proposals</h2>
                <p className="text-xs text-ink-500">Track contract status and client responses</p>
              </div>
              <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-700">
                {bids?.all?.length || 0} Total
              </span>
            </div>

            {bids?.all?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-900/15 bg-mist-50/50 p-8 my-4 text-center">
                <p className="text-sm font-semibold text-ink-800">No project bids submitted yet</p>
                <p className="mt-1 text-xs text-ink-500">Browse open client construction requests and submit competitive bids.</p>
                <Button as={Link} to="/find-contractor" variant="secondary" size="sm" className="mt-4">
                  Browse Open Projects
                </Button>
              </div>
            ) : (
              <div className="mt-2 divide-y divide-ink-900/5">
                {bids.all.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex flex-col gap-2.5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-ink-900">{b.project?.title}</h3>
                      <p className="mt-0.5 truncate text-xs text-ink-600">
                        Client: {b.project?.client?.name} • {b.project?.location} • Budget: {b.project?.budgetRange}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-forest-700">
                          Proposed: GHS {b.proposedAmount?.toLocaleString()}
                        </span>
                        <span className="text-ink-300">•</span>
                        <span className="text-ink-500">{b.estimatedDuration || "Standard timeline"}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          b.status === "ACCEPTED" && "bg-emerald-100 text-emerald-800",
                          b.status === "PENDING" && "bg-amber-100 text-amber-800",
                          b.status === "REJECTED" && "bg-mist-100 text-ink-600"
                        )}
                      >
                        {b.status}
                      </span>
                      <Button as={Link} to="/messages" variant="ghost" size="xs">
                        Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Construction Leads & Tenders */}
          <div className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-ink-900/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-ink-900 sm:text-lg">Open Projects in Your Category</h2>
                <p className="text-xs text-ink-500">Verified clients seeking licensed contractors</p>
              </div>
              <Link to="/find-contractor" className="text-xs font-semibold text-forest-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            {availableOpportunities?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-900/15 bg-mist-50/50 p-6 my-4 text-center text-xs text-ink-500">
                No open projects currently match your trade category. Check back soon!
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {availableOpportunities.map((p) => (
                  <div key={p.id} className="flex flex-col justify-between rounded-xl border border-ink-900/10 bg-mist-50/40 p-4 transition hover:border-forest-600/30 hover:bg-white hover:shadow-xs">
                    <div>
                      <span className="rounded-md bg-forest-100 px-2 py-0.5 text-[10px] font-semibold text-forest-700">
                        {p.category}
                      </span>
                      <h3 className="mt-2 font-bold text-ink-900 line-clamp-1">{p.title}</h3>
                      <p className="mt-0.5 text-xs text-ink-500">{p.location}</p>
                      <p className="mt-2 text-xs font-semibold text-ink-800">
                        Budget: {p.budgetRange}
                      </p>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between border-t border-ink-900/5 pt-2.5">
                      <span className="text-[11px] text-ink-500">{p._count?.bids || 0} bids placed</span>
                      <Button as={Link} to="/find-contractor" variant="secondary" size="xs">
                        Submit Proposal
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Tools & Premium Feature Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-forest-600/20 bg-gradient-to-br from-forest-900 to-forest-800 p-5 text-white shadow-card sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-forest-400/20 px-2.5 py-0.5 text-xs font-semibold text-forest-200">
                  <SparklesIcon className="h-3.5 w-3.5 text-amber-300" />
                  TerraMatch Contractor AI Suite
                </div>
                <h3 className="mt-2 text-base font-bold text-white sm:text-lg">AI Project Estimator & Tender Builder</h3>
                <p className="mt-1 text-xs text-forest-200/90 leading-relaxed">
                  Automatically calculate accurate Ghanaian market material costs, labor estimates, and generate professional Bills of Quantities.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={() => setShowPlansModal(true)}
                className="shrink-0 bg-white text-forest-900 hover:bg-forest-50 shadow-sm"
              >
                {plan?.isPaid ? "Access AI Suite" : "Upgrade to Pro"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions, Recent Reviews, Live Timeline */}
        <div className="space-y-6 sm:space-y-8">
          <DashboardQuickActions actions={quickActions} />

          {/* Client Reviews Section */}
          <div className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-ink-900/10 pb-4">
              <h2 className="text-base font-bold text-ink-900">Recent Client Reviews</h2>
              <Link to={`/find-contractor/${user.id}`} className="text-xs font-semibold text-forest-600 hover:underline">
                View All ({reviews?.total || 0})
              </Link>
            </div>

            {reviews?.items?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-900/15 bg-mist-50/50 p-6 my-4 text-center text-xs text-ink-500">
                No reviews yet. Completed projects and verified clients will leave ratings here.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.items.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded-xl border border-ink-900/5 bg-mist-50/50 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-900">{r.author?.name}</span>
                      <div className="flex items-center text-amber-500 text-xs tracking-tighter">
                        {"★".repeat(r.rating)}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-ink-700 italic">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Activity Feed */}
          <DashboardActivityFeed activity={activity} title="Contractor Activity Stream" />
        </div>
      </div>

      {/* Plans Modal */}
      <PlanUpgradeModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        plans={allPlans}
        currentPlanId={plan?.id}
        onPlanUpdated={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
