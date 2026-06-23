"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import DocumentCard from "@/components/DocumentCard";
import FileUploader from "@/components/FileUploader";
import { documentsAPI } from "@/lib/api";
import { Document } from "@/lib/types";
import { 
  Plus, Search, ArrowUpDown, FileText, 
  MessageSquare, BookOpen, HardDrive, Sparkles 
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from "recharts";

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchData = async () => {
    try {
      const [docsData, statsData] = await Promise.all([
        documentsAPI.list(),
        documentsAPI.getUsageStats(),
      ]);
      setDocuments(docsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSortChange = (type: "date" | "name" | "size") => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("desc");
    }
  };

  // Filter and sort documents
  const filteredDocuments = documents
    .filter((doc) =>
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.filename.localeCompare(b.filename);
      } else if (sortBy === "size") {
        comparison = a.file_size_mb - b.file_size_mb;
      } else {
        // Sort by upload date
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="flex-1 bg-background flex flex-col">
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-slide-up">
        
        {/* Dashboard Title & Upload */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
              Your Library
              <Sparkles className="h-5 w-5 text-primary-violet ml-2 fill-primary-violet/10" />
            </h1>
            <p className="text-neutral-400 text-xs mt-1">
              Analyze, search, and manage your vector index knowledge base.
            </p>
          </div>
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-primary-violet to-primary-blue hover:opacity-90 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-violet/10 transition-all pt-2.5 pb-2.5"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Usage Cards */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            
            {/* Total Documents Card */}
            <div className="glass-panel p-5 rounded-xl border border-neutral-800 flex items-center space-x-4">
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-primary-violet">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs font-semibold uppercase">Documents Ingested</p>
                <p className="text-2xl font-black text-white mt-1">
                  {loading ? "-" : stats?.total_documents ?? 0}
                </p>
              </div>
            </div>

            {/* Total Questions Card */}
            <div className="glass-panel p-5 rounded-xl border border-neutral-800 flex items-center space-x-4">
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-primary-blue">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs font-semibold uppercase">Questions Asked</p>
                <p className="text-2xl font-black text-white mt-1">
                  {loading ? "-" : stats?.total_questions ?? 0}
                </p>
              </div>
            </div>

            {/* Total Pages Card */}
            <div className="glass-panel p-5 rounded-xl border border-neutral-800 flex items-center space-x-4">
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-emerald-500">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs font-semibold uppercase">Pages Indexed</p>
                <p className="text-2xl font-black text-white mt-1">
                  {loading ? "-" : stats?.total_pages ?? 0}
                </p>
              </div>
            </div>

            {/* Storage Used Card */}
            <div className="glass-panel p-5 rounded-xl border border-neutral-800 flex items-center space-x-4">
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-yellow-500">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs font-semibold uppercase">Storage Used</p>
                <p className="text-2xl font-black text-white mt-1">
                  {loading ? "-" : `${stats?.storage_used_mb ?? 0} MB`}
                </p>
              </div>
            </div>

            {/* Most Analyzed Document Info */}
            <div className="col-span-2 bg-neutral-950/20 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-semibold uppercase">Most Analyzed File:</span>
              <span className="text-xs font-bold text-white max-w-md truncate">
                {loading ? "-" : stats?.most_analyzed_document ?? "None yet"}
              </span>
            </div>

          </div>

          {/* Weekly Activity Chart Card */}
          <div className="lg:col-span-5 glass-panel p-5 rounded-xl border border-neutral-800 flex flex-col justify-between h-[230px] lg:h-auto">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Questions Asked</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Your activity over the last 7 days</p>
            </div>
            
            <div className="h-28 w-full mt-4">
              {loading ? (
                <div className="w-full h-full skeleton-shimmer rounded" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.weekly_questions ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                    <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} />
                    <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#141414", borderColor: "#262626", borderRadius: "8px" }}
                      labelStyle={{ color: "#a3a3a3", fontSize: "11px", fontWeight: "bold" }}
                      itemStyle={{ color: "#3b82f6", fontSize: "11px" }}
                    />
                    <Bar dataKey="questions" fill="url(#colorQuestions)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-950/40 p-4 rounded-xl border border-neutral-800">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search documents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-primary-violet rounded-lg outline-none text-xs text-white transition-all"
            />
          </div>

          {/* Sort Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-400">
            <span className="flex items-center text-neutral-500 mr-2">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              Sort By:
            </span>
            <button
              onClick={() => handleSortChange("date")}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                sortBy === "date"
                  ? "bg-neutral-800 border-neutral-700 text-white"
                  : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400"
              }`}
            >
              Upload Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleSortChange("name")}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                sortBy === "name"
                  ? "bg-neutral-800 border-neutral-700 text-white"
                  : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400"
              }`}
            >
              Filename {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleSortChange("size")}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                sortBy === "size"
                  ? "bg-neutral-800 border-neutral-700 text-white"
                  : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400"
              }`}
            >
              File Size {sortBy === "size" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton-shimmer h-[190px] rounded-xl border border-neutral-800" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-neutral-900 rounded-full border border-neutral-800 mb-4">
              <FileText className="h-6 w-6 text-neutral-500" />
            </div>
            <h3 className="text-sm font-bold text-white">No documents found</h3>
            <p className="text-neutral-500 text-xs mt-1 max-w-sm">
              {searchQuery ? "No matches for your search query. Try another name." : "Upload a PDF, DOCX, or TXT file to start indexing knowledge."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowUploader(true)}
                className="mt-6 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold rounded-lg text-white transition-all"
              >
                Upload File
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDeleteSuccess={fetchData}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Uploader Modal */}
      {showUploader && (
        <FileUploader
          onClose={() => setShowUploader(false)}
          onUploadComplete={fetchData}
        />
      )}
    </div>
  );
}
