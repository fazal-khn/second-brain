"use client";

import React, { useState, useEffect } from "react";
import { analyzeAPI } from "@/lib/api";
import { Sparkles, FileText, Target, Users, Calendar, AlertCircle } from "lucide-react";

interface SummaryPanelProps {
  documentId: string;
}

export default function SummaryPanel({ documentId }: SummaryPanelProps) {
  const [activeTab, setActiveTab] = useState<"quick" | "standard" | "detailed">("standard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  const fetchSummary = async (type: "quick" | "standard" | "detailed") => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeAPI.getSummary(documentId, type);
      setSummaryData(data);
    } catch (err: any) {
      console.error("Summary fetch error:", err);
      setError("Failed to generate or fetch summary. Please check API connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(activeTab);
  }, [documentId, activeTab]);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Detail level selector */}
      <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start shrink-0">
        {(["quick", "standard", "detailed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
              activeTab === tab
                ? "bg-neutral-800 text-white shadow"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Summary Output */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton-shimmer h-6 w-1/3 rounded-lg" />
            <div className="skeleton-shimmer h-24 w-full rounded-lg" />
            <div className="skeleton-shimmer h-12 w-full rounded-lg" />
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 text-red-400 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Summary Render */}
            {activeTab === "quick" && summaryData && (
              <div className="space-y-5">
                <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-800">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">One Liner</h4>
                  <p className="text-sm font-bold text-white mt-1 leading-relaxed">"{summaryData.one_liner}"</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider flex items-center">
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-primary-violet fill-primary-violet/10" />
                    Key Bullet Points
                  </h4>
                  <ul className="space-y-2.5">
                    {summaryData.bullets?.map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start space-x-3 text-xs text-neutral-300 leading-relaxed">
                        <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary-violet/10 text-primary-violet text-[9px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-900 pt-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary-blue shrink-0" />
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase font-semibold">Classification</p>
                      <p className="text-xs font-bold text-neutral-300">{summaryData.document_type || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-primary-violet shrink-0" />
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase font-semibold">Target Audience</p>
                      <p className="text-xs font-bold text-neutral-300">{summaryData.target_audience || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Summary Render */}
            {activeTab === "standard" && summaryData && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Main Focus</h4>
                  <p className="text-sm font-bold text-white mt-1 leading-relaxed">"{summaryData.main_topic}"</p>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Paragraph Summary</h4>
                  <p className="text-xs text-neutral-300 mt-2 leading-relaxed whitespace-pre-line bg-neutral-950/20 p-4 rounded-xl border border-neutral-800">
                    {summaryData.summary}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Core Elements</h4>
                  <ul className="space-y-2">
                    {summaryData.key_points?.map((pt: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2.5 text-xs text-neutral-300 leading-relaxed">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-violet mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-900 pt-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary-blue shrink-0" />
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase font-semibold">Document Type</p>
                      <p className="text-xs font-bold text-neutral-300">{summaryData.document_type || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-primary-violet shrink-0" />
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase font-semibold">Audience</p>
                      <p className="text-xs font-bold text-neutral-300">{summaryData.target_audience || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Summary Render */}
            {activeTab === "detailed" && summaryData && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-black text-white">{summaryData.title || "Structured Summary"}</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed bg-neutral-900/30 p-3 rounded-lg border border-neutral-800/80">
                    <span className="font-bold text-white block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Objective / Purpose</span>
                    {summaryData.purpose}
                  </p>
                </div>

                {/* Sections list */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Document Structure Breakdown</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {summaryData.main_sections?.map((sec: any, i: number) => (
                      <div key={i} className="p-4 bg-neutral-950/40 border border-neutral-800 rounded-xl space-y-1">
                        <span className="text-xs font-bold text-white block">{sec.section}</span>
                        <p className="text-neutral-400 text-xs leading-relaxed">{sec.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Findings */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Primary Findings</h4>
                  <ul className="space-y-2">
                    {summaryData.key_findings?.map((find: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2.5 text-xs text-neutral-300 leading-relaxed bg-neutral-900/10 p-2.5 rounded-lg border border-neutral-900">
                        <span className="text-primary-blue font-bold shrink-0 mt-0.5">✔</span>
                        <span>{find}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Conclusions */}
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Conclusions</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed mt-1 whitespace-pre-wrap">{summaryData.conclusions}</p>
                </div>

                {/* Deadlines & Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-900 pt-4">
                  <div className="space-y-2">
                    <span className="text-[9px] text-neutral-500 uppercase font-semibold flex items-center">
                      <Calendar className="h-3.5 w-3.5 text-primary-blue mr-1 shrink-0" />
                      Critical Dates
                    </span>
                    <ul className="space-y-1.5">
                      {summaryData.important_dates?.length > 0 ? (
                        summaryData.important_dates.map((d: string, i: number) => (
                          <li key={i} className="text-xs font-bold text-neutral-300">{d}</li>
                        ))
                      ) : (
                        <li className="text-xs text-neutral-500">None mentioned</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] text-neutral-500 uppercase font-semibold flex items-center">
                      <Sparkles className="h-3.5 w-3.5 text-primary-violet mr-1 shrink-0" />
                      Action Items
                    </span>
                    <ul className="space-y-1.5">
                      {summaryData.action_required?.length > 0 ? (
                        summaryData.action_required.map((act: string, i: number) => (
                          <li key={i} className="text-xs font-semibold text-neutral-300">{act}</li>
                        ))
                      ) : (
                        <li className="text-xs text-neutral-500">No actions required</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
