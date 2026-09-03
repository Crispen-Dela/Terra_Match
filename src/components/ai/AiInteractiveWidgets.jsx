import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calculator,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  FileCheck2,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// ==========================================
// 1. GHANA CONSTRUCTION COST ESTIMATOR WIDGET
// ==========================================
export function CostEstimatorWidget({ initialValues = {}, onApplyToChat }) {
  const navigate = useNavigate();
  const [bedrooms, setBedrooms] = useState(initialValues.bedrooms || 3);
  const [areaSqm, setAreaSqm] = useState(initialValues.areaSqm || 160);
  const [qualityTier, setQualityTier] = useState(initialValues.qualityTier || "standard"); // economy, standard, luxury
  const [region, setRegion] = useState(initialValues.region || "Greater Accra");
  const [storeys, setStoreys] = useState(initialValues.storeys || 1);
  const [copied, setCopied] = useState(false);

  // Region cost multiplier (Accra is baseline 1.0, Kumasi 0.92, Northern 0.85, Western/Takoradi 0.96)
  const regionMultiplier = useMemo(() => {
    switch (region) {
      case "Greater Accra":
        return 1.0;
      case "Ashanti Region":
        return 0.92;
      case "Western Region":
        return 0.96;
      case "Central Region":
        return 0.9;
      case "Eastern Region":
        return 0.93;
      case "Northern Region":
        return 0.85;
      default:
        return 1.0;
    }
  }, [region]);

  // Base rate per sqm in GHS (2025/2026 Ghana construction index)
  const baseRate = useMemo(() => {
    switch (qualityTier) {
      case "economy":
        return 1850; // Sandcrete blockwork, corrugated aluminum roofing, ceramic tiles
      case "standard":
        return 2650; // High-tensile steel, Aluzinc shingles, porcelain tiles, POP ceiling
      case "luxury":
        return 3950; // Concrete framing, acoustic POP, imported Spanish tiles, smart automation, solar
      default:
        return 2650;
    }
  }, [qualityTier]);

  const storeyMultiplier = storeys > 1 ? 1.0 + (storeys - 1) * 0.18 : 1.0; // Multi-storey requires reinforced beams/decking

  // Calculated totals
  const totalCost = Math.round(areaSqm * baseRate * regionMultiplier * storeyMultiplier);
  const carcassCost = Math.round(totalCost * 0.48); // Foundation, blockwork, lintels, concrete slab, roofing carcass
  const roofingCost = Math.round(totalCost * 0.14); // Roofing sheets/shingles, trusses, gutters
  const finishesCost = Math.round(totalCost * 0.22); // POP ceilings, wall plastering, painting, porcelain floor tiling
  const servicesCost = Math.round(totalCost * 0.12); // Electrical piping, wiring, fixtures, plumbing, water storage
  const permitsContingency = Math.round(totalCost * 0.04); // MMDA building permit & 5% site contingency

  // Material estimates
  const cementBags = Math.round(areaSqm * (storeys > 1 ? 7.2 : 5.5));
  const sandTrips = Math.round(areaSqm * 0.25);
  const stonesTrips = Math.round(areaSqm * 0.2);
  const steelTons = (areaSqm * (storeys > 1 ? 0.045 : 0.025)).toFixed(1);

  const handleCopySummary = () => {
    const text = `Ghana Construction Cost Estimate (${qualityTier.toUpperCase()} Quality):
Region: ${region}
Size: ${areaSqm} m² (${bedrooms} Bedrooms, ${storeys} Storey)
Total Estimated Budget: GHS ${totalCost.toLocaleString()}
- Structural Carcass & Foundation: GHS ${carcassCost.toLocaleString()}
- Roofing System: GHS ${roofingCost.toLocaleString()}
- Finishing & Tiling: GHS ${finishesCost.toLocaleString()}
- Plumbing & Electrical: GHS ${servicesCost.toLocaleString()}
- Permits & Approvals: GHS ${permitsContingency.toLocaleString()}
Key Materials: ~${cementBags} Cement Bags, ~${steelTons} Tons High-Tensile Steel, ~${sandTrips} trips sand.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostProject = () => {
    navigate("/post-a-project", {
      state: {
        prefill: {
          title: `${bedrooms}-Bedroom ${qualityTier.charAt(0).toUpperCase() + qualityTier.slice(1)} Residential Building`,
          category: "Building & Construction",
          location: region,
          budgetRange:
            totalCost > 300000
              ? "Above GHS 300,000"
              : totalCost > 150000
              ? "GHS 150,000 – 300,000"
              : "GHS 75,000 – 150,000",
          description: `Construction of ${bedrooms}-bedroom (${areaSqm} m², ${storeys} storey) home in ${region}. Estimated budget GHS ${totalCost.toLocaleString()}.`,
        },
      },
    });
  };

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-4 sm:p-5 shadow-sm text-slate-800 my-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#059669] text-white shadow-xs">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Ghana Construction Cost Estimator
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Live 2026 Model
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Interactive structural and material estimation for residential builds
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopySummary}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          title="Copy breakdown"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Quality Standard */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Finish Quality & Materials
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-center">
            {[
              { id: "economy", label: "Economy", desc: "~1.8k/m²" },
              { id: "standard", label: "Standard", desc: "~2.6k/m²" },
              { id: "luxury", label: "Luxury", desc: "~3.9k/m²" },
            ].map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setQualityTier(tier.id)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                  qualityTier === tier.id
                    ? "bg-white text-[#059669] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <div>{tier.label}</div>
                <div className="text-[9px] font-normal text-slate-400">{tier.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Region Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Project Location / Region
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#059669] focus:outline-none"
          >
            <option value="Greater Accra">Greater Accra (Accra, Tema, East Legon)</option>
            <option value="Ashanti Region">Ashanti Region (Kumasi, Ahodwo)</option>
            <option value="Eastern Region">Eastern Region (Aburi, Koforidua)</option>
            <option value="Central Region">Central Region (Kasoa, Cape Coast)</option>
            <option value="Western Region">Western Region (Takoradi, Tarkwa)</option>
            <option value="Northern Region">Northern Region (Tamale)</option>
          </select>
        </div>

        {/* Area Slider */}
        <div>
          <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
            <span>Floor Area (m²)</span>
            <span className="text-[#059669]">{areaSqm} m² (~{(areaSqm * 10.764).toFixed(0)} sq ft)</span>
          </div>
          <input
            type="range"
            min={60}
            max={500}
            step={10}
            value={areaSqm}
            onChange={(e) => setAreaSqm(Number(e.target.value))}
            className="w-full accent-[#059669] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>60 m² (2-Bed)</span>
            <span>200 m² (4-Bed)</span>
            <span>500 m² (Mansion)</span>
          </div>
        </div>

        {/* Bedrooms & Storeys */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Bedrooms</label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
                className="px-3 py-1.5 text-slate-500 font-bold hover:bg-slate-100 rounded-l-xl text-xs"
              >
                -
              </button>
              <span className="flex-1 text-center font-extrabold text-xs text-slate-800">
                {bedrooms} Bed
              </span>
              <button
                type="button"
                onClick={() => setBedrooms(Math.min(8, bedrooms + 1))}
                className="px-3 py-1.5 text-slate-500 font-bold hover:bg-slate-100 rounded-r-xl text-xs"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Storeys</label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setStoreys(Math.max(1, storeys - 1))}
                className="px-3 py-1.5 text-slate-500 font-bold hover:bg-slate-100 rounded-l-xl text-xs"
              >
                -
              </button>
              <span className="flex-1 text-center font-extrabold text-xs text-slate-800">
                {storeys === 1 ? "1 Storey (Ground)" : `${storeys} Storeys`}
              </span>
              <button
                type="button"
                onClick={() => setStoreys(Math.min(4, storeys + 1))}
                className="px-3 py-1.5 text-slate-500 font-bold hover:bg-slate-100 rounded-r-xl text-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Results Card */}
      <div className="rounded-xl border border-emerald-300/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Estimated Construction Cost
            </span>
            <div className="text-2xl font-black text-emerald-800 tracking-tight">
              GHS {totalCost.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              ~GHS {Math.round(totalCost / areaSqm).toLocaleString()}/m²
            </span>
            <button
              type="button"
              onClick={handlePostProject}
              className="flex items-center gap-1.5 rounded-xl bg-[#059669] px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#047857] transition"
            >
              <span>Post This Project</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Cost Breakdown Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
            <span>Cost Allocation Breakdown</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div style={{ width: "48%" }} className="bg-emerald-600" title="Carcass & Foundation 48%" />
            <div style={{ width: "14%" }} className="bg-teal-500" title="Roofing 14%" />
            <div style={{ width: "22%" }} className="bg-amber-500" title="Finishing & Tiling 22%" />
            <div style={{ width: "12%" }} className="bg-sky-500" title="Plumbing & Electrical 12%" />
            <div style={{ width: "4%" }} className="bg-indigo-500" title="Permits & Contingency 4%" />
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg bg-emerald-50/60 p-2 border border-emerald-100">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-600" /> Carcass & Foundation
              </div>
              <p className="font-extrabold text-slate-900 mt-0.5">GHS {carcassCost.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-teal-50/60 p-2 border border-teal-100">
              <div className="flex items-center gap-1 text-[10px] font-bold text-teal-800">
                <span className="h-2 w-2 rounded-full bg-teal-500" /> Roofing System
              </div>
              <p className="font-extrabold text-slate-900 mt-0.5">GHS {roofingCost.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-amber-50/60 p-2 border border-amber-100">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Finishes & POP
              </div>
              <p className="font-extrabold text-slate-900 mt-0.5">GHS {finishesCost.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-sky-50/60 p-2 border border-sky-100">
              <div className="flex items-center gap-1 text-[10px] font-bold text-sky-800">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Services & Permits
              </div>
              <p className="font-extrabold text-slate-900 mt-0.5">
                GHS {(servicesCost + permitsContingency).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Bill of Quantities Mini Estimates */}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
            <span className="font-bold text-slate-800">Key Material Estimates:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
              🧱 ~{cementBags} Cement Bags
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
              🔩 ~{steelTons} Tons High-Tensile Steel
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
              🚚 ~{sandTrips} Trips Sand
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
              🪨 ~{stonesTrips} Trips Stones
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. LAND DUE DILIGENCE CHECKLIST WIDGET
// ==========================================
export function LandDueDiligenceWidget({ onAskStep }) {
  const [checkedItems, setCheckedItems] = useState([0]); // First step checked by default
  const [copied, setCopied] = useState(false);

  const steps = [
    {
      id: 0,
      title: "1. Official Lands Commission Search",
      desc: "Apply for a certified official search covering Public and Vested Lands (PVLMD) and Land Registration (LRD) to verify existing title holders and encumbrances.",
      authority: "Lands Commission of Ghana",
      riskLevel: "CRITICAL",
    },
    {
      id: 1,
      title: "2. Cadastral Boundary GPS Verification",
      desc: "Hire a licensed Cadastral Surveyor with RTK GPS to pick actual beacon coordinates on-site and confirm they match the registered site plan.",
      authority: "Licensed Surveyors Association (GhIS)",
      riskLevel: "CRITICAL",
    },
    {
      id: 2,
      title: "3. Allodial & Chieftaincy Lineage Verification",
      desc: "Confirm whether the land is Stool, Skin, Family, or Freehold. Verify that the current Chief / Family Head is gazetted and recognized by the Traditional Council.",
      authority: "Traditional Council & Chieftaincy Secretariat",
      riskLevel: "HIGH",
    },
    {
      id: 3,
      title: "4. MMDA Planning Scheme & Zoning Approval",
      desc: "Check with the District/Municipal Assembly (MMDA) Town & Country Planning dept. Ensure the land isn't designated for roads, waterways, or public utilities.",
      authority: "District / Municipal Assembly",
      riskLevel: "HIGH",
    },
    {
      id: 4,
      title: "5. Execution of Indenture & Land Title Registration",
      desc: "Sign a tripartite Indenture with certified witnesses, stamp at the Lands Commission, and apply for your Land Title Certificate under the Land Act 2020.",
      authority: "High Court Registry & Lands Commission",
      riskLevel: "STANDARD",
    },
  ];

  const toggleStep = (idx) => {
    setCheckedItems((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const progressPercent = Math.round((checkedItems.length / steps.length) * 100);

  const handleCopy = () => {
    const text = `Ghana Land Due Diligence Checklist (${progressPercent}% Complete):\n` +
      steps
        .map((s, idx) => `[${checkedItems.includes(idx) ? "X" : " "}] ${s.title}\n   Authority: ${s.authority}\n   Details: ${s.desc}`)
        .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5 shadow-sm text-slate-800 my-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#059669] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Interactive Land Due Diligence Checklist
            </h4>
            <p className="text-[11px] text-slate-500">
              Track legal, physical, and administrative verification stages under Ghana Land Act 2020
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
          <span className="text-slate-800">Verification Readiness</span>
          <span className="text-[#059669] font-black">{progressPercent}% Completed</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-[#059669] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5">
          {progressPercent === 100
            ? "🎉 All stages completed! Your land transaction has achieved maximum legal safety."
            : `${steps.length - checkedItems.length} essential verification stages remaining before payment.`}
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-2.5">
        {steps.map((s, idx) => {
          const isDone = checkedItems.includes(idx);
          return (
            <div
              key={s.id}
              onClick={() => toggleStep(idx)}
              className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                isDone
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-[#059669]" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className={`text-xs font-bold ${isDone ? "text-emerald-950 line-through opacity-80" : "text-slate-900"}`}>
                    {s.title}
                  </h5>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                      s.riskLevel === "CRITICAL"
                        ? "bg-red-100 text-red-700"
                        : s.riskLevel === "HIGH"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {s.riskLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-semibold">Authority: {s.authority}</span>
                  {onAskStep && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskStep(`Tell me how to complete: ${s.title}`);
                      }}
                      className="text-[#059669] font-bold hover:underline"
                    >
                      Ask AI How →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 3. INTERACTIVE SOIL & FLOOD RISK GAUGE
// ==========================================
export function SoilFloodRiskWidget({ initialRegion = "Greater Accra", onSelectDistrict }) {
  const [selectedLoc, setSelectedLoc] = useState(initialRegion);

  const GHANA_LOCATIONS = {
    "East Legon Hills": {
      region: "Greater Accra",
      elevation: 88,
      floodRisk: "LOW",
      terrain: "Elevated Plateau",
      soilType: "Cohesive Red Laterite",
      waterTable: "7.5m",
      foundation: "Standard Strip / Pad Footing",
      drainage: "Good natural runoff",
      ratingScore: 92,
    },
    "Haatso & Atomic": {
      region: "Greater Accra",
      elevation: 74,
      floodRisk: "LOW",
      terrain: "Gentle Slope",
      soilType: "Firm Sandy Clay",
      waterTable: "6.2m",
      foundation: "Strip Footing with DPC",
      drainage: "Good",
      ratingScore: 88,
    },
    "Alajo / Circle Basin": {
      region: "Greater Accra",
      elevation: 9,
      floodRisk: "HIGH",
      terrain: "Lowland Floodplain",
      soilType: "Alluvial Clay & Silt",
      waterTable: "1.5m",
      foundation: "Reinforced Raft / Short Piles",
      drainage: "Requires French Drains & Culverts",
      ratingScore: 42,
    },
    "Weija & SCC Basin": {
      region: "Greater Accra",
      elevation: 14,
      floodRisk: "HIGH",
      terrain: "Depression / Lagoon Plain",
      soilType: "Expansive Clay (Black Cotton)",
      waterTable: "1.8m",
      foundation: "Engineered Raft Slab",
      drainage: "High risk near dam overflow",
      ratingScore: 48,
    },
    "Aburi Ridge & Peduase": {
      region: "Eastern Region",
      elevation: 410,
      floodRisk: "VERY_LOW",
      terrain: "Steep Rocky Ridge",
      soilType: "Quartzite & Solid Bedrock",
      waterTable: "14.0m",
      foundation: "Stepped Foundation / Retaining Walls",
      drainage: "Excellent natural gravity flow",
      ratingScore: 96,
    },
    "Kumasi Ahodwo / Nhyiaeso": {
      region: "Ashanti Region",
      elevation: 260,
      floodRisk: "LOW",
      terrain: "Rolling High Ground",
      soilType: "Forest Ochrosol (High Bearing)",
      waterTable: "6.8m",
      foundation: "Standard Reinforced Footing",
      drainage: "Optimal",
      ratingScore: 90,
    },
  };

  const currentData = GHANA_LOCATIONS[selectedLoc] || GHANA_LOCATIONS["East Legon Hills"];

  const getRiskColor = (risk) => {
    switch (risk) {
      case "VERY_LOW":
      case "LOW":
        return { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" };
      case "MODERATE":
        return { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" };
      case "HIGH":
      case "VERY_HIGH":
        return { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" };
      default:
        return { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" };
    }
  };

  const riskBadge = getRiskColor(currentData.floodRisk);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm text-slate-800 my-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#059669] text-white">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Soil & Flood Risk Geo-Inspector
            </h4>
            <p className="text-[11px] text-slate-500">
              Real-time topographic elevations, flood vulnerability & foundation recommendations
            </p>
          </div>
        </div>
      </div>

      {/* District Pill Bar */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.keys(GHANA_LOCATIONS).map((locKey) => (
          <button
            key={locKey}
            type="button"
            onClick={() => {
              setSelectedLoc(locKey);
              if (onSelectDistrict) onSelectDistrict(locKey);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedLoc === locKey
                ? "bg-[#059669] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {locKey}
          </button>
        ))}
      </div>

      {/* Selected Location Card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
          <div>
            <h5 className="text-sm font-extrabold text-slate-900">{selectedLoc}</h5>
            <span className="text-xs text-slate-500">{currentData.region}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${riskBadge.bg} ${riskBadge.text}`}>
              Flood Risk: {currentData.floodRisk.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Elevation</span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">{currentData.elevation} meters</p>
          </div>

          <div className="rounded-lg bg-white p-2.5 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Water Table Depth</span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">{currentData.waterTable}</p>
          </div>

          <div className="rounded-lg bg-white p-2.5 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Terrain Topography</span>
            <p className="font-bold text-slate-900 mt-0.5 truncate">{currentData.terrain}</p>
          </div>

          <div className="rounded-lg bg-white p-2.5 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Drainage Status</span>
            <p className="font-bold text-slate-900 mt-0.5 truncate">{currentData.drainage}</p>
          </div>
        </div>

        {/* Foundation & Soil Advice */}
        <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-2 text-xs">
          <Sparkles className="h-4 w-4 text-[#059669] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-950">Foundation Recommendation: </span>
            <span className="text-emerald-900 font-semibold">{currentData.foundation}</span>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Soil Type: {currentData.soilType}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. INTERACTIVE LIVE PROJECT BRIEF WIDGET
// ==========================================
export function ProjectBriefWidget({ brief = {}, onUpdateBrief }) {
  const navigate = useNavigate();

  const handleLaunchProject = () => {
    navigate("/post-a-project", {
      state: { prefill: brief },
    });
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-900 to-[#033629] text-white p-4 sm:p-5 shadow-md my-3">
      <div className="flex items-center justify-between border-b border-emerald-700/50 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Live Extracted Project Brief
            </h4>
            <p className="text-sm font-extrabold text-white">
              {brief.title || "Ghana Construction Project"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
          Ready to Post
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
        <div className="rounded-xl bg-emerald-950/60 p-2.5 border border-emerald-700/40">
          <span className="text-[10px] text-emerald-300/70 font-semibold">Category</span>
          <p className="font-bold text-white mt-0.5 truncate">{brief.category || "Building & Construction"}</p>
        </div>
        <div className="rounded-xl bg-emerald-950/60 p-2.5 border border-emerald-700/40">
          <span className="text-[10px] text-emerald-300/70 font-semibold">Location</span>
          <p className="font-bold text-white mt-0.5 truncate">{brief.location || "Greater Accra"}</p>
        </div>
        <div className="rounded-xl bg-emerald-950/60 p-2.5 border border-emerald-700/40">
          <span className="text-[10px] text-emerald-300/70 font-semibold">Budget Tier</span>
          <p className="font-bold text-white mt-0.5 truncate">{brief.budgetRange || "GHS 150k - 300k"}</p>
        </div>
        <div className="rounded-xl bg-emerald-950/60 p-2.5 border border-emerald-700/40">
          <span className="text-[10px] text-emerald-300/70 font-semibold">Timeline</span>
          <p className="font-bold text-white mt-0.5 truncate">{brief.timeline || "1 – 3 months"}</p>
        </div>
      </div>

      {brief.description && (
        <p className="text-xs text-emerald-100/80 mb-3 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40 line-clamp-2">
          {brief.description}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={handleLaunchProject}
          className="flex items-center gap-1.5 rounded-xl bg-[#059669] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#047857] transition"
        >
          <span>Launch & Receive Contractor Quotes</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
