"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, X, Sparkles, PlusCircle, Search, BookOpen } from "lucide-react";

interface GettingStartedGuideProps {
  hasHoldings: boolean;
  hasAnalyzed: boolean;
  hasResearched: boolean;
}

export const GettingStartedGuide: React.FC<GettingStartedGuideProps> = ({
  hasHoldings,
  hasAnalyzed,
  hasResearched
}) => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem("prosper_onboarding_dismissed") === "true";
      setDismissed(isDismissed);
    } catch (e) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("prosper_onboarding_dismissed", "true");
    } catch (e) {}
  };

  const steps = [
    {
      id: "holdings",
      title: "Add your first stock holding",
      desc: "Record positions or upload a CSV to calculate real concentration, HHI, and health metrics.",
      completed: hasHoldings,
      href: "/portfolio",
      cta: "Go to Portfolio",
      icon: PlusCircle
    },
    {
      id: "analyze",
      title: "Run an explainable AI analysis",
      desc: "Evaluate any stock across 6 distinct intelligence agents and inspect personalized suitability.",
      completed: hasAnalyzed,
      href: "/analyze",
      cta: "Analyze Stock",
      icon: Search
    },
    {
      id: "research",
      title: "Ask a grounded research question",
      desc: "Query corporate 10-K, 10-Q, and statutory filings backed by verified source citations.",
      completed: hasResearched,
      href: "/research",
      cta: "Open Research Terminal",
      icon: BookOpen
    }
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  if (dismissed) {
    return null;
  }

  return (
    <div className="prosper-card p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/60 shadow-lg relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-[#C9A96E]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-[#C9A96E]/20 text-[#C9A96E]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-white font-display">
              Welcome to ProsperHigh — Getting Started Guide
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Complete 3 foundational steps to unlock personalized financial intelligence tailored to your actual portfolio.
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Dismiss guide"
          aria-label="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
          <span>{completedCount} of 3 steps completed</span>
          <span className="text-[#C9A96E] font-bold">{Math.round((completedCount / 3) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C9A96E] to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4 relative z-10">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                st.completed
                  ? "bg-slate-800/40 border-emerald-500/30 text-slate-200"
                  : "bg-slate-800/80 border-slate-700/80 hover:border-slate-600 text-white"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {st.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold">{st.title}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {st.desc}
                </p>
              </div>

              <div className="pt-3">
                <Link
                  href={st.href}
                  className={`inline-flex items-center space-x-1 text-xs font-bold transition-colors ${
                    st.completed
                      ? "text-emerald-400 hover:text-emerald-300"
                      : "text-[#C9A96E] hover:text-[#e4c997]"
                  }`}
                >
                  <span>{st.completed ? "Review" : st.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
