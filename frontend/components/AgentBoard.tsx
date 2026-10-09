"use client";

import React from "react";
import { TrendingUp, Activity, Newspaper, Landmark, ShieldAlert, UserCheck } from "lucide-react";

interface AgentResult {
  agent_name: string;
  status: string;
  signal: string;
  impact_score: number;
  summary: string;
  positive_factors?: string[];
  negative_factors?: string[];
  evidence?: any[];
  limitations?: string[];
}

interface Props {
  agents: Record<string, AgentResult>;
  onSelectAgent: (agent: AgentResult) => void;
}

export const AgentBoard: React.FC<Props> = ({ agents, onSelectAgent }) => {
  const agentIcons: Record<string, any> = {
    market: TrendingUp,
    technical: Activity,
    news: Newspaper,
    fundamental: Landmark,
    regulatory: ShieldAlert,
    risk: UserCheck,
  };

  const agentLabels: Record<string, string> = {
    market: "Market Intelligence",
    technical: "Technical Analysis",
    news: "News & Sentiment",
    fundamental: "Fundamental Health",
    regulatory: "Regulatory & RAG",
    risk: "Risk & Personalization",
  };

  const getBadge = (agent: AgentResult) => {
    if (agent.status === "FAILED") {
      return { text: "FAILED", style: "bg-negative/15 text-negative border-negative/30" };
    }
    if (agent.status === "INSUFFICIENT_DATA") {
      return { text: "NO DATA", style: "bg-surface-elevated text-secondary-muted border-border-subtle" };
    }
    if (agent.signal === "BUY") return { text: "BUY", style: "bg-accent/15 text-accent border-accent/30" };
    if (agent.signal === "HOLD") return { text: "HOLD", style: "bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30" };
    if (agent.signal === "AVOID" || agent.signal === "SELL") return { text: agent.signal, style: "bg-negative/15 text-negative border-negative/30" };
    return { text: agent.signal || "NEUTRAL", style: "bg-surface-elevated text-secondary border-border-subtle" };
  };

  return (
    <div className="prosper-card p-6" id="tour-agents">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-primary font-display">Specialized Agent Board</h3>
          <p className="text-xs text-secondary-muted">Each agent evaluates independently. Click any agent to inspect evidence.</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider bg-surface-elevated text-secondary px-3 py-1 rounded-full border border-border-subtle font-bold">
          6 Autonomous Agents
        </span>
      </div>

      {/* Team list style (Ref C 'Barber team') */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(agents).map(([key, agent]) => {
          const Icon = agentIcons[key] || Activity;
          const label = agentLabels[key] || key;
          const score = agent.impact_score || 0;
          const badge = getBadge(agent);

          return (
            <div
              key={key}
              onClick={() => onSelectAgent(agent)}
              className="border border-border-subtle rounded-2xl p-4 hover:border-accent hover:shadow-lg cursor-pointer transition-all bg-surface flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-surface-elevated text-secondary group-hover:bg-accent group-hover:text-black transition-colors flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-primary group-hover:text-accent font-display">{label}</span>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.style}`}>
                    {badge.text}
                  </span>
                </div>

                <p className="text-xs text-secondary line-clamp-2 mt-2 leading-relaxed">{agent.summary}</p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-border-subtle flex items-center justify-between">
                <span className="text-[10px] font-semibold text-secondary-muted uppercase tracking-wider">Impact Weight</span>
                <span className={`text-xs font-black tabular-nums ${score >= 0 ? "text-accent" : "text-negative"}`}>
                  {score > 0 ? `+${score}` : score} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
