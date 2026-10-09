"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PlainLanguageTooltip, FINANCIAL_TERMS } from "./PlainLanguageTooltip";
import { BigNumber } from "./BigNumber";

interface MetricCardProps {
  label: string;
  value: string | number;
  changePct?: number | null;
  changeLabel?: string;
  sublabel?: string;
  asOf?: string;
  icon?: React.ReactNode;
  isStale?: boolean;
  termKey?: keyof typeof FINANCIAL_TERMS;
  sparkline?: number[];
  variant?: "default" | "hero";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  changePct,
  changeLabel = "1D",
  sublabel,
  asOf,
  icon,
  isStale = false,
  termKey,
  variant = "default",
}) => {
  const isPositive = typeof changePct === "number" && changePct > 0;
  const isNegative = typeof changePct === "number" && changePct < 0;
  const isZero = typeof changePct === "number" && changePct === 0;

  return (
    <div className="prosper-card p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between">
      {/* Top Header: icon tile + label + tooltip */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-xl bg-surface-elevated text-secondary flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="flex items-center">
            <span className="text-xs font-medium text-secondary">
              {label}
            </span>
            {termKey && <PlainLanguageTooltip termKey={termKey} />}
          </div>
        </div>

        {isStale && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20 font-semibold">
            Stale
          </span>
        )}
      </div>

      {/* Headline Metric Value with BigNumber */}
      <div className="my-1">
        {typeof value === "string" && value.startsWith("₹") ? (
          <BigNumber value={value} currency="₹" size="lg" />
        ) : typeof value === "string" && value.startsWith("$") ? (
          <BigNumber value={value} currency="$" size="lg" />
        ) : (
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display tabular-nums text-primary">
            {value}
          </span>
        )}
      </div>

      {/* Bottom Footer: Pill delta or sublabel */}
      <div className="mt-3 flex items-center justify-between text-xs pt-1">
        {typeof changePct === "number" ? (
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                isPositive
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : isNegative
                  ? "bg-negative/10 text-negative border border-negative/20"
                  : "bg-surface-elevated text-secondary border border-border-subtle"
              }`}
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {isZero && <Minus className="w-3 h-3" />}
              <span>
                {isPositive ? "+" : ""}
                {changePct.toFixed(2)}%
              </span>
            </span>
            <span className="text-secondary-muted text-[11px]">
              vs {changeLabel}
            </span>
          </div>
        ) : sublabel ? (
          <span className="text-secondary text-xs font-medium">
            {sublabel}
          </span>
        ) : <div />}

        {asOf && (
          <span className="text-[10px] text-secondary-muted">
            {asOf}
          </span>
        )}
      </div>
    </div>
  );
};
