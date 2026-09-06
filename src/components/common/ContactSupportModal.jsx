import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supportApi, authApi } from "../../services/authApi";
import { useMessages } from "../../context/MessagesContext";
import Button from "./Button";
import { cn } from "../../utils/cn";

function ShieldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ContactSupportModal({
  isOpen,
  onClose,
  defaultMessage = "",
  onSuccess,
}) {
  const { user, isAuthed } = useAuth();
  const { startSupportConversation } = useMessages();
  const navigate = useNavigate();

  const [message, setMessage] = useState(defaultMessage);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setMessage(defaultMessage || "");
      setSubmitted(false);
      setError("");
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultMessage]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please describe your question or issue.");
      return;
    }

    if (!isAuthed && (!guestName.trim() || !guestEmail.trim())) {
      setError("Please provide your name and email address.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (isAuthed) {
        // Send via user support flow
        if (startSupportConversation) {
          await startSupportConversation(message.trim());
        } else {
          await supportApi.sendMessage(message.trim());
        }
      } else {
        // Submit guest support ticket
        await authApi.submitSupportTicket({
          name: guestName.trim(),
          email: guestEmail.trim(),
          message: message.trim(),
          subject: "Guest Support Request",
          category: "General Support",
        });
      }

      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Failed to send support message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoToMessages() {
    onClose();
    navigate("/messages?contact=support");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-ink-900/10 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-ink-900/10 px-6 py-4 bg-mist-50/70">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-forest-700">
              <ShieldIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink-900">Contact TerraMatch Support</h2>
              <p className="text-xs text-ink-500">We usually reply within an hour</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 hover:bg-mist-200/60 hover:text-ink-700 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {submitted ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-100 text-forest-700 mb-3">
                <CheckIcon className="h-7 w-7" />
              </span>
              <h3 className="text-lg font-bold text-ink-900">Support Message Sent!</h3>
              <p className="mt-1.5 max-w-sm text-sm text-ink-600">
                {isAuthed
                  ? "Your message has been delivered to our administrative support team. You can continue chatting directly in your Messages tab."
                  : "Thank you for reaching out. Our support team will review your inquiry and email you promptly."}
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
                {isAuthed ? (
                  <Button
                    onClick={handleGoToMessages}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    Open Support Chat in Messages
                  </Button>
                ) : (
                  <Button
                    onClick={onClose}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    Done
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="outline-dark"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isAuthed && user ? (
                <div className="rounded-xl border border-forest-100 bg-forest-50/50 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-ink-900">
                      Sending as <span className="text-forest-700 font-bold">{user.name}</span>
                    </p>
                    <p className="text-[11px] text-ink-500">{user.email} • {user.role || "Client"}</p>
                  </div>
                  <span className="rounded bg-forest-100 px-2 py-0.5 text-[10px] font-bold text-forest-800">
                    Logged In
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-700">Your Full Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Kwame Mensah"
                      className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-700">Email Address</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="e.g. kwame@example.com"
                      className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                  How can we help you?
                </label>
                <textarea
                  ref={textareaRef}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., I am having trouble verifying my account or submitting a bid..."
                  className="w-full resize-none rounded-xl border border-ink-900/15 bg-white p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600 border border-red-200">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline-dark"
                  size="md"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting || !message.trim()}
                  className="min-w-[130px]"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
