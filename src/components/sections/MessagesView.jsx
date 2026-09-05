import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MobileTabBar from "../common/MobileTabBar";
import { useMessages } from "../../context/MessagesContext";
import { cn } from "../../utils/cn";

function ChevronLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12.5 4.5l-6 5.5 6 5.5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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

function ChatEmptyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4 5h16v11H8l-4 3.5V5z" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function BoltIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

function LandContextCard({ landContext }) {
  return (
    <div className="flex items-center gap-3 border-b border-ink-900/10 bg-forest-50/60 px-4 py-3">
      {landContext.image && (
        <img
          src={landContext.image}
          alt={landContext.title}
          className="h-12 w-14 shrink-0 rounded-lg bg-mist-100 object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{landContext.title || "Listing"}</p>
        {(landContext.price || landContext.location) && (
          <p className="truncate text-xs text-ink-500">
            {[landContext.price, landContext.location].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function ProjectContextCard({ projectContext }) {
  return (
    <div className="flex items-center gap-3 border-b border-ink-900/10 bg-amber-50/70 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
            Tender Project Direct Chat
          </span>
        </div>
        <p className="truncate text-sm font-bold text-ink-900">{projectContext.title || "Construction Project"}</p>
        {(projectContext.location || projectContext.budgetRange) && (
          <p className="truncate text-xs text-ink-600">
            {[projectContext.location, projectContext.budgetRange].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MessagesView() {
  const { conversations, totalUnread, ensureConversation, markRead, sendMessage, activeChannelId, setActiveChannelId } = useMessages();
  const [selectedId, setSelectedId] = useState(activeChannelId || null);
  const [draft, setDraft] = useState("");
  const [justSentNotice, setJustSentNotice] = useState(false);
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contact") || searchParams.get("user") || searchParams.get("id");
  const projectId = searchParams.get("project") || searchParams.get("projectId");
  const landId = searchParams.get("land") || searchParams.get("landId");

  const messagesEndRef = useRef(null);

  // Sync activeChannelId from context if set by external trigger
  useEffect(() => {
    if (activeChannelId) {
      setSelectedId(activeChannelId);
    }
  }, [activeChannelId]);

  // Handle URL contact/project/land query parameters
  useEffect(() => {
    if (!contactId && !projectId && !landId) return;

    let isMounted = true;
    ensureConversation(contactId, { projectId, landId }).then((resolvedId) => {
      if (isMounted && resolvedId) {
        setSelectedId(resolvedId);
        markRead(resolvedId);
        setJustSentNotice(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [contactId, projectId, landId, ensureConversation, markRead]);

  // Auto-scroll to bottom of messages
  const selected =
    conversations.find(
      (c) =>
        c.id === selectedId ||
        c.cid === selectedId ||
        (contactId && (c.otherUserId === contactId || c.id === contactId || c.cid === contactId)) ||
        (!contactId && projectId && c.projectContext?.id === projectId) ||
        (!contactId && landId && c.landContext?.id === landId)
    ) || (conversations.length > 0 && !contactId && !projectId && !landId ? conversations[0] : null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages?.length]);

  function handleSelect(id) {
    setSelectedId(id);
    setActiveChannelId?.(id);
    setDraft("");
    setJustSentNotice(false);
    markRead(id);
  }

  async function handleSend(e) {
    e.preventDefault();
    const activeId = selected?.id || selectedId;
    if (!activeId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    await sendMessage(activeId, text);
  }

  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden lg:my-4 lg:rounded-2xl lg:border lg:border-ink-900/10 lg:bg-white lg:shadow-card">
        <div className="grid flex-1 overflow-hidden lg:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <div
            className={cn(
              "flex-col overflow-y-auto border-ink-900/10 bg-white lg:flex lg:border-r",
              selected ? "hidden lg:flex" : "flex"
            )}
          >
            <div className="border-b border-ink-900/10 px-5 py-4">
              <h1 className="flex items-center gap-2 text-lg font-bold text-ink-900">
                Messages
                {totalUnread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-600 text-[11px] font-bold text-white">
                    {totalUnread}
                  </span>
                )}
              </h1>
            </div>

            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-400">
                No active conversations yet. Reach out to a land owner or contractor to start chatting.
              </div>
            ) : (
              <ul>
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c.id)}
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-ink-900/5 px-5 py-3.5 text-left transition-colors hover:bg-mist-50",
                        selectedId === c.id && "bg-forest-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          c.isSupport ? "bg-forest-600 text-white" : "bg-forest-100 text-forest-700"
                        )}
                      >
                        {c.isSupport ? <ShieldIcon className="h-5 w-5" /> : c.avatarInitials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-ink-900">{c.name}</p>
                          <span className="shrink-0 text-[11px] text-ink-400">{c.lastMessageTime}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-ink-500">
                            {c.messages && c.messages.length > 0
                              ? c.messages[c.messages.length - 1]?.text
                              : c.subtitle || "New conversation"}
                          </p>
                          {c.unreadCount > 0 && (
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-forest-600 text-[10px] font-bold text-white">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Thread view */}
          <div className={cn("flex-col bg-mist-50 lg:flex", selected ? "flex" : "hidden lg:flex")}>
            {selected ? (
              <>
                <div className="flex items-center gap-3 border-b border-ink-900/10 bg-white px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-mist-100 lg:hidden"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-ink-700" />
                  </button>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      selected.isSupport ? "bg-forest-600 text-white" : "bg-forest-100 text-forest-700"
                    )}
                  >
                    {selected.isSupport ? <ShieldIcon className="h-4 w-4" /> : selected.avatarInitials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{selected.name}</p>
                    <p className="truncate text-xs text-ink-500">{selected.subtitle}</p>
                  </div>
                  {selected.isBuyNowRequest && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-forest-600 px-2.5 py-1 text-[10px] font-bold text-white">
                      <BoltIcon className="h-3 w-3" />
                      Buy Now
                    </span>
                  )}
                </div>

                {selected.landContext && <LandContextCard landContext={selected.landContext} />}
                {selected.projectContext && <ProjectContextCard projectContext={selected.projectContext} />}

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
                  {(!selected.messages || selected.messages.length === 0) && (
                    <p className="pt-6 text-center text-xs text-ink-400">
                      Say hello to start chatting with {selected.name}.
                    </p>
                  )}
                  {selected.messages?.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex flex-col", m.sender === "me" ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          m.sender === "me"
                            ? "rounded-br-sm bg-forest-600 text-white"
                            : "rounded-bl-sm border border-ink-900/10 bg-white text-ink-800"
                        )}
                      >
                        {m.text}
                      </div>
                      <span className="mt-1 text-[11px] text-ink-400">{m.time}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {justSentNotice && selected.isBuyNowRequest && (
                  <div className="flex items-center gap-2 border-t border-forest-100 bg-forest-50/80 px-4 py-2.5 text-xs font-medium text-forest-700">
                    <BoltIcon className="h-3.5 w-3.5" />
                    Buy Now request sent — the land owner has been notified.
                  </div>
                )}

                <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-ink-900/10 bg-white p-3">
                  <label htmlFor="message-draft" className="sr-only">
                    Type a message
                  </label>
                  <input
                    id="message-draft"
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-ink-900/15 bg-mist-50 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    aria-label="Send message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-600 text-white disabled:opacity-40"
                  >
                    <SendIcon className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                <ChatEmptyIcon className="h-10 w-10 text-ink-300" />
                <p className="text-sm text-ink-500">Select a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileTabBar active="messages" />
    </div>
  );
}
