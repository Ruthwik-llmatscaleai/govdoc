// Parsing for Claude-style <antArtifact> blocks AND ```govdoc-viz dashboard blocks
// emitted by the assistant, plus the type -> render-strategy mapping the artifact
// panel uses. Both kinds open in the side panel; viz blocks render as a finance
// dashboard (one or more charts). Adapted from the Athena reference, trimmed to
// what GovDoc needs.

export type RenderStrategy = "markdown" | "mermaid" | "svg" | "html" | "react" | "code" | "viz";

export interface Artifact {
  id: string;
  title: string;
  type: string; // raw MIME-ish type from the tag (text/html, text/markdown, ...)
  language?: string;
  content: string;
  strategy: RenderStrategy;
}

export type MessageSegment =
  | { kind: "text"; text: string }
  | { kind: "artifact"; artifact: Artifact };

// Matches an <antArtifact ...>...</antArtifact> tag OR a ```govdoc-viz fenced block.
const ARTIFACT_RE =
  /<antArtifact\s+([^>]*?)>([\s\S]*?)<\/(?:antArtifact|artifact)>|```govdoc-viz\s*\n?([\s\S]*?)```/g;

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrString)) !== null) {
    attrs[m[1]!] = m[2]!;
  }
  return attrs;
}

function strategyFor(type: string): RenderStrategy {
  switch (type) {
    case "text/markdown": return "markdown";
    case "text/mermaid": return "mermaid";
    case "image/svg+xml": return "svg";
    case "application/vnd.ant.react": return "react";
    case "text/html": return "html";
    default: return type.startsWith("text/html") ? "html" : "code";
  }
}

function tagArtifact(attrString: string, content: string, i: number): Artifact {
  const attrs = parseAttrs(attrString);
  const type = attrs.type ?? "text/html";
  return {
    id: attrs.identifier ?? `artifact-${i}`,
    title: attrs.title ?? "Artifact",
    type,
    language: attrs.language,
    content: content.trim(),
    strategy: strategyFor(type),
  };
}

function vizArtifact(json: string, i: number): Artifact {
  let title = "Financial dashboard";
  try {
    const parsed = JSON.parse(json) as { title?: string; charts?: unknown[] };
    if (parsed.title) title = parsed.title;
    else if (!parsed.charts) title = "Chart";
  } catch {
    // keep default title; VizBlock will show a JSON fallback if invalid
  }
  return { id: `viz-${i}`, title, type: "application/govdoc-viz", content: json.trim(), strategy: "viz" };
}

function matchToArtifact(m: RegExpExecArray, i: number): Artifact {
  // m[1]/m[2] = antArtifact attrs/content; m[3] = govdoc-viz JSON
  return m[3] !== undefined ? vizArtifact(m[3], i) : tagArtifact(m[1]!, m[2]!, i);
}

/** Does the text contain at least one artifact (tag or viz block)? */
export function hasArtifacts(text: string): boolean {
  ARTIFACT_RE.lastIndex = 0;
  return ARTIFACT_RE.test(text);
}

/** All artifacts in a message, in order. */
export function extractArtifacts(text: string): Artifact[] {
  const out: Artifact[] = [];
  ARTIFACT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = ARTIFACT_RE.exec(text)) !== null) out.push(matchToArtifact(m, i++));
  return out;
}

/** Split a message into ordered text/artifact segments for inline rendering. */
export function segmentMessageText(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  ARTIFACT_RE.lastIndex = 0;
  let lastIndex = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = ARTIFACT_RE.exec(text)) !== null) {
    const before = text.slice(lastIndex, m.index);
    if (before.trim()) segments.push({ kind: "text", text: before });
    segments.push({ kind: "artifact", artifact: matchToArtifact(m, i++) });
    lastIndex = m.index + m[0].length;
  }
  const tail = text.slice(lastIndex);
  if (tail.trim()) segments.push({ kind: "text", text: tail });
  if (segments.length === 0) segments.push({ kind: "text", text });
  return segments;
}
