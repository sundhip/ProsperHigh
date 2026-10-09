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
    if (decision === "BUY") return "bg-positive text-white border-positive";
    if (decision === "HOLD") return "bg-warning text-white border-warning";
    return "bg-negative text-white border-negative";
  };

  const getIcon = () => {
    if (decision === "BUY") return <CheckCircle className="w-8 h-8 text-white" />;
    if (decision === "HOLD") return <AlertTriangle className="w-8 h-8 text-white" />;
    return <ShieldX className="w-8 h-8 text-white" />;
  };

  return (
    <div className="prosper-card p-6 border-l-4 border-l-primary">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Final Synthesized Decision</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">| For {userName}</span>
          </div>
          <h2 className="text-3xl font-extrabold text-charcoal tracking-tight font-manrope mt-1">
            {symbol} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Analysis</span>
          </h2>
        </div>

        {/* Hero Decision Badge & Score */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Net Impact Weight</div>
            <div className={`text-xl font-black ${netScore >= 0 ? "text-positive" : "text-negative"}`}>
              {netScore > 0 ? `+${netScore}` : netScore} pts
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Confidence</div>
            <div className="text-xl font-black text-primary">{confidence}%</div>
          </div>

          <div className={`flex items-center space-x-2 px-5 py-3 rounded-xl border shadow-sm ${getBadgeStyle()}`}>
            {getIcon()}
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">Recommendation</div>
              <div className="text-2xl font-black tracking-tight">{decision}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Synthesis Explanation */}
      <div className="mt-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-primary mb-1">
          <Info className="w-4 h-4 text-accent" />
          <span>Decision Synthesis Explanation</span>
          {llmProvider && (
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-normal">
              Via {llmProvider}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">{explanation}</p>
      </div>
    </div>
  );
};
