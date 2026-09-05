import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { ImageSkeleton } from "../common/Skeleton";
import NeedHelpCard from "../common/NeedHelpCard";
import PlatformTrustBar from "../common/PlatformTrustBar";
import StarRating from "../common/StarRating";
import { contractorApi } from "../../services/contractorApi";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

/* ================================================================ */
/* Icons — inlined per project convention, mirroring the same set    */
/* used in LandOwnerProfile.jsx for visual consistency between the   */
/* two profile page types. No default size is baked in; every call   */
/* site passes its own className size explicitly.                    */
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

function Breadcrumb({ contractor }) {
  const crumbs = contractor?.breadcrumb || [
    { label: "Home", to: "/" },
    { label: "Find Contractor", to: "/find-contractor" },
  ];

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
      {crumbs.map((crumb) => (
        <span key={crumb.label} className="flex items-center gap-1.5">
          <Link to={crumb.to} className="font-medium hover:text-forest-700">
            {crumb.label}
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </span>
      ))}
      <span className="text-ink-900">{contractor?.shortName || contractor?.name || "Contractor"}</span>
    </nav>
  );
}

/* ================================================================ */
/* Profile header (left column, top)                                 */
/* ================================================================ */

function ProfileHeader({ contractor }) {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const stats = contractor?.stats || [];
  const isOwner = Boolean(user && (user.id === contractor?.userId || user.id === contractor?.id));

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {(contractor?.image || contractor?.avatarUrl) && !imgError ? (
              <img
                src={contractor?.image || contractor?.avatarUrl}
                alt={contractor?.name || "Contractor Profile"}
                className="h-20 w-20 rounded-full object-cover bg-mist-100"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest-100 text-2xl font-bold text-forest-700">
                {(contractor?.name || "C")[0].toUpperCase()}
              </div>
            )}
            {contractor?.verified && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-forest-600 ring-2 ring-white">
                <CheckIcon className="h-3.5 w-3.5 text-white" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{contractor?.name}</h1>
              {contractor?.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-forest-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <CheckIcon className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
              <MapPinIcon className="h-4 w-4" />
              {contractor?.location || "Accra, Ghana"}
            </p>
            <span className="mt-2 inline-block rounded-full border border-ink-900/15 px-3 py-1 text-xs font-semibold text-ink-700">
              {contractor?.category || "Building & Construction"}
            </span>
          </div>
        </div>

        {isOwner && (
          <Button
            as={Link}
            to="/complete-contractor-profile"
            variant="secondary"
            size="sm"
            className="shrink-0 self-start sm:self-auto"
          >
            Edit Profile & Portfolio
          </Button>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-700">{contractor?.bio}</p>

      {stats.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-900/10 pt-5 sm:grid-cols-5">
          {stats.map((stat) => {
            const Icon = STAT_ICONS[stat.icon] || DocumentIcon;
            return (
              <div key={stat.label} className="flex items-start gap-2">
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
      )}
    </div>
  );
}


/* ================================================================ */
/* Verification status (right column, top)                           */
/* ================================================================ */

function VerificationCard({ contractor }) {
  const [expanded, setExpanded] = useState(false);
  const checklist = contractor?.verificationChecklist || [
    "Ghana Card NIA Identity Verified",
    "Registrar General's Department Registered",
    "Ministry of Works & Housing License",
    "Verified Site Safety Protocols",
  ];
  const details = contractor?.verificationDetails || [
    { label: "Business Registration", value: "Active • Verified" },
    { label: "Tax Clearance Certificate", value: "Current • Verified" },
    { label: "Insurance Coverage", value: "Comprehensive Policy" },
  ];

  return (
    <div className="rounded-2xl border border-forest-100 bg-forest-50/60 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-600 text-white">
          <ShieldCheckIcon className="h-5 w-5" />
        </span>
        <p className="text-sm font-bold text-ink-900">Verification Status</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-900">This business is fully verified</p>
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

function AboutSection({ contractor }) {
  const serviceAreas = contractor?.serviceAreas || [
    contractor?.location || "Greater Accra Region",
    "Tema & Surrounding Districts",
    "Central Region",
  ];
  const specializations = contractor?.specializations || [
    "Residential Construction",
    "Commercial Developments",
    "Structural Engineering",
  ];

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
        <PersonIcon className="h-5 w-5 text-ink-500" />
        About {contractor?.name}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-700">{contractor?.about || contractor?.bio}</p>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-ink-900">Service Areas</p>
          <ul className="mt-2 space-y-1.5">
            {serviceAreas.map((area) => (
              <li key={area} className="flex items-center gap-2 text-sm text-ink-700">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-forest-600" aria-hidden="true" />
                {area}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-ink-900">Specializations</p>
          <ul className="mt-2 space-y-1.5">
            {specializations.map((spec) => (
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

function ContactCard({ contractor, slug }) {
  const firstName = (contractor?.name || "Contractor").split(" ")[0];
  const phone = contractor?.phone || "+233 24 000 1234";
  const telHref = `tel:${phone.replace(/[^+\d]/g, "")}`;
  const mailHref = `mailto:${contractor?.email || "contact@terramatch.gh"}`;
  const messageHref = `/messages?contact=${slug || contractor?.id || "contractor"}`;

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-5">
      <h3 className="text-sm font-bold text-ink-900">Contact {firstName}</h3>
      <p className="mt-1 text-xs text-ink-500">Feel free to reach out for inquiries.</p>

      <a href={telHref} className="-mx-2 mt-4 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-mist-100">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <PhoneIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{phone}</p>
          <p className="text-xs text-ink-500">Phone</p>
        </div>
      </a>

      <a href={mailHref} className="-mx-2 mt-1 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-mist-100">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <MailIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{contractor?.email || "contact@terramatch.gh"}</p>
          <p className="text-xs text-ink-500">Email</p>
        </div>
      </a>

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
/* Portfolio & Lightbox Image Viewer                                */
/* ================================================================ */

function LightboxModal({ isOpen, onClose, images = [], initialIndex = 0, projectTitle = "" }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  function handlePrev() {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center justify-center max-h-[95vh] max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with counter and close button */}
        <div className="flex w-full items-center justify-between pb-3 text-white">
          <div className="min-w-0 flex-1 pr-4">
            <h4 className="truncate text-base font-bold sm:text-lg">{projectTitle}</h4>
            <p className="text-xs text-white/70">
              Photo {currentIndex + 1} of {images.length} (Max 8)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
            title="Close viewer"
          >
            ✕
          </button>
        </div>

        {/* Main image view with previous / next arrows */}
        <div className="relative flex items-center justify-center w-full max-h-[70vh] min-h-[280px] overflow-hidden rounded-2xl bg-black/50">
          <img
            src={images[currentIndex]}
            alt={`${projectTitle} photo ${currentIndex + 1}`}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 hover:scale-105 active:scale-95 text-lg font-bold"
              >
                &#10094;
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 hover:scale-105 active:scale-95 text-lg font-bold"
              >
                &#10095;
              </button>
            </>
          )}
        </div>

        {/* Bottom thumbnail strip */}
        {images.length > 1 && (
          <div className="mt-4 flex max-w-full gap-2 overflow-x-auto p-1">
            {images.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition",
                  idx === currentIndex ? "border-emerald-400 scale-105 ring-2 ring-emerald-400/50" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={imgUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioSection({ contractor }) {
  const { user } = useAuth();
  const isOwner = Boolean(user && (user.id === contractor?.userId || user.id === contractor?.id));
  const portfolio = contractor?.portfolio || [];

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  function openLightbox(project, imageIndex = 0) {
    setActiveProject(project);
    setActiveImageIndex(imageIndex);
    setLightboxOpen(true);
  }

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-ink-900">Work Portfolio & Completed Projects</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Verified projects, construction craftsmanship, and photographic evidence of previous jobs.
          </p>
        </div>

        {isOwner && (
          <Button
            as={Link}
            to="/complete-contractor-profile"
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5 shrink-0"
          >
            + Add / Edit Projects
          </Button>
        )}
      </div>

      {portfolio.length === 0 ? (
        <div className="my-6 rounded-xl border border-dashed border-ink-900/15 bg-mist-50/60 p-8 text-center">
          <p className="text-sm font-semibold text-ink-800">No Previous Projects Uploaded</p>
          <p className="mt-1 text-xs text-ink-500 max-w-sm mx-auto">
            {isOwner
              ? "You have not added any completed projects to your work portfolio yet. Add project details and up to 8 photos to showcase your craftsmanship."
              : "This contractor has not uploaded portfolio projects yet. Reach out via chat or phone for inquiries."}
          </p>
          {isOwner && (
            <Button
              as={Link}
              to="/complete-contractor-profile"
              variant="primary"
              size="sm"
              className="mt-4"
            >
              + Add Portfolio Project
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {portfolio.map((project, idx) => {
            let imgs = [];
            if (Array.isArray(project.images)) imgs = project.images.filter(Boolean);
            else if (project.image) imgs = [project.image];
            imgs = imgs.slice(0, 8);

            return (
              <div
                key={project.id || idx}
                className="overflow-hidden rounded-2xl border border-ink-900/10 bg-mist-50/30 p-5 transition hover:border-forest-600/30 hover:bg-white hover:shadow-card"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
                    Project Worked On #{idx + 1}
                  </span>
                  <h3 className="text-base font-extrabold text-ink-900 sm:text-lg">{project.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-700 whitespace-pre-line">
                    {project.description}
                  </p>
                </div>

                {/* Multi-Photo Image Gallery (Up to 8 Pictures) */}
                {imgs.length > 0 && (
                  <div className="mt-4 border-t border-ink-900/5 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-ink-700">
                        Project Gallery ({imgs.length} Picture{imgs.length === 1 ? "" : "s"} • Max 8)
                      </span>
                      <span className="text-[11px] font-medium text-forest-700">Click photo to zoom</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {imgs.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => openLightbox(project, imgIdx)}
                          className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl border border-ink-900/10 bg-mist-100 shadow-xs transition hover:opacity-95"
                        >
                          <img
                            src={imgUrl}
                            alt={`${project.title} picture ${imgIdx + 1}`}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
                            <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                              🔍 Zoom
                            </span>
                          </div>
                          {imgIdx === 0 && (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-forest-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={
          activeProject
            ? (Array.isArray(activeProject.images) ? activeProject.images.filter(Boolean) : activeProject.image ? [activeProject.image] : []).slice(0, 8)
            : []
        }
        initialIndex={activeImageIndex}
        projectTitle={activeProject?.title || "Project Picture"}
      />
    </div>
  );
}


/* ================================================================ */
/* Performance summary (right column)                                */
/* ================================================================ */

function PerformanceCard({ contractor }) {
  const [expanded, setExpanded] = useState(false);
  const performance = contractor?.performance || [
    { label: "On-Time Completion", value: "97%" },
    { label: "Budget Adherence", value: "99%" },
    { label: "Safety Record", value: "Zero Incidents" },
  ];
  const performanceDetails = contractor?.performanceDetails || [
    { label: "Avg. Project Duration", value: "3 – 6 Months" },
    { label: "Warranty Period", value: "12 Months Post-Handover" },
    { label: "Dispute Rate", value: "0%" },
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

function ReviewsSection({ contractor }) {
  const { user, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [reviewsList, setReviewsList] = useState(contractor?.reviews || []);
  const [showAll, setShowAll] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (contractor?.reviews) {
      setReviewsList(contractor.reviews);
    }
  }, [contractor?.reviews]);

  const totalReviews = reviewsList.length;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviewsList.filter((r) => Math.round(r.rating) === stars).length,
  }));

  const avgRating =
    totalReviews > 0
      ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : (contractor?.rating || "0.0");

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
      const contractorIdentifier = contractor?.id || contractor?.slug;
      const res = await contractorApi.addReview(contractorIdentifier, {
        rating,
        comment: comment.trim(),
      });

      const newRev = res.review
        ? {
            id: res.review.id,
            name: user.name || "Verified Client",
            rating,
            comment: comment.trim(),
            dateLabel: "Just now",
            createdAt: new Date().toISOString(),
          }
        : {
            id: Date.now().toString(),
            name: user.name || "Verified Client",
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
            {ratingBreakdown.map((row) => (
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
          Share your experience working with this contractor.
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
            <label htmlFor="contractor-review-comment" className="sr-only">
              Your Review
            </label>
            <textarea
              id="contractor-review-comment"
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

function BadgesCard({ contractor }) {
  const [showAll, setShowAll] = useState(false);
  const badges = contractor?.badges || [
    {
      icon: "trophy",
      title: "Top Rated Builder 2026",
      description: "Ranked among top Ghanaian contractors on TerraMatch.",
    },
    {
      icon: "shield",
      title: "Verified Identity & License",
      description: "100% compliant with Ministry and NIA standards.",
    },
  ];
  const visibleBadges = showAll ? badges : badges.slice(0, 3);
  const hasMore = badges.length > 3;

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-5">
      <h3 className="text-sm font-bold text-ink-900">Badges & Achievements</h3>
      <ul className="mt-3 space-y-3">
        {visibleBadges.map((badge) => {
          const Icon = BADGE_ICONS[badge.icon] || TrophyIcon;
          return (
            <li key={badge.title} className="flex items-start gap-3">
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

export default function ContractorProfile({ contractor, slug }) {
  return (
    <section className="container-page py-8 sm:py-12">
      <Breadcrumb contractor={contractor} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-8">
          <ProfileHeader contractor={contractor} />
          <AboutSection contractor={contractor} />
          <PortfolioSection contractor={contractor} />
          <ReviewsSection contractor={contractor} />
        </div>

        <div className="space-y-6">
          <VerificationCard contractor={contractor} />
          <ContactCard contractor={contractor} slug={slug} />
          <PerformanceCard contractor={contractor} />
          <BadgesCard contractor={contractor} />
          <NeedHelpCard description="Our team is here to help you with any questions or concerns." />
        </div>
      </div>

      <PlatformTrustBar className="mt-10" />
    </section>
  );
}
