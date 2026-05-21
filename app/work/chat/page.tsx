"use client";

import { useState, useEffect, useRef } from "react";
import type { ProcessedDocument } from "@/lib/document-service";
import type { ChatMessage } from "@/lib/chat-service";
import { FileText, Menu, X, Send, Paperclip, Trash2 } from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load data from BigQuery on mount
  useEffect(() => {
    async function loadData() {
      try {
        const docsResponse = await fetch(`/api/storage/load-documents?userId=${USER_ID}`);
        const docsData = await docsResponse.json();
        if (docsData.success) {
          setDocuments(docsData.documents);
        }

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputValue]);

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
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-gray-200 border-t-amber-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div
        className={`flex flex-col border-r border-gray-200 bg-white transition-all ${
          sidebarOpen ? "w-[260px]" : "w-0"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-3">
          <h2 className="text-sm font-medium text-gray-900">Documents</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Documents list */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {documents.length === 0 ? (
            <p className="text-xs text-gray-400">No documents yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 hover:bg-gray-100"
                >
                  <div className="mb-1 flex items-start gap-2">
                    <FileText className="size-4 shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <div className="break-words text-xs font-medium text-gray-900">{doc.name}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {doc.pageCount} pages • {doc.chunks.length} chunks
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear button */}
        {documents.length > 0 && (
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={handleClearAll}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Trash2 className="size-3.5" />
              Clear All
            </button>
          </div>
        )}

        {/* User info */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-semibold text-white">
              D
            </div>
            <span className="text-sm font-medium text-gray-700">dev</span>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center border-b border-gray-200 bg-white px-4 py-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-3 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </button>
          )}
          <h1 className="text-sm font-medium text-gray-600">
            {documents.length > 0 ? `${documents.length} document${documents.length > 1 ? "s" : ""} • ${totalChunks} chunks` : "Search & Ask"}
          </h1>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {chatHistory.length === 0 ? (
            /* Welcome screen */
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="w-full max-w-2xl text-center">
                <div className="mb-8 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-bold text-white mx-auto shadow-lg">
                  AI
                </div>
                <h2 className="mb-4 text-3xl font-normal text-gray-900">
                  How can I help you today?
                </h2>
                <p className="mb-8 text-base text-gray-500">
                  Upload PDFs using the paperclip icon below and ask questions about your documents
                </p>

                {documents.length > 0 && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    <div className="size-2 rounded-full bg-green-500"></div>
                    {documents.length} document{documents.length > 1 ? "s" : ""} ready
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Chat messages */
            <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
              {chatHistory.map((msg, index) => (
                <div key={index} className="flex gap-4">
                  {/* Avatar */}
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                      msg.role === "user"
                        ? "bg-gray-700"
                        : "bg-gradient-to-br from-amber-400 to-orange-500"
                    }`}
                  >
                    {msg.role === "user" ? "D" : "AI"}
                  </div>

                  {/* Message content */}
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="mb-2 text-sm font-semibold text-gray-900">
                      {msg.role === "user" ? "You" : "Assistant"}
                    </div>
                    <div className="whitespace-pre-wrap text-[15px] leading-7 text-gray-800">
                      {msg.content}
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sources</div>
                        {msg.sources.map((source, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-900">
                                {source.documentName} · Chunk {source.chunkIndex + 1}
                              </span>
                              <span className="text-xs text-gray-500">
                                {(source.score * 100).toFixed(0)}% match
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">{source.excerpt}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAnswering && (
                <div className="flex gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-semibold text-white">
                    AI
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="mb-2 text-sm font-semibold text-gray-900">Assistant</div>
                    <div className="flex items-center gap-2 text-[15px] text-gray-400">
                      <div className="size-1.5 animate-pulse rounded-full bg-gray-400"></div>
                      <div className="size-1.5 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: "0.2s" }}></div>
                      <div className="size-1.5 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="mx-auto w-full max-w-3xl">
            <div className="relative flex items-end gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 shadow-sm focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
              {/* Paperclip button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Attach files"
                disabled={isUploading}
                title="Upload PDF documents"
              >
                {isUploading ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-amber-600" />
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
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
                rows={1}
                disabled={isAnswering}
              />

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isAnswering}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white transition hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">
              {documents.length > 0
                ? `${totalChunks} chunks loaded`
                : "Upload documents using the paperclip icon to get started"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
