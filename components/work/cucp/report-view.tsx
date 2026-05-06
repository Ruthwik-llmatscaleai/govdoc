"use client";
import ReactMarkdown from "react-markdown";

type Props = { markdown: string };

export function ReportView({ markdown }: Props) {
  return (
    <article className="prose prose-sm max-w-none border rounded p-4">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}
