import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Button from "../common/Button";
import Dropdown from "../common/Dropdown";
import FormField from "../common/FormField";
import ImageUploadGrid from "../common/ImageUploadGrid";
import FileAttachmentList from "../common/FileAttachmentList";
import InAppPageHeader from "../common/InAppPageHeader";
import MobileTabBar from "../common/MobileTabBar";
import StarRating from "../common/StarRating";
import { CONTRACTOR_CATEGORY_OPTIONS } from "../../constants/contractors";
import { useListings } from "../../context/ListingsContext";
import { askAssistant, recommendContractors } from "../../services/aiRecommendationService";
import { api } from "../../services/api";
import { cn } from "../../utils/cn";

function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" strokeWidth="1.5" />
      <path d="M8.5 12l2 2 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path
        d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4L12 3z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden="true">
      <path d="M3 11.5L20.5 3 12 20.5l-2.3-6.7L3 11.5z" />
    </svg>
  );
}

function BotIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="3" strokeWidth="1.5" />
      <circle cx="9" cy="11" r="1.5" fill="currentColor" />
      <circle cx="15" cy="11" r="1.5" fill="currentColor" />
      <path d="M12 2v4M9 15h6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const PROJECT_CATEGORY_OPTIONS = CONTRACTOR_CATEGORY_OPTIONS.filter((c) => c !== "All Categories");

const BUDGET_RANGES = [
  "Under GHS 10,000",
  "GHS 10,000 – 30,000",
  "GHS 30,000 – 75,000",
  "GHS 75,000 – 150,000",
  "GHS 150,000 – 300,000",
  "Above GHS 300,000",
];

const TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within 1 month",
  "1 – 3 months",
  "3 – 6 months",
  "6+ months",
  "Flexible",
];

const SUGGESTED_PROMPTS = [
  "I want to build a 3-bedroom house in East Legon with GHS 200,000 budget.",
  "Looking for a licensed electrical & solar engineer in Accra.",
  "I need a complete commercial store renovation in Kumasi within 1 month.",
];

const initialFormState = {
  title: "",
  category: PROJECT_CATEGORY_OPTIONS[0],
  description: "",
  budgetRange: BUDGET_RANGES[2],
  timeline: TIMELINE_OPTIONS[2],
  location: "",
};

export default function PostProjectForm() {
  const navigate = useNavigate();
  const { addProject } = useListings();

  const [formData, setFormData] = useState(initialFormState);
  const [images, setImages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitState, setSubmitState] = useState("idle");
  const [publishedSlug, setPublishedSlug] = useState(null);

  // AI Chat state
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      content:
        "Hello! I'm **TerraBot**, your AI project assistant. Tell me about your project or what you want built, and I'll ask questions, complete your project brief, and match you with top verified contractors in Ghana!",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [matches, setMatches] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Update recommended contractors shortlist whenever category/location/budget changes
  useEffect(() => {
    let isMounted = true;
    recommendContractors(formData, { limit: 3 }).then((res) => {
      if (isMounted && res) setMatches(res);
    });
    return () => {
      isMounted = false;
    };
  }, [formData.category, formData.location, formData.budgetRange]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  // Handle AI send
  async function handleSendMessage(customText) {
    const textToSend = typeof customText === "string" ? customText : inputVal.trim();
    if (!textToSend || isThinking) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (typeof customText !== "string") setInputVal("");
    setIsThinking(true);

    try {
      const res = await askAssistant({
        brief: formData,
        history: messages,
        userMessage: textToSend,
      });

      if (res) {
        if (res.matches && res.matches.length > 0) {
          setMatches(res.matches);
        }

        // Auto update brief if AI parsed new structured fields
        if (res.projectBrief) {
          setFormData((prev) => {
            const updated = { ...prev };
            if (res.projectBrief.title && res.projectBrief.title !== "null")
              updated.title = res.projectBrief.title;
            if (res.projectBrief.category && PROJECT_CATEGORY_OPTIONS.includes(res.projectBrief.category))
              updated.category = res.projectBrief.category;
            if (res.projectBrief.description && res.projectBrief.description !== "null")
              updated.description = res.projectBrief.description;
            if (res.projectBrief.location && res.projectBrief.location !== "null")
              updated.location = res.projectBrief.location;
            if (res.projectBrief.budgetRange && BUDGET_RANGES.includes(res.projectBrief.budgetRange))
              updated.budgetRange = res.projectBrief.budgetRange;
            if (res.projectBrief.timeline && TIMELINE_OPTIONS.includes(res.projectBrief.timeline))
              updated.timeline = res.projectBrief.timeline;
            return updated;
          });
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            content: res.reply || "I've updated your project brief details.",
          },
        ]);
      }
    } catch (err) {
      console.error("AI Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ai",
          content: "Sorry, I ran into an error processing that. You can also edit the project brief fields on the side directly!",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function validate() {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Project title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    else if (formData.description.trim().length < 15)
      newErrors.description = "Add a bit more detail (at least 15 characters)";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function buildRecord(status) {
    const serializedImages = images.map((img) => (typeof img === "string" ? img : img?.url || "")).filter(Boolean);
    return {
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description.trim(),
      budgetRange: formData.budgetRange,
      timeline: formData.timeline,
      location: formData.location.trim(),
      imageCount: serializedImages.length,
      coverImageUrl: serializedImages[0] || null,
      images: serializedImages,
      attachmentCount: attachments.length,
      status,
    };
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitState("submitting");
    try {
      const serializedImages = images.map((img) => (typeof img === "string" ? img : img?.url || "")).filter(Boolean);
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        budgetRange: formData.budgetRange,
        timeline: formData.timeline,
        location: formData.location.trim(),
        images: serializedImages,
        coverImageUrl: serializedImages[0] || null,
        attachments: attachments.map((a) => (typeof a === "string" ? a : a.name || "")),
      };

      const res = await api.post("/api/projects", payload).catch((err) => {
        console.warn("Backend project creation warning:", err);
        return { slug: null };
      });
      const record = addProject(buildRecord("published"), "published");
      setPublishedSlug(res?.slug || record.slug);
      setSubmitState("success");
    } catch (err) {
      const record = addProject(buildRecord("published"), "published");
      setPublishedSlug(record.slug);
      setSubmitState("success");
    }
  }

  function handleSaveDraft() {
    const title = formData.title.trim() || "Untitled Project Draft";
    setSubmitState("saving-draft");
    setTimeout(() => {
      addProject(
        {
          ...buildRecord("draft"),
          title,
        },
        "draft"
      );
      setSubmitState("idle");
      navigate("/dashboard");
    }, 400);
  }

  // Calculate brief completion score (out of 5)
  const completedFields = [
    formData.title.trim(),
    formData.category,
    formData.description.trim().length >= 15,
    formData.location.trim(),
    formData.budgetRange,
  ].filter(Boolean).length;

  if (submitState === "success") {
    return (
      <div className="flex min-h-screen flex-col bg-mist-50">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-forest-100 text-forest-600 shadow-md">
            <CheckCircleIcon className="h-12 w-12" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-ink-900">Your Project is Published!</h1>
          <p className="mt-2 max-w-md text-base text-ink-600">
            "{formData.title}" was saved and is now open for verified contractor bids across Ghana.
          </p>
          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
            <Button as={Link} to="/find-contractor" variant="primary" size="md">
              Browse Top Contractors
            </Button>
            <Button as={Link} to="/dashboard" variant="outline-dark" size="md">
              Return to Dashboard
            </Button>
          </div>
        </div>
        <MobileTabBar active="projects" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-mist-50/70">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <InAppPageHeader
            title="Post a Project with AI Assistant"
            subtitle="Talk to TerraBot to scope your project. The AI scans your details, fills your project brief, and matches you with top verified contractors."
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Left / Main Column: AI Chat Assistant (7 cols) */}
            <div className="flex flex-col rounded-3xl border border-forest-900/15 bg-forest-950 text-white shadow-xl lg:col-span-7">
              {/* AI Chat Header */}
              <div className="flex items-center justify-between border-b border-forest-800/60 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-600 text-white shadow-sm">
                    <SparklesIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      TerraBot AI Consultant
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h2>
                    <p className="text-xs text-forest-200/70">Powered by Gemini 3.6 • Project Intake Mode</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-forest-300">Brief Status</span>
                  <div className="text-xs font-bold text-emerald-400">{completedFields}/5 details captured</div>
                </div>
              </div>

              {/* Chat Stream Area */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 min-h-[380px] max-h-[520px]">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-3 text-sm leading-relaxed",
                      m.sender === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm",
                        m.sender === "user"
                          ? "bg-forest-500 text-white"
                          : "bg-emerald-700/80 text-emerald-100"
                      )}
                    >
                      {m.sender === "user" ? <UserIcon className="h-4 w-4" /> : <BotIcon className="h-4 w-4" />}
                    </div>

                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 shadow-xs",
                        m.sender === "user"
                          ? "rounded-tr-xs bg-forest-600 text-white"
                          : "rounded-tl-xs border border-forest-800/80 bg-forest-900/90 text-forest-50"
                      )}
                    >
                      {m.sender === "ai" ? (
                        <ReactMarkdown className="prose prose-invert text-xs sm:text-sm prose-p:my-1 prose-ul:my-1">
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        <p>{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700/80 text-white">
                      <BotIcon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-forest-800 bg-forest-900 px-4 py-3 text-xs text-forest-200">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" />
                      <span className="ml-1 text-xs">Scanning project details…</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="border-t border-forest-800/40 px-4 py-2.5 sm:px-5">
                <p className="text-[11px] font-semibold text-forest-300 mb-1.5">Try a quick prompt:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="rounded-full border border-forest-700/60 bg-forest-900/60 px-3 py-1 text-xs text-forest-100 transition hover:border-emerald-400 hover:bg-forest-800 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 border-t border-forest-800/80 p-3 sm:p-4"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Describe your project, budget, location, or ask TerraBot questions..."
                  className="flex-1 rounded-full border border-forest-700/70 bg-forest-900/80 px-4 py-2.5 text-sm text-white placeholder:text-forest-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isThinking}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-40 shadow-sm"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Right Column: Live Project Brief & Publishing (5 cols) */}
            <div className="space-y-6 lg:col-span-5">
              {/* Structured Brief Card */}
              <div className="rounded-3xl border border-ink-900/10 bg-white p-5 shadow-card sm:p-6">
                <div className="flex items-center justify-between border-b border-ink-900/10 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-ink-900">Live Project Brief</h2>
                    <p className="text-xs text-ink-500">Auto-filled as you chat with TerraBot</p>
                  </div>
                  <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-bold text-forest-700">
                    {completedFields}/5 Completed
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  <FormField
                    id="title"
                    name="title"
                    label="Project Title"
                    required
                    placeholder="e.g. 3-Bedroom House Construction in East Legon"
                    value={formData.title}
                    onChange={handleChange}
                    error={errors.title}
                  />

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink-900">Category</label>
                    <Dropdown
                      label="Category"
                      options={PROJECT_CATEGORY_OPTIONS}
                      value={formData.category}
                      onChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
                      className="w-full"
                    />
                  </div>

                  <FormField
                    id="description"
                    name="description"
                    label="Scope / Description"
                    as="textarea"
                    rows={3}
                    required
                    placeholder="Describe scope, materials, and specific requirements…"
                    value={formData.description}
                    onChange={handleChange}
                    error={errors.description}
                  />

                  <FormField
                    id="location"
                    name="location"
                    label="Location"
                    required
                    placeholder="e.g. East Legon, Accra"
                    value={formData.location}
                    onChange={handleChange}
                    error={errors.location}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-900">Budget Range</label>
                      <Dropdown
                        label="Budget Range"
                        options={BUDGET_RANGES}
                        value={formData.budgetRange}
                        onChange={(val) => setFormData((prev) => ({ ...prev, budgetRange: val }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-900">Timeline</label>
                      <Dropdown
                        label="Timeline"
                        options={TIMELINE_OPTIONS}
                        value={formData.timeline}
                        onChange={(val) => setFormData((prev) => ({ ...prev, timeline: val }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Uploads Accordion */}
                <div className="mt-5 border-t border-ink-900/10 pt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-900 mb-1">Reference Photos (Optional)</label>
                    <ImageUploadGrid value={images} onChange={setImages} maxImages={4} label="Photos" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-900 mb-1">Architectural Documents (Optional)</label>
                    <FileAttachmentList value={attachments} onChange={setAttachments} maxFiles={3} label="Docs" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    variant="primary"
                    size="md"
                    className="w-full shadow-sm"
                    disabled={submitState === "submitting"}
                  >
                    {submitState === "submitting" ? "Publishing Project…" : "Publish Project & Invite Bids"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveDraft}
                    variant="outline-dark"
                    size="md"
                    className="w-full"
                    disabled={submitState === "saving-draft"}
                  >
                    Save as Draft
                  </Button>
                </div>
              </div>

              {/* Matched Contractors Panel */}
              <div className="rounded-3xl border border-ink-900/10 bg-white p-5 shadow-card sm:p-6">
                <div className="flex items-center justify-between border-b border-ink-900/10 pb-3">
                  <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                    <SparklesIcon className="h-4 w-4 text-forest-600" />
                    Top AI Matched Contractors ({matches.length})
                  </h3>
                  <Link to="/find-contractor" className="text-xs font-semibold text-forest-600 hover:underline">
                    View All &rarr;
                  </Link>
                </div>

                <div className="mt-3.5 space-y-3">
                  {matches.map(({ contractor, reasons }) => (
                    <div
                      key={contractor.id || contractor.slug}
                      className="flex items-center justify-between rounded-xl border border-ink-900/10 bg-mist-50/50 p-3 transition hover:border-forest-600/30 hover:bg-white"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-ink-900">{contractor.name}</h4>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <StarRating value={contractor.rating} />
                          <span className="text-[11px] font-semibold text-ink-600">{contractor.rating}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-forest-700 line-clamp-1">{reasons?.[0]}</p>
                      </div>

                      <Button
                        as={Link}
                        to={`/find-contractor/${contractor.slug || contractor.id}`}
                        variant="secondary"
                        size="xs"
                        className="shrink-0 text-[11px]"
                      >
                        Contact
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileTabBar active="projects" />
    </div>
  );
}
