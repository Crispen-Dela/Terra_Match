import { useState, useEffect } from "react";
import { adminApi } from "../../../services/authApi";
import { cn } from "../../../utils/cn";

export default function SupportTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await adminApi.listSupportTickets({ status: statusFilter });
      setTickets(res || []);
      
      // Update selected ticket if it's currently open
      if (selectedTicket) {
        const updated = res.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      await adminApi.replyToSupportTicket(selectedTicket.id, replyText);
      setReplyText("");
      await loadTickets(); // Refresh list to get new reply and status
    } catch (err) {
      alert("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  }
  
  async function handleStatusChange(newStatus) {
    if (!selectedTicket) return;
    try {
      const res = await adminApi.updateSupportTicketStatus(selectedTicket.id, newStatus);
      setSelectedTicket(res.ticket);
      loadTickets(); // Refresh background list
    } catch (err) {
      alert("Failed to update status");
    }
  }

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-160px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Support Inbox</h2>
          <p className="text-sm text-slate-400 mt-1">Manage and respond to user inquiries and reports.</p>
        </div>
        
        <div className="mt-3 sm:mt-0">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-[#111827] py-1.5 pl-3 pr-8 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          >
            <option value="ALL">All Tickets</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-800 bg-[#111827] shadow-sm flex overflow-hidden">
        
        {/* Left Column: Ticket List */}
        <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/20">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-500 animate-pulse text-sm">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No support tickets found.</div>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {tickets.map((ticket) => (
                  <li 
                    key={ticket.id} 
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 cursor-pointer hover:bg-slate-800/50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-slate-800/80 border-l-2 border-l-emerald-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-slate-200 truncate pr-2">{ticket.subject}</p>
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm whitespace-nowrap",
                        ticket.status === "NEW" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        ticket.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-slate-800 text-slate-400 border border-slate-700"
                      )}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mb-2">{ticket.name} • {ticket.category}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Thread */}
        <div className="w-2/3 flex flex-col bg-[#111827]">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-900/40 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">{selectedTicket.subject}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    From: <span className="text-emerald-400">{selectedTicket.name}</span> ({selectedTicket.email})
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Category: {selectedTicket.category}</p>
                </div>
                
                <div className="flex gap-2">
                  {selectedTicket.status !== "RESOLVED" && (
                     <button onClick={() => handleStatusChange("RESOLVED")} className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-medium transition-colors">
                       Mark Resolved
                     </button>
                  )}
                  {selectedTicket.status === "RESOLVED" && (
                     <button onClick={() => handleStatusChange("IN_PROGRESS")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md text-xs font-medium transition-colors">
                       Reopen Ticket
                     </button>
                  )}
                </div>
              </div>
              
              {/* Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Original Message */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-slate-300">{selectedTicket.name}</span>
                    <span className="text-[10px] text-slate-500">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {/* Replies */}
                {selectedTicket.replies?.map((reply) => (
                  <div key={reply.id} className="bg-emerald-900/10 border border-emerald-500/10 rounded-lg p-4 ml-8">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-medium text-emerald-400">{reply.sender?.name} (Admin)</span>
                      <span className="text-[10px] text-slate-500">{new Date(reply.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {selectedTicket.status !== "RESOLVED" && (
                <div className="p-4 border-t border-slate-800 bg-slate-900/20">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response..."
                    className="w-full h-24 bg-slate-800 border border-slate-700 rounded-md p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      {sendingReply ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a support ticket to view details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
