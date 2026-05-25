"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ProcessedDocument } from "@/lib/document-service";
import type { ChatMessage } from "@/lib/chat-service";
import { FileText, Send, Paperclip, Plus, X, Square, RotateCcw, Copy, Check, Pencil, Search, Settings, FolderOpen, Mic, FileUp, ThumbsUp, Share2, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const USER_ID = "dev";
const USER_NAME = "JOTHI";

/** Group messages by relative date */
function groupByDate(messages: ChatMessage[]): { label: string; messages: ChatMessage[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekStart = new Date(today.getTime() - today.getDay() * 86400000);

  const groups: { label: string; messages: ChatMessage[] }[] = [];
  const todayMsgs: ChatMessage[] = [];
  const yesterdayMsgs: ChatMessage[] = [];
  const earlierMsgs: ChatMessage[] = [];

  messages.forEach((msg) => {
    const d = new Date(msg.timestamp);
    if (d >= today) todayMsgs.push(msg);
    else if (d >= yesterday) yesterdayMsgs.push(msg);
    else if (d >= weekStart) earlierMsgs.push(msg);
    else earlierMsgs.push(msg);
  });

  if (todayMsgs.length) groups.push({ label: "TODAY", messages: todayMsgs });
  if (yesterdayMsgs.length) groups.push({ label: "YESTERDAY", messages: yesterdayMsgs });
  if (earlierMsgs.length) groups.push({ label: "EARLIER THIS WEEK", messages: earlierMsgs });

  return groups;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

/** Formats text inside obligations card (bolds action verbs, italicizes durations like 'no less than 7 years') */
function formatObligationText(text: string): React.ReactNode {
  const durationPattern = /(no less than \d+ years|no less than \w+ years)/gi;
  const actionWordsPattern = /\b(retain|maintaining|maintain|preserves|preserve|documenting|document|submitting|submit|publishing|publish|reporting|report|notifying|notify|reviewing|review|auditing|audit|verifying|verify|complying|comply|store|storing|keep|keeping|disclose|disclosing|provide|providing|assess|assessing|evaluation|evaluating|evaluate|implement|implementing|monitoring|monitor|shall|must)\b/gi;

  const parts = text.split(durationPattern);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <em key={i} className="font-serif italic font-medium text-[var(--color-ink)]">
          {part}
        </em>
      );
    }
    const subParts = part.split(actionWordsPattern);
    return (
      <span key={i}>
        {subParts.map((subPart, j) => {
          if (j % 2 === 1) {
            return (
              <strong key={j} className="font-semibold text-[var(--color-ink)]">
                {subPart}
              </strong>
            );
          }
          return subPart;
        })}
      </span>
    );
  });
}

/** Detect numbered list items in assistant content and render as structured card */
function extractKeyObligations(content: string): { intro: string; title: string; items: { num: string; text: string }[]; outro: string } | null {
  const lines = content.split("\n");
  const numberedPattern = /^\s*(\d+)[.)]\s+(.+)/;
  const items: { num: string; text: string }[] = [];
  let firstIdx = -1;
  let lastIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(numberedPattern);
    if (match) {
      if (firstIdx === -1) firstIdx = i;
      lastIdx = i;
      items.push({ num: match[1]!.padStart(2, "0"), text: match[2]!.trim() });
    }
  }

  if (items.length < 2) return null;

  // Find a heading-like line before the list
  let title = "KEY OBLIGATIONS";
  for (let i = firstIdx - 1; i >= Math.max(0, firstIdx - 3); i--) {
    const line = lines[i]!.trim();
    if (line && (line.includes("obligation") || line.includes("Obligation") || line.includes("KEY") || line.toUpperCase() === line) && line.length < 80) {
      title = line.replace(/^[#*\-_]+/, "").trim().toUpperCase();
      break;
    }
  }

  const intro = lines.slice(0, firstIdx).filter((l) => l.trim()).join("\n");
  const outro = lines.slice(lastIdx + 1).filter((l) => l.trim()).join("\n");

  return { intro, title: `${title} · ${items.length} FOUND`, items, outro };
}

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
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [responseTimes, setResponseTimes] = useState<Record<number, number>>({});
  const [sendTimestamp, setSendTimestamp] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [selectedModel, setSelectedModel] = useState("Claude Opus");
  const [citationsEnabled, setCitationsEnabled] = useState(true);

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
    setSendTimestamp(Date.now());

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
        const elapsed = sendTimestamp ? (Date.now() - (sendTimestamp || Date.now())) / 1000 : 0;
        const answerIdx = newHistory.length;
        setResponseTimes((prev) => ({ ...prev, [answerIdx]: elapsed }));

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
      setSendTimestamp(null);
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
      setResponseTimes({});
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

  const handleQuickAction = (action: string) => {
    setInputValue(action + " ");
    textareaRef.current?.focus();
  };

  const userMessages = chatHistory.filter((m) => m.role === "user");
  const filteredUserMessages = sidebarSearch
    ? userMessages.filter((m) => m.content.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : userMessages;
  const groupedHistory = groupByDate(filteredUserMessages);

  const sessionTitle = chatHistory.length > 0
    ? (chatHistory.find((m) => m.role === "user")?.content.slice(0, 40) || "Chat Session")
    : "New Session";

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-paper)]">
        <div className="size-8 animate-spin rounded-full border-[3px] border-[var(--color-line)] border-t-[var(--color-govdoc-primary)]" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--color-paper)] transition-colors">
      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="flex w-[220px] flex-col border-r border-[var(--color-line)] bg-[var(--color-cream)]">
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-[var(--color-govdoc-primary)] text-white">
              <Search className="size-3" />
            </div>
            <span className="text-[14px] font-semibold text-[var(--color-ink)]">Search & Ask</span>
          </div>
          <button className="flex size-6 items-center justify-center rounded text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-line)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="p-3">
          {/* New chat button */}
          <button
            onClick={handleNewChat}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper)]"
          >
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Plus className="size-3" />
            </div>
            New chat
          </button>

          {/* Projects link */}
          <div className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper)]">
            <div className="flex items-center gap-2">
              <FolderOpen className="size-4 text-[var(--color-ink-mute)]" />
              <span>Projects</span>
            </div>
            <span className="flex size-5 items-center justify-center rounded-full bg-[var(--color-line)] font-mono text-[10px] font-semibold text-[var(--color-ink-mute)]">
              {documents.length}
            </span>
          </div>

          {/* Search input */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] py-2 pl-8 pr-10 text-[12px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-govdoc-primary)] focus:outline-none"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[var(--color-line)] bg-[var(--color-cream)] px-1 font-mono text-[9px] text-[var(--color-ink-faint)]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Chat history grouped by date */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {groupedHistory.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1.5 pt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
                {group.label}
              </div>
              {group.messages.map((msg, i) => (
                <div
                  key={`${group.label}-${i}`}
                  className={`mb-0.5 cursor-pointer rounded-md px-3 py-2 transition-colors ${
                    i === 0 && group.label === "TODAY"
                      ? "bg-[var(--color-cream-soft)]"
                      : "hover:bg-[var(--color-paper)]"
                  }`}
                >
                  <div className="truncate text-[13px] text-[var(--color-ink-soft)]">
                    {msg.content.slice(0, 32)}{msg.content.length > 32 ? "..." : ""}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-[var(--color-ink-faint)]">
                    {timeAgo(msg.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {groupedHistory.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] text-[var(--color-ink-faint)]">
              No chat history
            </div>
          )}
        </div>

        {/* Bottom: Settings */}
        <div className="border-t border-[var(--color-line)] p-3">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]">
            <Settings className="size-4" />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CHAT AREA ─── */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--color-paper)]">
        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(10,10,10,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between border-b border-[var(--color-line)] px-5 py-2.5 bg-[var(--color-paper)]">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--color-ink-mute)]">
              02 · Search & Ask
            </span>
            <span className="text-[13px] font-medium text-[var(--color-ink)]">
              {sessionTitle}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-[#e8c4b9] bg-[#faf4f1]/60 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#b04a2f]">
              <span className={`size-1.5 rounded-full bg-[#b04a2f] ${isAnswering ? "animate-pulse" : ""}`} />
              Session Active
            </span>
            <button className="flex size-6 items-center justify-center rounded text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]" title="Share">
              <Share2 className="size-3.5" />
            </button>
            <button className="flex size-6 items-center justify-center rounded text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]" title="Download">
              <Download className="size-3.5" />
            </button>
          </div>
        </div>

        {chatHistory.length === 0 ? (
          /* ─── EMPTY STATE ─── */
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
              What can I help with?
            </h1>
            <p className="mb-8 text-[13px] text-[var(--color-ink-mute)]">
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
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-cream-soft)]/50 px-5 py-4 text-left text-[13px] leading-relaxed text-[var(--color-ink-soft)] transition-all hover:border-[var(--color-govdoc-primary)] hover:bg-[var(--color-paper)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="w-full max-w-[680px]">
              {documents.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {documents.map((doc) => {
                    const isPdf = doc.name.toLowerCase().endsWith(".pdf");
                    return (
                      <div key={doc.id} className="group flex items-center gap-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm">
                        <span className={`flex size-6 items-center justify-center rounded ${isPdf ? "bg-red-600" : "bg-blue-600"} text-[9px] font-bold text-white`}>{isPdf ? "PDF" : "DOC"}</span>
                        <span className="font-medium text-[var(--color-ink)]">{doc.name}</span>
                        <span className="text-xs text-[var(--color-ink-faint)]">· {doc.pageCount}p</span>
                        <button onClick={() => removeDocument(doc.id)} className="ml-1 flex size-5 items-center justify-center rounded-full text-[var(--color-ink-faint)] opacity-0 transition-opacity hover:bg-[var(--color-line)] hover:text-[var(--color-ink)] group-hover:opacity-100">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
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
                onQuickAction={handleQuickAction}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                citationsEnabled={citationsEnabled}
                setCitationsEnabled={setCitationsEnabled}
              />
            </div>
          </div>
        ) : (
          /* ─── CONVERSATION ACTIVE ─── */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-4 py-8">
                {chatHistory.map((msg, i) =>
                  msg.role === "user" ? (
                    /* ─── USER MESSAGE ─── */
                    <div key={i} className="group flex items-start gap-3 justify-end">
                      <div className="flex flex-col items-end">
                        {/* Name + time */}
                        <div className="mb-1.5 flex items-center gap-2 pr-1">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-mute)]">
                            {USER_NAME}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">
                            · {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        {editingIdx === i ? (
                          <div className="flex w-full max-w-[min(80%,56ch)] flex-col gap-2">
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full resize-none rounded-2xl border border-[var(--color-govdoc-primary)] bg-[var(--color-paper)] px-4 py-2.5 text-[13px] leading-[1.65] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-govdoc-primary)]"
                              rows={3}
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(i); } if (e.key === "Escape") handleEditCancel(); }}
                            />
                            <div className="flex justify-end gap-1.5">
                              <button onClick={handleEditCancel} className="rounded-md px-2.5 py-1 text-[11px] text-[var(--color-ink-mute)] hover:bg-[var(--color-cream)]">Cancel</button>
                              <button onClick={() => handleEditSubmit(i)} className="rounded-md bg-[var(--color-govdoc-primary)] px-2.5 py-1 text-[11px] text-white hover:bg-[var(--color-govdoc-deep)]">Send</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => handleEditStart(i, msg.content)}
                              className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-md text-[var(--color-ink-faint)] opacity-0 transition-opacity hover:bg-[var(--color-cream)] hover:text-[var(--color-ink-mute)] group-hover:opacity-100"
                              title="Edit message"
                            >
                              <Pencil className="size-3" />
                            </button>
                            <div className="max-w-[min(80%,56ch)] rounded-2xl rounded-br-sm bg-[#0a0a0a] px-5 py-3 text-[13px] leading-[1.7] text-white">
                              {msg.content}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Black User avatar */}
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] font-mono text-[11px] font-bold text-white">
                        {USER_NAME[0]?.toUpperCase() ?? "J"}
                      </div>
                    </div>
                  ) : (
                    /* ─── ASSISTANT MESSAGE ─── */
                    <div key={i} className="group flex items-start gap-3">
                      {/* Green G avatar */}
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#107e54] font-mono text-[11px] font-bold text-white">
                        G
                      </div>
                      <div className="flex-1 text-[13px] leading-[1.7] text-[var(--color-ink)]">
                        {/* Assistant header: name + time + response time */}
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-mute)]">GovDoc</span>
                          <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">· {formatTime(msg.timestamp)}</span>
                          {responseTimes[i] != null && (
                            <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">
                              · Answered in {responseTimes[i].toFixed(1)}s
                            </span>
                          )}
                          {isAnswering && i === chatHistory.length - 1 && (
                            <span className="font-mono text-[10px] text-emerald-600">· Streaming</span>
                          )}
                        </div>

                        {/* Content: try structured format first */}
                        {(() => {
                          const structured = extractKeyObligations(msg.content);
                          if (structured) {
                            return (
                              <div>
                                {/* Intro text with inline citations */}
                                {structured.intro && (
                                  <div className="mb-4">
                                    <ContentWithCitations content={structured.intro} sources={msg.sources} />
                                  </div>
                                )}
                                {/* Key obligations card */}
                                <div className="mb-4 rounded-r-lg border border-[var(--color-line)] border-l-4 border-l-[#b04a2f] bg-[var(--color-cream-soft)] p-4">
                                  <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#b04a2f]">
                                    ━━━ {structured.title}
                                  </div>
                                  <div className="space-y-2.5">
                                    {structured.items.map((item, idx) => (
                                      <div key={idx} className="flex gap-3">
                                        <span className="shrink-0 font-mono text-[12px] font-bold text-[#b04a2f]">{item.num}</span>
                                        <span className="text-[13px] leading-[1.65] text-[var(--color-ink)]">{formatObligationText(item.text)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Outro text */}
                                {structured.outro && (
                                  <div>
                                    <ContentWithCitations content={structured.outro} sources={msg.sources} />
                                  </div>
                                )}
                              </div>
                            );
                          }
                          // Fallback: markdown rendering
                          return (
                            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:mb-1 prose-headings:mt-3 prose-headings:text-[var(--color-ink)] prose-code:rounded prose-code:bg-[var(--color-cream)] prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px] prose-pre:rounded-lg prose-pre:bg-[var(--color-cream)]">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>
                          );
                        })()}

                        {/* Citation pills */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {msg.sources.map((source, si) => (
                              <span key={si} className="inline-flex items-center gap-1 rounded-full bg-emerald-800/90 px-2.5 py-0.5 text-[10px] font-medium text-white">
                                <FileText className="size-2.5" />
                                {source.documentName} · p.{source.chunkIndex + 1}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons + source count */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleCopy(msg.content, i)}
                              className="flex size-6 items-center justify-center rounded-md text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink-mute)]"
                              title="Copy"
                            >
                              {copiedIdx === i ? <Check className="size-3" /> : <Copy className="size-3" />}
                            </button>
                            {i === chatHistory.length - 1 && (
                              <button
                                onClick={handleRetry}
                                className="flex size-6 items-center justify-center rounded-md text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink-mute)]"
                                title="Retry"
                              >
                                <RotateCcw className="size-3" />
                              </button>
                            )}
                            <button
                              className="flex size-6 items-center justify-center rounded-md text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink-mute)]"
                              title="Helpful"
                            >
                              <ThumbsUp className="size-3" />
                            </button>
                          </div>
                          {msg.sources && msg.sources.length > 0 && (
                            <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">
                              {msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""} cited · audit-logged
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {/* Streaming indicator */}
                {isAnswering && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#107e54] font-mono text-[11px] font-bold text-white">
                      G
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-mute)]">GovDoc</span>
                        <span className="font-mono text-[10px] text-emerald-600">· Streaming</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="size-1.5 animate-pulse rounded-full bg-emerald-600" />
                          <div className="size-1.5 animate-pulse rounded-full bg-emerald-600 [animation-delay:150ms]" />
                          <div className="size-1.5 animate-pulse rounded-full bg-emerald-600 [animation-delay:300ms]" />
                        </div>
                        <span className="text-[12px] text-[var(--color-ink-mute)]">{thinkingPhase}</span>
                      </div>
                      <button
                        onClick={handleStop}
                        className="flex w-fit items-center gap-1.5 rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] text-[var(--color-ink-mute)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)]"
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

            {/* ─── BOTTOM INPUT AREA ─── */}
            <div className="border-t border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3">
              <div className="mx-auto w-full max-w-[760px]">
                {documents.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {documents.map((doc) => {
                      const isPdf = doc.name.toLowerCase().endsWith(".pdf");
                      return (
                        <div key={doc.id} className="group flex items-center gap-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm">
                          <span className={`flex size-6 items-center justify-center rounded ${isPdf ? "bg-red-600" : "bg-blue-600"} text-[9px] font-bold text-white`}>{isPdf ? "PDF" : "DOC"}</span>
                          <span className="font-medium text-[var(--color-ink)]">{doc.name}</span>
                          <span className="text-xs text-[var(--color-ink-faint)]">· {doc.pageCount}p</span>
                          <button onClick={() => removeDocument(doc.id)} className="ml-1 flex size-5 items-center justify-center rounded-full text-[var(--color-ink-faint)] opacity-0 transition-opacity hover:bg-[var(--color-line)] hover:text-[var(--color-ink)] group-hover:opacity-100">
                            <X className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
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
                  onQuickAction={handleQuickAction}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  citationsEnabled={citationsEnabled}
                  setCitationsEnabled={setCitationsEnabled}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/** Renders text content with inline citation references as green pills */
function ContentWithCitations({ content }: { content: string; sources?: ChatMessage["sources"] }) {
  // Look for citation patterns like [Gov §11130] or [CCR §15.04]
  const citationPattern = /\[([^\]]+)\]/g;
  const parts: (string | { citation: string })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push({ citation: match[1]! });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  if (parts.length === 0) {
    return <span>{content}</span>;
  }

  return (
    <span>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <span
            key={i}
            className="mx-0.5 inline-flex items-center rounded-full bg-emerald-800/90 px-2 py-0.5 text-[10px] font-medium text-white"
          >
            {part.citation}
          </span>
        ),
      )}
    </span>
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
  onQuickAction,
  selectedModel,
  setSelectedModel,
  citationsEnabled,
  setCitationsEnabled,
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
  onQuickAction: (action: string) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  citationsEnabled: boolean;
  setCitationsEnabled: (v: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all focus-within:border-[var(--color-govdoc-primary)] focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative z-10">
      {/* Quick action chips */}
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-2 bg-[var(--color-cream-soft)]/20">
        {[
          { label: "Summarize", icon: "📝" },
          { label: "Compare", icon: "📊" },
          { label: "Extract", icon: "»" },
          { label: "Find", icon: "🔍" },
        ].map((chip) => (
          <button
            key={chip.label}
            onClick={() => onQuickAction(chip.label)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-mute)] transition-all hover:bg-[var(--color-cream-soft)] hover:text-[var(--color-ink)]"
          >
            <span className="text-[10px]">{chip.icon}</span>
            {chip.label}
          </button>
        ))}
      </div>

      {/* Textarea row */}
      <div className="flex items-end gap-2 px-3.5 py-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]"
          title="Attach PDF or DOCX"
        >
          {isUploading ? (
            <div className="size-4 animate-spin rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-govdoc-primary)]" />
          ) : (
            <Paperclip className="size-4" />
          )}
        </button>
        <button className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]" title="Voice input">
          <Mic className="size-4" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]"
          title="Upload document"
        >
          <FileUp className="size-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything — attach a PDF or DOCX to ground the answer in its contents."
          className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent py-0.5 text-[13px] leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
          rows={1}
          disabled={isAnswering}
        />

        {isAnswering ? (
          <button
            onClick={onStop}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ink)] text-white transition-colors hover:bg-[var(--color-ink-soft)]"
            title="Stop generating"
          >
            <Square className="size-3" fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-govdoc-primary)] text-white transition-colors hover:bg-[var(--color-govdoc-deep)] disabled:cursor-not-allowed disabled:bg-[var(--color-line)] disabled:text-[var(--color-ink-faint)]"
          >
            <Send className="size-3.5" />
          </button>
        )}
      </div>

      {/* Bottom metadata row */}
      <div className="flex items-center justify-between border-t border-[var(--color-line)] px-3.5 py-1.5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">
            ↵ SEND · ⇧↵ NEW LINE
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Model selector dropdown */}
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none cursor-pointer rounded-full border border-emerald-700/20 bg-emerald-700/5 hover:bg-emerald-700/10 px-3 py-1 pr-6 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-700/30"
            >
              <option value="Claude Opus">Claude Opus</option>
              <option value="Claude Sonnet">Claude Sonnet</option>
              <option value="GPT-4o">GPT-4o</option>
              <option value="Gemini Flash">Gemini Flash</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-emerald-800">
              <svg width="6" height="4" viewBox="0 0 6 4" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l2 2 2-2"/></svg>
            </div>
          </div>

          {/* Citations toggle */}
          <button
            type="button"
            onClick={() => setCitationsEnabled(!citationsEnabled)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors ${
              citationsEnabled
                ? "border-emerald-700/20 bg-emerald-700/5 text-emerald-800 hover:bg-emerald-700/10"
                : "border-[var(--color-line)] bg-[var(--color-cream-soft)] text-[var(--color-ink-faint)] hover:bg-[var(--color-line)]"
            }`}
          >
            <span className={`size-1.5 rounded-full ${citationsEnabled ? "bg-emerald-600" : "bg-[var(--color-ink-faint)]"}`} />
            Citations: {citationsEnabled ? "On" : "Off"}
          </button>
        </div>
      </div>
    </div>
  );
}
