import { useEffect, useMemo, useState } from "react";
import LandSearchHero from "../components/sections/LandSearchHero";
import LandMapExplorer from "../components/sections/LandMapExplorer";
import LandTrustFeatures from "../components/sections/LandTrustFeatures";
import ListLandBanner from "../components/sections/ListLandBanner";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { FEATURED_LANDS, priceMatchesRange } from "../constants/lands";
import { landApi } from "../services/landApi";

const RESULTS_SECTION_ID = "land-results";

export default function ExploreLand() {
  const [landsList, setLandsList] = useState(FEATURED_LANDS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Land");
  const [region, setRegion] = useState("All Regions");
  const [priceRange, setPriceRange] = useState("Any Price");

  useEffect(() => {
    landApi
      .list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLandsList(data);
        }
      })
      .catch((err) => {
        console.warn("Using fallback lands:", err.message);
      });
  }, []);

  const filteredLands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (landsList || FEATURED_LANDS).filter((land) => {
      if (!land) return false;
      const landName = land.name || land.title || "";
      const landLocation = land.location || land.address || "";

      const matchesQuery =
        !normalizedQuery ||
        landName.toLowerCase().includes(normalizedQuery) ||
        landLocation.toLowerCase().includes(normalizedQuery);

      const matchesCategory =
        category === "All Land" || land.category === category;

      const matchesRegion =
        region === "All Regions" || (land.region && land.region.includes(region));

      const priceVal = land.priceValue || land.totalPrice || 0;
      const matchesPrice = priceMatchesRange(priceVal, priceRange);

      return matchesQuery && matchesCategory && matchesRegion && matchesPrice;
    });
  }, [landsList, query, category, region, priceRange]);

  function resetFilters() {
    setQuery("");
    setCategory("All Land");
    setRegion("All Regions");
    setPriceRange("Any Price");
  }

  return (
    <>
      <LandSearchHero
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        region={region}
        onRegionChange={setRegion}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        resultsSectionId={RESULTS_SECTION_ID}
      />
      <ErrorBoundary>
        <LandMapExplorer
          sectionId={RESULTS_SECTION_ID}
          lands={filteredLands}
          onViewAll={resetFilters}
        />
      </ErrorBoundary>
      <LandTrustFeatures />
      <ListLandBanner />
    </>
  );
}
