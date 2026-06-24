"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import DocumentCompare from "@/components/DocumentCompare";
import { documentsAPI, compareAPI } from "@/lib/api";
import { Document, Comparison } from "@/lib/types";
import { GitCompare, Check, RefreshCw, AlertCircle, FileText } from "lucide-react";

export default function CompareDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    documentsAPI.list()
      .then((data) => {
        // Only allow documents in status 'ready' for comparison
        setDocuments(data.filter((d) => d.processing_status === "ready"));
      })
      .catch((err) => console.error("Failed to load documents:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectDoc = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((d) => d !== id);
      } else {
        if (prev.length >= 3) {
          alert("You can select a maximum of 3 documents to compare.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleRunComparison = async () => {
    if (selectedIds.length < 2 || selectedIds.length > 3) {
      alert("Please select either 2 or 3 documents to compare.");
      return;
    }

    setComparing(true);
    setError(null);
    try {
      const comp = await compareAPI.compare(selectedIds);
      setComparison(comp);
    } catch (err: any) {
      console.error("Comparison error:", err);
      const detail = err.response?.data?.detail || "AI comparison failed. Please make sure keys are correctly configured.";
      setError(detail);
    } finally {
      setComparing(false);
    }
  };

  const handleReset = () => {
    setComparison(null);
    setSelectedIds([]);
    setError(null);
  };

  return (
    <div className="flex-1 bg-background flex flex-col min-h-screen">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-slide-up">
        
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center">
              Compare Documents
              <GitCompare className="h-5 w-5 text-primary-violet ml-2" />
            </h1>
            <p className="text-text-muted text-xs mt-1">
              Select 2 or 3 documents to evaluate agreements, contradictions, similarity scores, and details.
            </p>
          </div>
          {comparison && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-4 py-2 bg-surface hover:bg-surface-hover border rounded-lg text-xs font-semibold text-text-primary transition-all shadow"
              style={{ borderColor: "var(--color-border)" }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Compare</span>
            </button>
          )}
        </div>

        {/* Comparison Render OR Selection Grid */}
        {comparing ? (
          <div className="flex flex-col items-center justify-center p-20 border bg-card rounded-2xl space-y-4" style={{ borderColor: "var(--color-border)" }}>
            <span className="w-8 h-8 border-4 border-primary-violet/30 border-t-primary-violet rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-text-primary">Cross-Examining Knowledge Bases...</h3>
              <p className="text-text-muted text-xs">AI is computing semantic vectors, fact vectors, and discrepancies</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 border bg-card rounded-2xl flex flex-col items-center space-y-4 max-w-md mx-auto text-center" style={{ borderColor: "var(--color-border)" }}>
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Comparison Failed</h3>
              <p className="text-text-muted text-xs mt-1 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-surface hover:bg-surface-hover border rounded-lg text-xs font-semibold text-text-primary transition-all"
              style={{ borderColor: "var(--color-border)" }}
            >
              Try Again
            </button>
          </div>
        ) : comparison ? (
          <DocumentCompare comparison={comparison} documents={documents} />
        ) : (
          <div className="space-y-6">
            
            {/* Selection Grid Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface/40 p-4 rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
              <span className="text-xs text-text-muted font-semibold">
                {selectedIds.length === 0 
                  ? "Select documents below to begin comparison." 
                  : `Selected: ${selectedIds.length} of max 3 documents.`}
              </span>
              <button
                onClick={handleRunComparison}
                disabled={selectedIds.length < 2}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-violet to-primary-blue hover:opacity-90 active:scale-[0.98] disabled:opacity-30 text-xs font-bold rounded-xl text-white transition-all pt-2 pb-2"
              >
                <GitCompare className="h-4 w-4" />
                <span>Compare Selected</span>
              </button>
            </div>

            {/* Document Selection Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2].map((n) => (
                  <div key={n} className="skeleton-shimmer h-[100px] rounded-xl border" style={{ borderColor: "var(--color-border)" }} />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="border border-dashed rounded-xl p-16 flex flex-col items-center justify-center text-center" style={{ borderColor: "var(--color-border)" }}>
                <div className="p-4 bg-surface rounded-full border mb-4" style={{ borderColor: "var(--color-border)" }}>
                  <GitCompare className="h-6 w-6 text-text-muted" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">No documents available</h3>
                <p className="text-text-muted text-xs mt-1 max-w-sm">
                  You need to upload at least 2 processed documents in your Library before triggering comparison views.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => {
                  const isChecked = selectedIds.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc.id)}
                      className={`glass-card p-4 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-4 h-[100px] ${
                        isChecked 
                          ? "border-primary-violet bg-primary-violet/[0.03]" 
                          : "hover:border-primary-violet/30"
                      }`}
                      style={!isChecked ? { borderColor: "var(--color-border)" } : undefined}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 bg-surface rounded-lg border shrink-0" style={{ borderColor: "var(--color-border)" }}>
                          <FileText className={`h-6 w-6 ${isChecked ? "text-primary-violet" : "text-text-muted"}`} />
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-text-primary truncate" title={doc.filename}>{doc.filename}</h4>
                          <span className="text-[10px] text-text-muted uppercase block font-semibold mt-1">
                            {doc.page_count ?? 1} pages · {doc.file_size_mb} MB
                          </span>
                        </div>
                      </div>

                      {/* Checkbox badge indicator */}
                      <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                        isChecked 
                          ? "bg-primary-violet text-white shadow shadow-primary-violet/20" 
                          : "border bg-surface"
                      }`}
                      style={!isChecked ? { borderColor: "var(--color-border)" } : undefined}>
                        {isChecked && <Check className="h-3.5 w-3.5 font-black" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
