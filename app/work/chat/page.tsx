"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ProcessedDocument } from "@/lib/document-service";
import type { ChatMessage } from "@/lib/chat-service";
import { FileText, Send, Paperclip, Plus, X, Square, RotateCcw, Copy, Check, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const USER_ID = "dev";

export default function SearchAskPage() {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [thinkingPhase, setThinkingPhase] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [docsRes, histRes] = await Promise.all([
          fetch(`/api/storage/load-documents?userId=${USER_ID}`),
          fetch(`/api/storage/load-history?userId=${USER_ID}`),
        ]);
        const docsData = await docsRes.json();
        const histData = await histRes.json();
        if (docsData.success) setDocuments(docsData.documents);
        if (histData.success) setChatHistory(histData.history);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

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
      Array.from(files).forEach((file) => formData.append("files", file));
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success) {
        const docsRes = await fetch(`/api/storage/load-documents?userId=${USER_ID}`);
        const docsData = await docsRes.json();
        if (docsData.success) setDocuments(docsData.documents);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isAnswering) return;
    if (documents.length === 0) {
      alert("Please upload at least one document first.");
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
    setThinkingPhase("Searching documents...");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setTimeout(() => { if (abortRef.current === controller) setThinkingPhase("Generating answer..."); }, 2000);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content, userId: USER_ID, chatHistory }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (data.success) {
        await fetch("/api/storage/save-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data.answer,
            userId: USER_ID,
            messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          }),
        });
        setChatHistory([...newHistory, data.answer]);
      } else {
        setChatHistory([...newHistory, { role: "assistant", content: `Error: ${data.error}`, timestamp: new Date().toISOString() }]);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setInputValue(userMessage.content);
        setChatHistory(chatHistory);
      } else {
        setChatHistory([...newHistory, { role: "assistant", content: "Failed to get answer. Please try again.", timestamp: new Date().toISOString() }]);
      }
    } finally {
      setIsAnswering(false);
      setThinkingPhase("");
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = async () => {
    if (chatHistory.length === 0) return;
    try {
      await fetch("/api/storage/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: USER_ID }),
      });
      setChatHistory([]);
      setDocuments([]);
    } catch {
      alert("Failed to start new chat.");
    }
  };

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRetry = useCallback(() => {
    const lastUserMsg = [...chatHistory].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    setChatHistory(chatHistory.filter((_, i) => i < chatHistory.length - 1));
    setInputValue(lastUserMsg.content);
  }, [chatHistory]);

  const handleCopy = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  const handleEditStart = useCallback((idx: number, content: string) => {
    setEditingIdx(idx);
    setEditValue(content);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingIdx(null);
    setEditValue("");
  }, []);

  const handleEditSubmit = useCallback((idx: number) => {
    if (!editValue.trim()) return;
    setChatHistory(chatHistory.slice(0, idx));
    setEditingIdx(null);
    setInputValue(editValue.trim());
    setEditValue("");
  }, [editValue, chatHistory]);

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#b04a2f]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors hover:border-[#d9b3a3]">
      {/* Sidebar */}
      <aside className="flex w-[256px] flex-col border-r border-gray-200 bg-white">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-medium text-gray-900 transition-colors hover:bg-gray-100"
          >
            <Plus className="size-3.5" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          <div className="px-3 pb-1.5 pt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Today
          </div>
          {chatHistory.length > 0 && (
            <div className="rounded-md bg-gray-100 px-3 py-2 text-[13px] font-medium text-gray-900">
              {chatHistory.find((m) => m.role === "user")?.content.slice(0, 32) ?? "Chat"}...
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50">
            <div className="flex size-7 items-center justify-center rounded-full bg-[#b04a2f] text-[11px] font-semibold text-white">
              D
            </div>
            <span className="text-[13px] font-medium text-gray-900">dev</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden bg-white">

        {chatHistory.length === 0 ? (
          /* Empty state — centered input */
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-gray-900">
              What can I help with?
            </h1>
            <p className="mb-8 text-[13px] text-gray-500">
              Upload documents and ask questions
            </p>

            {/* Suggestion chips */}
            <div className="mb-8 grid w-full max-w-[480px] grid-cols-2 gap-2">
              {[
                "Summarize the key findings",
                "What are the payment terms?",
                "Compare compliance requirements",
                "List all action items",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputValue(suggestion)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-[12px] leading-relaxed text-gray-500 transition-all hover:-translate-y-0.5 hover:text-gray-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="w-full max-w-[680px]">
              {documents.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {documents.map((doc) => (
                    <div key={doc.id} className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px]">
                      <span className="flex size-[18px] items-center justify-center rounded-[3px] bg-red-600 text-[8px] font-bold text-white">PDF</span>
                      <span className="font-medium text-gray-900">{doc.name}</span>
                      <span className="text-[11px] text-gray-400">· {doc.pageCount}p</span>
                      <button onClick={() => removeDocument(doc.id)} className="ml-0.5 flex size-4 items-center justify-center rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-900 group-hover:opacity-100">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <InputBox
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleKeyDown={handleKeyDown}
                handleSendMessage={handleSendMessage}
                handleFileUpload={handleFileUpload}
                isUploading={isUploading}
                isAnswering={isAnswering}
                onStop={handleStop}
                fileInputRef={fileInputRef}
                textareaRef={textareaRef}
              />
            </div>
          </div>
        ) : (
          /* Conversation active */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6 px-4 py-8">
                {chatHistory.map((msg, i) =>
                  msg.role === "user" ? (
                    <div key={i} className="group flex justify-end gap-2">
                      {editingIdx === i ? (
                        <div className="flex w-full max-w-[min(80%,56ch)] flex-col gap-2">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full resize-none rounded-2xl border border-[#b04a2f] bg-white px-4 py-2.5 text-[13px] leading-[1.65] text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#b04a2f]"
                            rows={3}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(i); } if (e.key === "Escape") handleEditCancel(); }}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button onClick={handleEditCancel} className="rounded-md px-2.5 py-1 text-[11px] text-gray-500 hover:bg-gray-100">Cancel</button>
                            <button onClick={() => handleEditSubmit(i)} className="rounded-md bg-[#b04a2f] px-2.5 py-1 text-[11px] text-white hover:bg-[#8a3820]">Send</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditStart(i, msg.content)}
                            className="flex size-6 shrink-0 items-center justify-center self-center rounded-md text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                            title="Edit message"
                          >
                            <Pencil className="size-3" />
                          </button>
                          <div className="max-w-[min(80%,56ch)] rounded-2xl rounded-br-sm border border-gray-200 bg-white px-4 py-2.5 text-[13px] leading-[1.65] text-gray-900">
                            {msg.content}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div key={i} className="group flex items-start gap-3">
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-[#b04a2f]">
                        <FileText className="size-3.5 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 text-[13px] leading-[1.65] text-gray-900">
                        <div className="prose prose-sm prose-gray max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:mb-1 prose-headings:mt-3 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px] prose-pre:rounded-lg prose-pre:bg-gray-50">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {msg.sources.map((source, si) => (
                              <span key={si} className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-400">
                                <FileText className="size-2.5" />
                                {source.documentName} · p.{source.chunkIndex + 1} · {(source.score * 100).toFixed(0)}%
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Action buttons */}
                        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleCopy(msg.content, i)}
                            className="flex size-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Copy"
                          >
                            {copiedIdx === i ? <Check className="size-3" /> : <Copy className="size-3" />}
                          </button>
                          {i === chatHistory.length - 1 && (
                            <button
                              onClick={handleRetry}
                              className="flex size-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              title="Retry"
                            >
                              <RotateCcw className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {isAnswering && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-[#b04a2f]">
                      <FileText className="size-3.5 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="size-1.5 animate-pulse rounded-full bg-[#b04a2f]" />
                          <div className="size-1.5 animate-pulse rounded-full bg-[#b04a2f] [animation-delay:150ms]" />
                          <div className="size-1.5 animate-pulse rounded-full bg-[#b04a2f] [animation-delay:300ms]" />
                        </div>
                        <span className="text-[12px] text-gray-500">{thinkingPhase}</span>
                      </div>
                      <button
                        onClick={handleStop}
                        className="flex w-fit items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                      >
                        <Square className="size-2.5" fill="currentColor" />
                        Stop
                      </button>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Bottom input */}
            <div className="border-t border-gray-200 bg-white px-4 py-3">
              <div className="mx-auto w-full max-w-[680px]">
                {documents.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {documents.map((doc) => (
                      <div key={doc.id} className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px]">
                        <span className="flex size-[18px] items-center justify-center rounded-[3px] bg-red-600 text-[8px] font-bold text-white">PDF</span>
                        <span className="font-medium text-gray-900">{doc.name}</span>
                        <span className="text-[11px] text-gray-500">· {doc.pageCount}p</span>
                        <button onClick={() => removeDocument(doc.id)} className="ml-0.5 flex size-4 items-center justify-center rounded-full text-gray-500 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-900 group-hover:opacity-100">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <InputBox
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  handleKeyDown={handleKeyDown}
                  handleSendMessage={handleSendMessage}
                  handleFileUpload={handleFileUpload}
                  isUploading={isUploading}
                  isAnswering={isAnswering}
                  onStop={handleStop}
                  fileInputRef={fileInputRef}
                  textareaRef={textareaRef}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function InputBox({
  inputValue,
  setInputValue,
  handleKeyDown,
  handleSendMessage,
  handleFileUpload,
  isUploading,
  isAnswering,
  onStop,
  fileInputRef,
  textareaRef,
}: {
  inputValue: string;
  setInputValue: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: () => void;
  handleFileUpload: (files: FileList | null) => void;
  isUploading: boolean;
  isAnswering: boolean;
  onStop: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all focus-within:border-[#b04a2f] focus-within:shadow-[0_0_0_1px_rgba(176,74,47,0.12)]">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-transparent text-gray-400 transition-colors hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
        title="Attach PDF or DOCX"
      >
        {isUploading ? (
          <div className="size-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#b04a2f]" />
        ) : (
          <Paperclip className="size-4" />
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent py-0.5 text-[13px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none"
        rows={1}
        disabled={isAnswering}
      />

      {isAnswering ? (
        <button
          onClick={onStop}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white transition-colors hover:bg-gray-700"
          title="Stop generating"
        >
          <Square className="size-3" fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#b04a2f] text-white transition-colors hover:bg-[#8a3820] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <Send className="size-3.5" />
        </button>
      )}
    </div>
  );
}
