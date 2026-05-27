"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, ListChecks, PanelLeftOpen, Scale, Search as SearchIcon, Sparkles } from "lucide-react";
import type { UploadedDocument } from "@/lib/search-ask/document-service";
import type { ChatMessage } from "@/lib/search-ask/chat-service";
import {
  ChatSidebar,
  type ConversationListEntry,
} from "./chat-sidebar";
import { ChatInput, type ChatInputHandle } from "./chat-input";
import { AssistantMessage, ThinkingMessage, UserMessage } from "./message";
import { DocChip } from "./file-card";
import { ScrollButton } from "./scroll-button";

/** Last-selected conversation id — purely a UX nicety so a refresh restores
 *  the panel you were looking at. Conversations themselves live in BigQuery. */
const STORAGE_LAST_CONVERSATION = "govdoc_chat_last_conversation";

interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  lastActivityAt: string;
}

function greetingFor(hour: number): string {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface QuickPill {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
}

const QUICK_PILLS: QuickPill[] = [
  { label: "Summarize", icon: Sparkles, prompt: "Summarize the key findings" },
  { label: "Compare", icon: Scale, prompt: "Compare compliance requirements across the documents" },
  { label: "Extract", icon: ListChecks, prompt: "List all action items and deadlines" },
  { label: "Find", icon: SearchIcon, prompt: "Find the payment terms and amounts" },
];

interface ChatClientProps {
  userId: string;
  userName: string;
}

function newConversationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// Map raw backend error text to a sentence the user can act on. Keeps the
// chat surface readable even when an upstream library throws library jargon.
function friendlyChatError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid_grant")) {
    return "Your Google credentials have expired. Run `gcloud auth application-default login` in your terminal, then refresh this page.";
  }
  if (lower.includes("could not load the default credentials")) {
    return "Google credentials aren't configured. Run `gcloud auth application-default login` and refresh this page.";
  }
  if (lower.includes("not found: dataset") || lower.includes("dataset not found")) {
    return "The BigQuery dataset isn't set up yet. Ask an admin to create it before chatting.";
  }
  if (lower.includes("not found: table") || lower.includes("table not found")) {
    return "The BigQuery chat tables aren't set up yet. Ask an admin to create them before chatting.";
  }
  if (lower.includes("permission") && lower.includes("denied")) {
    return "Your Google account doesn't have permission to access this chat dataset.";
  }
  if (lower.includes("no such field") || lower.includes("invalid value for")) {
    return "The BigQuery chat tables exist but their columns don't match the app. The tables need to be re-created.";
  }
  if (lower.includes("ai provider") || lower.includes("anthropic")) {
    return "The AI provider is having trouble responding. Please try again in a moment.";
  }
  // Fall back to the raw message so dev gets something useful in the UI too.
  return raw;
}

export function ChatClient({ userName }: ChatClientProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [thinkingPhase, setThinkingPhase] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversationId, setConversationId] = useState<string>(() => newConversationId());
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [greeting, setGreeting] = useState<string>("");

  const scrollerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<ChatInputHandle>(null);

  // Initial load: fetch the user's conversation list + restore last-viewed
  // conversation if we have one cached.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/conversations", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        const list: ConversationSummary[] = data?.success ? data.conversations ?? [] : [];
        setConversations(list);

        const last =
          typeof window !== "undefined"
            ? window.localStorage.getItem(STORAGE_LAST_CONVERSATION)
            : null;
        if (last && list.find((c) => c.id === last)) {
          await loadConversationInto(last);
        }
      } catch {
        /* leave list empty; user can still start chatting */
      } finally {
        if (!cancelled) {
          setGreeting(greetingFor(new Date().getHours()));
          setIsLoading(false);
        }
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadConversationInto(id: string) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json();
      if (!data?.success || !data.conversation) return;
      const conv = data.conversation as {
        id: string;
        messages: ChatMessage[];
        fileIds: Array<{ fileId: string; fileName: string }>;
      };
      setConversationId(conv.id);
      setChatHistory(conv.messages);
      // Rehydrate the doc chip row from the message history. We can't recover
      // sizeBytes / uploadedAt after the fact — best effort.
      setDocuments(
        conv.fileIds.map((f) => ({
          id: f.fileId,
          fileId: f.fileId,
          name: f.fileName,
          sizeBytes: 0,
          uploadedAt: "",
        })),
      );
      window.localStorage.setItem(STORAGE_LAST_CONVERSATION, conv.id);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function onScroll() {
      const target = el!;
      const fromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      setShowScrollDown(fromBottom > 80);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [chatHistory.length]);

  // Persist the active conversation id so a refresh restores where you were.
  useEffect(() => {
    if (chatHistory.length === 0) return;
    try {
      window.localStorage.setItem(STORAGE_LAST_CONVERSATION, conversationId);
    } catch {
      /* ignore */
    }
  }, [conversationId, chatHistory.length]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success) {
        const newDocs: UploadedDocument[] = data.documents.map(
          (d: { fileId: string; name: string; sizeBytes: number }) => ({
            id: d.fileId,
            fileId: d.fileId,
            name: d.name,
            sizeBytes: d.sizeBytes,
            uploadedAt: new Date().toISOString(),
          }),
        );
        setDocuments((prev) => [...prev, ...newDocs]);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeDocument = useCallback((docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  const refreshConversationList = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      const data = await res.json();
      if (data?.success) setConversations(data.conversations ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isAnswering) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const newHistory = [...chatHistory, userMessage];
      setChatHistory(newHistory);
      setIsAnswering(true);
      setThinkingPhase(documents.length > 0 ? "Searching documents..." : "Thinking...");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        window.setTimeout(() => {
          if (abortRef.current === controller) {
            setThinkingPhase(documents.length > 0 ? "Generating answer..." : "Composing reply...");
          }
        }, 2000);
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            question: userMessage.content,
            chatHistory,
            fileIds: documents.map((d) => ({ fileId: d.fileId, fileName: d.name })),
          }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (data.success) {
          setChatHistory([...newHistory, data.answer]);
          // First message in a new thread → refresh the sidebar so it shows
          // up immediately. Cheap call; BigQuery only writes happened.
          if (chatHistory.length === 0) void refreshConversationList();
        } else {
          // Map common backend errors to a sentence the user can actually
          // act on, and never render the bare "Error:" placeholder.
          const raw = (data.error ?? "").toString().trim();
          const friendly = raw.length === 0
            ? "We couldn't get an answer right now. Please try again."
            : friendlyChatError(raw);
          setChatHistory([
            ...newHistory,
            {
              role: "assistant",
              content: friendly,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          inputRef.current?.setMessage(userMessage.content);
          setChatHistory(chatHistory);
        } else {
          setChatHistory([
            ...newHistory,
            {
              role: "assistant",
              content: "Failed to get answer. Please try again.",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        setIsAnswering(false);
        setThinkingPhase("");
        abortRef.current = null;
      }
    },
    [chatHistory, documents, isAnswering, conversationId, refreshConversationList],
  );

  const handleNewChat = useCallback(() => {
    if (chatHistory.length === 0) return;
    setChatHistory([]);
    setDocuments([]);
    setConversationId(newConversationId());
    try {
      window.localStorage.removeItem(STORAGE_LAST_CONVERSATION);
    } catch {
      /* ignore */
    }
  }, [chatHistory.length]);

  const handleSelectConversation = useCallback((id: string) => {
    void loadConversationInto(id);
  }, []);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRetry = useCallback(() => {
    const lastUser = [...chatHistory].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setChatHistory(chatHistory.filter((_, i) => i < chatHistory.length - 1));
    inputRef.current?.setMessage(lastUser.content);
  }, [chatHistory]);

  const sidebarEntries: ConversationListEntry[] = conversations.map((c) => ({
    id: c.id,
    firstMessage: c.title,
    timestamp: c.lastActivityAt,
  }));

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-[3px] border-[var(--color-line)] border-t-[#b04a2f]" />
      </div>
    );
  }

  const isEmpty = chatHistory.length === 0;

  return (
    <div
      className="relative -mb-14 -mt-12 flex h-[calc(100vh-60px-56px)] bg-[var(--color-cream)]"
      style={{
        // Match the rubric pages' body font (Source Sans 3) so the chat
        // reads as part of the same product surface as Validate.
        fontFamily: "var(--font-source-sans)",
        // Break out of the parent layout's max-w-[1400px] mx-auto so the chat
        // can span the full viewport. We trim 16px off the right so there's a
        // small gap before the viewport edge / scrollbar.
        width: "calc(100vw - 16px)",
        marginLeft: "calc(50% - 50vw)",
      }}
    >
      {/* Chat-only TopBar compaction. The shared shell TopBar uses py-5
          everywhere; here we trim it to py-2.5 so the chat thread can claim
          back ~24px of vertical real estate. Scoped via a tagged selector so
          other /work pages keep the standard masthead. styled-jsx global is
          auto-cleaned up when the chat page unmounts. */}
      <style jsx global>{`
        header[data-shell="topbar"] [data-shell="topbar-inner"] {
          padding-top: 0.625rem !important;
          padding-bottom: 0.625rem !important;
        }
      `}</style>

      <ChatSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        conversations={sidebarEntries}
        selectedId={conversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        canStartNew={chatHistory.length > 0}
        onOpenSettings={() => alert("Settings — coming soon")}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Slim header strip — only renders the unhide button when the
            sidebar is collapsed. */}
        <div className="flex h-10 shrink-0 items-center px-3">
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
              className="flex size-8 items-center justify-center rounded-md text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-cream-soft)] hover:text-[var(--color-ink)]"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          )}
        </div>
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {isEmpty ? (
            <EmptyState
              greeting={greeting}
              userName={userName}
              documents={documents}
              onRemoveDocument={removeDocument}
              onSend={(text) => void handleSendMessage(text)}
              onFileSelect={(files) => void handleFileUpload(files)}
              isUploading={isUploading}
              isAnswering={isAnswering}
              onStop={handleStop}
              inputRef={inputRef}
              quickPills={QUICK_PILLS}
            />
          ) : (
            <>
              <div ref={scrollerRef} className="flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-[940px] flex-col gap-5 px-6 py-8">
                  {chatHistory.map((msg, i) =>
                    msg.role === "user" ? (
                      <UserMessage key={i} content={msg.content} />
                    ) : (
                      <AssistantMessage
                        key={i}
                        content={msg.content}
                        citations={msg.citations}
                        sources={msg.sources}
                        showRetry={i === chatHistory.length - 1}
                        onRetry={handleRetry}
                      />
                    ),
                  )}

                  {isAnswering && <ThinkingMessage phase={thinkingPhase} onStop={handleStop} />}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-[112px] right-6 z-20">
                <ScrollButton
                  visible={showScrollDown}
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                />
              </div>

              <div className="px-6 pb-6 pt-3">
                <div className="mx-auto w-full max-w-[940px]">
                  {documents.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      {documents.map((doc) => (
                        <DocChip
                          key={doc.id}
                          name={doc.name}
                          sizeBytes={doc.sizeBytes}
                          onRemove={() => removeDocument(doc.id)}
                          compact
                        />
                      ))}
                    </div>
                  )}
                  <ChatInput
                    ref={inputRef}
                    onSend={({ message }) => void handleSendMessage(message)}
                    onFileSelect={(files) => void handleFileUpload(files)}
                    isLoading={isAnswering}
                    onStop={handleStop}
                    placeholder="How can I help you today?"
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

interface EmptyStateProps {
  greeting: string;
  userName: string;
  documents: UploadedDocument[];
  onRemoveDocument: (id: string) => void;
  onSend: (text: string) => void;
  onFileSelect: (files: FileList) => void;
  isUploading: boolean;
  isAnswering: boolean;
  onStop: () => void;
  inputRef: React.RefObject<ChatInputHandle | null>;
  quickPills: QuickPill[];
}

function EmptyState({
  greeting,
  userName,
  documents,
  onRemoveDocument,
  onSend,
  onFileSelect,
  isAnswering,
  onStop,
  inputRef,
  quickPills,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-[820px]">
        <h1
          className="mb-6 text-center text-[clamp(34px,4.5vw,52px)] font-medium leading-[1.05] tracking-[-0.018em] text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {greeting ? `${greeting}, ` : ""}
          <span className="italic" style={{ color: "var(--color-govdoc-navy)" }}>
            {userName}
          </span>
          .
        </h1>

        {documents.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {documents.map((doc) => (
              <DocChip
                key={doc.id}
                name={doc.name}
                sizeBytes={doc.sizeBytes}
                onRemove={() => onRemoveDocument(doc.id)}
                compact
              />
            ))}
          </div>
        )}

        <ChatInput
          ref={inputRef}
          onSend={({ message }) => onSend(message)}
          onFileSelect={onFileSelect}
          isLoading={isAnswering}
          onStop={onStop}
          placeholder="How can I help you today?"
        />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {quickPills.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => inputRef.current?.setMessage(p.prompt)}
              className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-2.5 text-[15px] font-semibold text-[var(--color-ink-soft)] shadow-sm transition-colors hover:border-[var(--color-govdoc-navy)] hover:text-[var(--color-govdoc-navy)]"
            >
              <p.icon className="size-4" />
              {p.label}
            </button>
          ))}
        </div>

        <p className="mt-7 text-center text-[14.5px] text-[var(--color-ink-mute)]">
          <FileText className="mr-1.5 inline size-3.5 -translate-y-px" />
          Ask anything — attach a PDF or DOCX to ground the answer in its contents.
        </p>
      </div>
    </div>
  );
}
