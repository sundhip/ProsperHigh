"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { compareInstruments, searchStocks } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Scale,
  Plus,
  X,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Building,
  Layers,
  ArrowRight
} from "lucide-react";

export default function ComparePage() {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["RELIANCE", "TCS", "INFY"]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchComparison = async (symbols: string[]) => {
    if (symbols.length < 2) {
      setComparisonData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await compareInstruments(symbols);
      if (res && res.comparison) {
        setComparisonData(res.comparison);
      }
    } catch (err: any) {
      setErrorMsg("Failed to load instrument comparison.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison(selectedSymbols);
  }, []);

  const handleAddSymbol = (sym: string) => {
    const clean = sym.toUpperCase().trim();
    if (selectedSymbols.includes(clean)) return;
    if (selectedSymbols.length >= 4) {
      setErrorMsg("You can compare up to 4 instruments at once.");
      return;
    }
    const updated = [...selectedSymbols, clean];
    setSelectedSymbols(updated);
    setSearchQuery("");
    setSearchResults([]);
    fetchComparison(updated);
  };

  const handleRemoveSymbol = (sym: string) => {
    const updated = selectedSymbols.filter((s) => s !== sym);
    setSelectedSymbols(updated);
    fetchComparison(updated);
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await searchStocks(val.trim());
      setSearchResults(res.stocks || []);
    } catch (err) {
      setSearchResults([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-[#C9A96E]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              Instrument Comparison
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Side-by-side evaluation of real price action, sector classifications, and data completeness.
          </p>
        </div>

        {/* Selected Symbol Badges */}
        <div className="flex items-center space-x-2">
          {selectedSymbols.map((s) => (
            <span
              key={s}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <span>{s}</span>
              {selectedSymbols.length > 2 && (
                <button onClick={() => handleRemoveSymbol(s)} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* Add Symbol Input (if < 4 symbols) */}
      {selectedSymbols.length < 4 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Add another symbol to compare (e.g. HDFCBANK, TATAMOTORS)..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500"
          />

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
              {searchResults.map((s) => (
                <div
                  key={s.symbol}
                  onClick={() => handleAddSymbol(s.symbol)}
                  className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-700/40"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{s.symbol}</span>
                    <span className="text-[11px] text-slate-400 ml-2">{s.name}</span>
                  </div>
                  <button className="px-2 py-1 bg-slate-900 dark:bg-sky-500 text-white rounded text-[10px] font-bold">
                    Compare
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison Grid */}
      {loading ? (
        <CardSkeleton count={selectedSymbols.length} />
      ) : comparisonData.length >= 2 ? (
        <div className="prosper-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Metric / Indicator</th>
                  {comparisonData.map((c) => (
                    <th key={c.symbol} className="py-3 px-4 font-bold text-slate-900 dark:text-white text-base">
                      <div className="flex items-center justify-between">
                        <span>{c.symbol}</span>
                        <Link
                          href={`/analyze?symbol=${c.symbol}`}
                          className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-0.5"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Investigate</span>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {/* Company Name */}
                <tr>
                  <td className="py-3 px-4 text-slate-500 font-semibold">Security Name</td>
                  {comparisonData.map((c) => (
                    <td key={c.symbol} className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold">
                      {c.name}
                    </td>
                  ))}
                </tr>

                {/* Sector */}
                <tr>
                  <td className="py-3 px-4 text-slate-500 font-semibold">Sector Classification</td>
                  {comparisonData.map((c) => (
                    <td key={c.symbol} className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">
                        {c.sector}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Current Price */}
                <tr>
                  <td className="py-3 px-4 text-slate-500 font-semibold">Latest Price</td>
                  {comparisonData.map((c) => (
                    <td key={c.symbol} className="py-3 px-4 font-mono font-extrabold text-sm text-slate-900 dark:text-white tabular-nums">
                      {c.price ? `₹${Number(c.price).toFixed(2)}` : "—"}
                    </td>
                  ))}
                </tr>

                {/* 1D Change */}
                <tr>
                  <td className="py-3 px-4 text-slate-500 font-semibold">1D Performance</td>
                  {comparisonData.map((c) => {
                    const isPos = typeof c.change_pct === "number" && c.change_pct >= 0;
                    return (
                      <td key={c.symbol} className="py-3 px-4 font-mono font-bold tabular-nums">
                        {typeof c.change_pct === "number" ? (
                          <span className={isPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            {isPos ? "+" : ""}{c.change_pct.toFixed(2)}%
                          </span>
                        ) : "—"}
                      </td>
                    );
                  })}
                </tr>

                {/* Primary Exchange */}
                <tr>
                  <td className="py-3 px-4 text-slate-500 font-semibold">Exchange</td>
                  {comparisonData.map((c) => (
                    <td key={c.symbol} className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {c.exchange || "NSE"}
                    </td>
                  ))}
                </tr>

                {/* Data Freshness */}
                <tr>
                  <td className="py-3 px-4 text-slate-500 font-semibold">Data Freshness & Completeness</td>
                  {comparisonData.map((c) => (
                    <td key={c.symbol} className="py-3 px-4">
                      <StatusBadge
                        label={c.data_completeness}
                        variant={c.is_available && !c.is_stale ? "positive" : "warning"}
                        size="sm"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Scale className="w-8 h-8 text-[#C9A96E]" />}
          title="Select At Least Two Instruments"
          description="Use the search bar above to select securities to compare on valuation, price, and sector fundamentals."
        />
      )}
    </div>
  );
}
