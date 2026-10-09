"use client";

import React from "react";
import { HelpCircle, CheckSquare } from "lucide-react";

interface Props {
  counterfactuals: string[];
  currentDecision: string;
}

export const CounterfactualCard: React.FC<Props> = ({ counterfactuals, currentDecision }) => {
  return (
    <div className="prosper-card p-6" id="tour-counterfactuals">
      <div className="flex items-center space-x-2 mb-3">
        <HelpCircle className="w-5 h-5 text-accent" />
        <div>
          <h3 className="text-base font-bold text-primary font-display">Counterfactual Engine ("What Would Change This?")</h3>
          <p className="text-xs text-secondary-muted">
            {currentDecision === "BUY"
              ? "Conditions required to maintain current BUY status"
              : `Specific condition changes required to upgrade recommendation from ${currentDecision} to BUY`}
          </p>
        </div>
      </div>

      <div className="bg-surface-elevated/40 p-4 rounded-2xl border border-subtle">
        <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">BUY if:</div>
        <ul className="space-y-2">
          {counterfactuals.map((cond, idx) => (
            <li key={idx} className="flex items-start space-x-2 text-xs text-secondary bg-surface p-3 rounded-xl border border-subtle">
              <CheckSquare className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span className="font-medium">{cond}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
