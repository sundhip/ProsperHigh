"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWatchlist, addToWatchlist, removeFromWatchlist, searchStocks } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Star,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSymbol, setAddingSymbol] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchList = async () => {
    try {
      const res = await getWatchlist();
      setWatchlist(res.items || []);
    } catch (err: any) {
      setErrorMsg("Failed to load watchlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchStocks(val.trim());
      setSearchResults(res.stocks || []);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (symbol: string) => {
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      await addToWatchlist(symbol, notes);
      setFeedbackMsg(`Added ${symbol} to watchlist.`);
      setSearchQuery("");
      setSearchResults([]);
      setNotes("");
      fetchList();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add symbol.");
    }
  };

  const handleRemove = async (symbol: string) => {
    setErrorMsg(null);
    try {
      await removeFromWatchlist(symbol);
      setFeedbackMsg(`Removed ${symbol} from watchlist.`);
      fetchList();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove symbol.");
    }
  };

  const SUGGESTIONS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS"];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-[#C9A96E]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              Securities Watchlist
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track monitored securities with live quotes and direct paths to 7-agent AI investigation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {watchlist.length} Securities Monitored
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center space-x-2">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add Instrument Bar */}
      <div className="prosper-card p-4 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Add Instrument to Watchlist
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search ticker symbol or company name (e.g. INFY, TCS)..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500"
            />

            {/* Quick search dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
                {searchResults.map((s) => (
                  <div
                    key={s.symbol}
                    onClick={() => handleAdd(s.symbol)}
                    className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-700/40"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{s.symbol}</span>
                      <span className="text-[11px] text-slate-400 ml-2">{s.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {s.price && <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">₹{s.price}</span>}
                      <button className="px-2 py-1 bg-slate-900 dark:bg-sky-500 text-white rounded text-[10px] font-bold">
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note / thesis..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center space-x-2 pt-1 text-xs">
          <span className="text-slate-400 text-[11px]">Popular universe:</span>
          {SUGGESTIONS.map((sym) => (
            <button
              key={sym}
              onClick={() => handleAdd(sym)}
              className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold"
            >
              +{sym}
            </button>
          ))}
        </div>
      </div>

      {/* Watchlist Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : watchlist.length > 0 ? (
        <div className="prosper-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">1D Change</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {watchlist.map((item) => {
                  const isPositive = typeof item.change_pct === "number" && item.change_pct >= 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/analyze?symbol=${item.symbol}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-[#C9A96E] dark:hover:text-sky-400"
                        >
                          {item.symbol}
                        </Link>
                        <div className="text-[11px] text-slate-400">{item.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.sector || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {item.current_price ? `₹${Number(item.current_price).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {typeof item.change_pct === "number" ? (
                          <span className={`font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {isPositive ? "+" : ""}{item.change_pct.toFixed(2)}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">
                        {item.notes || <span className="text-slate-300 dark:text-slate-600 italic">No notes</span>}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/analyze?symbol=${item.symbol}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 dark:bg-sky-500 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Investigate</span>
                        </Link>
                        <button
                          onClick={() => handleRemove(item.symbol)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Remove from watchlist"
                          aria-label="Remove from watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Star className="w-8 h-8 text-[#C9A96E]" />}
          title="Watchlist is Empty"
          description="Add securities using the search bar above to monitor stock movements and stay ahead of key filing disclosures."
        />
      )}
    </div>
  );
}
