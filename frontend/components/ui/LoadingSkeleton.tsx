"use client";

import React from "react";

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="prosper-card p-5 animate-pulse space-y-4">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="prosper-card p-4 animate-pulse space-y-3">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-900/60 rounded w-full" />
      ))}
    </div>
  );
};
