"use client";

import React, { useState } from "react";
import { AlertTriangle, TrendingDown, Play, RefreshCw, AlertCircle } from "lucide-react";
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
    <div className="prosper-card p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-elevated text-negative flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-primary font-display">
              Portfolio Stress Testing & Shock Scenarios
            </h3>
            <p className="text-xs text-secondary-muted">
              Deterministic beta-weighted simulations of market and sector drawdowns
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-wider text-negative bg-negative/10 px-3 py-1 rounded-full border border-negative/20">
          Beta Risk Model
        </span>
      </div>

      {/* Preset Pill Buttons & Custom Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "MARKET_CORRECTION_10", label: "📉 Correction (-10%)" },
            { key: "TECH_SELLOFF_15", label: "💻 Tech Sell-off (-15%)" },
            { key: "SEVERE_BEAR_25", label: "🐻 Severe Bear (-25%)" },
          ].map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => {
                setScenarioKey(preset.key);
                setUseCustom(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                !useCustom && scenarioKey === preset.key
                  ? "bg-negative/15 border-negative/30 text-negative shadow-xs"
                  : "bg-surface-elevated border-border-subtle text-secondary hover:text-primary"
              }`}
            >
              {preset.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setUseCustom(true)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              useCustom
                ? "bg-negative/15 border-negative/30 text-negative shadow-xs"
                : "bg-surface-elevated border-border-subtle text-secondary hover:text-primary"
            }`}
          >
            ⚙ Custom Shock %
          </button>
        </div>

        {useCustom && (
          <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle flex items-center space-x-4">
            <span className="text-xs font-bold text-primary">Market Shock %:</span>
            <input
              type="range"
              min="-50"
              max="50"
              value={customShock}
              onChange={(e) => setCustomShock(Number(e.target.value))}
              className="flex-1 accent-negative"
            />
            <span className="font-mono text-sm font-bold text-negative">{customShock}%</span>
          </div>
        )}

        <button
          onClick={handleRunStress}
          disabled={loading}
          className="px-6 py-2.5 bg-negative text-white font-extrabold text-xs rounded-full shadow hover:opacity-90 transition-all flex items-center space-x-1.5"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>Run Stress Scenario Simulation</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-negative/10 border border-negative/20 text-negative text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stress Results View */}
      {result && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-secondary-muted">Baseline Value</span>
              <div className="text-xl font-black text-primary font-mono mt-1">
                ₹{result.baseline_total_value?.toLocaleString("en-IN") || 0}
              </div>
            </div>

            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-secondary-muted">Post-Shock Value</span>
              <div className="text-xl font-black text-negative font-mono mt-1">
                ₹{result.stressed_total_value?.toLocaleString("en-IN") || 0}
              </div>
            </div>

            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-secondary-muted">Portfolio Drawdown</span>
              <div className="text-xl font-black text-negative font-mono mt-1">
                {result.drawdown_pct ? `${result.drawdown_pct.toFixed(2)}%` : "0%"}
              </div>
              <div className="text-[10px] text-secondary-muted mt-0.5">
                Loss: ₹{Math.abs(result.drawdown_amount || 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {result.holding_impacts && result.holding_impacts.length > 0 && (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-[10px] uppercase text-secondary-muted tracking-wider font-semibold">
                    <th className="pb-2">Holding</th>
                    <th className="pb-2 text-right">Beta</th>
                    <th className="pb-2 text-right">Current Value</th>
                    <th className="pb-2 text-right">Stressed Value</th>
                    <th className="pb-2 text-right">Drawdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {result.holding_impacts.map((h: any) => (
                    <tr key={h.symbol} className="hover:bg-surface-elevated/60">
                      <td className="py-2.5 font-bold text-primary">{h.symbol}</td>
                      <td className="py-2.5 text-right font-mono text-secondary">{h.beta || 1.0}</td>
                      <td className="py-2.5 text-right font-mono text-secondary">
                        ₹{Number(h.current_value).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 text-right font-mono text-primary font-bold">
                        ₹{Number(h.stressed_value).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 text-right font-mono text-negative font-bold">
                        {h.drawdown_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
