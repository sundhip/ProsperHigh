"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Play, Trash2, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { simulateWhatIf, saveScenario, listScenarios, deleteScenario } from "@/lib/api";

interface Props {
  portfolioId?: string;
  onRefreshPortfolio?: () => void;
}

export const WhatIfSimulatorCard: React.FC<Props> = ({ portfolioId }) => {
  const [action, setAction] = useState<string>("ADD");
  const [symbol, setSymbol] = useState<string>("TCS");
  const [quantity, setQuantity] = useState<number>(10);
  const [price, setPrice] = useState<number>(3500);

  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Saved scenarios state
  const [scenarioName, setScenarioName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);

  const loadSaved = () => {
    listScenarios("what_if").then((res) => setSavedScenarios(res || []));
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || quantity <= 0) return;
    setSimulating(true);
    setError(null);

    try {
      const res = await simulateWhatIf({
        actions: [{ action, symbol: symbol.toUpperCase().trim(), quantity, price }],
        portfolio_id: portfolioId,
      });
      setSimResult(res);
    } catch (err: any) {
      setError(err.message || "Simulation failed.");
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveScenario = async () => {
    if (!scenarioName.trim() || !simResult) return;
    setSaving(true);
    try {
      await saveScenario({
        name: scenarioName.trim(),
        scenario_type: "what_if",
        parameters: { action, symbol, quantity, price },
        results: simResult,
      });
      setScenarioName("");
      loadSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save scenario.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    await deleteScenario(id);
    loadSaved();
  };

  return (
    <div className="prosper-card p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-elevated text-accent flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-primary font-display">
              What-If Portfolio Simulator
            </h3>
            <p className="text-xs text-secondary-muted">
              In-memory sandbox to test hypothetical trades (Ref B Exchange widget style)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Live Mutating Writes</span>
        </div>
      </div>

      {/* Simulator Input Form: Stacked rounded inputs with full-width dark pill CTA (Ref B) */}
      <form onSubmit={handleSimulate} className="bg-surface-elevated p-5 rounded-2xl border border-border-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-secondary-muted tracking-wider">Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-primary mt-1 focus:ring-2 focus:ring-accent outline-none"
            >
              <option value="ADD">ADD (Buy Position)</option>
              <option value="TRIM">TRIM (Partial Sell)</option>
              <option value="SELL">SELL (Liquidate)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-secondary-muted tracking-wider">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. TCS"
              className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-primary mt-1 focus:ring-2 focus:ring-accent outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-secondary-muted tracking-wider">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-primary mt-1 focus:ring-2 focus:ring-accent outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-secondary-muted tracking-wider">Est. Price (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min="1"
              className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-primary mt-1 focus:ring-2 focus:ring-accent outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={simulating}
            className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-full shadow transition-all flex items-center space-x-1.5"
          >
            {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Run In-Memory Simulation</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 bg-negative/10 border border-negative/20 text-negative text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Simulation Result Comparison */}
      {simResult && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-secondary-muted">Total Portfolio Value</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xs text-secondary-muted line-through font-mono">
                  ₹{simResult.current?.total_value?.toLocaleString("en-IN") || 0}
                </span>
                <span className="text-lg font-black text-primary font-mono tabular-nums">
                  ₹{simResult.simulated?.total_value?.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>

            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-secondary-muted">Diversification Health Score</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xs text-secondary-muted line-through font-mono">
                  {simResult.current?.health_score || 0}
                </span>
                <span className="text-lg font-black text-accent font-mono tabular-nums">
                  {simResult.simulated?.health_score || 0} / 100
                </span>
              </div>
            </div>

            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <span className="text-[10px] uppercase font-bold text-secondary-muted">HHI Concentration Score</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xs text-secondary-muted line-through font-mono">
                  {Math.round(simResult.current?.hhi || 0)}
                </span>
                <span className="text-lg font-black text-primary font-mono tabular-nums">
                  {Math.round(simResult.simulated?.hhi || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Save Scenario Bar */}
          <div className="p-4 bg-surface rounded-2xl border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto flex-1">
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Give this what-if scenario a name (e.g. Accumulate Tech 2026)"
                className="w-full bg-surface-elevated border border-border-subtle rounded-full px-4 py-2 text-xs text-primary focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            <button
              onClick={handleSaveScenario}
              disabled={saving || !scenarioName.trim()}
              className="w-full sm:w-auto px-5 py-2 bg-surface-elevated hover:bg-surface text-primary border border-border-subtle font-bold text-xs rounded-full transition-all disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save Scenario"}
            </button>
          </div>
        </div>
      )}

      {/* Saved Scenarios List */}
      {savedScenarios.length > 0 && (
        <div className="pt-2">
          <span className="text-[10px] font-bold uppercase text-secondary-muted tracking-wider block mb-2">Saved Scenarios</span>
          <div className="space-y-2">
            {savedScenarios.map((sc) => (
              <div key={sc.id} className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-primary">{sc.name}</span>
                  <div className="text-[11px] text-secondary-muted">
                    {sc.parameters?.action} {sc.parameters?.quantity} {sc.parameters?.symbol} @ ₹{sc.parameters?.price}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteScenario(sc.id)}
                  className="p-1 text-secondary-muted hover:text-negative"
                  title="Delete Scenario"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
