"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAnalysisHistory, compareAnalyses } from "@/lib/api";
import { getStoredUser, UserSession } from "@/lib/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  History,
  Clock,
  ArrowRight,
  ShieldCheck,
  Scale,
  Sparkles,
  ExternalLink,
  RotateCcw,
  CheckCircle,
  X
} from "lucide-react";

export default function DecisionsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);

  // Compare mode
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u) {
      getAnalysisHistory()
        .then((items) => {
          setHistory(items || []);
          setLoading(false);
        })
        .catch(() => {
          setHistory([]);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const toggleSelectRun = (runId: string) => {
    if (selectedRuns.includes(runId)) {
      setSelectedRuns(selectedRuns.filter((id) => id !== runId));
    } else {
      if (selectedRuns.length >= 2) {
        setSelectedRuns([selectedRuns[1], runId]);
      } else {
        setSelectedRuns([...selectedRuns, runId]);
      }
    }
  };

  const handleRunComparison = async () => {
    if (selectedRuns.length !== 2) return;
    setIsComparing(true);
    try {
      const res = await compareAnalyses(selectedRuns[0], selectedRuns[1]);
      setComparisonResult(res);
    } catch (err) {
      alert("Failed to compare runs.");
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-[#C9A96E]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              Decisions & Audit Log
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical record of multi-agent investment assessments, thesis iterations, and suitability evaluations.
          </p>
        </div>

        {selectedRuns.length === 2 && (
          <button
            onClick={handleRunComparison}
            disabled={isComparing}
            className="px-4 py-2 bg-slate-900 dark:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity flex items-center space-x-1.5"
          >
            <Scale className="w-4 h-4" />
            <span>{isComparing ? "Comparing..." : "Compare 2 Selected Runs"}</span>
          </button>
        )}
      </div>

      {/* Comparison Modal / Panel */}
      {comparisonResult && (
        <div className="prosper-card p-6 border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 relative">
          <button
            onClick={() => setComparisonResult(null)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2 mb-3">
            <Scale className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
              Decision Evolution: {comparisonResult.symbol}
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
            {comparisonResult.evolution_summary || comparisonResult.summary || "Evolution analysis between recorded runs."}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Run A Decision</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {comparisonResult.run_a?.decision || "—"} ({comparisonResult.run_a?.net_score ?? 0} pts)
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Run B Decision</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {comparisonResult.run_b?.decision || "—"} ({comparisonResult.run_b?.net_score ?? 0} pts)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : !user ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-slate-400" />}
          title="Sign In to View Decision History"
          description="Your decision audit trail is securely isolated to your account. Sign in to review past AI engine assessments."
          actionLabel="Sign In"
          actionHref="/login"
        />
      ) : history.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-[#C9A96E]" />}
          title="No Decision Records Found"
          description="You haven't run any multi-agent investigations yet. Select a stock to generate an explainable assessment."
          actionLabel="Analyze First Stock"
          actionHref="/analyze"
        />
      ) : (
        <div className="prosper-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4 w-10">Select</th>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Suitability</th>
                  <th className="py-3 px-4">Conflict Level</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {history.map((item) => {
                  const isSelected = selectedRuns.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "bg-sky-50/40 dark:bg-sky-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRun(item.id)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/analyze?symbol=${item.symbol}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:underline"
                        >
                          {item.symbol}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          label={item.final_decision}
                          variant={
                            item.final_decision === "BUY"
                              ? "positive"
                              : item.final_decision === "SELL"
                              ? "negative"
                              : "warning"
                          }
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold tabular-nums text-slate-700 dark:text-slate-300">
                        {item.confidence}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">
                          {item.suitability_verdict || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {item.conflict_level}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/analyze?symbol=${item.symbol}`}
                          className="text-sky-600 dark:text-sky-400 font-bold hover:underline"
                        >
                          Inspect →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
