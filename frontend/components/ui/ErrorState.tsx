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
    <div className="prosper-card p-6 border-negative/20 bg-negative/5 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-negative/10 text-negative flex items-center justify-center">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="max-w-md">
        <h4 className="text-sm font-bold text-primary font-display">
          {title}
        </h4>
        <p className="text-xs text-secondary mt-1">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-negative text-white rounded-full text-xs font-bold transition-all hover:opacity-90 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
