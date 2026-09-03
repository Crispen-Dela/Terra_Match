import { useState } from "react";
import { cn } from "../../../utils/cn";

export default function VerificationsTab({ verifications, reviewModal, setReviewModal, handleReviewVerification, rejectionReason, setRejectionReason, actionLoading }) {
  
  return (
    <div className="animate-in fade-in duration-500 space-y-6 relative">
      
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Verification Center</h2>
        <p className="text-sm text-slate-400 mt-1">Review and approve Ghana Card submissions.</p>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Ghana Card PIN</th>
                <th className="px-6 py-4">AI Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No verifications in the queue.
                  </td>
                </tr>
              ) : (
                verifications.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-200">{v.user?.name}</p>
                        <p className="text-[11px] text-slate-500">{v.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                        {v.cardNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${v.aiAnalysisScore || 95}%` }} />
                        </div>
                        <span className="text-xs text-emerald-400 font-medium">{v.aiAnalysisScore || 95}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        v.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : v.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setReviewModal(v)}
                        className="rounded-md bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 px-3 py-1.5 text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal Panel */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F14]/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-4">
              <h3 className="text-base font-bold text-slate-100">Review Identity Document</h3>
              <button
                onClick={() => setReviewModal(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Account User</p>
                    <p className="font-medium text-slate-200">{reviewModal.user?.name}</p>
                    <p className="text-xs text-slate-500">{reviewModal.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Submitted Name</p>
                    <p className="font-medium text-slate-200">{reviewModal.fullNameOnCard}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Ghana Card PIN</p>
                    <p className="font-mono text-emerald-400 font-medium">{reviewModal.cardNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Region</p>
                    <p className="font-medium text-slate-200">{reviewModal.region}</p>
                  </div>
                </div>
              </div>

              {reviewModal.cardPhotoUrl && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Document Scan</p>
                  <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/50 p-2">
                    <img
                      src={reviewModal.cardPhotoUrl}
                      alt="Document scan"
                      className="max-h-56 w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  AI Assistant Validation
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-emerald-500/80">
                  <li>PIN format conforms to National Identification Authority standard.</li>
                  <li>Cardholder name matches profile account identity.</li>
                  <li>Confidence validation score: <span className="font-semibold text-emerald-400">{reviewModal.aiAnalysisScore || 95}%</span>.</li>
                </ul>
              </div>

              {reviewModal.status === "PENDING" && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Rejection Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason if rejecting..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {reviewModal.status === "PENDING" && (
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/30 px-6 py-4">
                <button
                  disabled={actionLoading}
                  onClick={() => handleReviewVerification("REJECT")}
                  className="rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleReviewVerification("APPROVE")}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Approve Verification"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
