"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getStoredUser, UserSession } from "@/lib/auth";
import { getLiveTicker, searchStocks } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";
import { useExperience } from "@/components/ExperienceProvider";
import {
  Search,
  Bell,
  Clock,
  Sparkles,
  Command,
  X,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { mode, setMode, isBeginner } = useExperience();

  const [user, setUser] = useState<UserSession | null>(null);
  const [ticker, setTicker] = useState<any[]>([]);
  const [tickerInfo, setTickerInfo] = useState<{ as_of?: string; status?: string; provider?: string }>({});

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getStoredUser());
    getLiveTicker().then((res) => {
      setTicker(res.ticker || []);
      setTickerInfo({ as_of: res.as_of, status: res.status, provider: res.provider });
    });

    const handleAuth = () => setUser(getStoredUser());
    window.addEventListener("auth-changed", handleAuth);
    return () => window.removeEventListener("auth-changed", handleAuth);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      searchStocks(searchQuery.trim()).then((res) => {
        setSearchResults(res.stocks || []);
        setIsSearching(false);
        setSearchOpen(true);
      });
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside to close search popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectStock = (symbol: string) => {
    router.push(`/analyze?symbol=${encodeURIComponent(symbol)}`);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const getPageTitle = (path: string) => {
    if (path === "/") {
      return user ? `Welcome back, ${user.name?.split(" ")[0] || "Investor"}` : "Dashboard";
    }
    const segment = path.split("/")[1] || "";
    switch (segment) {
      case "portfolio": return "Portfolio Workspace";
      case "watchlist": return "Watchlist";
      case "analyze": return "Analyze Workspace";
      case "compare": return "Instrument Compare";
      case "market-intelligence": return "Market Intelligence";
      case "research": return "Research Terminal";
      case "decisions": case "history": return "Decisions & History";
      case "alerts": return "Alerts & Notifications";
      case "profile": return "Investor Profile";
      case "settings": return "Settings & Preferences";
      case "help": return "Help & Documentation";
      default: return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md pb-2 pt-1 transition-colors">
      {/* 1. Main Navigation Bar with greeting, pill search, and controls */}
      <div className="flex items-center justify-between gap-4 py-2 px-1">
        {/* Left Page Title / Greeting (Ref A & C) */}
        <div className="min-w-0 pl-10 md:pl-0">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display text-primary truncate">
            {getPageTitle(pathname)}
          </h1>
          <p className="text-xs text-secondary-muted hidden sm:block truncate mt-0.5">
            {pathname === "/" ? "Unified portfolio, multi-agent intelligence, and market feed" : "Real-time decision intelligence"}
          </p>
        </div>

        {/* Center: Pill Search Bar with ⌘K Hint (Ref B & D) */}
        <div ref={searchRef} className="relative max-w-sm w-full hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-secondary-muted absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
              placeholder="Search anything (TCS, RELIANCE)..."
              className="w-full bg-surface-elevated border border-border-subtle rounded-full pl-9 pr-14 py-2 text-xs text-primary placeholder-secondary-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }}
                className="absolute right-3.5 top-2.5 text-secondary-muted hover:text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="absolute right-3 top-2 flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full bg-surface text-[10px] text-secondary-muted border border-border-subtle pointer-events-none">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            )}
          </div>

          {/* Search Results Floating Card (Ref B) */}
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              <div className="p-2.5 border-b border-border-subtle text-[10px] font-bold text-secondary-muted uppercase tracking-wider">
                Matching Instruments
              </div>
              {searchResults.length > 0 ? (
                searchResults.map((s) => (
                  <div
                    key={s.symbol}
                    onClick={() => handleSelectStock(s.symbol)}
                    className="p-3 hover:bg-surface-elevated flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-primary">{s.symbol}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-secondary font-medium">{s.sector}</span>
                      </div>
                      <div className="text-[11px] text-secondary-muted mt-0.5">{s.name}</div>
                    </div>
                    {s.price && (
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-primary tabular-nums">₹{s.price}</div>
                        {typeof s.change_pct === "number" && (
                          <div className={`text-[10px] font-bold tabular-nums ${s.change_pct >= 0 ? "text-accent" : "text-negative"}`}>
                            {s.change_pct >= 0 ? "+" : ""}{s.change_pct}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-secondary-muted">
                  {isSearching ? "Searching universe..." : `No results found for "${searchQuery}"`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Header Controls: Mode pill, notification bell with red dot, avatar (Ref B & C) */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Experience Mode Toggle Pill */}
          <button
            onClick={() => setMode(isBeginner ? "advanced" : "beginner")}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-border-subtle bg-surface hover:bg-surface-elevated text-xs font-semibold text-primary transition-colors"
            title={isBeginner ? "Switch to Advanced Experience (Full Quant Detail)" : "Switch to Beginner Experience (Guided Views)"}
            aria-label="Toggle Experience Mode"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isBeginner ? "text-accent-yellow" : "text-accent"}`} />
            <span className="capitalize">{mode} Mode</span>
          </button>

          {/* Notifications Bell with dot (Ref B & C) */}
          <Link
            href="/alerts"
            className="p-2.5 rounded-full bg-surface border border-border-subtle hover:bg-surface-elevated text-secondary transition-colors relative"
            title="View Alerts"
            aria-label="View Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-negative rounded-full ring-2 ring-surface" />
          </Link>

          {/* User Profile Avatar Link (Ref C) */}
          {user ? (
            <Link
              href="/profile"
              className="flex items-center space-x-2 p-1 pl-1.5 rounded-full bg-surface border border-border-subtle hover:bg-surface-elevated transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-accent text-black flex items-center justify-center font-bold text-xs">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <span className="text-xs font-bold text-primary hidden md:inline pr-2">
                {user.name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-black rounded-full text-xs font-extrabold shadow-sm transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* 2. Slim Market Ticker Scrolling Chip Row (Ref A & D) */}
      {ticker.length > 0 && (
        <div className="mt-1 flex items-center space-x-2 overflow-x-auto py-1 scrollbar-none no-scrollbar">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-surface border border-border-subtle text-[10px] font-bold text-secondary-muted shrink-0 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>{tickerInfo.status || "NSE Live"}</span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {ticker.map((item) => (
              <div
                key={item.symbol}
                onClick={() => router.push(`/analyze?symbol=${item.symbol}`)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface border border-border-subtle hover:border-border-default cursor-pointer text-xs transition-colors shrink-0"
              >
                <span className="font-bold text-primary text-[11px]">{item.symbol}</span>
                <span className="text-secondary tabular-nums text-[11px] font-mono">₹{item.price}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                    item.change_pct >= 0 ? "bg-accent/10 text-accent" : "bg-negative/10 text-negative"
                  }`}
                >
                  {item.change_pct >= 0 ? "+" : ""}{item.change_pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
