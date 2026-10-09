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
    <div className="prosper-card p-5 sm:p-6 bg-surface text-primary border border-border-subtle relative overflow-hidden">
      {/* Decorative accent glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-full bg-accent/15 text-accent">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-primary font-display">
              Getting Started Checklist
            </h3>
          </div>
          <p className="text-xs text-secondary max-w-xl">
            Complete 3 foundational steps to unlock personalized financial intelligence tailored to your actual portfolio.
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="text-secondary-muted hover:text-primary p-1.5 rounded-full hover:bg-surface-elevated transition-colors"
          title="Dismiss guide"
          aria-label="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 relative z-10">
        <div className="flex items-center justify-between text-xs text-secondary mb-1.5 font-medium">
          <span>{completedCount} of 3 steps completed</span>
          <span className="text-accent font-bold">{Math.round((completedCount / 3) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
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
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                st.completed
                  ? "bg-accent/5 border-accent/20 text-primary"
                  : "bg-surface-elevated border-border-subtle hover:border-border-default text-primary"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {st.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-secondary-muted shrink-0" />
                    )}
                    <span className="text-xs font-bold">{st.title}</span>
                  </div>
                </div>
                <p className="text-[11px] text-secondary leading-snug">
                  {st.desc}
                </p>
              </div>

              <div className="pt-3">
                <Link
                  href={st.href}
                  className={`inline-flex items-center space-x-1.5 text-xs font-bold transition-colors ${
                    st.completed
                      ? "text-accent hover:underline"
                      : "text-primary hover:text-accent"
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
