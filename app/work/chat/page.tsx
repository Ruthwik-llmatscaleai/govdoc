"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UploadedDocument } from "@/lib/document-service";
import type { ChatMessage, Citation } from "@/lib/chat-service";
import { FileText, Send, Paperclip, Plus, X, Square, RotateCcw, Copy, Check, ArrowLeft, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const USER_ID = "dev";

interface ConversationEntry {
  id: string;
  firstMessage: string;
  timestamp: string;
  messages: ChatMessage[];
  documents: Array<{ id: string; fileId: string; name: string; sizeBytes: number; uploadedAt: string }>;
}

function loadPastConversations(): ConversationEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("govdoc_conversations");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePastConversations(conversations: ConversationEntry[]) {
  localStorage.setItem("govdoc_conversations", JSON.stringify(conversations));
}

export default function ChatPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [pastConversations, setPastConversations] = useState<ConversationEntry[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [thinkingPhase, setThinkingPhase] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const conversationIdRef = useRef<string>(Date.now().toString(36));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("govdoc_chat_session");
    if (saved) {
      try {
        const { messages, docs, convId } = JSON.parse(saved);
        if (Array.isArray(messages)) setChatHistory(messages);
        if (Array.isArray(docs)) setDocuments(docs);
        if (convId) conversationIdRef.current = convId;
      } catch { /* ignore */ }
    }
    setPastConversations(loadPastConversations());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0 || documents.length > 0) {
      sessionStorage.setItem("govdoc_chat_session", JSON.stringify({
        messages: chatHistory,
        docs: documents,
        convId: conversationIdRef.current,
      }));
      // Update the conversation in localStorage
      const convId = conversationIdRef.current;
      setPastConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx]!, messages: chatHistory, documents };
          savePastConversations(updated);
          return updated;
        }
        return prev;
      });
    }
  }, [chatHistory, documents]);

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
        const newDocs = data.documents.map((d: { fileId: string; name: string; sizeBytes: number }) => ({
          id: d.fileId,
          fileId: d.fileId,
          name: d.name,
          sizeBytes: d.sizeBytes,
          uploadedAt: new Date().toISOString(),
        }));
        setDocuments((prev) => [...prev, ...newDocs]);
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

    if (chatHistory.filter((m) => m.role === "user").length === 0) {
      const entry: ConversationEntry = {
        id: conversationIdRef.current,
        firstMessage: userMessage.content,
        timestamp: userMessage.timestamp,
        messages: [userMessage],
        documents: documents,
      };
      const updated = [entry, ...pastConversations];
      setPastConversations(updated);
      savePastConversations(updated);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setTimeout(() => { if (abortRef.current === controller) setThinkingPhase("Generating answer..."); }, 2000);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content,
          userId: USER_ID,
          chatHistory,
          fileIds: documents.map((d) => ({ fileId: d.fileId, fileName: d.name })),
        }),
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

  const handleNewChat = () => {
    if (chatHistory.length === 0) return;
    setChatHistory([]);
    setDocuments([]);
    conversationIdRef.current = Date.now().toString(36);
    sessionStorage.removeItem("govdoc_chat_session");
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

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const userMessages = pastConversations;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf8f5]">
        <div className="size-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#b04a2f]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-[#faf8f5]">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-gray-200/60 bg-[#f9f8f3] transition-all duration-200 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/60 px-3">
          <span className="text-sm font-semibold text-gray-900">Chat History</span>
          <button
            onClick={handleNewChat}
            disabled={chatHistory.length === 0}
            className="flex size-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200/60 hover:text-gray-900 disabled:opacity-40"
            title="New chat"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {userMessages.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-gray-400">No conversations yet</div>
          ) : (
            <>
              <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Recent</div>
              {userMessages.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setChatHistory(conv.messages || []);
                    setDocuments(conv.documents || []);
                    conversationIdRef.current = conv.id;
                    sessionStorage.setItem("govdoc_chat_session", JSON.stringify({
                      messages: conv.messages || [],
                      docs: conv.documents || [],
                      convId: conv.id,
                    }));
                  }}
                  className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                    conversationIdRef.current === conv.id ? "bg-gray-200/70 text-gray-900" : "text-gray-700 hover:bg-gray-200/50"
                  }`}
                >
                  <MessageSquare className="size-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{conv.firstMessage.slice(0, 36)}{conv.firstMessage.length > 36 ? "..." : ""}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="border-t border-gray-200/60 p-3">
          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-200/50 hover:text-gray-900"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/60 bg-white/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h1 className="text-sm font-semibold text-gray-900">Document Chat</h1>
          </div>

          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                <FileText className="size-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">{documents.length} doc{documents.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </header>

        {/* Chat area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {chatHistory.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4">
              <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-[#b04a2f]/10">
                <FileText className="size-6 text-[#b04a2f]" />
              </div>
              <h2 className="mb-1 text-xl font-semibold tracking-tight text-gray-900">Ask your documents</h2>
              <p className="mb-10 text-sm text-gray-500">Upload files and ask questions about their content</p>

              <div className="mb-8 grid w-full max-w-md grid-cols-2 gap-2.5">
                {[
                  "Summarize the key findings",
                  "What are the payment terms?",
                  "Compare compliance requirements",
                  "List all action items",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left text-[13px] leading-snug text-gray-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:text-gray-900 hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="w-full max-w-2xl">
                {documents.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {documents.map((doc) => (
                      <DocChip key={doc.id} doc={doc} onRemove={removeDocument} />
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
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
                  {chatHistory.map((msg, i) =>
                    msg.role === "user" ? (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[75%] rounded-2xl rounded-br-md border border-gray-200 bg-white px-4 py-2.5 text-[13.5px] leading-[1.6] text-gray-900">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="group flex items-start gap-3">
                        <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                          <FileText className="size-3.5 text-gray-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 text-[13.5px] leading-[1.7] text-gray-800">
                          <div className="prose prose-sm prose-gray max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mb-1.5 prose-headings:mt-4 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[12px] prose-pre:rounded-xl prose-pre:bg-gray-900 prose-pre:text-gray-100">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.citations && msg.citations.length > 0 && (
                            <CitationsCollapsible citations={msg.citations} />
                          )}
                          {!msg.citations && msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {msg.sources.map((source, si) => (
                                <span key={si} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                                  <FileText className="size-2.5" />
                                  {source.documentName}
                                </span>
                              ))}
                            </div>
                          )}
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
                      <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <FileText className="size-3.5 text-gray-500" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-2.5 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <div className="size-1.5 animate-pulse rounded-full bg-[#b04a2f]" />
                            <div className="size-1.5 animate-pulse rounded-full bg-[#b04a2f] [animation-delay:150ms]" />
                            <div className="size-1.5 animate-pulse rounded-full bg-[#b04a2f] [animation-delay:300ms]" />
                          </div>
                          <span className="text-xs text-gray-400">{thinkingPhase}</span>
                        </div>
                        <button
                          onClick={handleStop}
                          className="flex w-fit items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
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

              <div className="border-t border-gray-200/60 bg-white/80 px-4 py-3 backdrop-blur-sm">
                <div className="mx-auto w-full max-w-3xl">
                  {documents.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      {documents.map((doc) => (
                        <DocChip key={doc.id} doc={doc} onRemove={removeDocument} compact />
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
    </div>
  );
}

function CitationsCollapsible({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
      >
        <FileText className="size-2.5" />
        {citations.length} citation{citations.length > 1 ? "s" : ""}
        <svg className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {citations.map((cite, ci) => (
            <div key={ci} className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
              <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                <FileText className="size-2.5" />
                {cite.documentName}
              </div>
              <p className="text-[12px] leading-relaxed text-gray-600 italic">
                &ldquo;{cite.citedText.length > 200 ? cite.citedText.slice(0, 200) + "..." : cite.citedText}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocChip({ doc, onRemove, compact }: { doc: UploadedDocument; onRemove: (id: string) => void; compact?: boolean }) {
  const isPdf = doc.name.toLowerCase().endsWith(".pdf");
  if (compact) {
    return (
      <div className="group flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px]">
        <span className={`flex size-4 items-center justify-center rounded text-[7px] font-bold text-white ${isPdf ? "bg-red-500" : "bg-blue-500"}`}>
          {isPdf ? "P" : "D"}
        </span>
        <span className="font-medium text-gray-700">{doc.name.length > 20 ? doc.name.slice(0, 18) + "..." : doc.name}</span>
        <button onClick={() => onRemove(doc.id)} className="ml-0.5 text-gray-400 opacity-0 transition-opacity hover:text-gray-700 group-hover:opacity-100">
          <X className="size-3" />
        </button>
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm">
      <span className={`flex size-7 items-center justify-center rounded-lg ${isPdf ? "bg-red-500" : "bg-blue-500"} text-[9px] font-bold text-white`}>
        {isPdf ? "PDF" : "DOC"}
      </span>
      <div className="flex flex-col">
        <span className="text-[13px] font-medium text-gray-900">{doc.name}</span>
        <span className="text-[11px] text-gray-400">{Math.round(doc.sizeBytes / 1024)} KB</span>
      </div>
      <button onClick={() => onRemove(doc.id)} className="ml-2 flex size-5 items-center justify-center rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100">
        <X className="size-3.5" />
      </button>
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
    <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-[#b04a2f]/40 focus-within:shadow-[0_0_0_3px_rgba(176,74,47,0.06)]">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        title="Attach PDF or DOCX"
      >
        {isUploading ? (
          <div className="size-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#b04a2f]" />
        ) : (
          <Paperclip className="size-[18px]" />
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.csv"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about your documents..."
        className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-[14px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none"
        rows={1}
        disabled={isAnswering}
      />

      {isAnswering ? (
        <button
          onClick={onStop}
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#b04a2f] text-white transition-colors hover:bg-[#8a3820]"
          title="Stop generating"
        >
          <Square className="size-3.5" fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#b04a2f] text-white transition-colors hover:bg-[#8a3820] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <Send className="size-4" />
        </button>
      )}
    </div>
  );
}
