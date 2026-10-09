"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

interface Props {
  agents: Record<string, { impact_score: number; agent_name: string }>;
  biggestFactorCallout?: string;
}

export const ImpactChart: React.FC<Props> = ({ agents, biggestFactorCallout }) => {
  const agentLabels: Record<string, string> = {
    technical: "Technical (+16)",
    fundamental: "Fundamental (+14)",
    market: "Market (+6)",
    news: "News (-9)",
    regulatory: "Regulatory (-8)",
    risk: "Risk (-22)",
  };

  const chartData = Object.entries(agents).map(([key, agent]) => {
    const score = agent.impact_score || 0;
    return {
      name: agentLabels[key] || key,
      score: score,
      absScore: Math.abs(score)
    };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="prosper-card p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-primary font-display">Agent Impact Weights</h3>
          <p className="text-xs text-secondary-muted">Signed agent weight contributions driving synthesized recommendation</p>
        </div>
      </div>

      {/* Fully rounded bars with clean theme styling (Ref D 'Income' style) */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
            <XAxis type="number" domain={[-30, 30]} tickCount={7} stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" stroke="#8E8E93" fontSize={11} width={130} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value: number) => [`${value > 0 ? "+" : ""}${value} points`, "Impact Weight"]}
              contentStyle={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: "1rem",
                borderColor: "var(--border-subtle)",
                fontSize: "12px",
                color: "var(--text-primary)"
              }}
            />
            <ReferenceLine x={0} stroke="var(--border-default)" strokeDasharray="3 3" />
            <Bar dataKey="score" radius={[9999, 9999, 9999, 9999]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.score >= 0 ? "#22C55E" : "#F87171"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {biggestFactorCallout && (
        <div className="mt-4 bg-accent-yellow/10 p-3 rounded-2xl border border-accent-yellow/20 flex items-start space-x-2 text-xs text-primary">
          <span className="font-extrabold text-accent-yellow uppercase tracking-wider whitespace-nowrap">Dominant Factor:</span>
          <span className="text-secondary">{biggestFactorCallout}</span>
        </div>
      )}
    </div>
  );
};
