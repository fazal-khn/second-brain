"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, CheckCircle2, AlertCircle, Hourglass } from "lucide-react";
import { documentsAPI } from "@/lib/api";

interface FileUploaderProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

export default function FileUploader({ onClose, onUploadComplete }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "extracting" | "embedding" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pollingId, setPollingId] = useState<string | null>(null);

  // Poll backend for progress of the background tasks
  useEffect(() => {
    if (!pollingId) return;

    const interval = setInterval(async () => {
      try {
        const doc = await documentsAPI.get(pollingId);
        const backendProgress = doc.processing_progress;
        const status = doc.processing_status;

        // Map backend progress (25 to 100)
        setProgress(backendProgress);

        if (status === "processing") {
          if (backendProgress < 50) {
            setUploadStatus("extracting");
            setStatusText("Extracting text contents...");
          } else {
            setUploadStatus("embedding");
            setStatusText("Creating semantic embeddings & indexing...");
          }
        } else if (status === "ready") {
          setUploadStatus("success");
          setStatusText("Ready to analyze!");
          setProgress(100);
          clearInterval(interval);
          
          // Auto-close and refresh after 1.5 seconds
          setTimeout(() => {
            onUploadComplete();
            onClose();
          }, 1500);
        } else if (status === "failed") {
          setUploadStatus("error");
          setErrorMessage("Failed to process document text/vectors.");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Error polling document progress:", err);
        setUploadStatus("error");
        setErrorMessage("Connection lost during document parsing.");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingId, onUploadComplete, onClose]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setUploadStatus("uploading");
    setStatusText("Uploading...");
    setProgress(5);

    try {
      // Axios upload progress scaled between 5% and 25%
      const responseDoc = await documentsAPI.upload(selectedFile, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // Map 0-100% of upload to 5-25% of our bar
        const scaledProgress = 5 + Math.round((percentCompleted * 20) / 100);
        setProgress(scaledProgress);
      });

      // File upload complete, start polling for background parsing
      setPollingId(responseDoc.id);
      setProgress(25);
      setUploadStatus("extracting");
      setStatusText("Extracting text contents...");
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadStatus("error");
      const detail = err.response?.data?.detail || "Network error. Please try again.";
      setErrorMessage(detail);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    disabled: uploadStatus !== "idle",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-2xl shadow-2xl p-6 relative" style={{ borderColor: "var(--color-border)" }}>
        
        {/* Close Button */}
        {uploadStatus === "idle" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Title */}
        <h2 className="text-xl font-black text-text-primary mb-2">Upload Document</h2>
        <p className="text-text-muted text-xs mb-6">
          Support PDF, DOCX, and TXT files up to 50MB. Large files are processed in the background.
        </p>

        {/* Dropzone / In-progress / State Render */}
        {uploadStatus === "idle" ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary-violet bg-primary-violet/5"
                : "border-border hover:border-primary-violet/30 bg-surface/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="p-4 bg-surface rounded-full border mb-4" style={{ borderColor: "var(--color-border)" }}>
              <Upload className="h-6 w-6 text-text-secondary" />
            </div>
            <p className="text-sm font-semibold text-text-secondary text-center">
              {isDragActive ? "Drop the file here" : "Drag and drop your file, or click to browse"}
            </p>
            <p className="text-text-muted text-[10px] uppercase font-bold mt-2 tracking-wider">
              PDF, DOCX, TXT
            </p>
          </div>
        ) : (
          <div className="bg-surface/30 p-6 rounded-xl border flex flex-col items-center" style={{ borderColor: "var(--color-border)" }}>
            
            {/* Status Icon */}
            {uploadStatus === "success" && (
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-4" />
            )}
            {uploadStatus === "error" && (
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            )}
            {uploadStatus !== "success" && uploadStatus !== "error" && (
              <Hourglass className="h-10 w-10 text-primary-violet animate-spin mb-4" />
            )}

            {/* File info */}
            <span className="text-sm font-bold text-text-primary truncate max-w-xs mb-1">
              {file?.name}
            </span>
            <span className="text-xs text-text-muted mb-4">
              {(file!.size / (1024 * 1024)).toFixed(2)} MB
            </span>

            {/* Progress Bar */}
            {uploadStatus !== "error" && (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-semibold text-text-secondary">
                  <span>{statusText}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
                  <div
                    className="h-full bg-gradient-to-r from-primary-violet to-primary-blue rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadStatus === "error" && (
              <div className="w-full text-center space-y-4">
                <p className="text-xs text-red-600 dark:text-red-400 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {errorMessage}
                </p>
                <button
                  onClick={() => {
                    setFile(null);
                    setUploadStatus("idle");
                    setProgress(0);
                    setPollingId(null);
                  }}
                  className="px-4 py-2 bg-surface hover:bg-surface-hover text-xs font-semibold rounded-lg border text-text-primary transition-all"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  Try Again
                </button>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
