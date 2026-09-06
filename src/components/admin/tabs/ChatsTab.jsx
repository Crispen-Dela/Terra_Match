import { useState, useEffect, useRef } from "react";
import { adminApi } from "../../../services/authApi";
import { SearchIcon, ChevronLeftIcon, CheckCircleIcon, AlertTriangleIcon } from "../AdminIcons";

export default function ChatsTab() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [suspendingUser, setSuspendingUser] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await adminApi.listChats();
      setChats(res || []);
    } catch (err) {
      console.error("Failed to list chats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    setActionSuccess("");
    try {
      const msgs = await adminApi.getChatMessages(chat.id);
      setMessages(msgs || []);
    } catch (err) {
      console.error("Failed to load chat messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleToggleSuspend = async (user) => {
    if (!user) return;
    const isSuspended = user.status === "SUSPENDED";
    const confirmMsg = isSuspended
      ? `Are you sure you want to unsuspend ${user.name} (${user.email})?`
      : `Are you sure you want to SUSPEND ${user.name} (${user.email})? They will lose platform access.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setSuspendingUser(true);
      const newStatus = isSuspended ? "ACTIVE" : "SUSPENDED";
      await adminApi.updateUserStatus(user.id, { status: newStatus });
      
      // Update local state
      user.status = newStatus;
      setActionSuccess(`User ${user.name} marked as ${newStatus}.`);
      setTimeout(() => setActionSuccess(""), 4000);
      fetchChats();
    } catch (err) {
      alert(err.message || "Failed to update user status.");
    } finally {
      setSuspendingUser(false);
    }
  };

  const filteredChats = chats.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const buyerName = c.buyer?.name?.toLowerCase() || "";
    const sellerName = c.seller?.name?.toLowerCase() || "";
    const buyerEmail = c.buyer?.email?.toLowerCase() || "";
    const sellerEmail = c.seller?.email?.toLowerCase() || "";
    const lastMsg = c.messages?.[0]?.body?.toLowerCase() || "";
    return (
      buyerName.includes(q) ||
      sellerName.includes(q) ||
      buyerEmail.includes(q) ||
      sellerEmail.includes(q) ||
      lastMsg.includes(q)
    );
  });

  return (
    <div className="animate-in fade-in duration-300 h-[calc(100vh-140px)] flex flex-col min-h-0">
      <div className="mb-3 flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Direct Chat Moderation</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit private buyer-seller inquiries and support logs for safety, terms of service, and dispute resolution.
          </p>
        </div>
        <button
          onClick={fetchChats}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
        >
          Refresh Feed
        </button>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-slate-800 bg-[#111827] shadow-xl flex overflow-hidden">
        {/* Left Column: Chat List */}
        <div
          className={`w-full md:w-5/12 lg:w-4/12 border-r border-slate-800 flex flex-col bg-slate-900/30 ${
            selectedChat ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-slate-800 bg-slate-900/50">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations, names, emails..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg py-1.5 pl-9 pr-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse text-xs">
                Loading conversations...
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {searchTerm ? "No conversations match your search query." : "No active conversations found."}
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = selectedChat?.id === chat.id;
                const lastMsg = chat.messages?.[0];
                return (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`p-3.5 cursor-pointer hover:bg-slate-800/40 transition-colors ${
                      isSelected
                        ? "bg-slate-800/80 border-l-4 border-l-emerald-500 shadow-sm"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                          <span>{chat.buyer?.name || "Anonymous Buyer"}</span>
                          <span className="text-slate-500 font-normal text-[10px]">↔</span>
                          <span>{chat.seller?.name || "Seller / Admin"}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {lastMsg?.body || "No messages yet"}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {chat.buyer?.role || "USER"}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {chat.seller?.role || "USER"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Messages & Moderation Details */}
        <div
          className={`w-full md:w-7/12 lg:w-8/12 flex flex-col bg-[#111827] min-h-0 ${
            !selectedChat ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                      {selectedChat.buyer?.name || "Buyer"} & {selectedChat.seller?.name || "Seller"}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      Buyer: <span className="text-slate-200">{selectedChat.buyer?.email}</span> | Seller: <span className="text-slate-200">{selectedChat.seller?.email}</span>
                    </p>
                  </div>
                </div>

                {/* Moderation actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedChat.buyer && selectedChat.buyer.role !== "ADMIN" && (
                    <button
                      disabled={suspendingUser}
                      onClick={() => handleToggleSuspend(selectedChat.buyer)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                        selectedChat.buyer.status === "SUSPENDED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                      }`}
                    >
                      {selectedChat.buyer.status === "SUSPENDED" ? "Unsuspend Buyer" : "Suspend Buyer"}
                    </button>
                  )}
                  {selectedChat.seller && selectedChat.seller.role !== "ADMIN" && (
                    <button
                      disabled={suspendingUser}
                      onClick={() => handleToggleSuspend(selectedChat.seller)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                        selectedChat.seller.status === "SUSPENDED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                      }`}
                    >
                      {selectedChat.seller.status === "SUSPENDED" ? "Unsuspend Seller" : "Suspend Seller"}
                    </button>
                  )}
                </div>
              </div>

              {actionSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 bg-[#0c121e]/50">
                {loadingMessages ? (
                  <div className="text-center text-slate-500 animate-pulse text-xs mt-10">
                    Loading conversation transcript...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs mt-10">
                    No messages recorded in this conversation thread.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isBuyer = msg.senderId === selectedChat.buyerId;
                    const senderObj = msg.sender || (isBuyer ? selectedChat.buyer : selectedChat.seller);
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isBuyer ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-medium text-slate-400">
                            {senderObj?.name || (isBuyer ? "Buyer" : "Seller")}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            • {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isBuyer
                              ? "bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-sm"
                              : "bg-emerald-700/20 text-emerald-100 border border-emerald-500/30 rounded-tr-sm"
                          }`}
                        >
                          {msg.body}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer Notice */}
              <div className="p-2.5 border-t border-slate-800 bg-slate-900/40 text-center text-[10px] text-slate-500">
                Audit Record • All moderator queries and actions are logged to the platform security audit trail.
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
                <SearchIcon className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-300">No conversation selected</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                Select a conversation thread from the left sidebar to audit messages, inspect participants, or take moderation actions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
