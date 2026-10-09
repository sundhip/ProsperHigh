"use client";

import React from "react";

interface BigNumberProps {
  value: string | number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  tabular?: boolean;
}

export const BigNumber: React.FC<BigNumberProps> = ({
  value,
  currency = "₹",
  size = "lg",
  className = "",
  tabular = true,
}) => {
  if (value === undefined || value === null || value === "") {
    return <span className="text-secondary-muted font-mono">—</span>;
  }

  const rawString = typeof value === "number" ? value.toString() : value.toString();
  // Strip currency if already prefixed in the value string
  const cleanStr = rawString.replace(/^[₹$€£]\s?/, "").trim();

  // Split into whole and decimal parts if applicable
  const parts = cleanStr.split(".");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : "";

  const sizeClasses = {
    sm: { main: "text-lg sm:text-xl font-bold", dec: "text-xs font-semibold", curr: "text-sm mr-0.5" },
    md: { main: "text-xl sm:text-2xl font-bold", dec: "text-sm font-semibold", curr: "text-base mr-1" },
    lg: { main: "text-2xl sm:text-3xl font-extrabold tracking-tight", dec: "text-sm sm:text-base font-semibold", curr: "text-lg sm:text-xl mr-1" },
    xl: { main: "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight", dec: "text-lg sm:text-xl font-semibold", curr: "text-2xl sm:text-3xl mr-1.5" },
  }[size];

  return (
    <span
      className={`inline-flex items-baseline font-display text-primary ${
        tabular ? "tabular-nums" : ""
      } ${className}`}
    >
      {currency && (
        <span className={`text-secondary-muted font-normal ${sizeClasses.curr}`}>
          {currency}
        </span>
      )}
      <span className={sizeClasses.main}>{integerPart}</span>
      {decimalPart && (
        <span className={`text-secondary-muted ${sizeClasses.dec}`}>
          {decimalPart}
        </span>
      )}
    </span>
  );
};
