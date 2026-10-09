"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Play, Save, Trash2, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
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
    <div className="prosper-card p-6 border-l-4 border-l-accent space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-accent" />
          <div>
            <h3 className="text-base font-extrabold text-charcoal font-manrope">
              What-If Portfolio Simulator
            </h3>
            <p className="text-xs text-slate-500">
              In-memory sandbox to test hypothetical trades without touching live holdings
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Live Mutating Writes</span>
        </div>
      </div>

      {/* Simulator Input Form */}
      <form onSubmit={handleSimulate} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500">Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 mt-1"
            >
              <option value="ADD">ADD (Buy Position)</option>
              <option value="TRIM">TRIM (Partial Sell)</option>
              <option value="SELL">SELL (Liquidate)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. TCS"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 mt-1"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 mt-1"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500">Est. Price (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min="1"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={simulating}
            className="px-5 py-2 bg-accent text-charcoal font-black text-xs rounded-xl shadow hover:bg-accent-light transition-all flex items-center space-x-1.5"
          >
            {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Run In-Memory Simulation</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Simulation Result Comparison */}
      {simResult && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Portfolio Value</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-sm text-slate-500 line-through">
                  ₹{simResult.current?.total_value?.toLocaleString("en-IN") || 0}
                </span>
                <span className="text-xl font-black text-charcoal">
                  ₹{simResult.simulated?.total_value?.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Health Score</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-sm text-slate-500 line-through">
                  {simResult.current?.health_score || 0}
                </span>
                <span className="text-xl font-black text-accent">
                  {simResult.simulated?.health_score || 0} / 100
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Positions Count</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-sm text-slate-500 line-through">
                  {simResult.current?.holdings_count || 0}
                </span>
                <span className="text-xl font-black text-primary">
                  {simResult.simulated?.holdings_count || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Save Scenario Bar */}
          <div className="flex items-center gap-2 bg-slate-100/60 p-3 rounded-xl border border-slate-200">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Give this scenario a name (e.g., 'Accumulate TCS before earnings')..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
            />
            <button
              onClick={handleSaveScenario}
              disabled={saving || !scenarioName.trim()}
              className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-primary-dark transition-all flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Scenario"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Saved Scenarios List */}
      {savedScenarios.length > 0 && (
        <div className="pt-2">
          <span className="text-xs font-bold text-charcoal uppercase tracking-wider block mb-2">
            Saved What-If Scenarios ({savedScenarios.length})
          </span>
          <div className="space-y-1.5">
            {savedScenarios.map((sc) => (
              <div
                key={sc.id}
                className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{sc.name}</span>
                  <span className="text-slate-400 text-[11px] ml-2 font-mono">
                    ({sc.parameters?.action} {sc.parameters?.quantity} {sc.parameters?.symbol})
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteScenario(sc.id)}
                  className="p-1 text-slate-400 hover:text-negative"
                  title="Delete Scenario"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
