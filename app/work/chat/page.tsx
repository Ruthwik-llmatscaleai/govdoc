"use client";

import { useState, useEffect, useRef } from "react";
import type { ProcessedDocument } from "@/lib/document-service";
import type { ChatMessage } from "@/lib/chat-service";
import { FileText, Menu, X, Send, Paperclip } from "lucide-react";

// Hardcoded user for now - will use actual auth in production
const USER_ID = "dev";

export default function SearchAskPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from BigQuery on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load documents
        const docsResponse = await fetch(`/api/storage/load-documents?userId=${USER_ID}`);
        const docsData = await docsResponse.json();
        if (docsData.success) {
          setDocuments(docsData.documents);
        }

        // Load chat history
        const historyResponse = await fetch(`/api/storage/load-history?userId=${USER_ID}`);
        const historyData = await historyResponse.json();
        if (historyData.success) {
          setChatHistory(historyData.history);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("userId", USER_ID);
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Reload documents
        const docsResponse = await fetch(`/api/storage/load-documents?userId=${USER_ID}`);
        const docsData = await docsResponse.json();
        if (docsData.success) {
          setDocuments(docsData.documents);
        }
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isAnswering) return;
    if (documents.length === 0) {
      alert("Please upload at least one PDF document first using the paperclip icon.");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    // Save user message to BigQuery
    await fetch("/api/storage/save-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...userMessage,
        userId: USER_ID,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }),
    });

    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setInputValue("");
    setIsAnswering(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content,
          userId: USER_ID,
          chatHistory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save assistant message to BigQuery
        const assistantMessage = {
          ...data.answer,
          userId: USER_ID,
          messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };

        await fetch("/api/storage/save-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assistantMessage),
        });

        const updatedHistory = [...newHistory, data.answer];
        setChatHistory(updatedHistory);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Chat error:", error);
      alert("Failed to get answer. Please try again.");
    } finally {
      setIsAnswering(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearAll = async () => {
    if (confirm("Clear all documents and chat history?")) {
      try {
        await fetch("/api/storage/clear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: USER_ID }),
        });
        setDocuments([]);
        setChatHistory([]);
      } catch (error) {
        console.error("Clear error:", error);
        alert("Failed to clear data.");
      }
    }
  };

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-cream)]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-[var(--color-line)] border-t-[var(--color-govdoc-primary)]" />
          <p className="text-sm text-[var(--color-ink-mute)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--color-cream)]">
      {/* Sidebar */}
      <div
        className={`flex flex-col border-r border-[var(--color-line)] bg-[var(--color-paper)] transition-all ${
          sidebarOpen ? "w-[260px]" : "w-0"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
          <h2 className="text-sm font-medium text-[var(--color-ink)]">Search & Ask</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Documents list */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
            Documents ({documents.length})
          </div>
          {documents.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-mute)]">No documents uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded border border-[var(--color-line)] bg-[var(--color-cream-soft)] p-2"
                >
                  <div className="mb-1 flex items-start gap-2">
                    <FileText className="size-4 shrink-0 text-[var(--color-govdoc-primary)]" />
                    <div className="min-w-0 flex-1">
                      <div className="break-words text-xs font-medium text-[var(--color-ink)]">{doc.name}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--color-ink-faint)]">
                    {doc.pageCount} pages • {doc.chunks.length} chunks
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {documents.length > 0 && (
          <div className="border-t border-[var(--color-line)] px-4 py-3">
            <button
              onClick={handleClearAll}
              className="w-full rounded border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-ink-mute)] hover:bg-[var(--color-cream-soft)]"
            >
              Clear All
            </button>
          </div>
        )}

        {/* User info at bottom */}
        <div className="border-t border-[var(--color-line)] p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm font-semibold text-white">
              D
            </div>
            <span className="text-sm font-medium text-[var(--color-ink)]">dev</span>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-3">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
                aria-label="Open sidebar"
              >
                <Menu className="size-5" />
              </button>
            )}
            <h1 className="text-sm font-medium text-[var(--color-ink)]">
              {documents.length > 0 ? `${documents.length} document${documents.length > 1 ? "s" : ""} • ${totalChunks} chunks` : "Search & Ask"}
            </h1>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {chatHistory.length === 0 ? (
            /* Welcome screen */
            <div className="flex h-full flex-col items-center justify-center p-8">
              <div className="w-full max-w-2xl text-center">
                <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] text-2xl font-bold text-white mx-auto">
                  AI
                </div>
                <h2
                  className="mb-3 text-3xl tracking-tight text-[var(--color-ink)]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 96',
                  }}
                >
                  How can I help you today?
                </h2>
                <p className="mb-8 text-sm text-[var(--color-ink-mute)]">
                  Upload PDFs using the paperclip icon below and ask questions about your documents
                </p>

                {documents.length > 0 && (
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
                    <p className="mb-2 text-sm font-medium text-[var(--color-govdoc-primary)]">
                      ✓ {documents.length} document{documents.length > 1 ? "s" : ""} ready
                    </p>
                    <p className="text-xs text-[var(--color-ink-mute)]">Ask me anything about your uploaded files</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Chat messages */
            <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
              {chatHistory.map((msg, index) => (
                <div key={index} className="flex gap-4">
                  {/* Avatar */}
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                      msg.role === "user" ? "bg-[var(--color-ink)]" : "bg-[var(--color-govdoc-primary)]"
                    }`}
                  >
                    {msg.role === "user" ? "D" : "AI"}
                  </div>

                  {/* Message content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-xs font-medium text-[var(--color-ink-mute)]">
                      {msg.role === "user" ? "You" : "Assistant"}
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink)]">
                      {msg.content}
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-[var(--color-ink-mute)]">Sources:</div>
                        {msg.sources.map((source, i) => (
                          <div
                            key={i}
                            className="rounded border border-[var(--color-line)] bg-[var(--color-cream-soft)] p-2"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-medium text-[var(--color-ink)]">
                                {source.documentName} (Chunk {source.chunkIndex + 1})
                              </span>
                              <span className="text-[10px] text-[var(--color-ink-faint)]">
                                {(source.score * 100).toFixed(1)}% match
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-[var(--color-ink-mute)]">{source.excerpt}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAnswering && (
                <div className="flex gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] text-sm font-semibold text-white">
                    AI
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-xs font-medium text-[var(--color-ink-mute)]">Assistant</div>
                    <div className="text-sm text-[var(--color-ink-mute)]">Thinking...</div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[var(--color-line)] bg-[var(--color-paper)] p-5">
          <div className="mx-auto w-full max-w-3xl">
            <div className="relative flex items-end gap-2 rounded-xl border border-[var(--color-line)] bg-white p-2 focus-within:border-[var(--color-govdoc-primary)]">
              {/* Paperclip button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--color-ink-mute)] transition hover:bg-[var(--color-cream-soft)] hover:text-[var(--color-ink)]"
                aria-label="Attach files"
                disabled={isUploading}
                title="Upload PDF documents"
              >
                {isUploading ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-govdoc-primary)]" />
                ) : (
                  <Paperclip className="size-5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />

              {/* Text input */}
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your documents..."
                className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-faint)] focus:outline-none"
                rows={1}
                disabled={isAnswering}
              />

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isAnswering}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-govdoc-primary)] text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-[var(--color-ink-faint)]">
              {documents.length > 0
                ? `${totalChunks} chunks loaded • Press Enter to send • Shift+Enter for new line`
                : "Upload documents using the paperclip icon to get started"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
