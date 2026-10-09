"use client";

import React, { useState, useEffect } from "react";
import { Target, Plus, Trash2, Calendar, AlertCircle } from "lucide-react";
import { getGoals, createGoal, deleteGoal } from "@/lib/api";

interface Props {
  portfolioValue?: number;
}

export const GoalsTrackerCard: React.FC<Props> = ({ portfolioValue = 0 }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState<number>(500000);
  const [targetDate, setTargetDate] = useState("2028-12-31");
  const [category, setCategory] = useState("WEALTH_CREATION");
  const [priority, setPriority] = useState("MEDIUM");
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = () => {
    setLoading(true);
    getGoals()
      .then((res) => {
        setGoals(res || []);
        setLoading(false);
      })
      .catch(() => {
        setGoals([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0) return;
    setSubmitting(true);
    setError(null);

    try {
      await createGoal({
        name: name.trim(),
        target_amount: targetAmount,
        target_date: targetDate,
        category,
        priority,
        monthly_contribution: monthlyContribution,
      });
      setName("");
      setShowAddModal(false);
      loadGoals();
    } catch (err: any) {
      setError(err.message || "Failed to create goal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm("Are you sure you want to delete this financial goal?")) {
      await deleteGoal(id);
      loadGoals();
    }
  };

  return (
    <div className="prosper-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-elevated text-accent flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-primary font-display">
              Financial Goals & Milestones
            </h3>
            <p className="text-xs text-secondary-muted">
              Deterministic progress linked directly to current portfolio valuation
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-black text-xs font-extrabold rounded-full shadow transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-secondary-muted font-bold">
          Loading financial goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="p-8 text-center text-xs text-secondary font-bold border border-dashed border-border-subtle rounded-2xl">
          No goals established yet. Click &quot;New Goal&quot; to link your wealth plan to portfolio performance.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const progress = g.progress_percentage || Math.min(100, Math.round(((g.current_amount || portfolioValue) / g.target_amount) * 100));
            return (
              <div key={g.id} className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-primary font-display">{g.name}</h4>
                    <div className="flex items-center space-x-2 text-[10px] text-secondary-muted mt-0.5">
                      <span className="uppercase font-bold">{g.category || "General"}</span>
                      {g.target_date && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Target: {g.target_date}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-1.5 text-secondary-muted hover:text-negative rounded-full hover:bg-surface transition-colors"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar (Ref A 'Payment' style) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold tabular-nums">
                    <span className="text-secondary">
                      ₹{(g.current_amount || portfolioValue).toLocaleString("en-IN")} / ₹{g.target_amount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-accent font-black">{progress}%</span>
                  </div>
                  <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border-subtle">
                    <div
                      className="bg-accent h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                {/* Projected Gap Callout */}
                {g.projected_shortfall !== undefined && g.projected_shortfall > 0 ? (
                  <div className="text-[11px] text-accent-yellow bg-accent-yellow/10 p-2.5 rounded-xl border border-accent-yellow/20">
                    ⚠ Shortfall of ₹{Math.round(g.projected_shortfall).toLocaleString("en-IN")} projected. Recommended monthly savings: ₹{Math.round(g.required_monthly_savings || 0).toLocaleString("en-IN")}.
                  </div>
                ) : (
                  <div className="text-[11px] text-accent bg-accent/10 p-2.5 rounded-xl border border-accent/20">
                    ✓ On track based on current portfolio value and growth assumptions.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-md w-full border border-border-subtle shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-lg font-bold text-primary font-display">Create Financial Goal</h3>
              <button onClick={() => setShowAddModal(false)} className="text-secondary-muted font-bold hover:text-primary text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              {error && (
                <div className="p-2.5 bg-negative/10 border border-negative/20 text-negative text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Retirement Corpus, Home Down Payment"
                  className="w-full bg-surface-elevated border border-border-subtle rounded-xl p-2.5 text-xs text-primary mt-1 focus:ring-2 focus:ring-accent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Target Amount (₹)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    min="1000"
                    className="w-full bg-surface-elevated border border-border-subtle rounded-xl p-2.5 text-xs text-primary mt-1 focus:ring-2 focus:ring-accent outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-surface-elevated border border-border-subtle rounded-xl p-2.5 text-xs text-primary mt-1 focus:ring-2 focus:ring-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface-elevated border border-border-subtle rounded-xl p-2.5 text-xs text-primary mt-1 focus:ring-2 focus:ring-accent outline-none"
                  >
                    <option value="RETIREMENT">Retirement</option>
                    <option value="HOME_PURCHASE">Home Purchase</option>
                    <option value="EDUCATION">Education</option>
                    <option value="WEALTH_CREATION">Wealth Creation</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-surface-elevated border border-border-subtle rounded-xl p-2.5 text-xs text-primary mt-1 focus:ring-2 focus:ring-accent outline-none"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Monthly Contribution (₹)</label>
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  min="0"
                  className="w-full bg-surface-elevated border border-border-subtle rounded-xl p-2.5 text-xs text-primary mt-1 focus:ring-2 focus:ring-accent outline-none font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-full border border-border-subtle text-secondary hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-accent hover:bg-accent-hover text-black text-xs font-extrabold rounded-full shadow"
                >
                  {submitting ? "Saving..." : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
