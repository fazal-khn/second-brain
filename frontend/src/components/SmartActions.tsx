"use client";

import React, { useState } from "react";
import { analyzeAPI } from "@/lib/api";
import { 
  Copy, Download, Sparkles, BookOpen, 
  HelpCircle, CheckSquare, Twitter, Mail, Globe, Play 
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SmartActionsProps {
  documentId: string;
}

export default function SmartActions({ documentId }: SmartActionsProps) {
  const [activeAction, setActiveAction] = useState<string>("executive_summary");
  const [language, setLanguage] = useState<string>("English");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const actions = [
    { id: "executive_summary", label: "Executive Summary", icon: <BookOpen className="h-4 w-4" /> },
    { id: "quiz", label: "Comprehension Quiz", icon: <HelpCircle className="h-4 w-4" /> },
    { id: "checklist", label: "Tasks Checklist", icon: <CheckSquare className="h-4 w-4" /> },
    { id: "twitter", label: "Twitter/X Thread", icon: <Twitter className="h-4 w-4" /> },
    { id: "email", label: "Email Summary", icon: <Mail className="h-4 w-4" /> },
    { id: "translation", label: "Translate Summary", icon: <Globe className="h-4 w-4" /> },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setOutput("");
    try {
      const result = await analyzeAPI.executeSmartAction(documentId, activeAction, language);
      setOutput(result);
    } catch (err) {
      console.error("Smart action error:", err);
      setError("Failed to generate content. Please make sure the backend services are running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    alert("Copied to clipboard!");
  };

  const handleDownload = () => {
    if (!output) return;
    const element = document.createElement("a");
    const file = new Blob([output], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `doc_${documentId}_${activeAction}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Selector and Action controls */}
      <div className="space-y-4 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-white">Smart Action Utilities</h3>
          <p className="text-[10px] text-neutral-500 mt-0.5">Synthesize document content into customized business output formats</p>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={() => {
                setActiveAction(act.id);
                setOutput("");
                setError(null);
              }}
              className={`flex items-center space-x-2 p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                activeAction === act.id
                  ? "bg-primary-violet/10 border-primary-violet text-primary-violet"
                  : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white"
              }`}
            >
              {act.icon}
              <span className="truncate">{act.label}</span>
            </button>
          ))}
        </div>

        {/* Configurations bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950/40 p-3 rounded-lg border border-neutral-800">
          
          {/* Language selection for translation & summaries */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-neutral-500 font-semibold">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-neutral-900 border border-neutral-850 rounded px-2 py-1 outline-none text-neutral-300 focus:border-primary-violet font-semibold text-xs"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Portuguese">Portuguese</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-primary-violet to-primary-blue hover:opacity-90 active:scale-[0.98] disabled:opacity-50 text-xs font-bold rounded-lg text-white transition-all pt-1.5 pb-1.5"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{loading ? "Generating..." : "Generate Output"}</span>
          </button>
        </div>
      </div>

      {/* Output Render Box */}
      <div className="flex-1 bg-neutral-950/40 border border-neutral-800 rounded-xl overflow-hidden flex flex-col min-h-[220px]">
        {/* Actions bar */}
        {output && (
          <div className="flex justify-end p-2 border-b border-neutral-850 bg-neutral-950/20 space-x-1 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800/80 rounded transition-all"
              title="Copy output"
            >
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800/80 rounded transition-all"
              title="Download TXT"
            >
              <Download className="h-3 w-3" />
              <span>Download</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <span className="w-5 h-5 border-2 border-primary-violet/30 border-t-primary-violet rounded-full animate-spin" />
              <span className="text-xs text-neutral-500 font-semibold">GPT-4o compiling document assets...</span>
            </div>
          ) : error ? (
            <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-4 rounded-lg flex items-center space-x-2">
              <span className="h-4 w-4 shrink-0 font-bold">🚨</span>
              <span>{error}</span>
            </div>
          ) : output ? (
            <ReactMarkdown className="prose prose-invert max-w-none text-xs whitespace-pre-wrap leading-relaxed">
              {output}
            </ReactMarkdown>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
              <Sparkles className="h-6 w-6 text-neutral-500" />
              <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">
                Select a template structure, configure settings, and click **Generate Output** to begin.
              </p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
