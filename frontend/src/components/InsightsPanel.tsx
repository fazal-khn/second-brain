"use client";

import React, { useState, useEffect } from "react";
import { analyzeAPI } from "@/lib/api";
import { DocumentInsights } from "@/lib/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { AlertCircle, Clock, Globe, Smile, Brain, Sparkles, BookOpen } from "lucide-react";

interface InsightsPanelProps {
  documentId: string;
}

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function InsightsPanel({ documentId }: InsightsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<DocumentInsights | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await analyzeAPI.getInsights(documentId);
        setInsights(data);
      } catch (err) {
        console.error("Failed to load insights:", err);
        setError("Failed to generate document metrics.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [documentId]);

  return (
    <div className="flex flex-col h-full space-y-6">
      
      <div>
        <h3 className="text-sm font-bold text-white">Document Analysis Insights</h3>
        <p className="text-[10px] text-neutral-500 mt-0.5">Deep semantic, reading structure, and thematic breakdown</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton-shimmer h-12 w-full rounded-xl" />
            <div className="skeleton-shimmer h-36 w-full rounded-xl" />
            <div className="skeleton-shimmer h-20 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 text-red-400 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in pb-4">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-800 text-center">
                <Clock className="h-4 w-4 text-neutral-500 mx-auto" />
                <span className="text-[9px] text-neutral-500 uppercase block font-semibold mt-1">Reading Time</span>
                <span className="text-xs font-bold text-neutral-200 mt-0.5 block">{insights!.reading_time_minutes} min</span>
              </div>
              <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-800 text-center">
                <Globe className="h-4 w-4 text-neutral-500 mx-auto" />
                <span className="text-[9px] text-neutral-500 uppercase block font-semibold mt-1">Language</span>
                <span className="text-xs font-bold text-neutral-200 mt-0.5 block">{insights!.language}</span>
              </div>
              <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-800 text-center">
                <BookOpen className="h-4 w-4 text-neutral-500 mx-auto" />
                <span className="text-[9px] text-neutral-500 uppercase block font-semibold mt-1">Complexity</span>
                <span className="text-xs font-bold text-neutral-200 mt-0.5 block truncate">{insights!.reading_level}</span>
              </div>
            </div>

            {/* Sentiment Meter */}
            <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center">
                <Smile className="h-4 w-4 text-primary-blue mr-1.5" />
                Sentiment Spectrum
              </span>
              <div className="space-y-2">
                <div className="flex h-3 rounded-full overflow-hidden bg-neutral-950 border border-neutral-900">
                  <div className="bg-emerald-500 h-full" style={{ width: `${insights!.sentiment.positive_pct}%` }} title="Positive" />
                  <div className="bg-neutral-500 h-full" style={{ width: `${insights!.sentiment.neutral_pct}%` }} title="Neutral" />
                  <div className="bg-red-500 h-full" style={{ width: `${insights!.sentiment.negative_pct}%` }} title="Negative" />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500 font-semibold px-1">
                  <span className="text-emerald-400">Positive: {insights!.sentiment.positive_pct}%</span>
                  <span>Neutral: {insights!.sentiment.neutral_pct}%</span>
                  <span className="text-red-400">Negative: {insights!.sentiment.negative_pct}%</span>
                </div>
              </div>
            </div>

            {/* Keyword Tag Cloud */}
            <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center">
                <Brain className="h-4 w-4 text-primary-violet mr-1.5" />
                Key Vocabulary Cloud
              </span>
              <div className="flex flex-wrap gap-1.5">
                {insights!.keywords.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 rounded-lg text-xs font-semibold text-neutral-300 transition-all select-none hover:text-white"
                  >
                    #{word}
                  </span>
                ))}
              </div>
            </div>

            {/* Topic Pie Chart Breakdown */}
            <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider w-full text-left">
                Thematic Topic Breakdown
              </span>
              <div className="w-full flex flex-col sm:flex-row items-center gap-4 pt-2">
                <div className="h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={insights!.topics}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={45}
                        paddingAngle={2}
                        dataKey="percentage"
                        nameKey="topic"
                      >
                        {insights!.topics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#141414", borderColor: "#262626", borderRadius: "8px" }}
                        itemStyle={{ fontSize: "11px", color: "#e5e5e5" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legends */}
                <div className="flex-1 space-y-1.5 w-full">
                  {insights!.topics.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-neutral-300 truncate">{t.topic}</span>
                      </div>
                      <span className="font-bold text-neutral-400 pl-2 shrink-0">{t.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Score Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-neutral-800 flex flex-col justify-center items-center text-center">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Readability Index</span>
                <div className="h-16 w-16 rounded-full border-4 border-primary-blue/30 border-t-primary-blue flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{insights!.readability_score}</span>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-neutral-800 flex flex-col justify-center items-center text-center">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Structure Score</span>
                <div className="h-16 w-16 rounded-full border-4 border-primary-violet/30 border-t-primary-violet flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{insights!.structure_score}</span>
                </div>
              </div>
            </div>

            {/* Readability Suggestions */}
            {insights!.readability_suggestions?.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center">
                  <Sparkles className="h-4 w-4 text-yellow-500 mr-1.5" />
                  Readability Suggestions
                </span>
                <ul className="space-y-2">
                  {insights!.readability_suggestions.map((s, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5 text-xs text-neutral-350 leading-relaxed">
                      <span className="text-primary-violet font-bold mt-0.5 shrink-0">▸</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
