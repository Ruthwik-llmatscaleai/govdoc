"use client";

import { Loader2 } from "lucide-react";

const CURSOR = (
  <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] animate-pulse bg-[#3D5740] align-middle" />
);

/**
 * Renders streaming assistant text. Plain text streams normally, but once an
 * artifact / govdoc-viz block starts, the raw code is hidden behind a contained
 * "Generating…" card instead of dumping JSON/tags into the chat. When the stream
 * finishes, the message re-renders via AssistantBody into the real tile/dashboard.
 */
export function StreamingContent({ text }: { text: string }) {
  const vizIdx = text.indexOf("```govdoc-viz");
  const artIdx = text.indexOf("<antArtifact");
  const markers = [vizIdx, artIdx].filter((i) => i >= 0);

  if (markers.length === 0) {
    return (
      <div className="whitespace-pre-wrap text-[15px] leading-[1.6] text-[#202821]" style={{ fontFamily: "var(--font-sans)" }}>
        {text}
        {CURSOR}
      </div>
    );
  }

  const cut = Math.min(...markers);
  const before = text.slice(0, cut).trimEnd();
  const isViz = vizIdx >= 0 && (artIdx < 0 || vizIdx <= artIdx);

  return (
    <div>
      {before && (
        <div className="whitespace-pre-wrap text-[15px] leading-[1.6] text-[#202821]" style={{ fontFamily: "var(--font-sans)" }}>
          {before}
        </div>
      )}
      <div className="my-3 flex items-center gap-2.5 rounded-xl border border-[#d6cfba] bg-[#FCFAF3] px-3.5 py-3">
        <Loader2 className="size-4 animate-spin text-[#3D5740]" />
        <span className="text-[13px] text-[#556157]" style={{ fontFamily: "var(--font-sans)" }}>
          Generating {isViz ? "dashboard" : "visual"}&hellip;
        </span>
      </div>
    </div>
  );
}
