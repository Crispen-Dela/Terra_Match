import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function EmailVerificationBanner() {
  const { emailVerified, user, resendVerificationEmail, reloadUser } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Only render once we actually have the user object so we never flash.
  // Hide if verified or admin (admins skip email verification).
  if (!user || emailVerified || user?.role === "ADMIN") {
    return null;
  }

  async function handleResend() {
    setLoading(true);
    setStatusMsg("");
    try {
      await resendVerificationEmail();
      setSent(true);
      setTimeout(() => setSent(false), 8000);
    } catch (err) {
      alert(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReload() {
    setLoading(true);
    setStatusMsg("");
    try {
      const refreshed = await reloadUser();
      if (refreshed?.emailVerified) {
        setStatusMsg("Email verified! Thank you.");
      } else {
        setStatusMsg("Not verified yet. Please check your inbox / spam folder.");
        setTimeout(() => setStatusMsg(""), 5000);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
          !
        </span>
        <span>
          <strong>Please verify your email:</strong> A verification link was sent to{" "}
          <span className="font-semibold">{user?.email}</span>. Click the link in your inbox to fully unlock all bidding & project features.
        </span>
      </div>

      <div className="flex items-center gap-2">
        {statusMsg && (
          <span className="text-amber-800 font-medium mr-2">{statusMsg}</span>
        )}
        {sent ? (
          <span className="text-emerald-700 font-semibold">✓ Verification email sent!</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={loading}
            className="rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-1 transition-colors"
          >
            {loading ? "Sending..." : "Resend Email"}
          </button>
        )}
        <button
          onClick={handleReload}
          disabled={loading}
          className="rounded border border-amber-600/40 hover:bg-amber-500/20 text-amber-900 font-semibold px-2.5 py-1 transition-colors"
        >
          {loading ? "Checking..." : "Check Status"}
        </button>
      </div>
    </div>
  );
}
