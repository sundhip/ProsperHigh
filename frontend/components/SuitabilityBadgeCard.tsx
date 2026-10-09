"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, ShieldX, HelpCircle, ArrowRight, UserCheck } from "lucide-react";
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
  const missingFields = suitabilityAssessment?.missing_profile_fields || [];
  const reasons = suitabilityAssessment?.suitability_reasons || [];
  const constraints = suitabilityAssessment?.constraint_checks || {};

  const getSuitabilityStyle = () => {
    switch (suitabilityVerdict) {
      case "SUITABLE":
        return {
          bg: "bg-accent/10 border-accent/25 text-primary",
          badge: "bg-accent text-black font-extrabold",
          icon: <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />,
          label: "SUITABLE FOR YOUR PORTFOLIO",
        };
      case "CAUTION":
        return {
          bg: "bg-accent-yellow/10 border-accent-yellow/25 text-primary",
          badge: "bg-accent-yellow text-black font-extrabold",
          icon: <AlertTriangle className="w-5 h-5 text-accent-yellow shrink-0" />,
          label: "CAUTION — CONCENTRATION OR HORIZON MISMATCH",
        };
      case "UNSUITABLE":
        return {
          bg: "bg-negative/10 border-negative/25 text-primary",
          badge: "bg-negative text-white font-extrabold",
          icon: <ShieldX className="w-5 h-5 text-negative shrink-0" />,
          label: "UNSUITABLE — VIOLATES RISK PROFILE",
        };
      default:
        return {
          bg: "bg-surface-elevated border-border-subtle text-primary",
          badge: "bg-surface text-secondary-muted font-bold",
          icon: <HelpCircle className="w-5 h-5 text-secondary-muted shrink-0" />,
          label: "LIMITED ASSESSMENT (PROFILE INCOMPLETE)",
        };
    }
  };

  const suitStyle = getSuitabilityStyle();

  return (
    <div className="prosper-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-muted">
            Separation of Concerns
          </span>
          <h3 className="text-base font-extrabold text-primary font-display">
            Investment Quality vs Personal Suitability
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-secondary-muted">Decision Engine:</span>
          <span className="font-mono bg-surface-elevated px-2 py-0.5 rounded-full text-secondary text-[10px] font-bold border border-border-subtle">
            {investmentAssessment?.engine_version || "v3.1.0"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: General Investment Quality */}
        <div className="p-5 rounded-2xl border border-border-subtle bg-surface-elevated space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary-muted uppercase tracking-wider">
              1. Instrument Quality (Market-Wide)
            </span>
            <span
              className={`text-xs font-extrabold px-3 py-0.5 rounded-full tabular-nums ${
                qualityVerdict === "BUY"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : qualityVerdict === "HOLD"
                  ? "bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30"
                  : "bg-negative/15 text-negative border border-negative/30"
              }`}
            >
              {qualityVerdict}
            </span>
          </div>

          <div className="flex items-baseline space-x-6">
            <div>
              <div className="text-[10px] text-secondary-muted uppercase font-bold">Asset Score</div>
              <div className="text-xl font-black text-primary tabular-nums">
                {qualityScore > 0 ? `+${qualityScore}` : qualityScore} pts
              </div>
            </div>
            <div>
              <div className="text-[10px] text-secondary-muted uppercase font-bold">Confidence</div>
              <div className="text-xl font-black text-primary tabular-nums">{qualityConfidence}%</div>
            </div>
          </div>

          <p className="text-xs text-secondary leading-relaxed">
            {investmentAssessment?.rationale ||
              `Evaluates ${symbol} fundamentals, momentum, sentiment, and macro risks independent of individual constraints.`}
          </p>
        </div>

        {/* Right: Personal Suitability Assessment */}
        <div className={`p-5 rounded-2xl border space-y-3 ${suitStyle.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-accent" />
              <span>2. Your Personal Suitability</span>
            </span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full ${suitStyle.badge}`}>
              {suitabilityVerdict}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {suitStyle.icon}
            <span className="font-extrabold text-xs tracking-tight text-primary font-display">{suitStyle.label}</span>
          </div>

          {suitabilityVerdict === "LIMITED_ASSESSMENT" ? (
            <div className="space-y-2 bg-surface p-3.5 rounded-xl border border-border-subtle">
              <p className="text-xs text-secondary">
                Personalization was <strong>not applied</strong> because your profile is incomplete. ProsperHigh does not assume defaults.
              </p>
              {missingFields.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-secondary-muted">Missing Profile Inputs:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {missingFields.map((field) => (
                      <span key={field} className="text-[10px] bg-surface-elevated px-2 py-0.5 rounded-full border border-border-subtle font-mono text-secondary">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-1">
                <Link
                  href="/profile"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-accent hover:underline"
                >
                  <span>Complete Investor Profile to Unlock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2 bg-surface p-3.5 rounded-xl border border-border-subtle">
              <ul className="space-y-1.5">
                {reasons.map((r, idx) => (
                  <li key={idx} className="text-xs text-secondary flex items-start space-x-1.5">
                    <span className="text-accent font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {constraints && Object.keys(constraints).length > 0 && (
                <div className="pt-2 border-t border-border-subtle flex flex-wrap gap-2 text-[10px]">
                  {constraints.avoided_sector_breach && (
                    <span className="bg-negative/15 text-negative border border-negative/25 px-2.5 py-0.5 rounded-full font-bold">
                      ⚠ Sector Exclusion Hit: {constraints.avoided_sector_breach}
                    </span>
                  )}
                  {constraints.exposure_cap_breached && (
                    <span className="bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/25 px-2.5 py-0.5 rounded-full font-bold">
                      ⚠ Single Stock Exposure Cap Exceeded
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
