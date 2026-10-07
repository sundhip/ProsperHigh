"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAnalysisHistory } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { History, Clock, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Layers } from "lucide-react";

export default function HistoryPageV2() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auditability & Governance</span>
        <h1 className="text-2xl font-extrabold text-charcoal font-manrope mt-1">
          Decision History & Evolution Log
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track past AI agent recommendations, conflict ratings, and inspect audit logs over time.
        </p>
      </div>

      {loading ? (
        <div className="prosper-card p-12 text-center text-slate-400 font-bold text-xs flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          <span>Loading decision audit logs...</span>
        </div>
      ) : !user ? (
        <div className="prosper-card p-12 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-lg font-bold text-charcoal font-manrope">Sign in to view Decision History</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Audit logs are securely isolated to your account. Sign in to review your past multi-agent analyses and thesis evaluations.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-primary-dark transition-all"
          >
            <span>Sign In →</span>
          </Link>
        </div>
      ) : history.length === 0 ? (
        <div className="prosper-card p-12 text-center space-y-4">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-charcoal font-manrope">No Decision History Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't run any multi-agent stock analyses yet. Run an analysis on any security to begin building an audit trail.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center space-x-1.5 px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-primary-dark transition-all"
          >
            <span>Analyze a Stock Now →</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="prosper-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-black text-xl text-charcoal font-manrope">{item.symbol}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      item.final_decision === "BUY"
                        ? "bg-positive/10 text-positive"
                        : item.final_decision === "SELL"
                        ? "bg-negative/10 text-negative"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {item.final_decision} • {item.confidence}% Confidence
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Conflict: {item.conflict_level}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium line-clamp-2">
                  {item.summary || "Multi-agent evaluation completed across 7 specialized domain agents."}
                </p>
                <div className="text-[10px] text-slate-400 flex items-center space-x-3 pt-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.created_at ? new Date(item.created_at).toLocaleString() : item.id}</span>
                  </div>
                  <span>•</span>
                  <span>Provider: {item.model_provider}</span>
                  <span>•</span>
                  <span>Latency: {item.execution_time_ms}ms</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Net Score</span>
                  <div className={`text-xl font-black font-manrope ${item.net_score >= 0 ? "text-positive" : "text-negative"}`}>
                    {item.net_score > 0 ? `+${item.net_score}` : item.net_score} pts
                  </div>
                </div>
                <Link
                  href={`/analyze?symbol=${item.symbol}`}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <span>Re-Analyze</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
