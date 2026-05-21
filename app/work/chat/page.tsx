"use client";

import { useState, useEffect, useRef } from "react";
import type { ProcessedDocument } from "@/lib/document-service";
import type { ChatMessage } from "@/lib/chat-service";
import { loadDocuments, saveDocuments, loadChatHistory, saveChatHistory, clearAllData, getAllChunks } from "@/lib/storage-service";
import { FileText, Upload, Menu, X, Send } from "lucide-react";

export default function SearchAskPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState<ProcessedDocument[]>(() => loadDocuments());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => loadChatHistory());
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (documents.length > 0) {
      saveDocuments(documents);
    }
  }, [documents]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      saveChatHistory(chatHistory);
    }
  }, [chatHistory]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const newDocs = [...documents, ...data.documents];
        setDocuments(newDocs);
        saveDocuments(newDocs);
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
      alert("Please upload at least one PDF document first.");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setInputValue("");
    setIsAnswering(true);

    try {
      const allChunks = getAllChunks();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content,
          allChunks,
          chatHistory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedHistory = [...newHistory, data.answer];
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory);
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

  const handleClearAll = () => {
    if (confirm("Clear all documents and chat history?")) {
      clearAllData();
      setDocuments([]);
      setChatHistory([]);
    }
  };

  const hasDocuments = documents.length > 0;
  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);

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
              {hasDocuments ? `${documents.length} document${documents.length > 1 ? "s" : ""} loaded` : "Search & Ask"}
            </h1>
          </div>
          {hasDocuments && (
            <button
              onClick={handleClearAll}
              className="rounded border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-ink-mute)] hover:bg-[var(--color-cream-soft)]"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {!hasDocuments ? (
            /* Welcome screen with upload */
            <div className="flex h-full flex-col items-center justify-center p-8">
              <div className="w-full max-w-2xl text-center">
                <h2
                  className="mb-2 text-2xl tracking-tight text-[var(--color-ink)]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 96',
                  }}
                >
                  Welcome, dev
                </h2>
                <p className="mb-8 text-sm text-[var(--color-ink-mute)]">Upload PDF documents to get started</p>

                {/* Drag-drop upload zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-[var(--color-line)] bg-white p-12 transition hover:border-[var(--color-govdoc-primary)] hover:bg-[var(--color-cream-soft)]"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-8 animate-spin rounded-full border-4 border-[var(--color-line)] border-t-[var(--color-govdoc-primary)]" />
                      <p className="text-sm text-[var(--color-ink-mute)]">Processing PDFs...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-4 size-12 text-[var(--color-ink-faint)]" />
                      <p className="mb-2 text-sm font-medium text-[var(--color-ink)]">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-[var(--color-ink-mute)]">PDF files, up to 200 pages each</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
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

        {/* Input area (only show when documents are loaded) */}
        {hasDocuments && (
          <div className="border-t border-[var(--color-line)] bg-[var(--color-paper)] p-5">
            <div className="mx-auto w-full max-w-3xl">
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex size-10 shrink-0 items-center justify-center rounded border border-[var(--color-line)] bg-white text-[var(--color-ink-mute)] hover:bg-[var(--color-cream-soft)]"
                  aria-label="Upload more files"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-govdoc-primary)]" />
                  ) : (
                    <Upload className="size-4" />
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

                <div className="relative flex-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about your documents..."
                    className="w-full resize-none rounded border border-[var(--color-line)] bg-white px-4 py-3 pr-12 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-faint)] focus:border-[var(--color-govdoc-primary)] focus:outline-none"
                    rows={2}
                    disabled={isAnswering}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isAnswering}
                    className="absolute bottom-3 right-3 flex size-6 items-center justify-center rounded bg-[var(--color-govdoc-primary)] text-white disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="size-3" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-[var(--color-ink-faint)]">
                Press Enter to send • Shift+Enter for new line • {totalChunks} chunks loaded
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
