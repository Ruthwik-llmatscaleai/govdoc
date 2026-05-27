"use client";

import * as React from "react";
import { Check, Copy, FileText, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/search-ask/chat-service";
import { Markdown } from "./markdown";

interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[78%] rounded-2xl rounded-br-md border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-4 py-2.5 text-[15.5px] leading-[1.6] text-[var(--color-ink)]"
        style={{ fontFamily: "var(--font-source-sans)" }}
      >
        {content}
      </div>
    </div>
  );
}

interface AssistantMessageProps {
  content: string;
  citations?: Citation[];
  sources?: Array<{ documentName: string }>;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function AssistantMessage({
  content,
  citations,
  sources,
  showRetry,
  onRetry,
}: AssistantMessageProps) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group flex items-start gap-3">
      <Avatar />
      <div className="flex-1">
        <div
          className="text-[15.5px] leading-[1.7] text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-source-sans)" }}
        >
          <Markdown>{content}</Markdown>
        </div>

        {citations && citations.length > 0 ? (
          <CitationsCollapsible citations={citations} />
        ) : sources && sources.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sources.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink-mute)]"
              >
                <FileText className="size-2.5" />
                {s.documentName}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <ActionButton onClick={onCopy} label={copied ? "Copied" : "Copy"}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </ActionButton>
          {showRetry && onRetry ? (
            <ActionButton onClick={onRetry} label="Retry">
              <RotateCcw className="size-3" />
            </ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Avatar({ pulsing = false }: { pulsing?: boolean }) {
  return (
    <div
      className={cn(
        "relative mt-1 flex size-7 shrink-0 items-center justify-center rounded-full",
        "bg-[var(--color-govdoc-navy-soft)] text-[var(--color-govdoc-navy)]",
      )}
    >
      <FileText className="size-3.5" strokeWidth={1.8} />
      {pulsing ? (
        <span className="absolute inset-0 animate-ping rounded-full border-2 border-[var(--color-govdoc-navy)]/50 opacity-50" />
      ) : null}
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex size-6 items-center justify-center rounded-md text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-cream-soft)] hover:text-[var(--color-ink)]"
    >
      {children}
    </button>
  );
}

function CitationsCollapsible({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink-mute)] transition-colors hover:border-[var(--color-govdoc-navy)] hover:bg-[var(--color-govdoc-navy-soft)] hover:text-[var(--color-govdoc-navy)]"
      >
        <FileText className="size-2.5" />
        {citations.length} citation{citations.length === 1 ? "" : "s"}
        <svg
          className={cn("size-3 transition-transform", open && "rotate-180")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {citations.map((cite, ci) => (
            <div
              key={ci}
              className="rounded-md border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-3 py-2"
            >
              <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-ink-mute)]">
                <FileText className="size-2.5" />
                {cite.documentName}
              </div>
              <p className="text-[12.5px] italic leading-[1.55] text-[var(--color-ink-soft)]">
                &ldquo;
                {cite.citedText.length > 240 ? cite.citedText.slice(0, 240) + "…" : cite.citedText}
                &rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ThinkingMessageProps {
  phase?: string;
  onStop?: () => void;
}

export function ThinkingMessage({ phase, onStop }: ThinkingMessageProps) {
  return (
    <div className="flex items-start gap-3">
      <Avatar pulsing />
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span
              className="block size-1.5 rounded-full bg-[var(--color-govdoc-navy)]"
              style={{ animation: "govdoc-typing 1.4s infinite ease-in-out" }}
            />
            <span
              className="block size-1.5 rounded-full bg-[var(--color-govdoc-navy)]"
              style={{ animation: "govdoc-typing 1.4s infinite ease-in-out", animationDelay: "150ms" }}
            />
            <span
              className="block size-1.5 rounded-full bg-[var(--color-govdoc-navy)]"
              style={{ animation: "govdoc-typing 1.4s infinite ease-in-out", animationDelay: "300ms" }}
            />
          </div>
          {phase ? <span className="text-[12px] text-[var(--color-ink-faint)]">{phase}</span> : null}
        </div>
        {onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink-mute)] transition-colors hover:border-[var(--color-govdoc-navy)] hover:text-[var(--color-govdoc-navy)]"
          >
            <svg viewBox="0 0 16 16" className="size-2.5" fill="currentColor">
              <rect x="4" y="4" width="8" height="8" rx="1" />
            </svg>
            Stop
          </button>
        ) : null}
        <style jsx>{`
          @keyframes govdoc-typing {
            0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-2px); }
          }
        `}</style>
      </div>
    </div>
  );
}
