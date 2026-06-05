"use client";

import { BarChart3, Code2, FileText, GitBranch, Image as ImageIcon, LayoutTemplate, SquareCode } from "lucide-react";
import type { Artifact, RenderStrategy } from "@/lib/artifacts";

const META: Record<RenderStrategy, { label: string; Icon: typeof FileText }> = {
  markdown: { label: "Document", Icon: FileText },
  mermaid: { label: "Diagram", Icon: GitBranch },
  svg: { label: "Graphic", Icon: ImageIcon },
  html: { label: "Web preview", Icon: LayoutTemplate },
  react: { label: "React app", Icon: SquareCode },
  code: { label: "Code", Icon: Code2 },
  viz: { label: "Dashboard", Icon: BarChart3 },
};

/** Inline card shown in the message where an <antArtifact> appeared. Click → opens panel. */
export function ArtifactTile({ artifact, onOpen }: { artifact: Artifact; onOpen: () => void }) {
  const { label, Icon } = META[artifact.strategy];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group my-3 flex w-full items-center gap-3 rounded-xl border border-[#d6cfba] bg-[#FCFAF3] px-3.5 py-3 text-left transition-all hover:border-[#3D5740] hover:shadow-[0_4px_14px_-8px_rgba(40,69,53,0.35)]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#3D5740] text-[#FCFAF3] transition-transform group-hover:scale-105">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-[#0E1410]" style={{ fontFamily: "var(--font-display)" }}>
          {artifact.title}
        </span>
        <span className="text-[10px] uppercase tracking-[0.12em] text-[#8B877D]" style={{ fontFamily: "var(--font-mono)" }}>
          {label}
        </span>
      </span>
      <span className="shrink-0 rounded-full border border-[#d6cfba] px-2.5 py-1 text-[11px] font-medium text-[#556157] transition-colors group-hover:border-[#3D5740] group-hover:text-[#3D5740]">
        Open
      </span>
    </button>
  );
}
