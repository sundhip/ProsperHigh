"use client";

import React, { useState, useEffect } from "react";
import { getStoredUser, clearStoredUser, UserSession } from "@/lib/auth";
import { useTheme, Theme } from "@/components/ThemeProvider";
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Globe,
  Lock,
  LogOut,
  CheckCircle2,
  Sliders,
  DollarSign,
  Shield
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<UserSession | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    const storedCurr = localStorage.getItem("prosper_currency") || "INR";
    setCurrency(storedCurr);
  }, []);

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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-[#C9A96E]" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
            Application Settings & Preferences
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure interface theme, financial display preferences, and account controls.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Preference updated and saved!</span>
        </div>
      )}

      {/* 1. Theme Selection */}
      <div className="prosper-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
            Interface Theme & Appearance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose between a light financial dashboard, an investment terminal dark theme, or synchronize with your operating system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Light Mode */}
          <button
            onClick={() => setTheme("light")}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all ${
              theme === "light"
                ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/20"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-5 h-5 text-amber-500" />
              {theme === "light" && <span className="text-[10px] font-bold text-amber-600">Active</span>}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Refined financial dashboard with subtle borders.</div>
            </div>
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all ${
              theme === "dark"
                ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20 dark:bg-sky-950/20"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-5 h-5 text-sky-400" />
              {theme === "dark" && <span className="text-[10px] font-bold text-sky-400">Active</span>}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Investment terminal with deep neutral surfaces.</div>
            </div>
          </button>

          {/* System Default */}
          <button
            onClick={() => setTheme("system")}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all ${
              theme === "system"
                ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <Laptop className="w-5 h-5 text-indigo-500" />
              {theme === "system" && <span className="text-[10px] font-bold text-indigo-400">Active</span>}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">System Preference</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Matches your OS color scheme automatically.</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Financial Units & Locales */}
      <div className="prosper-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
            Display Units & Currency
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure default currency formatting and tabular numeral alignments across charts and tables.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary Currency Format
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="INR">INR (₹ - Indian Rupee / Lakhs & Crores)</option>
              <option value="USD">USD ($ - US Dollar)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Numeral Alignment Style
            </label>
            <input
              type="text"
              readOnly
              value="Tabular Numerals Enabled (tnum)"
              className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 3. Session & Security */}
      <div className="prosper-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
            Account & Session Security
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review your active authentication session and security boundaries.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {user ? user.email : "Unauthenticated Guest"}
            </div>
            <div className="text-[11px] text-slate-400">
              Role: Investor • JWT Bearer Authentication
            </div>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
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
