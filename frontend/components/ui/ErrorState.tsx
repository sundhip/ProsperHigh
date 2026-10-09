"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load data",
  message,
  onRetry,
}) => {
  return (
    <div className="prosper-card p-6 border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center flex flex-col items-center justify-center space-y-3">
      <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="max-w-md">
        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
          {title}
        </h4>
        <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
