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

// Known fallback coordinates for Greater Accra & surroundings
const DEFAULT_COORDINATES = {
  "east-legon-hills": { lat: 5.698, lng: -0.134 },
  "oyarifa-extension": { lat: 5.750, lng: -0.170 },
  "adenta-hills": { lat: 5.715, lng: -0.160 },
  "tema-community-25": { lat: 5.720, lng: -0.010 },
  "airport-hills": { lat: 5.605, lng: -0.155 },
  "kasoa-junction": { lat: 5.534, lng: -0.420 },
  "kasoa": { lat: 5.534, lng: -0.420 },
  "east-legon": { lat: 5.645, lng: -0.155 },
  "airport-residential": { lat: 5.603, lng: -0.180 },
  "cantonments": { lat: 5.580, lng: -0.170 },
  "labone": { lat: 5.565, lng: -0.165 },
  "spintex": { lat: 5.630, lng: -0.100 },
  "osu": { lat: 5.556, lng: -0.182 },
  "pokuase": { lat: 5.685, lng: -0.285 },
  "madina": { lat: 5.670, lng: -0.165 },
  "dodowa": { lat: 5.883, lng: -0.098 },
  "aburi": { lat: 5.848, lng: -0.175 },
};

function createLandMarkerIcon(land, isSelected = false) {
  const name = land.name || land.title || "Land Plot";
  let priceLabel = land.price;
  if (!priceLabel && land.totalPrice) {
    priceLabel = `GH₵${land.totalPrice.toLocaleString()}`;
  } else if (!priceLabel && land.pricePerSqFt) {
    priceLabel = `GH₵${land.pricePerSqFt}/sq ft`;
  } else if (!priceLabel) {
    priceLabel = "Verified Plot";
  }

  const safeName = String(name)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const safePrice = String(priceLabel)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const borderCol = isSelected ? "#059669" : "#0f172a";
  const bgCol = isSelected ? "#ecfdf5" : "#ffffff";
  const titleCol = isSelected ? "#064e3b" : "#0f172a";
  const priceCol = "#059669";
  const shadow = isSelected
    ? "box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.4), 0 8px 20px rgba(0,0,0,0.35);"
    : "box-shadow: 0 4px 14px rgba(0,0,0,0.28);";

  return L.divIcon({
    className: "custom-leaflet-pin",
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%); pointer-events: auto;">
        <div style="display: flex; align-items: center; gap: 7px; background: ${bgCol}; color: ${titleCol}; padding: 5px 10px 5px 7px; border-radius: 9999px; border: 2px solid ${borderCol}; ${shadow} font-family: system-ui, -apple-system, sans-serif; white-space: nowrap; transition: all 0.15s ease;">
          <span style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: #059669; color: #ffffff; font-size: 11px; font-weight: 900; flex-shrink: 0;">📍</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="font-size: 11px; font-weight: 800; color: ${titleCol}; letter-spacing: -0.01em; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${safeName}</span>
            <span style="font-size: 10px; font-weight: 800; color: ${priceCol};">${safePrice}</span>
          </div>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${borderCol}; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -38]
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

function MapView({ validLands, defaultCenter, setSelectedLand, selectedLand, mapType = "satellite" }) {
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
        const slug = land.slug || land.id || "";
        const matchedCoords = DEFAULT_COORDINATES[slug] || DEFAULT_COORDINATES[slug.toLowerCase()] || {};
        const lat = Number(land.latitude || land.lat || matchedCoords.lat || 5.651);
        const lng = Number(land.longitude || land.lng || matchedCoords.lng || -0.162);
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
        const isSelected = selectedLand?.slug === landSlug || selectedLand?.id === land.id;

        return (
          <Marker
            key={landSlug || `${lat}-${lng}`}
            position={[lat, lng]}
            icon={createLandMarkerIcon(land, isSelected)}
            eventHandlers={{
              click: () => setSelectedLand(land),
            }}
          >
            <Popup>
              <div className="p-1 max-w-[210px]">
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
                <p className="text-xs font-extrabold text-[#059669] mt-1">{priceLabel}</p>
                {landSlug && (
                  <Link
                    to={`/explore-land/${landSlug}`}
                    className="mt-2 inline-block w-full rounded-lg bg-[#059669] px-2.5 py-1.5 text-center text-[11px] font-extrabold text-white hover:bg-[#047857] shadow-xs"
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

  const defaultCenter = [5.66, -0.16]; // Greater Accra, Ghana
  const validLands = (Array.isArray(lands) ? lands : []).filter(Boolean);

  return (
    <section id={sectionId} className="container-page pb-12">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Interactive Leaflet Map Container */}
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
                selectedLand={selectedLand}
                mapType={mapType}
              />
            </ErrorBoundary>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs text-slate-400">
              Loading interactive satellite map...
            </div>
          )}

          {/* Environmental GIS Indicator Overlay */}
          <div className="pointer-events-none absolute left-14 top-3 z-[1000] hidden sm:flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md border border-slate-200">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-extrabold text-slate-800 tracking-tight">
              Live GIS Satellite & Topographic Map
            </span>
          </div>

          {/* Layer Switcher - prominently displayed with z-[1000] */}
          <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1 rounded-xl bg-white/95 p-1.5 shadow-xl backdrop-blur-md border border-slate-200">
            <button
              type="button"
              onClick={() => setMapType("satellite")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                mapType === "satellite"
                  ? "bg-[#059669] text-white shadow-sm scale-[1.02]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span>🛰️</span>
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setMapType("topo")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                mapType === "topo"
                  ? "bg-[#059669] text-white shadow-sm scale-[1.02]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span>⛰️</span>
              <span>Topography</span>
            </button>
            <button
              type="button"
              onClick={() => setMapType("street")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                mapType === "street"
                  ? "bg-[#059669] text-white shadow-sm scale-[1.02]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span>🗺️</span>
              <span>Street</span>
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
