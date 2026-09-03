import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/common/Logo";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

function ShieldLockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M12 3l8 3.5v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10v-6L12 3z" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="11.5" r="2.2" strokeWidth="1.5" />
      <path d="M12 13.7v2.8" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your administrator credentials.");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginAdmin({
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Invalid administrator credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-950 px-4 py-12">
      {/* Ambient background decoration */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(126,198,166,0.5) 0, transparent 3px), radial-gradient(circle at 80% 70%, rgba(126,198,166,0.4) 0, transparent 3px)",
          backgroundSize: "120px 120px",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-forest-800/60 bg-forest-900/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-600/30 ring-1 ring-forest-500/50">
            <ShieldLockIcon className="h-7 w-7 text-forest-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            TerraMatch System Portal
          </h1>
          <p className="mt-1 text-xs text-forest-200/70">
            Administrative Governance & Platform Operations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-forest-200/90">
              Admin Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData((p) => ({ ...p, email: e.target.value }));
                if (error) setError("");
              }}
              placeholder="admin@terramatch.gh"
              className="w-full rounded-lg border border-forest-700 bg-forest-950/80 px-4 py-2.5 text-sm text-white placeholder:text-forest-400/50 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-400/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-forest-200/90">
              Security Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData((p) => ({ ...p, password: e.target.value }));
                if (error) setError("");
              }}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-forest-700 bg-forest-950/80 px-4 py-2.5 text-sm text-white placeholder:text-forest-400/50 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-400/20"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-950/80 p-3 ring-1 ring-red-500/50">
              <p className="text-xs font-medium text-red-300">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="mt-2 w-full bg-forest-500 hover:bg-forest-400 text-forest-950 font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Authenticating Session..." : "Authorize Access"}
          </Button>
        </form>

        <div className="mt-8 border-t border-forest-800/80 pt-4 text-center">
          <p className="text-[11px] text-forest-400/60">
            Authorized Personnel Only. All activities are recorded and audited.
          </p>
        </div>
      </div>
    </div>
  );
}
