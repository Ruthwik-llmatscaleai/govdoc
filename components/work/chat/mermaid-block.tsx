"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Renders a fenced ```mermaid block as an SVG diagram. Adapted from Athena's
 * mermaid-viewer: lazy-loads mermaid, securityLevel "strict", light theme to
 * match GovDoc's cream chat, with an error + retry state. Falls back to showing
 * the raw source on failure so the content is never lost.
 */
export function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  // The effect's first statement is an await (dynamic import), so no state is set
  // synchronously within the effect body — satisfies react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "strict",
          fontFamily: "inherit",
        });
        const id = `mermaid-${Math.abs(hashCode(code))}-${nonce}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (cancelled) return;
        if (containerRef.current) containerRef.current.innerHTML = svg;
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to render diagram");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, nonce]);

  const retry = () => {
    setError(null);
    setLoading(true);
    setNonce((n) => n + 1);
  };

  if (error) {
    return (
      <div className="my-3 rounded-xl border border-[#d6cfba] bg-[#FCFAF3] p-4">
        <div className="flex items-center gap-2 text-[12px] text-[#9a3b2f]">
          <AlertCircle className="size-3.5" />
          Couldn&apos;t render diagram
          <button
            type="button"
            onClick={retry}
            className="ml-auto flex items-center gap-1 rounded-md border border-[#d6cfba] px-1.5 py-0.5 text-[11px] text-[#556157] hover:bg-[#e8eadf]"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
        <pre className="mt-2 overflow-x-auto font-mono text-[12px] text-[#6E706A]">{code}</pre>
      </div>
    );
  }

  return (
    <div className="my-3 overflow-auto rounded-xl border border-[#d6cfba] bg-[#FCFAF3] p-4">
      {loading && (
        <div className="flex items-center justify-center py-6 text-[#8B877D]">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="flex justify-center [&_svg]:h-auto [&_svg]:max-w-full" />
    </div>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
