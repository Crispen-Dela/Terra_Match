import { cn } from "../../utils/cn";

/**
 * Small pill badge — used for the "Empowering Smarter Construction" eyebrow
 * and the "Verified" / "Map View" style tags throughout the page.
 */
export default function Badge({ children, tone = "solid", className }) {
  const tones = {
    solid: "bg-forest-600 text-white",
    soft: "bg-forest-100 text-forest-700",
    outline: "border border-ink-900/15 text-ink-700 bg-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-tight",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
