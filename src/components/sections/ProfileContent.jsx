import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { contractorApi } from "../../services/contractorApi";
import { uploadApi } from "../../services/authApi";

function PersonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <circle cx="12" cy="8" r="3.3" strokeWidth="1.4" />
      <path d="M5 20c0-3.7 3.1-6 7-6s7 2.3 7 6" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden="true">
      <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" />
    </svg>
  );
}

function ChatIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4 5.5h16v10.5H8.5L4 19.5V5.5z" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.3" strokeWidth="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.3" strokeWidth="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.3" strokeWidth="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.3" strokeWidth="1.4" />
    </svg>
  );
}

function LogOutIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M9 20H5.5a1.5 1.5 0 01-1.5-1.5v-13A1.5 1.5 0 015.5 4H9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 16l4-4-4-4M20 12H9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IdCardIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" strokeWidth="1.4" />
      <circle cx="8" cy="12" r="2.2" strokeWidth="1.3" />
      <path d="M5.3 16.3c.5-1.5 1.6-2.3 2.7-2.3s2.2.8 2.7 2.3" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 9.5h4M14 12.5h4M14 15.5h2.5" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" strokeWidth="1.4" />
      <path d="M8.5 12l2 2 4-4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 118 0v4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function CameraIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:ring-offset-2",
        checked ? "bg-[#064E3B]" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

const ROLE_LABELS = {
  "land-owner": "Land Owner",
  contractor: "Contractor",
  "general-user": "General User",
  CLIENT: "General User",
  LAND_OWNER: "Land Owner",
  CONTRACTOR: "Contractor",
  ADMIN: "Administrator",
};

const ROLE_QUICK_LINK = {
  "land-owner": {
    icon: MapPinIcon,
    title: "List Your Land",
    description: "Create a new listing or manage an existing one.",
    to: "/list-your-land",
  },
  contractor: {
    icon: MapPinIcon,
    title: "Find Projects",
    description: "Browse open projects and manage your bids.",
    to: "/find-contractor",
  },
  "general-user": {
    icon: MapPinIcon,
    title: "Explore Land",
    description: "Browse listings and compare contractors.",
    to: "/explore-land",
  },
};

export default function ProfileContent() {
  const navigate = useNavigate();
  const { logout, user, role, ghanaCardVerified, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const userRole = (user?.role || "").toUpperCase();
  const isClientOrBuyer =
    role === "general-user" ||
    role === "CLIENT" ||
    userRole === "CLIENT" ||
    userRole === "GENERAL-USER" ||
    (!role && !userRole);

  const requiresGhanaCard =
    !isClientOrBuyer &&
    (role === "land-owner" ||
      role === "contractor" ||
      userRole === "LAND_OWNER" ||
      userRole === "CONTRACTOR");

  const roleLabel =
    ROLE_LABELS[role] || ROLE_LABELS[user?.role] || "General User";

  const quickLinks = [
    ROLE_QUICK_LINK[role] || ROLE_QUICK_LINK["general-user"],
    { icon: ChatIcon, title: "Messages", description: "Check conversations with buyers and contractors.", to: "/messages" },
    { icon: GridIcon, title: "Dashboard", description: "Back to your personalized home screen.", to: "/dashboard" },
  ];

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [savedMessage, setSavedMessage] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    bidAlerts: true,
  });

  const [portfolio, setPortfolio] = useState([]);
  const [newProject, setNewProject] = useState({ title: "", description: "", image: null, file: null, uploading: false });
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  useEffect(() => {
    if (role === "contractor") {
      setIsFetchingProfile(true);
      contractorApi
        .getMyProfile()
        .then((data) => {
          setPortfolio(data.portfolio || []);
        })
        .catch((err) => console.error("Failed to load contractor profile:", err))
        .finally(() => setIsFetchingProfile(false));
    }
  }, [role]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSavedMessage("");
    setSaveError("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    setSavedMessage("");
    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.fullName,
        phone: formData.phone,
      });

      if (role === "contractor") {
        await contractorApi.updateMyProfile({ portfolio });
      }

      setSavedMessage("Profile updated successfully!");
      setTimeout(() => setSavedMessage(""), 4000);
    } catch (err) {
      setSaveError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleNotification(key) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleAddProject(e) {
    e.preventDefault();
    if (!newProject.title || !newProject.description || !newProject.file) {
      alert("Please provide a title, description, and image.");
      return;
    }

    setNewProject((prev) => ({ ...prev, uploading: true }));
    try {
      const res = await uploadApi.uploadFile(newProject.file);
      const imageUrl = res.url;
      setPortfolio((prev) => [
        ...prev,
        {
          title: newProject.title,
          description: newProject.description,
          image: imageUrl,
        },
      ]);
      setNewProject({ title: "", description: "", image: null, file: null, uploading: false });
    } catch (err) {
      alert("Failed to upload image: " + err.message);
      setNewProject((prev) => ({ ...prev, uploading: false }));
    }
  }

  function handleRemoveProject(index) {
    setPortfolio((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="container-page py-10 sm:py-16 bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-3xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative group cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onChange={handleFileChange}
              title="Upload Profile Picture"
            />
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={formData.fullName || "Your Avatar"}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-emerald-50 shadow-md transition-all group-hover:brightness-75"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 text-3xl font-extrabold text-emerald-800 ring-4 ring-emerald-50 shadow-md transition-all group-hover:brightness-90">
                {formData.fullName ? formData.fullName[0].toUpperCase() : "U"}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <CameraIcon className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white bg-green-500 z-10" title="Online" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{formData.fullName || "Your Account"}</h1>
            <p className="mt-1 text-base text-slate-500">{formData.email || "Add your email below"}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Ghana Card verification status */}
        {requiresGhanaCard && (
          <div
            className={cn(
              "mt-8 flex flex-col sm:flex-row items-center gap-4 rounded-2xl border p-5 shadow-sm transition-all",
              ghanaCardVerified ? "border-green-100 bg-green-50/50" : "border-amber-100 bg-amber-50/50"
            )}
          >
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm",
                ghanaCardVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              )}
            >
              {ghanaCardVerified ? <CheckCircleIcon className="h-6 w-6" /> : <IdCardIcon className="h-6 w-6" />}
            </span>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className={cn("text-base font-bold", ghanaCardVerified ? "text-green-900" : "text-amber-900")}>
                {ghanaCardVerified ? "Ghana Card verified" : "Ghana Card verification needed"}
              </p>
              <p className={cn("mt-1 text-sm leading-relaxed", ghanaCardVerified ? "text-green-700" : "text-amber-700")}>
                {ghanaCardVerified
                  ? "Your identity is confirmed. Buyers and clients can see your verified badge."
                  : "Required to list land or take on projects as a " + roleLabel.toLowerCase() + "."}
              </p>
            </div>
            {!ghanaCardVerified && (
              <Button as={Link} to={`/get-started/ghana-card?role=${role}`} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all">
                Verify now
              </Button>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              to={link.to}
              className="group relative flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                <link.icon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-base font-bold text-slate-900">{link.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{link.description}</p>
              
              <div className="absolute right-4 top-4 text-emerald-500 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                <ArrowRightIcon className="h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Account information */}
        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
            Account Information
          </h2>
          <p className="mt-1 text-sm text-slate-500">Update your personal details and how we can reach you.</p>

          <form onSubmit={handleSave} className="mt-8 space-y-6">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#064E3B] placeholder-slate-400"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email address <span className="font-normal text-slate-400 ml-1">(Registered email)</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-medium text-slate-500 cursor-not-allowed"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <LockIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+233 XX XXX XXXX"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#064E3B] placeholder-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064E3B] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#047857] hover:shadow disabled:opacity-70"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
              {savedMessage && (
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg animate-fadeUp">✓ {savedMessage}</span>
              )}
              {saveError && (
                <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg animate-fadeUp">✕ {saveError}</span>
              )}
            </div>
          </form>
        </div>

        {/* Portfolio Management (Contractors Only) */}
        {role === "contractor" && (
          <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900">Portfolio Projects</h2>
            <p className="mt-1 text-sm text-slate-500 mb-6">
              Showcase your past work to potential clients. These projects appear on your public profile.
            </p>

            {isFetchingProfile ? (
              <p className="text-sm text-slate-500">Loading portfolio...</p>
            ) : (
              <>
                {portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {portfolio.map((proj, i) => (
                      <div key={i} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        <img src={proj.image} alt={proj.title} className="w-full h-40 object-cover" />
                        <div className="p-4">
                          <p className="font-bold text-slate-900 truncate">{proj.title}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{proj.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(i)}
                          className="absolute top-2 right-2 bg-white/90 text-red-600 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-700"
                          title="Remove Project"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 mb-8">
                    <p className="text-sm font-medium text-slate-600">No projects added yet.</p>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Add New Project</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title</label>
                      <input
                        type="text"
                        value={newProject.title}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                        placeholder="e.g. Modern Executive Villa"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                      <textarea
                        value={newProject.description}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                        placeholder="Short description of the work completed."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Project Image</label>
                      <div className="flex items-center gap-4">
                        {newProject.image && (
                          <img src={newProject.image} alt="Preview" className="h-16 w-16 object-cover rounded-lg border" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNewProject((prev) => ({ ...prev, file, image: URL.createObjectURL(file) }));
                            }
                          }}
                          className="text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline-dark"
                      size="sm"
                      onClick={handleAddProject}
                      disabled={newProject.uploading}
                      className="mt-2"
                    >
                      {newProject.uploading ? "Uploading..." : <><PlusIcon className="h-4 w-4 mr-1" /> Add Project</>}
                    </Button>
                    <p className="text-xs text-slate-500 mt-2">
                      Note: You must click "Save Changes" in the Account Information section above to persist your portfolio changes.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Notification preferences */}
        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900">Notification Preferences</h2>
          <p className="mt-1 text-sm text-slate-500 mb-6">Choose how you want to be notified about activity.</p>
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-6">
              <div>
                <p className="text-base font-bold text-slate-900">Email notifications</p>
                <p className="text-sm text-slate-500 mt-1">Bid updates, new messages, and account activity.</p>
              </div>
              <Toggle
                checked={notifications.email}
                onChange={() => toggleNotification("email")}
                label="Email notifications"
              />
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-6">
              <div>
                <p className="text-base font-bold text-slate-900">SMS notifications</p>
                <p className="text-sm text-slate-500 mt-1">Time-sensitive alerts sent to your phone.</p>
              </div>
              <Toggle
                checked={notifications.sms}
                onChange={() => toggleNotification("sms")}
                label="SMS notifications"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-slate-900">Bid alerts</p>
                <p className="text-sm text-slate-500 mt-1">Get notified when someone outbids you.</p>
              </div>
              <Toggle
                checked={notifications.bidAlerts}
                onChange={() => toggleNotification("bidAlerts")}
                label="Bid alerts"
              />
            </div>
          </div>
        </div>

        {/* Log out */}
        <div className="mt-12 flex justify-center pb-8">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOutIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
