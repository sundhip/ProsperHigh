"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAlerts, createAlert, dismissAlert, deleteAlert, searchStocks } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [triggeredCount, setTriggeredCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form state
  const [symbol, setSymbol] = useState("");
  const [alertType, setAlertType] = useState("PRICE_TARGET");
  const [conditionType, setConditionType] = useState("ABOVE");
  const [thresholdValue, setThresholdValue] = useState("");
  const [message, setMessage] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res.alerts || []);
      setActiveCount(res.active_count || 0);
      setTriggeredCount(res.triggered_count || 0);
    } catch (err) {
      setErrorMsg("Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) {
      setErrorMsg("Please provide a stock symbol.");
      return;
    }
    setErrorMsg(null);
    try {
      await createAlert({
        symbol: symbol.toUpperCase().trim(),
        alert_type: alertType,
        condition_type: conditionType,
        threshold_value: thresholdValue ? parseFloat(thresholdValue) : undefined,
        message: message.trim() || undefined,
      });
      setFeedbackMsg(`Alert rule created for ${symbol.toUpperCase().trim()}.`);
      setSymbol("");
      setThresholdValue("");
      setMessage("");
      fetchAlerts();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create alert.");
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await dismissAlert(alertId);
      fetchAlerts();
    } catch (err: any) {
      setErrorMsg("Failed to dismiss alert.");
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      fetchAlerts();
    } catch (err: any) {
      setErrorMsg("Failed to delete alert rule.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-accent" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary font-display">
              Signal & Thesis Alerts
            </h1>
          </div>
          <p className="text-xs text-secondary-muted mt-0.5">
            Configure automated notifications for price targets, portfolio drift, and thesis invalidation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <StatusBadge label={`${activeCount} Active Rules`} variant="positive" size="sm" />
          {triggeredCount > 0 && (
            <StatusBadge label={`${triggeredCount} Triggered`} variant="warning" size="sm" />
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-accent/10 border border-accent/20 text-accent rounded-xl text-xs font-medium">
          {feedbackMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-negative/10 border border-negative/20 text-negative rounded-xl text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Configure New Alert Form */}
      <div className="prosper-card p-5">
        <h3 className="text-sm font-bold text-primary font-display mb-3">
          Configure Alert Condition
        </h3>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. RELIANCE"
              required
              className="w-full bg-surface-elevated border border-subtle rounded-xl px-3 py-2 text-xs text-primary placeholder-secondary-muted focus:outline-none focus:ring-2 focus:ring-accent font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
              Alert Trigger Type
            </label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              className="w-full bg-surface-elevated border border-subtle rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="PRICE_TARGET">Price Target</option>
              <option value="THESIS_CHANGE">Thesis Invalidation</option>
              <option value="VOLATILITY">Volatility Shock</option>
              <option value="CONCENTRATION">Portfolio Drift</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
              Condition
            </label>
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value)}
              className="w-full bg-surface-elevated border border-subtle rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="ABOVE">Crosses Above</option>
              <option value="BELOW">Crosses Below</option>
              <option value="CHANGE_PCT">Change &gt; 5%</option>
              <option value="TRIGGERED">Material Filing Event</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
              Target Value (INR)
            </label>
            <input
              type="number"
              step="any"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(e.target.value)}
              placeholder="e.g. 3100"
              className="w-full bg-surface-elevated border border-subtle rounded-xl px-3 py-2 text-xs text-primary placeholder-secondary-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 bg-accent text-accent-foreground rounded-full text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Rule</span>
            </button>
          </div>
        </form>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : alerts.length > 0 ? (
        <div className="prosper-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-subtle bg-surface-elevated/40 text-secondary-muted uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Alert Type</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-subtle font-medium">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-elevated/60 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/analyze?symbol=${a.symbol}`}
                        className="font-bold text-sm text-primary hover:text-accent transition-colors"
                      >
                        {a.symbol}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-secondary font-semibold">
                        {a.alert_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-secondary-muted">
                      {a.condition_type}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary tabular-nums">
                      {a.threshold_value ? `₹${a.threshold_value}` : "Event Driven"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={a.status}
                        variant={a.status === "ACTIVE" ? "positive" : a.status === "TRIGGERED" ? "warning" : "neutral"}
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {a.status === "TRIGGERED" && (
                        <button
                          onClick={() => handleDismiss(a.id)}
                          className="px-3 py-1 rounded-full bg-surface-elevated border border-subtle text-secondary hover:text-primary text-xs font-semibold"
                        >
                          Dismiss
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 text-secondary-muted hover:text-negative transition-colors rounded-full hover:bg-surface-elevated"
                        title="Delete alert rule"
                        aria-label="Delete alert rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-accent" />}
          title="No Alerts Configured"
          description="Create threshold or thesis invalidation alerts above to stay informed of significant financial developments."
        />
      )}
    </div>
  );
}
