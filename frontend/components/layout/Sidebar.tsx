"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser, clearStoredUser, UserSession } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard,
  PieChart,
  Star,
  Search,
  Scale,
  Compass,
  BookOpen,
  History,
  Bell,
  User as UserIcon,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Laptop,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";

interface Props {
  onStartTour?: () => void;
}

export const Sidebar: React.FC<Props> = ({ onStartTour }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setUser(getStoredUser());
    const handleAuth = () => setUser(getStoredUser());
    window.addEventListener("auth-changed", handleAuth);
    return () => window.removeEventListener("auth-changed", handleAuth);
  }, []);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearStoredUser();
    router.push("/login");
  };

  const navSections = [
    {
      group: "OVERVIEW",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "INVEST",
      items: [
        { href: "/portfolio", label: "Portfolio", icon: PieChart },
        { href: "/watchlist", label: "Watchlist", icon: Star },
        { href: "/analyze", label: "Analyze", icon: Search },
        { href: "/compare", label: "Compare", icon: Scale },
      ],
    },
    {
      group: "INTELLIGENCE",
      items: [
        { href: "/market-intelligence", label: "Market Intelligence", icon: Compass },
        { href: "/research", label: "Research", icon: BookOpen },
      ],
    },
    {
      group: "ACTIVITY",
      items: [
        { href: "/decisions", label: "Decisions", icon: History },
        { href: "/alerts", label: "Alerts", icon: Bell },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { href: "/profile", label: "Profile", icon: UserIcon },
        { href: "/settings", label: "Settings", icon: Settings },
        { href: "/help", label: "Help & Docs", icon: HelpCircle },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-300">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center font-black font-display text-base shadow-sm shrink-0">
              P
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-wide font-display text-slate-900 dark:text-white leading-tight">
                  PROSPER<span className="text-[#C9A96E]">HIGH</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">
                  Financial Intelligence
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar width"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-220px)]">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
                  {sec.group}
                </div>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-sky-500/20 dark:text-sky-400 shadow-sm font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                    } ${collapsed ? "justify-center px-2" : "justify-between"}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#C9A96E] dark:text-sky-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer & Controls */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
        {/* Quick Theme Switcher */}
        {!collapsed ? (
          <div className="flex items-center justify-between px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Theme</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setTheme("light")}
                className={`p-1 rounded ${theme === "light" ? "bg-slate-100 dark:bg-slate-700 text-amber-600 font-bold" : "text-slate-400 hover:text-slate-600"}`}
                title="Light mode"
                aria-label="Light mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1 rounded ${theme === "dark" ? "bg-slate-100 dark:bg-slate-700 text-sky-400 font-bold" : "text-slate-400 hover:text-slate-600"}`}
                title="Dark mode"
                aria-label="Dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-1 rounded ${theme === "system" ? "bg-slate-100 dark:bg-slate-700 text-indigo-500 font-bold" : "text-slate-400 hover:text-slate-600"}`}
                title="System preference"
                aria-label="System preference"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              title="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        )}

        {/* User Card */}
        {user ? (
          <div className={`flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 ${collapsed ? "justify-center" : ""}`}>
            <Link href="/profile" className="flex items-center space-x-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-sky-600 flex items-center justify-center font-bold text-xs shrink-0">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.name || "Investor"}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {user.email}
                  </span>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          !collapsed && (
            <Link
              href="/login"
              className="flex items-center justify-center px-3 py-1.5 bg-slate-900 dark:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Sign In
            </Link>
          )
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar Trigger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
            P
          </div>
          <span className="font-extrabold text-sm tracking-wide text-slate-900 dark:text-white font-display">
            PROSPER<span className="text-[#C9A96E]">HIGH</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          aria-label="Open mobile navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 shrink-0 z-30 transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
