import { Link } from "react-router-dom";
import { FOOTER_COLUMNS } from "../../constants/navigation";
import Logo from "../common/Logo";
import { useAuth, useGetStartedTarget } from "../../context/AuthContext";

export default function Footer() {
  const { isAuthed } = useAuth();
  const getStartedTarget = useGetStartedTarget();

  return (
    <footer 
      className="relative flex flex-col w-full font-sans bg-cover bg-right overflow-hidden"
      style={{ backgroundImage: "url('/assets/construction-bg.png')" }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#064E3B] via-[#064E3B]/90 to-transparent z-0" aria-hidden="true" />
      
      {/* Mobile Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#064E3B] via-[#064E3B]/90 to-black/60 z-0 lg:hidden" aria-hidden="true" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Column 1 (Brand & Actions) */}
          <div className="lg:col-span-5 flex flex-col pr-4">
            <div className="flex items-center gap-3 mb-1">
              <Logo className="h-10 w-10 text-emerald-400" />
              <span className="text-3xl font-bold text-white tracking-tight">TerraMatch</span>
            </div>
            <p className="text-base font-medium text-white mb-6">
              Build Smarter. Live Better
            </p>
            <p className="max-w-sm text-lg leading-snug text-white mb-8">
              AI powered platform for<br />
              contractor recommendation,<br />
              land analysis and transparent<br />
              bidding.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to={getStartedTarget} 
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-base font-bold text-[#064E3B] transition-colors hover:bg-slate-100"
              >
                {isAuthed ? "Go to Dashboard" : "Get Started"}
              </Link>
              <Link 
                to="/explore-land" 
                className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-6 py-2.5 text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                Explore Platform
              </Link>
            </div>
          </div>

          {/* Spacer for layout */}
          <div className="hidden lg:block lg:col-span-2" />

          {/* Columns 2 & 3 (Links) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-8 sm:gap-12 pt-2">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col">
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {column.title}
                </h3>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="text-lg font-medium text-white transition-colors hover:opacity-80"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black py-5 relative z-20 w-full">
        <div className="w-full max-w-7xl mx-auto px-6">
          <p className="text-center text-[15px] font-medium text-white">
            © 2026 TerraMatch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
