import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, getRoleDestination, toFrontendRole } from "../../context/AuthContext";

// ── Slideshow images (dedicated auth panel slides) ─────────────
import slide1 from "../../assets/images/auth-slide1.jpg";
import slide2 from "../../assets/images/auth-slide2.jpg";
import slide3 from "../../assets/images/auth-slide3.jpg";

const SLIDES = [
  { src: slide1, caption: "Connect with trusted, background-checked contractors who deliver" },
  { src: slide2, caption: "AI-powered land valuations & environmental risk analysis" },
  { src: slide3, caption: "Prime verified land across Ghana's fastest-growing regions" },
];

const TRUST_POINTS = [
  "Verified land titles and contractor licenses",
  "Transparent, public bidding on every listing",
  "Real conversations with real land owners",
];

// ── Inline SVG icons ─────────────────────────────────────────────
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, fill: "none", stroke: "currentColor" }} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" strokeWidth="1.4" />
      <path d="M4 6.5l8 5.5 8-5.5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, fill: "none", stroke: "currentColor" }} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" strokeWidth="1.4" />
      <path d="M7.5 10.5V8a4.5 4.5 0 019 0v2.5" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, fill: "none", stroke: "currentColor" }} aria-hidden="true">
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" strokeWidth="1.4" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, fill: "none", stroke: "currentColor" }} aria-hidden="true">
      <path d="M3.5 3.5l17 17M6.7 6.9C4 8.5 2 12 2 12s3.6 6.5 10 6.5c1.9 0 3.5-.6 4.8-1.4M10 5.7c.7-.1 1.3-.2 2-.2 6.4 0 10 6.5 10 6.5s-.9 1.6-2.4 3.2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 15, height: 15, fill: "none", stroke: "#6ee7b7", flexShrink: 0 }} aria-hidden="true">
      <path d="M4 10.5l4.5 4.5 7.5-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 17, height: 17, fill: "none", stroke: "currentColor" }} aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TerraLogo() {
  return (
    <svg viewBox="0 0 32 32" style={{ width: 30, height: 30 }} aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#6ee7b7" opacity="0.18" />
      <circle cx="16" cy="16" r="10" fill="#34d399" opacity="0.3" />
      <circle cx="16" cy="16" r="5" fill="#6ee7b7" />
    </svg>
  );
}

// ── Slideshow ────────────────────────────────────────────────────
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
      <img
        key={current}
        src={slide.src}
        alt={slide.caption}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          opacity: fading ? 0 : 0.55,
          transition: "opacity 0.6s ease",
        }}
      />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(160deg, rgba(13,43,31,0.52) 0%, rgba(27,77,62,0.44) 50%, rgba(22,61,50,0.58) 100%)",
      }} />
      <div style={{
        position: "absolute", bottom: 80, left: 0, right: 0, padding: "0 52px",
        opacity: fading ? 0 : 1, transition: "opacity 0.4s ease",
      }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.83rem", fontStyle: "italic", margin: 0 }}>
          {slide.caption}
        </p>
      </div>
      <div style={{
        position: "absolute", bottom: 52, left: 0, right: 0,
        display: "flex", justifyContent: "flex-start", padding: "0 52px", gap: 8,
      }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: 999, border: "none",
            padding: 0, cursor: "pointer",
            background: i === current ? "#6ee7b7" : "rgba(255,255,255,0.3)",
            transition: "all 0.35s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Input field component ────────────────────────────────────────
function InputField({ id, label, type = "text", name, placeholder, value, onChange, error, icon, rightElement, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={{
        display: "block", fontSize: "0.82rem", fontWeight: 600,
        color: "#374151", marginBottom: 7, letterSpacing: "0.01em",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          color: focused ? "#1B4D3E" : "#9ca3af",
          transition: "color 0.15s ease", pointerEvents: "none",
          display: "flex", alignItems: "center",
        }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "13px 44px 13px 44px",
            fontSize: "0.92rem",
            border: error ? "1.5px solid #f87171" : focused ? "1.5px solid #1B4D3E" : "1.5px solid #e5e7eb",
            borderRadius: 12,
            background: focused ? "#fafffe" : "#fff",
            color: "#111",
            outline: "none",
            transition: "all 0.18s ease",
            boxSizing: "border-box",
            boxShadow: focused ? "0 0 0 3px rgba(27,77,62,0.08)" : "none",
            fontFamily: "inherit",
          }}
        />
        {rightElement && (
          <span style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            display: "flex", alignItems: "center",
          }}>
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <p style={{ marginTop: 5, fontSize: "0.78rem", color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Forgot Password Modal ────────────────────────────────────────
function ForgotModal({ forgotEmail, setForgotEmail, onClose, onSend, loading, message, error }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", padding: 16,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 20, padding: "32px 28px",
          width: "100%", maxWidth: 400,
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          animation: "slideUp 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111", marginBottom: 4 }}>Reset your password</h3>
            <p style={{ fontSize: "0.83rem", color: "#6b7280", lineHeight: 1.5 }}>
              Enter your email and we'll send you a reset link.
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "#f3f4f6", border: "none", width: 32, height: 32,
            borderRadius: "50%", cursor: "pointer", fontSize: "1rem",
            color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 12,
          }}>✕</button>
        </div>

        <form onSubmit={onSend} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="email"
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: "100%", padding: "13px 16px", fontSize: "0.92rem",
              border: "1.5px solid #e5e7eb", borderRadius: 12,
              outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              transition: "border-color 0.15s ease",
            }}
            onFocus={e => e.target.style.borderColor = "#1B4D3E"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem", color: "#dc2626" }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem", color: "#16a34a" }}>
              {message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "12px", borderRadius: 12,
              border: "1.5px solid #e5e7eb", background: "white",
              fontSize: "0.88rem", fontWeight: 600, cursor: "pointer",
              color: "#374151", fontFamily: "inherit", transition: "all 0.15s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "none",
              background: loading ? "#9ca3af" : "linear-gradient(135deg, #1B4D3E, #2A735E)",
              color: "white", fontSize: "0.88rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "all 0.15s ease",
            }}>
              {loading ? "Sending…" : "Send Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main LoginForm ───────────────────────────────────────────────
export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendPasswordReset } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  function validate() {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const user = await login({ email: formData.email, password: formData.password });
      const frontendRole = toFrontendRole(user.role);
      const destination = location.state?.from || getRoleDestination(frontendRole);
      navigate(destination, { replace: true });
    } catch (err) {
      setFormError(err.message || "Couldn't log in. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendReset(e) {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordReset(forgotEmail);
      setForgotMessage("Reset link sent! Check your inbox or spam folder.");
    } catch (err) {
      setForgotError(err.message || "Failed to send reset email.");
    } finally {
      setForgotLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    if (formError) setFormError("");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── LEFT PANEL (desktop) ─────────────────────── */}
      <div style={{
        width: "42%", minHeight: "100vh",
        background: "#0d2b1f",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "52px 52px 0 52px",
        position: "relative", overflow: "hidden", flexShrink: 0,
      }} className="login-left-panel">
        <Slideshow />

        {/* Content above slideshow */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Link to="/" style={{ display: "flex", itemsCenter: "center", gap: 10, textDecoration: "none", marginBottom: 52 }}>
            <TerraLogo />
            <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "white", letterSpacing: "-0.01em" }}>TerraMatch</span>
          </Link>

          <h2 style={{
            fontSize: "2rem", fontWeight: 800, color: "white",
            lineHeight: 1.22, letterSpacing: "-0.02em", marginBottom: 16,
          }}>
            Land and contractors<br />
            <span style={{
              background: "linear-gradient(90deg, #6ee7b7, #34d399)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>you can actually trust.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", lineHeight: 1.65, maxWidth: 300, marginBottom: 32 }}>
            Ghana's most trusted platform for verified land, contractors, and transparent real estate.
          </p>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
            {TRUST_POINTS.map(p => (
              <li key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckIcon />
                <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.87rem" }}>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 1, paddingBottom: 110 }}>
          <p style={{ marginTop: 48, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
            © {new Date().getFullYear()} TerraMatch. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ───────────────────────── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#fafafa",
        padding: "48px 24px",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(27,77,62,0.04) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(110,231,183,0.05) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />

        <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36, justifyContent: "center" }}
            className="login-mobile-logo">
            <TerraLogo />
            <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "#111" }}>TerraMatch</span>
          </div>

          {/* Card */}
          <div style={{
            background: "white", borderRadius: 24,
            boxShadow: "0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.06)",
            padding: "40px 36px",
          }}>
            {/* Heading */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#111", marginBottom: 6, letterSpacing: "-0.02em" }}>
                Welcome back
              </h1>
              <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.5 }}>
                Sign in to your TerraMatch account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              <InputField
                id="email"
                label="Email address"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
                icon={<MailIcon />}
              />

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <label htmlFor="password" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", letterSpacing: "0.01em" }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(formData.email); setShowForgotModal(true); }}
                    style={{
                      background: "none", border: "none", padding: 0,
                      fontSize: "0.78rem", fontWeight: 600, color: "#1B4D3E",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <InputField
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  autoComplete="current-password"
                  icon={<LockIcon />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        background: "none", border: "none", padding: 0,
                        cursor: "pointer", color: "#9ca3af", display: "flex",
                        alignItems: "center", transition: "color 0.15s ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#1B4D3E"}
                      onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  }
                />
              </div>

              {/* Global error */}
              {formError && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 12, padding: "12px 16px",
                  fontSize: "0.85rem", color: "#dc2626", lineHeight: 1.45,
                }}>
                  {formError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%", padding: "14px",
                  borderRadius: 13, border: "none",
                  background: isSubmitting
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #1B4D3E 0%, #2A735E 100%)",
                  color: "white", fontSize: "0.95rem", fontWeight: 700,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s ease",
                  boxShadow: isSubmitting ? "none" : "0 4px 16px rgba(27,77,62,0.3)",
                  marginTop: 4,
                }}
                onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {isSubmitting ? "Signing in…" : <>Sign In <ArrowRightIcon /></>}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              <span style={{ fontSize: "0.78rem", color: "#9ca3af", whiteSpace: "nowrap" }}>new to TerraMatch?</span>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            </div>

            {/* Sign up */}
            <Link
              to="/get-started"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", padding: "13px", borderRadius: 13,
                border: "1.5px solid #e5e7eb", background: "white",
                color: "#111", fontSize: "0.9rem", fontWeight: 600,
                textDecoration: "none", transition: "all 0.15s ease",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#1B4D3E";
                e.currentTarget.style.color = "#1B4D3E";
                e.currentTarget.style.background = "#f0fdf4";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#111";
                e.currentTarget.style.background = "white";
              }}
            >
              Create a free account
            </Link>
          </div>

          {/* Trust badge */}
          <div style={{
            marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 7, color: "#9ca3af", fontSize: "0.75rem",
          }}>
            <svg viewBox="0 0 20 20" style={{ width: 14, height: 14, fill: "none", stroke: "#6ee7b7" }}>
              <path d="M10 2l2.4 5.3H18l-4.5 3.6 1.7 5.4L10 13.1l-5.2 3.2 1.7-5.4L2 7.3h5.6z" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <span>Protected by Firebase Authentication</span>
          </div>

        </div>
      </div>

      {/* ── Forgot Password Modal ─────────────────────── */}
      {showForgotModal && (
        <ForgotModal
          forgotEmail={forgotEmail}
          setForgotEmail={setForgotEmail}
          onClose={() => { setShowForgotModal(false); setForgotMessage(""); setForgotError(""); }}
          onSend={handleSendReset}
          loading={forgotLoading}
          message={forgotMessage}
          error={forgotError}
        />
      )}

      {/* ── Responsive: hide left panel on mobile ─────── */}
      <style>{`
        @media (max-width: 1023px) {
          .login-left-panel { display: none !important; }
          .login-mobile-logo { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .login-mobile-logo { display: none !important; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
