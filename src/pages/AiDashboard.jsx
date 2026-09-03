import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  MessageSquare,
  BarChart2,
  Hammer,
  LandPlot,
  Bookmark,
  Bot,
  User,
  RefreshCw,
  MoreHorizontal,
  Paperclip,
  MapPin,
  Sparkles,
  Send,
  ChevronRight,
  ArrowUpRight,
  RotateCw,
  CheckCheck,
  Star,
  Building2,
  Search,
  LogOut,
  ChevronUp,
  Map,
  ShieldCheck,
  Compass,
  FileText,
  X,
  Menu,
  Clock,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Download,
  Calculator,
  Share2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, getStoredToken } from "../services/api";
import {
  CostEstimatorWidget,
  LandDueDiligenceWidget,
  SoilFloodRiskWidget,
  ProjectBriefWidget,
} from "../components/ai/AiInteractiveWidgets";

const SUGGESTED_QUESTION_SETS = [
  [
    "What should I check before buying land in Ghana?",
    "How do I know if land is in a flood-prone area?",
    "What is the average cost to build a 3-bedroom house?",
    "Explain freehold vs leasehold land.",
  ],
  [
    "What is the process to get a Land Title Certificate in Accra?",
    "How much does a building permit cost in Ghana?",
    "What is the difference between an indenture and a land title?",
    "How do I conduct a search at the Lands Commission?",
  ],
  [
    "What are the best residential areas to buy land in Kumasi?",
    "What foundation is recommended for waterlogged soil?",
    "How long does it take to construct a house from foundation to roofing?",
    "What documents must a land owner show before purchase?",
  ],
];

const DEFAULT_QUICK_REPLIES = [
  "Estimate Construction Cost",
  "Check Land Due Diligence",
  "Inspect Flood Risk",
  "Find Top Contractors",
];

function SafeMarkdown({ content }) {
  if (!content) return null;
  const str = typeof content === "string" ? content : String(content);
  try {
    return (
      <div className="prose prose-slate max-w-none text-xs sm:text-sm prose-p:my-1.5 prose-headings:font-bold prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5 leading-relaxed">
        <ReactMarkdown>{str}</ReactMarkdown>
      </div>
    );
  } catch (err) {
    console.warn("Markdown rendering error, falling back to plain text:", err);
    return <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{str}</p>;
  }
}

export default function AiDashboard() {
  const { user, logout, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");

  // Chat conversation state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Interactive Voice & Message Actions State
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [msgFeedback, setMsgFeedback] = useState({});
  const recognitionRef = useRef(null);

  // Question Set Index for "See more suggestions"
  const [questionSetIdx, setQuestionSetIdx] = useState(0);

  // File Upload Attachment State
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Tab data states for real API data
  const [contractorsList, setContractorsList] = useState([]);
  const [bidsList, setBidsList] = useState([]);
  const [savedConversations, setSavedConversations] = useState([]);
  const [landAnalysisResult, setLandAnalysisResult] = useState(null);
  const [loadingTabData, setLoadingTabData] = useState(false);
  const [contractorSearch, setContractorSearch] = useState("");

  const messagesEndRef = useRef(null);
  const userMenuRef = useRef(null);
  const moreOptionsRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Web Speech Recognition Initialization
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        const transcript = event.results[0][0]?.transcript;
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      rec.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech start error:", err);
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech (Audio Voice Player)
  const handleSpeak = (msgId, text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[#*_`~>-]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy message text
  const handleCopyMessage = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Helpful Feedback
  const handleFeedback = (msgId, type) => {
    setMsgFeedback((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type,
    }));
  };

  // Export Chat Transcript as Markdown file
  const handleExportChat = () => {
    if (messages.length === 0) {
      alert("No messages to export yet.");
      return;
    }
    const transcriptText = `# TerraMatch AI Conversation Transcript\nDate: ${new Date().toLocaleString()}\n\n` +
      messages
        .map((m) => `### ${m.sender === "user" ? user?.name || "User" : "TerraBot"} (${m.time || ""}):\n\n${m.content}\n`)
        .join("\n---\n\n");

    const blob = new Blob([transcriptText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terramatch_ai_transcript_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(e.target)) {
        setMoreOptionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, activeTab]);

  // Load real contractors when contractors tab is active
  useEffect(() => {
    if (activeTab === "contractors" && contractorsList.length === 0) {
      setLoadingTabData(true);
      api
        .get("/api/contractors")
        .then((res) => {
          if (Array.isArray(res)) setContractorsList(res);
          else if (res?.contractors) setContractorsList(res.contractors);
        })
        .catch((err) => console.warn("Error fetching contractors:", err))
        .finally(() => setLoadingTabData(false));
    }
  }, [activeTab, contractorsList.length]);

  // Load real land bids when land bidding tab is active
  useEffect(() => {
    if (activeTab === "bidding" && bidsList.length === 0) {
      setLoadingTabData(true);
      api
        .get("/api/bids/my-bids")
        .then((res) => {
          if (Array.isArray(res)) setBidsList(res);
          else if (res?.bids) setBidsList(res.bids);
        })
        .catch((err) => {
          // Fallback to explore lands if user has no placed bids yet
          api.get("/api/lands").then((lands) => {
            if (Array.isArray(lands)) setBidsList(lands);
          }).catch(() => {});
        })
        .finally(() => setLoadingTabData(false));
    }
  }, [activeTab, bidsList.length]);

  // Load real saved conversations from database
  useEffect(() => {
    if (activeTab === "saved-chats") {
      setLoadingTabData(true);
      api
        .get("/api/conversations")
        .then((res) => {
          if (Array.isArray(res)) setSavedConversations(res);
        })
        .catch((err) => console.warn("Error fetching saved conversations:", err))
        .finally(() => setLoadingTabData(false));
    }
  }, [activeTab]);

  // Run land analysis via backend API
  const handleRunLandAnalysis = async (region = "Greater Accra") => {
    setLoadingTabData(true);
    try {
      const res = await api.get(`/api/ai/land-analysis?region=${encodeURIComponent(region)}`);
      setLandAnalysisResult(res);
    } catch (err) {
      console.warn("Land analysis error:", err);
    } finally {
      setLoadingTabData(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const displayName = user?.name || "User Account";
  const displayRole = user?.role
    ? user.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Member";

  // Load chat history from localStorage on initial render with strict sanitation
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("terramatch_ai_history");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.filter(
            (m) => m && typeof m === "object" && m.sender && typeof m.content === "string"
          );
          if (sanitized.length > 0) {
            setMessages(sanitized);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to restore AI chat history:", e);
      try {
        localStorage.removeItem("terramatch_ai_history");
      } catch (_) {}
    }
  }, []);

  // Save chat history to localStorage whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("terramatch_ai_history", JSON.stringify(messages));
      } catch (e) {
        console.warn("Failed to persist AI chat history:", e);
      }
    }
  }, [messages]);

  // Handle Real File Upload via API & Base64 Multimodal encoding
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFile(true);
    const file = files[0];

    // Read Base64 for Multimodal Gemini Vision
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;

      try {
        const token = getStoredToken();
        const formData = new FormData();
        formData.append("file", file);

        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8082";
        const res = await fetch(`${baseUrl}/api/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const data = await res.json();
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: data.originalName || file.name,
            url: data.url || "#",
            base64: base64Data,
            mimeType: file.type || "image/jpeg",
          },
        ]);
      } catch (err) {
        console.warn("File upload fallback to inline Base64:", err);
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            url: "#",
            base64: base64Data,
            mimeType: file.type || "image/jpeg",
          },
        ]);
      } finally {
        setUploadingFile(false);
      }
    };

    reader.onerror = () => {
      setUploadingFile(false);
    };

    reader.readAsDataURL(file);
  };

  // Handle Location Pin Click
  const handleAttachLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const locStr = `[Location Attached: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)} (Greater Accra, Ghana)]`;
          setInputValue((prev) => (prev ? `${prev}\n${locStr}` : locStr));
        },
        () => {
          const locStr = `[Location Attached: East Legon, Greater Accra, Ghana]`;
          setInputValue((prev) => (prev ? `${prev}\n${locStr}` : locStr));
        }
      );
    } else {
      const locStr = `[Location Attached: East Legon, Greater Accra, Ghana]`;
      setInputValue((prev) => (prev ? `${prev}\n${locStr}` : locStr));
    }
  };

  // Send message to AI API
  const handleSend = async (customText) => {
    const textToSend = typeof customText === "string" ? customText : inputValue.trim();
    if ((!textToSend && attachedFiles.length === 0) || isThinking) return;

    let fullContent = textToSend;
    const currentAttachments = [...attachedFiles];

    if (currentAttachments.length > 0) {
      const fileRefs = currentAttachments.map((f) => `📎 Attached: ${f.name}`).join("\n");
      fullContent = fullContent ? `${fullContent}\n\n${fileRefs}` : fileRefs;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg = {
      id: Date.now(),
      sender: "user",
      content: fullContent,
      time: timeStr,
      attachments: currentAttachments.map((f) => f.name),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (typeof customText !== "string") setInputValue("");
    setAttachedFiles([]);
    setIsThinking(true);
    setErrorMessage("");

    try {
      const historyFormatted = messages.map((m) => ({
        sender: m.sender === "user" ? "user" : "ai",
        text: m.content,
      }));

      const res = await api.post("/api/ai/chat", {
        userMessage: fullContent,
        history: historyFormatted,
        attachments: currentAttachments.map((f) => ({
          name: f.name,
          base64: f.base64,
          mimeType: f.mimeType,
        })),
      });

      if (res.error) {
        setErrorMessage(res.error || "Something went wrong. Please try again.");
        return;
      }

      const aiReplyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const aiResponse = {
        id: Date.now() + 1,
        sender: "ai",
        content: typeof res.reply === "string" ? res.reply : "I am processing your request for land and construction insights in Ghana.",
        matches: Array.isArray(res.matches) ? res.matches : [],
        quickReplies: Array.isArray(res.quickReplies) ? res.quickReplies : DEFAULT_QUICK_REPLIES,
        time: aiReplyTime,
        projectBrief: res.projectBrief || null,
        interactiveWidget: res.interactiveWidget || null,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setErrorMessage("Something went wrong connecting to TerraBot. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  // Regenerate last AI response
  const handleRegenerate = () => {
    if (messages.length === 0 || isThinking) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
    if (lastUserMsg && lastUserMsg.content) {
      // Remove last AI message
      setMessages((prev) => {
        const lastIdx = prev.map((m) => m.sender).lastIndexOf("ai");
        if (lastIdx !== -1) {
          return prev.filter((_, idx) => idx !== lastIdx);
        }
        return prev;
      });
      handleSend(lastUserMsg.content);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setErrorMessage("");
    setAttachedFiles([]);
    try {
      localStorage.removeItem("terramatch_ai_history");
    } catch (e) {}
  };

  // Load a real saved conversation thread into chat stream
  const handleLoadSavedConversation = async (convId) => {
    setLoadingTabData(true);
    try {
      const conv = await api.get(`/api/conversations/${convId}`);
      if (conv && conv.messages) {
        const loadedMessages = conv.messages.map((m) => ({
          id: m.id,
          sender: m.senderId === user?.id ? "user" : "ai",
          content: m.body || "",
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setMessages(loadedMessages);
        setActiveTab("chat");
      }
    } catch (err) {
      console.warn("Error loading conversation:", err);
    } finally {
      setLoadingTabData(false);
    }
  };

  const currentQuestions = SUGGESTED_QUESTION_SETS[questionSetIdx];

  const filteredContractors = contractorsList.filter(
    (c) =>
      !contractorSearch ||
      c.name?.toLowerCase().includes(contractorSearch.toLowerCase()) ||
      c.category?.toLowerCase().includes(contractorSearch.toLowerCase()) ||
      c.location?.toLowerCase().includes(contractorSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
      />

      {/* Mobile Sidebar Slide-over Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col justify-between bg-[#033629] p-4 text-white shadow-2xl z-10">
            <div>
              <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-emerald-800/40">
                <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  TerraMatch AI
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="rounded-xl p-1.5 text-emerald-200 hover:bg-emerald-800/60 transition"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("chat");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "chat"
                      ? "bg-[#059669] text-white shadow-sm"
                      : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat Assistant</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("land-analysis");
                    handleRunLandAnalysis();
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "land-analysis"
                      ? "bg-[#059669] text-white shadow-sm"
                      : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
                  }`}
                >
                  <BarChart2 className="h-4 w-4" />
                  <span>Land Analysis</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("contractors");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "contractors"
                      ? "bg-[#059669] text-white shadow-sm"
                      : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
                  }`}
                >
                  <Hammer className="h-4 w-4" />
                  <span>Contractors</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("bidding");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "bidding"
                      ? "bg-[#059669] text-white shadow-sm"
                      : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
                  }`}
                >
                  <LandPlot className="h-4 w-4" />
                  <span>Land Bidding</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("saved-chats");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "saved-chats"
                      ? "bg-[#059669] text-white shadow-sm"
                      : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                  <span>Saved Chats</span>
                </button>
              </nav>
            </div>

            {/* Mobile Sidebar Footer */}
            <div className="pt-4 border-t border-emerald-800/40">
              <Link
                to="/explore-land"
                className="block w-full rounded-xl border border-emerald-400/80 bg-emerald-900/50 py-2 text-center text-xs font-bold text-emerald-300 transition hover:bg-[#059669] hover:text-white mb-3"
              >
                Explore Land Map
              </Link>
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-950/60 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#059669] text-xs font-bold text-white">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{displayName}</p>
                  <p className="truncate text-[10px] text-emerald-200/70">{displayRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. LEFT AI SIDEBAR (#033629 / Dark Emerald) - Desktop */}
      <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 bg-[#033629] text-white flex-col justify-between p-4 border-r border-emerald-950/40 shadow-xl">
        {/* Brand & Nav */}
        <div>
          <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-emerald-800/40">
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              TerraMatch AI
            </span>
            <span className="bg-[#059669] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
              AI
            </span>
          </div>

          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "chat"
                  ? "bg-[#059669] text-white shadow-sm"
                  : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat Assistant</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("land-analysis");
                handleRunLandAnalysis();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "land-analysis"
                  ? "bg-[#059669] text-white shadow-sm"
                  : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Land Analysis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("contractors")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "contractors"
                  ? "bg-[#059669] text-white shadow-sm"
                  : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
              }`}
            >
              <Hammer className="h-4 w-4" />
              <span>Contractors</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bidding")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "bidding"
                  ? "bg-[#059669] text-white shadow-sm"
                  : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
              }`}
            >
              <LandPlot className="h-4 w-4" />
              <span>Land Bidding</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("saved-chats")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "saved-chats"
                  ? "bg-[#059669] text-white shadow-sm"
                  : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              <span>Saved Chats</span>
            </button>
          </nav>
        </div>

        {/* Promo CTA Card */}
        <div className="my-4 rounded-2xl border border-emerald-700/40 bg-[#044232] p-4 text-white shadow-sm">
          <h4 className="text-xs font-extrabold text-white">Need help finding the perfect land?</h4>
          <p className="mt-1 text-[11px] text-emerald-100/80 leading-relaxed">
            Describe your needs and let TerraBot find the best options for you.
          </p>
          <div className="my-3 flex justify-center">
            <div className="flex h-12 w-24 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
              <Compass className="h-7 w-7 animate-pulse" />
            </div>
          </div>
          <Link
            to="/explore-land"
            className="block w-full rounded-xl border border-emerald-400/80 bg-transparent py-2 text-center text-xs font-bold text-emerald-300 transition hover:bg-[#059669] hover:text-white"
          >
            Explore Land
          </Link>
        </div>

        {/* User Identity Footer */}
        <div className="relative" ref={userMenuRef}>
          {userMenuOpen && (
            <div className="absolute bottom-full mb-2 left-0 right-0 rounded-2xl border border-emerald-800 bg-[#02231b] p-3 shadow-2xl z-50">
              <div className="px-2 py-1.5">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                {user?.email && <p className="text-[11px] text-emerald-300/70 truncate">{user.email}</p>}
                <span className="mt-1 inline-block rounded-full bg-emerald-900 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  {displayRole}
                </span>
              </div>
              <div className="my-2 h-px bg-emerald-800/60" />
              <button
                type="button"
                onClick={() => {
                  navigate("/dashboard");
                  setUserMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-emerald-100 hover:bg-emerald-800/50"
              >
                <User className="h-3.5 w-3.5" /> My Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-300 hover:bg-red-950/40"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          )}

          <div
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-2xl bg-emerald-950/60 p-2.5 cursor-pointer border border-emerald-800/60 hover:bg-emerald-900/50 transition"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#059669] text-xs font-bold text-white shadow-xs">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                userInitials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{displayName}</p>
              <p className="truncate text-[10px] text-emerald-200/70">{displayRole}</p>
            </div>
            <ChevronUp
              className={`h-4 w-4 text-emerald-400 transition-transform ${
                userMenuOpen ? "" : "rotate-180"
              }`}
            />
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE AREA */}
      <main className="flex flex-1 overflow-hidden bg-slate-50">
        {/* Chat Assistant View */}
        {activeTab === "chat" && (
          <div className="flex flex-1 flex-col overflow-hidden bg-white">
            {/* Top Chat Header */}
            <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200/80 bg-white px-3 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition"
                  aria-label="Open AI navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-[#059669] text-white shadow-xs shrink-0">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">TerraBot AI</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-700 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#059669] animate-pulse" />
                      <span className="hidden xs:inline">Voice & Interactive</span>
                      <span className="xs:hidden">Live</span>
                    </span>
                  </div>
                  <p className="hidden sm:block text-xs text-slate-500 truncate">
                    Interactive AI advisor for land due diligence, Ghanaian construction costs, and verified contractors.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 relative" ref={moreOptionsRef}>
                <button
                  type="button"
                  onClick={handleExportChat}
                  title="Export Transcript (.md)"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Download className="h-3.5 w-3.5 text-[#059669]" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearConversation}
                  title="New Conversation"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setMoreOptionsOpen((prev) => !prev)}
                  title="More Options"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {/* More Options Context Menu */}
                {moreOptionsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                    <button
                      type="button"
                      onClick={() => {
                        handleExportChat();
                        setMoreOptionsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Download className="h-3.5 w-3.5 text-[#059669]" /> Export Conversation (.md)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleClearConversation();
                        setMoreOptionsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <RotateCw className="h-3.5 w-3.5 text-[#059669]" /> Clear Chat Stream
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("land-analysis");
                        handleRunLandAnalysis();
                        setMoreOptionsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <BarChart2 className="h-3.5 w-3.5 text-[#059669]" /> Run GIS Soil Analysis
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("contractors");
                        setMoreOptionsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Hammer className="h-3.5 w-3.5 text-[#059669]" /> View Local Contractors
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-center my-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                  Today
                </span>
              </div>

              {/* Empty State */}
              {messages.length === 0 && (
                <div className="my-8 text-center max-w-lg mx-auto">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#059669] shadow-xs mb-3">
                    <Bot className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    How can I assist your Ghana property or construction project?
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Ask me anything or choose an interactive tool below to calculate costs, verify land titles, or evaluate flood risks.
                  </p>

                  <div className="mt-6 space-y-2">
                    {currentQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(q)}
                        className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-semibold text-slate-800 transition hover:border-[#059669] hover:bg-emerald-50/40"
                      >
                        <span>{q}</span>
                        <ArrowUpRight className="h-4 w-4 text-[#059669]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages List */}
              {messages.map((m) => (
                <div key={m.id} className="space-y-2">
                  {m.sender === "user" ? (
                    /* User Message */
                    <div className="flex flex-col items-end">
                      <div className="max-w-[80%] rounded-2xl rounded-tr-xs bg-[#e6f4ea] px-4 py-3 text-sm text-slate-900 shadow-xs">
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <span>{m.time}</span>
                        <CheckCheck className="h-3.5 w-3.5 text-[#059669]" />
                      </div>
                    </div>
                  ) : (
                    /* AI Message */
                    <div className="flex gap-3 items-start max-w-[95%] sm:max-w-[88%]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#059669] text-white shadow-xs mt-1">
                        <Bot className="h-4 w-4" />
                      </div>

                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Markdown Content Bubble */}
                        <div className="rounded-2xl rounded-tl-xs border border-slate-200/90 bg-white p-4 text-sm text-slate-900 shadow-xs">
                          <SafeMarkdown content={m.content} />
                        </div>

                        {/* Embedded Interactive Widgets */}
                        {m.interactiveWidget === "cost_estimator" && (
                          <CostEstimatorWidget onApplyToChat={(text) => handleSend(text)} />
                        )}

                        {m.interactiveWidget === "due_diligence" && (
                          <LandDueDiligenceWidget onAskStep={(q) => handleSend(q)} />
                        )}

                        {m.interactiveWidget === "soil_flood" && (
                          <SoilFloodRiskWidget
                            onSelectDistrict={(dist) =>
                              handleSend(`Evaluate flood risk, soil suitability, and foundation recommendations for ${dist}`)
                            }
                          />
                        )}

                        {m.projectBrief && m.projectBrief.title && (
                          <ProjectBriefWidget brief={m.projectBrief} />
                        )}

                        {/* Real Database Contractor Matches if returned */}
                        {Array.isArray(m.matches) && m.matches.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <p className="text-xs font-bold text-slate-700">Recommended Verified Contractors:</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {m.matches.map((item, idx) => {
                                const contractor = item?.contractor || item || {};
                                const name = contractor.name || contractor.companyName || "Verified Contractor";
                                const rating = contractor.rating != null ? contractor.rating : 4.8;
                                const category = contractor.category || "Building & Construction";
                                const location = contractor.location || "Ghana";
                                const slug = contractor.slug || contractor.id || `contractor-${idx}`;

                                return (
                                  <div
                                    key={contractor.id || idx}
                                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs shadow-xs"
                                  >
                                    <div className="flex items-center justify-between font-bold text-slate-900">
                                      <span className="truncate pr-2">{name}</span>
                                      <span className="flex items-center gap-0.5 text-amber-600 shrink-0">
                                        <Star className="h-3 w-3 fill-current" /> {rating}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500 truncate">
                                      {category} • {location}
                                    </p>
                                    <Link
                                      to={`/find-contractor/${slug}`}
                                      className="mt-2 inline-block rounded-lg bg-[#059669] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#047857]"
                                    >
                                      View Contractor Profile
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Quick Reply Pills */}
                        {Array.isArray(m.quickReplies) && m.quickReplies.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {m.quickReplies.map((pill, pIdx) => {
                              const label = typeof pill === "string" ? pill : (pill?.label || pill?.title || String(pill));
                              return (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => handleSend(label)}
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#059669] hover:bg-emerald-50 hover:text-[#059669]"
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Interactive Message Action Bar */}
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            {/* Read Aloud Text-to-Speech */}
                            <button
                              type="button"
                              onClick={() => handleSpeak(m.id, m.content)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
                                speakingMsgId === m.id
                                  ? "bg-emerald-100 text-emerald-800 font-bold"
                                  : "hover:bg-slate-100 hover:text-slate-700"
                              }`}
                              title={speakingMsgId === m.id ? "Stop Reading" : "Read Aloud"}
                            >
                              {speakingMsgId === m.id ? (
                                <>
                                  <VolumeX className="h-3.5 w-3.5" />
                                  <span>Stop</span>
                                  <span className="flex items-center gap-0.5 ml-1">
                                    <span className="h-2 w-0.5 bg-emerald-600 animate-bounce [animation-delay:-0.2s]" />
                                    <span className="h-3 w-0.5 bg-emerald-600 animate-bounce [animation-delay:-0.1s]" />
                                    <span className="h-1.5 w-0.5 bg-emerald-600 animate-bounce" />
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="hidden sm:inline">Listen</span>
                                </>
                              )}
                            </button>

                            {/* Copy Message */}
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(m.id, m.content)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition"
                              title="Copy response"
                            >
                              {copiedMsgId === m.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="hidden sm:inline">Copy</span>
                                </>
                              )}
                            </button>

                            {/* Feedback: Thumbs Up */}
                            <button
                              type="button"
                              onClick={() => handleFeedback(m.id, "up")}
                              className={`p-1 rounded-lg transition ${
                                msgFeedback[m.id] === "up"
                                  ? "text-emerald-600 bg-emerald-50"
                                  : "hover:bg-slate-100 hover:text-slate-700"
                              }`}
                              title="Helpful response"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>

                            {/* Feedback: Thumbs Down */}
                            <button
                              type="button"
                              onClick={() => handleFeedback(m.id, "down")}
                              className={`p-1 rounded-lg transition ${
                                msgFeedback[m.id] === "down"
                                  ? "text-red-600 bg-red-50"
                                  : "hover:bg-slate-100 hover:text-slate-700"
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="text-[10px] font-medium text-slate-400">{m.time}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading State */}
              {isThinking && (
                <div className="flex gap-3 items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#059669] text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 shadow-xs">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#059669] [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#059669] [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#059669]" />
                    <span className="ml-1 text-xs font-medium text-slate-500">TerraBot is thinking...</span>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    className="underline font-bold text-red-800"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer Area */}
            <div className="p-4 bg-white border-t border-slate-200/80 space-y-3">
              {/* Interactive Quick Launchers Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
                <span className="text-[11px] font-extrabold text-slate-400 shrink-0 uppercase tracking-wider">
                  Interactive Tools:
                </span>

                <button
                  type="button"
                  onClick={() => handleSend("Calculate construction cost for a 3-bedroom house in Ghana")}
                  className="flex items-center gap-1.5 shrink-0 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  <Calculator className="h-3.5 w-3.5 text-[#059669]" />
                  <span>Cost Estimator</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSend("Show land due diligence verification checklist")}
                  className="flex items-center gap-1.5 shrink-0 rounded-full border border-teal-200 bg-teal-50/80 px-3 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                  <span>Due Diligence Checklist</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSend("Inspect flood risk and soil foundation suitability in Greater Accra")}
                  className="flex items-center gap-1.5 shrink-0 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-800 hover:bg-blue-100 transition"
                >
                  <MapPin className="h-3.5 w-3.5 text-blue-700" />
                  <span>Soil & Flood Gauge</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSend("Match verified building contractors in East Legon")}
                  className="flex items-center gap-1.5 shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Hammer className="h-3.5 w-3.5 text-slate-600" />
                  <span>Match Contractors</span>
                </button>
              </div>

              {/* Attached Files List Bar */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#059669]" />
                      <span className="truncate max-w-[150px] font-semibold">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== fIdx))}
                        className="text-emerald-700 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Textarea & Actions Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs focus-within:border-[#059669] focus-within:ring-2 focus-within:ring-emerald-500/20">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? "Listening to your voice... Speak now."
                      : "Ask about contractors, land analysis, flood risks, or construction budgets..."
                  }
                  rows={2}
                  className="w-full resize-none border-none bg-transparent p-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400">
                    {/* Voice Dictation (Speech-to-Text) Button */}
                    <button
                      type="button"
                      onClick={toggleVoiceRecognition}
                      title={isListening ? "Stop voice listening" : "Click to speak (Voice Input)"}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition ${
                        isListening
                          ? "bg-red-500 text-white animate-pulse shadow-xs"
                          : "hover:bg-slate-100 hover:text-slate-800 text-slate-600"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 text-[#059669]" />
                          <span className="hidden sm:inline">Voice</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach file, site plan, or drawing"
                      disabled={uploadingFile}
                      className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleAttachLocation}
                      title="Add current location"
                      className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleRegenerate}
                      title="Regenerate last response"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 hover:text-[#059669] transition text-xs font-semibold"
                    >
                      <RotateCw className="h-3.5 w-3.5 text-[#059669]" />
                      <span className="hidden md:inline">Regenerate</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={(!inputValue.trim() && attachedFiles.length === 0) || isThinking}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#059669] text-white shadow-xs transition hover:bg-[#047857] disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] font-medium text-slate-400">
                <ShieldCheck className="inline h-3 w-3 mr-1 text-[#059669]" />
                TerraBot AI provides estimates & due diligence advisory. Please verify with official Ghana Lands Commission records.
              </p>
            </div>
          </div>
        )}

        {/* Land Analysis Tab */}
        {activeTab === "land-analysis" && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h3 className="text-lg font-extrabold text-slate-900">GIS & Environmental Land Analysis</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluate elevation, flood vulnerability, terrain slope, and soil suitability across Ghana.
                </p>

                <div className="mt-4 flex gap-2">
                  {["Greater Accra", "Ashanti Region", "Eastern Region", "Central Region"].map((reg) => (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => handleRunLandAnalysis(reg)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-[#059669] hover:bg-emerald-50"
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>

              {landAnalysisResult && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-900 text-sm">
                      Region Assessment: {landAnalysisResult.region}
                    </h4>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      Coordinates: {landAnalysisResult.coordinates?.lat}, {landAnalysisResult.coordinates?.lng}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-500">Flood Risk</span>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                        {landAnalysisResult.environmentalAssessment?.floodRisk}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-500">Elevation</span>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                        {landAnalysisResult.environmentalAssessment?.elevationMeters} meters
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-500">Terrain Type</span>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                        {landAnalysisResult.environmentalAssessment?.terrainType}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-500">Zoning Status</span>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                        {landAnalysisResult.environmentalAssessment?.zoningStatus}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contractors Tab */}
        {activeTab === "contractors" && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Verified Construction Contractors</h3>
                  <p className="text-xs text-slate-500">Licensed professionals stored in TerraMatch database</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search category or location..."
                      value={contractorSearch}
                      onChange={(e) => setContractorSearch(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                    />
                  </div>
                  <Link
                    to="/find-contractor"
                    className="rounded-xl bg-[#059669] px-4 py-2 text-xs font-bold text-white hover:bg-[#047857]"
                  >
                    Browse Directory
                  </Link>
                </div>
              </div>

              {loadingTabData ? (
                <p className="text-xs text-slate-500">Loading contractors database...</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredContractors.map((c) => (
                    <div key={c.id || c.slug} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                      <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                      <p className="text-xs text-slate-500">{c.category} • {c.location}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-bold">
                        <Star className="h-3.5 w-3.5 fill-current" /> {c.rating || "4.8"} ({c.reviews || 0} reviews)
                      </div>
                      <Link
                        to={`/find-contractor/${c.slug || c.id}`}
                        className="mt-3 block text-center rounded-xl bg-slate-100 py-1.5 text-xs font-bold text-slate-800 hover:bg-[#059669] hover:text-white"
                      >
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Land Bidding Tab */}
        {activeTab === "bidding" && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Land Bidding & Marketplace Offers</h3>
                  <p className="text-xs text-slate-500">Active bids placed on titled land listings</p>
                </div>
                <Link
                  to="/explore-land"
                  className="rounded-xl bg-[#059669] px-4 py-2 text-xs font-bold text-white hover:bg-[#047857]"
                >
                  Explore Land Marketplace
                </Link>
              </div>

              {loadingTabData ? (
                <p className="text-xs text-slate-500">Loading active land bids...</p>
              ) : bidsList.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm font-bold text-slate-800">No active land bids found</p>
                  <p className="text-xs text-slate-500 mt-1">Explore verified land parcels to place your transparent bids.</p>
                  <Link
                    to="/explore-land"
                    className="mt-4 inline-block rounded-xl bg-[#059669] px-4 py-2 text-xs font-bold text-white hover:bg-[#047857]"
                  >
                    Browse Land Marketplace
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bidsList.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{bid.land?.title || bid.title || "Titled Land Plot"}</h4>
                        <p className="text-xs text-slate-500">
                          {bid.amount ? `Bid Amount: GHS ${bid.amount.toLocaleString()}` : `Price: GHS ${(bid.totalPrice || 0).toLocaleString()}`}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        {bid.status || "ACTIVE"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved Chats Tab */}
        {activeTab === "saved-chats" && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Saved Conversations</h3>
                  <p className="text-xs text-slate-500">Your conversation threads stored in TerraMatch database</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="rounded-xl bg-[#059669] px-4 py-2 text-xs font-bold text-white hover:bg-[#047857]"
                >
                  + New Chat
                </button>
              </div>

              {loadingTabData ? (
                <p className="text-xs text-slate-500">Loading saved chats from database...</p>
              ) : savedConversations.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <Bookmark className="h-8 w-8 text-[#059669] mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">No saved conversation threads yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Start chatting with TerraBot or sellers to save your conversation history.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedConversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleLoadSavedConversation(c.id)}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs cursor-pointer transition hover:border-[#059669] hover:shadow-sm"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {c.landTitle || `Conversation with ${c.otherPartyName}`}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{c.lastMessageText || "No messages yet"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(c.lastMessageAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. RIGHT QUICK ACTIONS & TRY ASKING PANEL */}
        <aside className="w-80 shrink-0 border-l border-slate-200/80 bg-white p-5 space-y-6 overflow-y-auto hidden lg:block">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight mb-3">Quick Actions</h3>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("land-analysis");
                  handleRunLandAnalysis();
                }}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3 text-left transition hover:border-[#059669] hover:shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#059669]">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#059669]">Land Analysis</h4>
                    <p className="text-[11px] text-slate-500">Analyze land data</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#059669]" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("contractors")}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3 text-left transition hover:border-[#059669] hover:shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#059669]">
                    <Hammer className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#059669]">Find Contractors</h4>
                    <p className="text-[11px] text-slate-500">Verified professionals</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#059669]" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("bidding")}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3 text-left transition hover:border-[#059669] hover:shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#059669]">
                    <LandPlot className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#059669]">Land Bidding</h4>
                    <p className="text-[11px] text-slate-500">Browse active bids</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#059669]" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("saved-chats")}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3 text-left transition hover:border-[#059669] hover:shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#059669]">
                    <Bookmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#059669]">Saved Chats</h4>
                    <p className="text-[11px] text-slate-500">View your history</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#059669]" />
              </button>
            </div>
          </div>

          {/* Try Asking Questions */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight mb-3">Try Asking</h3>
            <div className="space-y-2.5">
              {currentQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveTab("chat");
                    handleSend(q);
                  }}
                  className="w-full flex items-start justify-between rounded-2xl border border-slate-200/80 bg-white p-3 text-left transition hover:border-[#059669] hover:shadow-xs group"
                >
                  <p className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-[#059669] flex-1 pr-2">
                    {q}
                  </p>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#059669]" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setQuestionSetIdx((prev) => (prev + 1) % SUGGESTED_QUESTION_SETS.length);
              }}
              className="mt-4 flex items-center justify-between text-xs font-bold text-[#059669] hover:underline w-full"
            >
              <span>See more suggestions</span>
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
