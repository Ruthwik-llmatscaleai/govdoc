"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ProcessedDocument } from "@/features/search-ask/documents";
import type { ChatMessage } from "@/features/search-ask/service";
import {
  ArrowLeft,
  Check,
  ChevronsRight,
  Columns2,
  Copy,
  FileText,
  FolderOpen,
  ListFilter,
  PanelLeftClose,
  PanelRightClose,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const FALLBACK_USER_ID = "dev";
const FALLBACK_USER_NAME = "User";

const QUICK_ACTIONS = [
  { label: "Summarize", icon: ListFilter },
  { label: "Compare", icon: Columns2 },
  { label: "Extract", icon: ChevronsRight },
  { label: "Find", icon: Search },
] as const;

interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string | null;
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}


export default function SearchAskPage() {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
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
  const didMountRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [artifactsOpen, setArtifactsOpen] = useState(false);
  const [, setUserId] = useState(FALLBACK_USER_ID);
  const [userName, setUserName] = useState(FALLBACK_USER_NAME);

  // Load conversations list + documents on mount
  useEffect(() => {
    async function init() {
      try {
        const [meRes, convsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/conversations"),
        ]);
        if (meRes.ok) {
          const me = await meRes.json();
          if (me?.userId) setUserId(me.userId);
          if (me?.username) setUserName(me.username);
        }
        if (convsRes.ok) {
          const data = await convsRes.json();
          if (data?.success && data.conversations?.length > 0) {
            setConversations(data.conversations);
          }
        }
      } catch {}
      setIsLoading(false);
    }
    init();
  }, []);

  async function loadConversation(convId: string) {
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setChatHistory(data.messages ?? []);
          setResponseTimes({});
        }
      }
    } catch {}
  }

  async function refreshConversations() {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        if (data?.success) setConversations(data.conversations ?? []);
      }
    } catch {}
  }

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
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
      // Ensure we have a conversation for these files
      let convId = activeConvId;
      if (!convId) {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: files[0].name.slice(0, 60) }),
        });
        const data = await res.json();
        if (data?.success) {
          convId = data.id;
          setActiveConvId(convId);
          refreshConversations();
        }
      }

      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      if (convId) formData.append("conversationId", convId);

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success) {
        const docsRes = await fetch(`/api/storage/load-documents?conversationId=${convId ?? ""}`);
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

    const userMessage: ChatMessage = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    // Save user message — create conversation if needed
    const saveRes = await fetch("/api/storage/save-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: userMessage.role,
        content: userMessage.content,
        conversationId: activeConvId,
      }),
    });
    const saveData = await saveRes.json();
    const convId = saveData?.conversationId ?? activeConvId;

    if (!activeConvId && convId) {
      setActiveConvId(convId);
      await fetch(`/api/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: userMessage.content.slice(0, 80) }),
      });
      refreshConversations();
    }

    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setInputValue("");
    setIsAnswering(true);
    setThinkingPhase("Searching documents...");
    const startedAt = Date.now();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setTimeout(() => { if (abortRef.current === controller) setThinkingPhase("Generating answer..."); }, 2000);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content, chatHistory, conversationId: convId }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (data.success) {
        const elapsed = (Date.now() - startedAt) / 1000;
        setResponseTimes((prev) => ({ ...prev, [newHistory.length]: elapsed }));

        await fetch("/api/storage/save-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "assistant",
            content: data.answer.content,
            sources: data.answer.sources,
            conversationId: convId,
          }),
        });
        setChatHistory([...newHistory, data.answer]);
        refreshConversations();
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
    // Create a new conversation immediately so it appears in the sidebar
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      const data = await res.json();
      if (data?.success) {
        setActiveConvId(data.id);
        setConversations([{ id: data.id, title: "New Conversation", createdAt: new Date().toISOString(), lastMessageAt: new Date().toISOString(), isPinned: false }, ...conversations]);
      } else {
        setActiveConvId(null);
      }
    } catch {
      setActiveConvId(null);
    }
    setChatHistory([]);
    setDocuments([]);
    setResponseTimes({});
  };

  const handleSwitchConversation = async (convId: string) => {
    if (convId === activeConvId) return;
    setActiveConvId(convId);
    setChatHistory([]);
    setDocuments([]);
    setResponseTimes({});
    await loadConversation(convId);
    // Load docs for this conversation
    try {
      const docsRes = await fetch(`/api/storage/load-documents?conversationId=${convId}`);
      const docsData = await docsRes.json();
      if (docsData.success) setDocuments(docsData.documents);
    } catch {}
  };

  const handleDeleteConversation = async (convId: string) => {
    await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
    if (convId === activeConvId) {
      setActiveConvId(null);
      setChatHistory([]);
    }
    refreshConversations();
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

  const filteredConversations = sidebarSearch
    ? conversations.filter((c) => c.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : conversations;

  const sessionTitle = chatHistory.length > 0
    ? chatHistory[0]?.content.slice(0, 50) + (chatHistory[0]?.content.length! > 50 ? "..." : "")
    : "New Chat";

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F3EEE0]">
        <div className="size-8 animate-spin rounded-full border-[3px] border-[#d6cfba] border-t-[#3D5740]" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* LEFT SIDEBAR */}
      {sidebarOpen && (
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-[#d6cfba] bg-[#f7f2e6]">
        <div className="flex h-[52px] items-center justify-between border-b border-[#d6cfba] bg-[#fcfaf3] px-[14px]">
          <div className="flex items-center gap-2">
            <div className="flex size-[28px] items-center justify-center rounded-[4px] bg-[#0e1410] text-[#fcfaf3]">
              <Search className="size-3" />
            </div>
            <span
              className="text-[#0e1410]"
              style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              Search & <em style={{ fontStyle: "italic", fontWeight: 400, color: "#48654b" }}>Ask</em>
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex size-[29px] items-center justify-center rounded-[5px] border border-[#d6cfba] bg-[#fcfaf3] text-[#6E706A] transition-colors hover:border-[#8B877D] hover:text-[#0E1410]"
            title="Collapse sidebar"
            type="button"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <div className="px-[14px] pb-[10px] pt-[12px]">
          <button
            onClick={handleNewChat}
            className="flex h-[38px] w-full items-center gap-2.5 rounded-[6px] border border-[#d6cfba] bg-[#fcfaf3] px-[12px] transition-colors hover:border-[#8B877D]"
            style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 500 }}
          >
            <div className="flex size-5 items-center justify-center rounded-full bg-[#0e1410] text-[#FCFAF3]">
              <Plus className="size-2.5" />
            </div>
            <span className="text-[#0E1410]">New chat</span>
          </button>

          <div className="relative mt-[10px]">
            <Search className="absolute left-[10px] top-1/2 size-3 -translate-y-1/2 text-[#8B877D]" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search chats..."
              className="h-[32px] w-full rounded-[5px] border border-[#d6cfba] bg-[#FCFAF3] pl-[30px] pr-8 text-[12px] text-[#0E1410] placeholder:text-[#8B877D] focus:border-[#3D5740] focus:outline-none"
              style={{ fontFamily: "var(--font-sans)" }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="activity-scroll flex-1 overflow-y-auto px-[14px] py-0">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSwitchConversation(conv.id)}
                className={`group mb-[3px] cursor-pointer rounded-[6px] px-[12px] py-[8px] transition-colors ${
                  conv.id === activeConvId
                    ? "border-l-[3px] border-l-[#48654b] bg-[#ebe6d5]"
                    : "hover:bg-[#FCFAF3]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 truncate text-[13px] text-[#0E1410]" style={{ fontFamily: "var(--font-sans)" }}>
                    {conv.title}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                    className="ml-1 flex size-5 shrink-0 items-center justify-center rounded text-[#8B877D] opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                    title="Delete conversation"
                    type="button"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
                <div className="mt-0.5 text-[#8B877D]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                  {relativeDate(conv.lastMessageAt ?? conv.createdAt)}
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-6 text-center text-[12px] text-[#8B877D]" style={{ fontFamily: "var(--font-sans)" }}>
              No chat history
            </div>
          )}
        </div>
      </aside>
      )}

      {/* MAIN CHAT AREA */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[#F3EEE0]">
        {/* Minimal top bar */}
        <div className="relative z-10 flex h-[40px] shrink-0 items-center gap-3 border-b border-[#d6cfba]/60 bg-[#F7F2E6] px-[16px]">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex size-7 items-center justify-center rounded-[5px] text-[#6E706A] transition-colors hover:bg-[#F3EEE0] hover:text-[#0E1410]"
              title="Open sidebar"
              type="button"
            >
              <PanelLeftClose className="size-4 rotate-180" />
            </button>
          )}
          <a
            href="/workspace"
            className="flex size-7 items-center justify-center rounded-[5px] text-[#6E706A] transition-colors hover:bg-[#F3EEE0] hover:text-[#0E1410]"
            title="Back to workspace"
          >
            <ArrowLeft className="size-4" />
          </a>
          <span className="flex-1 text-[14px] font-medium text-[#0E1410]" style={{ fontFamily: "var(--font-display)" }}>
            {sessionTitle}
          </span>
          {documents.length > 0 && (
            <button
              onClick={() => setArtifactsOpen(!artifactsOpen)}
              className={`flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[11px] transition-colors ${
                artifactsOpen
                  ? "bg-[#3D5740] text-white"
                  : "text-[#6E706A] hover:bg-[#F3EEE0] hover:text-[#0E1410]"
              }`}
              style={{ fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.5px" }}
              type="button"
            >
              <FolderOpen className="size-3.5" />
              {documents.length} file{documents.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>

        {chatHistory.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <h1
              className="mb-1 text-[#0E1410]"
              style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 500, letterSpacing: "-0.5px" }}
            >
              What can I help with?
            </h1>
            <p className="mb-8 text-[13px] text-[#6E706A]" style={{ fontFamily: "var(--font-sans)" }}>
              Upload documents and ask questions
            </p>

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
                  className="rounded-lg border border-[#d6cfba] bg-[#FCFAF3] px-5 py-4 text-left text-[13px] leading-relaxed text-[#6E706A] transition-all hover:border-[#3D5740] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="w-full max-w-[680px]">
              <DocumentPills documents={documents} onRemove={removeDocument} />
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
              />
            </div>
          </div>
        ) : (
          /* CONVERSATION ACTIVE */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="flex min-h-full w-full flex-col gap-[24px] px-[28px] pb-[28px] pt-[24px]">
                {chatHistory.map((msg, i) =>
                  msg.role === "user" ? (
                    <UserMessage
                      key={i}
                      msg={msg}
                      idx={i}
                      editingIdx={editingIdx}
                      editValue={editValue}
                      setEditValue={setEditValue}
                      onEditStart={handleEditStart}
                      onEditCancel={handleEditCancel}
                      onEditSubmit={handleEditSubmit}
                      displayName={userName}
                    />
                  ) : (
                    <AssistantMessage
                      key={i}
                      msg={msg}
                      idx={i}
                      isLast={i === chatHistory.length - 1}
                      isAnswering={isAnswering}
                      responseTimes={responseTimes}
                      copiedIdx={copiedIdx}
                      onCopy={handleCopy}
                      onRetry={handleRetry}
                    />
                  ),
                )}

                {isAnswering && (
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#3D5740] text-[#FCFAF3]"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700 }}
                    >
                      G
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-[#6E706A]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}>GOVDOC</span>
                        <span className="uppercase text-[#3D5740]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700 }}>· THINKING</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="size-1.5 animate-pulse rounded-full bg-[#3D5740]" />
                          <div className="size-1.5 animate-pulse rounded-full bg-[#3D5740] [animation-delay:150ms]" />
                          <div className="size-1.5 animate-pulse rounded-full bg-[#3D5740] [animation-delay:300ms]" />
                        </div>
                        <span className="text-[12px] text-[#6E706A]" style={{ fontFamily: "var(--font-sans)" }}>{thinkingPhase}</span>
                      </div>
                      <button
                        onClick={handleStop}
                        className="flex w-fit items-center gap-1.5 rounded-md border border-[#d6cfba] px-2 py-1 text-[11px] text-[#6E706A] transition-colors hover:border-[#8B877D] hover:text-[#0E1410]"
                        style={{ fontFamily: "var(--font-mono)" }}
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
            <div className="shrink-0 px-4 pb-[14px] pt-2">
              <div className="mx-auto w-full max-w-[720px]">
                <DocumentPills documents={documents} onRemove={removeDocument} />
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
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* RIGHT ARTIFACTS PANEL */}
      {artifactsOpen && (
        <aside className="flex w-[280px] shrink-0 flex-col border-l border-[#d6cfba] bg-[#f7f2e6]">
          <div className="flex h-[40px] items-center justify-between border-b border-[#d6cfba]/60 bg-[#fcfaf3] px-[14px]">
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0E1410]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Artifacts
            </span>
            <button
              onClick={() => setArtifactsOpen(false)}
              className="flex size-6 items-center justify-center rounded-[4px] text-[#6E706A] transition-colors hover:bg-[#F3EEE0] hover:text-[#0E1410]"
              type="button"
            >
              <PanelRightClose className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isPdf = doc.name?.toLowerCase().endsWith(".pdf");
                  return (
                    <div
                      key={doc.id}
                      className="group flex items-start gap-3 rounded-lg border border-[#d6cfba] bg-[#FCFAF3] p-3 transition-colors hover:border-[#8B877D]"
                    >
                      <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded ${isPdf ? "bg-red-600" : "bg-blue-600"} text-[8px] font-bold text-white`}>
                        {isPdf ? "PDF" : "DOC"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-[#0E1410]" style={{ fontFamily: "var(--font-sans)" }}>
                          {doc.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8B877D]" style={{ fontFamily: "var(--font-mono)" }}>
                          {doc.pageCount} pages · {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-[#8B877D] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                        title="Remove from conversation"
                        type="button"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="mb-3 size-8 text-[#d6cfba]" />
                <p className="text-[12px] text-[#8B877D]" style={{ fontFamily: "var(--font-sans)" }}>
                  No files in this conversation
                </p>
                <p className="mt-1 text-[11px] text-[#A19D91]" style={{ fontFamily: "var(--font-sans)" }}>
                  Upload a PDF or DOCX to get started
                </p>
              </div>
            )}
          </div>

          {/* Upload button at bottom */}
          <div className="border-t border-[#d6cfba] p-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#d6cfba] bg-[#FCFAF3] px-3 py-2 text-[12px] font-medium text-[#0E1410] transition-colors hover:border-[#3D5740] hover:bg-[#e8eadf]"
              style={{ fontFamily: "var(--font-sans)" }}
              type="button"
            >
              {isUploading ? (
                <div className="size-3.5 animate-spin rounded-full border-2 border-[#d6cfba] border-t-[#3D5740]" />
              ) : (
                <Paperclip className="size-3.5" />
              )}
              Upload File
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

/* SUB-COMPONENTS */

function UserMessage({ msg, idx, editingIdx, editValue, setEditValue, onEditStart, onEditCancel, onEditSubmit, displayName }: {
  msg: ChatMessage; idx: number; editingIdx: number | null; editValue: string;
  setEditValue: (v: string) => void; onEditStart: (i: number, c: string) => void;
  onEditCancel: () => void; onEditSubmit: (i: number) => void; displayName: string;
}) {
  return (
    <div className="group flex items-start justify-end gap-3">
      <div className="flex flex-col items-end">
        <div className="mb-1.5 flex items-center gap-2 pr-1">
          <span className="uppercase text-[#6E706A]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}>
            {displayName}
          </span>
          <span className="text-[#8B877D]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
            · {formatTime(msg.timestamp)}
          </span>
        </div>
        {editingIdx === idx ? (
          <div className="flex w-full max-w-[min(80%,56ch)] flex-col gap-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full resize-none rounded-2xl border border-[#3D5740] bg-[#FCFAF3] px-4 py-2.5 text-[13px] leading-[1.65] text-[#0E1410] focus:outline-none focus:ring-1 focus:ring-[#3D5740]"
              style={{ fontFamily: "var(--font-sans)" }}
              rows={3}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEditSubmit(idx); } if (e.key === "Escape") onEditCancel(); }}
            />
            <div className="flex justify-end gap-1.5">
              <button onClick={onEditCancel} className="rounded-md px-2.5 py-1 text-[11px] text-[#6E706A] hover:bg-[#F3EEE0]">Cancel</button>
              <button onClick={() => onEditSubmit(idx)} className="rounded-md bg-[#3D5740] px-2.5 py-1 text-[11px] text-[#FCFAF3] hover:bg-[#0E1410]">Send</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <button
              onClick={() => onEditStart(idx, msg.content)}
              className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-md text-[#8B877D] opacity-0 transition-opacity hover:bg-[#F3EEE0] hover:text-[#6E706A] group-hover:opacity-100"
              title="Edit message"
            >
              <Pencil className="size-3" />
            </button>
            <div
              className="max-w-[min(72vw,680px)] rounded-[10px] border border-[#c9c1aa] bg-[#e6e3d4] px-5 py-3 text-[16px] leading-[1.45] text-[#0e1410]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {msg.content}
            </div>
          </div>
        )}
      </div>
      <div
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#48654b] text-[#fcfaf3]"
        style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700 }}
      >
        {displayName[0]?.toUpperCase() ?? "U"}
      </div>
    </div>
  );
}

function AssistantMessage({ msg, idx, isLast, isAnswering, responseTimes, copiedIdx, onCopy, onRetry }: {
  msg: ChatMessage; idx: number; isLast: boolean; isAnswering: boolean;
  responseTimes: Record<number, number>; copiedIdx: number | null;
  onCopy: (t: string, i: number) => void; onRetry: () => void;
}) {
  const [citationsOpen, setCitationsOpen] = useState(false);

  return (
    <div className="group flex items-start gap-3">
      <div
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0e1410] text-[#fcfaf3]"
        style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700 }}
      >
        G
      </div>
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="uppercase text-[#6E706A]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}>GOVDOC</span>
          <span className="text-[#8B877D]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>· {formatTime(msg.timestamp)}</span>
          {responseTimes[idx] != null && (
            <span className="uppercase text-[#8B877D]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
              · {responseTimes[idx].toFixed(1)}s
            </span>
          )}
        </div>

        <div className="text-[15.5px] leading-[1.7] text-[#202821]" style={{ fontFamily: "var(--font-sans)" }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p({ children }) { return <p className="my-2.5 leading-[1.7]">{children}</p>; },
              strong({ children }) { return <strong className="font-semibold text-[#0E1410]">{children}</strong>; },
              em({ children }) { return <em className="italic">{children}</em>; },
              h1({ children }) { return <h1 className="mb-2 mt-5 text-[20px] font-semibold tracking-[-0.012em] text-[#0E1410]">{children}</h1>; },
              h2({ children }) { return <h2 className="mb-2 mt-4 text-[17.5px] font-semibold tracking-[-0.012em] text-[#0E1410]">{children}</h2>; },
              h3({ children }) { return <h3 className="mb-1 mt-3 text-[16px] font-semibold text-[#0E1410]">{children}</h3>; },
              ul({ children }) { return <ul className="my-2.5 list-disc space-y-1 pl-5">{children}</ul>; },
              ol({ children }) { return <ol className="my-2.5 list-decimal space-y-1 pl-5">{children}</ol>; },
              li({ children }) { return <li className="leading-[1.6]">{children}</li>; },
              blockquote({ children }) { return <blockquote className="my-3 border-l-[3px] border-[#3D5740]/50 pl-3 text-[15px] italic leading-[1.6] text-[#556157]">{children}</blockquote>; },
              a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#3D5740] underline underline-offset-[3px] hover:text-[#0E1410]">{children}</a>; },
              code({ className, children }) {
                const lang = (className ?? "").replace(/^language-/, "");
                if (!className) {
                  return <code className="rounded bg-[#F3EEE0] px-1.5 py-0.5 text-[13px] font-mono text-[#0E1410]">{children}</code>;
                }
                return (
                  <div className="my-3 overflow-hidden rounded-xl border border-[#d6cfba] bg-[#1f1f1d]">
                    <div className="flex items-center justify-between border-b border-white/10 bg-[#0f0f0e] px-3 py-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-white/60">{lang || "code"}</span>
                    </div>
                    <pre className="overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-[1.55] text-[#e8e6df]"><code>{children}</code></pre>
                  </div>
                );
              },
              pre({ children }) { return <>{children}</>; },
              table({ children }) {
                return (
                  <div className="my-4 overflow-hidden rounded-xl border border-[#d6cfba] bg-[#FCFAF3] shadow-[0_4px_12px_-8px_rgba(40,69,53,0.2)]">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-separate border-spacing-0 text-[14px] [&_tbody_tr:nth-child(even)]:bg-[#f7f5ed] [&_tbody_tr:hover]:bg-[#e8eadf]">{children}</table>
                    </div>
                  </div>
                );
              },
              thead({ children }) { return <thead className="bg-[#f7f2e6] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#556157]">{children}</thead>; },
              th({ children }) { return <th className="border-b border-[#d6cfba] px-4 py-2.5 text-left">{children}</th>; },
              td({ children }) { return <td className="border-b border-[#d6cfba]/50 px-4 py-3 leading-[1.5] text-[#0E1410]">{children}</td>; },
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>

        {/* Citations */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setCitationsOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-[#d6cfba] bg-[#FCFAF3] px-2.5 py-1 text-[11px] font-semibold text-[#556157] transition-colors hover:border-[#3D5740] hover:bg-[#e8eadf] hover:text-[#3D5740]"
            >
              <FileText className="size-2.5" />
              {msg.sources.length} citation{msg.sources.length === 1 ? "" : "s"}
              <svg className={`size-3 transition-transform ${citationsOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {citationsOpen && (
              <div className="mt-2 space-y-1.5">
                {msg.sources.map((source, si) => (
                  <div key={si} className="rounded-md border border-[#d6cfba] bg-[#FCFAF3] px-3 py-2">
                    <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#556157]">
                      <FileText className="size-2.5" />
                      {source.documentName}
                      <span className="ml-auto text-[10px] text-[#8B877D]">{(source.score * 100).toFixed(0)}% match</span>
                    </div>
                    <p className="text-[12.5px] italic leading-[1.55] text-[#6E706A]" style={{ fontFamily: "var(--font-document)" }}>
                      &ldquo;{source.excerpt}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => onCopy(msg.content, idx)} className="flex size-6 items-center justify-center rounded-md text-[#8B877D] transition-colors hover:bg-[#F3EEE0] hover:text-[#6E706A]" title="Copy">
            {copiedIdx === idx ? <Check className="size-3" /> : <Copy className="size-3" />}
          </button>
          {isLast && !isAnswering && (
            <button onClick={onRetry} className="flex size-6 items-center justify-center rounded-md text-[#8B877D] transition-colors hover:bg-[#F3EEE0] hover:text-[#6E706A]" title="Retry">
              <RotateCcw className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


function DocumentPills({ documents, onRemove }: { documents: ProcessedDocument[]; onRemove: (id: string) => void }) {
  if (documents.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {documents.map((doc, index) => {
        const docName = doc.name ?? "document";
        const isPdf = docName.toLowerCase().endsWith(".pdf");
        return (
          <div key={`${doc.id}-${index}`} className="group flex items-center gap-2.5 rounded-lg border border-[#d6cfba] bg-[#FCFAF3] px-3 py-2 text-sm">
            <span className={`flex size-6 items-center justify-center rounded ${isPdf ? "bg-red-600" : "bg-blue-600"} text-[9px] font-bold text-white`}>{isPdf ? "PDF" : "DOC"}</span>
            <span className="font-medium text-[#0E1410]" style={{ fontFamily: "var(--font-sans)" }}>{docName}</span>
            <span className="text-xs text-[#8B877D]">· {doc.pageCount}p</span>
            <button onClick={() => onRemove(doc.id)} className="ml-1 flex size-5 items-center justify-center rounded-full text-[#8B877D] opacity-0 transition-opacity hover:bg-[#D4CDB8] hover:text-[#0E1410] group-hover:opacity-100">
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function InputBox({
  inputValue, setInputValue, handleKeyDown, handleSendMessage, handleFileUpload,
  isUploading, isAnswering, onStop, fileInputRef, textareaRef, onQuickAction,
}: {
  inputValue: string; setInputValue: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: () => void; handleFileUpload: (files: FileList | null) => void;
  isUploading: boolean; isAnswering: boolean; onStop: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onQuickAction: (action: string) => void;
}) {
  return (
    <div className="relative z-10 rounded-[12px] border border-[#d6cfba] bg-[#fcfaf3] shadow-[0_8px_20px_rgba(30,24,14,0.06)] transition-all focus-within:border-[#48654b]">
      <div className="px-[16px] pb-[8px] pt-[12px]">
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
          className="max-h-[80px] min-h-[36px] w-full resize-none bg-transparent text-[14px] leading-relaxed text-[#0E1410] placeholder:text-[#9a9a91] focus:outline-none"
          style={{ fontFamily: "var(--font-sans)" }}
          rows={1}
          disabled={isAnswering}
        />
      </div>

      {/* Quick action chips */}
      <div className="flex items-center gap-1.5 px-[14px] pb-[6px]">
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onQuickAction(label)}
            className="flex h-[26px] items-center gap-1.5 rounded-full border border-[#d6cfba] bg-[#FCFAF3] px-[10px] text-[#556157] transition-all hover:bg-[#F3EEE0] hover:text-[#0E1410]"
            style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 500 }}
            type="button"
          >
            <Icon className="size-3" strokeWidth={1.7} />
            {label}
          </button>
        ))}
      </div>

      {/* Bottom row */}
      <div className="flex h-[42px] items-center justify-between border-t border-[#d6cfba]/70 px-[16px]">
        <div className="flex items-center gap-[10px]">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex size-5 shrink-0 items-center justify-center rounded text-[#74766f] transition-colors hover:bg-[#F3EEE0] hover:text-[#0E1410]"
            title="Attach PDF or DOCX"
            type="button"
          >
            {isUploading ? (
              <div className="size-3.5 animate-spin rounded-full border-2 border-[#d6cfba] border-t-[#3D5740]" />
            ) : (
              <Paperclip className="size-3.5" />
            )}
          </button>
          <span className="flex items-center gap-1.5 text-[#A19D91]" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "1.5px" }}>
            <kbd className="rounded-[2px] border border-[#d6cfba] bg-[#FCFAF3] px-0.5 py-0 text-[8px] leading-none">↵</kbd>
            SEND
            <span>·</span>
            <kbd className="rounded-[2px] border border-[#d6cfba] bg-[#FCFAF3] px-0.5 py-0 text-[8px] leading-none">⇧↵</kbd>
            NEW LINE
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isAnswering ? (
            <button onClick={onStop} className="flex size-[30px] shrink-0 items-center justify-center rounded-[6px] bg-[#0E1410] text-[#FCFAF3] transition-colors hover:bg-[#1C221D]" title="Stop generating" type="button">
              <Square className="size-2.5" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="flex size-[30px] shrink-0 items-center justify-center rounded-[6px] bg-[#48654b] text-[#fcfaf3] shadow-[0_3px_8px_rgba(30,24,14,0.15)] transition-colors hover:bg-[#3D5740] disabled:cursor-not-allowed disabled:bg-[#d6cfba] disabled:text-[#8B877D] disabled:shadow-none"
              type="button"
            >
              <Send className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
