"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, UserSession } from "@/lib/auth";
import { getLiveTicker } from "@/lib/api";
import { Search, Bell, TrendingUp, TrendingDown, Sun, ShieldCheck } from "lucide-react";

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [ticker, setTicker] = useState<any[]>([]);
  const [tickerInfo, setTickerInfo] = useState<{ as_of?: string; status?: string; provider?: string }>({});
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/analyze?symbol=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
      {/* 1. Top Stock Ticker Bar */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-400 uppercase tracking-wider">{tickerInfo.status || "Market Feed Active"}</span>
        </div>

        <div className="flex items-center space-x-6 mx-4 font-mono font-medium">
          {ticker.map((item) => (
            <div key={item.symbol} className="inline-flex items-center space-x-1.5 cursor-pointer hover:text-accent" onClick={() => router.push(`/analyze?symbol=${item.symbol}`)}>
              <span className="font-bold text-slate-200">{item.symbol}</span>
              <span className="text-slate-300">₹{item.price}</span>
              <span className={`flex items-center text-[10px] font-bold ${item.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {item.change_pct >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {item.change_pct >= 0 ? "+" : ""}{item.change_pct}%
              </span>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-slate-400 shrink-0 font-sans">
          {tickerInfo.as_of ? `${tickerInfo.as_of} • ${tickerInfo.provider || "NSE"}` : "NSE Live Feed"}
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        {/* User Greeting */}
        <div>
          <h1 className="text-base font-extrabold font-manrope text-white flex items-center space-x-2">
            <span>Good Morning, {user?.name || "Guest"}</span>
            <span className="text-base">👋</span>
          </h1>
          <p className="text-xs text-slate-400">Here's what's happening with your personalized investments today.</p>
        </div>

        {/* Global Search Input */}
        <form onSubmit={handleSearch} className="relative max-w-md w-full hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stocks, companies, or topics (e.g. RELIANCE, TCS)..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </form>

        {/* Action Icons & Profile Badge */}
        <div className="flex items-center space-x-3">
          <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 relative transition-colors">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-accent absolute top-1.5 right-1.5" />
          </button>

          {user && (
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-slate-200">Authenticated</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
