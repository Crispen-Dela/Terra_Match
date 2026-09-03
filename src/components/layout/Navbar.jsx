import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { PRIMARY_NAV } from "../../constants/navigation";
import Button from "../common/Button";
import Logo from "../common/Logo";
import { useAuth, useGetStartedTarget } from "../../context/AuthContext";
import NotificationPopover from "./NotificationPopover";
import { cn } from "../../utils/cn";

export default function Navbar({ authed = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const getStartedTarget = useGetStartedTarget();
  const initial = user?.name ? user.name[0].toUpperCase() : "U";

  function ProfileAvatar({ className }) {
    const [imgError, setImgError] = useState(false);
    
    if (user?.avatarUrl && !imgError) {
      return (
        <img
          src={user.avatarUrl}
          alt={user?.name || "User Profile"}
          className={cn(className, "rounded-full object-cover bg-forest-100")}
          onError={() => setImgError(true)}
        />
      );
    }

    return (
      <span
        className={cn(
          className,
          "flex items-center justify-center bg-forest-100 text-xs font-bold text-forest-700"
        )}
      >
        {initial}
      </span>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/5 bg-white/95 backdrop-blur">
      <div className="container-page flex h-[68px] items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={() => setIsMenuOpen(false)}
        >
          <Logo className="h-7 w-7" />
          <span className="text-lg font-bold text-ink-900">TerraMatch</span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="Primary"
        >
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "text-[15px] font-medium text-ink-700 transition-colors hover:text-ink-900",
                  isActive && "font-semibold text-forest-600 hover:text-forest-600"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {authed ? (
          <div className="hidden items-center gap-4 lg:flex">
            <Link
              to="/dashboard"
              className="text-[15px] font-medium text-ink-700 transition-colors hover:text-ink-900"
            >
              Dashboard
            </Link>
            <NotificationPopover />
            <Link to="/profile" aria-label="Your profile">
              <ProfileAvatar className="h-9 w-9 rounded-full object-cover" />
            </Link>
          </div>
        ) : (
          <div className="hidden items-center gap-3 lg:flex">
            <Button as={Link} to="/login" variant="outline-dark" size="sm">
              Log In
            </Button>
            <Button as={Link} to={getStartedTarget} variant="secondary" size="sm">
              Get Started
            </Button>
          </div>
        )}

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          {authed && (
            <NotificationPopover />
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-900"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
              {isMenuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-ink-900/5 bg-white transition-[max-height] duration-300 ease-out lg:hidden",
          isMenuOpen ? "max-h-[460px]" : "max-h-0"
        )}
      >
        <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-2 py-2.5 text-[15px] font-medium text-ink-700 hover:bg-mist-100",
                  isActive && "font-semibold text-forest-600"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          {authed ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="mt-2 rounded-lg px-2 py-2.5 text-[15px] font-medium text-ink-700 hover:bg-mist-100"
              >
                Dashboard
              </Link>
              <Link
                to="/messages"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 text-[15px] font-medium text-ink-700 hover:bg-mist-100"
              >
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current text-ink-600" aria-hidden="true">
                    <path
                      d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M13.7 21a2 2 0 01-3.4 0" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Messages
                </span>
                <span className="h-2 w-2 rounded-full bg-red-500" />
              </Link>
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-[15px] font-medium text-ink-700 hover:bg-mist-100"
              >
                <ProfileAvatar className="h-8 w-8 rounded-full object-cover" />
                Your profile
              </Link>
            </>
          ) : (
            <div className="mt-2 flex gap-3 px-2">
              <Button
                as={Link}
                to="/login"
                variant="outline-dark"
                size="sm"
                className="flex-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Log In
              </Button>
              <Button
                as={Link}
                to={getStartedTarget}
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
