import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import ErrorBoundary from "../components/common/ErrorBoundary";
import LandDetailContent from "../components/sections/LandDetailContent";
import { FEATURED_LANDS } from "../constants/lands";
import { LAND_DETAILS } from "../constants/landDetails";
import { landApi } from "../services/landApi";
import { useAuction } from "../context/AuctionContext";

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function LandDetail() {
  const { slug } = useParams();
  const [land, setLand] = useState(() => FEATURED_LANDS.find((l) => l.slug === slug) || null);
  const [loading, setLoading] = useState(true);
  const { fetchLandBids } = useAuction();

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([
      landApi.getBySlug(slug).catch(() => null),
      fetchLandBids(slug).catch(() => null),
    ])
      .then(([data]) => {
        if (isMounted && data) {
          setLand(data);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, fetchLandBids]);

  const staticDetail = slug && LAND_DETAILS[slug] ? LAND_DETAILS[slug] : null;

  const detail = land
    ? {
        badge: land.status === "ACTIVE" ? "Verified Land" : land.status || "Verified Land",
        photoCount: land.images?.length || 4,
        heroLocation: land.location || land.address || "Greater Accra, Ghana",
        breadcrumbRegion: land.region || "Greater Accra",
        ownerSlug: land.ownerSlug || (land.owner?.name ? slugify(land.owner.name) : "kwame-owusu"),
        description: land.description || "Prime titled land ready for development.",
        specs: [
          { icon: "landUse", label: "Land Use", value: land.category || "Residential" },
          { icon: "plotSize", label: "Plot Size", value: land.plotSize || "120 x 100 ft" },
          { icon: "totalSize", label: "Total Size", value: land.landSize || "1 Plot" },
          { icon: "landStatus", label: "Land Status", value: land.ownershipType || "Titled" },
        ],
        about: land.description || "Prime titled land ready for development with verified documentation.",
        amenities: (Array.isArray(land.amenities) && land.amenities.length > 0
          ? land.amenities
          : staticDetail?.amenities || ["Road Access", "Electricity Grid", "Good Drainage", "Flat Topography"]
        ).map((a) => {
          const label = typeof a === "string" ? a : a.label || "Amenity";
          const lLower = label.toLowerCase();
          let icon = "road";
          if (lLower.includes("electric") || lLower.includes("power")) icon = "electricity";
          else if (lLower.includes("water") || lLower.includes("pipe")) icon = "water";
          else if (lLower.includes("drain") || lLower.includes("flood")) icon = "drainage";
          else if (lLower.includes("terrain") || lLower.includes("topo") || lLower.includes("flat")) icon = "topography";
          return {
            icon,
            label,
            value: "Available",
          };
        }),
        locationAddress: land.address || land.location || "Greater Accra, Ghana",
        coordinatesLabel: `${land.latitude || 5.651}° N, ${Math.abs(land.longitude || 0.162)}° W`,
        coordinates: { lat: parseFloat(land.latitude) || 5.651, lng: parseFloat(land.longitude) || -0.162 },
        mapPlaceLabels: staticDetail?.mapPlaceLabels || [
          { label: land.location || land.address || "Land Site", top: "45%", left: "48%", emphasis: true },
          { label: "Main Access Road", top: "25%", left: "70%" },
          { label: "Town Center", top: "75%", left: "25%" },
          { label: land.region || "District Hub", top: "60%", left: "15%" },
        ],
        nearbyPlaces: staticDetail?.nearbyPlaces || [
          { label: "Main Highway / Access Road", distance: "0.4 km" },
          { label: "Commercial Hub & Markets", distance: "1.2 km" },
          { label: "Community Center & Amenities", distance: "1.5 km" },
        ],
        documents: Array.isArray(land.documents) && land.documents.length > 0
          ? land.documents.map((d) => (typeof d === "string" ? { name: d, meta: "PDF Document" } : d))
          : staticDetail?.documents || [
              { name: "Land Title Certificate", meta: "PDF • Verified" },
              { name: "Approved Site Plan", meta: "PDF • Lands Commission" },
              { name: "Cadastral Survey Plan", meta: "PDF • Licensed Surveyor" },
            ],
        detailsTable: staticDetail?.detailsTable || {
          left: [
            { label: "Property Type", value: `${land.category || "Residential"} Land` },
            { label: "Tenure", value: land.tenure || "Freehold" },
            { label: "Land Size", value: land.landSize || "1 Plot" },
          ],
          right: [
            { label: "Zoning", value: "Approved" },
            { label: "Topography", value: land.environmentalData?.terrainType || land.terrainType || "Flat Land" },
            { label: "Dispute Status", value: "Zero Encumbrance / Verified" },
          ],
        },
        termsAndConditions: [
          "Bids placed are binding commitments on TerraMatch.",
          "Buyer verification is completed prior to final deed transfer.",
          "All documentation inspected and verified against Lands Commission registry.",
        ],
        terms: [
          "Bids placed are binding commitments on TerraMatch.",
          "Buyer verification is completed prior to final deed transfer.",
          "All documentation inspected and verified against Lands Commission registry.",
        ],
        bidHistory: land.bidHistory || (Array.isArray(land.bids) ? land.bids.map(b => ({
          id: b.id,
          bidder: b.bidder?.name || b.bidderName || "Bidder",
          amount: b.amount,
          dateLabel: new Date(b.createdAt || Date.now()).toLocaleDateString(),
          verified: b.bidder?.ghanaCardVerified ?? true,
          status: b.status || "ACTIVE",
        })) : []),
        bidIncrement: land.bidIncrement || 5000,
        minimumNextBid: land.minNextBid || land.totalPrice || land.priceValue || 150000,
      }
    : staticDetail;

  if (!land && !loading) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <span className="rounded-full bg-forest-100 px-4 py-1.5 text-sm font-semibold text-forest-700">
          Not found
        </span>
        <h1 className="mt-5 text-3xl font-bold text-ink-900 sm:text-4xl">
          Land Not Found
        </h1>
        <p className="mt-3 max-w-md text-ink-700">
          We couldn't find a listing at this address. It may have been
          removed, or the link might be incorrect.
        </p>
        <Button as={Link} to="/explore-land" variant="primary" className="mt-8">
          Back to Explore Land
        </Button>
      </section>
    );
  }

  if (!land) return null;

  return (
    <ErrorBoundary>
      <LandDetailContent land={land} detail={detail} />
    </ErrorBoundary>
  );
}
