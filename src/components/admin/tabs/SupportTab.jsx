import { useState, useEffect, useRef } from "react";
import { adminApi } from "../../../services/authApi";
import { SearchIcon } from "../AdminIcons";
import { cn } from "../../../utils/cn";

function ShieldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function CheckBadgeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden="true">
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

function UserIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" strokeWidth="1.6" />
    </svg>
  );
}

function formatTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function initialsFrom(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function SupportTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef(null);
  const replyInputRef = useRef(null);

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  // Periodic refresh & live SSE setup
  useEffect(() => {
    const interval = setInterval(() => {
      loadTickets(true);
    }, 8000);

    let eventSource = null;
    try {
      const sseUrl = `${import.meta.env.VITE_API_URL || ""}/api/bids/stream`;
      eventSource = new EventSource(sseUrl);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data.type === "SUPPORT_MESSAGE_RECEIVED" ||
            data.type === "SUPPORT_REPLY_RECEIVED"
          ) {
            loadTickets(true);
            if (selectedTicket && (data.conversationId === selectedTicket.id || data.conversationId === selectedTicket.conversationId)) {
              loadThread(selectedTicket.id, true);
            }
          }
        } catch (e) {
          // ignore
        }
      };
    } catch (sseErr) {
      console.warn("SSE support listener error:", sseErr);
    }

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [selectedTicket?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function loadTickets(isBackground = false) {
    if (!isBackground) setLoading(true);
    try {
      const res = await adminApi.listSupportTickets({ status: statusFilter });
      const list = res || [];
      setTickets(list);

      // If a ticket is currently selected, refresh its data
      if (selectedTicket) {
        const updated = list.find((t) => t.id === selectedTicket.id);
        if (updated) {
          setSelectedTicket(updated);
          if (updated.messages && updated.messages.length > 0) {
            setMessages(updated.messages);
          }
        }
      } else if (list.length > 0 && !selectedTicket && !isBackground) {
        // Auto-select first ticket
        handleSelectTicket(list[0]);
      }
    } catch (err) {
      console.error("Error loading support tickets:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }

  async function handleSelectTicket(ticket) {
    setSelectedTicket(ticket);
    setReplyText("");
    if (ticket.messages && ticket.messages.length > 0) {
      setMessages(ticket.messages);
    } else {
      setMessages([]);
    }
    loadThread(ticket.id);
  }

  async function loadThread(ticketId, isBackground = false) {
    try {
      const res = await adminApi.getSupportConversation(ticketId);
      if (res && res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn("Could not load full support thread:", err);
    }
  }

  async function handleSendReply(e) {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedTicket || sendingReply) return;

    const textToSend = replyText.trim();
    setSendingReply(true);

    // Optimistically append reply
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      senderName: "Support (Admin)",
      isAdmin: true,
      body: textToSend,
      message: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyText("");

    try {
      await adminApi.replyToSupportTicket(selectedTicket.id, textToSend);
      await loadTickets(true);
      await loadThread(selectedTicket.id, true);
    } catch (err) {
      alert("Failed to send reply: " + (err.message || "Unknown error"));
    } finally {
      setSendingReply(false);
      setTimeout(() => replyInputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  }

  async function handleStatusChange(newStatus) {
    if (!selectedTicket) return;
    try {
      await adminApi.updateSupportTicketStatus(selectedTicket.id, newStatus);
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      loadTickets(true);
    } catch (err) {
      alert("Failed to update status: " + (err.message || "Unknown error"));
    }
  }

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.role?.toLowerCase().includes(q) ||
      t.latestMessage?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q)
    );
  });

  const totalUnreadCount = tickets.reduce((sum, t) => sum + (t.unreadCount || (t.status === "NEW" ? 1 : 0)), 0);

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Support Inbox</h2>
            {totalUnreadCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-bold text-white shadow-sm">
                {totalUnreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time direct chat and ticket resolution with platform users.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, email, or message..."
              className="block w-full sm:w-64 rounded-lg border border-slate-700 bg-[#111827] py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#111827] py-1.5 pl-3 pr-8 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Two-Column Card */}
      <div className="flex-1 rounded-2xl border border-slate-800 bg-[#0f172a]/60 shadow-xl flex overflow-hidden">
        {/* Left Column: User / Ticket List */}
        <div className="w-full sm:w-1/3 lg:w-[360px] shrink-0 border-r border-slate-800/90 flex flex-col bg-[#0b1120]">
          <div className="border-b border-slate-800/80 px-4 py-3 bg-slate-900/40 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Conversations ({filteredTickets.length})
            </span>
            <button
              onClick={() => loadTickets()}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading && tickets.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 animate-pulse">
                Loading support conversations...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No support conversations match your filter.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                const unread = (ticket.unreadCount || 0) > 0 || ticket.status === "NEW";

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => handleSelectTicket(ticket)}
                    className={cn(
                      "w-full p-4 text-left transition-all hover:bg-slate-800/40 flex items-start gap-3 relative",
                      isSelected
                        ? "bg-slate-800/70 border-l-4 border-l-emerald-500 shadow-inner"
                        : "border-l-4 border-l-transparent"
                    )}
                  >
                    {/* User Avatar */}
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-bold text-emerald-300 shadow-sm">
                      {initialsFrom(ticket.name)}
                      {unread && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#0b1120]" />
                      )}
                    </span>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={cn("truncate text-sm font-semibold", isSelected ? "text-white" : "text-slate-200")}>
                          {ticket.name}
                        </p>
                        <span className="shrink-0 text-[11px] text-slate-500 font-medium">
                          {formatTime(ticket.lastMessageAt || ticket.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-400 border border-slate-700/50">
                          {ticket.role || "CLIENT"}
                        </span>
                        {ticket.ghanaCardVerified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                            <CheckBadgeIcon className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                        <span className="text-slate-600">•</span>
                        <span className="truncate text-[11px] text-slate-400">{ticket.email}</span>
                      </div>

                      <p className="truncate text-xs text-slate-400">
                        {ticket.latestMessage || ticket.message || "Support conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Chat View & Details */}
        <div className="hidden sm:flex flex-1 flex-col bg-[#0b1120]/40">
          {selectedTicket ? (
            <>
              {/* Header Context Bar */}
              <div className="border-b border-slate-800/90 bg-slate-900/60 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/40 text-sm font-bold text-emerald-300">
                    {initialsFrom(selectedTicket.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-white">{selectedTicket.name}</h3>
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400 border border-emerald-500/20">
                        {selectedTicket.role || "CLIENT"}
                      </span>
                      {selectedTicket.ghanaCardVerified && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                          <CheckBadgeIcon className="h-3 w-3" />
                          Ghana Card Verified
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-400 mt-0.5">
                      {selectedTicket.email}
                      {selectedTicket.phone ? ` • ${selectedTicket.phone}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedTicket.status !== "RESOLVED" ? (
                    <button
                      onClick={() => handleStatusChange("RESOLVED")}
                      className="rounded-lg bg-emerald-600/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/25 transition-all shadow-sm"
                    >
                      ✓ Mark Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange("IN_PROGRESS")}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all shadow-sm"
                    >
                      Reopen Thread
                    </button>
                  )}
                </div>
              </div>

              {/* Message History List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-[#0b1120]/60 to-[#0f172a]/40">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400 mb-2">
                      <UserIcon className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-semibold text-slate-300">No messages in this thread yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Send a reply below to reach out to the user.</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isAdmin = Boolean(m.isAdmin || m.senderName?.includes("Admin") || m.senderName?.includes("Support"));

                    return (
                      <div
                        key={m.id || idx}
                        className={cn("flex flex-col", isAdmin ? "items-end" : "items-start")}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className={cn("text-[11px] font-bold", isAdmin ? "text-emerald-400 flex items-center gap-1" : "text-slate-300")}>
                            {isAdmin ? (
                              <>
                                <ShieldIcon className="h-3 w-3" />
                                Support (Admin)
                              </>
                            ) : (
                              m.senderName || selectedTicket.name
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {formatTime(m.createdAt)}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap",
                            isAdmin
                              ? "rounded-br-sm bg-emerald-900/40 text-emerald-50 border border-emerald-500/30"
                              : "rounded-bl-sm bg-slate-800/90 text-slate-200 border border-slate-700/60"
                          )}
                        >
                          {m.body || m.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Reply Form */}
              <form onSubmit={handleSendReply} className="border-t border-slate-800/90 bg-slate-900/60 p-4">
                <div className="flex items-center gap-3">
                  <textarea
                    ref={replyInputRef}
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Type your reply to ${selectedTicket.name}... (Press Enter to send)`}
                    className="flex-1 resize-none rounded-xl border border-slate-700/80 bg-[#0b1120] p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all shadow-md"
                    title="Send Reply"
                  >
                    <SendIcon className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 text-slate-500 mb-3 border border-slate-700/40">
                <ShieldIcon className="h-7 w-7" />
              </span>
              <h3 className="text-base font-bold text-slate-200">Select a Support Conversation</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose a user thread from the list on the left to review inquiry details and reply directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
