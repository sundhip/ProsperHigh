"use client";

import React from "react";
import Link from "next/link";
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Scale,
  Compass,
  ExternalLink,
  Layers,
  ArrowRight
} from "lucide-react";

export default function HelpPage() {
  const agents = [
    { name: "Market Specialist", role: "Analyzes liquidity, volume profiles, and exchange order books." },
    { name: "Technical Specialist", role: "Computes momentum indicators, moving average crossovers, and RSI trends." },
    { name: "Fundamental Specialist", role: "Extracts operating margins, balance sheet leverage, and cash flow multiples." },
    { name: "News Specialist", role: "Scans sentiment and material media developments." },
    { name: "Regulatory Specialist", role: "Verifies compliance, SEBI/SEC filings, and ESG disclosures via RAG." },
    { name: "Risk Specialist", role: "Calculates downside volatility, maximum drawdown, and portfolio covariance." },
    { name: "Synthesis Engine", role: "Reconciles agent consensus/disagreement into an unvarnished investment quality verdict." },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-[#C9A96E]" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
            Platform Documentation & Methodology
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Understanding the deterministic architecture, multi-agent engine, and verifiable research sources powering ProsperHigh.
        </p>
      </div>

      {/* 1. Core Philosophy */}
      <div className="prosper-card p-6 space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-[#C9A96E]" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Core Philosophy: Explainable Intelligence
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Unlike black-box LLMs that produce ungrounded advice, ProsperHigh executes seven specialized domain agents that evaluate genuine market data and statutory filings. Every qualitative claim is anchored by citations pointing to real exchange disclosures.
        </p>
      </div>

      {/* 2. The Seven Domain Agents */}
      <div className="prosper-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
          The Seven Domain Specialists
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agents.map((ag) => (
            <div
              key={ag.name}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1"
            >
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>{ag.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Specialist
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                {ag.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Quality vs Suitability */}
      <div className="prosper-card p-6 space-y-3">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-sky-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
            Investment Quality vs. Investor Suitability
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          A high-quality company may not be suitable for every investor. ProsperHigh separates <strong>Investment Assessment</strong> (objective financial health, margins, growth) from <strong>Suitability Assessment</strong> (how an asset fits your personal horizon, risk tolerance, and portfolio concentration limits).
        </p>
      </div>

      {/* 4. Statutory Disclosures & Data Truthfulness */}
      <div className="prosper-card p-6 space-y-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
            Statutory Data Integrity & RAG Grounding
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Corporate disclosures are fetched from official BSE and NSE exchange releases, normalized, chunked, and deterministically embedded into a hybrid vector store. If evidence for a topic is missing or inconclusive, the Research Terminal honestly reports insufficient evidence rather than hallucinating details.
        </p>
      </div>

      {/* 5. Financial Disclaimer */}
      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
        <div className="font-bold">Regulatory & Risk Notice</div>
        <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
          ProsperHigh is an educational decision-intelligence tool designed to augment financial analysis. Information provided does not constitute registered investment advice. Market investments are subject to risk; please consult a qualified financial advisor before executing capital decisions.
        </p>
      </div>
    </div>
  );
}
