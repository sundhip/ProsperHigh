"use client";

import React from "react";
import { User, ShieldAlert, Zap } from "lucide-react";

interface Props {
  selectedUser: string;
  onSelectUser: (userId: string) => void;
}

export const UserProfileSelector: React.FC<Props> = ({ selectedUser, onSelectUser }) => {
  return (
    <div className="flex items-center space-x-2 bg-surface-elevated/60 p-1.5 rounded-full border border-subtle">
      <span className="text-xs font-semibold text-secondary-muted uppercase px-2 hidden sm:inline">Investor Profile:</span>
      <button
        onClick={() => onSelectUser("U001")}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          selectedUser === "U001"
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-secondary hover:text-primary hover:bg-surface-elevated"
        }`}
      >
        <ShieldAlert className="w-3.5 h-3.5 text-accent-2" />
        <span>User A (Conservative)</span>
        <span className="bg-accent-2/20 text-primary px-2 py-0.5 rounded-full text-[10px] hidden md:inline">35% Energy</span>
      </button>
      <button
        onClick={() => onSelectUser("U002")}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          selectedUser === "U002"
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-secondary hover:text-primary hover:bg-surface-elevated"
        }`}
      >
        <Zap className="w-3.5 h-3.5 text-accent" />
        <span>User B (Aggressive)</span>
        <span className="bg-accent/20 text-accent px-2 py-0.5 rounded-full text-[10px] hidden md:inline">3% Energy</span>
      </button>
    </div>
  );
};
