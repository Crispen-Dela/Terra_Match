import { useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { contractorApi } from "../../services/contractorApi";
import { cn } from "../../utils/cn";

export default function SubmitProposalModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}) {
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("1 – 3 months");
  const [proposalText, setProposalText] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!project) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(bidAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Please enter a valid bid amount in GHS.");
      return;
    }

    if (!proposalText.trim() || proposalText.trim().length < 15) {
      setError("Please provide a brief proposal description (at least 15 characters).");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Ghana construction milestone standards.");
      return;
    }

    setLoading(true);
    try {
      await contractorApi.submitBid(project.id, {
        bidAmount: parsedAmount,
        estimatedDuration,
        proposalText: proposalText.trim(),
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err?.message || "Failed to submit proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleModalClose() {
    setError("");
    setSuccess(false);
    setBidAmount("");
    setProposalText("");
    onClose();
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleModalClose}
      title={success ? "Proposal Submitted!" : "Submit Tender Proposal"}
      description={
        success
          ? "Your official proposal has been delivered to the client."
          : `Submit your competitive bid for: ${project.title}`
      }
      size="md"
    >
      {success ? (
        <div className="py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink-900">Proposal Sent to Client</h3>
          <p className="mt-1.5 text-xs text-ink-600 leading-relaxed max-w-sm mx-auto">
            Your bid of <strong className="text-forest-700">GH₵{parseFloat(bidAmount || 0).toLocaleString()}</strong> for <strong>{project.title}</strong> is now live and under client review.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Button
              type="button"
              variant="primary"
              onClick={handleModalClose}
              className="w-full sm:w-auto"
            >
              Back to Dashboard
            </Button>
            <Button
              as={Link}
              to={`/messages?contact=${encodeURIComponent(project.client?.id || project.clientId || "")}&project=${encodeURIComponent(project.id || "")}`}
              variant="outline-dark"
              onClick={handleModalClose}
              className="w-full sm:w-auto"
            >
              Chat with Client
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Summary Banner */}
          <div className="rounded-xl border border-ink-900/10 bg-mist-50/70 p-3.5">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-forest-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-700">
                {project.category}
              </span>
              <span className="text-[11px] font-medium text-ink-500">
                Location: {project.location}
              </span>
            </div>
            <h4 className="mt-1.5 text-sm font-bold text-ink-900 line-clamp-1">{project.title}</h4>
            <p className="mt-1 text-xs font-semibold text-forest-800">
              Client Target Budget: <span className="text-ink-900">{project.budgetRange || "Negotiable"}</span>
            </p>
          </div>

          {/* Bid Amount Input */}
          <div>
            <label htmlFor="bid-amount" className="block text-xs font-bold text-ink-900">
              Your Proposed Amount (GHS) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-ink-500">
                GH₵
              </span>
              <input
                id="bid-amount"
                type="number"
                min="1000"
                step="500"
                placeholder="e.g. 150000"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                required
                className="block w-full rounded-xl border border-ink-900/15 py-2.5 pl-12 pr-3 text-sm font-semibold text-ink-900 placeholder:text-ink-300 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
            <p className="mt-1 text-[11px] text-ink-400">
              Enter your complete milestone or contract tender price.
            </p>
          </div>

          {/* Estimated Project Timeline */}
          <div>
            <label htmlFor="duration-select" className="block text-xs font-bold text-ink-900">
              Estimated Completion Timeline <span className="text-red-500">*</span>
            </label>
            <select
              id="duration-select"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-ink-900/15 bg-white py-2.5 px-3 text-sm font-medium text-ink-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            >
              <option value="2 – 4 weeks">2 – 4 weeks (Fast track)</option>
              <option value="1 – 2 months">1 – 2 months</option>
              <option value="1 – 3 months">1 – 3 months (Standard)</option>
              <option value="3 – 6 months">3 – 6 months</option>
              <option value="6 – 12 months">6 – 12 months (Major works)</option>
              <option value="12+ months">12+ months</option>
            </select>
          </div>

          {/* Proposal Notes / Scope */}
          <div>
            <label htmlFor="proposal-text" className="block text-xs font-bold text-ink-900">
              Proposal Details & Scope of Work <span className="text-red-500">*</span>
            </label>
            <textarea
              id="proposal-text"
              rows={4}
              placeholder="Detail your engineering approach, certified materials to be used, labor breakdown, and milestone schedule..."
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              required
              className="mt-1.5 block w-full rounded-xl border border-ink-900/15 p-3 text-xs leading-relaxed text-ink-900 placeholder:text-ink-300 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            />
          </div>

          {/* Standards & Escrow Confirmation */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="terms-check"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-900/20 text-forest-600 focus:ring-forest-600/20"
            />
            <label htmlFor="terms-check" className="text-[11px] leading-tight text-ink-600 cursor-pointer">
              I certify that our team operates in accordance with the Ghana Building Code and agree to transparent milestone disbursements.
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink-900/10">
            <Button
              type="button"
              variant="outline-dark"
              size="sm"
              onClick={handleModalClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              className="min-w-[140px]"
            >
              {loading ? "Submitting..." : "Submit Proposal"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
