"use client";

import * as React from "react";
import { Plus, Paperclip, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArrowUp, SquareStop, VoiceWave } from "./icons";
import { FilePreviewCard, type AttachedFile } from "./file-card";

export interface ChatInputHandle {
  setMessage: (text: string) => void;
  focus: () => void;
}

interface PastedSnippet {
  id: string;
  content: string;
}

interface ChatInputProps {
  /** Called on send with the typed message plus any attached files/pastes. */
  onSend: (data: { message: string; files: File[]; pasted: string[] }) => void;
  /** Called when the user picks files via the paperclip / drag-and-drop. */
  onFileSelect?: (files: FileList) => void;
  placeholder?: string;
  isLoading?: boolean;
  /** When true, the send button becomes a stop button. */
  onStop?: () => void;
  /** Allow drag-and-drop onto the input itself. */
  acceptDrop?: boolean;
  /** Accept attribute for the hidden file input. */
  accept?: string;
}

const PastedContentCard: React.FC<{ snippet: PastedSnippet; onRemove: (id: string) => void }> = ({ snippet, onRemove }) => (
  <div className="group relative size-28 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-cream-soft)] p-3 shadow-sm">
    <p className="line-clamp-4 break-words font-mono text-[10px] leading-[1.4] text-[var(--color-ink-mute)]">
      {snippet.content}
    </p>
    <div className="mt-2 flex items-center">
      <span className="inline-flex items-center rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-wider text-[var(--color-ink-mute)]">
        Pasted
      </span>
    </div>
    <button
      type="button"
      onClick={() => onRemove(snippet.id)}
      className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-faint)] opacity-0 shadow-sm transition-opacity hover:text-[var(--color-ink)] group-hover:opacity-100"
      title="Remove"
    >
      <svg viewBox="0 0 16 16" className="size-2" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <line x1="3" y1="3" x2="13" y2="13" />
        <line x1="13" y1="3" x2="3" y2="13" />
      </svg>
    </button>
  </div>
);

export const ChatInput = React.forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  { onSend, onFileSelect, placeholder = "Ask a question about your documents…", isLoading, onStop, acceptDrop = true, accept = ".pdf,.docx,.doc,.txt,.csv" },
  ref,
) {
  const [message, setMessage] = React.useState("");
  const [files, setFiles] = React.useState<AttachedFile[]>([]);
  const [pasted, setPasted] = React.useState<PastedSnippet[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [plusOpen, setPlusOpen] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const plusRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => ({
    setMessage: (text) => {
      setMessage(text);
      textareaRef.current?.focus();
    },
    focus: () => textareaRef.current?.focus(),
  }));

  // Auto-resize textarea up to a cap (24 lines ~= 384px).
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 384) + "px";
  }, [message]);

  // Close the + menu on outside click.
  React.useEffect(() => {
    if (!plusOpen) return;
    function onDown(e: MouseEvent) {
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) setPlusOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [plusOpen]);

  function attachFiles(list: FileList | File[]) {
    const arr = Array.from(list);
    const next: AttachedFile[] = arr.map((file) => {
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
      return {
        id: Math.random().toString(36).slice(2, 11),
        file,
        type: isImage ? "image/unknown" : file.type || "application/octet-stream",
        preview: isImage ? URL.createObjectURL(file) : null,
        uploadStatus: "pending",
      };
    });
    setFiles((p) => [...p, ...next]);
    // The actual upload is handled by the parent. We only show the preview cards
    // until the parent reports completion; flip status to 'complete' after a beat
    // so the user gets visual feedback if the parent doesn't update us.
    next.forEach((f) => {
      window.setTimeout(() => {
        setFiles((p) => p.map((x) => (x.id === f.id ? { ...x, uploadStatus: "complete" } : x)));
      }, 600);
    });
    // Bubble raw FileList up so the parent can POST to /api/upload.
    if (onFileSelect) {
      const dt = new DataTransfer();
      arr.forEach((f) => dt.items.add(f));
      onFileSelect(dt.files);
    }
  }

  function onDragOver(e: React.DragEvent) {
    if (!acceptDrop) return;
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave(e: React.DragEvent) {
    if (!acceptDrop) return;
    e.preventDefault();
    setDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    if (!acceptDrop) return;
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) attachFiles(e.dataTransfer.files);
  }

  function onPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.kind === "file") {
        const f = item.getAsFile();
        if (f) pastedFiles.push(f);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      attachFiles(pastedFiles);
      return;
    }
    const text = e.clipboardData.getData("text");
    if (text.length > 300) {
      e.preventDefault();
      setPasted((p) => [...p, { id: Math.random().toString(36).slice(2, 11), content: text }]);
    }
  }

  function handleSend() {
    if (isLoading) return;
    if (!message.trim() && pasted.length === 0) return;
    onSend({ message: message.trim(), files: files.map((f) => f.file), pasted: pasted.map((p) => p.content) });
    setMessage("");
    setFiles([]);
    setPasted([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape" && isLoading && onStop) {
      onStop();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isLoading) return;
      handleSend();
    }
  }

  const hasContent = message.trim().length > 0 || pasted.length > 0;

  return (
    <div
      className="relative w-full"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        className={cn(
          "flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] shadow-sm transition-all",
          "focus-within:border-[var(--color-govdoc-navy)] focus-within:shadow-[0_0_0_3px_var(--color-govdoc-navy-soft)]",
        )}
      >
        <div className="flex flex-col gap-2 px-3 pb-2 pt-3">
          {(files.length > 0 || pasted.length > 0) && (
            <div className="flex gap-3 overflow-x-auto px-1 pb-2">
              {pasted.map((p) => (
                <PastedContentCard
                  key={p.id}
                  snippet={p}
                  onRemove={(id) => setPasted((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
              {files.map((f) => (
                <FilePreviewCard
                  key={f.id}
                  file={f}
                  onRemove={(id) => setFiles((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          )}

          <div className="relative mb-1">
            <div className="max-h-96 min-h-[2.5rem] w-full overflow-y-auto break-words pl-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={onPaste}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="block w-full resize-none border-0 bg-transparent py-0 text-[15px] leading-relaxed text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
                rows={1}
                autoFocus
                style={{ minHeight: "1.5em" }}
              />
            </div>
          </div>

          <div className="flex w-full items-center gap-2">
            <div className="relative flex min-w-0 flex-1 shrink items-center gap-1">
              <div className="relative" ref={plusRef}>
                <button
                  type="button"
                  aria-label="More options"
                  aria-expanded={plusOpen}
                  onClick={() => setPlusOpen((v) => !v)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg transition-colors active:scale-95",
                    plusOpen
                      ? "bg-[var(--color-cream)] text-[var(--color-ink)]"
                      : "text-[var(--color-ink-mute)] hover:bg-[var(--color-cream-soft)] hover:text-[var(--color-ink)]",
                  )}
                  title="Attach files"
                >
                  <Plus className={cn("size-5 transition-transform", plusOpen && "rotate-45")} />
                </button>

                {plusOpen && (
                  <div className="absolute bottom-full left-0 z-50 mb-2 flex w-[220px] flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] py-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setPlusOpen(false);
                      }}
                      className="mx-1 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-cream-soft)]"
                    >
                      <Paperclip className="size-[18px] text-[var(--color-ink-mute)]" />
                      <span className="text-[14px] text-[var(--color-ink)]">Add files or photos</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-1">
              {isLoading ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="flex size-8 items-center justify-center rounded-xl bg-[var(--color-ink)] text-white transition-opacity hover:opacity-90 active:scale-95"
                  title="Stop generating"
                >
                  <SquareStop className="size-3" />
                </button>
              ) : hasContent ? (
                <button
                  type="button"
                  onClick={handleSend}
                  className="flex size-8 items-center justify-center rounded-xl bg-[var(--color-govdoc-navy)] text-white shadow-md transition-colors hover:bg-[var(--color-govdoc-navy-deep)] active:scale-95"
                  title="Send"
                >
                  <ArrowUp className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex size-8 cursor-default items-center justify-center rounded-xl bg-[var(--color-cream)] text-[var(--color-ink-faint)]"
                  title="Use voice mode (coming soon)"
                  aria-label="Voice input"
                  disabled
                >
                  <VoiceWave className="size-[18px]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-govdoc-navy)] bg-[var(--color-cream)]/85 backdrop-blur-sm">
          <Archive className="mb-2 size-10 animate-bounce text-[var(--color-govdoc-navy)]" />
          <p className="font-medium text-[var(--color-govdoc-navy)]">Drop files to upload</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) attachFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
});
