import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { ImageSkeleton } from "../common/Skeleton";
import NeedHelpCard from "../common/NeedHelpCard";
import PlatformTrustBar from "../common/PlatformTrustBar";
import LandListingTile from "../common/LandListingTile";
import StarRating from "../common/StarRating";
import { landApi } from "../../services/landApi";
import { useAuth } from "../../context/AuthContext";
import { FEATURED_LANDS } from "../../constants/lands";
import { unsplashUrl, KWAME_AVATAR_ID } from "../../constants/stockImages";
import { cn } from "../../utils/cn";

/* ================================================================ */
/* Icons — inlined per project convention                           */
/* ================================================================ */

function ChevronRightIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M7.5 4.5l6 5.5-6 5.5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden="true">
      <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4 10.5l3.5 3.5L16 5.5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M7 3h6l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 3v4h4" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 13.5h5M9 16.8h3.2" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ClipboardIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <rect x="6" y="4" width="12" height="17" rx="1.5" strokeWidth="1.6" />
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 11h6M9 15h6" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path
        d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a1.5 1.5 0 01-1.6 1.5A17 17 0 015 5.1 1.5 1.5 0 016.5 3.5z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldCheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" strokeWidth="1.6" />
      <path d="M4.5 20c0-4 3.5-6.5 7.5-6.5s7.5 2.5 7.5 6.5" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.6" />
      <path d="M3.5 6.5l8.5 6 8.5-6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4 5h16v11H8l-4 3.5V5z" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-current", className)} aria-hidden="true">
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
    </svg>
  );
}

function TrophyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M8 4h8v5a4 4 0 01-8 0V4z" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 5H5v2a3 3 0 003 3M16 5h3v2a3 3 0 01-3 3" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 13v3M9 20h6M10 17h4v3h-4v-3z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoltIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

function HandshakeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M2 12.5l4-3 3 2.2 3-2.2 3 2.2 3-2.2 4 3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M9 11.3l2.3 2.9a1.5 1.5 0 002.3.1v0a1.5 1.5 0 00-.1-2.1l-1.8-1.7"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STAT_ICONS = {
  document: DocumentIcon,
  listings: ClipboardIcon,
  sales: DocumentIcon,
  phone: PhoneIcon,
  clock: ClockIcon,
};

const BADGE_ICONS = {
  trophy: TrophyIcon,
  shield: ShieldIcon,
  bolt: BoltIcon,
  star: StarIcon,
  handshake: HandshakeIcon,
};

/* ================================================================ */
/* Breadcrumb                                                         */
/* ================================================================ */

function Breadcrumb({ owner }) {
  const shortName = owner?.shortName || (owner?.name ? owner.name.split(" ")[0] : "Seller");
  const firstLand = Array.isArray(owner?.lands) && owner.lands.length > 0 ? owner.lands[0] : null;

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
      <span className="flex items-center gap-1.5">
        <Link to="/explore-land" className="font-medium hover:text-forest-700">
          Explore Land
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </span>
      {firstLand && (
        <span className="flex items-center gap-1.5">
          <Link to={`/explore-land/${firstLand.slug || firstLand.id}`} className="font-medium hover:text-forest-700">
            {firstLand.name || firstLand.title}
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="font-semibold text-ink-900">{owner?.name || shortName}</span>
    </nav>
  );
}

/* ================================================================ */
/* Profile header (left column, top)                                 */
/* ================================================================ */

function ProfileHeader({ owner }) {
  const stats = owner?.stats || [
    { icon: "listings", label: "Member Since", value: owner?.memberSince || "Jan 2022" },
    { icon: "listings", label: "Total Listings", value: String(owner?.totalListings || 1) },
    { icon: "sales", label: "Successful Sales", value: String(owner?.successfulSales || 1) },
    { icon: "phone", label: "Response Rate", value: owner?.responseRate || "98%" },
    { icon: "clock", label: "Avg. Response Time", value: owner?.avgResponseTime || "1.2 hrs" },
  ];

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <img
            src={owner?.avatarUrl && !owner.avatarUrl.startsWith("blob:") ? owner.avatarUrl : unsplashUrl(KWAME_AVATAR_ID, { w: 160 })}
            alt={owner?.name || "Seller Avatar"}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = unsplashUrl(KWAME_AVATAR_ID, { w: 160 });
            }}
            className="h-20 w-20 rounded-full object-cover"
          />
          {owner?.verified && (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-forest-600 ring-2 ring-white">
              <CheckIcon className="h-3.5 w-3.5 text-white" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{owner?.name}</h1>
            {owner?.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                <CheckIcon className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
            <MapPinIcon className="h-4 w-4" />
            {owner?.location || "Accra, Greater Accra Region, Ghana"}
          </p>
          <span className="mt-2 inline-block rounded-full border border-ink-900/15 px-3 py-1 text-xs font-semibold text-ink-700">
            {owner?.role || "Land Owner"}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-700">{owner?.bio}</p>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-900/10 pt-5 sm:grid-cols-5">
        {stats.map((stat, idx) => {
          const Icon = STAT_ICONS[stat.icon] || ClipboardIcon;
          return (
            <div key={stat.label || idx} className="flex items-start gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink-900">{stat.value}</p>
                <p className="text-[11px] leading-tight text-ink-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================ */
/* Verification status (right column, top)                           */
/* ================================================================ */

function VerificationCard({ owner }) {
  const [expanded, setExpanded] = useState(false);
  const checklist = owner?.verificationChecklist || [
    "National ID Verified",
    "Contact Information Verified",
    "Business Registration Verified",
    "Address Verified",
  ];
  const details = owner?.verificationDetails || [
    { label: "National ID", value: "Ghana Card NIA Verified • Valid" },
    { label: "Contact Verification", value: "Phone & Email Confirmed" },
    { label: "Title Registration", value: "Lands Commission Approved" },
    { label: "Dispute Status", value: "Zero Encumbrances" },
  ];

  return (
    <div className="rounded-2xl border border-forest-100 bg-forest-50/60 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-600 text-white">
          <ShieldCheckIcon className="h-5 w-5" />
        </span>
        <p className="text-sm font-bold text-ink-900">Verification Status</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-900">This user is fully verified</p>
      <p className="mt-1 text-xs text-ink-500">All documents have been verified and approved.</p>
      <ul className="mt-4 space-y-2">
        {checklist.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-ink-700">
            <CheckIcon className="h-4 w-4 shrink-0 text-forest-600" />
            {item}
          </li>
        ))}
      </ul>

      {expanded && (
        <dl className="mt-4 space-y-2 border-t border-forest-600/10 pt-4">
          {details.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-ink-500">{row.label}</dt>
              <dd className="font-medium text-ink-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <Button
        type="button"
        variant="outline-dark"
        size="md"
        className="mt-4 w-full"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Hide Verification Details" : "View Verification Details"}
      </Button>
    </div>
  );
}

/* ================================================================ */
/* About                                                              */
/* ================================================================ */

function AboutSection({ owner }) {
  const areas = owner?.areasOfOperation || ["Greater Accra Region", "Eastern Region"];
  const specs = owner?.specialization || ["Residential Lands", "Commercial Lands"];

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
        <PersonIcon className="h-5 w-5 text-ink-500" />
        About {owner?.name}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-700">{owner?.about || owner?.bio}</p>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-ink-900">Areas of Operation</p>
          <ul className="mt-2 space-y-1.5">
            {areas.map((area) => (
              <li key={area} className="flex items-center gap-2 text-sm text-ink-700">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-forest-600" aria-hidden="true" />
                {area}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-ink-900">Specialization</p>
          <ul className="mt-2 space-y-1.5">
            {specs.map((spec) => (
              <li key={spec} className="flex items-center gap-2 text-sm text-ink-700">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-forest-600" aria-hidden="true" />
                {spec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ */
/* Contact (right column)                                            */
/* ================================================================ */

function ContactCard({ owner, slug }) {
  const firstName = owner?.name ? owner.name.split(" ")[0] : "Seller";
  const telHref = owner?.phone ? `tel:${owner.phone.replace(/[^+\d]/g, "")}` : "#";
  const mailHref = owner?.email ? `mailto:${owner.email}` : "#";
  const messageHref = `/messages?contact=${owner?.id || slug || "seller"}`;

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-5">
      <h3 className="text-sm font-bold text-ink-900">Contact {firstName}</h3>
      <p className="mt-1 text-xs text-ink-500">Feel free to reach out for inquiries.</p>

      {owner?.phone && (
        <a href={telHref} className="-mx-2 mt-4 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-mist-100">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
            <PhoneIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{owner.phone}</p>
            <p className="text-xs text-ink-500">Phone</p>
          </div>
        </a>
      )}

      {owner?.email && (
        <a href={mailHref} className="-mx-2 mt-1 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-mist-100">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
            <MailIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{owner.email}</p>
            <p className="text-xs text-ink-500">Email</p>
          </div>
        </a>
      )}

      <Link
        to={messageHref}
        className="-mx-2 mt-1 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-mist-100"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <ChatIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">Start a Conversation</p>
          <p className="text-xs text-ink-500">Quick response</p>
        </div>
      </Link>

      <Button as={Link} to={messageHref} variant="primary" size="md" className="mt-4 w-full">
        Chat Now
      </Button>
    </div>
  );
}

/* ================================================================ */
/* Listings                                                           */
/* ================================================================ */

function ListingsSection({ owner, lands = [] }) {
  const stripRef = useRef(null);

  const displayLands = (Array.isArray(lands) && lands.length > 0)
    ? lands
    : (Array.isArray(owner?.lands) && owner.lands.length > 0)
    ? owner.lands
    : (owner?.listingSlugs || [])
        .map((s) => FEATURED_LANDS.find((l) => l.slug === s))
        .filter(Boolean);

  function scrollStrip() {
    stripRef.current?.scrollBy({ left: 240, behavior: "smooth" });
  }

  const count = displayLands.length || owner?.totalListings || 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink-900">Listings ({count})</h2>
        <Button as={Link} to="/explore-land" variant="outline-dark" size="sm" className="px-3.5 py-1.5 text-xs">
          View All Listings
        </Button>
      </div>

      {displayLands.length > 0 ? (
        <div className="relative mt-4">
          <div ref={stripRef} className="flex gap-4 overflow-x-auto pb-2 pt-1">
            {displayLands.map((land, idx) => (
              <LandListingTile key={land.slug || land.id || idx} land={land} />
            ))}
          </div>
          {displayLands.length > 3 && (
            <button
              type="button"
              onClick={scrollStrip}
              aria-label="Scroll listings"
              className="absolute right-0 top-1/3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink-900/10 bg-white shadow-sm hover:bg-mist-50"
            >
              <ChevronRightIcon className="h-4 w-4 text-ink-700" />
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-ink-900/10 bg-white p-8 text-center">
          <p className="text-sm text-ink-500">No active land listings currently available for this seller.</p>
        </div>
      )}
    </div>
  );
}

/* ================================================================ */
/* Performance summary (right column)                                */
/* ================================================================ */

function PerformanceCard({ owner }) {
  const [expanded, setExpanded] = useState(false);
  const performance = owner?.performance || [
    { label: "Response Rate", value: "98%" },
    { label: "Avg. Response Time", value: "1.2 hrs" },
    { label: "Successful Sales", value: "18" },
    { label: "Total Listings", value: "24" },
    { label: "Member Since", value: "Jan 2022" },
  ];
  const performanceDetails = owner?.performanceDetails || [
    { label: "Survey Accuracy", value: "100%" },
    { label: "Site Inspection Availability", value: "7 Days a Week" },
  ];

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-5">
      <h3 className="text-sm font-bold text-ink-900">Performance Summary</h3>
      <dl className="mt-2 divide-y divide-ink-900/5">
        {performance.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-2 text-sm">
            <dt className="text-ink-500">{row.label}</dt>
            <dd className="font-semibold text-ink-900">{row.value}</dd>
          </div>
        ))}
        {expanded &&
          performanceDetails.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-2 text-sm">
              <dt className="text-ink-500">{row.label}</dt>
              <dd className="font-semibold text-ink-900">{row.value}</dd>
            </div>
          ))}
      </dl>
      <Button
        type="button"
        variant="outline-dark"
        size="md"
        className="mt-3 w-full"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Hide Performance Details" : "View Performance Details"}
      </Button>
    </div>
  );
}

/* ================================================================ */
/* Reviews & ratings                                                 */
/* ================================================================ */

function ReviewsSection({ owner }) {
  const { user, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [reviewsList, setReviewsList] = useState(owner?.reviews || []);
  const [showAll, setShowAll] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (owner?.reviews) {
      setReviewsList(owner.reviews);
    }
  }, [owner?.reviews]);

  const totalReviews = reviewsList.length;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviewsList.filter((r) => Math.round(r.rating) === stars).length,
  }));

  const avgRating =
    totalReviews > 0
      ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : "0.0";

  const visibleReviews = showAll ? reviewsList : reviewsList.slice(0, 3);
  const hasMore = reviewsList.length > 3;

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write a review comment.");
      return;
    }
    if (!isAuthed || !user) {
      navigate("/login");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const ownerIdentifier = owner?.id || owner?.slug;
      const res = await landApi.addOwnerReview(ownerIdentifier, {
        rating,
        comment: comment.trim(),
      });

      const newRev = res.review
        ? {
            id: res.review.id,
            name: user.name || "Verified Buyer",
            rating,
            comment: comment.trim(),
            dateLabel: "Just now",
            createdAt: new Date().toISOString(),
          }
        : {
            id: Date.now().toString(),
            name: user.name || "Verified Buyer",
            rating,
            comment: comment.trim(),
            dateLabel: "Just now",
            createdAt: new Date().toISOString(),
          };

      setReviewsList((prev) => [newRev, ...prev]);
      setComment("");
      setRating(5);
      setSuccess("Thank you! Your review has been submitted.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
        <StarIcon className="h-5 w-5 text-amber-400" />
        Reviews & Ratings
      </h2>

      {totalReviews > 0 && (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="text-center sm:w-32 sm:shrink-0">
            <p className="text-4xl font-extrabold text-ink-900">{avgRating}</p>
            <StarRating value={parseFloat(avgRating)} className="mt-1 justify-center" />
            <p className="mt-1 text-xs text-ink-500">({totalReviews} Review{totalReviews === 1 ? "" : "s"})</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {breakdown.map((row) => (
              <div key={row.stars} className="flex items-center gap-2 text-xs text-ink-500">
                <span className="w-12 shrink-0">{row.stars} Stars</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-900/10">
                  <div
                    className="h-full rounded-full bg-forest-600"
                    style={{ width: `${totalReviews > 0 ? (row.count / totalReviews) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-4 shrink-0 text-right">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing reviews list — blank if none exist */}
      {totalReviews > 0 && (
        <ul className="mt-6 space-y-4 border-t border-ink-900/10 pt-5">
          {visibleReviews.map((review, i) => (
            <li key={review.id || `${review.name}-${i}`} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-700">
                {(review.name || "U")[0].toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-900">{review.name}</p>
                  <span className="text-xs text-ink-400">{review.dateLabel}</span>
                </div>
                <StarRating value={review.rating} className="mt-0.5" />
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{review.comment}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <Button
          type="button"
          variant="outline-dark"
          size="md"
          className="mt-5 w-full"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show Fewer Reviews" : "View All Reviews"}
        </Button>
      )}

      {/* Leave Review Area at bottom */}
      <div className={cn("mt-6 border-t border-ink-900/10 pt-6", totalReviews === 0 && "mt-4 border-t-0 pt-0")}>
        <h3 className="text-sm font-bold text-ink-900">Leave a Review</h3>
        <p className="mt-0.5 text-xs text-ink-500">
          Share your experience with this land owner.
        </p>

        <form onSubmit={handleSubmitReview} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1">Your Rating</label>
            <div className="flex items-center gap-2">
              <StarRating
                value={rating}
                onChange={setRating}
                className="gap-1.5"
                starClassName="h-5 w-5"
              />
              <span className="text-xs font-bold text-ink-700">
                {rating} Star{rating > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="owner-review-comment" className="sr-only">
              Your Review
            </label>
            <textarea
              id="owner-review-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review here..."
              className="w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          {success && <p className="text-xs font-medium text-forest-700">{success}</p>}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting || !comment.trim()}
            className="w-full sm:w-auto"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ================================================================ */
/* Badges & achievements (right column)                              */
/* ================================================================ */

function BadgesCard({ owner }) {
  const [showAll, setShowAll] = useState(false);
  const badges = owner?.badges || [
    {
      icon: "trophy",
      title: "Top Rated Seller",
      description: "Awarded for excellent service",
    },
    {
      icon: "shield",
      title: "Verified Land Owner",
      description: "Identity and documents verified",
    },
    {
      icon: "bolt",
      title: "Fast Responder",
      description: "Usually replies within 1 hour",
    },
  ];
  const visibleBadges = showAll ? badges : badges.slice(0, 3);
  const hasMore = badges.length > 3;

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-5">
      <h3 className="text-sm font-bold text-ink-900">Badges & Achievements</h3>
      <ul className="mt-3 space-y-3">
        {visibleBadges.map((badge, i) => {
          const Icon = BADGE_ICONS[badge.icon] || ShieldIcon;
          return (
            <li key={`${badge.title}-${i}`} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{badge.title}</p>
                <p className="text-xs text-ink-500">{badge.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <Button
          type="button"
          variant="outline-dark"
          size="md"
          className="mt-4 w-full"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show Fewer Badges" : "View All Badges"}
        </Button>
      )}
    </div>
  );
}

/* ================================================================ */
/* Page section                                                      */
/* ================================================================ */

export default function LandOwnerProfile({ owner, slug }) {
  const lands = (Array.isArray(owner?.lands) && owner.lands.length > 0)
    ? owner.lands
    : (owner?.listingSlugs || [])
        .map((s) => FEATURED_LANDS.find((l) => l.slug === s))
        .filter(Boolean);

  return (
    <section className="container-page py-8 sm:py-12">
      <Breadcrumb owner={owner} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-8">
          <ProfileHeader owner={owner} />
          <AboutSection owner={owner} />
          <ListingsSection owner={owner} lands={lands} />
          <ReviewsSection owner={owner} />
        </div>

        <div className="space-y-6">
          <VerificationCard owner={owner} />
          <ContactCard owner={owner} slug={slug} />
          <PerformanceCard owner={owner} />
          <BadgesCard owner={owner} />
          <NeedHelpCard description="Our team is here to help you with any questions or concerns." />
        </div>
      </div>

      <PlatformTrustBar className="mt-10" />
    </section>
  );
}
