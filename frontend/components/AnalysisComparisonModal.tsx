"use client";

import React, { useState } from "react";
import { GitCompare, ArrowRight, TrendingUp, TrendingDown, RefreshCw, X, AlertCircle } from "lucide-react";
import { compareAnalyses } from "@/lib/api";

interface Props {
  currentAnalysisId: string;
  historyRuns: any[];
  onClose: () => void;
}

export const AnalysisComparisonModal: React.FC<Props> = ({
  currentAnalysisId,
  historyRuns,
  onClose,
}) => {
  const [selectedPriorId, setSelectedPriorId] = useState<string>(
    historyRuns.find((r) => r.id !== currentAnalysisId)?.id || ""
  );
  const [comparing, setComparing] = useState(false);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunCompare = async () => {
    if (!selectedPriorId) return;
    setComparing(true);
    setError(null);
    try {
      const res = await compareAnalyses(selectedPriorId, currentAnalysisId);
      setDiffResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to compare analysis runs.");
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface rounded-3xl p-6 max-w-2xl w-full border border-subtle shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold text-primary font-display">
              Compare Analysis Runs (Historical Diff)
            </h3>
          </div>
          <button onClick={onClose} className="text-secondary-muted hover:text-primary p-1 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector Controls */}
        <div className="bg-surface-elevated/40 p-4 rounded-2xl border border-subtle space-y-3">
          <label className="text-xs font-bold text-secondary uppercase">
            Select Prior Run to Compare Against Current Run
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedPriorId}
              onChange={(e) => setSelectedPriorId(e.target.value)}
              className="flex-1 bg-surface border border-subtle rounded-xl px-3 py-2 text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-accent"
            >
              {historyRuns
                .filter((r) => r.id !== currentAnalysisId)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.symbol} — {r.final_decision} ({r.created_at?.slice(0, 16) || r.id.slice(0, 8)})
                  </option>
                ))}
            </select>

            <button
              onClick={handleRunCompare}
              disabled={comparing || !selectedPriorId}
              className="px-5 py-2 bg-accent text-accent-foreground text-xs font-bold rounded-full shadow hover:opacity-90 transition-all flex items-center justify-center space-x-1.5"
            >
              {comparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Compute Diff →</span>}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-negative/10 border border-negative/20 text-negative text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Diff Result Display */}
        {diffResult && (
          <div className="space-y-4 pt-2">
            {/* Header Comparison Badge */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-surface-elevated/40 rounded-2xl border border-subtle">
                <span className="text-[10px] uppercase font-bold text-secondary-muted">Prior Run</span>
                <div className="text-base font-black text-primary mt-0.5">
                  {diffResult.decision_a} ({diffResult.net_score_a} pts)
                </div>
              </div>
              <div className="p-3 bg-surface-elevated/40 rounded-2xl border border-subtle">
                <span className="text-[10px] uppercase font-bold text-secondary-muted">Current Run</span>
                <div className="text-base font-black text-primary mt-0.5">
                  {diffResult.decision_b} ({diffResult.net_score_b} pts)
                </div>
              </div>
            </div>

            {/* Score Delta */}
            <div className="p-4 bg-surface-elevated/40 rounded-2xl border border-subtle flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary">Net Score Delta</span>
                <p className="text-[11px] text-secondary-muted">Change in synthesized specialist score</p>
              </div>
              <div
                className={`text-xl font-black font-mono tabular-nums ${
                  diffResult.score_delta >= 0 ? "text-accent" : "text-negative"
                }`}
              >
                {diffResult.score_delta > 0 ? `+${diffResult.score_delta}` : diffResult.score_delta} pts
              </div>
            </div>

            {/* Plain-Language Root Causes */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Root Causes for Shift
              </span>
              <div className="space-y-1.5">
                {diffResult.root_causes?.map((cause: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface rounded-xl border border-subtle text-xs text-secondary font-medium flex items-start space-x-2"
                  >
                    <span className="text-accent font-bold">•</span>
                    <span>{cause}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-subtle">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold border border-subtle rounded-full text-secondary hover:text-primary hover:bg-surface-elevated"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
