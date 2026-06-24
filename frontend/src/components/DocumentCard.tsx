"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FileText, Trash2, Download, Play, AlertCircle, 
  Hourglass, CheckCircle2 
} from "lucide-react";
import { Document } from "@/lib/types";
import { documentsAPI } from "@/lib/api";

interface DocumentCardProps {
  doc: Document;
  onDeleteSuccess: () => void;
}

export default function DocumentCard({ doc, onDeleteSuccess }: DocumentCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const getFileIcon = () => {
    switch (doc.file_type) {
      case "pdf":
        return <FileText className="h-8 w-8 text-orange-500" />;
      case "docx":
        return <FileText className="h-8 w-8 text-blue-500" />;
      case "txt":
        return <FileText className="h-8 w-8 text-emerald-500" />;
      default:
        return <FileText className="h-8 w-8 text-text-muted" />;
    }
  };

  const getStatusBadge = () => {
    switch (doc.processing_status) {
      case "ready":
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            <span>Ready</span>
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-xs font-semibold rounded-full">
            <Hourglass className="h-3 w-3 animate-spin" />
            <span>Processing ({doc.processing_progress}%)</span>
          </span>
        );
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;
    
    setDownloading(true);
    try {
      const url = await documentsAPI.getDownloadUrl(doc.id);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to download file:", err);
      alert("Error getting download link. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    
    if (!confirm(`Are you sure you want to delete ${doc.filename}? This will remove it from vector memory and cloud storage.`)) {
      return;
    }

    setDeleting(true);
    try {
      await documentsAPI.delete(doc.id);
      onDeleteSuccess();
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete the document.");
      setDeleting(false);
    }
  };

  const formattedDate = new Date(doc.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="glass-card p-5 rounded-xl border flex flex-col justify-between h-[190px]" style={{ borderColor: "var(--color-border)" }}>
      <div>
        <div className="flex items-start justify-between space-x-4">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2.5 bg-surface rounded-lg border shrink-0" style={{ borderColor: "var(--color-border)" }}>
              {getFileIcon()}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-text-primary truncate" title={doc.filename}>
                {doc.filename}
              </h3>
              <p className="text-text-muted text-xs mt-0.5">
                Uploaded {formattedDate}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* File Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-surface/50 p-2 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-text-muted text-[10px] uppercase font-semibold">Pages</p>
            <p className="text-text-primary text-xs font-bold mt-0.5">{doc.page_count ?? "-"}</p>
          </div>
          <div className="bg-surface/50 p-2 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-text-muted text-[10px] uppercase font-semibold">Words</p>
            <p className="text-text-primary text-xs font-bold mt-0.5">{doc.word_count ?? "-"}</p>
          </div>
          <div className="bg-surface/50 p-2 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-text-muted text-[10px] uppercase font-semibold">Size</p>
            <p className="text-text-primary text-xs font-bold mt-0.5">{doc.file_size_mb} MB</p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t pt-3 mt-3" style={{ borderColor: "var(--color-border)" }}>
        <Link 
          href={doc.processing_status === "ready" ? `/document/${doc.id}` : "#"}
          className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
            doc.processing_status === "ready"
              ? "bg-primary-violet text-white hover:opacity-90 active:scale-[0.97]"
              : "bg-surface text-text-muted cursor-not-allowed border"
          }`}
          style={doc.processing_status !== "ready" ? { borderColor: "var(--color-border)" } : undefined}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Analyze</span>
        </Link>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleDownload}
            disabled={doc.processing_status !== "ready" || downloading}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all border"
            style={{ borderColor: "transparent" }}
            title="Download Original"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-all border"
            style={{ borderColor: "transparent" }}
            title="Delete File"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
