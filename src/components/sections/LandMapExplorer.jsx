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

const MAP_LAYERS = {
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
  topo: {
    name: "Topographic",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  street: {
    name: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

function MapView({ validLands, defaultCenter, setSelectedLand, mapType = "satellite" }) {
  const layer = MAP_LAYERS[mapType] || MAP_LAYERS.satellite;

  return (
    <MapContainer
      key={`terramatch-main-map-${mapType}`}
      center={defaultCenter}
      zoom={11}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution={layer.attribution}
        url={layer.url}
      />

      {validLands.map((land) => {
        const lat = Number(land.latitude || land.lat || 5.651);
        const lng = Number(land.longitude || land.lng || -0.162);
        const priceLabel =
          land.price ||
          (land.totalPrice ? `GH₵${land.totalPrice.toLocaleString()}` : "Price on request");
        const landName = land.name || land.title || "Land Plot";
        const landLocation = land.location || land.address || "Greater Accra";
        const rawLandImage = land.image || (land.images && land.images[0]) || "";
        const landImage =
          rawLandImage && !rawLandImage.startsWith("blob:")
            ? rawLandImage
            : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400";
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
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400";
                  }}
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
  const [mapType, setMapType] = useState("satellite");

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultCenter = [5.6037, -0.187]; // Accra, Ghana
  const validLands = (Array.isArray(lands) ? lands : []).filter(Boolean);

  return (
    <section id={sectionId} className="container-page pb-12">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Interactive Leaflet Map */}
        <div className="relative isolate z-0 aspect-[4/5] overflow-hidden rounded-2xl border border-ink-900/10 bg-slate-900 sm:aspect-[4/3] shadow-inner">
          {mounted ? (
            <ErrorBoundary
              fallback={
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 p-6 text-center text-white">
                  <span className="text-sm font-semibold">
                    Ghana Land Map (Satellite View)
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    Browsing {validLands.length} verified listings in Greater Accra
                  </p>
                </div>
              }
            >
              <MapView
                validLands={validLands}
                defaultCenter={defaultCenter}
                setSelectedLand={setSelectedLand}
                mapType={mapType}
              />
            </ErrorBoundary>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs text-slate-400">
              Loading interactive satellite map...
            </div>
          )}

          {/* Environmental GIS Indicator Overlay */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-xl bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm border border-ink-900/10">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live GIS Satellite & Topographic Map
            </span>
          </div>

          {/* Layer Switcher */}
          <div className="absolute right-3 top-3 z-10 flex rounded-lg bg-white/95 p-1 shadow-md backdrop-blur-sm border border-ink-900/10">
            <button
              type="button"
              onClick={() => setMapType("satellite")}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
                mapType === "satellite"
                  ? "bg-forest-600 text-white shadow-xs"
                  : "text-ink-600 hover:text-ink-900"
              )}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapType("topo")}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
                mapType === "topo"
                  ? "bg-forest-600 text-white shadow-xs"
                  : "text-ink-600 hover:text-ink-900"
              )}
            >
              Topography
            </button>
            <button
              type="button"
              onClick={() => setMapType("street")}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
                mapType === "street"
                  ? "bg-forest-600 text-white shadow-xs"
                  : "text-ink-600 hover:text-ink-900"
              )}
            >
              Street
            </button>
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
