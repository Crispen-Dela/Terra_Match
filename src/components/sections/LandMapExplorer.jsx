import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import FeaturedLandCard from "../common/FeaturedLandCard";
import ErrorBoundary from "../common/ErrorBoundary";
import { cn } from "../../utils/cn";

// Leaflet
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createPriceIcon(price) {
  return L.divIcon({
    className: "custom-leaflet-pin",
    html: `
      <div style="background: #112a20; color: #fff; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 1.5px solid #2d6a4f; text-align: center; transform: translate(-50%, -100%);">
        ${price}
        <div style="position: absolute; left: 50%; top: 100%; width: 0; height: 0; transform: translateX(-50%); border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #112a20;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapView({ validLands, defaultCenter, setSelectedLand }) {
  return (
    <MapContainer
      key="terramatch-main-map-container"
      center={defaultCenter}
      zoom={11}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {validLands.map((land) => {
        const lat = Number(land.latitude || land.lat || 5.651);
        const lng = Number(land.longitude || land.lng || -0.162);
        const priceLabel =
          land.price ||
          (land.totalPrice ? `GH₵${land.totalPrice.toLocaleString()}` : "Price on request");
        const landName = land.name || land.title || "Land Plot";
        const landLocation = land.location || land.address || "Greater Accra";
        const landImage =
          land.image ||
          (land.images && land.images[0]) ||
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400";
        const landSlug = land.slug || land.id || "";

        return (
          <Marker
            key={landSlug || `${lat}-${lng}`}
            position={[lat, lng]}
            icon={createPriceIcon(priceLabel)}
            eventHandlers={{
              click: () => setSelectedLand(land),
            }}
          >
            <Popup>
              <div className="p-1 max-w-[200px]">
                <img
                  src={landImage}
                  alt={landName}
                  className="h-24 w-full rounded-md object-cover mb-2"
                />
                <h4 className="font-bold text-xs text-ink-900">{landName}</h4>
                <p className="text-[11px] text-ink-500">{landLocation}</p>
                <p className="text-xs font-bold text-forest-700 mt-1">{priceLabel}</p>
                {landSlug && (
                  <Link
                    to={`/explore-land/${landSlug}`}
                    className="mt-2 inline-block w-full rounded bg-forest-600 px-2 py-1 text-center text-[10px] font-bold text-white hover:bg-forest-700"
                  >
                    View Listing
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default function LandMapExplorer({ lands = [], onViewAll, sectionId }) {
  const [selectedLand, setSelectedLand] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultCenter = [5.6037, -0.187]; // Accra, Ghana
  const validLands = (Array.isArray(lands) ? lands : []).filter(Boolean);

  return (
    <section id={sectionId} className="container-page pb-12">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Interactive Leaflet Map */}
        <div className="relative isolate z-0 aspect-[4/5] overflow-hidden rounded-2xl border border-ink-900/10 bg-slate-100 sm:aspect-[4/3] shadow-inner">
          {mounted ? (
            <ErrorBoundary
              fallback={
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-6 text-center">
                  <span className="text-sm font-semibold text-ink-800">
                    Ghana Land Map (Satellite View)
                  </span>
                  <p className="mt-1 text-xs text-ink-500">
                    Browsing {validLands.length} verified listings in Greater Accra
                  </p>
                </div>
              }
            >
              <MapView
                validLands={validLands}
                defaultCenter={defaultCenter}
                setSelectedLand={setSelectedLand}
              />
            </ErrorBoundary>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-500">
              Loading interactive map...
            </div>
          )}

          {/* Environmental GIS Indicator Overlay */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-xl bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live GIS Satellite & Topographic Map
            </span>
          </div>
        </div>

        {/* Listings Grid / Right Column */}
        <div className="flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">
              Available Land Plots ({validLands.length})
            </h3>
            {onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs font-semibold text-forest-600 hover:text-forest-700"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {validLands.map((land, idx) => (
              <div
                key={land?.slug || land?.id || idx}
                className={cn(
                  "cursor-pointer transition-transform hover:scale-[1.01]",
                  selectedLand?.slug && selectedLand?.slug === land?.slug && "ring-2 ring-forest-600 rounded-2xl"
                )}
                onClick={() => setSelectedLand(land)}
              >
                <FeaturedLandCard land={land} />
              </div>
            ))}

            {validLands.length === 0 && (
              <div className="rounded-2xl border border-ink-900/10 bg-white p-8 text-center">
                <p className="text-sm text-ink-500">
                  No listings found matching your search criteria.
                </p>
                {onViewAll && (
                  <Button
                    variant="outline-dark"
                    size="sm"
                    onClick={onViewAll}
                    className="mt-4"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
