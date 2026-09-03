import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import SoldBadge from "../common/SoldBadge";
import BuyNowModal from "../common/BuyNowModal";
import { unsplashUrl, LAND_PHOTO_IDS, CONTRACTOR_PHOTO_IDS } from "../../constants/stockImages";
import { FEATURED_LANDS } from "../../constants/lands";
import { landApi } from "../../services/landApi";
import { useAuction } from "../../context/AuctionContext";
import { cn } from "../../utils/cn";

function BiddingListingCard({ land }) {
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const { isSold, isExpired } = useAuction();

  const name = land.name || land.title || "Land Listing";
  const location = land.location || land.address || "Greater Accra, Ghana";
  const price = land.price || (land.totalPrice ? `GH₵${land.totalPrice.toLocaleString()}` : "Price on request");
  const bids = land.bids ?? land.bidsCount ?? 0;
  const image = land.image || (land.images && land.images[0]) || unsplashUrl(LAND_PHOTO_IDS.greenCoveredLand);
  const slug = land.slug || land.id || "";

  const sold = slug && isSold ? isSold(slug) : false;
  const expired = slug && isExpired ? (!sold && isExpired(slug)) : false;

  return (
    <div className="overflow-hidden rounded-xl border border-ink-900/5 bg-white shadow-card flex flex-col justify-between">
      <div>
        <div className="relative">
          {/* Exact image matched with Explore Land page */}
          <img
            src={image}
            alt={name}
            loading="lazy"
            className={cn("aspect-[16/9] w-full bg-mist-100 object-cover", (sold || expired) && "opacity-70")}
          />
          {sold && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-900/40">
              <SoldBadge />
            </div>
          )}
          {expired && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-900/40">
              <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">Expired</span>
            </div>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="font-semibold text-ink-900 truncate">{name}</h3>
          <p className="text-sm text-ink-500 truncate">{location}</p>
          <p className="mt-1.5 text-sm font-bold text-ink-900">{price}</p>
        </div>
      </div>

      <div className="p-3.5 pt-0">
        <div className="flex items-center justify-between gap-2 border-t border-ink-900/5 pt-2.5">
          <span className="text-xs text-ink-500 font-medium">
            {sold ? "Sold" : expired ? "Expired" : `${bids} Bids`}
          </span>
          <div className="flex shrink-0 gap-1.5">
            {!sold && !expired && land.buyNowPrice && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="px-3 py-1.5 text-xs"
                onClick={() => setBuyNowOpen(true)}
              >
                Buy Now
              </Button>
            )}
            <Button
              as={Link}
              to={slug ? `/explore-land/${slug}` : "/explore-land"}
              variant="outline-dark"
              size="sm"
              className="px-3 py-1.5 text-xs"
            >
              {sold || expired ? "View Details" : "Place Bid"}
            </Button>
          </div>
        </div>
      </div>

      {land.buyNowPrice && !sold && !expired && (
        <BuyNowModal open={buyNowOpen} onClose={() => setBuyNowOpen(false)} land={land} />
      )}
    </div>
  );
}

export default function LandBiddingPreview() {
  const [view, setView] = useState("map");
  const [landsList, setLandsList] = useState(FEATURED_LANDS);

  // Fetch real backend land listings if available, matching Explore Land
  useEffect(() => {
    landApi
      .list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLandsList(data);
        }
      })
      .catch((err) => {
        console.warn("Using featured lands for bidding preview:", err.message);
      });
  }, []);

  const displayedLands = landsList.slice(0, 4);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-page">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            Explore Land and Start Bidding
          </h2>
          <div className="flex rounded-lg bg-mist-100 p-1">
            <button
              type="button"
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
                view === "map"
                  ? "bg-forest-100 text-forest-700"
                  : "text-ink-700 hover:text-ink-900"
              )}
            >
              Map View
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
                view === "list"
                  ? "bg-forest-100 text-forest-700"
                  : "text-ink-700 hover:text-ink-900"
              )}
            >
              List View
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Real aerial map photo for land bidding preview */}
          <div
            className={cn(
              "aspect-[4/3] w-full overflow-hidden rounded-2xl lg:aspect-auto lg:min-h-[420px]",
              view === "list" && "hidden lg:block"
            )}
          >
            <img 
              src={unsplashUrl(CONTRACTOR_PHOTO_IDS.mapAerial, { w: 1200 })} 
              alt="Interactive Land Map" 
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {displayedLands.map((land) => (
              <BiddingListingCard key={land.slug || land.id} land={land} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
