import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import Button from "./Button";
import { useAuth } from "../../context/AuthContext";
import { useMessages } from "../../context/MessagesContext";
import { formatGHS } from "../../constants/landDetails";
import { cn } from "../../utils/cn";

function BoltIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 fill-current", className)} aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

export default function BuyNowModal({ open, onClose, land }) {
  const navigate = useNavigate();
  const { isAuthed, user } = useAuth();
  const { startBuyNowRequest } = useMessages();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const landName = land?.name || land?.title || "Land Listing";
  const landLocation = land?.location || land?.address || "Greater Accra, Ghana";
  const landImage =
    land?.image ||
    (Array.isArray(land?.images) && land.images[0]) ||
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600";
  const landPrice = land?.buyNowPrice
    ? formatGHS(land.buyNowPrice)
    : land?.price || (land?.totalPrice ? formatGHS(land.totalPrice) : "Price on request");

  const isOwner = Boolean(
    user &&
    land &&
    (
      (land.ownerId && user.id && land.ownerId === user.id) ||
      (land.owner?.id && user.id && land.owner.id === user.id) ||
      (land.owner?.email && user.email && land.owner.email.toLowerCase() === user.email.toLowerCase())
    )
  );

  useEffect(() => {
    if (open) {
      setMessage(`Hello, I'm interested in buying your land listing titled "${landName}". Is it still available?`);
      setError("");
    }
  }, [open, landName]);

  function handleClose() {
    if (isSending) return;
    onClose?.();
  }

  async function handleStartConversation() {
    if (!isAuthed || !message.trim() || isSending || isOwner) return;
    setError("");
    setIsSending(true);
    try {
      const { conversationId } = await startBuyNowRequest(land, message.trim());
      onClose?.();
      navigate(`/messages?contact=${conversationId}`);
    } catch (err) {
      setError(err.message || "Couldn't send that message. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  if (isOwner) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Message the Land Owner">
      <div>
        <p className="text-sm text-ink-700">
          Buy Now connects you directly with the owner of{" "}
          <span className="font-semibold text-ink-900">{landName}</span> to arrange the purchase.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-900/10 bg-mist-50 p-3">
          <img
            src={landImage}
            alt={landName}
            className="h-14 w-16 shrink-0 rounded-lg bg-mist-100 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{landName}</p>
            <p className="truncate text-xs text-ink-500">{landLocation}</p>
            <p className="mt-0.5 text-sm font-bold text-forest-700">{landPrice}</p>
          </div>
        </div>

        <label htmlFor="buy-now-message" className="mt-4 block text-sm font-semibold text-ink-900">
          Your message
        </label>
        <textarea
          id="buy-now-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending}
          className="mt-1.5 w-full resize-none rounded-lg border border-ink-900/15 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20 disabled:opacity-60"
        />
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
          <BoltIcon className="text-forest-600" />
          Feel free to edit this before sending — the owner is notified as soon as you do.
        </p>

        {!isAuthed && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            You'll need to be signed in to message the owner.
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
        )}

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline-dark" size="md" className="flex-1" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="flex-1"
            disabled={!isAuthed || !message.trim() || isSending || isOwner}
            onClick={handleStartConversation}
          >
            {isSending ? "Sending…" : "Send to Owner"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
