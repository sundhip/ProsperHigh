"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getPortfolio, addHolding, deleteHolding, importPortfolioCSV } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortfolioCompositionCard } from "@/components/PortfolioCompositionCard";
import { WhatIfSimulatorCard } from "@/components/WhatIfSimulatorCard";
import { StressTestingCard } from "@/components/StressTestingCard";
import { GoalsTrackerCard } from "@/components/GoalsTrackerCard";
import {
  ShieldAlert,
  CheckCircle2,
  PieChart as PieIcon,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Upload,
  Download,
  AlertCircle,
  Sliders,
  Activity,
  Target,
  FileSpreadsheet,
  Layers,
  Sparkles
} from "lucide-react";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<"manual" | "csv">("manual");
  const [portfolioTab, setPortfolioTab] = useState<"overview" | "composition" | "whatif" | "stress" | "goals">("overview");
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Form State
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState(1000);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);

  const fetchPortfolio = () => {
    setLoading(true);
    const user = getStoredUser();
    getPortfolio(user?.id).then((res) => {
      setPortfolio(res);
      setRefreshCounter((c) => c + 1);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await addHolding(symbol.trim(), quantity, price);
      setShowAddModal(false);
      setSymbol("");
      fetchPortfolio();
    } catch (e: any) {
      setActionError(e.message || "Failed to add holding.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    setCsvError(null);
    setCsvSuccess(null);

    try {
      const res = await importPortfolioCSV(file);
      setCsvSuccess(res.message || `Successfully imported ${res.imported_count} holdings.`);
      fetchPortfolio();
      setTimeout(() => {
        setShowAddModal(false);
        setCsvSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCsvError(err.message || "Failed to import CSV.");
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = "Symbol,Quantity,Price\nTATAMOTORS,50,850\nINFY,30,1750\nRELIANCE,15,2950\nHDFCBANK,40,1600";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_prosperhigh_portfolio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (holdingId: number) => {
    if (confirm("Are you sure you want to remove this holding?")) {
      await deleteHolding(holdingId);
      fetchPortfolio();
    }
  };

  const SECTOR_COLORS = ["#1F3A4A", "#4F7C7A", "#C9A96E", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

  const sectorData = Object.entries(portfolio?.sector_exposure || {}).map(([name, val]) => ({
    name,
    value: Number(val),
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <PieIcon className="w-5 h-5 text-[#C9A96E]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              Portfolio Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real portfolio analytics, cost basis tracking, allocation drift, and stress testing.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-slate-900 dark:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md hover:opacity-90 transition-all flex items-center justify-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Holding / Import CSV</span>
        </button>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <>
          {/* Top Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Portfolio Value"
              value={`₹${(portfolio?.total_portfolio_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
              sublabel={`Cost: ₹${(portfolio?.total_invested_amount || 0).toLocaleString("en-IN")}`}
              icon={<PieIcon className="w-4 h-4" />}
              termKey="cost_basis"
            />
            <MetricCard
              label="Unrealized P&L"
              value={`₹${(portfolio?.total_unrealized_pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
              changePct={portfolio?.return_percentage ?? null}
              changeLabel="Overall Return"
              icon={<TrendingUp className="w-4 h-4" />}
              termKey="unrealized_pnl"
            />
            <MetricCard
              label="Diversification Health"
              value={`${portfolio?.health_score || 0}/100`}
              sublabel={portfolio?.health_score > 70 ? "Healthy Diversification" : "Review Allocation"}
              icon={<Activity className="w-4 h-4" />}
              termKey="health_score"
            />
            <MetricCard
              label="Active Positions"
              value={`${portfolio?.holdings_count || 0}`}
              sublabel={`${sectorData.length} Sectors Represented`}
              icon={<Layers className="w-4 h-4" />}
            />
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border shadow-xs">
            <button
              onClick={() => setPortfolioTab("overview")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "overview"
                  ? "bg-slate-900 dark:bg-sky-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Holdings & Allocation</span>
            </button>

            <button
              onClick={() => setPortfolioTab("composition")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "composition"
                  ? "bg-slate-900 dark:bg-sky-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Concentration & HHI</span>
            </button>

            <button
              onClick={() => setPortfolioTab("whatif")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "whatif"
                  ? "bg-slate-900 dark:bg-sky-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>What-If Simulator</span>
            </button>

            <button
              onClick={() => setPortfolioTab("stress")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "stress"
                  ? "bg-slate-900 dark:bg-sky-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Stress Testing</span>
            </button>

            <button
              onClick={() => setPortfolioTab("goals")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "goals"
                  ? "bg-slate-900 dark:bg-sky-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Financial Goals</span>
            </button>
          </div>

          {/* Tab 1: Overview & Holdings */}
          {portfolioTab === "overview" && (
            <div className="space-y-6">
              {/* Sector Exposure Chart & Holdings Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sector Donut (1 col) */}
                <div className="prosper-card p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display mb-1">
                    Sector Diversification
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Weighted allocation across industries
                  </p>

                  {sectorData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                      No holdings added yet.
                    </div>
                  ) : (
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sectorData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                          >
                            {sectorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Exposure"]}
                            contentStyle={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-subtle)",
                              borderRadius: "0.5rem",
                              fontSize: "12px"
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {sectorData.map((s, idx) => (
                      <div key={s.name} className="flex items-center space-x-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }} />
                        <span>{s.name} ({s.value.toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Holdings Table (2 cols) */}
                <div className="lg:col-span-2 prosper-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                      Recorded Holdings & Cost Basis
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {portfolio?.holdings?.length || 0} Assets
                    </span>
                  </div>

                  {portfolio?.holdings?.length === 0 ? (
                    <EmptyState
                      title="No Holdings in Portfolio"
                      description="Click Add Holding above or import a CSV file to begin tracking real performance."
                      actionLabel="Add Holding"
                      onAction={() => setShowAddModal(true)}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                            <th className="py-2.5 px-3">Symbol</th>
                            <th className="py-2.5 px-3">Sector</th>
                            <th className="py-2.5 px-3 text-right">Qty</th>
                            <th className="py-2.5 px-3 text-right">Avg Cost</th>
                            <th className="py-2.5 px-3 text-right">Current Price</th>
                            <th className="py-2.5 px-3 text-right">Weight</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {portfolio?.holdings?.map((h: any) => (
                            <tr key={h.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                <Link href={`/analyze?symbol=${h.symbol}`} className="hover:underline">
                                  {h.symbol}
                                </Link>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                                {h.sector || "General"}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {h.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                ₹{Number(h.average_price).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                                ₹{Number(h.current_price).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                                {h.portfolio_weight_pct}%
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => handleDelete(h.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Delete Holding"
                                  aria-label="Delete Holding"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {portfolioTab === "composition" && (
            <PortfolioCompositionCard
              portfolioId={portfolio?.id}
              refreshTrigger={refreshCounter}
            />
          )}

          {portfolioTab === "whatif" && (
            <WhatIfSimulatorCard
              portfolioId={portfolio?.id}
              onRefreshPortfolio={fetchPortfolio}
            />
          )}

          {portfolioTab === "stress" && (
            <StressTestingCard
              portfolioId={portfolio?.id}
            />
          )}

          {portfolioTab === "goals" && (
            <GoalsTrackerCard
              portfolioValue={portfolio?.total_portfolio_value || 0}
            />
          )}
        </>
      )}

      {/* Add Holding Modal with Single Input & CSV Upload */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Add Holding to Portfolio
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setModalTab("manual")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  modalTab === "manual"
                    ? "border-slate-900 dark:border-sky-500 text-slate-900 dark:text-white"
                    : "border-transparent text-slate-400"
                }`}
              >
                Single Instrument
              </button>
              <button
                onClick={() => setModalTab("csv")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  modalTab === "csv"
                    ? "border-slate-900 dark:border-sky-500 text-slate-900 dark:text-white"
                    : "border-transparent text-slate-400"
                }`}
              >
                Import CSV File
              </button>
            </div>

            {modalTab === "manual" ? (
              <form onSubmit={handleAddHolding} className="space-y-4">
                {actionError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Stock Symbol
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g. INFY, RELIANCE, TCS, TATAMOTORS"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Avg Purchase Price (₹)
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-slate-900 dark:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    {submitting ? "Adding..." : "Add to Portfolio"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {csvError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs rounded-lg">
                    {csvError}
                  </div>
                )}
                {csvSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
                    {csvSuccess}
                  </div>
                )}

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Upload Broker CSV Export
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports Zerodha, Groww, AngelOne or custom CSV with columns: Symbol, Quantity, Price.
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white dark:file:bg-sky-500"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <button
                    onClick={downloadSampleCSV}
                    className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample CSV</span>
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
