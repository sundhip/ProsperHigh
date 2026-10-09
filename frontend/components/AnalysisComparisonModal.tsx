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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-charcoal font-manrope">
              Compare Analysis Runs (Historical Diff)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-charcoal p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector Controls */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <label className="text-xs font-bold text-slate-600 uppercase">
            Select Prior Run to Compare Against Current Run
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedPriorId}
              onChange={(e) => setSelectedPriorId(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
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
              className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-primary-dark transition-all flex items-center justify-center space-x-1.5"
            >
              {comparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Compute Diff →</span>}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Diff Result Display */}
        {diffResult && (
          <div className="space-y-4 pt-2">
            {/* Header Comparison Badge */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Prior Run</span>
                <div className="text-base font-black text-charcoal mt-0.5">
                  {diffResult.decision_a} ({diffResult.net_score_a} pts)
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Run</span>
                <div className="text-base font-black text-charcoal mt-0.5">
                  {diffResult.decision_b} ({diffResult.net_score_b} pts)
                </div>
              </div>
            </div>

            {/* Score Delta */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-600">Net Score Delta</span>
                <p className="text-[11px] text-slate-500">Change in synthesized specialist score</p>
              </div>
              <div
                className={`text-xl font-black ${
                  diffResult.score_delta >= 0 ? "text-positive" : "text-negative"
                }`}
              >
                {diffResult.score_delta > 0 ? `+${diffResult.score_delta}` : diffResult.score_delta} pts
              </div>
            </div>

            {/* Plain-Language Root Causes */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                Root Causes for Shift
              </span>
              <div className="space-y-1.5">
                {diffResult.root_causes?.map((cause: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-medium flex items-start space-x-2"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span>{cause}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
