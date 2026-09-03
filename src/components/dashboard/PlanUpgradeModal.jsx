import { useState } from "react";
import Button from "../common/Button";
import { dashboardApi } from "../../services/dashboardApi";
import { cn } from "../../utils/cn";

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path
        d="M12 3l1.8 5.4L19 10.2l-5.2 1.8L12 17.4l-1.8-5.4L5 10.2l5.2-1.8L12 3z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PlanUpgradeModal({ isOpen, onClose, plans = [], currentPlanId = "FREE", onPlanUpdated }) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  async function handleSelectPlan(planId) {
    if (planId === currentPlanId) return;
    setSelectedPlan(planId);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await dashboardApi.updatePlan(planId);
      setSuccess(res.message || "Plan updated successfully!");
      if (onPlanUpdated) {
        onPlanUpdated(res.plan);
      }
      setTimeout(() => {
        onClose();
      }, 1100);
    } catch (err) {
      setError(err.message || "Failed to update plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-ink-900/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-lg bg-forest-100 p-1.5 text-forest-700">
                <SparklesIcon className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-lg font-bold text-ink-900 sm:text-xl">TerraMatch Paid Plans & AI Features</h2>
            </div>
            <p className="mt-1 text-xs text-ink-500 sm:text-sm">
              Unlock advanced AI valuation, instant lead matchmaking, priority placement, and unlimited opportunities.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-mist-100 hover:text-ink-700"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Feedback message */}
        {error && (
          <div className="mt-4 rounded-xl bg-ember-50 p-3 text-xs font-medium text-ember-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl bg-forest-50 p-3 text-xs font-semibold text-forest-800">
            ✓ {success}
          </div>
        )}

        {/* Plans Grid */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.id === currentPlanId;
            const isSelected = p.id === selectedPlan;

            return (
              <div
                key={p.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-xl border p-4.5 transition-all",
                  isCurrent
                    ? "border-forest-600 bg-forest-50/40 ring-2 ring-forest-600 shadow-xs"
                    : "border-ink-900/10 bg-white hover:border-ink-900/25 hover:shadow-xs"
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-forest-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Current Plan
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-sm text-ink-900">{p.name}</h3>
                  <div className="mt-1.5 text-xl font-extrabold text-ink-900">
                    {p.price}
                  </div>

                  <ul className="mt-3.5 space-y-2 text-xs text-ink-700">
                    {p.features?.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-3.5 border-t border-ink-900/5">
                  <Button
                    type="button"
                    variant={isCurrent ? "secondary" : "primary"}
                    size="xs"
                    className="w-full"
                    disabled={isCurrent || loading}
                    onClick={() => handleSelectPlan(p.id)}
                  >
                    {isCurrent ? "Active Plan" : loading && isSelected ? "Updating..." : `Switch to ${p.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-5 flex items-center justify-between text-xs text-ink-500 border-t border-ink-900/5 pt-3">
          <span>Billing cycle renewed monthly. Cancel or switch anytime.</span>
          <button type="button" onClick={onClose} className="font-semibold text-forest-700 hover:underline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
