"use client";

import React, { useState } from "react";
import { Comparison, Document } from "@/lib/types";
import { compareAPI } from "@/lib/api";
import { 
  FileText, Download, GitCompare, 
  CheckCircle, AlertTriangle, ArrowRightLeft, Sparkles 
} from "lucide-react";

interface DocumentCompareProps {
  comparison: Comparison;
  documents: Document[];
}

export default function DocumentCompare({ comparison, documents }: DocumentCompareProps) {
  const [downloading, setDownloading] = useState(false);
  const { result } = comparison;

  // Create a map from document IDs to filenames for easy resolution
  const docMap = documents.reduce((acc, doc) => {
    acc[doc.id] = doc.filename;
    return acc;
  }, {} as Record<string, string>);

  const handleDownloadReport = () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const url = compareAPI.getReportUrl(comparison.id);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to generate comparison report:", err);
      alert("Failed to export PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  const getDocName = (index: number) => {
    const id = comparison.document_ids[index];
    return docMap[id] || `Document ${index + 1}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <GitCompare className="h-5 w-5 text-primary-violet" />
            <h2 className="text-lg font-black text-white">Comparative Matrix</h2>
          </div>
          <p className="text-xs text-neutral-450 leading-relaxed max-w-xl">
            This analysis evaluates semantic overlap, factual convergence, and contradictions across: <br />
            {comparison.document_ids.map((_, i) => (
              <span key={i} className="inline-block bg-neutral-900 px-2 py-0.5 rounded text-[10px] font-bold text-neutral-300 mr-1.5 mt-1 border border-neutral-850">
                📄 {getDocName(i)}
              </span>
            ))}
          </p>
        </div>

        {/* Action Button & Similarity Meter */}
        <div className="flex items-center space-x-6 shrink-0 border-t md:border-t-0 md:border-l border-neutral-850 pt-4 md:pt-0 md:pl-6">
          <div className="text-center">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block">Similarity Score</span>
            <span className="text-3xl font-black text-gradient block mt-1">{result.similarity_score}%</span>
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-primary-violet hover:opacity-90 active:scale-[0.97] disabled:opacity-40 text-xs font-bold rounded-lg text-white transition-all shadow-md shadow-primary-violet/10 pt-2 pb-2"
          >
            <Download className="h-4 w-4" />
            <span>{downloading ? "Exporting..." : "Export PDF Report"}</span>
          </button>
        </div>
      </div>

      {/* Comparative Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Verdict, Themes, Common/Unique */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Verdict Box */}
          <div className="glass-panel p-5 rounded-xl border border-neutral-800 space-y-3">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center">
              <Sparkles className="h-4 w-4 text-yellow-500 mr-1.5 fill-yellow-550/15" />
              Comparative Verdict
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/20 p-3 rounded-lg border border-neutral-850">
              {result.overall_verdict}
            </p>
          </div>

          {/* Common Topics */}
          <div className="glass-panel p-5 rounded-xl border border-neutral-800 space-y-3">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Common Topics Covered
            </span>
            <ul className="space-y-2">
              {result.common_topics.map((topic, i) => (
                <li key={i} className="flex items-center space-x-2 text-xs text-neutral-350">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Document Unique Topics */}
          <div className="glass-panel p-5 rounded-xl border border-neutral-800 space-y-3">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Unique Document Subjects
            </span>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-neutral-500 uppercase block truncate">Only in: {getDocName(0)}</span>
                <div className="flex flex-wrap gap-1">
                  {result.unique_to_doc1.map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-neutral-900 border border-neutral-850 rounded text-[10px] text-neutral-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-neutral-500 uppercase block truncate">Only in: {getDocName(1)}</span>
                <div className="flex flex-wrap gap-1">
                  {result.unique_to_doc2.map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-neutral-900 border border-neutral-850 rounded text-[10px] text-neutral-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Agreements, Contradictions, Details comparison */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Agreements Panel */}
          <div className="glass-panel p-5 rounded-xl border border-neutral-800 space-y-4">
            <span className="text-[10px] font-bold text-emerald-450 uppercase tracking-wider flex items-center">
              <CheckCircle className="h-4 w-4 text-emerald-500 mr-1.5" />
              Agreements & Factual Convergences
            </span>
            
            <div className="grid grid-cols-1 gap-2.5">
              {result.agreements.map((agree, i) => (
                <div key={i} className="p-3.5 bg-neutral-950/20 border border-neutral-850 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-white block">{agree.topic}</span>
                  <p className="text-neutral-400 text-xs leading-relaxed">{agree.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contradictions Panel */}
          <div className="glass-panel p-5 rounded-xl border border-neutral-800 space-y-4">
            <span className="text-[10px] font-bold text-red-450 uppercase tracking-wider flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-1.5" />
              Contradictions & Divergences
            </span>
            
            <div className="grid grid-cols-1 gap-3">
              {result.contradictions.map((contra, i) => (
                <div key={i} className="p-4 bg-neutral-950/30 border border-neutral-850 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-white block border-b border-neutral-900 pb-1.5">{contra.topic}</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 truncate block">{getDocName(0)} Says</span>
                      <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/40 p-2.5 rounded border border-neutral-900">
                        {contra.doc1_says || (contra as any).doc1}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 truncate block">{getDocName(1)} Says</span>
                      <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/40 p-2.5 rounded border border-neutral-900">
                        {contra.doc2_says || (contra as any).doc2}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Depth/Detail Winner */}
          <div className="glass-panel p-5 rounded-xl border border-neutral-800 space-y-4">
            <span className="text-[10px] font-bold text-primary-blue uppercase tracking-wider flex items-center">
              <ArrowRightLeft className="h-4 w-4 text-primary-blue mr-1.5" />
              Depth & Detail Comparison
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {result.more_detailed_on.map((item, i) => (
                <div key={i} className="p-3 bg-neutral-950/20 border border-neutral-850 rounded-xl flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">{item.topic}</span>
                    <p className="text-[11px] text-neutral-550 leading-relaxed">{item.reason}</p>
                  </div>
                  <span className="text-[10px] font-bold text-primary-violet bg-primary-violet/10 border border-primary-violet/20 px-2.5 py-1 rounded-md shrink-0 block truncate max-w-[180px]">
                    🏆 {item.winner === "doc1" ? getDocName(0) : item.winner === "doc2" ? getDocName(1) : item.winner}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
