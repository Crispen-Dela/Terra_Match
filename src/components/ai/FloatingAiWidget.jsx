import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCw,
  Calculator,
  ShieldCheck,
  MapPin,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { api } from "../../services/api";
import {
  CostEstimatorWidget,
  LandDueDiligenceWidget,
  SoilFloodRiskWidget,
} from "./AiInteractiveWidgets";

function SafeMarkdown({ content }) {
  if (!content) return null;
  const str = typeof content === "string" ? content : String(content);
  try {
    return (
      <div className="prose prose-slate max-w-none text-xs leading-relaxed">
        <ReactMarkdown>{str}</ReactMarkdown>
      </div>
    );
  } catch (err) {
    return <p className="whitespace-pre-wrap text-xs leading-relaxed">{str}</p>;
  }
}

export default function FloatingAiWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      content: "Hello! I am **TerraBot AI**. How can I assist with your land due diligence, construction planning, or contractor search?",
      time: "Just now",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking, isOpen]);

  // Web Speech Recognition
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

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice input is supported in Google Chrome and Microsoft Edge.");
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
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech
  const handleSpeak = (msgId, text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*_`~>-]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Context-aware smart prompts
  const getContextPrompts = () => {
    if (pathname.includes("/land-owner")) {
      return [
        "What due diligence is required for this land owner's listings?",
        "Explain Indenture vs Land Title Certificate in Ghana",
        "How do I verify Lands Commission search records?",
      ];
    }
    if (pathname.includes("/explore-land")) {
      return [
        "How do I check flood risk for this plot?",
        "What are typical land prices in Greater Accra?",
        "Show land purchase due diligence checklist",
      ];
    }
    if (pathname.includes("/find-contractor")) {
      return [
        "What questions should I ask before hiring a contractor?",
        "How do milestone escrow payments protect me?",
        "Calculate estimated house construction costs",
      ];
    }
    return [
      "Calculate 3-bedroom house construction cost",
      "Check land due diligence steps in Ghana",
      "Inspect flood & soil foundation risk",
    ];
  };

  const contextPrompts = getContextPrompts();

  const handleSend = async (customText) => {
    const textToSend = typeof customText === "string" ? customText : inputValue.trim();
    if (!textToSend || isThinking) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = {
      id: Date.now(),
      sender: "user",
      content: textToSend,
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (typeof customText !== "string") setInputValue("");
    setIsThinking(true);

    try {
      const historyFormatted = messages.map((m) => ({
        sender: m.sender === "user" ? "user" : "ai",
        text: m.content,
      }));

      const res = await api.post("/api/ai/chat", {
        userMessage: textToSend,
        history: historyFormatted,
      });

      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        content: res.reply || "I am analyzing your query with Ghana construction & land records.",
        interactiveWidget: res.interactiveWidget || null,
        matches: res.matches || [],
        quickReplies: res.quickReplies || [],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn("Floating AI error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          content: "I have recorded your request. You can also open the full AI Dashboard for in-depth analysis.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  if (pathname === "/ai") {
    return null;
  }

  return (
    <aside aria-label="TerraBot AI Assistant" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. EXPANDED CHAT MODAL */}
      {isOpen && (
        <div className="mb-3 w-[92vw] max-w-[420px] h-[580px] max-h-[82vh] rounded-3xl border border-emerald-900/40 bg-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Top Header */}
          <header className="bg-[#033629] text-white p-3.5 px-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#059669] text-white shadow-xs">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black tracking-tight text-white">TerraBot AI</h3>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-emerald-200/80">Ghana Land & Construction Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/ai");
                }}
                title="Open Full AI Workspace"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setMessages([])}
                title="Clear Conversation"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Quick Context Prompt Pills */}
          <div className="bg-emerald-50/70 border-b border-emerald-100/60 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <span className="font-extrabold text-[#059669] shrink-0 text-[10px] uppercase">
              Page Prompts:
            </span>
            {contextPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                className="shrink-0 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-slate-700 hover:border-[#059669] hover:text-[#059669] transition font-medium"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div key={m.id} className="space-y-1">
                {m.sender === "user" ? (
                  <div className="flex flex-col items-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#059669] px-3.5 py-2.5 text-xs text-white shadow-xs leading-relaxed">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">{m.time}</span>
                  </div>
                ) : (
                  <div className="flex gap-2 items-start max-w-[95%]">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#059669] text-white mt-1 shadow-xs">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="rounded-2xl rounded-tl-xs border border-slate-200 bg-white p-3 text-xs text-slate-900 shadow-xs leading-relaxed">
                        <SafeMarkdown content={m.content} />
                      </div>

                      {/* Embedded Widgets if returned */}
                      {m.interactiveWidget === "cost_estimator" && (
                        <div className="scale-95 origin-top-left">
                          <CostEstimatorWidget onApplyToChat={(txt) => handleSend(txt)} />
                        </div>
                      )}

                      {m.interactiveWidget === "due_diligence" && (
                        <div className="scale-95 origin-top-left">
                          <LandDueDiligenceWidget onAskStep={(q) => handleSend(q)} />
                        </div>
                      )}

                      {m.interactiveWidget === "soil_flood" && (
                        <div className="scale-95 origin-top-left">
                          <SoilFloodRiskWidget onSelectDistrict={(d) => handleSend(`Soil and flood risk for ${d}`)} />
                        </div>
                      )}

                      {/* Quick Replies */}
                      {Array.isArray(m.quickReplies) && m.quickReplies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {m.quickReplies.slice(0, 3).map((pill, pIdx) => {
                            const label = typeof pill === "string" ? pill : (pill?.label || String(pill));
                            return (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleSend(label)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:border-[#059669] hover:text-[#059669]"
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Mini Action Bar */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                        <button
                          type="button"
                          onClick={() => handleSpeak(m.id, m.content)}
                          className="flex items-center gap-1 hover:text-slate-700 font-semibold"
                        >
                          {speakingMsgId === m.id ? (
                            <>
                              <VolumeX className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-700">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3 w-3" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                        <span>{m.time}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-2 items-center text-xs text-slate-500">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#059669] text-white">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-white border border-slate-200 px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#059669] animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#059669] animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#059669] animate-bounce" />
                  <span className="ml-1 text-[11px] font-medium text-slate-600">TerraBot thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <footer className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-[#059669] focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isListening ? "Listening... Speak now" : "Ask TerraBot anything..."}
                className="flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={toggleVoice}
                title="Voice Input"
                className={`p-1.5 rounded-lg transition ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                }`}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-[#059669]" />}
              </button>

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isThinking}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#059669] text-white transition hover:bg-[#047857] disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* 2. FLOATING TRIGGER PILL BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#033629] to-[#059669] px-4 py-3 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-emerald-950/40 border border-emerald-400/40"
        >
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#059669] shadow-xs">
            <Bot className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#033629] animate-pulse" />
          </div>
          <div className="text-left pr-1">
            <p className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>Ask TerraBot AI</span>
              <Sparkles className="h-3.5 w-3.5 text-emerald-300 animate-spin" />
            </p>
            <p className="text-[10px] text-emerald-100/80 font-medium">Interactive Ghana Property AI</p>
          </div>
        </button>
      )}
    </aside>
  );
}
