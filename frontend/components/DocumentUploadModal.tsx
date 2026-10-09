"use client";

import React, { useState } from "react";
import { uploadResearchDocument } from "@/lib/api";
import { Upload, X, FileText, CheckCircle2, AlertCircle, RefreshCw, Shield } from "lucide-react";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export const DocumentUploadModal: React.FC<Props> = ({ onSuccess, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [company, setCompany] = useState("RELIANCE");
  const [documentType, setDocumentType] = useState("Corporate Disclosure");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError("File size exceeds maximum 10 MB limit.");
        setFile(null);
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a valid document to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await uploadResearchDocument(file, company, documentType);
      setSuccessMsg(`Document '${res.title}' indexed successfully into your research collection.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to upload and index document.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface rounded-3xl max-w-lg w-full border border-subtle shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-accent" />
            <h3 className="text-base font-extrabold text-primary font-display">
              Upload Financial Research Document
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-secondary-muted hover:text-primary rounded-full hover:bg-surface-elevated">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {error && (
            <div className="p-3 bg-negative/10 border border-negative/20 text-negative text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-accent/10 border border-accent/20 text-accent text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-secondary-muted">Target Symbol</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value.toUpperCase())}
                placeholder="e.g. RELIANCE, TCS, AAPL"
                className="w-full bg-surface-elevated border border-subtle rounded-xl p-2.5 text-xs font-bold text-primary mt-1 outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-secondary-muted">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full bg-surface-elevated border border-subtle rounded-xl p-2.5 text-xs font-bold text-primary mt-1 outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="Corporate Disclosure">Corporate Disclosure</option>
                <option value="Annual Report">Annual Report</option>
                <option value="Investor Presentation">Investor Presentation</option>
                <option value="Financial Results">Financial Results</option>
                <option value="Research Note">Research Note</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-secondary-muted block mb-1">
              File Selection (PDF, Markdown, TXT — max 10MB)
            </label>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-subtle hover:border-accent rounded-2xl cursor-pointer bg-surface-elevated/40 hover:bg-surface-elevated transition-all space-y-2">
              <FileText className="w-8 h-8 text-secondary-muted" />
              {file ? (
                <div className="text-center">
                  <span className="text-xs font-bold text-accent block">{file.name}</span>
                  <span className="text-[10px] text-secondary-muted font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-primary block">Click or drag file to upload</span>
                  <span className="text-[10px] text-secondary-muted">Supports PDF, TXT, MD up to 10MB</span>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.txt,.md,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-secondary bg-surface-elevated/40 p-3 rounded-2xl border border-subtle">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <span>Uploaded documents are scanned against prompt injections and stored under user isolation.</span>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-subtle text-secondary text-xs font-bold rounded-full hover:text-primary hover:bg-surface-elevated"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-6 py-2 bg-accent text-accent-foreground text-xs font-bold rounded-full shadow hover:opacity-90 transition-all flex items-center space-x-1.5"
            >
              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{uploading ? "Parsing & Indexing..." : "Upload & Index Document"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
