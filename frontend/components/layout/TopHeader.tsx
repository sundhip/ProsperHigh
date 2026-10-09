"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getStoredUser, UserSession } from "@/lib/auth";
import { getLiveTicker, searchStocks } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";
import {
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  Sun,
  Moon,
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
  Command,
  X
} from "lucide-react";

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();

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

  const getBreadcrumbName = (path: string) => {
    if (path === "/") return "Dashboard";
    const segment = path.split("/")[1] || "";
    switch (segment) {
      case "portfolio": return "Portfolio Workspace";
      case "watchlist": return "Watchlist";
      case "analyze": return "Analyze Workspace";
      case "compare": return "Instrument Compare";
      case "market-intelligence": return "Market Intelligence";
      case "research": return "Research Terminal";
      case "decisions": case "history": return "Decisions & History";
      case "alerts": return "Alerts";
      case "profile": return "Investor Profile";
      case "settings": return "Settings";
      case "help": return "Help & Documentation";
      default: return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 transition-colors">
      {/* 1. Market Ticker Strip */}
      <div className="bg-slate-50 dark:bg-slate-950 px-4 py-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] overflow-x-auto whitespace-nowrap">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
            {tickerInfo.status || "Market Feed"}
          </span>
        </div>

        <div className="flex items-center space-x-5 mx-4 font-mono font-medium">
          {ticker.map((item) => (
            <div
              key={item.symbol}
              className="inline-flex items-center space-x-1.5 cursor-pointer hover:text-[#C9A96E] dark:hover:text-sky-400 transition-colors"
              onClick={() => router.push(`/analyze?symbol=${item.symbol}`)}
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">{item.symbol}</span>
              <span className="text-slate-600 dark:text-slate-400 tabular-nums">₹{item.price}</span>
              <span
                className={`flex items-center text-[10px] font-bold tabular-nums ${
                  item.change_pct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {item.change_pct >= 0 ? "+" : ""}{item.change_pct}%
              </span>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 flex items-center space-x-1 font-sans">
          <Clock className="w-3 h-3 inline mr-1" />
          <span>{tickerInfo.as_of ? `${tickerInfo.as_of}` : "Live Feed"}</span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="px-5 py-2.5 flex items-center justify-between gap-4">
        {/* Context Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          {pathname !== "/" && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span className="text-slate-900 dark:text-white font-bold">
                {getBreadcrumbName(pathname)}
              </span>
            </>
          )}
        </div>

        {/* Global Search with Live Popover */}
        <div ref={searchRef} className="relative max-w-md w-full hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
              placeholder="Search universe, filings, or symbols (e.g. RELIANCE, TCS)..."
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Popover */}
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Instruments
              </div>
              {searchResults.length > 0 ? (
                searchResults.map((s) => (
                  <div
                    key={s.symbol}
                    onClick={() => handleSelectStock(s.symbol)}
                    className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{s.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{s.sector}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{s.name}</div>
                    </div>
                    {s.price && (
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">₹{s.price}</div>
                        {typeof s.change_pct === "number" && (
                          <div className={`text-[10px] font-bold tabular-nums ${s.change_pct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {s.change_pct >= 0 ? "+" : ""}{s.change_pct}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isSearching ? "Searching universe..." : `No results found for "${searchQuery}"`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Alerts Bell Link */}
          <Link
            href="/alerts"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative"
            title="View Alerts"
            aria-label="View Alerts"
          >
            <Bell className="w-4 h-4" />
          </Link>

          {/* Theme Switcher Button */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* User Profile Avatar Link */}
          {user ? (
            <Link
              href="/profile"
              className="flex items-center space-x-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-sky-600 flex items-center justify-center font-bold text-xs">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden md:inline">
                {user.name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 bg-slate-900 dark:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
