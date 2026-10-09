"use client";

import React, { useState, useEffect } from "react";
import { getDocumentById } from "@/lib/api";
import {
  FileText,
  ExternalLink,
  X,
  Bookmark,
  Calendar,
  Layers,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface Props {
  documentId: string;
  initialChunkId?: string;
  onClose: () => void;
}

export const DocumentReaderModal: React.FC<Props> = ({
  documentId,
  initialChunkId,
  onClose,
}) => {
  const [docData, setDocData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(initialChunkId || null);
  const [readerTab, setReaderTab] = useState<"chunks" | "versions">("chunks");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getDocumentById(documentId)
      .then((res) => {
        setDocData(res);
        if (!selectedChunkId && res?.chunks?.length > 0) {
          setSelectedChunkId(res.chunks[0].id);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load document content.");
        setLoading(false);
      });
  }, [documentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface rounded-3xl max-w-4xl w-full border border-subtle shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-subtle flex items-start justify-between bg-surface-elevated/40">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-0.5 rounded-full font-mono border border-accent/20">
                {docData?.company || "DISCLOSURE"}
              </span>
              <span className="text-xs text-secondary-muted font-mono">| {docData?.document_type || "Filing"}</span>
              {docData?.year && (
                <span className="text-xs text-secondary font-bold">({docData.year})</span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-primary font-display">
              {docData?.title || "Document Reader"}
            </h2>

            {/* Official Source Link */}
            {docData?.source_url ? (
              <a
                href={docData.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-accent font-bold hover:underline pt-0.5"
              >
                <span>Official Statutory Source ({docData.source})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-[11px] text-secondary-muted">Source: {docData?.source || "Exchange Filing"}</span>
            )}
          </div>

          <button onClick={onClose} className="p-1.5 text-secondary-muted hover:text-primary rounded-full hover:bg-surface-elevated">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-subtle px-5 bg-surface text-xs font-bold">
          <button
            onClick={() => setReaderTab("chunks")}
            className={`py-3 px-4 border-b-2 flex items-center space-x-1.5 transition-all ${
              readerTab === "chunks"
                ? "border-accent text-accent"
                : "border-transparent text-secondary-muted hover:text-primary"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Document Passages & Sections ({docData?.chunk_count || 0})</span>
          </button>
          <button
            onClick={() => setReaderTab("versions")}
            className={`py-3 px-4 border-b-2 flex items-center space-x-1.5 transition-all ${
              readerTab === "versions"
                ? "border-accent text-accent"
                : "border-transparent text-secondary-muted hover:text-primary"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Version History ({docData?.versions?.length || 1})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center text-secondary-muted text-xs font-bold flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-accent" />
              <span>Loading verified document text and metadata...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-negative/10 border border-negative/20 text-negative text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : readerTab === "chunks" ? (
            <div className="space-y-4">
              {docData?.chunks?.map((chunk: any) => {
                const isSelected = selectedChunkId === chunk.id;
                return (
                  <div
                    key={chunk.id}
                    id={`chunk-${chunk.id}`}
                    onClick={() => setSelectedChunkId(chunk.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-accent/5 border-accent ring-2 ring-accent/60 shadow-xs"
                        : "bg-surface-elevated/40 border-subtle hover:bg-surface-elevated"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-subtle pb-2 mb-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <Bookmark className={`w-3.5 h-3.5 ${isSelected ? "text-accent" : "text-secondary-muted"}`} />
                        <span className="font-extrabold text-primary">
                          Section: {chunk.section || "Corporate Filing"}
                        </span>
                      </div>
                      <span className="text-[10px] bg-surface border border-subtle px-2 py-0.5 rounded-full font-mono font-bold text-secondary">
                        Page {chunk.page_number || 1}
                      </span>
                    </div>

                    <p className="text-xs text-secondary leading-relaxed font-medium whitespace-pre-wrap">
                      {chunk.content}
                    </p>

                    {chunk.citation && (
                      <div className="mt-2 pt-2 border-t border-subtle text-[10px] text-secondary-muted font-mono flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                        <span>Citation Anchor: {chunk.citation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                Audited Document Versions & Revisions
              </h3>
              {docData?.versions?.map((v: any, idx: number) => (
                <div key={v.id || idx} className="p-4 bg-surface-elevated/40 rounded-2xl border border-subtle space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-accent">Version {v.version_number}</span>
                    <span className="text-secondary-muted font-mono text-[10px]">{v.created_at?.slice(0, 16)}</span>
                  </div>
                  <p className="text-secondary font-medium">{v.change_notes || "Initial ingestion"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-subtle bg-surface-elevated/40 flex items-center justify-between text-xs">
          <span className="text-secondary-muted text-[11px] font-mono">
            Document ID: {docData?.id} | SHA-256 Verified
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-accent text-accent-foreground font-bold rounded-full hover:opacity-90 text-xs shadow-xs"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};
