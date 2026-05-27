"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { UploadedDocument } from "@/lib/document-service";
import type { ChatMessage } from "@/lib/chat-service";
import {
  Check,
  ChevronsRight,
  Columns2,
  Copy,
  Download,
  FileText,
  FolderOpen,
  ListFilter,
  Mic,
  PanelLeftClose,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  Share2,
  Square,
  ThumbsUp,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const USER_ID = "dev";
const USER_NAME = "JOTHI";

const QUICK_ACTIONS = [
  { label: "Summarize", icon: ListFilter },
  { label: "Compare", icon: Columns2 },
  { label: "Extract", icon: ChevronsRight },
  { label: "Find", icon: Search },
] as const;

type SidebarGroup = {
  label: string;
  items: Array<{ title: string; age: string; active?: boolean }>;
};

const PROJECT_COUNT = 4;
const REFERENCE_CHAT_HISTORY: ChatMessage[] = [
  {
    role: "user",
    content: "What are the contractor's response obligations when a grievance is filed under our standard procurement contract?",
    timestamp: "2026-05-26T14:14:00",
  },
  {
    role: "assistant",
    timestamp: "2026-05-26T14:14:00",
    sources: [
      {
        documentName: "Gov §11130",
        chunkIndex: 0,
        score: 0.94,
        excerpt: "Contractor response obligations and grievance acknowledgment timing.",
      },
      {
        documentName: "CCR §15.04",
        chunkIndex: 0,
        score: 0.91,
        excerpt: "Procedural breach window and audit trail retention.",
      },
    ],
    content:
      "Under California's standard procurement contract framework, a contractor's response obligations when a grievance is filed are set across two governing references [Gov §11130] [CCR §15.04].\n\n" +
      "KEY OBLIGATIONS\n" +
      "1. Acknowledge receipt of the grievance in writing within 10 business days.\n" +
      "2. Investigate and provide a documented response within 45 business days of acknowledgment.\n" +
      "3. Maintain a complete audit trail of all communications and corrective actions for no less than 7 years.\n\n" +
      "Failure to meet the 45-day window constitutes a procedural breach and may trigger Tier-2 review under [CCR §15.04(b)]. Want me to check a specific contract against these requirements?",
  },
  {
    role: "user",
    content: "What happens if the contractor misses the 45-day window?",
    timestamp: "2026-05-26T14:16:00",
  },
  {
    role: "assistant",
    content: "Missing the 45-day window has cascading consequences under California procurement law:",
    timestamp: "2026-05-26T14:16:00",
  },
];

const REFERENCE_SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: "TODAY",
    items: [
      { title: "Q3 vendor contract review", age: "2h ago", active: true },
      { title: "Summarize grievance procedure", age: "5h ago" },
    ],
  },
  {
    label: "YESTERDAY",
    items: [
      { title: "What are the contractor's response ...", age: "1d ago" },
      { title: "What does this document say?", age: "1d ago" },
    ],
  },
  {
    label: "EARLIER THIS WEEK",
    items: [
      { title: "Compare new policy vs. v2.3", age: "2d ago" },
      { title: "Extract deadlines from CCR §15", age: "3d ago" },
    ],
  },
];

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatObligationText(text: string): React.ReactNode {
  const durationPattern = /(no less than \d+ years|no less than \w+ years)/gi;
  const actionWordsPattern = /\b(retain|maintaining|maintain|preserves|preserve|documenting|document|submitting|submit|publishing|publish|reporting|report|notifying|notify|reviewing|review|auditing|audit|verifying|verify|complying|comply|store|storing|keep|keeping|disclose|disclosing|provide|providing|assess|assessing|evaluation|evaluating|evaluate|implement|implementing|monitoring|monitor|shall|must|acknowledge|investigate)\b/gi;

  const parts = text.split(durationPattern);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <em key={i} className="italic font-medium text-[#2a2a28]">{part}</em>;
    }
    const subParts = part.split(actionWordsPattern);
    return (
      <span key={i}>
        {subParts.map((subPart, j) => {
          if (j % 2 === 1) return <strong key={j} className="font-semibold text-[#2a2a28]">{subPart}</strong>;
          return subPart;
        })}
      </span>
    );
  });
}

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

  let title = "KEY OBLIGATIONS";
  let titleLineIdx = -1;
  for (let i = firstIdx - 1; i >= Math.max(0, firstIdx - 3); i--) {
    const line = lines[i]!.trim();
    if (line && (line.includes("obligation") || line.includes("Obligation") || line.includes("KEY") || line.toUpperCase() === line) && line.length < 80) {
      title = line.replace(/^[#*\-_]+/, "").trim().toUpperCase();
      titleLineIdx = i;
      break;
    }
  }

  const intro = lines.slice(0, firstIdx).filter((l, i) => i !== titleLineIdx && l.trim()).join("\n");
  const outro = lines.slice(lastIdx + 1).filter((l) => l.trim()).join("\n");

  return { intro, title: `${title} · ${items.length} FOUND`, items, outro };
}

export default function SearchAskPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(REFERENCE_CHAT_HISTORY);
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [thinkingPhase, setThinkingPhase] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [responseTimes, setResponseTimes] = useState<Record<number, number>>({ 1: 1.8 });
  const [sendTimestamp, setSendTimestamp] = useState<number | null>(null);
  const didMountRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [selectedModel, setSelectedModel] = useState("Claude Opus");
  const [citationsEnabled, setCitationsEnabled] = useState(true);

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

  const groupedHistory = REFERENCE_SIDEBAR_GROUPS.map((group) => ({
    ...group,
    items: sidebarSearch
      ? group.items.filter((item) => item.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
      : group.items,
  })).filter((group) => group.items.length > 0);

  const sessionTitle = "Q3 vendor contract review";

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f5efe2]">
        <div className="size-8 animate-spin rounded-full border-[3px] border-[#e0d7c4] border-t-[#b04a2f]" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#e0d7c4] bg-[#faf6ec]">
        <div className="flex h-[70px] items-center justify-between border-b border-[#e0d7c4] bg-[#ffffff] px-[19px]">
          <div className="flex items-center gap-2.5">
            <div className="flex size-[36px] items-center justify-center rounded-[5px] bg-[#b04a2f] text-[#ffffff]">
              <Search className="size-3.5" />
            </div>
            <span
              className="text-[#0a0a0a]"
              style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              Search & <em style={{ fontStyle: "italic", fontWeight: 400, color: "#b04a2f" }}>Ask</em>
            </span>
          </div>
          <button
            className="flex size-[29px] items-center justify-center rounded-[5px] border border-[#e0d7c4] bg-[#ffffff] text-[#908d83] transition-colors hover:border-[#8B877D] hover:text-[#0a0a0a]"
            title="Collapse sidebar"
            type="button"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <div className="px-[19px] pb-[13px] pt-[17px]">
          <button
            onClick={handleNewChat}
            className="flex h-[52px] w-full items-center gap-3 rounded-[6px] border border-[#e0d7c4] bg-[#ffffff] px-[15px] transition-colors hover:border-[#b04a2f]"
            style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 500 }}
          >
            <div className="flex size-6 items-center justify-center rounded-full bg-[#b04a2f] text-[#ffffff]">
              <Plus className="size-3" />
            </div>
            <span className="text-[#0a0a0a]">New chat</span>
          </button>

          <div className="mt-[15px] flex h-[32px] items-center justify-between rounded-md px-[12px] transition-colors hover:bg-[#ffffff]">
            <div className="flex items-center gap-3">
              <FolderOpen className="size-4 text-[#908d83]" />
              <span className="text-[14px] text-[#5e5e58]" style={{ fontFamily: "var(--font-sans)" }}>Projects</span>
            </div>
            <span
              className="text-[#908d83]"
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700 }}
            >
              {PROJECT_COUNT}
            </span>
          </div>

          <div className="relative mt-[13px]">
            <Search className="absolute left-[12px] top-1/2 size-3.5 -translate-y-1/2 text-[#908d83]" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search chats..."
              className="h-[38px] w-full rounded-[6px] border border-[#e0d7c4] bg-[#ffffff] pl-[34px] pr-10 text-[13px] text-[#0a0a0a] placeholder:text-[#908d83] focus:border-[#b04a2f] focus:outline-none"
              style={{ fontFamily: "var(--font-sans)" }}
            />
            <kbd
              className="absolute right-[9px] top-1/2 -translate-y-1/2 rounded border border-[#e0d7c4] bg-[#f5efe2] px-1 text-[#908d83]"
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}
            >
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="activity-scroll flex-1 overflow-y-auto px-[19px] py-0">
          {groupedHistory.map((group) => (
            <div key={group.label}>
              <div
                className="px-[5px] pb-[9px] pt-[8px] uppercase text-[#908d83]"
                style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}
              >
                {group.label}
              </div>
              {group.items.map((item) => (
                <div
                  key={`${group.label}-${item.title}`}
                  className={`mb-[3px] cursor-pointer rounded-[6px] px-[12px] py-[8px] transition-colors ${
                    item.active === true
                      ? "border-l-[3px] border-l-[#b04a2f] bg-[#f0e8d8]"
                      : "hover:bg-[#ffffff]"
                  }`}
                >
                  <div className="truncate text-[13px] text-[#0a0a0a]" style={{ fontFamily: "var(--font-sans)" }}>
                    {item.title}
                  </div>
                  <div className="mt-0.5 text-[#908d83]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                    {item.age}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {groupedHistory.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] text-[#908d83]" style={{ fontFamily: "var(--font-sans)" }}>
              No chat history
            </div>
          )}
        </div>

        <div className="border-t border-[#e0d7c4] p-[19px]">
          <div className="flex items-center gap-3 rounded-md px-[12px] py-2 text-[14px] text-[#5e5e58] transition-colors hover:bg-[#ffffff] hover:text-[#0a0a0a]">
            <Settings className="size-4" />
            <span style={{ fontFamily: "var(--font-sans)" }}>Settings</span>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[#f5efe2]">
        <div className="relative z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-[#e0d7c4] bg-[#faf6ec] px-[39px]">
          <div className="flex items-center gap-3">
            <span
              className="bg-[#f0e0d4] px-[10px] py-[3px] uppercase text-[#8a3820]"
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, letterSpacing: "2px" }}
            >
              02 · SEARCH & ASK
            </span>
            <span className="text-[16px] font-semibold text-[#0a0a0a]" style={{ fontFamily: "var(--font-display)" }}>
              {sessionTitle}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 rounded-full border border-[#b04a2f]/30 bg-[#b04a2f]/5 px-2.5 py-0.5 uppercase text-[#b04a2f]"
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, letterSpacing: "2px" }}
            >
              <span className={`size-1.5 rounded-full bg-[#b04a2f] ${isAnswering ? "animate-pulse" : ""}`} />
              SESSION ACTIVE
            </span>
            <button className="flex size-8 items-center justify-center rounded-[5px] border border-[#e0d7c4] bg-[#ffffff] text-[#908d83] transition-colors hover:border-[#8B877D] hover:text-[#0a0a0a]" title="Share">
              <Share2 className="size-3.5" />
            </button>
            <button className="flex size-8 items-center justify-center rounded-[5px] border border-[#e0d7c4] bg-[#ffffff] text-[#908d83] transition-colors hover:border-[#8B877D] hover:text-[#0a0a0a]" title="Download">
              <Download className="size-3.5" />
            </button>
          </div>
        </div>

        {chatHistory.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <h1
              className="mb-1 text-[#0a0a0a]"
              style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 500, letterSpacing: "-0.5px" }}
            >
              What can I help with?
            </h1>
            <p className="mb-8 text-[13px] text-[#5e5e58]" style={{ fontFamily: "var(--font-sans)" }}>
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
                  className="rounded-lg border border-[#e0d7c4] bg-[#ffffff] px-5 py-4 text-left text-[13px] leading-relaxed text-[#5e5e58] transition-all hover:border-[#b04a2f] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
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
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                citationsEnabled={citationsEnabled}
                setCitationsEnabled={setCitationsEnabled}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="flex min-h-full w-full flex-col gap-[18px] px-[38px] pb-[28px] pt-[28px]">
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
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#b04a2f] text-[#ffffff]"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700 }}
                    >
                      G
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-[#5e5e58]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}>GOVDOC</span>
                        <span className="uppercase text-[#b04a2f]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700 }}>· STREAMING</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="size-1.5 animate-pulse rounded-full bg-[#b04a2f]" />
                          <div className="size-1.5 animate-pulse rounded-full bg-[#b04a2f] [animation-delay:150ms]" />
                          <div className="size-1.5 animate-pulse rounded-full bg-[#b04a2f] [animation-delay:300ms]" />
                        </div>
                        <span className="text-[12px] text-[#5e5e58]" style={{ fontFamily: "var(--font-sans)" }}>{thinkingPhase}</span>
                      </div>
                      <button
                        onClick={handleStop}
                        className="flex w-fit items-center gap-1.5 rounded-md border border-[#e0d7c4] px-2 py-1 text-[11px] text-[#5e5e58] transition-colors hover:border-[#8B877D] hover:text-[#0a0a0a]"
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

            <div className="shrink-0 px-4 pb-[30px] pt-3">
              <div className="mx-auto w-full max-w-[920px]">
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

/* SUB-COMPONENTS */

function UserMessage({ msg, idx, editingIdx, editValue, setEditValue, onEditStart, onEditCancel, onEditSubmit }: {
  msg: ChatMessage; idx: number; editingIdx: number | null; editValue: string;
  setEditValue: (v: string) => void; onEditStart: (i: number, c: string) => void;
  onEditCancel: () => void; onEditSubmit: (i: number) => void;
}) {
  return (
    <div className="group flex items-start justify-end gap-3">
      <div className="flex flex-col items-end">
        <div className="mb-1.5 flex items-center gap-2 pr-1">
          <span className="uppercase text-[#5e5e58]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}>
            {USER_NAME}
          </span>
          <span className="text-[#908d83]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
            · {formatTime(msg.timestamp)}
          </span>
        </div>
        {editingIdx === idx ? (
          <div className="flex w-full max-w-[min(80%,56ch)] flex-col gap-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full resize-none rounded-2xl border border-[#b04a2f] bg-[#ffffff] px-4 py-2.5 text-[13px] leading-[1.65] text-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#b04a2f]"
              style={{ fontFamily: "var(--font-sans)" }}
              rows={3}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEditSubmit(idx); } if (e.key === "Escape") onEditCancel(); }}
            />
            <div className="flex justify-end gap-1.5">
              <button onClick={onEditCancel} className="rounded-md px-2.5 py-1 text-[11px] text-[#5e5e58] hover:bg-[#f5efe2]">Cancel</button>
              <button onClick={() => onEditSubmit(idx)} className="rounded-md bg-[#b04a2f] px-2.5 py-1 text-[11px] text-[#ffffff] hover:bg-[#8a3820]">Send</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <button
              onClick={() => onEditStart(idx, msg.content)}
              className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-md text-[#908d83] opacity-0 transition-opacity hover:bg-[#f5efe2] hover:text-[#5e5e58] group-hover:opacity-100"
              title="Edit message"
            >
              <Pencil className="size-3" />
            </button>
            <div
              className="max-w-[min(72vw,680px)] rounded-[10px] border border-[#e0d7c4] bg-[#faf6ec] px-5 py-3 text-[16px] leading-[1.45] text-[#0a0a0a]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {msg.content}
            </div>
          </div>
        )}
      </div>
      <div
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#8a3820] text-[#ffffff]"
        style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700 }}
      >
        {USER_NAME[0]?.toUpperCase() ?? "J"}
      </div>
    </div>
  );
}

function AssistantMessage({ msg, idx, isLast, isAnswering, responseTimes, copiedIdx, onCopy, onRetry }: {
  msg: ChatMessage; idx: number; isLast: boolean; isAnswering: boolean;
  responseTimes: Record<number, number>; copiedIdx: number | null;
  onCopy: (t: string, i: number) => void; onRetry: () => void;
}) {
  const structured = extractKeyObligations(msg.content);

  return (
    <div className="group flex items-start gap-3">
      <div
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-[#ffffff]"
        style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700 }}
      >
        G
      </div>
      <div className="max-w-[870px] flex-1 text-[#2a2a28]" style={{ fontFamily: "var(--font-sans)", fontSize: "16px", lineHeight: "1.55", letterSpacing: "-0.01em" }}>
        <div className="mb-2 flex items-center gap-2">
          <span className="uppercase text-[#5e5e58]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}>GOVDOC</span>
          <span className="text-[#908d83]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>· {formatTime(msg.timestamp)}</span>
          {responseTimes[idx] != null && (
            <span className="uppercase text-[#908d83]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
              · ANSWERED IN {responseTimes[idx].toFixed(1)}S
            </span>
          )}
          {(isAnswering && isLast) || msg.content.startsWith("Missing the 45-day window") ? (
            <span className="uppercase text-[#b04a2f]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700 }}>· STREAMING</span>
          ) : null}
        </div>

        {structured ? (
          <div>
            {structured.intro && (
              <div className="mb-4">
                <ContentWithCitations content={structured.intro} sources={msg.sources} />
              </div>
            )}
            <div className="mb-4 rounded-[6px] border border-[#e0d7c4] border-l-4 border-l-[#b04a2f] bg-[#ffffff] px-5 py-4 shadow-[0_8px_20px_rgba(30,24,14,0.07)]">
              <div className="mb-3 uppercase text-[#8a3820]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.28em" }}>
                ━━━ {structured.title}
              </div>
              <div className="space-y-2.5">
                {structured.items.map((item, si) => (
                  <div key={si} className="flex gap-3">
                    <span className="flex h-[22px] min-w-[28px] shrink-0 items-center justify-center rounded-[4px] bg-[#f0e0d4] font-bold text-[#b04a2f]" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{item.num}</span>
                    <span className="text-[13px] leading-[1.65] text-[#0a0a0a]" style={{ fontFamily: "var(--font-sans)" }}>{formatObligationText(item.text)}</span>
                  </div>
                ))}
              </div>
            </div>
            {structured.outro && (
              <div><ContentWithCitations content={structured.outro} sources={msg.sources} /></div>
            )}
          </div>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:mb-1 prose-headings:mt-3 prose-headings:text-[#0a0a0a] prose-code:rounded prose-code:bg-[#f5efe2] prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px] prose-pre:rounded-lg prose-pre:bg-[#f5efe2]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        )}

        {!structured && msg.sources && msg.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {msg.sources.map((source, si) => (
              <span key={si} className="inline-flex items-center gap-1.5 rounded-full bg-[#f0e0d4] px-2.5 py-0.5 text-[10px] font-bold text-[#8a3820]">
                <FileText className="size-2.5" />
                {source.documentName} · p.{source.chunkIndex + 1}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={() => onCopy(msg.content, idx)} className="flex size-6 items-center justify-center rounded-md text-[#908d83] transition-colors hover:bg-[#f5efe2] hover:text-[#5e5e58]" title="Copy">
              {copiedIdx === idx ? <Check className="size-3" /> : <Copy className="size-3" />}
            </button>
            {isLast && (
              <button onClick={onRetry} className="flex size-6 items-center justify-center rounded-md text-[#908d83] transition-colors hover:bg-[#f5efe2] hover:text-[#5e5e58]" title="Retry">
                <RotateCcw className="size-3" />
              </button>
            )}
            <button className="flex size-6 items-center justify-center rounded-md text-[#908d83] transition-colors hover:bg-[#f5efe2] hover:text-[#5e5e58]" title="Helpful">
              <ThumbsUp className="size-3" />
            </button>
          </div>
          {msg.sources && msg.sources.length > 0 && (
            <span className="text-[#908d83]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
              {msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""} cited · audit-logged
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ContentWithCitations({ content }: { content: string; sources?: ChatMessage["sources"] }) {
  const citationPattern = /\[([^\]]+)\]/g;
  const parts: (string | { citation: string })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationPattern.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
    parts.push({ citation: match[1]! });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  if (parts.length === 0) return <span>{content}</span>;

  return (
    <span>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <span key={i} className="mx-0.5 inline-flex items-center rounded-full bg-[#b04a2f] px-2 py-0.5 text-[10px] font-medium text-[#ffffff]">
            {part.citation}
          </span>
        ),
      )}
    </span>
  );
}

function DocumentPills({ documents, onRemove }: { documents: UploadedDocument[]; onRemove: (id: string) => void }) {
  if (documents.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {documents.map((doc, index) => {
        const docName = doc.name ?? "document";
        const isPdf = docName.toLowerCase().endsWith(".pdf");
        return (
          <div key={`${doc.id}-${index}`} className="group flex items-center gap-2.5 rounded-lg border border-[#e0d7c4] bg-[#ffffff] px-3 py-2 text-sm">
            <span className={`flex size-6 items-center justify-center rounded ${isPdf ? "bg-red-600" : "bg-blue-600"} text-[9px] font-bold text-white`}>{isPdf ? "PDF" : "DOC"}</span>
            <span className="font-medium text-[#0a0a0a]" style={{ fontFamily: "var(--font-sans)" }}>{docName}</span>
            <button onClick={() => onRemove(doc.id)} className="ml-1 flex size-5 items-center justify-center rounded-full text-[#908d83] opacity-0 transition-opacity hover:bg-[#e0d7c4] hover:text-[#0a0a0a] group-hover:opacity-100">
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
  selectedModel, setSelectedModel, citationsEnabled, setCitationsEnabled,
}: {
  inputValue: string; setInputValue: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: () => void; handleFileUpload: (files: FileList | null) => void;
  isUploading: boolean; isAnswering: boolean; onStop: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onQuickAction: (action: string) => void;
  selectedModel: string; setSelectedModel: (v: string) => void;
  citationsEnabled: boolean; setCitationsEnabled: (v: boolean) => void;
}) {
  return (
    <div className="relative z-10 min-h-[176px] rounded-[14px] border border-[#e0d7c4] bg-[#ffffff] shadow-[0_14px_28px_rgba(30,24,14,0.07)] transition-all focus-within:border-[#b04a2f]">
      <div className="px-[19px] pb-[11px] pt-[16px]">
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
          className="max-h-[112px] min-h-[52px] w-full resize-none bg-transparent text-[16px] leading-relaxed text-[#0a0a0a] placeholder:text-[#908d83] focus:outline-none"
          style={{ fontFamily: "var(--font-sans)" }}
          rows={2}
          disabled={isAnswering}
        />
      </div>

      <div className="flex min-h-[38px] items-center gap-2 px-[16px] pb-[8px]">
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onQuickAction(label)}
            className="flex h-[30px] items-center gap-2 rounded-full border border-[#e0d7c4] bg-[#ffffff] px-[12px] text-[#5e5e58] transition-all hover:bg-[#f5efe2] hover:text-[#0a0a0a]"
            style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 500 }}
            type="button"
          >
            <Icon className="size-3.5" strokeWidth={1.7} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex h-[58px] items-center justify-between border-t border-[#e0d7c4]/70 px-[20px]">
        <div className="flex items-center gap-[14px]">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#908d83] transition-colors hover:bg-[#f5efe2] hover:text-[#0a0a0a]"
            title="Attach PDF or DOCX"
            type="button"
          >
            {isUploading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-[#e0d7c4] border-t-[#b04a2f]" />
            ) : (
              <Paperclip className="size-4" />
            )}
          </button>
          <button className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#908d83] transition-colors hover:bg-[#f5efe2] hover:text-[#0a0a0a]" title="Voice input" type="button">
            <Mic className="size-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#908d83] transition-colors hover:bg-[#f5efe2] hover:text-[#0a0a0a]"
            title="Upload document"
            type="button"
          >
            <FolderOpen className="size-4" />
          </button>
          <span className="flex items-center gap-2 text-[#908d83]" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "2px" }}>
            <kbd className="rounded-[3px] border border-[#e0d7c4] bg-[#f5efe2] px-1 py-0.5 text-[9px] leading-none">↵</kbd>
            SEND
            <span>·</span>
            <kbd className="rounded-[3px] border border-[#e0d7c4] bg-[#f5efe2] px-1 py-0.5 text-[9px] leading-none">⇧↵</kbd>
            NEW LINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-[32px] items-center gap-2 rounded-full border border-[#e0d7c4] bg-[#ffffff] px-[12px] text-[#8a3820]">
            <span className="size-1.5 rounded-full bg-[#b04a2f]" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none bg-transparent uppercase focus:outline-none"
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}
              aria-label="Model"
            >
              <option value="Claude Opus">Claude Opus</option>
              <option value="Claude Sonnet">Claude Sonnet</option>
              <option value="GPT-4o">GPT-4o</option>
              <option value="Gemini Flash">Gemini Flash</option>
            </select>
            <button
              type="button"
              onClick={() => setCitationsEnabled(!citationsEnabled)}
              className="border-l border-[#e0d7c4] pl-2 uppercase transition-colors hover:text-[#0a0a0a]"
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}
            >
              Citations {citationsEnabled ? "On" : "Off"}
            </button>
          </div>
          {isAnswering ? (
            <button onClick={onStop} className="flex size-[38px] shrink-0 items-center justify-center rounded-[8px] bg-[#0a0a0a] text-[#ffffff] transition-colors hover:bg-[#2a2a28]" title="Stop generating" type="button">
              <Square className="size-3" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="flex size-[38px] shrink-0 items-center justify-center rounded-[8px] bg-[#b04a2f] text-[#ffffff] shadow-[0_5px_12px_rgba(30,24,14,0.18)] transition-colors hover:bg-[#8a3820] disabled:cursor-not-allowed disabled:bg-[#e0d7c4] disabled:text-[#908d83] disabled:shadow-none"
              type="button"
            >
              <Send className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
