import { useState, useEffect, useRef } from "react";
import { SearchIcon, BellIcon } from "./AdminIcons";
import { adminApi } from "../../services/authApi";
import { useSystemStatus } from "../../context/SystemStatusContext";
import { cn } from "../../utils/cn";

export default function AdminHeader({ user, onOpenProfile }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { isShutdown } = useSystemStatus();

  useEffect(() => {
    adminApi.listNotifications()
      .then(res => setNotifications(res || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await adminApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#111827]/80 px-4 sm:px-6 backdrop-blur-md">
      
      {/* Search Bar - Center/Leftish */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <SearchIcon className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search users, contractors, listings..."
            className="block w-full rounded-md border border-slate-700 bg-slate-800/50 py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <kbd className="hidden rounded bg-slate-800 px-2 py-0.5 text-xs font-sans text-slate-400 sm:inline-block border border-slate-700">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Live Platform Operational Status Indicator */}
        <div
          className={cn(
            "hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border",
            isShutdown
              ? "border-rose-500/40 bg-rose-500/10 text-rose-400 animate-pulse"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          )}
          title={isShutdown ? "Platform is Shut Down - Public Access Suspended" : "Platform is Online & Operational"}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isShutdown ? "bg-rose-500" : "bg-emerald-500"
            )}
          />
          <span>{isShutdown ? "Site: Shut Down" : "Site: Online"}</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4 relative">
        <div ref={dropdownRef} className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#111827]" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-slate-700">
              <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-200">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-sm">No notifications</div>
                ) : (
                  <ul className="divide-y divide-slate-700/50">
                    {notifications.map((notif) => (
                      <li key={notif.id} className={`p-4 hover:bg-slate-700/50 transition-colors ${notif.isRead ? 'opacity-60' : 'bg-slate-800/80'}`}>
                        <div className="flex justify-between items-start">
                          <p className={`text-sm ${notif.isRead ? 'text-slate-300' : 'text-slate-100 font-medium'}`}>
                            {notif.message}
                          </p>
                          {!notif.isRead && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                              className="text-emerald-400 hover:text-emerald-300 text-xs ml-3 shrink-0"
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* Clickable Admin Profile Button */}
        <button
          onClick={onOpenProfile}
          title="Open Admin Profile & Revenue Analytics"
          className="group flex items-center gap-3 rounded-xl p-1.5 pr-2.5 text-left hover:bg-slate-800/70 border border-transparent hover:border-slate-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-200 leading-tight group-hover:text-emerald-400 transition-colors">
              {user?.name || "Admin"}
            </p>
            <p className="text-[11px] text-slate-500 group-hover:text-slate-400">View Profile & Revenue</p>
          </div>
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 border border-emerald-500/80 text-emerald-300 font-bold text-sm shadow-inner group-hover:scale-105 group-hover:border-emerald-400 transition-all">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#111827]" />
          </div>
        </button>
      </div>
    </header>
  );
}
