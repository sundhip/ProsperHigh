"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Sparkles, AlertCircle } from "lucide-react";

export interface TermDefinition {
  term: string;
  simpleDefinition: string;
  whyItMatters: string;
  limitations: string;
  example?: string;
}

export const FINANCIAL_TERMS: Record<string, TermDefinition> = {
  health_score: {
    term: "Health Score",
    simpleDefinition: "A single combined score from 0 to 100 assessing portfolio diversification, stability, and risk exposure.",
    whyItMatters: "Helps you see at a glance whether your investments are spread safely across different industries and asset types.",
    limitations: "A high health score does not guarantee profits or protect against broad macroeconomic downturns.",
    example: "A score above 70 indicates healthy diversification across sectors and companies."
  },
  hhi: {
    term: "Herfindahl-Hirschman Index (HHI)",
    simpleDefinition: "A mathematical measurement of how concentrated your portfolio is in a small number of stocks.",
    whyItMatters: "Low HHI (< 1,500) means diversified risk; high HHI (> 2,500) warns that a decline in 1 or 2 companies could severely hurt your portfolio.",
    limitations: "Only looks at stock percentage weights; does not measure if those different companies share common suppliers or risks.",
    example: "Holding 10 stocks equally gives HHI 1,000 (well diversified)."
  },
  beta: {
    term: "Beta",
    simpleDefinition: "How much a stock moves compared to the broader market index (like Nifty 50 or S&P 500).",
    whyItMatters: "A Beta of 1.0 moves in tandem with the market; Beta > 1.0 tends to swing higher and lower; Beta < 1.0 is more stable.",
    limitations: "Calculated from historical price swings, which may not predict sudden future corporate events.",
    example: "Beta of 1.3 means if the market rises 10%, the stock typically rises 13% (and drops 13% when the market falls 10%)."
  },
  rsi: {
    term: "Relative Strength Index (RSI)",
    simpleDefinition: "A momentum indicator measuring the speed and size of recent price changes on a scale from 0 to 100.",
    whyItMatters: "RSI above 70 often suggests an asset is heavily bought in the short term; RSI below 30 suggests it may be oversold.",
    limitations: "In strong trending markets, stocks can remain 'overbought' or 'oversold' for months.",
    example: "An RSI of 28 signals intense recent selling, prompting value investors to inspect fundamentals."
  },
  pe_ratio: {
    term: "P/E Ratio (Price-to-Earnings)",
    simpleDefinition: "The price you pay for each ₹1 (or $1) of profit the company generates annually.",
    whyItMatters: "Helps determine whether a stock is cheap or expensive relative to its current corporate profits.",
    limitations: "Misleading for fast-growing companies investing heavily or unprofitable cyclical businesses.",
    example: "A P/E of 20 means you are paying ₹20 for every ₹1 of company net income."
  },
  day_return: {
    term: "Day Return (1D)",
    simpleDefinition: "The percentage change in your portfolio's market value since the previous trading day's close.",
    whyItMatters: "Shows immediate market impact from today's active trading session.",
    limitations: "Daily fluctuations are often random noise; long-term compounding matters far more than daily swings.",
    example: "+1.2% indicates portfolio gained 1.2% in value during today's market hours."
  },
  unrealized_pnl: {
    term: "Unrealized Profit & Loss (P&L)",
    simpleDefinition: "The profit or loss you would make if you sold all your positions at current market prices right now.",
    whyItMatters: "Tracks overall performance against what you originally paid (cost basis).",
    limitations: "Paper gains or losses until actually sold; does not include taxes, brokerage commissions, or exit slippage.",
    example: "Purchased for ₹10,000, now worth ₹12,500 = ₹2,500 Unrealized Profit (+25%)."
  },
  suitability: {
    term: "Investor Suitability",
    simpleDefinition: "Whether a specific company fits your personal risk appetite, time horizon, and current portfolio balance.",
    whyItMatters: "A great company can still be the WRONG investment for you if you already own too much of that sector or need cash soon.",
    limitations: "Relies on the accuracy of your investor profile and financial goals input.",
    example: "A high-growth tech stock may receive a 'High Quality' rating but 'Caution - Sector Overweight' for your portfolio."
  },
  cost_basis: {
    term: "Cost Basis",
    simpleDefinition: "The total amount of money you originally invested to buy your shares, including purchase price.",
    whyItMatters: "Serves as the benchmark to calculate true capital gains or losses.",
    limitations: "Does not adjust for inflation over holding periods.",
    example: "Bought 10 shares at ₹500 each; your total cost basis is ₹5,000."
  },
  uncertainty_profile: {
    term: "Model Uncertainty Profile",
    simpleDefinition: "An explicit disclosure of what the AI agents do not know or where data has limited confidence.",
    whyItMatters: "Ensures you never treat AI estimates as guaranteed facts or perfect predictions.",
    limitations: "Even recognized uncertainty boundaries can shift during unprecedented black swan market shocks.",
    example: "Flags if financial filing was released over 90 days ago or if analyst estimates have wide variance."
  }
};

interface PlainLanguageTooltipProps {
  termKey?: keyof typeof FINANCIAL_TERMS;
  term?: string;
  simpleDefinition?: string;
  whyItMatters?: string;
  limitations?: string;
  example?: string;
  children?: React.ReactNode;
  iconClassName?: string;
}

export const PlainLanguageTooltip: React.FC<PlainLanguageTooltipProps> = ({
  termKey,
  term: customTerm,
  simpleDefinition: customSimple,
  whyItMatters: customWhy,
  limitations: customLim,
  example: customEx,
  children,
  iconClassName = "w-3.5 h-3.5 text-secondary-muted hover:text-primary"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const termData = termKey && FINANCIAL_TERMS[termKey] ? FINANCIAL_TERMS[termKey] : null;

  const displayTerm = customTerm || termData?.term || "Financial Concept";
  const displaySimple = customSimple || termData?.simpleDefinition || "Explanation of financial metric.";
  const displayWhy = customWhy || termData?.whyItMatters || "Assists in making balanced decisions.";
  const displayLim = customLim || termData?.limitations || "Past metrics do not predict future performance.";
  const displayEx = customEx || termData?.example;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={`Plain language explanation for ${displayTerm}`}
        className="ml-1 inline-flex items-center justify-center p-0.5 rounded-full hover:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
      >
        <HelpCircle className={iconClassName} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 sm:w-80 p-4 bg-surface border border-border-subtle rounded-2xl shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-2.5 mb-2.5">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="font-bold text-xs text-primary font-display">
                {displayTerm}
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-secondary">
              Plain English
            </span>
          </div>

          <div className="space-y-2.5 text-[11px] leading-relaxed">
            <div>
              <span className="font-bold text-secondary-muted block text-[10px] uppercase tracking-wider">
                What it means
              </span>
              <p className="text-secondary mt-0.5">
                {displaySimple}
              </p>
            </div>

            <div>
              <span className="font-bold text-secondary-muted block text-[10px] uppercase tracking-wider">
                Why it matters to you
              </span>
              <p className="text-secondary mt-0.5">
                {displayWhy}
              </p>
            </div>

            <div className="bg-accent-yellow/10 p-2.5 rounded-xl border border-accent-yellow/20">
              <span className="font-bold text-accent-yellow block text-[10px] uppercase tracking-wider flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 inline mr-1 text-accent-yellow" />
                Limitations
              </span>
              <p className="text-secondary text-[10.5px] mt-0.5">
                {displayLim}
              </p>
            </div>

            {displayEx && (
              <div className="pt-1 text-[10px] text-secondary-muted italic">
                <strong>Example:</strong> {displayEx}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
