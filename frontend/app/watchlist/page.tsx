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
            <Star className="w-5 h-5 text-accent" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary font-display">
              Securities Watchlist
            </h1>
          </div>
          <p className="text-xs text-secondary-muted mt-0.5">
            Track monitored securities with live quotes and direct paths to 7-agent AI investigation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-secondary-muted">
            {watchlist.length} Securities Monitored
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-accent/10 border border-accent/20 text-accent rounded-xl text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-negative/10 border border-negative/20 text-negative rounded-xl text-xs flex items-center space-x-2 font-medium">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add Instrument Bar */}
      <div className="prosper-card p-5 space-y-3">
        <div className="text-xs font-bold text-secondary uppercase tracking-wider">
          Add Instrument to Watchlist
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-secondary-muted absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search ticker symbol or company name (e.g. INFY, TCS)..."
              className="w-full bg-surface-elevated border border-subtle rounded-xl pl-9 pr-4 py-2 text-xs text-primary placeholder-secondary-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />

            {/* Quick search dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-subtle rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto">
                {searchResults.map((s) => (
                  <div
                    key={s.symbol}
                    onClick={() => handleAdd(s.symbol)}
                    className="p-3 hover:bg-surface-elevated flex items-center justify-between cursor-pointer border-b border-subtle last:border-0"
                  >
                    <div>
                      <span className="font-bold text-xs text-primary">{s.symbol}</span>
                      <span className="text-[11px] text-secondary-muted ml-2">{s.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {s.price && <span className="font-mono text-xs font-bold text-primary tabular-nums">₹{s.price}</span>}
                      <button className="px-2.5 py-1 bg-accent text-accent-foreground rounded-full text-[10px] font-bold">
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
              className="w-full bg-surface-elevated border border-subtle rounded-xl px-3 py-2 text-xs text-primary placeholder-secondary-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center space-x-2 pt-1 text-xs">
          <span className="text-secondary-muted text-[11px]">Popular universe:</span>
          {SUGGESTIONS.map((sym) => (
            <button
              key={sym}
              onClick={() => handleAdd(sym)}
              className="px-2.5 py-0.5 rounded-full bg-surface-elevated border border-subtle hover:border-accent text-secondary hover:text-primary text-[10px] font-bold transition-colors"
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
                <tr className="border-b border-subtle text-secondary-muted font-semibold uppercase text-[10px] tracking-wider bg-surface-elevated/40">
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">1D Change</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-subtle font-medium">
                {watchlist.map((item) => {
                  const isPositive = typeof item.change_pct === "number" && item.change_pct >= 0;
                  return (
                    <tr key={item.id} className="hover:bg-surface-elevated/60 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/analyze?symbol=${item.symbol}`}
                          className="font-bold text-sm text-primary hover:text-accent transition-colors"
                        >
                          {item.symbol}
                        </Link>
                        <div className="text-[11px] text-secondary-muted">{item.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-elevated border border-subtle text-secondary">
                          {item.sector || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary tabular-nums">
                        {item.current_price ? `₹${Number(item.current_price).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {typeof item.change_pct === "number" ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${isPositive ? "bg-accent/10 text-accent border border-accent/20" : "bg-negative/10 text-negative border border-negative/20"}`}>
                            {isPositive ? "+" : ""}{item.change_pct.toFixed(2)}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 text-secondary text-xs max-w-xs truncate">
                        {item.notes || <span className="text-secondary-muted italic">No notes</span>}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/analyze?symbol=${item.symbol}`}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Investigate</span>
                        </Link>
                        <button
                          onClick={() => handleRemove(item.symbol)}
                          className="p-1.5 text-secondary-muted hover:text-negative transition-colors rounded-full hover:bg-surface-elevated"
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
          icon={<Star className="w-8 h-8 text-accent" />}
          title="Watchlist is Empty"
          description="Add securities using the search bar above to monitor stock movements and stay ahead of key filing disclosures."
        />
      )}
    </div>
  );
}
