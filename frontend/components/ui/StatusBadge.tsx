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
        return "bg-accent/10 text-accent border-accent/20";
      case "negative":
        return "bg-negative/10 text-negative border-negative/20";
      case "warning":
      case "stale":
        return "bg-accent-yellow/15 text-accent-yellow border-accent-yellow/25";
      case "info":
        return "bg-surface-elevated text-primary border-border-subtle";
      case "neutral":
      default:
        return "bg-surface-elevated text-secondary border-border-subtle";
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case "positive":
      case "verified":
        return "bg-accent";
      case "negative":
        return "bg-negative";
      case "warning":
      case "stale":
        return "bg-accent-yellow";
      case "info":
        return "bg-primary";
      case "neutral":
      default:
        return "bg-secondary-muted";
    }
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 border font-semibold rounded-full ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      } ${getStyles()}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />}
      <span>{label}</span>
    </span>
  );
};
