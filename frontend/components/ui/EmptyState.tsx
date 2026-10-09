"use client";

import React from "react";
import { FolderOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) => {
  return (
    <div className="prosper-card p-10 text-center flex flex-col items-center justify-center space-y-4">
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-primary dark:text-white font-display">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      {(actionLabel && (actionHref || onAction)) && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary dark:bg-sky-500 text-white text-xs font-bold rounded-lg shadow hover:opacity-90 transition-opacity"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary dark:bg-sky-500 text-white text-xs font-bold rounded-lg shadow hover:opacity-90 transition-opacity"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
