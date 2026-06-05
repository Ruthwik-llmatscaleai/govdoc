# GovDoc Chat — Visual Rendering Plan (Markdown → Cards → Artifacts)

**Date:** 2026-06-03
**Status:** Draft for review
**Branch:** `sunnyvale-qna`
**Reference project:** `Claude_ai_athena` (`llmatscale-ai`) — the prior app whose visual stack we are porting from

## Context

GovDoc's chat ("Search & Ask") currently renders **text only**. Answers come back from
a non-streaming `POST /api/chat` as `{ answer: { content, sources } }` and are displayed
by the `AssistantMessage` component (`app/work/chat/page.tsx:871`) using `ReactMarkdown`
+ `remark-gfm` with custom components (paragraphs, headings, lists, blockquotes, links,
tables, and *unhighlighted* code blocks) plus a collapsible citations section.

We want to "plan big" for **visual** output: syntax-highlighted code, math, diagrams,
data/stat cards (especially for finance), and a Claude-style **artifact side-panel** with
live preview and document viewers.

The prior project **`Claude_ai_athena`** already implements all of this. Most of its
renderers are **decoupled from the Vercel AI SDK** and take plain strings/props, so they
port cleanly. The one architectural fork is **streaming**: Athena streams via the AI SDK
`useChat` parts model (text / reasoning / tool / artifact); GovDoc returns a single JSON
blob. That difference gates the later phases, not the early ones.

> Reference paths below point into
> `C:\Users\danis\Documents\backup\two_applications\Claude_ai_athena`.

## Goals / non-goals

**Goals:** richer, trustworthy visual answers in the existing chat — without breaking the
current upload-based flow or the finance KB routing already shipped.

**Non-goals (for now):** replacing the chat engine wholesale; adopting the full Athena
backend (Anthropic Files API, container skills); a generic "build me an app" artifact
playground. We adapt selectively, themed to GovDoc.

## Design constraint: theme + altitude

Athena's components use an oklch grayscale theme. GovDoc uses its own tokens — **cream +
forest green** in chat (`#FCFAF3`, `#3D5740`, ink `#0E1410`), Fraunces / Inter Tight /
JetBrains Mono. **Port the logic, restyle the surface.** Do not copy Athena's CSS theme;
map every ported component onto GovDoc tokens.

---

## Phased plan

### Phase 1 — Rich content rendering *(no backend change; low risk; high value)*

Upgrade what the model can already express in a string response.

1. **Extract a shared `<ChatMarkdown>` component** from the inline `ReactMarkdown` config in
   `AssistantMessage` (`app/work/chat/page.tsx:898-942`) into
   `components/work/chat/chat-markdown.tsx`, keeping GovDoc's existing styled components.
2. **Syntax-highlighted code blocks** — port Athena `components/prompt-kit/code-block.tsx`
   (uses `react-syntax-highlighter` Prism + copy button + conditional line numbers),
   restyled to GovDoc. Replace the current plain `<pre>` code branch.
3. **Math** — add `remark-math` + `rehype-katex` to the markdown pipeline and import
   `katex/dist/katex.min.css` once (mirrors Athena `prompt-kit/markdown.tsx`).
4. **Mermaid diagrams** — port `components/viewers/mermaid-viewer.tsx` (lazy-loads
   `mermaid`, `securityLevel:"strict"`); render fenced ```mermaid blocks as diagrams.

**Deliverable:** budget data renders as clean tables, comparisons as mermaid bar/pie
charts, formulas via KaTeX, any code highlighted — all from today's string responses.
**Deps added:** `react-syntax-highlighter`, `remark-math`, `rehype-katex`, `katex`,
`mermaid`. **Touch:** `app/work/chat/page.tsx`, new `components/work/chat/*`.

### Phase 2 — Finance visual cards *(GovDoc-specific; the highest-leverage visual)*

This is where Athena's "visual card" idea maps best onto GovDoc. Rather than free-form
artifacts, render **structured data cards** for finance answers:

- **Stat / KPI cards** (e.g., "Total Operating Budget — $392.6M") and **breakdown bar
  charts** (departments by spend), driven by data — *not* by the model emitting HTML.
- Two possible data sources:
  - **(a) From the F2 `BudgetFact` store** (see `2026-06-03-sunnyvale-finance-kb.md`): the
    query tools return structured rows → render a typed `<BudgetCard>` / `<BudgetBarChart>`.
    Most reliable; numbers are reconciled.
  - **(b) Model-emitted typed block** — the finance system prompt instructs the model to
    append a fenced ` ```govdoc-chart ` JSON block; the renderer parses it into a card.
    Faster to ship, less reliable than (a).
- Reuse Athena's **card visual language** (`prompt-kit/artifact-tile.tsx`,
  `file-card.tsx` — tilted icon, title, category label, action) restyled to GovDoc, but
  back it with finance data instead of generic artifacts.

**Recommendation:** ship (b) as a lightweight first cut, then move to (a) once the
`BudgetFact` store lands. **Deps:** a small chart primitive (Tremor is already in
GovDoc's stack per the README, or `recharts`). **Touch:** `chat-markdown.tsx` (detect the
typed block), new `components/work/chat/cards/*`, finance system prompt in
`app/api/chat/route.ts`.

### Phase 3 — Artifact side-panel + viewers *(bigger lift; works without streaming)*

Port Athena's Claude-style artifact system. It can run on GovDoc's **non-streaming**
responses by parsing the final assistant text for artifact tags.

Port these (restyled), in dependency order:
- `lib/artifacts.ts` + `lib/artifact-parser.ts` — the `<antArtifact …>` tag parser +
  `segmentMessageText()` (splits a message into text/artifact segments) + the
  type→render-strategy map.
- `lib/file-classifier.ts` — extension → render strategy.
- `components/prompt-kit/artifact-tile.tsx` — inline tile (streaming + completed states).
- `components/artifact-panel-wrapper.tsx` + `artifact-preview.tsx` — the side panel
  (tabs, Preview/Code toggle, 3-phase open/close animation in `app/artifact-panel.css`).
- `components/sandpack-preview.tsx` — live React/HTML preview (`@codesandbox/sandpack-react`).
- `components/viewers/{pdf,docx,xlsx,pptx}-viewer.tsx` — inline document previews.
- `hooks/use-file-content.ts` — content cache (swap Athena's localStorage/Anthropic-Files
  auth for GovDoc's session + S3/`/api/files`).

**Layout:** wrap the chat in `react-resizable-panels` `PanelGroup` — `Panel` (chat) +
`PanelResizeHandle` + `Panel` (artifact), mirroring Athena `full-chat-app.tsx:1567+`. The
panel mounts only when an artifact opens.

**Driver:** add artifact-emission rules to the chat system prompt (Athena
`lib/system-prompts.ts`) — but **scope tightly** for a government tool (prefer
markdown/mermaid/SVG artifacts; be cautious with arbitrary HTML/JS; Sandpack/iframes are
sandboxed but still a review item).

**Deps added:** `@codesandbox/sandpack-react`, `mammoth`, `xlsx`, `jszip`,
`react-resizable-panels`, `motion`. **Touch:** `app/work/chat/page.tsx` (layout + tile
wiring), new `components/artifact*`, `components/viewers/*`, `lib/artifact*`.

### Phase 4 — Streaming + tool/reasoning timelines *(optional; backend change)*

The richest Athena visuals (smooth typewriter streaming, collapsible **reasoning**,
**tool-call timelines**, live artifact streaming) need `/api/chat` to **stream**.

- Convert `POST /api/chat` to a streamed response (manual SSE like the existing
  `lib/sse/stream.ts`, or adopt the Vercel AI SDK `useChat`).
- Port `prompt-kit/streaming-text.tsx` + `hooks/use-smooth-streaming.ts`,
  `prompt-kit/reasoning.tsx`, `tool.tsx` / `tool-card.tsx` / `tool-timeline.tsx`,
  `steps.tsx`, `chat-container.tsx` / `scroll-button.tsx` / `loader.tsx`.
- Map stream part types → components (text→StreamingText, reasoning→Reasoning,
  tool→ToolCard, file→FileCard, artifact→ArtifactTile).

**This is the "plan big" core** but also the largest change; defer until Phases 1–3 prove
value. **Touch:** `app/api/chat/route.ts` (streaming), `app/work/chat/page.tsx` (consume
parts), new `components/work/chat/*`.

---

## Portability summary (from the reference read)

| Athena piece | Coupling | Port effort |
|---|---|---|
| markdown / code-block / mermaid / katex | none (plain strings) | **Low** |
| streaming-text + use-smooth-streaming | none | Low (but needs streaming backend to matter) |
| reasoning / tool-card / tool-timeline | AI SDK *parts* shape | Medium (Phase 4) |
| artifact parser + tile + panel + preview | self-contained; auth via callback | Medium |
| sandpack-preview | `@codesandbox/sandpack-react` only | Low–Medium |
| viewers (pdf/docx/xlsx/pptx) | mammoth/xlsx/jszip; data via callbacks | Low–Medium |
| use-file-content | localStorage token + `/api/files` | Medium (swap to GovDoc session + S3) |

## Key decisions to confirm

1. **Phase 2 data source** — model-emitted chart block (fast) vs. `BudgetFact` store
   (reliable). Recommend start model-emitted, migrate to the store.
2. **Streaming** — do we commit to converting `/api/chat` to streaming (Phase 4), or stay
   non-streaming and rely on Phases 1–3? Streaming unlocks the best UX but is the biggest
   change.
3. **Artifact scope/safety** — for a government tool, which artifact types do we allow
   (markdown / mermaid / SVG / sandboxed HTML / React)? Recommend start with
   markdown + mermaid + SVG; gate HTML/React behind review.
4. **Chart library** — Tremor (already in GovDoc's stack) vs. recharts vs. mermaid-only.

## Recommended sequencing

Ship **Phase 1** first (pure win, no backend risk) → **Phase 2** finance cards (highest
product value, ties into the finance KB) → **Phase 3** artifact panel → **Phase 4**
streaming + timelines (largest change, do last).

## Verification (per phase)

- **P1:** ask the chat for a comparison → mermaid bar chart renders; a formula → KaTeX; a
  code snippet → highlighted with copy. Existing text/tables/citations unaffected.
- **P2:** a finance question returns a stat card + breakdown chart with correct, cited
  numbers; non-finance answers unchanged.
- **P3:** an answer containing an artifact shows an inline tile; clicking opens the side
  panel (Preview/Code, resizable); a PDF/XLSX preview renders.
- **P4:** responses stream token-by-token; reasoning/tool steps render as they arrive.
- Each phase: `npm run typecheck` + `npm run lint` clean; existing chat regression-tested.

## Out of scope

- Anthropic Files API / container document generation (Athena-specific).
- Replacing GovDoc auth or the conversation/message persistence model.
- The pre-existing `row-rubric-edit.tsx` quote bug (tracked separately).
