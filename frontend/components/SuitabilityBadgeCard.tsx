"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, ShieldX, HelpCircle, ArrowRight, UserCheck, Lock } from "lucide-react";
import Link from "next/link";

interface Props {
  investmentAssessment?: {
    verdict?: string;
    confidence?: number;
    score?: number;
    rationale?: string;
    engine_version?: string;
  };
  suitabilityAssessment?: {
    suitability_verdict?: string;
    is_personalized?: boolean;
    profile_version?: number;
    suitability_reasons?: string[];
    missing_profile_fields?: string[];
    constraint_checks?: Record<string, any>;
    portfolio_impact?: Record<string, any>;
  };
  symbol: string;
}

export const SuitabilityBadgeCard: React.FC<Props> = ({
  investmentAssessment,
  suitabilityAssessment,
  symbol,
}) => {
  const qualityVerdict = investmentAssessment?.verdict || "HOLD";
  const qualityScore = investmentAssessment?.score ?? 0;
  const qualityConfidence = investmentAssessment?.confidence ?? 50;

  const suitabilityVerdict = suitabilityAssessment?.suitability_verdict || "LIMITED_ASSESSMENT";
  const isPersonalized = suitabilityAssessment?.is_personalized ?? false;
  const missingFields = suitabilityAssessment?.missing_profile_fields || [];
  const reasons = suitabilityAssessment?.suitability_reasons || [];
  const constraints = suitabilityAssessment?.constraint_checks || {};

  const getSuitabilityStyle = () => {
    switch (suitabilityVerdict) {
      case "SUITABLE":
        return {
          bg: "bg-emerald-50 border-emerald-300 text-emerald-900",
          badge: "bg-emerald-600 text-white",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          label: "SUITABLE FOR YOUR PROFILE",
        };
      case "CAUTION":
        return {
          bg: "bg-amber-50 border-amber-300 text-amber-900",
          badge: "bg-amber-500 text-white",
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          label: "CAUTION — PROFILE MISMATCH RISKS",
        };
      case "UNSUITABLE":
        return {
          bg: "bg-rose-50 border-rose-300 text-rose-900",
          badge: "bg-rose-600 text-white",
          icon: <ShieldX className="w-5 h-5 text-rose-600 shrink-0" />,
          label: "UNSUITABLE — VIOLATES RISK / CRITERIA",
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-300 text-slate-800",
          badge: "bg-slate-600 text-white",
          icon: <HelpCircle className="w-5 h-5 text-slate-500 shrink-0" />,
          label: "LIMITED ASSESSMENT (PROFILE INCOMPLETE)",
        };
    }
  };

  const suitStyle = getSuitabilityStyle();

  return (
    <div className="prosper-card p-6 border-l-4 border-l-primary space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Phase 4 Intelligence Separation
          </span>
          <h3 className="text-base font-extrabold text-charcoal font-manrope">
            Investment Quality vs Personal Suitability
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Decision Engine:</span>
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
            {investmentAssessment?.engine_version || "v3.1.0"}
          </span>
          <span className="text-slate-500">| Suitability:</span>
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
            v4.0.0
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: General Investment Quality */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">
              1. Instrument Quality (Market-Wide)
            </span>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                qualityVerdict === "BUY"
                  ? "bg-emerald-100 text-emerald-800"
                  : qualityVerdict === "HOLD"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {qualityVerdict}
            </span>
          </div>

          <div className="flex items-baseline space-x-4">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Asset Score</div>
              <div className="text-xl font-black text-charcoal">
                {qualityScore > 0 ? `+${qualityScore}` : qualityScore} pts
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Model Confidence</div>
              <div className="text-xl font-black text-primary">{qualityConfidence}%</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {investmentAssessment?.rationale ||
              `Evaluates ${symbol} fundamentals, momentum, sentiment, and macro risks independent of individual user constraints.`}
          </p>
        </div>

        {/* Right: Personal Suitability Assessment */}
        <div className={`p-4 rounded-xl border space-y-3 ${suitStyle.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase opacity-80 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>2. Your Personal Suitability</span>
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${suitStyle.badge}`}>
              {suitabilityVerdict}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {suitStyle.icon}
            <span className="font-extrabold text-xs tracking-tight">{suitStyle.label}</span>
          </div>

          {suitabilityVerdict === "LIMITED_ASSESSMENT" ? (
            <div className="space-y-2 bg-white/80 p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-700">
                Personalization was <strong>not applied</strong> because your investor profile is incomplete. ProsperHigh does not invent default assumptions.
              </p>
              {missingFields.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Missing Profile Inputs:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {missingFields.map((field) => (
                      <span key={field} className="text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-700">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-1">
                <Link
                  href="/profile"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>Complete Investor Profile to Unlock Suitability</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2 bg-white/80 p-3 rounded-lg border border-slate-200/80">
              <ul className="space-y-1.5">
                {reasons.map((r, idx) => (
                  <li key={idx} className="text-xs text-slate-800 flex items-start space-x-1.5">
                    <span className="text-primary font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {constraints && Object.keys(constraints).length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-2 text-[10px]">
                  {constraints.avoided_sector_breach && (
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                      ⚠ Sector Exclusion Hit: {constraints.avoided_sector_breach}
                    </span>
                  )}
                  {constraints.exposure_cap_breached && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                      ⚠ Single Stock Exposure Cap Exceeded
                    </span>
                  )}
                  {constraints.horizon_match === false && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                      ⚠ Investment Horizon Mismatch
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
