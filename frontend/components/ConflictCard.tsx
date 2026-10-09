"use client";

import React from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface Props {
  conflicts: {
    conflict_level: string;
    badge: string;
    summary: string;
    disagreements?: string[];
  };
}

export const ConflictCard: React.FC<Props> = ({ conflicts }) => {
  const isHigh = conflicts.conflict_level === "HIGH";
  const isModerate = conflicts.conflict_level === "MODERATE";

  return (
    <div className={`prosper-card p-6 border-l-4 ${isHigh ? "border-l-negative bg-negative/5" : isModerate ? "border-l-accent-2 bg-accent-2/5" : "border-l-accent bg-accent/5"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isHigh ? (
            <AlertTriangle className="w-5 h-5 text-negative" />
          ) : isModerate ? (
            <Info className="w-5 h-5 text-accent-2" />
          ) : (
            <CheckCircle className="w-5 h-5 text-accent" />
          )}
          <h3 className="text-base font-bold text-primary font-display">Agent Disagreement & Conflict Detector</h3>
        </div>

        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isHigh ? "bg-negative/10 text-negative border border-negative/20" : isModerate ? "bg-accent-2/10 text-primary border border-accent-2/30" : "bg-accent/10 text-accent border border-accent/20"}`}>
          {conflicts.badge}
        </span>
      </div>

      <p className="text-xs text-secondary leading-relaxed bg-surface p-3.5 rounded-xl border border-subtle">
        {conflicts.summary}
      </p>

      {conflicts.disagreements && conflicts.disagreements.length > 0 && (
        <div className="mt-3">
          <span className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Key Signal Clashes:</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {conflicts.disagreements.map((dis, idx) => (
              <span key={idx} className="text-xs bg-surface-elevated text-secondary px-3 py-1 rounded-full border border-subtle font-medium">
                {dis}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
