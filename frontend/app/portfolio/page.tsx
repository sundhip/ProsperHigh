"use client";

import React, { useState, useEffect } from "react";
import { getPortfolio, addHolding, deleteHolding, importPortfolioCSV } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PortfolioCompositionCard } from "@/components/PortfolioCompositionCard";
import { WhatIfSimulatorCard } from "@/components/WhatIfSimulatorCard";
import { StressTestingCard } from "@/components/StressTestingCard";
import { GoalsTrackerCard } from "@/components/GoalsTrackerCard";
import { ShieldAlert, CheckCircle2, PieChart as PieIcon, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Upload, Download, AlertCircle, Sliders, Activity, Target } from "lucide-react";

export default function PortfolioPageV2() {
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

  const COLORS = ["#1F3A4A", "#4F7C7A", "#C9A96E", "#4F8A68", "#C58B39", "#B75D5D"];

  const sectorData = Object.entries(portfolio?.sector_exposure || {}).map(([name, val]) => ({
    name,
    value: Number(val)
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dynamic Portfolio Engine</span>
          <h1 className="text-2xl font-extrabold text-charcoal font-manrope mt-1">
            My Portfolio Analytics & Holdings
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-primary-dark transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Holding / Import CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="prosper-card p-12 text-center text-slate-500 text-xs font-bold flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          <span>Calculating deterministic portfolio analytics...</span>
        </div>
      ) : (
        <>
          {/* Top Calculated Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="prosper-card p-5">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Portfolio Value</div>
              <div className="text-2xl font-black text-charcoal font-manrope mt-1">
                ₹{portfolio?.total_portfolio_value ? portfolio.total_portfolio_value.toLocaleString("en-IN") : "0"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Invested: ₹{portfolio?.total_invested_amount ? portfolio.total_invested_amount.toLocaleString("en-IN") : "0"}
              </div>
            </div>

            <div className="prosper-card p-5">
              <div className="text-xs font-semibold text-slate-500 uppercase">Portfolio Health Score</div>
              <div className="text-2xl font-black text-accent font-manrope mt-1">
                {portfolio?.health_score || 0} / 100
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Status: {portfolio?.health_score > 70 ? "Healthy Diversification" : "Needs Allocation Review"}
              </div>
            </div>

            <div className="prosper-card p-5">
              <div className="text-xs font-semibold text-slate-500 uppercase">Active Holdings Count</div>
              <div className="text-2xl font-black text-primary font-manrope mt-1">
                {portfolio?.holdings_count || 0} Positions
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Overall Return: {portfolio?.return_percentage || 0}%
              </div>
            </div>
          </div>

          {/* Phase 4 Portfolio Navigation Tabs */}
          <div className="flex flex-wrap border-b border-slate-200 gap-1.5 bg-white p-2 rounded-2xl border shadow-xs">
            <button
              onClick={() => setPortfolioTab("overview")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "overview"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Overview & Holdings</span>
            </button>

            <button
              onClick={() => setPortfolioTab("composition")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "composition"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Concentration & HHI</span>
            </button>

            <button
              onClick={() => setPortfolioTab("whatif")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "whatif"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>What-If Sandbox</span>
            </button>

            <button
              onClick={() => setPortfolioTab("stress")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "stress"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Stress Testing</span>
            </button>

            <button
              onClick={() => setPortfolioTab("goals")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                portfolioTab === "goals"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Financial Goals</span>
            </button>
          </div>

          {/* Conditional Sub-View Rendering */}
          {portfolioTab === "overview" && (
            <>
              {/* Sector Allocation Chart & Health Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="prosper-card p-6">
                  <h3 className="text-base font-bold text-charcoal font-manrope mb-4 flex items-center space-x-2">
                    <PieIcon className="w-5 h-5 text-primary" />
                    <span>Sector Exposure Distribution</span>
                  </h3>

                  {sectorData.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-xs text-slate-400 font-bold">
                      No positions added yet. Click "+ Add Holding" to view sector exposure.
                    </div>
                  ) : (
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={sectorData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                            {sectorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value}%`, "Sector Weight"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="prosper-card p-6 space-y-4">
                  <h3 className="text-base font-bold text-charcoal font-manrope">Portfolio Health Subcategories</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Diversification", score: portfolio?.health_breakdown?.diversification || 0 },
                      { label: "Risk Alignment", score: portfolio?.health_breakdown?.risk_alignment || 0 },
                      { label: "Concentration", score: portfolio?.health_breakdown?.concentration || 0 },
                      { label: "Sector Balance", score: portfolio?.health_breakdown?.sector_balance || 0 },
                      { label: "Goal Alignment", score: portfolio?.health_breakdown?.goal_alignment || 0 }
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{item.label}</span>
                          <span>{item.score}/100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all" style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stale Quote Alert if any holding is cached or using previous close */}
              {portfolio?.has_stale_quotes && (
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Some market quotes are currently using cached data or previous close. Metrics update automatically with live streams.</span>
                </div>
              )}

              {/* Holdings Table */}
              <div className="prosper-card p-6 space-y-4">
                <h3 className="text-base font-bold text-charcoal font-manrope">Active Stock Holdings Table</h3>

                {portfolio?.holdings?.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-bold border border-dashed border-slate-300 rounded-xl">
                    No stock holdings added yet. Click "+ Add Holding / Import CSV" above to start!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase font-black">
                          <th className="py-3 px-3">Symbol</th>
                          <th className="py-3 px-3">Sector</th>
                          <th className="py-3 px-3">Qty</th>
                          <th className="py-3 px-3">Avg Price</th>
                          <th className="py-3 px-3">Current Price</th>
                          <th className="py-3 px-3">Current Value</th>
                          <th className="py-3 px-3">Weight %</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio?.holdings?.map((h: any) => (
                          <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-all font-semibold text-slate-700">
                            <td className="py-3 px-3 font-extrabold text-primary">{h.symbol}</td>
                            <td className="py-3 px-3">{h.sector}</td>
                            <td className="py-3 px-3">{h.quantity}</td>
                            <td className="py-3 px-3">₹{h.average_price}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">
                              ₹{h.current_price}
                              {!h.quote_available && (
                                <span className="text-[10px] text-amber-600 ml-1 font-normal" title="Live quote unavailable, cost basis used">
                                  (cost basis)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-black text-charcoal">₹{h.current_value?.toLocaleString("en-IN")}</td>
                            <td className="py-3 px-3 font-bold text-slate-600">{h.portfolio_weight_pct}%</td>
                            <td className="py-3 px-3 text-right">
                              <button onClick={() => handleDelete(h.id)} className="p-1 text-slate-400 hover:text-negative" title="Delete Holding">
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
            </>
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

      {/* Add Holding Modal with Single Input & CSV Upload Tabs */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-charcoal font-manrope">Add Holding to Portfolio</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold hover:text-charcoal text-xs">✕</button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setModalTab("manual")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  modalTab === "manual" ? "border-primary text-primary" : "border-transparent text-slate-500"
                }`}
              >
                Single Stock Input
              </button>
              <button
                onClick={() => setModalTab("csv")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  modalTab === "csv" ? "border-primary text-primary" : "border-transparent text-slate-500"
                }`}
              >
                📁 Import CSV File
              </button>
            </div>

            {modalTab === "manual" ? (
              <form onSubmit={handleAddHolding} className="space-y-4">
                {actionError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Stock Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g. INFY, RELIANCE, TCS, TATAMOTORS"
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase">Avg Purchase Price (₹)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-bold border rounded-xl text-slate-600">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl">
                    {submitting ? "Adding..." : "Add Holding"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {csvError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{csvError}</span>
                  </div>
                )}
                {csvSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{csvSuccess}</span>
                  </div>
                )}

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal">CSV Format: Symbol, Quantity, Price</span>
                    <button onClick={downloadSampleCSV} className="text-[11px] text-primary hover:underline font-bold flex items-center space-x-1">
                      <Download className="w-3.5 h-3.5" />
                      <span>Sample Template</span>
                    </button>
                  </div>

                  <label className="flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-primary/40 hover:border-primary bg-white p-6 rounded-xl cursor-pointer transition-all">
                    {submitting ? (
                      <div className="flex flex-col items-center space-y-2 py-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-xs font-bold text-primary">Importing and validating rows atomically...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-primary" />
                        <span className="text-xs font-bold text-primary">Upload CSV File to Import Holdings</span>
                        <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                      </>
                    )}
                  </label>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-bold border rounded-xl text-slate-600">
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
