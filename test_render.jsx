import React from "react";
import ReactDOMServer from "react-dom/server";
import { BrowserRouter } from "react-router-dom";
import { FEATURED_LANDS } from "./src/constants/lands.js";
import LandSearchHero from "./src/components/sections/LandSearchHero.jsx";
import LandMapExplorer from "./src/components/sections/LandMapExplorer.jsx";
import LandTrustFeatures from "./src/components/sections/LandTrustFeatures.jsx";
import ListLandBanner from "./src/components/sections/ListLandBanner.jsx";
import FeaturedLandCard from "./src/components/common/FeaturedLandCard.jsx";
import { AuctionProvider } from "./src/context/AuctionContext.jsx";

console.log("=== Testing Component Rendering Directly ===");

try {
  console.log("1. Testing FeaturedLandCard with each FEATURED_LANDS entry...");
  FEATURED_LANDS.forEach((land, idx) => {
    const html = ReactDOMServer.renderToString(
      <BrowserRouter>
        <AuctionProvider>
          <FeaturedLandCard land={land} />
        </AuctionProvider>
      </BrowserRouter>
    );
    if (!html) throw new Error("Empty html for land " + idx);
  });
  console.log("✓ All FeaturedLandCards rendered successfully!");

  console.log("2. Testing FeaturedLandCard with EMPTY or UNDEFINED props...");
  ReactDOMServer.renderToString(
    <BrowserRouter>
      <AuctionProvider>
        <FeaturedLandCard />
        <FeaturedLandCard land={null} />
        <FeaturedLandCard land={{}} />
      </AuctionProvider>
    </BrowserRouter>
  );
  console.log("✓ Empty/Undefined FeaturedLandCard passed!");

  console.log("3. Testing LandSearchHero...");
  ReactDOMServer.renderToString(
    <BrowserRouter>
      <LandSearchHero
        query=""
        onQueryChange={() => {}}
        category="All Land"
        onCategoryChange={() => {}}
        region="All Regions"
        onRegionChange={() => {}}
        priceRange="Any Price"
        onPriceRangeChange={() => {}}
        resultsSectionId="land-results"
      />
    </BrowserRouter>
  );
  console.log("✓ LandSearchHero rendered successfully!");

  console.log("4. Testing LandMapExplorer with full listings...");
  ReactDOMServer.renderToString(
    <BrowserRouter>
      <AuctionProvider>
        <LandMapExplorer lands={FEATURED_LANDS} />
      </AuctionProvider>
    </BrowserRouter>
  );
  console.log("✓ LandMapExplorer rendered successfully!");

  console.log("5. Testing LandTrustFeatures & ListLandBanner...");
  ReactDOMServer.renderToString(
    <BrowserRouter>
      <LandTrustFeatures />
      <ListLandBanner />
    </BrowserRouter>
  );
  console.log("✓ LandTrustFeatures & ListLandBanner rendered successfully!");

  console.log("\n🎉 ALL EXPLORE LAND COMPONENTS RENDER FLAWLESSLY WITH ZERO ERRORS!");
} catch (err) {
  console.error("❌ RENDER FAILED:", err);
  process.exit(1);
}
