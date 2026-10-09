"use client";

import React from "react";

export type BadgeVariant =
  | "positive"
  | "negative"
  | "warning"
  | "neutral"
  | "info"
  | "stale"
  | "verified";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = "neutral",
  size = "md",
  dot = true,
}) => {
  const getStyles = () => {
    switch (variant) {
      case "positive":
      case "verified":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60";
      case "negative":
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60";
      case "warning":
      case "stale":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60";
      case "info":
        return "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60";
      case "neutral":
      default:
        return "bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case "positive":
      case "verified":
        return "bg-emerald-500";
      case "negative":
        return "bg-rose-500";
      case "warning":
      case "stale":
        return "bg-amber-500";
      case "info":
        return "bg-sky-500";
      case "neutral":
      default:
        return "bg-slate-400";
    }
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 border font-semibold rounded-full ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${getStyles()}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />}
      <span>{label}</span>
    </span>
  );
};
