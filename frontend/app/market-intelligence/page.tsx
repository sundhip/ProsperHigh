"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getMarketIntelligence } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Building,
  FileText,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck
} from "lucide-react";

export default function MarketIntelligencePage() {
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketIntelligence().then((res) => {
      setIntel(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-accent" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary font-display">
              Market Intelligence
            </h1>
          </div>
          <p className="text-xs text-secondary-muted mt-0.5">
            Macro indices, universe movers, sector rotation, and corporate statutory disclosure alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-secondary-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>Feed as of {intel?.as_of || "UTC"}</span>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <>
          {/* 1. Benchmark Indices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(intel?.benchmark_indices || []).map((idx: any) => (
              <MetricCard
                key={idx.name}
                label={idx.name}
                value={idx.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                changePct={idx.change_pct}
                changeLabel="Today"
                sublabel={`${idx.change >= 0 ? "+" : ""}${idx.change.toFixed(2)} pts`}
                icon={<Building className="w-4 h-4" />}
              />
            ))}
          </div>

          {/* 2. Top Movers: Gainers vs Losers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Gainers */}
            <div className="prosper-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-bold text-primary font-display">
                    Top Universe Gainers
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-secondary-muted">1D Percent</span>
              </div>

              <div className="divide-y border-subtle">
                {(intel?.top_gainers || []).map((stock: any) => (
                  <div key={stock.symbol} className="py-2.5 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/analyze?symbol=${stock.symbol}`}
                        className="font-bold text-xs text-primary hover:text-accent transition-colors"
                      >
                        {stock.symbol}
                      </Link>
                      <div className="text-[10px] text-secondary-muted">{stock.name} • {stock.sector}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-primary tabular-nums">
                        ₹{Number(stock.price).toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-accent tabular-nums">
                        +{stock.change_pct}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="prosper-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-negative" />
                  <h3 className="text-sm font-bold text-primary font-display">
                    Universe Declines
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-secondary-muted">1D Percent</span>
              </div>

              <div className="divide-y border-subtle">
                {(intel?.top_losers || []).length > 0 ? (
                  intel.top_losers.map((stock: any) => (
                    <div key={stock.symbol} className="py-2.5 flex items-center justify-between">
                      <div>
                        <Link
                          href={`/analyze?symbol=${stock.symbol}`}
                          className="font-bold text-xs text-primary hover:text-accent transition-colors"
                        >
                          {stock.symbol}
                        </Link>
                        <div className="text-[10px] text-secondary-muted">{stock.name} • {stock.sector}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-primary tabular-nums">
                          ₹{Number(stock.price).toFixed(2)}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-negative tabular-nums">
                          {stock.change_pct}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-secondary-muted">
                    No negative declines recorded in current universe session.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Sector Performance Overview */}
          <div className="prosper-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-primary font-display">
                  Sector Performance & Breadth
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-secondary-muted">Weighted Average</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(intel?.sector_performance || []).map((sec: any) => {
                const isPos = sec.avg_change_pct >= 0;
                return (
                  <div
                    key={sec.sector}
                    className="p-3 rounded-2xl border border-subtle bg-surface-elevated/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-primary">{sec.sector}</div>
                      <div className="text-[10px] text-secondary-muted">{sec.stock_count} tracked instruments</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold tabular-nums ${
                          isPos ? "text-accent" : "text-negative"
                        }`}
                      >
                        {isPos ? "+" : ""}{sec.avg_change_pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Statutory Filing Disclosures Feed */}
          <div className="prosper-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-secondary-muted" />
                <h3 className="text-sm font-bold text-primary font-display">
                  Exchange Statutory Disclosures & Filings
                </h3>
              </div>
              <Link
                href="/research"
                className="text-xs font-bold text-accent hover:underline flex items-center space-x-1"
              >
                <span>Document Reader</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(intel?.recent_filings || []).map((filing: any) => (
                <div
                  key={filing.id}
                  className="p-4 rounded-2xl border border-subtle bg-surface-elevated/40 flex flex-col justify-between space-y-2 hover:border-accent/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold px-2.5 py-0.5 rounded-full bg-surface-elevated border border-subtle text-primary">
                        {filing.symbol}
                      </span>
                      <span className="text-secondary-muted">{filing.reporting_period || "Statutory"}</span>
                    </div>
                    <h4 className="text-xs font-bold text-primary line-clamp-2">
                      {filing.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-subtle text-[11px]">
                    <span className="text-secondary-muted">{filing.source}</span>
                    {filing.source_url ? (
                      <a
                        href={filing.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent font-semibold hover:underline flex items-center space-x-1"
                      >
                        <span>Official Filing</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        href={`/research?doc=${filing.id}`}
                        className="text-accent font-semibold hover:underline"
                      >
                        Inspect Document →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
