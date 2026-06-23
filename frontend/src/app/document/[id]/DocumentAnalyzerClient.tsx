"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SummaryPanel from "@/components/SummaryPanel";
import ChatInterface from "@/components/ChatInterface";
import KeyDataExtractor from "@/components/KeyDataExtractor";
import InsightsPanel from "@/components/InsightsPanel";
import SmartActions from "@/components/SmartActions";
import { documentsAPI } from "@/lib/api";
import { Document } from "@/lib/types";
import { 
  FileText, ArrowLeft, Loader2, Sparkles, 
  MessageSquare, FileSpreadsheet, Eye, BrainCircuit, PlaySquare 
} from "lucide-react";

export default function DocumentAnalyzerClient() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"summary" | "chat" | "key_data" | "insights" | "smart_actions">("summary");
  
  // Citation page targeting
  const [citationPage, setCitationPage] = useState<number | null>(null);

  useEffect(() => {
    if (!documentId) return;

    const loadDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const doc = await documentsAPI.get(documentId);
        setDocument(doc);
        
        if (doc.processing_status !== "ready") {
          setError(`Document is currently in status: ${doc.processing_status} (${doc.processing_progress}%). Please wait for processing to finish.`);
          return;
        }

        // Get S3 presigned URL for embedding
        const url = await documentsAPI.getDownloadUrl(documentId);
        setDownloadUrl(url);
      } catch (err) {
        console.error("Failed to load document:", err);
        setError("Document not found or access denied.");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  const handleCitationClick = (pageNum: number) => {
    setCitationPage(pageNum);
  };

  const getIframeSource = () => {
    if (!downloadUrl) return "";
    if (citationPage) {
      return `${downloadUrl}#page=${citationPage}`;
    }
    return downloadUrl;
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary-violet animate-spin" />
          <p className="text-sm font-semibold text-neutral-400">Loading document workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex-1 bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center px-4">
          <FileText className="h-10 w-10 text-red-500" />
          <div>
            <h3 className="text-sm font-bold text-white">Ingestion Error</h3>
            <p className="text-neutral-500 text-xs mt-1 leading-relaxed">{error || "Something went wrong"}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-xs font-semibold rounded-lg text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background flex flex-col h-screen overflow-hidden">
      <Navbar />

      {/* Main Split Interface */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Document Viewer */}
        <div className="flex-1 flex flex-col bg-neutral-950 p-4 border-r border-neutral-850 overflow-hidden h-[50vh] md:h-auto">
          {/* Header metadata bar */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-900 shrink-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-1.5 text-neutral-400 hover:text-white text-xs font-bold transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Library</span>
            </button>
            <span className="text-xs font-bold text-neutral-300 truncate max-w-sm" title={document.filename}>
              {document.filename}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-500">
              {document.file_type} Mode
            </span>
          </div>

          {/* Viewer Container */}
          <div className="flex-1 mt-4 relative bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
            {document.file_type === "pdf" && downloadUrl ? (
              <iframe
                key={citationPage ?? "initial"}
                src={getIframeSource()}
                className="w-full h-full border-none rounded-xl"
                title={document.filename}
              />
            ) : (
              // TXT / DOCX Plain Text representation
              <div className="w-full h-full overflow-y-auto p-6 text-xs text-neutral-350 font-sans leading-relaxed whitespace-pre-wrap select-text scrollbar-thin scrollbar-thumb-neutral-800">
                <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="text-sm font-black text-white border-b border-neutral-800 pb-2 mb-4">
                    Extracted Text Preview
                  </h2>
                  {document.extracted_text || "No text could be extracted."}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Analysis Controls */}
        <div className="w-full md:w-[480px] lg:w-[580px] bg-card flex flex-col overflow-hidden h-[50vh] md:h-auto border-t md:border-t-0 border-neutral-850">
          
          {/* Tabs header with underline animation */}
          <div className="flex border-b border-neutral-850 overflow-x-auto shrink-0 bg-neutral-950/20 scrollbar-none">
            {([
              { id: "summary", label: "Summary", icon: <FileText className="h-3.5 w-3.5" /> },
              { id: "chat", label: "Chat QA", icon: <MessageSquare className="h-3.5 w-3.5" /> },
              { id: "key_data", label: "Key Data", icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
              { id: "insights", label: "Insights", icon: <BrainCircuit className="h-3.5 w-3.5" /> },
              { id: "smart_actions", label: "Actions", icon: <PlaySquare className="h-3.5 w-3.5" /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-5 py-4 border-b-2 text-xs font-bold transition-all whitespace-nowrap outline-none ${
                  activeTab === tab.id
                    ? "border-primary-violet text-white bg-neutral-900/10"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Render panel */}
          <div className="flex-1 p-5 overflow-hidden">
            {activeTab === "summary" && (
              <SummaryPanel documentId={documentId} />
            )}
            
            {activeTab === "chat" && (
              <ChatInterface 
                documentId={documentId} 
                onCitationClick={handleCitationClick}
              />
            )}
            
            {activeTab === "key_data" && (
              <KeyDataExtractor documentId={documentId} />
            )}
            
            {activeTab === "insights" && (
              <InsightsPanel documentId={documentId} />
            )}
            
            {activeTab === "smart_actions" && (
              <SmartActions documentId={documentId} />
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
}
