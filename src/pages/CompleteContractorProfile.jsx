import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { contractorApi } from "../services/contractorApi";
import { uploadApi } from "../services/authApi";
import { cn } from "../utils/cn";

// Icons
function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-current", className)} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AlertCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-current", className)} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4 6.5h16M9 6.5V4.8a1 1 0 011-1h4a1 1 0 011 1v1.7M6.5 6.5l.7 12.3a1.5 1.5 0 001.5 1.4h6.6a1.5 1.5 0 001.5-1.4l.7-12.3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadCloudIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path
        d="M7 18a4.5 4.5 0 01-1-8.9A5.5 5.5 0 0116.9 8H17a4 4 0 011 7.87"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12v7m0-7l-2.5 2.5M12 12l2.5 2.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TRADE_CATEGORIES = [
  "Building & Construction",
  "Civil & Structural Engineering",
  "Electrical Engineering & Solar",
  "Plumbing & Piping Works",
  "Roofing & Carpentry",
  "Interior Design & Finishing",
  "Painting & Plastering",
  "Welding & Steel Fabrication",
  "Landscaping & Paving",
  "General Contractor",
];

export default function CompleteContractorProfile() {
  const { user, isAuthed, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile fields
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("Building & Construction");
  const [specialties, setSpecialties] = useState("");
  const [location, setLocation] = useState("Accra, Greater Accra");
  const [yearsExperience, setYearsExperience] = useState(3);
  const [licenseType, setLicenseType] = useState("D1K1 General Building");
  const [serviceAreas, setServiceAreas] = useState("Greater Accra, Central Region");
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState([]);

  // Project modal / inline editor state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectImages, setProjectImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [projectError, setProjectError] = useState("");

  const fileInputRef = useRef(null);

  // Load existing profile
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthed) {
      navigate("/login");
      return;
    }

    setLoading(true);
    contractorApi
      .getMyProfile()
      .then((data) => {
        if (data) {
          setCompanyName(data.name || data.companyName || user?.name || "");
          setCategory(data.category || "Building & Construction");
          setSpecialties(data.specialties || "");
          setLocation(data.location || "Accra, Greater Accra");
          setYearsExperience(data.yearsExperience || 3);
          setLicenseType(data.licenseType || "D1K1 General Building");
          setServiceAreas(
            Array.isArray(data.serviceAreas)
              ? data.serviceAreas.join(", ")
              : data.serviceAreas || "Greater Accra"
          );
          setBio(data.bio || "");
          setPortfolio(Array.isArray(data.portfolio) ? data.portfolio : []);
        }
      })
      .catch((err) => {
        console.error("Error loading contractor profile:", err);
        setError("Failed to load contractor profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthed, authLoading, user, navigate]);

  // Validation checks
  const isBioComplete = Boolean(bio && bio.trim().length >= 15);
  const isPortfolioComplete =
    portfolio.length >= 1 &&
    portfolio.some(
      (p) =>
        p.title &&
        p.title.trim() &&
        p.description &&
        p.description.trim() &&
        Array.isArray(p.images) &&
        p.images.length >= 1 &&
        p.images.length <= 8
    );
  const isOverallComplete = isBioComplete && isPortfolioComplete;

  // Multi-image upload handler with strict <= 8 pictures rule
  async function handleImageFiles(fileList) {
    setProjectError("");
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) return;

    const remainingSlots = 8 - projectImages.length;
    if (remainingSlots <= 0) {
      setProjectError("Maximum of 8 pictures reached. You cannot add more pictures to this project.");
      return;
    }

    if (incoming.length > remainingSlots) {
      setProjectError(`Only ${remainingSlots} more picture(s) allowed. Max 8 pictures per project.`);
    }

    const filesToUpload = incoming.slice(0, remainingSlots);

    try {
      setUploadingImage(true);
      const uploadedUrls = [];

      for (const file of filesToUpload) {
        try {
          const res = await uploadApi.uploadFile(file);
          if (res?.url) {
            uploadedUrls.push(res.url);
          }
        } catch {
          // Fallback to client data URL if upload service is offline
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(dataUrl);
        }
      }

      setProjectImages((prev) => [...prev, ...uploadedUrls].slice(0, 8));
    } catch (err) {
      setProjectError(err.message || "Failed to upload images.");
    } finally {
      setUploadingImage(false);
    }
  }

  function handleRemoveProjectImage(indexToRemove) {
    setProjectImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setProjectError("");
  }

  function handleOpenNewProject() {
    setEditingProjectId(null);
    setProjectTitle("");
    setProjectDescription("");
    setProjectImages([]);
    setProjectError("");
    setShowProjectModal(true);
  }

  function handleOpenEditProject(proj) {
    setEditingProjectId(proj.id);
    setProjectTitle(proj.title || "");
    setProjectDescription(proj.description || "");
    let imgs = [];
    if (Array.isArray(proj.images)) imgs = proj.images.filter(Boolean);
    else if (proj.image) imgs = [proj.image];
    setProjectImages(imgs.slice(0, 8));
    setProjectError("");
    setShowProjectModal(true);
  }

  function handleSaveProject(e) {
    e.preventDefault();
    setProjectError("");

    const titleTrimmed = projectTitle.trim();
    const descTrimmed = projectDescription.trim();

    if (!titleTrimmed) {
      setProjectError("Please enter the Project Worked On (title).");
      return;
    }
    if (!descTrimmed) {
      setProjectError("Please enter a detailed Project Description.");
      return;
    }
    if (projectImages.length === 0) {
      setProjectError("Please upload at least 1 project picture (max 8).");
      return;
    }
    if (projectImages.length > 8) {
      setProjectError("A maximum of 8 pictures is allowed per project.");
      return;
    }

    if (editingProjectId) {
      // Update existing project
      setPortfolio((prev) =>
        prev.map((p) =>
          p.id === editingProjectId
            ? {
                ...p,
                title: titleTrimmed,
                description: descTrimmed,
                images: projectImages.slice(0, 8),
                image: projectImages[0] || null,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
    } else {
      // Add new project
      const newProj = {
        id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: titleTrimmed,
        description: descTrimmed,
        images: projectImages.slice(0, 8),
        image: projectImages[0] || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPortfolio((prev) => [newProj, ...prev]);
    }

    setShowProjectModal(false);
    setEditingProjectId(null);
    setProjectTitle("");
    setProjectDescription("");
    setProjectImages([]);
  }

  function handleDeleteProject(projectId) {
    if (window.confirm("Are you sure you want to delete this project from your portfolio?")) {
      setPortfolio((prev) => prev.filter((p) => p.id !== projectId));
    }
  }

  async function handleSubmitProfile(andNavigateTo = "dashboard") {
    setError("");
    setSuccess("");

    if (!bio.trim() || bio.trim().length < 15) {
      setError("Please provide a professional bio with at least 15 characters.");
      window.scrollTo({ top: 300, behavior: "smooth" });
      return;
    }

    if (portfolio.length === 0) {
      setError("Please add at least 1 completed project to your portfolio before completing your profile.");
      window.scrollTo({ top: 600, behavior: "smooth" });
      return;
    }

    // Verify all projects have <= 8 pictures
    for (const p of portfolio) {
      const count = Array.isArray(p.images) ? p.images.length : (p.image ? 1 : 0);
      if (count > 8) {
        setError(`Project "${p.title}" exceeds the maximum limit of 8 pictures.`);
        return;
      }
    }

    try {
      setSaving(true);
      const parsedServiceAreas = serviceAreas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        companyName: companyName.trim() || user?.name,
        category,
        specialties: specialties.trim(),
        bio: bio.trim(),
        location: location.trim(),
        yearsExperience: parseInt(yearsExperience) || 1,
        licenseType: licenseType.trim(),
        serviceAreas: parsedServiceAreas.length > 0 ? parsedServiceAreas : ["Greater Accra"],
        portfolio,
      };

      const updated = await contractorApi.updateMyProfile(payload);

      setSuccess("Your contractor profile and work portfolio have been saved successfully!");
      setTimeout(() => {
        if (andNavigateTo === "public") {
          navigate(`/find-contractor/${user?.id || updated?.id || ""}`);
        } else {
          navigate("/dashboard");
        }
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save contractor profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-mist-50">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-forest-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-mist-50/70 py-8 sm:py-12">
      <div className="container-page max-w-4xl">
        {/* Page Header */}
        <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-100 px-3 py-1 text-xs font-bold text-forest-800">
                Licensed Contractor Onboarding
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-ink-900 sm:text-3xl">
                Complete Your Contractor Profile
              </h1>
              <p className="mt-1 text-sm text-ink-600">
                Showcase your professional bio, verified trade expertise, and previous work portfolio.
              </p>
            </div>

            <div className="shrink-0">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold",
                  isOverallComplete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                )}
              >
                {isOverallComplete ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                    <span>Profile Complete</span>
                  </>
                ) : (
                  <>
                    <AlertCircleIcon className="h-4 w-4 text-amber-600" />
                    <span>Profile Incomplete</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Completion Progress Checklist */}
          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-ink-900/10 pt-5 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 text-xs font-medium">
              {isBioComplete ? (
                <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-amber-400 bg-amber-100 text-[10px] font-bold text-amber-800">
                  !
                </span>
              )}
              <span className={isBioComplete ? "text-ink-900 font-semibold" : "text-amber-900"}>
                1. Professional Bio ({bio?.trim().length || 0}/15 min chars)
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-medium">
              {isPortfolioComplete ? (
                <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-amber-400 bg-amber-100 text-[10px] font-bold text-amber-800">
                  !
                </span>
              )}
              <span className={isPortfolioComplete ? "text-ink-900 font-semibold" : "text-amber-900"}>
                2. Previous Jobs Portfolio ({portfolio.length} project{portfolio.length === 1 ? "" : "s"} added)
              </span>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            <AlertCircleIcon className="h-5 w-5 shrink-0 text-red-600" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmitProfile("dashboard"); }} className="mt-8 space-y-8">
          {/* 1. Basic Company & Trade Info */}
          <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-lg font-bold text-ink-900">1. Company & Trade Details</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Your registered trade identity and primary building category.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink-700">Company / Trade Name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Kwame Builders Ltd."
                  required
                  className="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700">Primary Trade Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                >
                  {TRADE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700">Specialties & Skillsets</label>
                <input
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="e.g. Residential, Commercial, Concrete, Roofing"
                  className="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700">Operating Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Accra, Greater Accra"
                  required
                  className="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700">Years of Experience</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700">License / Certification Type</label>
                <input
                  type="text"
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  placeholder="e.g. D1K1 General Building, Certified Electrical"
                  className="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink-700">Service Areas (comma-separated)</label>
                <input
                  type="text"
                  value={serviceAreas}
                  onChange={(e) => setServiceAreas(e.target.value)}
                  placeholder="e.g. Greater Accra Region, Central Region, Tema Districts"
                  className="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                />
              </div>
            </div>
          </div>

          {/* 2. Professional Bio (Required) */}
          <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink-900">2. Professional Bio / Company Overview *</h2>
                <p className="mt-0.5 text-xs text-ink-500">
                  Explain your experience, services offered, craftsmanship quality, and types of projects you handle.
                </p>
              </div>
              <span
                className={cn(
                  "text-xs font-bold",
                  bio.trim().length >= 15 ? "text-forest-700" : "text-amber-600"
                )}
              >
                {bio.trim().length}/15 min chars
              </span>
            </div>

            <div className="mt-4">
              <textarea
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your construction company, years of expertise in Ghana, specialized building techniques, commitment to structural integrity, safety standards, and client satisfaction..."
                required
                className="w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
              <p className="mt-1.5 text-xs text-ink-500">
                This bio will be prominently featured at the top of your public contractor profile for all prospective clients.
              </p>
            </div>
          </div>

          {/* 3. Previous Jobs / Work Portfolio (Required) */}
          <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-ink-900/10 pb-5">
              <div>
                <h2 className="text-lg font-bold text-ink-900">3. Previous Jobs / Work Portfolio *</h2>
                <p className="mt-0.5 text-xs text-ink-500">
                  Showcase projects you have completed. Include project title, description, and up to 8 high-resolution pictures per project.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleOpenNewProject}
                className="flex items-center gap-1.5 shrink-0"
              >
                <PlusIcon className="h-4 w-4" />
                Add Previous Project
              </Button>
            </div>

            {/* Portfolio List */}
            {portfolio.length === 0 ? (
              <div className="my-6 rounded-xl border border-dashed border-ink-900/20 bg-mist-50/70 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                  <UploadCloudIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-ink-900">No Portfolio Projects Added Yet</h3>
                <p className="mt-1 text-xs text-ink-500 max-w-sm mx-auto">
                  Clients hire contractors with proven results. Click below to add your first completed project with photos.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleOpenNewProject}
                  className="mt-4"
                >
                  + Add Your First Project
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {portfolio.map((proj, index) => {
                  const imgs = Array.isArray(proj.images) ? proj.images : proj.image ? [proj.image] : [];
                  return (
                    <div
                      key={proj.id || index}
                      className="rounded-xl border border-ink-900/10 bg-mist-50/40 p-5 transition hover:border-forest-600/30 hover:bg-white"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
                            Project #{index + 1}
                          </span>
                          <h3 className="text-base font-bold text-ink-900">{proj.title}</h3>
                          <p className="mt-1 text-xs text-ink-600 leading-relaxed whitespace-pre-line">
                            {proj.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProject(proj)}
                            className="flex items-center gap-1 rounded-lg border border-ink-900/15 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-mist-100"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Pictures Preview Strip (up to 8) */}
                      <div className="mt-4 border-t border-ink-900/5 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-ink-500">
                            Project Pictures ({imgs.length} / 8 max)
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
                          {imgs.slice(0, 8).map((imgUrl, i) => (
                            <div
                              key={i}
                              className="group relative aspect-square overflow-hidden rounded-lg border border-ink-900/10 bg-mist-100"
                            >
                              <img
                                src={imgUrl}
                                alt={`${proj.title} - photo ${i + 1}`}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              {i === 0 && (
                                <span className="absolute left-1 top-1 rounded bg-forest-600 px-1 py-0.5 text-[9px] font-bold text-white">
                                  Cover
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Action Bar */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-ink-900/10 pt-6">
            <Link
              to="/dashboard"
              className="text-center text-xs font-semibold text-ink-600 hover:text-ink-900"
            >
              &larr; Back to Dashboard
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={saving}
                onClick={() => handleSubmitProfile("public")}
              >
                Save & View Public Profile
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={saving}
              >
                {saving ? "Saving Profile..." : "Save & Finish Profile"}
              </Button>
            </div>
          </div>
        </form>

        {/* ======================================================== */}
        {/* Project Add / Edit Modal (Enforces Max 8 Images)         */}
        {/* ======================================================== */}
        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between border-b border-ink-900/10 pb-4">
                <h3 className="text-lg font-extrabold text-ink-900">
                  {editingProjectId ? "Edit Portfolio Project" : "Add Completed Project to Portfolio"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="rounded-full p-1 text-ink-400 hover:bg-mist-100 hover:text-ink-900"
                >
                  ✕
                </button>
              </div>

              {projectError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
                  {projectError}
                </div>
              )}

              <form onSubmit={handleSaveProject} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700">
                    Project Worked On (Title) *
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. 4-Bedroom Luxury Residence in East Legon"
                    required
                    className="mt-1 w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700">
                    Project Description (Scope, Materials & Outcome) *
                  </label>
                  <textarea
                    rows={4}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe the scope of work, structural challenges solved, foundation type, finishing quality, timeline, and client results..."
                    required
                    className="mt-1 w-full rounded-xl border border-ink-900/15 bg-mist-50 p-3 text-sm text-ink-900 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                  />
                </div>

                {/* Project Pictures: Strict 8-Image Limit */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-ink-700">
                      Project Pictures (Max 8 Pictures) *
                    </label>
                    <span
                      className={cn(
                        "text-xs font-bold",
                        projectImages.length === 8 ? "text-forest-700" : "text-ink-500"
                      )}
                    >
                      {projectImages.length} / 8 pictures
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {projectImages.map((imgUrl, i) => (
                      <div
                        key={i}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-ink-900/10 bg-mist-100"
                      >
                        <img
                          src={imgUrl}
                          alt={`Uploaded preview ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {i === 0 && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-forest-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveProjectImage(i)}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/80 text-white transition hover:bg-red-600"
                          title="Remove picture"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {projectImages.length < 8 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-900/20 bg-mist-50 text-ink-500 transition hover:border-forest-500 hover:bg-forest-50 hover:text-forest-700"
                      >
                        <UploadCloudIcon className="h-6 w-6" />
                        <span className="text-[11px] font-semibold">
                          {uploadingImage ? "Uploading..." : "Add Picture"}
                        </span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      handleImageFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />

                  <p className="mt-2 text-xs text-ink-500">
                    Upload up to 8 high-resolution photos of your work (foundation, structural progress, completed finishing).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-ink-900/10 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProjectModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={uploadingImage}
                  >
                    {editingProjectId ? "Save Changes" : "Add Project to Portfolio"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
