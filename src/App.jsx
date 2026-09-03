import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import AppRoutes from "./routes/AppRoutes";
import EmailVerificationBanner from "./components/common/EmailVerificationBanner";
import FloatingAiWidget from "./components/ai/FloatingAiWidget";
import LoadingScreen from "./components/common/LoadingScreen";
import { useAuth, GHANA_CARD_REQUIRED_ROLES } from "./context/AuthContext";

// No route-based authed overrides — the Navbar shows the correct
// signed-in state based solely on the real session (isAuthed).

// Routes that render without the marketing site's Navbar/Footer, each
// managing its own full-screen layout instead:
//  - the auth flow (signup's 3 steps + login) — every one of these
//    screenshots shows just a "← Back" link, no site chrome at all
//  - the "in-app" screens (Dashboard, Messages) — their own header +
//    MobileTabBar bottom nav (components/common/MobileTabBar.jsx)
const CHROMELESS_ROUTES = [
  "/get-started",
  "/get-started/form",
  "/get-started/ghana-card",
  "/get-started/verify",
  "/login",
  "/dashboard",
  "/messages",
  "/post-a-project",
  "/list-your-land",
  "/admin",
  "/admin/login",
];

// Routes that only make sense for a signed-out visitor. Every "Post a
// Project" / "List Your Land" / "Get Started" / "Log In" CTA across
// the site (CustomProjectBanner, ListLandBanner, pricing cards, the
// navbar, etc.) points here, same as before login existed. The bug
// this fixes: none of those links checked whether the visitor was
// already signed in, so a logged-in land owner or contractor clicking
// "Post a Project" — from the bidding pages, a listing, anywhere —
// got dropped into the signup wizard instead of actually doing the
// thing they clicked. AuthContext's isAuthed never changed (they were
// never logged out), but landing back on a signup/login screen reads
// exactly like being signed out.
//
// Fixing every individual link is unnecessary and easy to miss one of
// — this guard catches all of them (and any future ones) in one
// place: if someone who is already authed reaches any of these
// routes, send them to Dashboard instead of rendering the auth flow.
//
// /get-started/ghana-card is deliberately NOT here — unlike the rest of
// the signup flow, it's also the destination for an already-signed-in
// user who still needs to finish verification (see
// GHANA_CARD_GATED_ROUTES below). Bouncing it to Dashboard would loop
// that redirect forever.
const AUTH_ONLY_ROUTES = ["/get-started", "/get-started/form", "/get-started/verify", "/login"];

// The reverse case: these pages are authenticated actions (posting a
// project, listing land, messaging) and assume a signed-in identity —
// /messages in particular is where Buy Now always ends up now (see
// BuyNowModal.jsx), and a conversation genuinely needs to know who
// "you" are. A signed-out visitor reaching any of these (bookmark,
// shared link, back button) gets sent to Login instead of a screen
// that doesn't make sense for a guest.
const REQUIRES_AUTH_ROUTES = ["/post-a-project", "/list-your-land", "/messages"];

// Routes tied to the Land Owner / Contractor identity specifically —
// unlike Dashboard's "explore" cards (open to anyone signed in),
// actually listing land for sale assumes the lister's identity has been
// verified, since that's the whole point of Ghana Card verification.
// A signed-in Land Owner/Contractor who hasn't finished verification
// yet (e.g. closed the tab mid-signup, or an old session from before
// this flow existed) gets sent to finish it instead of silently
// bypassing the requirement by typing the URL directly. This does not
// block General Users, who never require Ghana Card verification in
// the first place — see GHANA_CARD_REQUIRED_ROLES.
const GHANA_CARD_GATED_ROUTES = ["/list-your-land"];

export default function App() {
  const { pathname } = useLocation();
  const { isAuthed, isLoading, role, ghanaCardVerified } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Elegant minimum splash display on initial site entry
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const authed = isAuthed;
  const isChromeless = CHROMELESS_ROUTES.includes(pathname);
  const roleRequiresGhanaCard = GHANA_CARD_REQUIRED_ROLES.includes(role);

  if (isLoading || initialLoading) {
    return <LoadingScreen />;
  }

  if (isAuthed && AUTH_ONLY_ROUTES.includes(pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isAuthed && REQUIRES_AUTH_ROUTES.includes(pathname)) {
    return <Navigate to="/login" state={{ from: pathname }} replace />;
  }

  // Signed in, but this role needs Ghana Card verification and hasn't
  // completed it, and they're headed to a gated route — finish
  // verification first, then land exactly where they meant to go.
  if (
    isAuthed &&
    roleRequiresGhanaCard &&
    !ghanaCardVerified &&
    GHANA_CARD_GATED_ROUTES.includes(pathname)
  ) {
    return (
      <Navigate to={`/get-started/ghana-card?role=${role}`} state={{ from: pathname }} replace />
    );
  }

  if (isChromeless) {
    return (
      <>
        <EmailVerificationBanner />
        <AppRoutes />
        {pathname !== "/ai" && <FloatingAiWidget />}
      </>
    );
  }

  const hideFooterRoutes = ["/ai"];
  const shouldHideFooter = hideFooterRoutes.includes(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <EmailVerificationBanner />
      <Navbar authed={authed} />
      <main className="flex-1">
        <AppRoutes />
      </main>
      {pathname !== "/ai" && <FloatingAiWidget />}
      {!shouldHideFooter && <Footer />}
    </div>
  );
}
