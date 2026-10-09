"use client";

import React, { useState, useEffect } from "react";
import { askResearch, getResearchHistory, getResearchDocuments, getDriveStatus } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { DocumentReaderModal } from "@/components/DocumentReaderModal";
import { DocumentUploadModal } from "@/components/DocumentUploadModal";
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
  ExternalLink,
  Upload,
  HardDrive,
  Filter,
} from "lucide-react";

export default function ResearchPageV2() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [query, setQuery] = useState("regulatory risk and capital expenditure commitments");
  const [documentType, setDocumentType] = useState("");
  const [year, setYear] = useState("");

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [driveStatus, setDriveStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"search" | "history" | "documents">("search");
  const [user, setUser] = useState<any>(null);

  // Modal States
  const [readerDocId, setReaderDocId] = useState<string | null>(null);
  const [readerChunkId, setReaderChunkId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    loadDocuments();
    loadDriveStatus();
    if (u) {
      loadHistory();
    }
  }, []);

  const loadHistory = async () => {
    try {
      const items = await getResearchHistory();
      setHistoryList(items || []);
    } catch (err) {}
  };

  const loadDocuments = async () => {
    try {
      const docs = await getResearchDocuments();
      setDocumentsList(docs || []);
    } catch (err) {}
  };

  const loadDriveStatus = async () => {
    try {
      const st = await getDriveStatus();
      setDriveStatus(st);
    } catch (err) {}
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const options: any = {};
      if (documentType) options.documentType = documentType;
      if (year) options.year = year;

      const res = await askResearch(symbol, query, options);
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

  const openDocumentReader = (docId: string, chunkId?: string) => {
    setReaderDocId(docId);
    setReaderChunkId(chunkId || null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="prosper-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-wider">
            Citation-Backed Document Terminal & Reader
          </span>
          <h1 className="text-2xl font-extrabold text-primary font-display mt-1">
            Corporate Filings & Document RAG
          </h1>
          <p className="text-xs text-secondary-muted mt-1">
            Query Annual Reports, exchange disclosures, and regulatory filings with exact passage citations.
          </p>
        </div>

        {/* View Switcher & Upload */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === "search" ? "bg-accent text-accent-foreground" : "bg-surface-elevated text-secondary hover:text-primary border border-subtle"
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
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === "history" ? "bg-accent text-accent-foreground" : "bg-surface-elevated text-secondary hover:text-primary border border-subtle"
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
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === "documents" ? "bg-accent text-accent-foreground" : "bg-surface-elevated text-secondary hover:text-primary border border-subtle"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Indexed Filings ({documentsList.length})</span>
          </button>

          {user && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 shadow-xs flex items-center space-x-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab: SEARCH */}
      {activeTab === "search" && (
        <>
          {/* Query Form with Metadata Filters */}
          <form onSubmit={handleAsk} className="prosper-card p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">Target Stock Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-surface-elevated border border-subtle rounded-xl p-2.5 text-xs font-bold text-primary mt-1 focus:ring-2 focus:ring-accent outline-none"
                >
                  <option value="RELIANCE">RELIANCE (Reliance Industries)</option>
                  <option value="TCS">TCS (Tata Consultancy)</option>
                  <option value="INFY">INFY (Infosys)</option>
                  <option value="HDFCBANK">HDFCBANK (HDFC Bank)</option>
                  <option value="TATAMOTORS">TATAMOTORS (Tata Motors)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">Natural Language Question</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about capex, regulatory oversight, risks, margins, ARPU..."
                    className="flex-1 bg-surface-elevated border border-subtle rounded-xl px-4 py-2.5 text-xs text-primary placeholder-secondary-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-accent hover:opacity-90 text-accent-foreground font-extrabold text-xs rounded-full shadow-md transition-all whitespace-nowrap flex items-center justify-center space-x-1.5"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Search Filings →</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Metadata Filters */}
            <div className="pt-2 border-t border-subtle flex flex-wrap items-center gap-3 text-xs">
              <span className="text-[11px] text-secondary font-bold flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-accent" />
                <span>Filters:</span>
              </span>

              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="bg-surface-elevated border border-subtle text-primary rounded-lg px-2.5 py-1 text-xs outline-none"
              >
                <option value="">All Document Types</option>
                <option value="Annual Report">Annual Reports</option>
                <option value="Investor Presentation">Investor Presentations</option>
                <option value="Financial Results">Financial Results</option>
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-surface-elevated border border-subtle text-primary rounded-lg px-2.5 py-1 text-xs outline-none"
              >
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </form>

          {/* Research Output & Citations */}
          {result && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {result.insufficient_evidence ? (
                <div className="prosper-card p-6 border-l-4 border-l-accent-2 bg-accent-2/10 space-y-2">
                  <div className="flex items-center space-x-2 text-primary font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-accent-2" />
                    <span>Insufficient Evidence in Official Filings</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed font-medium">
                    {result.answer}
                  </p>
                  {result.suggested_query && (
                    <div className="text-[11px] text-primary font-semibold bg-surface-elevated p-2.5 rounded-xl border border-subtle">
                      💡 {result.suggested_query}
                    </div>
                  )}
                  <span className="text-[10px] text-secondary-muted block">
                    ProsperHigh will not fabricate claims without verifiable citation anchors.
                  </span>
                </div>
              ) : (
                <div className="prosper-card p-6 border-l-4 border-l-accent bg-surface-elevated/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-primary font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                      <span>Synthesized Research Answer</span>
                    </div>
                    <span className="text-[11px] font-extrabold bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20">
                      Confidence: {Math.round((result.retrieval_confidence || 0.85) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed font-medium">
                    {result.answer}
                  </p>
                </div>
              )}

              {/* Citations Grid */}
              {result.citations && result.citations.length > 0 && (
                <div className="prosper-card p-6 space-y-4">
                  <h3 className="text-sm font-extrabold text-primary font-display flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <span>Verifiable Source Document Citations ({result.citations.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.citations.map((cit: any, idx: number) => (
                      <div key={idx} className="bg-surface-elevated/60 p-4 rounded-2xl border border-subtle space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">{cit.document}</span>
                          <span className="text-[10px] bg-surface border border-subtle text-secondary px-2 py-0.5 rounded-full font-bold">{cit.year}</span>
                        </div>

                        <p className="text-xs text-secondary italic bg-surface p-3 rounded-xl border border-subtle">
                          "{cit.snippet}"
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-secondary-muted pt-1 border-t border-subtle">
                          <span>Section: {cit.section}</span>
                          <span>Page {cit.page}</span>
                        </div>

                        {/* Interactive Document Reader Jump Button */}
                        <div className="pt-1 flex items-center justify-between">
                          {cit.source_url && (
                            <a
                              href={cit.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-secondary-muted hover:text-accent flex items-center space-x-1"
                            >
                              <span>Official URL</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          <button
                            onClick={() => openDocumentReader(cit.document_id, cit.chunk_id)}
                            className="text-xs font-bold text-accent hover:underline flex items-center space-x-1 ml-auto"
                          >
                            <span>Open in Document Reader</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
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
            <h2 className="text-base font-extrabold text-primary font-display mb-3">Your Past Research Inquiries</h2>
            {historyList.length === 0 ? (
              <p className="text-xs text-secondary-muted">No past research queries recorded. Search filings above to save inquiries.</p>
            ) : (
              <div className="space-y-3">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => applyPastQuery(item)}
                    className="p-4 bg-surface-elevated/40 hover:bg-surface-elevated rounded-2xl border border-subtle cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-accent">{item.symbol || "MARKET"}</span>
                        <span className="text-xs font-bold text-primary">{item.query}</span>
                      </div>
                      <span className="text-[10px] text-secondary-muted">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-secondary line-clamp-2">{item.answer}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-secondary-muted pt-1">
                      <span>{item.citations?.length || 0} citations</span>
                      <span>•</span>
                      <span>Confidence: {Math.round((item.confidence || 0) * 100)}%</span>
                      <span>•</span>
                      <span className="text-accent font-bold flex items-center space-x-0.5">
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
          {/* Drive Integration Callout Banner */}
          {driveStatus && (
            <div className="p-4 bg-surface-elevated/40 rounded-2xl border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <HardDrive className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <span className="font-extrabold text-primary block">
                    Google Drive Integration: {driveStatus.status}
                  </span>
                  <span className="text-[11px] text-secondary-muted">{driveStatus.message}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto ${
                  driveStatus.enabled ? "bg-accent/10 text-accent border border-accent/20" : "bg-surface-elevated text-secondary border border-subtle"
                }`}
              >
                {driveStatus.enabled ? "Drive Connected" : "Optional Setup"}
              </span>
            </div>
          )}

          <div className="prosper-card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-primary font-display">
              Indexed Statutory Disclosures & Filings ({documentsList.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentsList.map((doc) => (
                <div key={doc.id} className="p-4 bg-surface-elevated/40 rounded-2xl border border-subtle space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent">{doc.company}</span>
                    <span className="text-[10px] bg-surface border border-subtle text-secondary font-bold px-2 py-0.5 rounded-full">{doc.year}</span>
                  </div>
                  <div className="text-xs font-extrabold text-primary">{doc.title}</div>
                  <div className="text-[11px] text-secondary-muted">
                    Type: {doc.document_type} {doc.reporting_period ? `• ${doc.reporting_period}` : ""}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-secondary-muted pt-1 border-t border-subtle">
                    <span className="text-accent font-bold">{doc.chunk_count} semantic chunks</span>
                    <button
                      onClick={() => openDocumentReader(doc.id)}
                      className="text-xs font-bold text-accent hover:underline flex items-center space-x-1"
                    >
                      <span>Read Document & Passages</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Reader Modal */}
      {readerDocId && (
        <DocumentReaderModal
          documentId={readerDocId}
          initialChunkId={readerChunkId || undefined}
          onClose={() => {
            setReaderDocId(null);
            setReaderChunkId(null);
          }}
        />
      )}

      {/* Document Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onSuccess={() => loadDocuments()}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}
