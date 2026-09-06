import { cn } from "../../utils/cn";
import {
  LayoutDashboardIcon,
  UsersIcon,
  MapIcon,
  BuildingIcon,
  FolderGit2Icon,
  GavelIcon,
  ShieldCheckIcon,
  FileTextIcon,
  BarChart3Icon,
  BellIcon,
  ActivityIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
  MessageCircleIcon,
  LifeBuoyIcon
} from "./AdminIcons";

const MAIN_NAV = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboardIcon },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "land_owners", label: "Land Owners", icon: MapIcon },
  { id: "contractors", label: "Contractors", icon: BuildingIcon },
  { id: "listings", label: "Land Listings", icon: FolderGit2Icon },
  { id: "bids", label: "Bids", icon: GavelIcon },
  { id: "projects", label: "Projects", icon: FolderGit2Icon },
  { id: "verifications", label: "Verification", icon: ShieldCheckIcon },
  { id: "chats", label: "Chat Moderation", icon: MessageCircleIcon },
  { id: "support", label: "Support Inbox", icon: LifeBuoyIcon },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3Icon },
  { id: "notifications", label: "Notifications", icon: BellIcon },
  { id: "audit_logs", label: "Audit Logs", icon: ActivityIcon },
];

const SYSTEM_NAV = [
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "profile", label: "Admin Profile", icon: UserIcon },
];

import { Link } from "react-router-dom";

export default function AdminSidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <aside className="hidden lg:flex w-[250px] flex-col bg-[#111827] border-r border-slate-800">
      {/* Brand */}
      <div 
        onClick={() => setActiveTab("overview")}
        className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/20 transition-colors"
        title="Admin Overview Dashboard"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/20 text-xs">
          TM
        </span>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-white tracking-wide leading-tight">
            TerraMatch
          </span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Admin Portal
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
        
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {MAIN_NAV.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-emerald-600/10 text-emerald-500 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-500" : "text-slate-500")} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            System
          </p>
          <nav className="space-y-1">
            {SYSTEM_NAV.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-emerald-600/10 text-emerald-500 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-500" : "text-slate-500")} />
                  {item.label}
                </button>
              );
            })}
            
            {/* Divider */}
            <div className="h-px bg-slate-800 my-4 mx-3" />

            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOutIcon className="h-4 w-4 shrink-0 text-slate-500" />
              Sign Out
            </button>
          </nav>
        </div>

      </div>
    </aside>
  );
}
