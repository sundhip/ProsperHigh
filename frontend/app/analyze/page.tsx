"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { analyzeStock, searchStocks } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { DecisionCard } from "@/components/DecisionCard";
import { AgentBoard } from "@/components/AgentBoard";
import { AgentDetailDrawer } from "@/components/AgentDetailDrawer";
import { ImpactChart } from "@/components/ImpactChart";
import { ConflictCard } from "@/components/ConflictCard";
import { DecisionTraceCard } from "@/components/DecisionTraceCard";
import { CounterfactualCard } from "@/components/CounterfactualCard";
import { ThesisInvalidationCard } from "@/components/ThesisInvalidationCard";
import { StockSwitcherCard } from "@/components/StockSwitcherCard";
import { Search, Sparkles, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

function AnalyzeContentV3() {
  const searchParams = useSearchParams();
  const symbolParam = searchParams.get("symbol") || "TATAMOTORS";

  const [symbol, setSymbol] = useState(symbolParam);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(1);
  const [showMultiAgentDetails, setShowMultiAgentDetails] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysisData = (sym: string) => {
    setLoading(true);
    setLoadingStep(1);
    setError(null);

    const stepTimer = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 6) {
          clearInterval(stepTimer);
          return 6;
        }
        return prev + 1;
      });
    }, 250);

    const user = getStoredUser();
    analyzeStock(sym, user?.id)
      .then((res) => {
        clearInterval(stepTimer);
        setAnalysis(res);
        setLoading(false);
      })
      .catch((err: any) => {
        clearInterval(stepTimer);
        setAnalysis(null);
        setError(err.message || "Failed to execute multi-agent analysis.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalysisData(symbol);
  }, [symbol]);

  const handleSearchChange = async (val: string) => {
    setSearchInput(val);
    if (val.trim().length >= 1) {
      const res = await searchStocks(val);
      setSuggestions(res.stocks || []);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const selectStock = (sym: string) => {
    setSymbol(sym);
    setSearchInput("");
    setShowDropdown(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      selectStock(searchInput.trim().toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Dynamic Stock Search Box for ANY company */}
      <form onSubmit={handleSearchSubmit} className="prosper-card p-6 bg-slate-900 text-white space-y-3 border border-slate-800 relative z-20">
        <div className="flex items-center space-x-2 text-accent text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Dynamic Stock Analysis Engine — Search Any Company</span>
        </div>

        <div className="relative">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search any stock or company (e.g., Tata Motors, Reliance, Infosys, Apple)..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-accent hover:bg-accent-light text-charcoal font-extrabold text-xs rounded-xl shadow-md transition-all whitespace-nowrap flex items-center justify-center space-x-1.5"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Analyze Company →</span>}
            </button>
          </div>

          {/* Real-time Search Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-12 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-30 max-h-60 overflow-y-auto divide-y divide-slate-700/60">
              {suggestions.map((st) => (
                <div
                  key={st.symbol}
                  onClick={() => selectStock(st.symbol)}
                  className="p-3 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between text-xs transition-all"
                >
                  <div>
                    <span className="font-bold text-white mr-2">{st.symbol}</span>
                    <span className="text-slate-300">{st.name}</span>
                  </div>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-mono">{st.sector}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* 2. Visual Analysis Loading Pipeline */}
      {loading ? (
        <div className="prosper-card p-10 space-y-6">
          <div className="text-center space-y-2">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
            <h2 className="text-lg font-extrabold text-charcoal font-manrope">
              Synthesizing Multi-Agent Intelligence for {symbol}...
            </h2>
          </div>

          <div className="max-w-md mx-auto space-y-2.5 text-xs font-semibold">
            <div className={`flex items-center space-x-2.5 ${loadingStep >= 1 ? "text-positive" : "text-slate-400"}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>1. Symbol & Market Provider Resolved ({symbol})</span>
            </div>
            <div className={`flex items-center space-x-2.5 ${loadingStep >= 2 ? "text-positive" : "text-slate-400"}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>2. Technical Indicators (SMA, RSI, MACD) Calculated</span>
            </div>
            <div className={`flex items-center space-x-2.5 ${loadingStep >= 3 ? "text-positive" : "text-slate-400"}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>3. Fundamental Trajectory & Cash Flows Analyzed</span>
            </div>
            <div className={`flex items-center space-x-2.5 ${loadingStep >= 4 ? "text-positive" : "text-slate-400"}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>4. FinBERT Sentiment & Regulatory Filings Scanned</span>
            </div>
            <div className={`flex items-center space-x-2.5 ${loadingStep >= 5 ? "text-positive" : "text-slate-400"}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>5. Personalized Portfolio Risk & Concentration Evaluated</span>
            </div>
            <div className={`flex items-center space-x-2.5 ${loadingStep >= 6 ? "text-positive" : "text-slate-400"}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>6. Final Weighted Suitability Decision Synthesized</span>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="prosper-card p-8 bg-red-50/80 border border-red-200 text-red-900 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2.5 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Analysis Execution Halted</span>
          </div>
          <p className="text-xs text-red-700 leading-relaxed font-medium">{error}</p>
          <button
            onClick={() => fetchAnalysisData(symbol)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            Retry Analysis
          </button>
        </div>
      ) : analysis ? (
        <>
          {/* 3. Top-Level Clean Suitability Decision */}
          <DecisionCard
            decision={analysis.final_decision}
            confidence={analysis.confidence}
            netScore={analysis.net_score}
            symbol={analysis.symbol}
            userName={analysis.user_name}
            explanation={analysis.explanation}
            llmProvider={analysis.llm_provider}
          />

          {/* Warnings & Uncertainty Callout */}
          {((analysis.warnings && analysis.warnings.length > 0) || analysis.uncertainty) && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 text-xs text-amber-900">
              <div className="flex items-center space-x-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Synthesis Warnings & Model Uncertainty</span>
              </div>
              {analysis.uncertainty && (
                <p className="text-[11px] text-amber-800 font-medium">
                  <strong>Uncertainty Profile:</strong> {analysis.uncertainty}
                </p>
              )}
              {analysis.warnings?.map((w: string, idx: number) => (
                <div key={idx} className="text-[11px] text-amber-700 flex items-center space-x-1">
                  <span>•</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* 4. Personalized Portfolio Fit */}
          <div className="prosper-card p-6 border-l-4 border-l-primary bg-slate-50">
            <h3 className="text-base font-bold text-charcoal font-manrope mb-2">
              Personalized Portfolio Suitability
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {analysis.explanation}
            </p>
          </div>

          {/* 5. Positive vs Negative Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="prosper-card p-5 border-t-4 border-t-positive">
              <h3 className="text-xs font-bold text-positive uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Positive Drivers (+ Score)</span>
              </h3>
              <ul className="space-y-2">
                {analysis.positive_factors?.map((fact: string, idx: number) => (
                  <li key={idx} className="text-xs text-slate-800 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200/60 font-medium">
                    ✓ {fact}
                  </li>
                ))}
              </ul>
            </div>

            <div className="prosper-card p-5 border-t-4 border-t-negative">
              <h3 className="text-xs font-bold text-negative uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <XCircle className="w-4 h-4" />
                <span>Risk & Concentration Concerns (- Score)</span>
              </h3>
              <ul className="space-y-2">
                {analysis.negative_factors?.map((fact: string, idx: number) => (
                  <li key={idx} className="text-xs text-slate-800 bg-red-50/50 p-2.5 rounded-lg border border-red-200/60 font-medium">
                    ✕ {fact}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 6. Expandable Multi-Agent Flow Toggle */}
          <div className="text-center pt-2">
            <button
              onClick={() => setShowMultiAgentDetails(!showMultiAgentDetails)}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-extrabold shadow-md hover:bg-slate-800 transition-all"
            >
              <span>{showMultiAgentDetails ? "Hide Multi-Agent Flow" : "How ProsperHigh Reached This Decision (6 Agents)"}</span>
              {showMultiAgentDetails ? <ChevronUp className="w-4 h-4 text-accent" /> : <ChevronDown className="w-4 h-4 text-accent" />}
            </button>
          </div>

          {showMultiAgentDetails && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {analysis.conflicts && <ConflictCard conflicts={analysis.conflicts} />}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AgentBoard agents={analysis.agents} onSelectAgent={(ag) => setSelectedAgent(ag)} />
                <ImpactChart agents={analysis.agents} biggestFactorCallout={analysis.biggest_factor?.callout} />
              </div>

              {analysis.decision_trace && <DecisionTraceCard trace={analysis.decision_trace} />}
            </div>
          )}

          {analysis.counterfactuals && (
            <CounterfactualCard counterfactuals={analysis.counterfactuals} currentDecision={analysis.final_decision} />
          )}

          {analysis.thesis_invalidation && (
            <ThesisInvalidationCard invalidationCriteria={analysis.thesis_invalidation} />
          )}

          {analysis.stock_switcher && analysis.stock_switcher.length > 0 && (
            <StockSwitcherCard alternatives={analysis.stock_switcher} currentSymbol={analysis.symbol} userName={analysis.user_name} />
          )}

          <AgentDetailDrawer agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
        </>
      ) : null}
    </div>
  );
}

export default function AnalyzePageV3() {
  return (
    <Suspense fallback={<div className="prosper-card p-12 text-center text-slate-500">Loading Analysis Terminal...</div>}>
      <AnalyzeContentV3 />
    </Suspense>
  );
}
