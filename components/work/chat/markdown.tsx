"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";

interface MarkdownProps {
  children: string;
  className?: string;
}

const components: Components = {
  // Distinguish inline `code` from fenced ```code blocks by the `className`
  // react-markdown sets on fenced blocks (e.g. `language-ts`). Inline code has
  // no className.
  code({ className, children }) {
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
  // react-markdown wraps fenced blocks in <pre><code> by default. We render
  // our own card via the `code` override, so flatten the pre.
  pre({ children }) {
    return <>{children}</>;
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#b04a2f] underline-offset-[3px] hover:underline"
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="my-2.5 list-disc space-y-1 pl-5 text-[15.5px]">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2.5 list-decimal space-y-1 pl-5 text-[15.5px]">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-[1.6]">{children}</li>;
  },
  p({ children }) {
    return <p className="my-2.5 text-[15.5px] leading-[1.7]">{children}</p>;
  },
  h1({ children }) {
    return <h1 className="mb-2 mt-4 text-[20px] font-semibold tracking-[-0.012em] text-[var(--color-ink)]">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mb-2 mt-4 text-[17.5px] font-semibold tracking-[-0.012em] text-[var(--color-ink)]">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mb-1 mt-3 text-[16px] font-semibold text-[var(--color-ink)]">{children}</h3>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-3 border-l-[3px] border-[#b04a2f]/50 pl-3 text-[15px] italic leading-[1.6] text-[var(--color-ink-soft)]">
        {children}
      </blockquote>
    );
  },
  // Markdown tables in the chat response use the same elegant chrome as the
  // Validate Project / Narrative / Appraisal tables: rounded-xl wrapper with
  // drop shadow, sage gradient header, hairline + column-divider rules, zebra
  // body rows, sage hover.
  table({ children }) {
    return (
      <div className="my-4 overflow-hidden rounded-xl border border-[#b8ac90] bg-[var(--color-paper)] shadow-[0_8px_24px_-20px_rgba(40,69,53,0.35)]">
        <div className="overflow-x-auto">
          <table
            className={[
              "min-w-full border-separate border-spacing-0 text-[15px]",
              "[&_tbody_tr]:transition-colors",
              "[&_tbody_tr:nth-child(odd)]:bg-[var(--color-paper)]",
              "[&_tbody_tr:nth-child(even)]:bg-[rgba(184,172,144,0.08)]",
              "[&_tbody_tr:hover]:bg-[rgba(176,74,47,0.05)]",
              "[&_thead_th:not(:last-child)]:border-r [&_thead_th:not(:last-child)]:border-r-[#b8ac90]",
              "[&_tbody_td:not(:last-child)]:border-r [&_tbody_td:not(:last-child)]:border-r-[rgba(184,172,144,0.45)]",
            ].join(" ")}
          >
            {children}
          </table>
        </div>
      </div>
    );
  },
  thead({ children }) {
    return (
      <thead className="bg-gradient-to-b from-[#f5efe2] to-[var(--color-cream-soft)] text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
        {children}
      </thead>
    );
  },
  th({ children }) {
    return (
      <th className="border-b border-[#b8ac90] px-4 py-3 text-left align-top">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border-b border-[rgba(184,172,144,0.55)] px-4 py-3.5 align-top text-[15px] leading-[1.6] text-[var(--color-ink)]">
        {children}
      </td>
    );
  },
};

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className} style={{ fontFamily: "var(--font-source-sans)" }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
