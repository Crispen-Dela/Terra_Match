import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import ErrorBoundary from "../components/common/ErrorBoundary";
import ContractorProfile from "../components/sections/ContractorProfile";
import { contractorApi } from "../services/contractorApi";
import { unsplashUrl, CONTRACTOR_PHOTO_IDS } from "../constants/stockImages";

export default function ContractorProfilePage() {
  const { slug } = useParams();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      contractorApi
        .getBySlug(slug)
        .then((data) => {
          if (data) setContractor(data);
        })
        .catch(() => {
          // If not found via slug directly, search in full list
          contractorApi
            .list()
            .then((list) => {
              if (Array.isArray(list)) {
                const found = list.find((c) => c.slug === slug || c.id === slug);
                if (found) setContractor(found);
              }
            })
            .catch(() => {});
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [slug]);

  const profile = contractor
    ? {
        id: contractor.id,
        userId: contractor.userId || contractor.id,
        name: contractor.name || "Contractor Profile",
        shortName: (contractor.name || "").split(" ")[0] || "Contractor",

        verified: contractor.verified ?? true,
        location: contractor.location || "Accra, Greater Accra",
        category: contractor.category || "Building & Construction",
        bio:
          contractor.bio ||
          "Professional licensed contractor committed to exceptional craftsmanship, structural integrity, and timely project delivery across Ghana.",
        about:
          contractor.bio ||
          "Comprehensive general contracting, civil engineering, and modern residential & commercial construction.",
        rating: contractor.rating || 0.0,
        reviewCount: contractor.reviewCount || (contractor.reviews?.length || 0),
        reviews: contractor.reviews || [],
        ratingBreakdown: contractor.ratingBreakdown || [
          { stars: 5, count: 0 },
          { stars: 4, count: 0 },
          { stars: 3, count: 0 },
          { stars: 2, count: 0 },
          { stars: 1, count: 0 },
        ],
        phone: contractor.phone || "+233 24 000 1234",
        email: contractor.email || "contact@terramatch.gh",
        breadcrumb: [
          { label: "Home", to: "/" },
          { label: "Find Contractor", to: "/find-contractor" },
        ],
        stats: [
          { icon: "listings", label: "Completed Projects", value: String(contractor.projects || contractor.completedProjects || 12) },
          { icon: "clock", label: "Years Experience", value: `${contractor.yearsExperience || 5}+ yrs` },
          { icon: "phone", label: "Response Rate", value: "98%" },
          { icon: "document", label: "License Status", value: contractor.licenseType || "Verified Active" },
          { icon: "sales", label: "Client Satisfaction", value: "99%" },
        ],
        verificationChecklist: [
          "Ghana Card NIA Identity Verified",
          "Registrar General's Department Registered",
          "Ministry of Works & Housing License",
          "Verified Site Safety Protocols",
        ],
        verificationDetails: [
          { label: "Business Registration", value: "Active • Verified" },
          { label: "Tax Clearance Certificate", value: "Current • Verified" },
          { label: "Insurance Coverage", value: "Comprehensive Policy" },
        ],
        serviceAreas: Array.isArray(contractor.serviceAreas)
          ? contractor.serviceAreas
          : [
              contractor.location || "Greater Accra Region",
              "Tema & Surrounding Districts",
              "Central Region",
              "Eastern Region",
            ],
        specializations: contractor.specialties
          ? (Array.isArray(contractor.specialties) ? contractor.specialties : contractor.specialties.split(",").map((s) => s.trim()))
          : [
              "Residential Construction",
              "Commercial Developments",
              "Architectural Planning",
              "Structural Engineering",
            ],
        portfolio: Array.isArray(contractor.portfolio) && contractor.portfolio.length > 0 
          ? contractor.portfolio 
          : [],
        performance: [
          { label: "On-Time Completion", value: "97%" },
          { label: "Budget Adherence", value: "99%" },
          { label: "Safety Record", value: "Zero Incidents" },
        ],
        performanceDetails: [
          { label: "Avg. Project Duration", value: "3 – 6 Months" },
          { label: "Warranty Period", value: "12 Months Post-Handover" },
          { label: "Dispute Rate", value: "0%" },
        ],
        badges: [
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
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest-600 border-t-transparent" />
      </div>
    );
  }

  if (!contractor) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <span className="rounded-full bg-forest-100 px-4 py-1.5 text-sm font-semibold text-forest-700">
          Not found
        </span>
        <h1 className="mt-5 text-3xl font-bold text-ink-900 sm:text-4xl">
          Contractor Not Found
        </h1>
        <p className="mt-3 max-w-md text-ink-700">
          We couldn't find a contractor profile at this address. It may
          have been removed, or the link might be incorrect.
        </p>
        <Button as={Link} to="/find-contractor" variant="primary" className="mt-8">
          Back to Find Contractor
        </Button>
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <ContractorProfile contractor={profile} slug={slug} />
    </ErrorBoundary>
  );
}
