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
      return { text: "FAILED", style: "bg-red-100 text-red-700 border-red-300" };
    }
    if (agent.status === "INSUFFICIENT_DATA") {
      return { text: "NO DATA", style: "bg-slate-100 text-slate-600 border-slate-300" };
    }
    if (agent.signal === "BUY") return { text: "BUY", style: "bg-positive/15 text-positive border-positive/30" };
    if (agent.signal === "HOLD") return { text: "HOLD", style: "bg-warning/15 text-warning border-warning/30" };
    if (agent.signal === "AVOID" || agent.signal === "SELL") return { text: agent.signal, style: "bg-negative/15 text-negative border-negative/30" };
    return { text: agent.signal || "NEUTRAL", style: "bg-slate-100 text-slate-600 border-slate-300" };
  };

  return (
    <div className="prosper-card p-6" id="tour-agents">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-charcoal font-manrope">Agent Board (6 Domain Agents)</h3>
          <p className="text-xs text-slate-500">Each agent evaluates the stock independently. Click any agent to view full evidence.</p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 font-semibold">
          Multi-Agent Grid
        </span>
      </div>

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
              className="border border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-md cursor-pointer transition-all bg-white flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-slate-100 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-charcoal group-hover:text-primary">{label}</span>
                  </div>

                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md border ${badge.style}`}>
                    {badge.text}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">{agent.summary}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Impact Weight</span>
                <span className={`text-xs font-black ${score >= 0 ? "text-positive" : "text-negative"}`}>
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
