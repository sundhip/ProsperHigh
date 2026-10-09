"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, Info } from "lucide-react";
import { getPortfolioComposition } from "@/lib/api";
import { PlainLanguageTooltip } from "@/components/ui/PlainLanguageTooltip";

interface Props {
  portfolioId?: string;
  refreshTrigger?: number;
}

export const PortfolioCompositionCard: React.FC<Props> = ({ portfolioId, refreshTrigger }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPortfolioComposition(portfolioId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [portfolioId, refreshTrigger]);

  if (loading) {
    return (
      <div className="prosper-card p-6 text-center text-xs text-secondary-muted font-bold">
        Analyzing portfolio concentration and HHI index...
      </div>
    );
  }

  if (!data || !data.holdings_count) {
    return null;
  }

  const hhi = data.hhi || 0;
  const rating = data.concentration_rating || "MODERATE";
  const top3 = data.top_3_concentration_pct || 0;
  const top5 = data.top_5_concentration_pct || 0;
  const drift = data.target_allocation_drift || [];
  const targetConfigured = data.target_allocations_configured ?? false;

  return (
    <div className="prosper-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-muted">
            Portfolio Concentration
          </span>
          <h3 className="text-base font-extrabold text-primary font-display">
            Concentration Analytics & Herfindahl Index (HHI)
          </h3>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
            rating === "DIVERSIFIED" || rating === "LOW"
              ? "bg-accent/10 text-accent border border-accent/20"
              : rating === "HIGHLY_CONCENTRATED" || rating === "HIGH"
              ? "bg-negative/10 text-negative border border-negative/20"
              : "bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/25"
          }`}
        >
          {rating.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* HHI Score */}
        <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
          <div className="flex items-center text-[10px] uppercase font-bold text-secondary-muted">
            <span>HHI Score (0 - 10,000)</span>
            <PlainLanguageTooltip termKey="hhi" />
          </div>
          <div className="text-2xl font-black text-primary mt-0.5">{Math.round(hhi)}</div>
          <div className="text-[11px] text-secondary mt-1">
            {hhi < 1500
              ? "Healthy (< 1,500 = Diversified)"
              : hhi < 2500
              ? "Moderate (1,500 - 2,500)"
              : "High Concentration (> 2,500)"}
          </div>
        </div>

        {/* Top 3 Concentration */}
        <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
          <div className="text-[10px] uppercase font-bold text-secondary-muted">Top 3 Positions Weight</div>
          <div className="text-2xl font-black text-primary mt-0.5">{top3}%</div>
          <div className="text-[11px] text-secondary mt-1">
            {top3 > 50 ? "⚠ Top 3 exceed 50% of portfolio" : "✓ Balanced across top names"}
          </div>
        </div>

        {/* Top 5 Concentration */}
        <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
          <div className="text-[10px] uppercase font-bold text-secondary-muted">Top 5 Positions Weight</div>
          <div className="text-2xl font-black text-accent mt-0.5">{top5}%</div>
          <div className="text-[11px] text-secondary mt-1">
            {top5 > 75 ? "⚠ Top 5 dominate returns" : "✓ Multi-holding distribution"}
          </div>
        </div>
      </div>

      {/* Target Allocation Drift Section */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center space-x-1.5">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span>Target Allocation Drift</span>
        </h4>

        {!targetConfigured ? (
          <div className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle text-xs text-secondary flex items-center space-x-2">
            <Info className="w-4 h-4 text-secondary-muted shrink-0" />
            <span>
              Target asset allocations not configured. Set explicit target weights in your Profile to track allocation drift.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {drift.map((d: any, idx: number) => (
              <div key={idx} className="p-3 bg-surface rounded-2xl border border-border-subtle flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-primary">{d.asset_class || d.sector}</span>
                  <div className="text-[11px] text-secondary-muted">
                    Target: {d.target_pct}% | Current: {d.current_pct}%
                  </div>
                </div>
                <div
                  className={`font-black text-sm ${
                    Math.abs(d.drift_pct) > 5 ? "text-accent-yellow" : "text-accent"
                  }`}
                >
                  {d.drift_pct > 0 ? `+${d.drift_pct}%` : `${d.drift_pct}%`} drift
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
