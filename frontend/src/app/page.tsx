"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText, ArrowRight, MessageSquare, ShieldCheck, 
  Sparkles, Cpu, GitCompare, BarChart3, Database, 
  HelpCircle, CheckSquare, Layers, Download, Check
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [activePreviewTab, setActivePreviewTab] = useState<"chat" | "entities" | "insights" | "compare">("chat");

  const previewTabs = [
    { id: "chat", label: "Semantic Q&A", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: "entities", label: "Key Data Extraction", icon: <Database className="h-3.5 w-3.5" /> },
    { id: "insights", label: "Thematic Insights", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: "compare", label: "Document Compare", icon: <GitCompare className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary overflow-x-hidden">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b transition-all" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-primary-violet to-primary-blue rounded-lg shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-text-primary">
              Doc<span className="text-gradient">Analyzer</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#demo" className="hover:text-text-primary transition-colors">Interactive Demo</a>
            <a href="#workflow" className="hover:text-text-primary transition-colors">How It Works</a>
          </nav>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-primary-violet to-primary-blue hover:opacity-95 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-[0.98]"
          >
            <span>Launch Console</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center px-4 max-w-7xl mx-auto w-full">
        {/* Background glow elements */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[350px] sm:w-[600px] h-[350px] bg-primary-violet/10 dark:bg-primary-violet/5 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/3 w-[250px] sm:w-[400px] h-[250px] bg-primary-blue/10 dark:bg-primary-blue/5 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />

        {/* Floating badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-surface border rounded-full text-[11px] font-bold text-primary-violet mb-6 animate-fade-in" style={{ borderColor: "var(--color-border)" }}>
          <Sparkles className="h-3 w-3 fill-current" />
          <span>Vector RAG & Document Intelligence Platform</span>
        </div>

        {/* Big Bold Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl text-text-primary">
          Synthesize and Query Complex <br className="hidden md:inline" />
          Documents in a <span className="text-gradient">Single Workspace</span>
        </h1>

        {/* Description */}
        <p className="text-text-secondary text-sm sm:text-base md:text-lg max-w-2xl mt-6 leading-relaxed">
          DocAnalyzer acts as your digital second brain. Ingest PDF, DOCX, and TXT files to extract key entities, chat with excerpts, run thematic analytics, and perform side-by-side comparative matrices instantly.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full sm:w-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-primary-violet to-primary-blue hover:opacity-95 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-violet/15 transition-all active:scale-[0.98]"
          >
            <span>Launch Free Console</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="#demo"
            className="w-full sm:w-auto flex items-center justify-center space-x-1 px-8 py-3.5 bg-surface hover:bg-surface-hover border text-sm font-bold rounded-xl text-text-primary transition-all"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span>See Interactive Demo</span>
          </a>
        </div>
      </section>

      {/* Value Proposition Grid / Core Features */}
      <section id="features" className="py-16 md:py-24 border-t bg-surface/10" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">What DocAnalyzer Does</h2>
            <p className="text-text-muted text-xs sm:text-sm max-w-lg mx-auto">
              Supercharge your research and document workflows with six specialized analysis layers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-card p-6 rounded-xl border flex flex-col justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div className="space-y-4">
                <div className="p-3 bg-primary-violet/10 text-primary-violet rounded-lg w-fit">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">Semantic Chat (RAG)</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Query files using natural language. The engine searches database vectors, locates relevant snippets, and responds with exact citations.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-6 rounded-xl border flex flex-col justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div className="space-y-4">
                <div className="p-3 bg-primary-blue/10 text-primary-blue rounded-lg w-fit">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">Entity Data Extractor</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Automatically extracts dates, deadlines, monetary variables, names, companies, location records, statistics, and tasks into spreadsheet datasets.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-6 rounded-xl border flex flex-col justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg w-fit">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">Thematic Insights</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Generates complex metrics including reading level difficulties, estimated reading times, sentiment spectrum ratios, and thematic word clouds.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="glass-card p-6 rounded-xl border flex flex-col justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div className="space-y-4">
                <div className="p-3 bg-pink-500/10 text-pink-500 rounded-lg w-fit">
                  <GitCompare className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">Side-by-Side Comparison</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Select 2 or 3 documents to run cross-examination matrix logic. Instantly reveals factual agreements, contradictions, and data depth.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="glass-card p-6 rounded-xl border flex flex-col justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div className="space-y-4">
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg w-fit">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">Smart Templates</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Instantly formats content into templates: executive summaries, comprehension quizzes, developer checklists, or professional email summaries.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="glass-card p-6 rounded-xl border flex flex-col justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div className="space-y-4">
                <div className="p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-lg w-fit">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">No Login Required</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Zero setup overhead. Land directly in the document console, upload files, and start building your custom knowledge base immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Demo Widget */}
      <section id="demo" className="py-16 md:py-24 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">See DocAnalyzer in Action</h2>
            <p className="text-text-muted text-xs sm:text-sm max-w-lg mx-auto">
              Click the tabs below to preview the document workspace outputs.
            </p>
          </div>

          {/* Interactive UI Showcase Widget */}
          <div className="glass-panel rounded-2xl border overflow-hidden shadow-xl max-w-5xl mx-auto flex flex-col lg:flex-row h-auto lg:h-[500px]" style={{ borderColor: "var(--color-border)" }}>
            
            {/* Left selector bar */}
            <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r bg-surface/30 shrink-0 p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible" style={{ borderColor: "var(--color-border)" }}>
              {previewTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap lg:w-full ${
                    activePreviewTab === tab.id
                      ? "bg-primary-violet text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Right preview display */}
            <div className="flex-1 bg-background p-6 overflow-y-auto">
              
              {/* Tab 1: Chat Preview */}
              {activePreviewTab === "chat" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-[11px] font-bold text-text-muted uppercase">Workspace Preview · RAG QA Engine</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  <div className="space-y-3.5">
                    {/* User message */}
                    <div className="flex flex-col items-end">
                      <div className="max-w-[80%] bg-primary-violet text-white text-xs px-4 py-2.5 rounded-2xl rounded-tr-none leading-relaxed">
                        What are the compliance deadlines mentioned in the document and who owns them?
                      </div>
                    </div>

                    {/* AI message */}
                    <div className="flex flex-col items-start">
                      <div className="max-w-[85%] bg-surface text-text-primary border text-xs px-4 py-3 rounded-2xl rounded-tl-none leading-relaxed" style={{ borderColor: "var(--color-border)" }}>
                        Based on the uploaded document (<span className="text-primary-violet font-semibold">Q3_Compliance_Audit.pdf</span>):
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                          <li><strong>August 15, 2026</strong>: Ingest data controls to GDPR server (Owner: <em>Sarah Jenkins</em>).</li>
                          <li><strong>September 30, 2026</strong>: Complete third-party vendor vulnerability scan (Owner: <em>Marcus Brody</em>).</li>
                        </ul>
                        {/* Citation tag */}
                        <div className="border-t pt-2 mt-2.5 flex items-center space-x-2" style={{ borderColor: "var(--color-border)" }}>
                          <span className="text-[9px] text-text-muted uppercase font-bold">Sources:</span>
                          <span className="text-[9px] font-bold text-primary-blue px-2 py-0.5 bg-primary-blue/10 rounded border border-primary-blue/20">
                            📄 Page 14
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Entities Preview */}
              {activePreviewTab === "entities" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-[11px] font-bold text-text-muted uppercase">Workspace Preview · Database Extraction</span>
                    <span className="text-[10px] font-bold text-text-muted flex items-center hover:text-text-primary cursor-pointer">
                      <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monetary Box */}
                    <div className="bg-surface/50 border p-4 rounded-xl space-y-2.5" style={{ borderColor: "var(--color-border)" }}>
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Monetary Variables</span>
                      <div className="space-y-1.5">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg flex flex-col text-[10px]">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">$450,000 USD</span>
                          <span className="text-text-secondary text-[9px] mt-0.5">Approved budget allocation for security updates</span>
                        </div>
                      </div>
                    </div>

                    {/* Dates Box */}
                    <div className="bg-surface/50 border p-4 rounded-xl space-y-2.5" style={{ borderColor: "var(--color-border)" }}>
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Dates Discovered</span>
                      <div className="space-y-1.5">
                        <div className="bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 rounded-lg flex flex-col text-[10px]">
                          <span className="font-bold text-orange-650 dark:text-orange-405">August 15, 2026</span>
                          <span className="text-text-secondary text-[9px] mt-0.5">GDPR compliance audit completion window</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Insights Preview */}
              {activePreviewTab === "insights" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-[11px] font-bold text-text-muted uppercase">Workspace Preview · Semantic Metrics</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Readability Score */}
                    <div className="bg-surface/50 border p-4 rounded-xl flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-text-muted uppercase">Complexity Tier</span>
                        <h4 className="text-xs font-bold text-text-primary">Advanced / Academic</h4>
                        <p className="text-[10px] text-text-muted">Best for engineers and auditors</p>
                      </div>
                      <div className="h-12 w-12 rounded-full border-4 border-primary-violet flex items-center justify-center text-xs font-bold text-text-primary">
                        85/100
                      </div>
                    </div>

                    {/* Sentiment spectrum */}
                    <div className="bg-surface/50 border p-4 rounded-xl space-y-3" style={{ borderColor: "var(--color-border)" }}>
                      <span className="text-[9px] font-bold text-text-muted uppercase">Document Sentiment</span>
                      <div className="space-y-1.5">
                        <div className="flex h-2.5 rounded-full overflow-hidden bg-surface border" style={{ borderColor: "var(--color-border)" }}>
                          <div className="bg-emerald-500 h-full" style={{ width: "20%" }} />
                          <div className="bg-neutral-400 h-full" style={{ width: "70%" }} />
                          <div className="bg-red-500 h-full" style={{ width: "10%" }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-text-muted font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400">Positive (20%)</span>
                          <span>Neutral (70%)</span>
                          <span className="text-red-550">Negative (10%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Compare Preview */}
              {activePreviewTab === "compare" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-[11px] font-bold text-text-muted uppercase">Workspace Preview · Document Cross-Exam</span>
                    <span className="text-[10px] font-bold text-primary-violet bg-primary-violet/10 px-2 py-0.5 rounded border border-primary-violet/20">
                      Similarity: 68%
                    </span>
                  </div>

                  {/* Contradiction Box */}
                  <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Divergence Detected: Project Budget
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-text-muted uppercase">Proposal_A.docx</span>
                        <p className="text-xs text-text-secondary leading-relaxed bg-background p-2 rounded border" style={{ borderColor: "var(--color-border)" }}>
                          Allocates $450,000 for infrastructure updates.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-text-muted uppercase">Board_Brief_Final.pdf</span>
                        <p className="text-xs text-text-secondary leading-relaxed bg-background p-2 rounded border" style={{ borderColor: "var(--color-border)" }}>
                          Restricts infrastructure upgrades to $380,000 maximum.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* Onboarding Flow: How it works */}
      <section id="workflow" className="py-16 md:py-24 border-t bg-surface/10" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">How DocAnalyzer Works</h2>
            <p className="text-text-muted text-xs sm:text-sm max-w-lg mx-auto">
              Get analysis results in under one minute with three straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary-violet to-primary-blue text-white flex items-center justify-center text-lg font-black shadow-md">
                1
              </div>
              <h3 className="text-sm font-bold text-text-primary">Upload Files</h3>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Drag and drop your PDF, DOCX, or TXT document (up to 50MB) straight into the upload module.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary-violet to-primary-blue text-white flex items-center justify-center text-lg font-black shadow-md">
                2
              </div>
              <h3 className="text-sm font-bold text-text-primary">Automated Ingestion</h3>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                The platform automatically parses plaintext data, calculates semantic token vectors, and stores them in memory.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary-violet to-primary-blue text-white flex items-center justify-center text-lg font-black shadow-md">
                3
              </div>
              <h3 className="text-sm font-bold text-text-primary">Extract and Chat</h3>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Query with natural questions, extract spreadsheet rows, perform side-by-side matrices, or compile smart actions.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 md:py-20 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-4xl mx-auto text-center px-4 space-y-6">
          <h2 className="text-3xl font-black text-text-primary tracking-tight">Ready to Organize Your Documents?</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
            Upload files now to see the automated summarization, entities, and chat capabilities. No email sign-up required.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-violet to-primary-blue hover:opacity-95 text-white text-sm font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] mt-4"
          >
            <span>Open Document Console</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-surface/30 mt-auto" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-4">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-gradient-to-tr from-primary-violet to-primary-blue rounded">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-text-primary">DocAnalyzer</span>
          </div>
          <p>© {new Date().getFullYear()} DocAnalyzer. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
