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
  ShieldCheck,
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
        { href: "/market-intelligence", label: "Markets", icon: Compass },
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
      group: "SYSTEM",
      items: [
        { href: "/profile", label: "Profile", icon: UserIcon },
        { href: "/settings", label: "Settings", icon: Settings },
        { href: "/help", label: "Help & Docs", icon: HelpCircle },
      ],
    },
  ];

  const sidebarContent = (
    <div
      className={`flex flex-col h-full justify-between bg-sidebar-bg text-sidebar-text border border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-20 rounded-3xl" : "w-64 rounded-3xl"
      } shadow-2xl p-4`}
    >
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-2 border-b border-sidebar-border/60">
          <Link href="/" className="flex items-center space-x-3 overflow-hidden">
            {/* Geometric brand mark like Ref A/D */}
            <div className="w-10 h-10 rounded-2xl bg-accent text-black flex items-center justify-center font-black font-display text-lg shadow-md shrink-0">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-base tracking-tight font-display text-white leading-tight">
                  Prosper<span className="text-accent">High</span>
                </span>
                <span className="text-[10px] text-sidebar-muted font-medium">
                  Financial Intelligence
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-full hover:bg-sidebar-surface text-sidebar-muted hover:text-white transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar width"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="text-[10px] font-bold text-sidebar-muted uppercase tracking-wider px-3 mb-1">
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
                    className={`flex items-center px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all group ${
                      isActive
                        ? "bg-white text-black font-extrabold shadow-sm"
                        : "text-sidebar-muted hover:text-white hover:bg-sidebar-surface"
                    } ${collapsed ? "justify-center px-2" : "justify-between"}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-black"
                            : "text-sidebar-muted group-hover:text-accent"
                        }`}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer & Controls: Profile completeness card (Ref B) + User Chip (Ref B & D) */}
      <div className="space-y-3 pt-3 border-t border-sidebar-border/60">
        {/* Profile Completeness Ring Widget (Ref B) */}
        {!collapsed && user && (
          <div className="p-3 rounded-2xl bg-sidebar-surface border border-sidebar-border/80 text-left space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-accent"
                    strokeDasharray="80, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[9px] font-bold text-white">80%</span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-white">Verified Investor</div>
                <div className="text-[9.5px] text-sidebar-muted">Profile Complete</div>
              </div>
            </div>
          </div>
        )}

        {/* Theme Pill Switcher */}
        {!collapsed ? (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-sidebar-surface rounded-full border border-sidebar-border text-xs">
            <span className="text-[10px] font-medium text-sidebar-muted">Theme</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setTheme("light")}
                className={`p-1 rounded-full ${theme === "light" ? "bg-white text-black font-bold" : "text-sidebar-muted hover:text-white"}`}
                title="Light mode"
                aria-label="Light mode"
              >
                <Sun className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1 rounded-full ${theme === "dark" ? "bg-white text-black font-bold" : "text-sidebar-muted hover:text-white"}`}
                title="Dark mode"
                aria-label="Dark mode"
              >
                <Moon className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-1 rounded-full ${theme === "system" ? "bg-white text-black font-bold" : "text-sidebar-muted hover:text-white"}`}
                title="System preference"
                aria-label="System preference"
              >
                <Laptop className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-sidebar-surface text-sidebar-muted hover:text-white transition-colors"
              title="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="w-4 h-4 text-accent-yellow" /> : <Moon className="w-4 h-4 text-white" />}
            </button>
          </div>
        )}

        {/* User Chip + Round Logout Button (Ref B & D) */}
        {user ? (
          <div className={`flex items-center justify-between p-2 rounded-2xl bg-sidebar-surface ${collapsed ? "justify-center" : ""}`}>
            <Link href="/profile" className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center font-bold text-xs shrink-0">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-white truncate">
                    {user.name || "Investor"}
                  </span>
                  <span className="text-[10px] text-sidebar-muted truncate">
                    {user.email}
                  </span>
                </div>
              )}
            </Link>

            {!collapsed && (
              <div className="flex items-center space-x-1">
                <Link
                  href="/settings"
                  className="p-1.5 rounded-full text-sidebar-muted hover:text-white hover:bg-white/10 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-full text-sidebar-muted hover:text-negative hover:bg-white/10 transition-colors"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="w-full py-2 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-full shadow transition-all text-center block"
          >
            {collapsed ? "In" : "Sign In"}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Rail */}
      <aside className="hidden md:flex flex-col shrink-0 sticky top-3 lg:top-4 h-[calc(100vh-24px)] lg:h-[calc(100vh-32px)]">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header Trigger */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-full bg-sidebar-bg text-white border border-sidebar-border shadow-lg"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-xs h-full p-3 z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
