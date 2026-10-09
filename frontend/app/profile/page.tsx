"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getProfile, updateProfile } from "@/lib/api";
import { getStoredUser, UserSession } from "@/lib/auth";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  User as UserIcon,
  ShieldCheck,
  Target,
  Compass,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Save
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable fields
  const [riskCategory, setRiskCategory] = useState("Balanced Growth");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate");
  const [investmentHorizon, setInvestmentHorizon] = useState("3–5 Years");
  const [primaryGoal, setPrimaryGoal] = useState("Wealth Growth");
  const [lossReaction, setLossReaction] = useState("Wait and monitor");
  const [maxStockExposurePct, setMaxStockExposurePct] = useState(20);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u) {
      getProfile(u.id).then((p) => {
        if (p) {
          setProfile(p);
          setRiskCategory(p.risk_category || "Balanced Growth");
          setExperienceLevel(p.experience_level || "Intermediate");
          setInvestmentHorizon(p.investment_horizon || "3–5 Years");
          setPrimaryGoal(p.primary_goal_top || "Wealth Growth");
          setLossReaction(p.loss_reaction || "Wait and monitor");
          setMaxStockExposurePct(p.max_stock_exposure_pct || 20);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await updateProfile({
        risk_category: riskCategory,
        experience_level: experienceLevel,
        investment_horizon: investmentHorizon,
        primary_goal_top: primaryGoal,
        loss_reaction: lossReaction,
        max_stock_exposure_pct: Number(maxStockExposurePct),
      });
      setProfile(updated);
      setSuccessMsg("Investor profile updated successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <EmptyState
        icon={<UserIcon className="w-8 h-8 text-slate-400" />}
        title="Sign In to Manage Your Profile"
        description="Investor profiles calibrate your personalized suitability assessments and portfolio risk limits."
        actionLabel="Sign In"
        actionHref="/login"
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <UserIcon className="w-5 h-5 text-[#C9A96E]" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
            Investor Profile & Suitability
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          These parameters inform the Phase 4 Suitability Engine when evaluating if an investment matches your risk tolerance.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <CardSkeleton count={3} />
      ) : (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Risk Tolerance"
              value={riskCategory}
              sublabel={`Score: ${profile?.risk_score || 58}/100`}
              icon={<ShieldCheck className="w-4 h-4" />}
            />
            <MetricCard
              label="Investment Horizon"
              value={investmentHorizon}
              sublabel="Target Liquidity"
              icon={<Compass className="w-4 h-4" />}
            />
            <MetricCard
              label="Max Single-Stock Cap"
              value={`${maxStockExposurePct}%`}
              sublabel="Concentration Ceiling"
              icon={<Target className="w-4 h-4" />}
            />
          </div>

          {/* Profile Configuration Form */}
          <div className="prosper-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display mb-4">
              Calibrate Suitability Profile
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Risk Category
                  </label>
                  <select
                    value={riskCategory}
                    onChange={(e) => setRiskCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Balanced Growth">Balanced Growth</option>
                    <option value="Aggressive Growth">Aggressive Growth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Learning Investor">Learning Investor</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced / Professional">Advanced / Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Investment Horizon
                  </label>
                  <select
                    value={investmentHorizon}
                    onChange={(e) => setInvestmentHorizon(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Under 1 Year">Under 1 Year (&lt;12m)</option>
                    <option value="1–3 Years">1–3 Years</option>
                    <option value="3–5 Years">3–5 Years</option>
                    <option value="5+ Years">5+ Years (Long Term)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Financial Objective
                  </label>
                  <select
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Capital Preservation">Capital Preservation</option>
                    <option value="Wealth Growth">Wealth Growth</option>
                    <option value="Dividend Income">Dividend Income</option>
                    <option value="High Growth Speculative">High Growth Speculative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reaction to Market Drawdowns
                  </label>
                  <select
                    value={lossReaction}
                    onChange={(e) => setLossReaction(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Sell immediately to cut loss">Sell immediately to cut loss</option>
                    <option value="Wait and monitor">Wait and monitor</option>
                    <option value="Buy more on dips">Buy more on dips</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Single Stock Weight (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={maxStockExposurePct}
                    onChange={(e) => setMaxStockExposurePct(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 dark:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Preferences"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
