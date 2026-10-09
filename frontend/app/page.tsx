"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, UserSession } from "@/lib/auth";
import { getPortfolio, getProfile, getWatchlist, getMarketIntelligence } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { GettingStartedGuide } from "@/components/GettingStartedGuide";
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Layers,
  Search,
  BookOpen,
  PlusCircle,
  AlertCircle,
  FileText,
  Clock,
  Compass,
  Star,
  ExternalLink
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function DashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [marketIntel, setMarketIntel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);

    const loadData = async () => {
      try {
        const intel = await getMarketIntelligence();
        setMarketIntel(intel);

        if (u) {
          const [portRes, profRes, wlRes] = await Promise.all([
            getPortfolio(u.id),
            getProfile(u.id),
            getWatchlist(),
          ]);
          setPortfolio(portRes);
          setProfile(profRes);
          setWatchlist(wlRes.items || []);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const handleAuth = () => {
      const updated = getStoredUser();
      setUser(updated);
      if (updated) {
        getPortfolio(updated.id).then(setPortfolio);
        getWatchlist().then((r) => setWatchlist(r.items || []));
      }
    };
    window.addEventListener("auth-changed", handleAuth);
    return () => window.removeEventListener("auth-changed", handleAuth);
  }, []);

  const hasHoldings = (portfolio?.holdings?.length || 0) > 0;
  const holdings = portfolio?.holdings || [];

  const sectorData = Object.entries(portfolio?.sector_exposure || {}).map(([name, val]) => ({
    name,
    value: Number(val),
  }));

  const SECTOR_COLORS = ["#1F3A4A", "#4F7C7A", "#C9A96E", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

  // ==========================================
  // UNAUTHENTICATED: MARKETING / PREVIEW STATE
  // ==========================================
  if (!user) {
    return (
      <div className="space-y-12 py-6">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>Explainable Multi-Agent Financial Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display leading-tight">
            Understand Your Investments. <br />
            <span className="text-slate-600 dark:text-sky-400">Understand Why.</span>
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            ProsperHigh combines verified corporate filings, real market data, portfolio risk analysis, and seven-agent deterministic AI reasoning into one cohesive platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Live Market Movers Preview */}
        {marketIntel && (
          <div className="prosper-card p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                  Active Market Movers
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real prices from {marketIntel.provider || "NSE"} ({marketIntel.as_of})
                </p>
              </div>
              <Link href="/market-intelligence" className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1">
                <span>View Full Market</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(marketIntel.top_gainers || []).slice(0, 4).map((g: any) => (
                <Link
                  key={g.symbol}
                  href={`/analyze?symbol=${g.symbol}`}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{g.symbol}</div>
                  <div className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-100 tabular-nums mt-1">₹{g.price}</div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+{g.change_pct}%</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED COMMAND CENTER DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Welcome & Health Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
            Investment Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Welcome back, {user.name || "Investor"}. Data fresh as of {marketIntel?.as_of || "UTC"}.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/analyze"
            className="px-3.5 py-2 bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>New Stock Investigation</span>
          </Link>
          <Link
            href="/portfolio"
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Manage Holdings</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <>
          {/* Guided Onboarding Journey Checklist */}
          <GettingStartedGuide
            hasHoldings={hasHoldings}
            hasAnalyzed={true}
            hasResearched={false}
          />

          {/* Key Portfolio Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Portfolio Value"
              value={`₹${(portfolio?.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
              changePct={portfolio?.day_change_pct ?? null}
              changeLabel="1D Change"
              asOf={marketIntel?.as_of}
              icon={<PieIcon className="w-4 h-4" />}
              termKey="cost_basis"
            />
            <MetricCard
              label="Total Cost Basis"
              value={`₹${(portfolio?.total_cost || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
              sublabel={`${holdings.length} Active Positions`}
              icon={<Layers className="w-4 h-4" />}
              termKey="cost_basis"
            />
            <MetricCard
              label="Unrealized P&L"
              value={`₹${(portfolio?.total_unrealized_pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
              changePct={portfolio?.total_return_pct ?? null}
              changeLabel="Total Return"
              icon={<TrendingUp className="w-4 h-4" />}
              termKey="unrealized_pnl"
            />
            <MetricCard
              label="Portfolio Health"
              value={portfolio?.health_score ? `${portfolio.health_score}/100` : "Good"}
              sublabel={portfolio?.risk_level || "Balanced Risk"}
              icon={<ShieldCheck className="w-4 h-4" />}
              termKey="health_score"
            />
          </div>

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Holdings & Asset Allocation (Left 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Holdings Summary */}
              <div className="prosper-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                      Holdings & Allocation
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Top positions tracked across exchange feeds
                    </p>
                  </div>
                  <Link
                    href="/portfolio"
                    className="text-xs font-bold text-slate-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {hasHoldings ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="pb-2.5">Instrument</th>
                          <th className="pb-2.5 text-right">Qty</th>
                          <th className="pb-2.5 text-right">Avg Price</th>
                          <th className="pb-2.5 text-right">Current Price</th>
                          <th className="pb-2.5 text-right">Weight</th>
                          <th className="pb-2.5 text-right">Unrealized P&L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {holdings.slice(0, 5).map((h: any) => {
                          const pnl = h.unrealized_pnl ?? 0;
                          const pnlPct = h.unrealized_pnl_pct ?? 0;
                          return (
                            <tr key={h.symbol} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3">
                                <Link
                                  href={`/analyze?symbol=${h.symbol}`}
                                  className="font-bold text-slate-900 dark:text-white hover:text-[#C9A96E] dark:hover:text-sky-400"
                                >
                                  {h.symbol}
                                </Link>
                                <span className="block text-[10px] text-slate-400">{h.sector || "General"}</span>
                              </td>
                              <td className="py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {h.quantity}
                              </td>
                              <td className="py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                ₹{Number(h.average_price).toFixed(2)}
                              </td>
                              <td className="py-3 text-right font-mono tabular-nums text-slate-900 dark:text-white font-bold">
                                ₹{Number(h.current_price).toFixed(2)}
                              </td>
                              <td className="py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                                {typeof h.weight_pct === "number" ? `${h.weight_pct.toFixed(1)}%` : "—"}
                              </td>
                              <td className="py-3 text-right font-mono tabular-nums">
                                <span
                                  className={`font-bold ${
                                    pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                  }`}
                                >
                                  {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="No Holdings Recorded"
                    description="Add securities or import transactions to begin calculating live portfolio health and allocation metrics."
                    actionLabel="Add First Holding"
                    actionHref="/portfolio"
                  />
                )}
              </div>

              {/* Sector Exposure Chart */}
              {sectorData.length > 0 && (
                <div className="prosper-card p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display mb-1">
                    Sector Diversification
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Concentration risk calculated across portfolio weight
                  </p>
                  <div className="h-44 w-full">
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
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {sectorData.map((s, idx) => (
                      <div key={s.name} className="flex items-center space-x-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }} />
                        <span>{s.name} ({s.value.toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: AI Attention & Watchlist */}
            <div className="space-y-6">
              {/* Watchlist Quick Peek */}
              <div className="prosper-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-[#C9A96E]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                      Watchlist
                    </h3>
                  </div>
                  <Link href="/watchlist" className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline">
                    Manage
                  </Link>
                </div>

                {watchlist.length > 0 ? (
                  <div className="space-y-2">
                    {watchlist.slice(0, 4).map((w: any) => (
                      <div
                        key={w.symbol}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <Link href={`/analyze?symbol=${w.symbol}`} className="font-bold text-xs text-slate-900 dark:text-white hover:underline">
                            {w.symbol}
                          </Link>
                          <div className="text-[10px] text-slate-400">{w.name}</div>
                        </div>
                        {w.current_price && (
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">₹{w.current_price}</div>
                            {typeof w.change_pct === "number" && (
                              <div className={`text-[10px] font-bold tabular-nums ${w.change_pct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                {w.change_pct >= 0 ? "+" : ""}{w.change_pct}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    <p>No securities in watchlist.</p>
                    <Link href="/watchlist" className="text-sky-600 dark:text-sky-400 font-bold mt-1 inline-block">
                      Add benchmark stocks →
                    </Link>
                  </div>
                )}
              </div>

              {/* Verified Statutory Filings Attention Feed */}
              <div className="prosper-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                      Statutory Disclosures
                    </h3>
                  </div>
                  <Link href="/research" className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline">
                    Research Terminal
                  </Link>
                </div>

                <div className="space-y-3">
                  {(marketIntel?.recent_filings || []).slice(0, 3).map((f: any) => (
                    <div key={f.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {f.symbol}
                        </span>
                        <span className="text-[10px] text-slate-400">{f.reporting_period || "Statutory"}</span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {f.title}
                      </h5>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">{f.source}</span>
                        {f.source_url && (
                          <a
                            href={f.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 flex items-center space-x-0.5 hover:underline"
                          >
                            <span>Exchange URL</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
