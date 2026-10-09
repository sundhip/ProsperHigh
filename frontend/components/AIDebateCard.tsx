"use client";

import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, HelpCircle, ChevronDown, ChevronUp, Scale } from "lucide-react";

interface DebatePoint {
  topic?: string;
  bull_agent?: string;
  bull_argument?: string;
  bear_agent?: string;
  bear_argument?: string;
  contested_metric?: string;
  resolution?: string;
}

interface Props {
  aiDebate?: {
    consensus_status?: string;
    debate_points?: DebatePoint[];
    key_unresolved_question?: string;
    specialist_disagreements?: string[];
  };
}

export const AIDebateCard: React.FC<Props> = ({ aiDebate }) => {
  const [expanded, setExpanded] = useState(true);

  if (!aiDebate || (!aiDebate.debate_points?.length && !aiDebate.specialist_disagreements?.length)) {
    return null;
  }

  const consensus = aiDebate.consensus_status || "ACTIVE_DEBATE";
  const points = aiDebate.debate_points || [];

  return (
    <div className="prosper-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-elevated text-accent flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-primary font-display">
              Autonomous Agent Debate
            </h3>
            <p className="text-xs text-secondary-muted">
              Valuation, momentum, risk, and regulatory agent dialectic
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              consensus === "CONSENSUS"
                ? "bg-accent/15 text-accent border border-accent/25"
                : consensus === "SPLIT_OPINION"
                ? "bg-negative/15 text-negative border border-negative/25"
                : "bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/25"
            }`}
          >
            {consensus.replace("_", " ")}
          </span>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-secondary-muted hover:text-primary p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 pt-2">
          {/* Key Unresolved Question Callout */}
          {aiDebate.key_unresolved_question && (
            <div className="p-3.5 bg-accent-yellow/10 border border-accent-yellow/20 rounded-2xl flex items-start space-x-2.5">
              <HelpCircle className="w-4 h-4 text-accent-yellow shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-accent-yellow uppercase text-[10px] tracking-wider block">
                  Core Contested Question
                </span>
                <p className="text-secondary font-medium mt-0.5">
                  {aiDebate.key_unresolved_question}
                </p>
              </div>
            </div>
          )}

          {/* Specialist Debate Grid */}
          <div className="space-y-3">
            {points.map((pt, idx) => (
              <div key={idx} className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle space-y-3">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Debate #{idx + 1}: {pt.topic || "Core Thesis Tension"}
                  </span>
                  {pt.contested_metric && (
                    <span className="text-[10px] bg-surface border border-border-subtle px-2.5 py-0.5 rounded-full font-mono text-secondary">
                      Metric: {pt.contested_metric}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Bull Case */}
                  <div className="bg-accent/5 p-3.5 rounded-xl border border-accent/20 space-y-1">
                    <div className="flex items-center space-x-1.5 text-accent text-xs font-bold">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>{pt.bull_agent || "Bull Specialist"}</span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed font-medium">
                      {pt.bull_argument}
                    </p>
                  </div>

                  {/* Bear Case */}
                  <div className="bg-negative/5 p-3.5 rounded-xl border border-negative/20 space-y-1">
                    <div className="flex items-center space-x-1.5 text-negative text-xs font-bold">
                      <ArrowDownRight className="w-4 h-4" />
                      <span>{pt.bear_agent || "Bear Specialist"}</span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed font-medium">
                      {pt.bear_argument}
                    </p>
                  </div>
                </div>

                {pt.resolution && (
                  <div className="text-[11px] text-secondary bg-surface p-2.5 rounded-xl border border-border-subtle flex items-center space-x-2">
                    <span className="font-bold text-primary">Synthesis Resolution:</span>
                    <span>{pt.resolution}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
