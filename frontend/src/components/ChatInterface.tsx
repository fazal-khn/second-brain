"use client";

import React, { useState, useEffect, useRef } from "react";
import { chatAPI } from "@/lib/api";
import { ChatMessage } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { 
  Send, Trash2, Copy, Sparkles, 
  HelpCircle, MessageSquare 
} from "lucide-react";

interface ChatInterfaceProps {
  documentId: string;
  onCitationClick?: (pageNumber: number) => void;
}

export default function ChatInterface({ documentId, onCitationClick }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatData = async () => {
    setHistoryLoading(true);
    try {
      const [history, suggestions] = await Promise.all([
        chatAPI.getHistory(documentId),
        chatAPI.getSuggestedQuestions(documentId),
      ]);
      setMessages(history);
      setSuggestedQuestions(suggestions);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setHistoryLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    fetchChatData();
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    // Append user message locally
    const userMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      document_id: documentId,
      user_id: "",
      role: "user",
      content: text,
      source_chunks: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const reply = await chatAPI.sendMessage(documentId, text);
      const assistantMsg: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        document_id: documentId,
        user_id: "",
        role: "assistant",
        content: reply.response,
        source_chunks: reply.source_chunks,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMsg: ChatMessage = {
        id: `temp-err-${Date.now()}`,
        document_id: documentId,
        user_id: "",
        role: "assistant",
        content: "🚨 Failed to retrieve answer. Please make sure OpenAI and Pinecone API keys are valid.",
        source_chunks: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear chat history for this document?")) return;
    try {
      await chatAPI.clearHistory(documentId);
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear chat:", err);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
      
      {/* Header bar */}
      <div className="flex items-center justify-between p-4 border-b bg-surface/40 shrink-0" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-primary-violet" />
          <span className="text-xs font-bold text-text-primary">Ask AI Helper</span>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center text-text-secondary hover:text-red-500 text-xs font-medium px-2 py-1 rounded hover:bg-surface transition-all border border-transparent"
            title="Clear Chat History"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {historyLoading ? (
          <div className="space-y-4">
            <div className="skeleton-shimmer h-12 w-2/3 rounded-xl rounded-tl-none" />
            <div className="skeleton-shimmer h-16 w-3/4 rounded-xl rounded-tr-none ml-auto" />
            <div className="skeleton-shimmer h-12 w-1/2 rounded-xl rounded-tl-none" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <HelpCircle className="h-10 w-10 text-text-muted" />
            <div>
              <h4 className="text-sm font-bold text-text-primary">No questions asked yet</h4>
              <p className="text-text-muted text-xs mt-1 max-w-xs leading-relaxed">
                Type any query below, or choose one of the suggested items to kickstart the analysis.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1.5 ${isUser ? "items-end" : "items-start"}`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed transition-all ${
                    isUser
                      ? "bg-primary-violet text-white rounded-tr-none"
                      : "bg-surface text-text-primary border rounded-tl-none"
                  }`}
                  style={!isUser ? { borderColor: "var(--color-border)" } : undefined}
                >
                  <ReactMarkdown className="prose dark:prose-invert max-w-none text-xs break-words whitespace-pre-wrap">
                    {msg.content}
                  </ReactMarkdown>

                  {/* References / Citations */}
                  {!isUser && msg.source_chunks && msg.source_chunks.length > 0 && (
                    <div className="border-t pt-2 mt-2 flex flex-wrap gap-1.5" style={{ borderColor: "var(--color-border)" }}>
                      <span className="text-[9px] text-text-muted uppercase font-bold shrink-0 self-center">Sources:</span>
                      {msg.source_chunks.map((chunk, index) => (
                        <button
                          key={index}
                          onClick={() => onCitationClick && onCitationClick(chunk.page)}
                          className="flex items-center text-[10px] font-bold text-primary-blue hover:text-white px-2 py-0.5 bg-primary-blue/10 hover:bg-primary-blue rounded border border-primary-blue/20 transition-all"
                          title={chunk.text_snippet}
                        >
                          📄 Page {chunk.page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bubble Footer Action */}
                {!isUser && (
                  <button
                    onClick={() => handleCopyText(msg.content)}
                    className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-all border border-transparent"
                    title="Copy Answer"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex flex-col items-start space-y-1.5 animate-pulse">
            <div className="bg-surface text-text-secondary border px-4 py-3 rounded-2xl rounded-tl-none text-xs flex items-center space-x-2" style={{ borderColor: "var(--color-border)" }}>
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] font-medium text-text-muted pl-1">AI Ingesting vector memory...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Grid */}
      {suggestedQuestions.length > 0 && messages.length === 0 && (
        <div className="px-4 py-3 bg-surface/20 border-t shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center text-[10px] font-bold uppercase text-text-muted mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary-violet mr-1 shrink-0" />
            Suggested Questions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className="text-left text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface p-2 border hover:border-surface-hover rounded-lg truncate transition-all"
                style={{ borderColor: "var(--color-border)" }}
                title={q}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="p-3 border-t bg-surface/40 flex items-center space-x-2 shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input
          type="text"
          placeholder="Ask anything about the document..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
          className="flex-1 bg-surface border hover:border-primary-violet/30 focus:border-primary-violet rounded-lg px-4 py-2.5 outline-none text-xs text-text-primary placeholder-text-muted transition-all disabled:opacity-50"
          style={{ borderColor: "var(--color-border)" }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="p-2.5 bg-primary-violet hover:opacity-90 active:scale-[0.96] disabled:opacity-30 rounded-lg text-white transition-all shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      
    </div>
  );
}
