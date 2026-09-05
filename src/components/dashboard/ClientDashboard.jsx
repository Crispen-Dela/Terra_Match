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
function GavelIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M14 4l6 6-2 2-6-6 2-2zM4 14l6 6-2 2-6-6 2-2zM12 10l-4 4M2 22l4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 21s-7-6.5-7-11.5A7 7 0 0119 9.5C19 14.5 12 21 12 21z" strokeWidth="1.5" />
      <circle cx="12" cy="9.5" r="2.5" strokeWidth="1.5" />
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

function ShieldCheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 3l7 3v5.5c0 4.6-3 8.4-7 9.5-4-1.1-7-4.9-7-9.5V6l7-3z" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4.2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ClientDashboard({ data, onRefresh }) {
  const [showPlansModal, setShowPlansModal] = useState(false);
  const { user, plan, allPlans, verification, profileCompletion, stats, bids, projects, recommendedLands, recommendedContractors, activity } = data;

  const quickActions = [
    { label: "Explore Land", subtitle: "Browse titled parcels", icon: MapPinIcon, to: "/explore-land", featured: true },
    { label: "Find Contractor", subtitle: "Hire verified builders", icon: HammerIcon, to: "/find-contractor" },
    { label: "Talk to TerraBot AI", subtitle: "AI land & project assistant", icon: SparklesIcon, to: "/ai", featured: true },
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
        roleLabel="Member / Buyer"
      />

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-5">
        <DashboardStatsCard
          title="Active Bids"
          value={stats?.activeBids ?? 0}
          subtitle="Auctions you are winning"
          icon={GavelIcon}
          badgeText={stats?.activeBids > 0 ? "Leading" : "None active"}
          badgeVariant="forest"
          to="/explore-land"
        />
        <DashboardStatsCard
          title="Outbid Alerts"
          value={stats?.outbidBids ?? 0}
          subtitle="Auctions needing higher bids"
          icon={MapPinIcon}
          badgeText={stats?.outbidBids > 0 ? "Action Needed" : "All Clear"}
          badgeVariant={stats?.outbidBids > 0 ? "amber" : "forest"}
        />
        <DashboardStatsCard
          title="Conversations"
          value={stats?.conversationsCount ?? 0}
          subtitle="Chats with owners & builders"
          icon={ChatIcon}
          badgeText="Stream Chat"
          badgeVariant="ink"
          to="/messages"
        />
      </div>

      {/* 3. Main Command Columns */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Left Column: Bids, Projects, Recommendations */}
        <div className="space-y-6 sm:space-y-8 lg:col-span-2">
          {/* Active Land Bids & Purchases */}
          <div className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-ink-900/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-ink-900 sm:text-lg">Your Bids on Land Parcels</h2>
                <p className="text-xs text-ink-500">Track auction status, leading bids, and Buy Now options</p>
              </div>
              <Button as={Link} to="/explore-land" variant="primary" size="xs">
                Explore Land
              </Button>
            </div>

            {bids?.all?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-900/15 bg-mist-50/50 p-8 my-4 text-center">
                <p className="text-sm font-semibold text-ink-800">You haven't placed any land bids yet</p>
                <p className="mt-1 text-xs text-ink-500">
                  Explore verified, titled land listings across Ghana and submit your transparent bids.
                </p>
                <Button as={Link} to="/explore-land" variant="secondary" size="sm" className="mt-4">
                  Browse Land Listings
                </Button>
              </div>
            ) : (
              <div className="mt-2 divide-y divide-ink-900/5">
                {bids.all.map((b) => (
                  <div key={b.id} className="flex flex-col gap-2.5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-ink-900">{b.land?.title}</h3>
                      <p className="mt-0.5 truncate text-xs text-ink-600">
                        {b.land?.district}, {b.land?.region} {b.land?.owner?.name ? `• Owner: ${b.land.owner.name}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-forest-700">
                          Your Bid: GHS {b.amount?.toLocaleString()}
                        </span>
                        <span className="text-ink-300">•</span>
                        <span className="text-ink-500">
                          Top: GHS {b.land?.currentBid?.toLocaleString() || b.amount?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          b.status === "ACTIVE" && "bg-emerald-100 text-emerald-800",
                          b.status === "OUTBID" && "bg-amber-100 text-amber-800",
                          b.status === "ACCEPTED" && "bg-forest-100 text-forest-800"
                        )}
                      >
                        {b.status}
                      </span>
                      <Button
                        as={Link}
                        to={`/messages?contact=${encodeURIComponent(b.land?.owner?.id || b.land?.ownerId || "")}&land=${encodeURIComponent(b.land?.id || b.landId || "")}`}
                        variant="ghost"
                        size="xs"
                      >
                        Chat
                      </Button>
                      <Button as={Link} to={`/explore-land/${b.land?.slug || b.land?.id}`} variant="secondary" size="xs">
                        {b.status === "OUTBID" ? "Raise Bid" : "View Land"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Recommended Lands */}
          <div className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-ink-900/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-forest-100 p-1 text-forest-700">
                  <SparklesIcon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-ink-900 sm:text-lg">AI-Recommended Land Opportunities</h2>
                  <p className="text-xs text-ink-500">High-growth parcels matched to your profile</p>
                </div>
              </div>
              <Link to="/explore-land" className="text-xs font-semibold text-forest-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {recommendedLands?.map((land) => (
                <div key={land.id} className="flex flex-col justify-between rounded-xl border border-ink-900/10 bg-mist-50/40 p-4 transition hover:border-forest-600/30 hover:bg-white hover:shadow-xs">
                  <div>
                    <span className="rounded-md bg-forest-100 px-2 py-0.5 text-[10px] font-semibold text-forest-700">
                      {land.category || "Titled Land"}
                    </span>
                    <h3 className="mt-2 font-bold text-ink-900 line-clamp-1">{land.title}</h3>
                    <p className="mt-0.5 text-xs text-ink-500">{land.district}, {land.region}</p>
                    <p className="mt-2 text-sm font-extrabold text-forest-800">
                      GHS {land.totalPrice?.toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-ink-900/5 pt-2.5">
                    <span className="text-[11px] text-ink-500">{land.bidsCount || 0} active bids</span>
                    <Button as={Link} to={`/explore-land/${land.slug || land.id}`} variant="secondary" size="xs">
                      Bid / Buy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommended Contractors */}
          <div className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-ink-900/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-forest-100 p-1 text-forest-700">
                  <SparklesIcon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-ink-900 sm:text-lg">Top-Rated Verified Builders Near You</h2>
                  <p className="text-xs text-ink-500">Licensed contractors with 98%+ client satisfaction</p>
                </div>
              </div>
              <Link to="/find-contractor" className="text-xs font-semibold text-forest-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {recommendedContractors?.map((contractor) => (
                <div key={contractor.id} className="flex flex-col justify-between rounded-xl border border-ink-900/10 bg-mist-50/40 p-4 transition hover:border-forest-600/30 hover:bg-white hover:shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-forest-100 px-2 py-0.5 text-[10px] font-semibold text-forest-700">
                        {contractor.category}
                      </span>
                      <span className="text-xs font-bold text-amber-600">
                        ★ {contractor.rating}
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-ink-900 line-clamp-1">{contractor.name}</h3>
                    <p className="mt-0.5 text-xs text-ink-500">{contractor.location}</p>
                    <p className="mt-1 text-[11px] text-ink-600 line-clamp-1">{contractor.specialties}</p>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-ink-900/5 pt-2.5">
                    <span className="text-[11px] text-ink-500">{contractor.projects || 0} projects</span>
                    <Button as={Link} to={`/contractors/${contractor.slug || contractor.id}`} variant="secondary" size="xs">
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Live Timeline */}
        <div className="space-y-6 sm:space-y-8">
          <DashboardQuickActions actions={quickActions} />

          {/* Live Activity Feed */}
          <DashboardActivityFeed activity={activity} title="Your Activity Timeline" />
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
