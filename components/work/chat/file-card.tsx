"use client";

import { X, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttachedFile {
  id: string;
  file: File;
  type: string;
  preview: string | null;
  uploadStatus: "pending" | "uploading" | "complete" | "error";
  content?: string;
}

interface FilePreviewCardProps {
  file: AttachedFile;
  onRemove: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Square 96x96 file preview card shown above the input while a file is being attached. */
export function FilePreviewCard({ file, onRemove }: FilePreviewCardProps) {
  const isImage = file.type.startsWith("image/") && !!file.preview;
  const ext = file.file.name.split(".").pop()?.toLowerCase() ?? "file";

  return (
    <div className="group relative size-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] transition-colors hover:border-[var(--color-govdoc-navy)]">
      {isImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.preview!} alt={file.file.name} className="size-full object-cover" />
          <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/0" />
        </>
      ) : (
        <div className="flex h-full w-full flex-col justify-between p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-[var(--color-cream)] p-1">
              <FileText className="size-3.5 text-[var(--color-ink-mute)]" />
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
              {ext}
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="truncate text-[11px] font-semibold text-[var(--color-ink)]" title={file.file.name}>
              {file.file.name}
            </p>
            <p className="text-[10px] text-[var(--color-ink-faint)]">{formatBytes(file.file.size)}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100"
        title="Remove"
      >
        <X className="size-3" />
      </button>

      {file.uploadStatus === "uploading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <Loader2 className="size-5 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}

interface DocChipProps {
  name: string;
  sizeBytes: number;
  onRemove?: () => void;
  compact?: boolean;
}

/** Compact chip used to show documents already uploaded to the conversation. */
export function DocChip({ name, sizeBytes, onRemove, compact }: DocChipProps) {
  const isPdf = name.toLowerCase().endsWith(".pdf");
  const badge = isPdf ? "PDF" : "DOC";
  const badgeColor = isPdf ? "bg-[#b04a2f]" : "bg-[var(--color-govdoc-navy)]";

  if (compact) {
    return (
      <div className="group flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1 text-[11px]">
        <span className={cn("flex size-4 items-center justify-center rounded text-[7px] font-bold text-white", badgeColor)}>
          {isPdf ? "P" : "D"}
        </span>
        <span className="font-semibold text-[var(--color-ink-soft)]">
          {name.length > 22 ? name.slice(0, 20) + "…" : name}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-0.5 text-[var(--color-ink-faint)] opacity-0 transition-opacity hover:text-[var(--destructive)] group-hover:opacity-100"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 shadow-sm">
      <span className={cn("flex size-7 items-center justify-center rounded-md text-[9px] font-bold text-white", badgeColor)}>
        {badge}
      </span>
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-[var(--color-ink)]">{name}</span>
        <span className="text-[11px] text-[var(--color-ink-faint)]">{formatBytes(sizeBytes)}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 flex size-5 items-center justify-center rounded-full text-[var(--color-ink-faint)] opacity-0 transition-opacity hover:bg-[var(--color-cream-soft)] hover:text-[var(--destructive)] group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
