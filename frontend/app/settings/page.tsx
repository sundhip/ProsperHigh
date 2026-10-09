"use client";

import React, { useState, useEffect } from "react";
import { getStoredUser, clearStoredUser, UserSession } from "@/lib/auth";
import { useTheme, Theme } from "@/components/ThemeProvider";
import { useExperience, ExperienceMode } from "@/components/ExperienceProvider";
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  LogOut,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { mode, setMode } = useExperience();
  const [user, setUser] = useState<UserSession | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    const storedCurr = localStorage.getItem("prosper_currency") || "INR";
    setCurrency(storedCurr);
  }, []);

  const handleModeChange = (newMode: ExperienceMode) => {
    setMode(newMode);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    localStorage.setItem("prosper_currency", newCurr);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleLogout = () => {
    clearStoredUser();
    window.location.href = "/login";
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-elevated text-accent flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary font-display">
            Application Settings & Preferences
          </h1>
        </div>
        <p className="text-xs text-secondary-muted mt-1">
          Configure interface theme, investment experience mode, and account controls.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-accent/10 border border-accent/25 text-accent rounded-2xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Preference updated and saved!</span>
        </div>
      )}

      {/* 1. Theme Selection */}
      <div className="prosper-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-primary font-display">
            Interface Theme & Appearance
          </h3>
          <p className="text-xs text-secondary-muted mt-0.5">
            Choose between a warm light dashboard, an investment terminal dark theme, or sync with your OS.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Light Mode */}
          <button
            onClick={() => setTheme("light")}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all ${
              theme === "light"
                ? "border-accent bg-accent/5 ring-1 ring-accent"
                : "border-border-subtle bg-surface-elevated hover:border-border-default"
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-5 h-5 text-accent" />
              {theme === "light" && <span className="text-[10px] font-bold text-accent">Active</span>}
            </div>
            <div>
              <div className="text-xs font-bold text-primary font-display">Light Theme</div>
              <div className="text-[11px] text-secondary-muted mt-0.5">Warm beige modern bento dashboard (Ref B).</div>
            </div>
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all ${
              theme === "dark"
                ? "border-accent bg-accent/5 ring-1 ring-accent"
                : "border-border-subtle bg-surface-elevated hover:border-border-default"
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-5 h-5 text-accent" />
              {theme === "dark" && <span className="text-[10px] font-bold text-accent">Active</span>}
            </div>
            <div>
              <div className="text-xs font-bold text-primary font-display">Dark Theme</div>
              <div className="text-[11px] text-secondary-muted mt-0.5">Deep surfaces with neon green accents (Ref A & D).</div>
            </div>
          </button>

          {/* System Default */}
          <button
            onClick={() => setTheme("system")}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all ${
              theme === "system"
                ? "border-accent bg-accent/5 ring-1 ring-accent"
                : "border-border-subtle bg-surface-elevated hover:border-border-default"
            }`}
          >
            <div className="flex items-center justify-between">
              <Laptop className="w-5 h-5 text-accent" />
              {theme === "system" && <span className="text-[10px] font-bold text-accent">Active</span>}
            </div>
            <div>
              <div className="text-xs font-bold text-primary font-display">System Match</div>
              <div className="text-[11px] text-secondary-muted mt-0.5">Synchronizes with your OS color scheme automatically.</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Experience Mode (Beginner vs Advanced) */}
      <div className="prosper-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-primary font-display flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Investment Experience Mode</span>
          </h3>
          <p className="text-xs text-secondary-muted mt-0.5">
            Tailor interface density and progressive disclosure. Both modes use the exact same verified data and calculations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Beginner Mode */}
          <button
            onClick={() => handleModeChange("beginner")}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all ${
              mode === "beginner"
                ? "border-accent bg-accent/5 ring-1 ring-accent"
                : "border-border-subtle bg-surface-elevated hover:border-border-default"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary font-display">Beginner Friendly (Default)</span>
              {mode === "beginner" && <span className="text-[10px] font-bold text-accent">Active</span>}
            </div>
            <div>
              <div className="text-[11px] text-secondary leading-snug">
                Presents high-level summaries first, auto-collapses advanced multi-agent traces, and highlights plain-language tooltips for financial terms.
              </div>
            </div>
          </button>

          {/* Advanced Mode */}
          <button
            onClick={() => handleModeChange("advanced")}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all ${
              mode === "advanced"
                ? "border-accent bg-accent/5 ring-1 ring-accent"
                : "border-border-subtle bg-surface-elevated hover:border-border-default"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary font-display">Advanced Quantitative</span>
              {mode === "advanced" && <span className="text-[10px] font-bold text-accent">Active</span>}
            </div>
            <div>
              <div className="text-[11px] text-secondary leading-snug">
                Shows dense financial metrics upfront, auto-expands multi-agent debates and scenario stress tests, and optimizes for experienced analysts.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Financial Units & Locales */}
      <div className="prosper-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-primary font-display">
            Display Units & Currency
          </h3>
          <p className="text-xs text-secondary-muted mt-0.5">
            Configure default currency formatting and tabular numeral alignments across charts and tables.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Primary Currency Format
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle rounded-xl px-3 py-2 text-xs text-primary focus:ring-2 focus:ring-accent outline-none"
            >
              <option value="INR">INR (₹ - Indian Rupee / Lakhs & Crores)</option>
              <option value="USD">USD ($ - US Dollar)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Numeral Alignment Style
            </label>
            <input
              type="text"
              readOnly
              value="Tabular Numerals Enabled (tnum)"
              className="w-full bg-surface-elevated/60 border border-border-subtle rounded-xl px-3 py-2 text-xs text-secondary-muted cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 4. Session & Security */}
      <div className="prosper-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-primary font-display">
            Account & Session Security
          </h3>
          <p className="text-xs text-secondary-muted mt-0.5">
            Review your active authentication session and security boundaries.
          </p>
        </div>

        <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-primary font-display">
              {user ? user.email : "Unauthenticated Guest"}
            </div>
            <div className="text-[11px] text-secondary-muted">
              Role: Investor • JWT Bearer Authentication
            </div>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-negative/10 border border-negative/25 text-negative hover:bg-negative/20 text-xs font-bold rounded-full transition-colors flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
