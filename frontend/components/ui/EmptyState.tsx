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
      <div className="w-14 h-14 rounded-2xl bg-surface-elevated text-secondary flex items-center justify-center border border-border-subtle">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-primary font-display">
          {title}
        </h3>
        <p className="text-xs text-secondary leading-relaxed">
          {description}
        </p>
      </div>
      {(actionLabel && (actionHref || onAction)) && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-black dark:text-black font-extrabold text-xs rounded-full shadow-sm transition-all"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-black dark:text-black font-extrabold text-xs rounded-full shadow-sm transition-all"
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
