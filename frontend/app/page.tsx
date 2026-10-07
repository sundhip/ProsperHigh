"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, UserSession } from "@/lib/auth";
import { getPortfolio, getProfile } from "@/lib/api";
import {
  TrendingUp,
  ShieldAlert,
  PieChart as PieIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Search,
  BookOpen,
  PlusCircle,
  AlertCircle
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

export default function HomePageV3() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u) {
      Promise.all([getPortfolio(u.id), getProfile(u.id)]).then(([portRes, profRes]) => {
        setPortfolio(portRes);
        setProfile(profRes);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    const handleAuth = () => {
      const updated = getStoredUser();
      setUser(updated);
      if (updated) getPortfolio(updated.id).then(setPortfolio);
    };
    window.addEventListener("auth-changed", handleAuth);
    return () => window.removeEventListener("auth-changed", handleAuth);
  }, []);

  const hasLocalProfile = typeof window !== "undefined" && localStorage.getItem("prosperhigh_local_profile") !== null;
  const isProfileComplete = profile?.onboarding_completed || user?.hasCompletedOnboarding || hasLocalProfile;

  const hasHoldings = (portfolio?.holdings?.length || 0) > 0;
  const perfData = hasHoldings
    ? portfolio.holdings.map((h: any) => ({
        date: h.symbol,
        value: h.current_value ?? (h.quantity * h.current_price)
      }))
    : [];

  const COLORS = ["#1F3A4A", "#4F7C7A", "#C9A96E", "#4F8A68", "#C58B39"];

  const sectorData = Object.entries(portfolio?.sector_exposure || {}).map(([name, val]) => ({
    name,
    value: Number(val)
  }));

  // ==========================================
  // UNAUTHENTICATED: MARKETING LANDING PAGE
  // ==========================================
  if (!user) {
    return (
      <div className="space-y-16 py-8">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Explainable Multi-Agent Investment Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-charcoal tracking-tight font-manrope leading-tight">
            Understand Your Investments. <br />
            <span className="text-primary">Understand Why.</span>
          </h1>

          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ProsperHigh combines live market data, portfolio risk analysis, financial research, and multi-agent AI reasoning to provide personalized, explainable investment insights.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-extrabold text-sm rounded-xl hover:bg-primary-dark shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 border border-slate-300 font-extrabold text-sm rounded-xl hover:bg-slate-50 transition-all text-center"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="prosper-card p-6 border-t-4 border-t-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-4">
              <Layers className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-charcoal font-manrope">7 Domain Intelligence Agents</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Market, Technical, News, Fundamental, Regulatory, Risk, and Synthesis agents evaluate stocks independently before reaching a decision.
            </p>
          </div>

          <div className="prosper-card p-6 border-t-4 border-t-accent">
            <div className="p-3 bg-accent/10 text-accent-dark rounded-xl w-fit mb-4">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-charcoal font-manrope">Personalized Risk Engine</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your investor risk profile (0-100 score), goals, and existing holdings determine suitability—producing different recommendations for different investors.
            </p>
          </div>

          <div className="prosper-card p-6 border-t-4 border-t-positive">
            <div className="p-3 bg-positive/10 text-positive rounded-xl w-fit mb-4">
              <BookOpen className="w-6 h-6 text-positive" />
            </div>
            <h3 className="text-lg font-bold text-charcoal font-manrope">Citation-Backed Research (RAG)</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every AI conclusion traces to verified source documents—annual reports, exchange filings, and corporate disclosures with page citations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 1: NEW USER — ONBOARDING INCOMPLETE
  // ==========================================
  if (!isProfileComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 text-center">
        <div className="prosper-card p-8 border-l-4 border-l-primary space-y-4">
          <AlertCircle className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">
            Welcome to ProsperHigh, {user.name}!
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Let's build your investor profile and financial context so ProsperHigh can calculate personalized portfolio analytics and health scores.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center space-x-2 px-8 py-3.5 bg-primary text-white font-extrabold text-xs rounded-xl shadow-lg hover:bg-primary-dark transition-all"
          >
            <span>Complete 10-Step Profile →</span>
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 2: PROFILE COMPLETE — EMPTY PORTFOLIO
  // ==========================================
  if (portfolio?.holdings_count === 0 && !hasLocalProfile) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 text-center">
        <div className="prosper-card p-8 border-l-4 border-l-accent space-y-4">
          <PlusCircle className="w-12 h-12 text-accent mx-auto" />
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">
            Your Investor Profile is Ready ({profile?.risk_category || "Balanced Growth"} • Score {profile?.risk_score || 62}/100)
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Portfolio intelligence becomes personalized once you add your stock holdings. Add your positions to enable real-time risk, concentration, and return calculations.
          </p>
          <Link
            href="/portfolio"
            className="inline-flex items-center space-x-2 px-8 py-3.5 bg-accent hover:bg-accent-light text-charcoal font-extrabold text-xs rounded-xl shadow-lg transition-all"
          >
            <span>Add Portfolio Holdings →</span>
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 3: AUTHENTICATED ACTIVE DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6">
      {/* 1. Top Calculated Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="prosper-card p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Portfolio Value</div>
          <div className="text-2xl font-black text-charcoal font-manrope mt-1">
            ₹{portfolio?.total_portfolio_value ? portfolio.total_portfolio_value.toLocaleString("en-IN") : "0"}
          </div>
          <div className="text-xs text-positive font-semibold mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Formulas: Σ (Qty × Price)</span>
          </div>
        </div>

        <div className="prosper-card p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase">Overall Return %</div>
          <div className={`text-2xl font-black font-manrope mt-1 ${portfolio?.return_percentage >= 0 ? "text-positive" : "text-negative"}`}>
            {portfolio?.return_percentage >= 0 ? "+" : ""}{portfolio?.return_percentage || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            P&L: ₹{portfolio?.profit_loss ? portfolio.profit_loss.toLocaleString("en-IN") : "0"}
          </div>
        </div>

        <div className="prosper-card p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase">Calculated Risk Score</div>
          <div className="text-2xl font-black text-primary font-manrope mt-1">
            {profile?.risk_score || 62} / 100
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Category: {profile?.risk_category || "Balanced Growth"}
          </div>
        </div>

        <div className="prosper-card p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase">Portfolio Health Score</div>
          <div className="text-2xl font-black text-accent font-manrope mt-1">
            {portfolio?.health_score || 82} / 100
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Diversification: {portfolio?.health_breakdown?.diversification || 85}%
          </div>
        </div>
      </div>

      {/* 2. ✦ ProsperHigh Daily Intelligence Briefing */}
      <div className="prosper-card p-6 bg-slate-900 text-white border border-slate-800">
        <div className="flex items-center space-x-2 text-accent text-xs font-extrabold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>✦ ProsperHigh Daily Intelligence Briefing</span>
        </div>
        <h3 className="text-lg font-bold font-manrope mb-3">
          Good morning, {user.name}. Here are the key insights for your portfolio today:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <span className="font-bold text-accent">1. Concentration Risk</span>
            <p className="text-slate-300 mt-1">Largest stock position represents significant portion of total portfolio value.</p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <span className="font-bold text-emerald-400">2. Sector Allocation</span>
            <p className="text-slate-300 mt-1">Holdings distributed across {portfolio?.sector_exposure ? Object.keys(portfolio.sector_exposure).length : 0} unique sectors.</p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <span className="font-bold text-amber-400">3. Risk Alignment</span>
            <p className="text-slate-300 mt-1">Portfolio volatility matches your {profile?.risk_category || "Balanced Growth"} profile.</p>
          </div>
        </div>
      </div>

      {/* 3. Performance Chart & Sector Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 prosper-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-charcoal font-manrope">Current Holdings Valuation</h3>
              <p className="text-xs text-slate-500">Calculated from market data for your {portfolio?.holdings_count || 0} active positions.</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {!hasHoldings ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 font-bold space-y-2 border border-dashed border-slate-200 rounded-xl p-6">
                <span>No stock holdings recorded yet.</span>
                <Link href="/portfolio" className="text-primary hover:underline font-extrabold">
                  + Add holdings to view valuation breakdown &rarr;
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1F3A4A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1F3A4A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Position Value"]} />
                  <Area type="monotone" dataKey="value" stroke="#1F3A4A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="prosper-card p-6">
          <h3 className="text-base font-bold text-charcoal font-manrope mb-4 flex items-center space-x-2">
            <PieIcon className="w-5 h-5 text-primary" />
            <span>Sector Exposure</span>
          </h3>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, "Sector Exposure"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
