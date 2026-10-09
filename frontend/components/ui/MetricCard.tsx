"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  changePct?: number | null;
  changeLabel?: string;
  sublabel?: string;
  asOf?: string;
  icon?: React.ReactNode;
  isStale?: boolean;
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
}) => {
  const isPositive = typeof changePct === "number" && changePct > 0;
  const isNegative = typeof changePct === "number" && changePct < 0;
  const isZero = typeof changePct === "number" && changePct === 0;

  return (
    <div className="prosper-card p-5 relative overflow-hidden">
      <div className="flex items-center justify-between text-secondary mb-2">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {icon && <div className="text-slate-400 dark:text-slate-500">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display tabular-nums text-primary dark:text-white">
          {value}
        </span>
        {isStale && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
            Stale
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {typeof changePct === "number" ? (
          <div
            className={`flex items-center space-x-1 font-semibold tabular-nums ${
              isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : isNegative
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {isZero && <Minus className="w-3.5 h-3.5" />}
            <span>
              {isPositive ? "+" : ""}
              {changePct.toFixed(2)}%
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              ({changeLabel})
            </span>
          </div>
        ) : sublabel ? (
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {sublabel}
          </span>
        ) : <div />}

        {asOf && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {asOf}
          </span>
        )}
      </div>
    </div>
  );
};
