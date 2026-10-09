"use client";

import React from "react";

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="prosper-card p-6 animate-pulse space-y-4">
          <div className="h-4 bg-surface-elevated rounded-full w-1/3" />
          <div className="h-10 bg-surface-elevated rounded-2xl w-1/2" />
          <div className="h-4 bg-surface-elevated rounded-full w-2/3" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="prosper-card p-6 animate-pulse space-y-4">
      <div className="h-8 bg-surface-elevated rounded-full w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-surface-elevated rounded-2xl w-full" />
      ))}
    </div>
  );
};
