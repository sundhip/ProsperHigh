"use client";

import React, { useState } from "react";
import { MessageSquare, ArrowUpRight, ArrowDownRight, HelpCircle, ChevronDown, ChevronUp, Scale } from "lucide-react";

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
    <div className="prosper-card p-6 border-l-4 border-l-accent space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-accent" />
          <div>
            <h3 className="text-base font-extrabold text-charcoal font-manrope">
              Multi-Agent Specialist Debate
            </h3>
            <p className="text-xs text-slate-500">
              Autonomous clash between valuation, momentum, risk, and regulatory agents
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
              consensus === "CONSENSUS"
                ? "bg-emerald-100 text-emerald-800"
                : consensus === "SPLIT_OPINION"
                ? "bg-rose-100 text-rose-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {consensus.replace("_", " ")}
          </span>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-charcoal p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 pt-2">
          {/* Key Unresolved Question Callout */}
          {aiDebate.key_unresolved_question && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start space-x-2.5">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block">
                  Core Contested Question
                </span>
                <p className="text-amber-800 font-medium mt-0.5">
                  {aiDebate.key_unresolved_question}
                </p>
              </div>
            </div>
          )}

          {/* Specialist Debate Grid */}
          <div className="space-y-3">
            {points.map((pt, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-black text-slate-700 uppercase">
                    Debate #{idx + 1}: {pt.topic || "Core Thesis Tension"}
                  </span>
                  {pt.contested_metric && (
                    <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-600">
                      Metric: {pt.contested_metric}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Bull Case */}
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200/60 space-y-1">
                    <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span>{pt.bull_agent || "Bull Specialist"}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {pt.bull_argument}
                    </p>
                  </div>

                  {/* Bear Case */}
                  <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-200/60 space-y-1">
                    <div className="flex items-center space-x-1.5 text-rose-800 text-xs font-bold">
                      <ArrowDownRight className="w-4 h-4 text-rose-600" />
                      <span>{pt.bear_agent || "Bear Specialist"}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {pt.bear_argument}
                    </p>
                  </div>
                </div>

                {pt.resolution && (
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 flex items-center space-x-1.5">
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
