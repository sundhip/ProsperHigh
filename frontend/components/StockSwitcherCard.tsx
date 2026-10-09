"use client";

import React from "react";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Alternative {
  symbol: string;
  name: string;
  match_score: number;
  reasons: string[];
}

interface Props {
  alternatives: Alternative[];
  currentSymbol: string;
  userName: string;
}

export const StockSwitcherCard: React.FC<Props> = ({ alternatives, currentSymbol, userName }) => {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="prosper-card p-6 border-l-4 border-l-accent bg-accent/5">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="w-5 h-5 text-accent" />
        <div>
          <h3 className="text-base font-bold text-primary font-display">Personalized Stock Switcher ("Better Portfolio Fits")</h3>
          <p className="text-xs text-secondary-muted">
            Based on {userName}'s current portfolio allocation and risk profile, these companies offer superior fit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {alternatives.map((alt) => (
          <div key={alt.symbol} className="bg-surface p-5 rounded-2xl border border-subtle shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-base font-black text-primary font-display">{alt.symbol}</span>
                  <div className="text-xs text-secondary-muted">{alt.name}</div>
                </div>

                <div className="text-right bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">
                  <div className="text-[10px] font-bold uppercase">Portfolio Fit</div>
                  <div className="text-sm font-black font-mono tabular-nums">{alt.match_score}/100</div>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {alt.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-xs text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/analyze?symbol=${alt.symbol}`}
              className="mt-4 flex items-center justify-center space-x-1.5 w-full py-2 bg-accent text-accent-foreground text-xs font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              <span>Analyze {alt.symbol}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
