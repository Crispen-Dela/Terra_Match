import React, { useState, useEffect } from "react";
import Logo from "./Logo";

export default function LoadingScreen({ message = "Loading TerraMatch...", onFinish }) {
  const [progress, setProgress] = useState(15);
  const [hintIndex, setHintIndex] = useState(0);

  const hints = [
    "Verified Land Titles & Lands Commission Data",
    "Matching Top Ghanaian Contractors & Artisans",
    "Real-Time GIS Mapping & Topographical Checks",
    "Secured Escrow & Milestone Protection",
  ];

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressTimer);
          return 95;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 180);

    const hintTimer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % hints.length);
    }, 1200);

    return () => {
      clearInterval(progressTimer);
      clearInterval(hintTimer);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#0e211a] via-[#17352a] to-[#0a1813] px-4 text-white select-none overflow-hidden"
    >
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#357f5f]/15 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-sm w-full text-center">
        {/* Animated Logo Container */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-emerald-500/30 to-teal-400/30 blur-md animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 p-3 shadow-2xl backdrop-blur-md border border-white/20">
            <Logo className="h-12 w-12 transform transition-transform duration-500 hover:scale-105" />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5 flex items-center gap-1.5">
          Terra<span className="text-emerald-400">Match</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-emerald-200/80 mb-6">
          Ghana's Verified Land & Construction Platform
        </p>

        {/* Dynamic Progress Bar */}
        <div className="w-full max-w-xs bg-white/10 rounded-full h-1.5 mb-4 overflow-hidden backdrop-blur-sm border border-white/10 p-0.5">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Rotating Value Proposition Hint */}
        <div className="h-6 flex items-center justify-center">
          <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium transition-opacity duration-300 animate-fadeUp">
            ✦ {hints[hintIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
