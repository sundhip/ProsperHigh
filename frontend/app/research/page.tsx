"use client";

import React, { useState, useEffect } from "react";
import { askResearch, getResearchHistory, getResearchDocuments } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  Search,
  BookOpen,
  FileText,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  History,
  Layers,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export default function ResearchPageV2() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [query, setQuery] = useState("regulatory risk and capital expenditure commitments");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "history" | "documents">("search");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    loadDocuments();
    if (u) {
      loadHistory();
    }
  }, []);

  const loadHistory = async () => {
    try {
      const items = await getResearchHistory();
      setHistoryList(items);
    } catch (err) {}
  };

  const loadDocuments = async () => {
    try {
      const docs = await getResearchDocuments();
      setDocumentsList(docs);
    } catch (err) {}
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await askResearch(symbol, query);
      setResult(res);
      if (user) {
        loadHistory();
      }
    } catch (e: any) {
      alert(e.message || "Research query failed.");
    } finally {
      setLoading(false);
    }
  };

  const applyPastQuery = (item: any) => {
    if (item.symbol) setSymbol(item.symbol);
    setQuery(item.query);
    setResult({
      symbol: item.symbol,
      query: item.query,
      answer: item.answer,
      citations: item.citations,
      retrieval_confidence: item.confidence,
      insufficient_evidence: item.answer.toLowerCase().includes("insufficient"),
    });
    setActiveTab("search");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citation-Backed Document Terminal</span>
          <h1 className="text-2xl font-extrabold text-charcoal font-manrope mt-1">
            Corporate Filings & Document RAG
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Query Annual Reports, exchange disclosures, and regulatory filings with exact page-level citations.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === "search" ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
          {user && (
            <button
              onClick={() => {
                setActiveTab("history");
                loadHistory();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === "history" ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Query History ({historyList.length})</span>
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab("documents");
              loadDocuments();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === "documents" ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Indexed Filings ({documentsList.length})</span>
          </button>
        </div>
      </div>

      {/* Tab: SEARCH */}
      {activeTab === "search" && (
        <>
          {/* Query Form */}
          <form onSubmit={handleAsk} className="prosper-card p-6 bg-slate-900 text-white space-y-4 border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target Stock Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white mt-1"
                >
                  <option value="RELIANCE">RELIANCE (Reliance Industries)</option>
                  <option value="TCS">TCS (Tata Consultancy)</option>
                  <option value="INFY">INFY (Infosys)</option>
                  <option value="HDFCBANK">HDFCBANK (HDFC Bank)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Natural Language Question</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about capex, regulatory oversight, risks, margins..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-accent hover:bg-accent-light text-charcoal font-extrabold text-xs rounded-xl shadow-md transition-all whitespace-nowrap flex items-center justify-center space-x-1.5"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Search Filings →</span>}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Research Output & Citations */}
          {result && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {result.insufficient_evidence ? (
                <div className="prosper-card p-6 border-l-4 border-l-amber-500 bg-amber-50/50 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Insufficient Evidence in Official Filings</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {result.answer}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    ProsperHigh will not fabricate claims without verifiable citation anchors.
                  </span>
                </div>
              ) : (
                <div className="prosper-card p-6 border-l-4 border-l-primary bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-primary font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                      <span>Synthesized Research Answer</span>
                    </div>
                    <span className="text-[11px] font-extrabold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      Confidence: {Math.round((result.retrieval_confidence || 0.85) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {result.answer}
                  </p>
                </div>
              )}

              {/* Citations Grid */}
              {result.citations && result.citations.length > 0 && (
                <div className="prosper-card p-6">
                  <h3 className="text-sm font-extrabold text-charcoal font-manrope mb-4 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Verifiable Source Document Citations ({result.citations.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.citations.map((cit: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">{cit.document}</span>
                          <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold">{cit.year}</span>
                        </div>
                        <div className="text-xs text-slate-700 font-semibold">{cit.citation_string}</div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                          <span>Section: {cit.section}</span>
                          <span>Page {cit.page}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Tab: HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="prosper-card p-6">
            <h2 className="text-base font-extrabold text-charcoal font-manrope mb-3">Your Past Research Inquiries</h2>
            {historyList.length === 0 ? (
              <p className="text-xs text-slate-500">No past research queries recorded. Search filings above to save inquiries.</p>
            ) : (
              <div className="space-y-3">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => applyPastQuery(item)}
                    className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-primary font-manrope">{item.symbol || "MARKET"}</span>
                        <span className="text-xs font-bold text-charcoal">{item.query}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{item.answer}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-1">
                      <span>{item.citations?.length || 0} citations</span>
                      <span>•</span>
                      <span>Confidence: {Math.round((item.confidence || 0) * 100)}%</span>
                      <span>•</span>
                      <span className="text-primary font-bold flex items-center space-x-0.5">
                        <span>Load Query</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="prosper-card p-6">
            <h2 className="text-base font-extrabold text-charcoal font-manrope mb-3">
              Indexed Statutory Disclosures & Filings ({documentsList.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentsList.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{doc.company}</span>
                    <span className="text-[10px] bg-slate-200 font-bold px-2 py-0.5 rounded">{doc.year}</span>
                  </div>
                  <div className="text-xs font-extrabold text-charcoal">{doc.title}</div>
                  <div className="text-[11px] text-slate-500">Type: {doc.document_type}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                    <span>Document ID: {doc.id}</span>
                    <span className="text-positive font-bold">{doc.chunk_count} semantic chunks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
