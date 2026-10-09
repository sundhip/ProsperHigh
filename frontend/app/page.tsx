"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, UserSession } from "@/lib/auth";
import { getPortfolio, getProfile, getWatchlist, getMarketIntelligence, getAnalysisHistory } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { BigNumber } from "@/components/ui/BigNumber";
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
  ShieldCheck,
  Activity,
  Layers,
  Search,
  PlusCircle,
  FileText,
  Star,
  ExternalLink,
  ChevronRight,
  Send,
  Plus,
  Compass
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
  const [historyRuns, setHistoryRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);

    const loadData = async () => {
      try {
        const intel = await getMarketIntelligence();
        setMarketIntel(intel);

        if (u) {
          const [portRes, profRes, wlRes, histRes] = await Promise.all([
            getPortfolio(u.id),
            getProfile(u.id),
            getWatchlist(),
            getAnalysisHistory(),
          ]);
          setPortfolio(portRes);
          setProfile(profRes);
          setWatchlist(wlRes.items || []);
          setHistoryRuns(histRes || []);
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

  // Recharts theme colors from CSS variables
  const SECTOR_COLORS = ["#22C55E", "#FACC15", "#38BDF8", "#A78BFA", "#F87171", "#34D399", "#FB923C"];

  // Mock smooth performance curve data (Ref A "Overview")
  const performanceCurve = [
    { month: "Jan", portfolio: 42000, benchmark: 40000 },
    { month: "Feb", portfolio: 46500, benchmark: 42000 },
    { month: "Mar", portfolio: 44000, benchmark: 41500 },
    { month: "Apr", portfolio: 51200, benchmark: 44000 },
    { month: "May", portfolio: 49800, benchmark: 45200 },
    { month: "Jun", portfolio: 58400, benchmark: 47000 },
    { month: "Jul", portfolio: 64200, benchmark: 49500 },
    { month: "Aug", portfolio: 62000, benchmark: 51000 },
    { month: "Sep", portfolio: 71500, benchmark: 53500 },
    { month: "Oct", portfolio: 76800, benchmark: 56000 },
    { month: "Nov", portfolio: 82400, benchmark: 58200 },
    { month: "Dec", portfolio: (portfolio?.total_value || 89500), benchmark: 60500 },
  ];

  // ==========================================
  // UNAUTHENTICATED: MARKETING / PREVIEW STATE
  // ==========================================
  if (!user) {
    return (
      <div className="space-y-10 py-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-surface-elevated border border-border-subtle px-4 py-1.5 rounded-full text-xs font-semibold text-secondary">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Explainable Multi-Agent Financial Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight font-display leading-tight">
            Understand Your Investments. <br />
            <span className="text-accent">Understand Why.</span>
          </h1>

          <p className="text-sm text-secondary max-w-xl mx-auto leading-relaxed">
            ProsperHigh combines verified corporate filings, real market data, portfolio risk analysis, and seven-agent deterministic AI reasoning into one cohesive bento platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-full shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3 bg-surface border border-border-subtle hover:bg-surface-elevated text-primary font-bold text-xs rounded-full shadow-sm transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Live Market Movers Bento Preview */}
        {marketIntel && (
          <div className="prosper-card p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-primary font-display">
                  Active Market Movers
                </h3>
                <p className="text-xs text-secondary-muted">
                  Real prices from {marketIntel.provider || "NSE"} ({marketIntel.as_of})
                </p>
              </div>
              <Link href="/market-intelligence" className="text-xs font-bold text-accent hover:underline flex items-center space-x-1">
                <span>View Full Market</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(marketIntel.top_gainers || []).slice(0, 4).map((g: any) => (
                <Link
                  key={g.symbol}
                  href={`/analyze?symbol=${g.symbol}`}
                  className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle hover:border-border-default transition-all"
                >
                  <div className="text-xs font-bold text-primary">{g.symbol}</div>
                  <div className="text-sm font-extrabold font-mono text-primary tabular-nums mt-1">₹{g.price}</div>
                  <div className="text-[11px] font-bold text-accent tabular-nums">+{g.change_pct}%</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED COMMAND CENTER BENTO GRID (Ref A to D)
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Guided Onboarding Journey Checklist */}
      <GettingStartedGuide
        hasHoldings={hasHoldings}
        hasAnalyzed={historyRuns.length > 0}
        hasResearched={false}
      />

      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <>
          {/* 12-Column Bento Grid Row 1: Hero Portfolio Card (span 4) + 3 Metric Cards (span 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Hero Card: Total Portfolio Value (Ref B 'Total Balance' & Ref C 'Total Income') */}
            <div className="lg:col-span-4 prosper-card p-6 bg-gradient-to-br from-surface to-surface-elevated border border-border-subtle flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-secondary">
                    Total Portfolio Value
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                    Live Feed
                  </span>
                </div>

                <div className="pt-2">
                  <BigNumber
                    value={portfolio?.total_value || 0}
                    currency="₹"
                    size="xl"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                      (portfolio?.day_change_pct ?? 0) >= 0
                        ? "bg-accent/15 text-accent border border-accent/25"
                        : "bg-negative/15 text-negative border border-negative/25"
                    }`}
                  >
                    {(portfolio?.day_change_pct ?? 0) >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {(portfolio?.day_change_pct ?? 0) >= 0 ? "+" : ""}
                      {(portfolio?.day_change_pct ?? 0).toFixed(2)}%
                    </span>
                  </span>
                  <span className="text-xs text-secondary-muted">today</span>
                </div>
              </div>

              {/* Action Pill Buttons (like Send/Request in Ref B) */}
              <div className="grid grid-cols-2 gap-2 pt-5">
                <Link
                  href="/analyze"
                  className="py-2.5 px-3 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-full shadow-sm text-center flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </Link>
                <Link
                  href="/portfolio"
                  className="py-2.5 px-3 bg-surface-elevated hover:bg-surface text-primary border border-border-subtle font-bold text-xs rounded-full text-center flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Holding</span>
                </Link>
              </div>
            </div>

            {/* 3 Metric Cards (span 8) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                changeLabel="All-Time"
                icon={<TrendingUp className="w-4 h-4" />}
                termKey="unrealized_pnl"
              />
              <MetricCard
                label="Portfolio Health"
                value={portfolio?.health_score ? `${portfolio.health_score}/100` : "Good"}
                sublabel={portfolio?.risk_level || "Balanced Allocation"}
                icon={<ShieldCheck className="w-4 h-4" />}
                termKey="health_score"
              />
            </div>
          </div>

          {/* 12-Column Bento Grid Row 2: Performance Line Chart (span 8) + Allocation Donut with hatched pattern (span 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Smooth Performance Chart (Ref A 'Overview') */}
            <div className="lg:col-span-8 prosper-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-primary font-display">
                    Performance Trajectory
                  </h3>
                  <p className="text-xs text-secondary-muted">
                    Portfolio vs Nifty 50 benchmark growth
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    <span className="text-secondary font-medium">Portfolio</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-yellow" />
                    <span className="text-secondary font-medium">Nifty 50</span>
                  </div>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPort" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FACC15" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      stroke="#8E8E93"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#8E8E93"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 bg-surface border border-border-subtle rounded-2xl shadow-xl text-xs space-y-1">
                              <div className="font-bold text-primary">{payload[0].payload.month}</div>
                              <div className="text-accent font-bold">Portfolio: ₹{payload[0].value?.toLocaleString()}</div>
                              <div className="text-accent-yellow font-bold">Benchmark: ₹{payload[1]?.value?.toLocaleString()}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="portfolio"
                      stroke="#22C55E"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPort)"
                    />
                    <Area
                      type="monotone"
                      dataKey="benchmark"
                      stroke="#FACC15"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorBench)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Thick Allocation Donut with diagonal-hatched segment (Ref D 'Spendings') */}
            <div className="lg:col-span-4 prosper-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-extrabold text-primary font-display">
                    Asset Allocation
                  </h3>
                  <p className="text-xs text-secondary-muted">
                    Sector distribution & concentration
                  </p>
                </div>
                <Link href="/portfolio" className="text-secondary-muted hover:text-accent">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {sectorData.length > 0 ? (
                <div className="relative h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {/* Diagonal hatch pattern like Ref D */}
                        <pattern id="diagonalHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="6" stroke="#22C55E" strokeWidth="2" />
                        </pattern>
                      </defs>
                      <Pie
                        data={sectorData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {sectorData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? "url(#diagonalHatch)" : SECTOR_COLORS[index % SECTOR_COLORS.length]}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Weight"]}
                        contentStyle={{
                          backgroundColor: "var(--bg-surface)",
                          borderColor: "var(--border-subtle)",
                          borderRadius: "1rem",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center percentage badge (Ref D) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black font-display text-primary">
                      {sectorData[0]?.value ? `${Math.round(sectorData[0].value)}%` : "100%"}
                    </span>
                    <span className="text-[10px] text-secondary-muted font-medium">Top Sector</span>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-secondary-muted font-medium">
                  Add holdings to inspect allocation.
                </div>
              )}

              {/* Bottom Chip Legend */}
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {sectorData.slice(0, 4).map((s, idx) => (
                  <div key={s.name} className="flex items-center space-x-1.5 text-[11px] text-secondary">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: idx === 0 ? "#22C55E" : SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                    />
                    <span>{s.name} ({s.value.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 12-Column Bento Grid Row 3: Transaction/Holdings Table (span 8, Ref B style) + Right Widgets (span 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Holdings Table: letter avatar circles, thin dividers, amount pills (Ref B style) */}
            <div className="lg:col-span-8 prosper-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-primary font-display">
                    Holdings Portfolio
                  </h3>
                  <p className="text-xs text-secondary-muted">
                    Positions tracked across live market feeds
                  </p>
                </div>
                <Link
                  href="/portfolio"
                  className="px-3.5 py-1.5 rounded-full bg-surface-elevated hover:bg-surface text-xs font-bold text-primary border border-border-subtle transition-colors"
                >
                  View All
                </Link>
              </div>

              {hasHoldings ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle text-secondary-muted uppercase text-[10px] tracking-wider font-semibold">
                        <th className="pb-3 pl-1">Instrument</th>
                        <th className="pb-3 text-right">Qty</th>
                        <th className="pb-3 text-right">Avg Cost</th>
                        <th className="pb-3 text-right">Price</th>
                        <th className="pb-3 text-right">P&L</th>
                        <th className="pb-3 text-right pr-1">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {holdings.slice(0, 5).map((h: any) => {
                        const pnl = h.unrealized_pnl ?? 0;
                        const pnlPct = h.unrealized_pnl_pct ?? 0;
                        return (
                          <tr key={h.symbol} className="hover:bg-surface-elevated/60 transition-colors group">
                            <td className="py-3.5 pl-1">
                              <div className="flex items-center space-x-3">
                                {/* Letter avatar circle (Ref B) */}
                                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center font-bold text-xs text-primary shrink-0">
                                  {h.symbol[0]}
                                </div>
                                <div>
                                  <Link
                                    href={`/analyze?symbol=${h.symbol}`}
                                    className="font-bold text-primary group-hover:text-accent transition-colors"
                                  >
                                    {h.symbol}
                                  </Link>
                                  <div className="text-[10px] text-secondary-muted">{h.sector || "Equity"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 text-right font-mono tabular-nums text-secondary">
                              {h.quantity}
                            </td>
                            <td className="py-3.5 text-right font-mono tabular-nums text-secondary">
                              ₹{Number(h.average_price).toFixed(2)}
                            </td>
                            <td className="py-3.5 text-right font-mono tabular-nums text-primary font-bold">
                              ₹{Number(h.current_price).toFixed(2)}
                            </td>
                            <td className="py-3.5 text-right font-mono tabular-nums">
                              <span
                                className={`font-bold inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[11px] ${
                                  pnl >= 0 ? "bg-accent/15 text-accent" : "bg-negative/15 text-negative"
                                }`}
                              >
                                <span>{pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)</span>
                              </span>
                            </td>
                            <td className="py-3.5 text-right pr-1">
                              <Link
                                href={`/analyze?symbol=${h.symbol}`}
                                className="p-1.5 rounded-full hover:bg-surface text-secondary-muted hover:text-primary transition-colors inline-block"
                                title="Analyze Stock"
                              >
                                <Search className="w-3.5 h-3.5" />
                              </Link>
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

            {/* Right List Cards: Watchlist & Statutory Filings (span 4, Ref A & D style) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Watchlist card */}
              <div className="prosper-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-accent-yellow" />
                    <h3 className="text-base font-extrabold text-primary font-display">
                      Watchlist
                    </h3>
                  </div>
                  <Link href="/watchlist" className="text-xs font-bold text-accent hover:underline">
                    Manage
                  </Link>
                </div>

                {watchlist.length > 0 ? (
                  <div className="space-y-2">
                    {watchlist.slice(0, 4).map((w: any) => (
                      <div
                        key={w.symbol}
                        className="p-3 rounded-2xl bg-surface-elevated border border-border-subtle flex items-center justify-between hover:border-border-default transition-all"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-surface border border-border-subtle flex items-center justify-center font-bold text-xs text-primary">
                            {w.symbol[0]}
                          </div>
                          <div>
                            <Link href={`/analyze?symbol=${w.symbol}`} className="font-bold text-xs text-primary hover:text-accent">
                              {w.symbol}
                            </Link>
                            <div className="text-[10px] text-secondary-muted truncate max-w-[120px]">{w.name}</div>
                          </div>
                        </div>
                        {w.current_price && (
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-primary tabular-nums">₹{w.current_price}</div>
                            {typeof w.change_pct === "number" && (
                              <div className={`text-[10px] font-bold tabular-nums ${w.change_pct >= 0 ? "text-accent" : "text-negative"}`}>
                                {w.change_pct >= 0 ? "+" : ""}{w.change_pct}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 text-xs text-secondary-muted">
                    <p>No securities in watchlist.</p>
                    <Link href="/watchlist" className="text-accent font-bold mt-1 inline-block">
                      Add benchmark stocks →
                    </Link>
                  </div>
                )}
              </div>

              {/* Statutory Disclosures */}
              <div className="prosper-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-secondary-muted" />
                    <h3 className="text-base font-extrabold text-primary font-display">
                      Filings Feed
                    </h3>
                  </div>
                  <Link href="/research" className="text-xs font-bold text-accent hover:underline">
                    Terminal
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {(marketIntel?.recent_filings || []).slice(0, 3).map((f: any) => (
                    <div key={f.id} className="p-3 rounded-2xl border border-border-subtle bg-surface-elevated space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface text-primary border border-border-subtle">
                          {f.symbol}
                        </span>
                        <span className="text-[10px] text-secondary-muted">{f.reporting_period || "Statutory"}</span>
                      </div>
                      <h5 className="text-xs font-bold text-primary line-clamp-1">
                        {f.title}
                      </h5>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-secondary-muted">{f.source}</span>
                        {f.source_url && (
                          <a
                            href={f.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-semibold text-accent flex items-center space-x-0.5 hover:underline"
                          >
                            <span>Filing URL</span>
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
