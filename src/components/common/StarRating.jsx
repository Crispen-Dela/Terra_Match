import { useState } from "react";
import { cn } from "../../utils/cn";

/**
 * Renders a 5-star rating row. `value` may be fractional (e.g. 4.6);
 * stars render as fully filled up to the nearest whole star.
 * If `onChange` is provided, stars are interactive for review submission.
 */
export default function StarRating({ value = 0, onChange, className, starClassName }) {
  const [hover, setHover] = useState(0);
  const activeRating = hover || Math.round(value);
  const isInteractive = typeof onChange === "function";

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role={isInteractive ? "group" : "img"}
      aria-label={`Rated ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const filled = starIndex <= activeRating;
        return (
          <button
            key={starIndex}
            type="button"
            disabled={!isInteractive}
            onClick={isInteractive ? () => onChange(starIndex) : undefined}
            onMouseEnter={isInteractive ? () => setHover(starIndex) : undefined}
            onMouseLeave={isInteractive ? () => setHover(0) : undefined}
            className={cn(
              "p-0.5 transition-transform",
              isInteractive ? "cursor-pointer hover:scale-110 focus:outline-none" : "cursor-default"
            )}
            aria-label={isInteractive ? `Rate ${starIndex} star${starIndex > 1 ? "s" : ""}` : undefined}
          >
            <svg
              viewBox="0 0 20 20"
              className={cn("h-4 w-4", filled ? "fill-amber-400" : "fill-ink-900/15", starClassName)}
              aria-hidden="true"
            >
              <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
            </svg>
          </button>
        );
      })}
    </span>
  );
}
