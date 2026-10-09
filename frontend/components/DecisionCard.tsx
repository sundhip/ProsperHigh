"use client";

import React from "react";
import { CheckCircle, AlertTriangle, ShieldX, Info } from "lucide-react";

interface Props {
  decision: string;
  confidence: number;
  netScore: number;
  symbol: string;
  userName: string;
  explanation: string;
  llmProvider?: string;
}

export const DecisionCard: React.FC<Props> = ({
  decision,
  confidence,
  netScore,
  symbol,
  userName,
  explanation,
  llmProvider
}) => {
  const getBadgeStyle = () => {
    if (decision === "BUY") return "bg-accent text-black border-accent/40";
    if (decision === "HOLD") return "bg-accent-yellow text-black border-accent-yellow/40";
    return "bg-negative text-white border-negative/40";
  };

  const getIcon = () => {
    if (decision === "BUY") return <CheckCircle className="w-7 h-7 text-black" />;
    if (decision === "HOLD") return <AlertTriangle className="w-7 h-7 text-black" />;
    return <ShieldX className="w-7 h-7 text-white" />;
  };

  return (
    <div className="prosper-card p-6 sm:p-7 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-secondary-muted uppercase tracking-wider">Synthesized Recommendation</span>
            <span className="text-[10px] text-secondary-muted">| For {userName}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight font-display mt-1">
            {symbol} <span className="text-sm font-normal text-secondary-muted">Analysis</span>
          </h2>
        </div>

        {/* Hero Decision Badge & Score */}
        <div className="flex items-center flex-wrap gap-4">
          <div className="text-right">
            <div className="text-[11px] font-semibold text-secondary-muted">Net Weight</div>
            <div className={`text-xl font-black tabular-nums ${netScore >= 0 ? "text-accent" : "text-negative"}`}>
              {netScore > 0 ? `+${netScore}` : netScore} pts
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-semibold text-secondary-muted">Confidence</div>
            <div className="text-xl font-black text-primary tabular-nums">{confidence}%</div>
          </div>

          <div className={`flex items-center space-x-2.5 px-5 py-3 rounded-2xl border shadow-md ${getBadgeStyle()}`}>
            {getIcon()}
            <div>
              <div className="text-[9.5px] uppercase font-bold tracking-widest opacity-80">Signal</div>
              <div className="text-2xl font-black tracking-tight font-display">{decision}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Synthesis Explanation Card */}
      <div className="bg-surface-elevated p-4 sm:p-5 rounded-2xl border border-border-subtle space-y-1.5">
        <div className="flex items-center space-x-2 text-xs font-bold text-primary">
          <Info className="w-4 h-4 text-accent" />
          <span className="font-display">Deterministic Reasoning</span>
          {llmProvider && (
            <span className="text-[10px] bg-surface text-secondary-muted px-2 py-0.5 rounded-full border border-border-subtle font-medium">
              Via {llmProvider}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-secondary leading-relaxed">{explanation}</p>
      </div>
    </div>
  );
};
