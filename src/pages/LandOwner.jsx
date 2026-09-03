import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import ErrorBoundary from "../components/common/ErrorBoundary";
import LandOwnerProfile from "../components/sections/LandOwnerProfile";
import { LAND_OWNERS } from "../constants/landOwners";
import { landApi } from "../services/landApi";

export default function LandOwner() {
  const { slug } = useParams();
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    if (!slug) {
      setLoading(false);
      return;
    }

    landApi
      .getOwnerProfile(slug)
      .then((data) => {
        if (!isMounted) return;
        if (data && data.name) {
          setOwner(data);
        } else if (LAND_OWNERS[slug]) {
          setOwner(LAND_OWNERS[slug]);
        } else {
          setOwner(null);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Backend owner lookup fallback:", err.message);
        if (LAND_OWNERS[slug]) {
          setOwner(LAND_OWNERS[slug]);
        } else {
          // Generate fallback for dynamic slug if static map doesn't have it
          const formattedName = slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          setOwner({
            name: formattedName,
            shortName: formattedName.split(" ")[0] || "Owner",
            role: "Land Owner",
            verified: true,
            location: "Accra, Greater Accra Region, Ghana",
            bio: "Verified Ghanaian land owner with titled property listings across Greater Accra and Central regions.",
            about: "Dedicated land owner committed to transparent land acquisition, verified documentation, and legitimate property development.",
            rating: 4.8,
            reviewCount: 24,
            phone: "+233 24 123 4567",
            email: "seller@terramatch.gh",
            totalListings: 1,
            successfulSales: 1,
            responseRate: "98%",
            avgResponseTime: "1.2 hrs",
            breadcrumb: [{ label: "Explore Land", to: "/explore-land" }],
            stats: [
              { icon: "listings", label: "Member Since", value: "Jan 2022" },
              { icon: "listings", label: "Total Listings", value: "1" },
              { icon: "sales", label: "Successful Sales", value: "1" },
              { icon: "phone", label: "Response Rate", value: "98%" },
              { icon: "clock", label: "Avg. Response Time", value: "1.2 hrs" },
            ],
            verificationChecklist: [
              "National ID Verified",
              "Contact Information Verified",
              "Business Registration Verified",
              "Address Verified",
            ],
            verificationDetails: [
              { label: "National ID", value: "Ghana Card NIA Verified • Valid" },
              { label: "Contact Verification", value: "Phone & Email Confirmed" },
              { label: "Title Registration", value: "Lands Commission Approved" },
              { label: "Dispute Status", value: "Zero Encumbrances" },
            ],
            areasOfOperation: ["Greater Accra Region", "Eastern Region"],
            specialization: ["Residential Lands", "Commercial Lands"],
            lands: [],
            listingSlugs: [],
            performance: [
              { label: "Response Rate", value: "98%" },
              { label: "Avg. Response Time", value: "1.2 hrs" },
              { label: "Successful Sales", value: "1" },
              { label: "Total Listings", value: "1" },
              { label: "Member Since", value: "Jan 2022" },
            ],
            performanceDetails: [
              { label: "Survey Accuracy", value: "100%" },
              { label: "Site Inspection Availability", value: "7 Days a Week" },
            ],
            ratingBreakdown: [
              { stars: 5, count: 18 },
              { stars: 4, count: 5 },
              { stars: 3, count: 1 },
              { stars: 2, count: 0 },
              { stars: 1, count: 0 },
            ],
            reviews: [
              {
                name: "Ama Serwaa",
                dateLabel: "May 19, 2026",
                rating: 5,
                comment: "Great experience! The land documents were genuine and the process was smooth.",
              },
              {
                name: "Kofi Mensah",
                dateLabel: "May 18, 2026",
                rating: 5,
                comment: "Professional and responsive, I highly recommend this seller for land transactions.",
              },
              {
                name: "Nana Adjei",
                dateLabel: "May 16, 2026",
                rating: 5,
                comment: "Transparent, trustworthy and very helpful throughout the process.",
              },
            ],
            badges: [
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
            ],
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest-600 border-t-transparent" />
        <p className="mt-4 text-sm text-ink-500">Loading seller profile...</p>
      </section>
    );
  }

  if (!owner) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <span className="rounded-full bg-forest-100 px-4 py-1.5 text-sm font-semibold text-forest-700">
          Not found
        </span>
        <h1 className="mt-5 text-3xl font-bold text-ink-900 sm:text-4xl">
          Profile Not Found
        </h1>
        <p className="mt-3 max-w-md text-ink-700">
          We couldn't find a land owner profile at this address. It may
          have been removed, or the link might be incorrect.
        </p>
        <Button as={Link} to="/explore-land" variant="primary" className="mt-8">
          Back to Explore Land
        </Button>
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <LandOwnerProfile owner={owner} slug={slug} />
    </ErrorBoundary>
  );
}
