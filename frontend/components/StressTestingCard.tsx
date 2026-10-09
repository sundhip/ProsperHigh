"use client";

import React, { useState } from "react";
import { AlertTriangle, TrendingDown, Play, RefreshCw, AlertCircle, Shield } from "lucide-react";
import { runStressTest } from "@/lib/api";

interface Props {
  portfolioId?: string;
}

export const StressTestingCard: React.FC<Props> = ({ portfolioId }) => {
  const [scenarioKey, setScenarioKey] = useState<string>("MARKET_CORRECTION_10");
  const [customShock, setCustomShock] = useState<number>(-10);
  const [useCustom, setUseCustom] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunStress = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload: any = { portfolio_id: portfolioId };
      if (useCustom) {
        payload.custom_market_shock_pct = customShock;
      } else {
        payload.scenario_key = scenarioKey;
      }
      const res = await runStressTest(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Stress test failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prosper-card p-6 border-l-4 border-l-rose-500 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <div>
            <h3 className="text-base font-extrabold text-charcoal font-manrope">
              Portfolio Stress Testing & Scenario Shocks
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic beta-weighted simulations of market and sector drawdowns
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          Deterministic Risk Model
        </span>
      </div>

      {/* Preset Buttons & Custom Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "MARKET_CORRECTION_10", label: "📉 Market Correction (-10%)" },
            { key: "TECH_SELLOFF_15", label: "💻 Tech Sell-off (-15%)" },
            { key: "SEVERE_BEAR_25", label: "🐻 Severe Bear Market (-25%)" },
          ].map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => {
                setScenarioKey(preset.key);
                setUseCustom(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                !useCustom && scenarioKey === preset.key
                  ? "bg-rose-50 border-rose-300 text-rose-800 shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {preset.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setUseCustom(true)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              useCustom
                ? "bg-rose-50 border-rose-300 text-rose-800 shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            ⚙ Custom Shock %
          </button>
        </div>

        {useCustom && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-4">
            <span className="text-xs font-bold text-slate-700">Market Shock %:</span>
            <input
              type="range"
              min="-40"
              max="0"
              value={customShock}
              onChange={(e) => setCustomShock(Number(e.target.value))}
              className="flex-1 accent-rose-500"
            />
            <span className="text-sm font-black text-rose-600 w-12 text-right">
              {customShock}%
            </span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleRunStress}
            disabled={loading}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
            <span>Execute Stress Shock Test</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-4 pt-2 bg-rose-50/40 p-4 rounded-xl border border-rose-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Projected Portfolio Impact</span>
              <div className="text-xl font-black text-rose-600 mt-0.5">
                -₹{Math.abs(result.total_loss_amount || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Drawdown %</span>
              <div className="text-xl font-black text-rose-600 mt-0.5">
                {result.drawdown_pct}%
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Post-Shock Portfolio Value</span>
              <div className="text-xl font-black text-charcoal mt-0.5">
                ₹{result.post_shock_value?.toLocaleString("en-IN") || 0}
              </div>
            </div>
          </div>

          {/* Holding Breakdown */}
          {result.holding_impacts && result.holding_impacts.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Top Vulnerable Positions Under Scenario
              </span>
              <div className="space-y-1.5">
                {result.holding_impacts.slice(0, 5).map((h: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold"
                  >
                    <div>
                      <span className="font-bold text-primary mr-2">{h.symbol}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        (Beta: {h.beta || 1.0})
                      </span>
                    </div>
                    <div className="text-rose-600 font-black">
                      -₹{Math.abs(h.loss_amount || 0).toLocaleString("en-IN")} ({h.shock_pct}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
