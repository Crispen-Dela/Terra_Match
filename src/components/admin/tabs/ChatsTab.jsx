import { useState, useEffect } from "react";
import { adminApi } from "../../../services/authApi";
import { SearchIcon } from "../AdminIcons";

export default function ChatsTab() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    adminApi.listChats()
      .then((res) => setChats(res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const msgs = await adminApi.getChatMessages(chat.id);
      setMessages(msgs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-160px)] flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Chat Moderation</h2>
        <p className="text-sm text-slate-400 mt-1">Review user conversations for safety and compliance.</p>
      </div>

      <div className="flex-1 rounded-xl border border-slate-800 bg-[#111827] shadow-sm flex overflow-hidden">
        
        {/* Left Column: Chat List */}
        <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/20">
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full bg-slate-800 border border-slate-700 rounded-md py-1.5 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-500 animate-pulse text-sm">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No conversations found.</div>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {chats.map((chat) => (
                  <li 
                    key={chat.id} 
                    onClick={() => handleSelectChat(chat)}
                    className={`p-4 cursor-pointer hover:bg-slate-800/50 transition-colors ${selectedChat?.id === chat.id ? 'bg-slate-800/80 border-l-2 border-l-emerald-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {chat.buyer?.name} & {chat.seller?.name}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {chat.messages?.[0]?.body || "No messages yet"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2">
                      {new Date(chat.lastMessageAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Messages */}
        <div className="w-2/3 flex flex-col bg-[#111827]">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">Conversation Details</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Participants: <span className="text-emerald-400">{selectedChat.buyer?.name}</span> and <span className="text-emerald-400">{selectedChat.seller?.name}</span>
                  </p>
                </div>
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs font-medium text-slate-200 transition-colors">
                  Suspend Participant
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="text-center text-slate-500 animate-pulse text-sm mt-10">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm mt-10">No messages in this conversation.</div>
                ) : (
                  messages.map((msg) => {
                    const isBuyer = msg.senderId === selectedChat.buyerId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-500 mb-1 mx-1">{msg.sender?.name} • {new Date(msg.createdAt).toLocaleTimeString()}</span>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isBuyer ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/20 rounded-tr-sm' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'}`}>
                          {msg.body}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a conversation to view messages.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
