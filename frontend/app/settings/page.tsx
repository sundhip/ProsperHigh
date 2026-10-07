"use client";

import React, { useState, useEffect } from "react";
import { getProfile, saveOnboardingProfile } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { Settings, Shield, User, Sliders, Target, Lock, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPageV2() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    getProfile(user?.id).then((res) => {
      setProfile(res);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const user = getStoredUser();
    if (!user) return;
    await saveOnboardingProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "profile", label: "Investment Profile", icon: Shield },
    { id: "personal", label: "Personal Info", icon: User },
    { id: "portfolio", label: "Portfolio Controls", icon: Sliders },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account & Preferences</span>
          <h1 className="text-2xl font-extrabold text-charcoal font-manrope mt-1">
            Profile & Investment Preferences
          </h1>
        </div>

        {saved && (
          <span className="text-xs text-positive font-extrabold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences Saved!</span>
          </span>
        )}
      </div>

      {/* Tabs Row */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive ? "bg-primary text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Investment Profile */}
      {activeTab === "profile" && (
        <div className="prosper-card p-6 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between border border-slate-800">
            <div>
              <span className="text-xs font-extrabold text-accent uppercase tracking-wider">Assigned Investor Profile</span>
              <h2 className="text-2xl font-extrabold font-manrope mt-1">
                {profile?.risk_category || "Balanced Growth"} Investor
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Calculated from your horizon, risk scenario responses, and volatility tolerance.
              </p>
            </div>

            <div className="text-right bg-white/10 p-4 rounded-xl border border-white/20">
              <div className="text-[10px] font-bold text-slate-300 uppercase">Risk Score</div>
              <div className="text-3xl font-black text-accent font-manrope">{profile?.risk_score || 62} / 100</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Investment Experience Level</label>
              <select
                value={profile?.experience_level || "Active Investor"}
                onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-charcoal mt-1"
              >
                <option value="Beginner">Beginner</option>
                <option value="Some Experience">Some Experience</option>
                <option value="Active Investor">Active Investor</option>
                <option value="Highly Experienced">Advanced / Professional</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Investment Horizon</label>
              <select
                value={profile?.investment_horizon || "Medium-Term"}
                onChange={(e) => setProfile({ ...profile, investment_horizon: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-charcoal mt-1"
              >
                <option value="Short-Term">Short-Term (&lt; 1 Year)</option>
                <option value="Medium-Term">Medium-Term (1 – 5 Years)</option>
                <option value="Long-Term">Long-Term (5 – 10 Years)</option>
                <option value="Very Long Term (10+ Years)">Very Long Term (10+ Years)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={handleSave} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-1.5">
              <Save className="w-4 h-4" />
              <span>Save Investment Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Portfolio Controls */}
      {activeTab === "portfolio" && (
        <div className="prosper-card p-6 space-y-6">
          <h3 className="text-base font-bold text-charcoal font-manrope">Portfolio Risk & Concentration Thresholds</h3>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600 uppercase">Maximum Single-Stock Concentration Limit</label>
              <span className="text-xs font-black text-primary">{profile?.max_stock_exposure_pct || 20}% Portfolio</span>
            </div>
            <input
              type="range"
              min={10}
              max={40}
              value={profile?.max_stock_exposure_pct || 20}
              onChange={(e) => setProfile({ ...profile, max_stock_exposure_pct: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <p className="text-[11px] text-slate-500 mt-1">If any single stock exceeds this limit, ProsperHigh raises a High Concentration alert.</p>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={handleSave} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-1.5">
              <Save className="w-4 h-4" />
              <span>Save Portfolio Controls</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Personal & Security */}
      {(activeTab === "personal" || activeTab === "security") && (
        <div className="prosper-card p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase">Full Name</label>
            <input type="text" value={getStoredUser()?.name || "Not signed in"} readOnly className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold text-charcoal mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase">Email Address</label>
            <input type="email" value={getStoredUser()?.email || "—"} readOnly className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold text-charcoal mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}
