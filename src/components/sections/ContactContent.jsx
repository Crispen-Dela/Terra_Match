import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import Badge from "../common/Badge";
import { useAuth } from "../../context/AuthContext";
import { supportApi, authApi } from "../../services/authApi";
import { cn } from "../../utils/cn";

function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" strokeWidth="1.4" />
      <path d="M4 6.5l8 5.5 8-5.5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path
        d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a1.5 1.5 0 01-1.6 1.5A17 17 0 015 5.1 1.5 1.5 0 016.5 3.5z"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4 5.5h16v10.5H8.5L4 19.5V5.5z" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CONTACT_METHODS = [
  {
    icon: MailIcon,
    title: "Email",
    detail: "support@terramatch.gh",
    href: "mailto:support@terramatch.gh",
  },
  {
    icon: PhoneIcon,
    title: "Phone",
    detail: "+233 30 222 1010",
    href: "tel:+233302221010",
  },
  {
    icon: ChatIcon,
    title: "Live Chat",
    detail: "Message our team directly",
    href: "/messages?contact=support",
  },
];

export default function ContactContent() {
  const { user, isAuthed } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email";
    if (!formData.message.trim()) newErrors.message = "Message can't be empty";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (isAuthed) {
        await supportApi.sendMessage(formData.message.trim());
      } else {
        await authApi.submitSupportTicket({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          subject: "Contact Us Form Inquiry",
          category: "General Inquiry",
        });
      }
      setSubmitted(true);
    } catch (err) {
      setErrors({ form: err.message || "Failed to send message. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="soft" className="mx-auto w-fit">
          Contact Us
        </Badge>
        <h1 className="mt-5 text-3xl font-extrabold text-ink-900 sm:text-4xl">
          Get in touch
        </h1>
        <p className="mt-3 text-sm text-ink-700">
          Questions about a listing, a contractor, or your account?
          We're here to help.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-8 lg:grid-cols-[1fr_1.3fr]">
        {/* Contact methods */}
        <div className="space-y-4">
          {CONTACT_METHODS.map((method) => {
            const isInternal = method.href.startsWith("/");
            const Wrapper = isInternal ? Link : "a";
            const linkProp = isInternal ? { to: method.href } : { href: method.href };
            return (
              <Wrapper
                key={method.title}
                {...linkProp}
                className="flex items-center gap-3 rounded-xl border border-ink-900/10 bg-white p-4 hover:border-forest-300 hover:shadow-card transition-all"
              >
                {(() => {
                  const Icon = method.icon;
                  return (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                  );
                })()}
                <div>
                  <p className="text-sm font-semibold text-ink-900">{method.title}</p>
                  <p className="text-xs text-ink-500">{method.detail}</p>
                </div>
              </Wrapper>
            );
          })}

          <div className="rounded-xl border border-ink-900/10 bg-mist-50 p-4">
            <p className="text-xs font-semibold text-ink-900">Support hours</p>
            <p className="mt-1 text-xs text-ink-500">Mon–Fri, 8am–6pm GMT</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
          {submitted ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                <CheckIcon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-ink-900">Message sent</h2>
              <p className="mt-1.5 max-w-xs text-sm text-ink-500">
                {isAuthed
                  ? "Thanks for reaching out — our administrative support team has received your message."
                  : "Thanks for reaching out — our team typically replies within one business day."}
              </p>
              <div className="mt-6 flex items-center gap-3">
                {isAuthed && (
                  <Link
                    to="/messages?contact=support"
                    className="inline-flex items-center justify-center rounded-lg bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-700 transition-colors"
                  >
                    Open Support Chat
                  </Link>
                )}
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg border border-ink-900/15 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-mist-50 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  {errors.form}
                </div>
              )}
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-700">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  className={cn(
                    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-500/20",
                    errors.name ? "border-red-300 focus:border-red-500" : "border-ink-900/15 focus:border-forest-500"
                  )}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className={cn(
                    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-500/20",
                    errors.email ? "border-red-300 focus:border-red-500" : "border-ink-900/15 focus:border-forest-500"
                  )}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="How can we help?"
                  value={formData.message}
                  onChange={handleChange}
                  className={cn(
                    "w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-500/20",
                    errors.message ? "border-red-300 focus:border-red-500" : "border-ink-900/15 focus:border-forest-500"
                  )}
                />
                {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
              </div>

              <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
