import { useEffect, useMemo, useState } from "react";
import ContractorHero from "../components/sections/ContractorHero";
import TopContractors from "../components/sections/TopContractors";
import CategoriesAndTrust from "../components/sections/CategoriesAndTrust";
import CustomProjectBanner from "../components/sections/CustomProjectBanner";
import { ratingOptionToMin } from "../constants/contractors";
import { contractorApi } from "../services/contractorApi";

const RESULTS_SECTION_ID = "contractor-results";

export default function FindContractor() {
  const [contractorsList, setContractorsList] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [location, setLocation] = useState("All Locations");
  const [ratingLabel, setRatingLabel] = useState("Any rating");

  useEffect(() => {
    contractorApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          setContractorsList(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch contractors:", err.message);
      });
  }, []);

  const filteredContractors = useMemo(() => {
    const minRating = ratingOptionToMin(ratingLabel);
    const normalizedQuery = query.trim().toLowerCase();

    return contractorsList.filter((c) => {
      const matchesQuery =
        !normalizedQuery ||
        c.name.toLowerCase().includes(normalizedQuery) ||
        (c.specialties && c.specialties.toLowerCase().includes(normalizedQuery)) ||
        (c.location && c.location.toLowerCase().includes(normalizedQuery));

      const matchesCategory =
        category === "All Categories" ||
        category === "Others" ||
        c.category === category;

      const matchesLocation =
        location === "All Locations" ||
        (c.location && c.location.toLowerCase().includes(location.toLowerCase()));

      const matchesRating = (c.rating || 5.0) >= minRating;

      return matchesQuery && matchesCategory && matchesLocation && matchesRating;
    });
  }, [contractorsList, query, category, location, ratingLabel]);

  function resetFilters() {
    setQuery("");
    setCategory("All Categories");
    setLocation("All Locations");
    setRatingLabel("Any rating");
  }

  return (
    <>
      <ContractorHero
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        location={location}
        onLocationChange={setLocation}
        ratingLabel={ratingLabel}
        onRatingChange={setRatingLabel}
        resultsSectionId={RESULTS_SECTION_ID}
      />
      <TopContractors
        sectionId={RESULTS_SECTION_ID}
        subtitle="Browse highly rated and verified professionals."
        reviewsLabel="Reviews"
        contractors={filteredContractors}
        onViewAll={resetFilters}
      />
      <CategoriesAndTrust category={category} onCategoryChange={setCategory} />
      <CustomProjectBanner />
    </>
  );
}
