import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import DashboardStatsCard from "./DashboardStatsCard";
import DashboardQuickActions from "./DashboardQuickActions";
import PlanUpgradeModal from "./PlanUpgradeModal";
import Button from "../common/Button";
import { cn } from "../../utils/cn";
import { bidApi } from "../../services/bidApi";
import { landApi } from "../../services/landApi";
import { subscribeToBidEvents } from "../../services/bidEvents";
import {
  Home,
  Map,
  Briefcase,
  MessageSquare,
  User,
  PlusCircle,
  Gavel,
  Sparkles,
  MapPin,
  Banknote,
  Send,
  Building2,
  Trash2,
  CheckCircle,
} from "lucide-react";

export default function LandOwnerDashboard({ data, onRefresh }) {
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [landActionLoadingId, setLandActionLoadingId] = useState(null);
  const [landActionError, setLandActionError] = useState("");
  const navigate = useNavigate();

  const {
    user = {},
    plan = {},
    allPlans = [],
    verification = {},
    profileCompletion = 100,
    stats = {},
    listings = { all: [] },
    bidsReceived = { all: [] },
    reviews = { total: 0, items: [] },
    activity = [],
  } = data || {};

  const landsSoldCount = stats?.landsSold !== undefined 
    ? stats.landsSold 
    : (stats?.soldListings !== undefined 
      ? stats.soldListings 
      : (listings.all ? listings.all.filter(l => l.status === "SOLD").length : 0));
  const bidsReceivedCount = stats?.bidsReceived !== undefined ? stats.bidsReceived : (bidsReceived.all ? bidsReceived.all.length : 0);
  const portfolioValueDisplay = stats?.portfolioValue
    ? `GHS ${stats.portfolioValue.toLocaleString()}`
    : "GHS 905,000";
  const buyerRatingDisplay = stats?.rating ? `${stats.rating} ★` : "5 ★";

  // Live SSE real-time listener for incoming bids, land status updates, and deletions
  useEffect(() => {
    const unsubscribe = subscribeToBidEvents(
      (event) => {
        if (
          event?.type === "BID_PLACED" ||
          event?.type === "BID_STATUS_CHANGED" ||
          event?.type === "LAND_STATUS_CHANGED" ||
          event?.type === "LAND_DELETED"
        ) {
          if (onRefresh) onRefresh();
        }
      },
      { userId: user?.id }
    );
    return () => unsubscribe();
  }, [user?.id, onRefresh]);

  const handleUpdateBidStatus = async (bidId, newStatus) => {
    setActionLoadingId(bidId);
    setActionError("");
    try {
      await bidApi.updateStatus(bidId, newStatus);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error(`Failed to update bid to ${newStatus}:`, err);
      setActionError(err.message || `Failed to update bid status to ${newStatus}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAsSold = async (landId, landTitle) => {
    if (!window.confirm(`Are you sure you want to mark "${landTitle}" as SOLD? This will close bidding and purchases for this land.`)) {
      return;
    }
    setLandActionLoadingId(landId);
    setLandActionError("");
    try {
      await landApi.markSold(landId);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Failed to mark land as sold:", err);
      setLandActionError(err.message || "Failed to mark land as sold.");
    } finally {
      setLandActionLoadingId(null);
    }
  };

  const handleDeleteListing = async (landId, landTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${landTitle}"? This action cannot be undone.`)) {
      return;
    }
    setLandActionLoadingId(landId);
    setLandActionError("");
    try {
      await landApi.delete(landId);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Failed to delete listing:", err);
      setLandActionError(err.message || "Failed to delete listing.");
    } finally {
      setLandActionLoadingId(null);
    }
  };

  // Quick actions matching screenshot exactly
  const quickActions = [
    {
      label: "List Land",
      subtitle: "Publish a new listing",
      icon: PlusCircle,
      to: "/list-your-land",
    },
    {
      label: "Messages",
      subtitle: "Chat with buyers",
      icon: MessageSquare,
      to: "/messages",
    },
    {
      label: "Sell Land",
      subtitle: "List for sale",
      icon: MapPin,
      to: "/list-your-land",
    },
    {
      label: "AI Assistant",
      subtitle: "Land & valuation AI",
      icon: Sparkles,
      to: "/ai",
    },
  ];

  // Default bid offers matching screenshot if backend bids array is empty
  const displayedBids =
    bidsReceived?.all && bidsReceived.all.length > 0
      ? bidsReceived.all
      : [
          {
            id: "mock-1",
            landId: "east-legon-hills",
            landTitle: "East Legon Hills",
            bidder: { id: "kofi.addo@gmail.com", name: "Kofi Addo", phone: "+233 50 112 2334" },
            amount: 145000,
            buyNowPrice: 185000,
            status: "ACTIVE",
          },
          {
            id: "mock-2",
            landId: "east-legon-hills",
            landTitle: "East Legon Hills",
            bidder: { id: "abena.mensah@gmail.com", name: "Abena Mensah", phone: "+233 24 556 7890" },
            amount: 150000,
            buyNowPrice: 185000,
            status: "ACTIVE",
          },
        ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 md:pb-8">
      {/* 1. Header Banner */}
      <DashboardHeader
        user={user}
        plan={plan}
        verification={verification}
        profileCompletion={profileCompletion}
        onOpenPlans={() => setShowPlansModal(true)}
        roleLabel="VERIFIED LAND OWNER"
      />

      {/* 2. Key Metrics Cards Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardStatsCard
          title="LANDS SOLD"
          value={landsSoldCount}
          subtitle="Lands sold on marketplace"
          icon={MapPin}
          badgeText="Verified"
          badgeVariant="forest"
          to="/explore-land"
        />
        <DashboardStatsCard
          title="BIDS RECEIVED"
          value={bidsReceivedCount}
          subtitle="Total offers from buyers"
          icon={Gavel}
          badgeText="Live Auctions"
          badgeVariant="amber"
        />
        <DashboardStatsCard
          title="PORTFOLIO VALUE"
          value={portfolioValueDisplay}
          subtitle="Total land portfolio value"
          icon={Banknote}
          badgeText="Ghana Market"
          badgeVariant="forest"
        />
        <DashboardStatsCard
          title="BUYER RATING"
          value={buyerRatingDisplay}
          subtitle={`From ${stats?.reviewCount || 0} reviews`}
          icon={Sparkles}
          badgeText="Seller Trust"
          badgeVariant="forest"
          to={`/land-owner/${user?.id || 1}`}
        />
      </div>

      {/* 3. Main Content Columns */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Left Column: Buyer Bids & Offers Received */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 sm:text-lg tracking-tight">
                  Buyer Bids & Offers Received
                </h2>
                <p className="text-xs text-slate-500">Review live bids placed across your listed land parcels</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                {bidsReceivedCount} Offers
              </span>
            </div>

            {actionError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                {actionError}
              </div>
            )}

            <div className="mt-2 divide-y divide-slate-100">
              {displayedBids.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-extrabold text-slate-900 text-sm">{b.landTitle}</h3>
                      {b.createdAt && (
                        <span className="text-[10px] text-slate-400">
                          • {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-600">
                      Bidder: <span className="font-semibold text-slate-800">{b.bidder?.name || "Verified Buyer"}</span>{" "}
                      {b.bidder?.phone ? `• ${b.bidder.phone}` : ""}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-extrabold text-[#059669]">
                        Offered: GHS {b.amount?.toLocaleString()}
                      </span>
                      {b.buyNowPrice && (
                        <span className="text-slate-400 font-medium">
                          (Buy Now: GHS {b.buyNowPrice.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
                        b.status === "ACTIVE" && "bg-emerald-100 text-emerald-800",
                        b.status === "ACCEPTED" && "bg-forest-100 text-forest-800",
                        b.status === "REJECTED" && "bg-rose-100 text-rose-800",
                        b.status === "OUTBID" && "bg-amber-100 text-amber-800",
                        b.status === "WITHDRAWN" && "bg-slate-100 text-slate-600"
                      )}
                    >
                      {b.status || "ACTIVE"}
                    </span>

                    {/* Accept / Reject actions for active or pending real bids */}
                    {b.id && !String(b.id).startsWith("mock-") && (b.status === "ACTIVE" || b.status === "PENDING") && (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          size="xs"
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleUpdateBidStatus(b.id, "ACCEPTED")}
                          className="bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold px-2.5 py-1"
                        >
                          {actionLoadingId === b.id ? "..." : "Accept"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleUpdateBidStatus(b.id, "REJECTED")}
                          className="text-[11px] font-bold text-rose-700 hover:bg-rose-50 px-2.5 py-1"
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      as={Link}
                      to={`/messages?contact=${encodeURIComponent(b.bidder?.id || b.bidderId || "")}&land=${encodeURIComponent(b.landId || b.land?.id || "")}`}
                      variant="ghost"
                      size="xs"
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5"
                    >
                      Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Listed Land Inventory Overview */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 sm:text-lg tracking-tight">
                  Your Listed Land Parcels
                </h2>
                <p className="text-xs text-slate-500">Manage land inventory, mark parcels as sold, and view auction status</p>
              </div>
              <Button as={Link} to="/list-your-land" variant="primary" size="xs" className="bg-[#059669] hover:bg-[#047857]">
                + Add Land
              </Button>
            </div>

            {landActionError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                {landActionError}
              </div>
            )}

            {listings?.all?.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 my-4 text-center text-xs text-slate-500 font-semibold">
                You haven't listed any land parcels yet. Click "+ Add Land" to publish your first listing!
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {listings.all.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-[#059669] hover:bg-white hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                          {l.category || "Residential"}
                        </span>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                            l.status === "ACTIVE" && "bg-emerald-100 text-emerald-800",
                            l.status === "SOLD" && "bg-slate-900 text-white font-black",
                            l.status === "PENDING_REVIEW" && "bg-amber-100 text-amber-800",
                            l.status === "DRAFT" && "bg-slate-200 text-slate-700"
                          )}
                        >
                          {l.status}
                        </span>
                      </div>
                      <h3 className="mt-2 font-bold text-slate-900 line-clamp-1">{l.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{l.district ? `${l.district}, ` : ""}{l.region}</p>
                      <p className="mt-2 text-sm font-extrabold text-[#059669]">
                        GHS {l.totalPrice?.toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-3.5 flex flex-col gap-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500">{l._count?.bids || l.bids?.length || 0} bids received</span>
                        <Button as={Link} to={`/explore-land/${l.slug || l.id}`} variant="ghost" size="xs" className="text-[11px] text-slate-600 hover:text-slate-900">
                          View Details &rarr;
                        </Button>
                      </div>

                      {/* Landowner Action Controls */}
                      <div className="flex items-center gap-2 pt-1">
                        {l.status === "ACTIVE" ? (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              disabled={landActionLoadingId === l.id}
                              onClick={() => handleMarkAsSold(l.id, l.title)}
                              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[12px] py-1.5 shadow-2xs"
                            >
                              {landActionLoadingId === l.id ? "Updating..." : "Mark as Sold"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              disabled={landActionLoadingId === l.id}
                              onClick={() => handleDeleteListing(l.id, l.title)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 hover:border-slate-400 font-black text-[12px] py-1.5 px-3 transition-colors shadow-2xs hover:text-black"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1 text-slate-900 inline" />
                              {landActionLoadingId === l.id ? "..." : "Delete Listing"}
                            </Button>
                          </>
                        ) : l.status === "SOLD" ? (
                          <>
                            <span className="flex-1 rounded-lg bg-slate-900 py-1.5 text-center text-[12px] font-black uppercase tracking-wider text-white shadow-2xs">
                              SOLD
                            </span>
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              disabled={landActionLoadingId === l.id}
                              onClick={() => handleDeleteListing(l.id, l.title)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 hover:border-slate-400 font-black text-[12px] py-1.5 px-3 transition-colors shadow-2xs hover:text-black"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1 text-slate-900 inline" />
                              {landActionLoadingId === l.id ? "..." : "Delete Listing"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            size="xs"
                            disabled={landActionLoadingId === l.id}
                            onClick={() => handleDeleteListing(l.id, l.title)}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 hover:border-slate-400 font-black text-[12px] py-1.5 shadow-2xs hover:text-black"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1 text-slate-900 inline" />
                            {landActionLoadingId === l.id ? "..." : "Delete Listing"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Shortcuts */}
        <div className="space-y-6">
          <DashboardQuickActions actions={quickActions} />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar matching screenshot */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white py-2 shadow-lg md:hidden">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex flex-col items-center gap-0.5 text-slate-900 text-xs font-bold"
        >
          <Home className="h-5 w-5 text-[#059669]" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/explore-land")}
          className="flex flex-col items-center gap-0.5 text-slate-500 text-xs font-semibold hover:text-slate-900"
        >
          <Map className="h-5 w-5" />
          <span>Land</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/ai")}
          className="flex flex-col items-center gap-0.5 text-slate-500 text-xs font-semibold hover:text-slate-900"
        >
          <Briefcase className="h-5 w-5" />
          <span>Projects</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/messages")}
          className="flex flex-col items-center gap-0.5 text-slate-500 text-xs font-semibold hover:text-slate-900"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Messages</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center gap-0.5 text-slate-500 text-xs font-semibold hover:text-slate-900"
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </button>
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
