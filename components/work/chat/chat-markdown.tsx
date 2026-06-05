"use client";

import ReactMarkdown, { type Components, type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { CodeBlock } from "./code-block";
import { MermaidBlock } from "./mermaid-block";
import { VizBlock } from "./viz/viz-block";

// Shared assistant-message markdown renderer. Keeps GovDoc's existing per-element
// styling (cream/green tokens) and adds: KaTeX math, Mermaid diagrams, and
// syntax-highlighted code blocks. Used by AssistantMessage in the chat page.

// singleDollarTextMath: false → don't treat "$...$" as inline math, so currency
// like "$20.2 million ... $20.6 million" no longer renders in the KaTeX math font.
// ($$...$$ still works for genuine display math.)
const REMARK_PLUGINS: Options["remarkPlugins"] = [remarkGfm, [remarkMath, { singleDollarTextMath: false }]];
const REHYPE_PLUGINS = [rehypeKatex];

const COMPONENTS: Components = {
  p({ children }) {
    return <p className="my-2.5 leading-[1.6]">{children}</p>;
  },
  strong({ children }) {
    return <strong className="font-semibold text-[#0E1410]">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
  h1({ children }) {
    return (
      <h1 className="mb-2 mt-5 text-[22px] font-semibold tracking-[-0.012em] text-[#0E1410]" style={{ fontFamily: "var(--font-display)" }}>
        {children}
      </h1>
    );
  },
  h2({ children }) {
    return (
      <h2 className="mb-2 mt-4 text-[19px] font-semibold tracking-[-0.012em] text-[#0E1410]" style={{ fontFamily: "var(--font-display)" }}>
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="mb-1 mt-3 text-[17px] font-medium text-[#0E1410]" style={{ fontFamily: "var(--font-display)" }}>
        {children}
      </h3>
    );
  },
  ul({ children }) {
    return <ul className="my-2.5 list-disc space-y-1 pl-5">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2.5 list-decimal space-y-1 pl-5">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-[1.6]">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-3 border-l-[3px] border-[#3D5740]/50 pl-3 text-[15px] italic leading-[1.6] text-[#556157]">
        {children}
      </blockquote>
    );
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#3D5740] underline underline-offset-[3px] hover:text-[#0E1410]">
        {children}
      </a>
    );
  },
  code({ className, children, node }) {
    const text = String(children ?? "").replace(/\n$/, "");
    const start = node?.position?.start?.line;
    const end = node?.position?.end?.line;
    const isBlock = Boolean(className) || (start != null && end != null && start !== end);

    if (!isBlock) {
      return <code className="rounded bg-[#F3EEE0] px-1.5 py-0.5 text-[12.5px] font-mono text-[#0E1410]">{children}</code>;
    }

    const lang = (className ?? "").replace(/^language-/, "");
    if (lang === "mermaid") return <MermaidBlock code={text} />;
    if (lang === "govdoc-viz") return <VizBlock raw={text} />;
    return <CodeBlock code={text} language={lang || undefined} />;
  },
  pre({ children }) {
    return <>{children}</>;
  },
  table({ children }) {
    return (
      <div className="my-4 overflow-hidden rounded-xl border border-[#d6cfba] bg-[#FCFAF3] shadow-[0_4px_12px_-8px_rgba(40,69,53,0.2)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-[14px] [&_tbody_tr:nth-child(even)]:bg-[#f7f5ed] [&_tbody_tr:hover]:bg-[#e8eadf]">
            {children}
          </table>
        </div>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-[#f7f2e6] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#556157]">{children}</thead>;
  },
  th({ children }) {
    return <th className="border-b border-[#d6cfba] px-4 py-2.5 text-left">{children}</th>;
  },
  td({ children }) {
    return <td className="border-b border-[#d6cfba]/50 px-4 py-3 leading-[1.5] text-[#0E1410]">{children}</td>;
  },
};

export function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="text-[15px] leading-[1.6] text-[#202821]" style={{ fontFamily: "var(--font-sans)" }}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} components={COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
