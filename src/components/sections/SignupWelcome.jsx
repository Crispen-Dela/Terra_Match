import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SIGNUP_ROLES } from "../../constants/signupConfig";

// ── Slideshow images (dedicated auth panel slides) ─────────────
import slide1 from "../../assets/images/auth-slide1.jpg";
import slide2 from "../../assets/images/auth-slide2.jpg";
import slide3 from "../../assets/images/auth-slide3.jpg";

const SLIDES = [
  { src: slide1, caption: "Connect with trusted, background-checked contractors who deliver" },
  { src: slide2, caption: "AI-powered land valuations & environmental risk analysis" },
  { src: slide3, caption: "Prime verified land across Ghana's fastest-growing regions" },
];

const ROLE_STYLES = {
  "land-owner":   { accent: "#1B4D3E", light: "#E8F5E9", icon: "🏡" },
  "contractor":   { accent: "#1e3a5f", light: "#e8f0fe", icon: "🏗️" },
  "general-user": { accent: "#4a1d96", light: "#ede9fe", icon: "🔍" },
};

const FEATURES = [
  "Connect with verified land owners & buyers",
  "AI-powered land valuations & analysis",
  "Find trusted, background-checked contractors",
  "Secure transactions & verified identities",
];

/* ── tiny inline icons ──────────────────────────────────────────── */
function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor" }} aria-hidden="true">
      <path d="M7.5 4.5l6 5.5-6 5.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 16, height: 16, fill: "none", stroke: "#6ee7b7", flexShrink: 0 }} aria-hidden="true">
      <path d="M4 10.5l4.5 4.5 7.5-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TerraLogo() {
  return (
    <svg viewBox="0 0 32 32" style={{ width: 32, height: 32 }} aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#6ee7b7" opacity="0.18" />
      <circle cx="16" cy="16" r="10" fill="#34d399" opacity="0.3" />
      <circle cx="16" cy="16" r="5" fill="#6ee7b7" />
    </svg>
  );
}

/* ── Slideshow component ────────────────────────────────────────── */
function Slideshow() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
        setFading(false);
      }, 600);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const goTo = (idx) => {
    if (idx === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 400);
  };

  const slide = SLIDES[current];

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      {/* Image */}
      <img
        key={current}
        src={slide.src}
        alt={slide.caption}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: fading ? 0 : 0.55,
          transition: "opacity 0.6s ease",
        }}
      />

      {/* Dark gradient overlay so text stays readable */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(160deg, rgba(13,43,31,0.52) 0%, rgba(27,77,62,0.44) 50%, rgba(22,61,50,0.58) 100%)",
      }} />

      {/* Caption at bottom */}
      <div style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        padding: "0 52px",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}>
        <p style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: "0.83rem",
          fontStyle: "italic",
          letterSpacing: "0.01em",
          margin: 0,
        }}>
          {slide.caption}
        </p>
      </div>

      {/* Dot indicators */}
      <div style={{
        position: "absolute",
        bottom: 52,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "flex-start",
        padding: "0 52px",
        gap: 8,
      }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 999,
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: i === current ? "#6ee7b7" : "rgba(255,255,255,0.3)",
              transition: "all 0.35s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────── */
export default function SignupWelcome() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: "#f8faf8",
    }}>

      {/* ── LEFT PANEL with slideshow ─────────────────── */}
      <div style={{
        width: "42%",
        minHeight: "100vh",
        background: "#0d2b1f",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 52px 0 52px",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Slideshow fills the whole panel behind everything */}
        <Slideshow />

        {/* All content sits above the slideshow (z-index: 1) */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 52 }}>
            <TerraLogo />
            <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", letterSpacing: "-0.01em" }}>TerraMatch</span>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{
              fontSize: "2.1rem",
              fontWeight: 800,
              color: "white",
              lineHeight: 1.22,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}>
              Ghana's smartest<br />
              <span style={{
                background: "linear-gradient(90deg, #6ee7b7, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>land & construction</span><br />
              platform
            </h1>
            <p style={{ color: "rgba(255,255,255,0.58)", fontSize: "0.92rem", lineHeight: 1.65, maxWidth: 300 }}>
              Join thousands of land owners, contractors, and buyers making smarter real estate decisions.
            </p>
          </div>

          {/* Features list */}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckIcon />
                <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.88rem" }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust badge pinned above the dots */}
        <div style={{ position: "relative", zIndex: 1, paddingBottom: 110 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 999,
            padding: "7px 16px",
            marginTop: 44,
          }}>
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.48)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Trusted by 10,000+ users across Ghana
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 40px",
        background: "white",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111", marginBottom: 8, letterSpacing: "-0.02em" }}>
              Create your account
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.92rem", lineHeight: 1.5 }}>
              Choose how you'll use TerraMatch to get started.
            </p>
          </div>

          {/* Role cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
            {SIGNUP_ROLES.map((role) => {
              const s = ROLE_STYLES[role.id] || ROLE_STYLES["general-user"];
              return (
                <Link key={role.id} to={`/get-started/form?role=${role.id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "18px 20px", borderRadius: 16,
                      border: "1.5px solid #e5e7eb", background: "white",
                      cursor: "pointer", transition: "all 0.18s ease",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = s.accent;
                      e.currentTarget.style.background = s.light;
                      e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.09)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, background: s.light,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.55rem", flexShrink: 0,
                      border: `1px solid ${s.accent}22`,
                    }}>
                      {s.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#111", fontSize: "0.97rem", marginBottom: 3 }}>{role.title}</div>
                      <div style={{ color: "#6b7280", fontSize: "0.81rem", lineHeight: 1.45 }}>{role.description}</div>
                    </div>
                    <div style={{ color: s.accent, flexShrink: 0, opacity: 0.7 }}>
                      <ChevronRight />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span style={{ fontSize: "0.8rem", color: "#9ca3af", whiteSpace: "nowrap" }}>already a member?</span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>

          {/* Login button */}
          <Link
            to="/login"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", padding: "13px", borderRadius: 12,
              border: "1.5px solid #d1d5db", background: "white",
              color: "#111", fontSize: "0.92rem", fontWeight: 600,
              textDecoration: "none", transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#1B4D3E";
              e.currentTarget.style.color = "#1B4D3E";
              e.currentTarget.style.background = "#E8F5E9";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.color = "#111";
              e.currentTarget.style.background = "white";
            }}
          >
            Log in to your account
          </Link>

          <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.75rem", marginTop: 24, lineHeight: 1.5 }}>
            By continuing, you agree to TerraMatch's{" "}
            <a href="#" style={{ color: "#1B4D3E", textDecoration: "none" }}>Terms of Service</a>
            {" "}and{" "}
            <a href="#" style={{ color: "#1B4D3E", textDecoration: "none" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
