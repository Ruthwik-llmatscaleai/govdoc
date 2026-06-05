"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Code, Eye, X } from "lucide-react";
import type { Artifact } from "@/lib/artifacts";
import { useArtifacts } from "@/store/use-artifacts";
import { ChatMarkdown } from "../chat-markdown";
import { MermaidBlock } from "../mermaid-block";
import { CodeBlock } from "../code-block";
import { VizBlock } from "../viz/viz-block";

const SandpackArtifact = dynamic(
  () => import("./sandpack-preview").then((m) => m.SandpackArtifact),
  { ssr: false, loading: () => <div className="p-4 text-[13px] text-[#8B877D]">Loading preview…</div> },
);

function codeLang(a: Artifact): string {
  switch (a.strategy) {
    case "markdown": return "markdown";
    case "svg": return "xml";
    case "html": return "html";
    case "react": return "jsx";
    case "mermaid": return "text";
    case "viz": return "json";
    case "code": return a.language ?? "text";
  }
}

function looksTypeScript(content: string): boolean {
  return content.includes("interface ") || content.includes(": JSX") || content.includes("React.FC");
}

function ArtifactBody({ artifact }: { artifact: Artifact }) {
  const canPreview = artifact.strategy !== "code";
  const [view, setView] = useState<"preview" | "code">(canPreview ? "preview" : "code");

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#d6cfba] bg-[#fcfaf3] px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#0E1410]" style={{ fontFamily: "var(--font-display)" }}>
          {artifact.title}
        </span>
        {canPreview && (
          <div className="flex items-center rounded-lg border border-[#d6cfba] p-0.5">
            <button
              type="button"
              onClick={() => setView("preview")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${view === "preview" ? "bg-[#3D5740] text-[#FCFAF3]" : "text-[#556157] hover:bg-[#F3EEE0]"}`}
            >
              <Eye className="size-3" /> Preview
            </button>
            <button
              type="button"
              onClick={() => setView("code")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${view === "code" ? "bg-[#3D5740] text-[#FCFAF3]" : "text-[#556157] hover:bg-[#F3EEE0]"}`}
            >
              <Code className="size-3" /> Code
            </button>
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {view === "code" ? (
          <div className="h-full overflow-auto p-3">
            <CodeBlock code={artifact.content} language={codeLang(artifact)} />
          </div>
        ) : artifact.strategy === "markdown" ? (
          <div className="h-full overflow-auto bg-[#F3EEE0] p-5">
            <ChatMarkdown content={artifact.content} />
          </div>
        ) : artifact.strategy === "mermaid" ? (
          <div className="h-full overflow-auto bg-[#F3EEE0] p-5">
            <MermaidBlock code={artifact.content} />
          </div>
        ) : artifact.strategy === "viz" ? (
          <div className="h-full overflow-auto bg-[#F3EEE0] p-4">
            <VizBlock raw={artifact.content} />
          </div>
        ) : artifact.strategy === "react" ? (
          <div className="h-full">
            <SandpackArtifact content={artifact.content} ts={looksTypeScript(artifact.content)} />
          </div>
        ) : (
          // svg | html → sandboxed iframe (scripts only for html)
          <iframe
            title={artifact.title}
            srcDoc={artifact.content}
            sandbox={artifact.strategy === "html" ? "allow-scripts" : ""}
            className="h-full w-full border-0 bg-white"
          />
        )}
      </div>
    </div>
  );
}

/** Right-side artifact panel. Reads open state from the artifacts store. */
export function ArtifactPanel() {
  const { artifacts, index, setIndex, close } = useArtifacts();
  const current = artifacts[index];
  if (!current) return null;

  return (
    <div className="flex h-full flex-col border-l border-[#d6cfba] bg-[#FCFAF3]">
      {/* Top bar: tabs + close */}
      <div className="flex shrink-0 items-center gap-1 border-b border-[#d6cfba] bg-[#fcfaf3] px-2 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {artifacts.length > 1 &&
            artifacts.map((a, i) => (
              <button
                key={a.id + i}
                type="button"
                onClick={() => setIndex(i)}
                className={`max-w-[160px] truncate rounded-md px-2 py-1 text-[11px] ${i === index ? "bg-[#e8eadf] text-[#0E1410]" : "text-[#6E706A] hover:bg-[#F3EEE0]"}`}
              >
                {a.title}
              </button>
            ))}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close artifact panel"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#6E706A] hover:bg-[#F3EEE0] hover:text-[#0E1410]"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <ArtifactBody key={current.id} artifact={current} />
      </div>
    </div>
  );
}
