"use client";

import * as React from "react";
import { FolderOpen, MessageSquare, PanelLeftClose, PencilLine, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ConversationListEntry {
  id: string;
  firstMessage: string;
  timestamp: string;
}

interface ChatSidebarProps {
  open: boolean;
  onToggle: () => void;
  conversations: ConversationListEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  canStartNew: boolean;
  onOpenSettings?: () => void;
}

/**
 * Sage-themed conversation rail. Three vertical bands:
 *  - Brand header — sage square + "Search & Ask" wordmark, plus collapse toggle
 *  - Action group — sage-filled "New chat" CTA + outlined Projects link
 *  - Recents — sectioned by recency, selected item gets a sage left rule
 *  - Footer — Settings + a small "Powered by Claude" trust tag, on a dark hairline
 *
 * Visibility is owned by the parent. When collapsed, the parent renders its
 * own "open" button in the main column header.
 */
export function ChatSidebar({
  open,
  onToggle,
  conversations,
  selectedId,
  onSelect,
  onNewChat,
  canStartNew,
  onOpenSettings,
}: ChatSidebarProps) {
  const groups = React.useMemo(() => groupByRecency(conversations), [conversations]);

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-[#b8ac90] bg-gradient-to-b from-[#fbf8ef] to-[var(--color-cream)] transition-[width] duration-200",
        open ? "w-[280px]" : "w-0 overflow-hidden",
      )}
      style={{ fontFamily: "var(--font-source-sans)" }}
    >
      {/* Brand header — small sage tile with wordmark to match the GovDoc shell */}
      <div className="flex items-center justify-between border-b border-[#b8ac90] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-[#b04a2f] text-[#fbf8ef] shadow-[0_2px_8px_-3px_rgba(176,74,47,0.5)]">
            <Sparkles className="size-3.5" strokeWidth={2.2} />
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.005em] text-[var(--color-ink)]">
            Search &amp; Ask
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          title="Collapse sidebar"
          className="flex size-7 items-center justify-center rounded-md text-[var(--color-ink-mute)] transition-colors hover:bg-[rgba(176,74,47,0.10)] hover:text-[#b04a2f]"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      {/* Actions — quiet sidebar nav rows: sage icon tile + ink label, full
          row hover. Pencil-edit affordance on "New chat" to signal it's a
          composer, not a destination. */}
      <div className="flex flex-col px-2 py-2">
        <button
          type="button"
          onClick={onNewChat}
          disabled={!canStartNew}
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[14.5px] font-semibold transition-colors",
            canStartNew
              ? "text-[var(--color-ink)] hover:bg-[rgba(176,74,47,0.08)]"
              : "cursor-not-allowed text-[var(--color-ink-faint)]",
          )}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
              canStartNew
                ? "bg-[rgba(176,74,47,0.12)] text-[#b04a2f] group-hover:bg-[#b04a2f] group-hover:text-[#fbf8ef]"
                : "bg-[var(--color-cream-soft)] text-[var(--color-ink-faint)]",
            )}
          >
            <PencilLine className="size-3.5" strokeWidth={2} />
          </span>
          <span className="flex-1">New chat</span>
          {canStartNew && (
            <kbd className="hidden rounded-md border border-[#b8ac90] bg-[var(--color-paper)] px-1.5 py-0.5 text-[10.5px] font-medium tracking-wide text-[var(--color-ink-mute)] group-hover:inline-flex">
              ⌘N
            </kbd>
          )}
        </button>
        <Link
          href={"/work/review" as never}
          className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[14.5px] font-semibold text-[var(--color-ink)] transition-colors hover:bg-[rgba(176,74,47,0.08)]"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[rgba(176,74,47,0.12)] text-[#b04a2f] transition-colors group-hover:bg-[#b04a2f] group-hover:text-[#fbf8ef]">
            <FolderOpen className="size-3.5" strokeWidth={2} />
          </span>
          <span className="flex-1">Projects</span>
        </Link>
      </div>

      {/* Recents — eyebrow + grouped list */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-t border-[#b8ac90]/60 px-4 pb-2 pt-3">
          <MessageSquare className="size-3.5 text-[#b04a2f]" strokeWidth={2} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b04a2f]">
            Recent chats
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {conversations.length === 0 ? null : (
            groups.map((g) => (
              <div key={g.label} className="mt-3">
                <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
                  {g.label}
                </div>
                <div className="flex flex-col gap-0.5">
                  {g.items.map((conv) => {
                    const isActive = conv.id === selectedId;
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => onSelect(conv.id)}
                        className={cn(
                          "group relative flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
                          isActive
                            ? "bg-[rgba(176,74,47,0.10)] text-[var(--color-ink)] ring-1 ring-[#b04a2f]/30"
                            : "text-[var(--color-ink-soft)] hover:bg-[rgba(176,74,47,0.06)] hover:text-[var(--color-ink)]",
                        )}
                        title={conv.firstMessage}
                      >
                        {isActive && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[#b04a2f]"
                          />
                        )}
                        <span
                          className={cn(
                            "truncate text-[13.5px] leading-tight",
                            isActive ? "font-semibold" : "font-medium",
                          )}
                        >
                          {conv.firstMessage.length > 32
                            ? conv.firstMessage.slice(0, 32) + "…"
                            : conv.firstMessage}
                        </span>
                        <span className="truncate text-[11px] font-medium text-[var(--color-ink-faint)]">
                          {formatRelative(conv.timestamp)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer — Settings only */}
      <div className="border-t border-[#b8ac90] p-2.5">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:bg-[rgba(176,74,47,0.06)] hover:text-[#b04a2f]"
          title="Settings"
        >
          <Settings className="size-4 text-[#b04a2f]" strokeWidth={2} />
          Settings
        </button>
      </div>
    </aside>
  );
}

function formatRelative(timestamp: string): string {
  const t = new Date(timestamp).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "Just now";
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function groupByRecency(
  conversations: ConversationListEntry[],
): Array<{ label: string; items: ConversationListEntry[] }> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const within14: ConversationListEntry[] = [];
  const within30: ConversationListEntry[] = [];
  const older: ConversationListEntry[] = [];

  for (const c of conversations) {
    const t = new Date(c.timestamp).getTime();
    if (!Number.isFinite(t)) {
      older.push(c);
      continue;
    }
    const delta = now - t;
    if (delta < 14 * day) within14.push(c);
    else if (delta < 30 * day) within30.push(c);
    else older.push(c);
  }

  const out: Array<{ label: string; items: ConversationListEntry[] }> = [];
  if (within14.length > 0) out.push({ label: "Previous 14 days", items: within14 });
  if (within30.length > 0) out.push({ label: "Previous 30 days", items: within30 });
  if (older.length > 0) out.push({ label: "Older", items: older });
  return out;
}
