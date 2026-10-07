"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveOnboardingProfile } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { Shield, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, AlertTriangle, Sparkles, Building, Upload, Trash2, Download } from "lucide-react";

export default function OnboardingWizardPageV3() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // 10-Step Profile States
  const [country, setCountry] = useState("India 🇮🇳");
  const [currency, setCurrency] = useState("INR (₹)");
  const [marketPref, setMarketPref] = useState("NSE (National Stock Exchange)");
  const [expLevel, setExpLevel] = useState("Learning Investor");

  // Financial Context
  const [plannedInvestment, setPlannedInvestment] = useState("₹25,000 – ₹1 Lakh");
  const [currentInvested, setCurrentInvested] = useState("₹25,000");
  const [monthlyCapacity, setMonthlyCapacity] = useState("₹5,000 – ₹15,000");
  const [emergencySavings, setEmergencySavings] = useState("Yes");
  const [obligations, setObligations] = useState<string[]>(["Family Responsibilities"]);

  // Goals & Horizon
  const [goals, setGoals] = useState<string[]>(["📈 Wealth Growth", "🛡 Capital Preservation"]);
  const [primaryGoalTop, setPrimaryGoalTop] = useState("📈 Wealth Growth");
  const [horizon, setHorizon] = useState("3–5 Years");

  // Risk Questionnaire
  const [lossReaction, setLossReaction] = useState("Wait and monitor");
  const [gainVsLoss, setGainVsLoss] = useState("Losing ₹1 Lakh concerns me more");
  const [volatilityComfort, setVolatilityComfort] = useState(50);

  // Portfolio Choice (Starts 100% EMPTY by default!)
  const [portfolioChoice, setPortfolioChoice] = useState("manual");
  const [holdings, setHoldings] = useState<any[]>([]);

  const [newStock, setNewStock] = useState("");
  const [newQty, setNewQty] = useState(10);
  const [newPrice, setNewPrice] = useState(1000);

  const toggleSelection = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addHolding = () => {
    if (!newStock.trim()) return;
    setHoldings([
      ...holdings,
      { symbol: newStock.toUpperCase().trim(), quantity: newQty, price: newPrice }
    ]);
    setNewStock("");
    setNewQty(10);
    setNewPrice(1000);
  };

  const removeHolding = (idx: number) => {
    setHoldings(holdings.filter((_, i) => i !== idx));
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const parsed: any[] = [];
      const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());

      const symbolIdx = headers.findIndex((h) => h.includes("symbol") || h.includes("ticker") || h.includes("stock") || h.includes("name"));
      const qtyIdx = headers.findIndex((h) => h.includes("qty") || h.includes("quantity") || h.includes("shares") || h.includes("units"));
      const priceIdx = headers.findIndex((h) => h.includes("price") || h.includes("cost") || h.includes("avg") || h.includes("rate"));

      const sIdx = symbolIdx !== -1 ? symbolIdx : 0;
      const qIdx = qtyIdx !== -1 ? qtyIdx : 1;
      const pIdx = priceIdx !== -1 ? priceIdx : 2;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/["']/g, ""));
        if (cols.length > sIdx && cols[sIdx]) {
          const sym = cols[sIdx].toUpperCase();
          const qty = Number(cols[qIdx]) || 1;
          const price = Number(cols[pIdx]) || 100;
          parsed.push({ symbol: sym, quantity: qty, price: price });
        }
      }

      if (parsed.length > 0) {
        setHoldings((prev) => [...prev, ...parsed]);
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csvContent = "Symbol,Quantity,Price\nTATAMOTORS,50,850\nINFY,30,1750\nRELIANCE,15,2950\nHDFCBANK,40,1600";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_prosperhigh_portfolio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinish = async () => {
    setSaving(true);
    const user = getStoredUser();
    if (!user) {
      alert("Please sign in or create an account before saving onboarding settings.");
      router.push("/login");
      setSaving(false);
      return;
    }
    try {
      await saveOnboardingProfile({
        user_id: user.id,
        profile: {
          country,
          currency,
          market_preference: marketPref,
          experience_level: expLevel,
          primary_goals: goals,
          primary_goal_top: primaryGoalTop,
          investment_horizon: horizon,
          loss_reaction: lossReaction,
          volatility_comfort: volatilityComfort
        },
        financial: {
          planned_investment: plannedInvestment,
          current_invested: currentInvested,
          monthly_capacity: monthlyCapacity,
          emergency_savings: emergencySavings,
          financial_obligations: obligations
        },
        holdings: portfolioChoice === "manual" ? holdings : []
      });
      window.location.href = "/?tour=true";
    } catch (e: any) {
      alert(e.message || "Failed to save profile on server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      {/* Progress Bar & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-extrabold text-charcoal font-manrope">
              Investor Profile & Financial Context
            </h1>
          </div>
          <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
            Step {step} of 10
          </span>
        </div>

        {/* 10 Step Progress Tracker */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 border-r border-white transition-all ${
                i + 1 <= step ? "bg-primary" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: COUNTRY & CURRENCY */}
      {step === 1 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 1: Location & Base Currency</h2>
          <p className="text-xs text-slate-500">Select your primary region to customize stock search and tax calculation defaults.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["India 🇮🇳", "United States 🇺🇸", "United Kingdom 🇬🇧", "Global 🌍"].map((c) => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                className={`p-4 rounded-xl border text-left font-bold text-xs transition-all ${
                  country === c ? "border-primary bg-primary/5 text-primary shadow-xs" : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl flex items-center space-x-2">
              <span>Next Step →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: EXPERIENCE LEVEL */}
      {step === 2 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 2: Investment Experience Level</h2>
          <p className="text-xs text-slate-500">How would you describe your familiarity with equity markets and financial analysis?</p>

          <div className="space-y-3">
            {[
              { level: "Beginner / New Investor", desc: "Just starting out. Prefer plain-language explanations with minimal jargon." },
              { level: "Learning Investor", desc: "Understand basic concepts (PE, Market Cap). Want guided multi-agent reasoning." },
              { level: "Active Investor", desc: "Regularly invest in stocks/mutual funds. Comfortable with technical & fundamental metrics." },
              { level: "Advanced / Sophisticated", desc: "Experienced trader or financial professional. Want deep thesis invalidation & conflict analysis." }
            ].map((item) => (
              <button
                key={item.level}
                onClick={() => setExpLevel(item.level)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  expLevel === item.level ? "border-primary bg-primary/5 shadow-xs" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="font-bold text-xs text-charcoal">{item.level}</div>
                <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Back</button>
            <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl">Next Step →</button>
          </div>
        </div>
      )}

      {/* STEP 3: FINANCIAL CONTEXT (CAPACITY & SAVINGS) */}
      {step === 3 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 3: Investment Capacity & Surplus</h2>
          <p className="text-xs text-slate-500">Provide your investment scope so ProsperHigh can calculate realistic position sizing rules.</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Planned Investment Capital</label>
              <select value={plannedInvestment} onChange={(e) => setPlannedInvestment(e.target.value)} className="w-full mt-1 bg-slate-50 border rounded-xl p-3 text-xs font-bold">
                <option>Under ₹25,000</option>
                <option>₹25,000 – ₹1 Lakh</option>
                <option>₹1 Lakh – ₹5 Lakhs</option>
                <option>₹5 Lakhs – ₹25 Lakhs</option>
                <option>Above ₹25 Lakhs</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Monthly Investment Surplus (SIP Capacity)</label>
              <select value={monthlyCapacity} onChange={(e) => setMonthlyCapacity(e.target.value)} className="w-full mt-1 bg-slate-50 border rounded-xl p-3 text-xs font-bold">
                <option>Under ₹5,000 / month</option>
                <option>₹5,000 – ₹15,000 / month</option>
                <option>₹15,000 – ₹50,000 / month</option>
                <option>Above ₹50,000 / month</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Back</button>
            <button onClick={() => setStep(4)} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl">Next Step →</button>
          </div>
        </div>
      )}

      {/* STEP 4: EMERGENCY FUND & OBLIGATIONS */}
      {step === 4 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 4: Safety Net & Financial Obligations</h2>
          <p className="text-xs text-slate-500">Risk agent uses this to enforce liquidity constraints.</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Do you have a separate Emergency Fund (3-6 months expenses)?</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["Yes", "No / In Progress"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setEmergencySavings(val)}
                    className={`p-3 rounded-xl border text-xs font-bold ${emergencySavings === val ? "border-primary bg-primary/5 text-primary" : "border-slate-200"}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Active Financial Obligations</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["Home Loan / EMI", "Education Expenses", "Family Responsibilities", "Business Capital"].map((ob) => (
                  <button
                    key={ob}
                    onClick={() => toggleSelection(obligations, setObligations, ob)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold ${obligations.includes(ob) ? "border-primary bg-primary/5 text-primary" : "border-slate-200"}`}
                  >
                    {obligations.includes(ob) ? "✓ " : ""}{ob}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(3)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Back</button>
            <button onClick={() => setStep(5)} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl">Next Step →</button>
          </div>
        </div>
      )}

      {/* STEP 5: INVESTMENT GOALS */}
      {step === 5 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 5: Primary Investment Goals</h2>
          <p className="text-xs text-slate-500">Select all goals that apply to your portfolio strategy.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "📈 Wealth Growth",
              "🛡 Capital Preservation",
              "💵 Regular Passive Income (Dividends)",
              "🏖 Retirement Planning",
              "🏡 Real Estate Goal",
              "🎓 Child Education"
            ].map((g) => (
              <button
                key={g}
                onClick={() => toggleSelection(goals, setGoals, g)}
                className={`p-4 rounded-xl border text-left text-xs font-bold transition-all ${
                  goals.includes(g) ? "border-primary bg-primary/5 text-primary shadow-xs" : "border-slate-200 text-slate-700"
                }`}
              >
                {goals.includes(g) ? "✓ " : ""}{g}
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(4)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Back</button>
            <button onClick={() => setStep(6)} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl">Next Step →</button>
          </div>
        </div>
      )}

      {/* STEP 6: TOP GOAL & INVESTMENT HORIZON */}
      {step === 6 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 6: Priority Goal & Time Horizon</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Single Most Important Goal (#1 Priority)</label>
              <select value={primaryGoalTop} onChange={(e) => setPrimaryGoalTop(e.target.value)} className="w-full mt-1 bg-slate-50 border rounded-xl p-3 text-xs font-bold">
                {goals.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Expected Investment Time Horizon</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["Short Term (< 1 Year)", "Medium Term (1–3 Years)", "Long Term (3–5 Years)", "Multi-Decade (> 5 Years)"].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`p-3 rounded-xl border text-xs font-bold ${horizon === h ? "border-primary bg-primary/5 text-primary" : "border-slate-200"}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(5)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Back</button>
            <button onClick={() => setStep(7)} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl">Next Step →</button>
          </div>
        </div>
      )}

      {/* STEP 7: LOSS REACTION & DRAWDOWN PSYCHOLOGY */}
      {step === 7 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 7: Drawdown Psychology Scenario</h2>
          <p className="text-xs text-slate-500">If your portfolio drops 20% during a market correction, what is your immediate reaction?</p>

          <div className="space-y-3">
            {[
              { option: "Sell immediately to prevent further loss", score: 20 },
              { option: "Wait and monitor without taking action", score: 50 },
              { option: "Buy more at discounted prices (Averaging down)", score: 85 }
            ].map((item) => (
              <button
                key={item.option}
                onClick={() => setLossReaction(item.option)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  lossReaction === item.option ? "border-primary bg-primary/5 shadow-xs" : "border-slate-200"
                }`}
              >
                <div className="font-bold text-xs text-charcoal">{item.option}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(6)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Back</button>
            <button onClick={() => setStep(8)} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl">Next Step →</button>
          </div>
        </div>
      )}

      {/* STEP 8: VOLATILITY COMFORT SLIDER */}
      {step === 8 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 8: Volatility Comfort Score ({volatilityComfort}/100)</h2>
          <p className="text-xs text-slate-500">Adjust the slider to reflect your tolerance for stock price swings.</p>

          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="100"
              value={volatilityComfort}
              onChange={(e) => setVolatilityComfort(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>0 (Conservative Preservation)</span>
              <span>50 (Balanced Growth)</span>
              <span>100 (Aggressive Equity)</span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(7)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Back</button>
            <button onClick={() => setStep(9)} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl">Next Step →</button>
          </div>
        </div>
      )}

      {/* STEP 9: PORTFOLIO CREATION METHOD */}
      {step === 9 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 9: Portfolio Setup Preference</h2>
          <p className="text-xs text-slate-500">How would you like to set up your investment portfolio?</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setPortfolioChoice("manual")}
              className={`p-6 rounded-2xl border text-left space-y-2 transition-all ${
                portfolioChoice === "manual" ? "border-primary bg-primary/5 shadow-md" : "border-slate-200"
              }`}
            >
              <div className="font-extrabold text-sm text-charcoal">Add / Import Stock Holdings</div>
              <p className="text-xs text-slate-500">Add individual stock holdings manually or upload a CSV portfolio file.</p>
            </button>

            <button
              onClick={() => setPortfolioChoice("empty")}
              className={`p-6 rounded-2xl border text-left space-y-2 transition-all ${
                portfolioChoice === "empty" ? "border-primary bg-primary/5 shadow-md" : "border-slate-200"
              }`}
            >
              <div className="font-extrabold text-sm text-charcoal">Start Fresh (0 Holdings)</div>
              <p className="text-xs text-slate-500">Start with an empty portfolio and explore stock suitability analysis first.</p>
            </button>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(8)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Back</button>
            <button onClick={() => setStep(10)} className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl">Next Step →</button>
          </div>
        </div>
      )}

      {/* STEP 10: ADD HOLDINGS & LAUNCH (WITH CSV IMPORT & ZERO DEFAULT STOCKS) */}
      {step === 10 && (
        <div className="prosper-card p-8 space-y-6 animate-in fade-in duration-200">
          <h2 className="text-2xl font-extrabold text-charcoal font-manrope">Step 10: Add Initial Holdings & Finish</h2>

          {portfolioChoice === "manual" ? (
            <div className="space-y-6">
              {/* CSV Upload & Manual Input Toolbar */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-charcoal uppercase tracking-wider">Import Portfolio CSV</span>
                  <button
                    onClick={downloadSampleCSV}
                    type="button"
                    className="text-[11px] text-primary hover:underline font-bold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample CSV Template</span>
                  </button>
                </div>

                <label className="flex items-center justify-center space-x-2 border-2 border-dashed border-primary/40 hover:border-primary bg-white p-4 rounded-xl cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary">Click to Upload Portfolio CSV (Symbol, Quantity, Price)</span>
                  <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                </label>
              </div>

              {/* Manual Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Stock Symbol (e.g. TATAMOTORS)"
                  className="bg-slate-50 border rounded-lg p-2.5 text-xs font-bold sm:col-span-2"
                />
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  placeholder="Quantity"
                  className="bg-slate-50 border rounded-lg p-2.5 text-xs font-bold"
                />
                <button onClick={addHolding} type="button" className="bg-primary text-white text-xs font-bold rounded-lg py-2.5 hover:bg-primary-dark transition-all">
                  + Add Stock
                </button>
              </div>

              {/* Added Stock Holdings Table */}
              {holdings.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 font-bold">
                  No stocks added yet. Enter a stock symbol above or upload a CSV file to import your portfolio.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase">Current Added Holdings ({holdings.length})</div>
                  {holdings.map((h, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-bold text-charcoal">
                      <span className="font-extrabold text-primary">{h.symbol}</span>
                      <span>Qty: {h.quantity}</span>
                      <span>Avg Price: ₹{h.price}</span>
                      <button
                        onClick={() => removeHolding(idx)}
                        type="button"
                        className="text-slate-400 hover:text-negative p-1 transition-all"
                        title="Remove Stock"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl text-xs text-slate-600 text-center font-bold">
              Starting fresh with an empty portfolio (0 holdings). You can add holdings or upload a CSV anytime from the Portfolio tab!
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button onClick={() => setStep(9)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Back</button>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="px-8 py-3 bg-positive hover:bg-positive-light text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <span>{saving ? "Saving..." : "FINISH & LAUNCH DASHBOARD →"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
