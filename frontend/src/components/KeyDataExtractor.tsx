"use client";

import React, { useState, useEffect } from "react";
import { analyzeAPI } from "@/lib/api";
import { ExtractedData } from "@/lib/types";
import { 
  Download, Calendar, DollarSign, User, 
  Building2, Percent, MapPin, CheckSquare, AlertCircle 
} from "lucide-react";

interface KeyDataExtractorProps {
  documentId: string;
}

export default function KeyDataExtractor({ documentId }: KeyDataExtractorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExtractedData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const extracted = await analyzeAPI.getExtractedData(documentId);
        setData(extracted);
      } catch (err) {
        console.error("Extraction error:", err);
        setError("Failed to extract structured database items.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [documentId]);

  const handleExportCSV = () => {
    // Navigate browser to download endpoint
    const url = analyzeAPI.getExtractedDataCsvUrl(documentId);
    window.open(url, "_blank");
  };

  const getSectionIcon = (category: string) => {
    switch (category) {
      case "dates":
        return <Calendar className="h-4 w-4 text-orange-400" />;
      case "monetary":
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case "people":
        return <User className="h-4 w-4 text-blue-400" />;
      case "orgs":
        return <Building2 className="h-4 w-4 text-primary-violet" />;
      case "stats":
        return <Percent className="h-4 w-4 text-pink-400" />;
      case "locs":
        return <MapPin className="h-4 w-4 text-red-400" />;
      case "actions":
        return <CheckSquare className="h-4 w-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const isDataEmpty = () => {
    if (!data) return true;
    return (
      (data.dates?.length ?? 0) === 0 &&
      (data.monetary_values?.length ?? 0) === 0 &&
      (data.people?.length ?? 0) === 0 &&
      (data.organizations?.length ?? 0) === 0 &&
      (data.statistics?.length ?? 0) === 0 &&
      (data.locations?.length ?? 0) === 0 &&
      (data.action_items?.length ?? 0) === 0
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header Info & Export Button */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-bold text-white">Structured Entity Ingestion</h3>
          <p className="text-[10px] text-neutral-500 mt-0.5">Entities discovered automatically in the document text</p>
        </div>
        {!loading && !error && !isDataEmpty() && (
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-xs font-bold rounded-lg text-white transition-all shadow"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Main Extracted Fields Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 4, 5].map((n) => (
              <div key={n} className="skeleton-shimmer h-[120px] rounded-xl border border-neutral-800" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 text-red-400 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        ) : isDataEmpty() ? (
          <div className="p-12 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
            No structured entities could be extracted from this document.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in pb-4">
            
            {/* 1. Dates */}
            {data!.dates?.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-900 pb-2">
                  {getSectionIcon("dates")}
                  <span>Dates & Deadlines</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data!.dates.map((item, idx) => (
                    <div key={idx} className="bg-orange-950/15 border border-orange-900/20 px-2.5 py-1.5 rounded-lg flex flex-col text-[10px] w-full" title={item.context}>
                      <span className="font-bold text-orange-400">{item.value}</span>
                      <span className="text-neutral-400 text-[9px] mt-0.5">{item.context}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Monetary Values */}
            {data!.monetary_values?.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-900 pb-2">
                  {getSectionIcon("monetary")}
                  <span>Monetary Values</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data!.monetary_values.map((item, idx) => (
                    <div key={idx} className="bg-emerald-950/15 border border-emerald-900/20 px-2.5 py-1.5 rounded-lg flex flex-col text-[10px] w-full" title={item.context}>
                      <span className="font-bold text-emerald-400">{item.value} {item.currency}</span>
                      <span className="text-neutral-400 text-[9px] mt-0.5">{item.context}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. People */}
            {data!.people?.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-900 pb-2">
                  {getSectionIcon("people")}
                  <span>Named People</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data!.people.map((item, idx) => (
                    <div key={idx} className="bg-blue-950/15 border border-blue-900/20 px-2.5 py-1.5 rounded-lg flex flex-col text-[10px] w-full" title={item.role}>
                      <span className="font-bold text-blue-400">{item.name}</span>
                      <span className="text-neutral-400 text-[9px] mt-0.5">{item.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Organizations */}
            {data!.organizations?.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-900 pb-2">
                  {getSectionIcon("orgs")}
                  <span>Organizations</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data!.organizations.map((item, idx) => (
                    <div key={idx} className="bg-violet-950/15 border border-violet-900/20 px-2.5 py-1.5 rounded-lg flex flex-col text-[10px] w-full" title={item.type}>
                      <span className="font-bold text-primary-violet">{item.name}</span>
                      <span className="text-neutral-400 text-[9px] mt-0.5">{item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Statistics */}
            {data!.statistics?.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-900 pb-2">
                  {getSectionIcon("stats")}
                  <span>Statistics & Figures</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data!.statistics.map((item, idx) => (
                    <div key={idx} className="bg-pink-950/15 border border-pink-900/20 px-2.5 py-1.5 rounded-lg flex flex-col text-[10px] w-full" title={item.context}>
                      <span className="font-bold text-pink-400">{item.value}</span>
                      <span className="text-neutral-400 text-[9px] mt-0.5">{item.context}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Locations */}
            {data!.locations?.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-900 pb-2">
                  {getSectionIcon("locs")}
                  <span>Locations Mentioned</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data!.locations.map((item, idx) => (
                    <div key={idx} className="bg-red-950/15 border border-red-900/20 px-2.5 py-1.5 rounded-lg flex flex-col text-[10px] w-full" title={item.context}>
                      <span className="font-bold text-red-400">{item.place}</span>
                      <span className="text-neutral-400 text-[9px] mt-0.5">{item.context}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Action Items */}
            {data!.action_items?.length > 0 && (
              <div className="col-span-1 md:col-span-2 glass-panel p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-900 pb-2">
                  {getSectionIcon("actions")}
                  <span>Action Items & Requirements</span>
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {data!.action_items.map((item, idx) => (
                    <div key={idx} className="bg-yellow-950/10 border border-yellow-900/20 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] gap-2">
                      <div className="flex items-start space-x-2">
                        <input type="checkbox" readOnly className="rounded border-neutral-800 bg-neutral-900 text-primary-violet mt-0.5" />
                        <span className="font-semibold text-neutral-200">{item.action}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-neutral-400 border-t border-neutral-900 sm:border-none pt-2 sm:pt-0 shrink-0">
                        <span>Owner: <strong className="text-neutral-300">{item.owner}</strong></span>
                        <span>Deadline: <strong className="text-neutral-300">{item.deadline}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
