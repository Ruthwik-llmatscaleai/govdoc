# Sunnyvale Finance Knowledge Base — Grounded Q&A over the City Budget

**Date:** 2026-06-03
**Status:** Draft for review
**Branch:** `sunnyvale-qna`
**Deployment target:** Cloud Run (production)

## Overview

Add a curated, **shared Knowledge Base (KB)** to the Search & Ask tile that answers
plain-language questions about the **City of Sunnyvale FY 2025/26 Adopted Budget**,
grounded in the two official budget PDFs and **always cited to a volume + page**.

This is the first of three planned Sunnyvale Q&A domains (the others — Building Code
lookup and City Council Caption-Notes analysis — are specified separately). Finance is
sequenced first because it needs **no new external service**: it runs entirely on code
plus the LLM/Postgres/S3 infrastructure GovDoc already uses.

The corpus is **static, known, and annual**: two PDFs, refreshed once per budget cycle.
That single fact drives the whole design — we can afford **expensive, high-quality
offline ingestion** (vision extraction, reconciliation, even manual QA) because it runs
once per release, not per query.

### Source documents

| Vol | File | Size | Contents |
|----|------|------|----------|
| 1 | `finance/FY 202526 Adopted Budget Volume 1  Summary and Operating Budget.pdf` | 11.7 MB | Budget message (narrative), budget summary tables, per-fund 5-yr & 20-yr financial plans, department budgets, glossary |
| 2 | `finance/FY 202526 Adopted Budget Volume 2  Projects Budget.pdf` | 6.9 MB | Capital / special / infrastructure projects, project-by-project budgets |

## Motivation / The core problem

The existing Search & Ask pipeline is **plain text RAG** (extract text → chunk → embed →
cosine top-k → Claude). That is correct for narrative prose but **dangerous for budget
PDFs**, which are mostly tables of numbers.

**Proven on the real file.** Plain-text extraction of the department appropriations table
(Vol 1, p.31) scrambles numbers away from their labels:

```
Department of Public Safety
       Police Services                                          4,391,616   ← wrong (police is ~$60M+)
       ...
       Records Management and Property Services            $114,338,497   ← this is the DEPT TOTAL,
       Fire Prevention and Hazardous Material Services                       pinned to the wrong row
Total Department of Public Safety                                            (blank)
```

The numbers are vertically offset from their labels. A human reading the rendered page
sees it correctly; the text extractor does not. Worse, it is **inconsistent** — the
Projects/Other-Expenditures table two pages later extracts perfectly
(`Total Adopted Budget $779,594,768`). So **no number can be trusted without
table-aware extraction**, and you cannot tell by inspection which ones are wrong.

Chart exhibits (e.g. Vol 1 p.91 "Sales Tax Distribution") extract as garbage entirely.

For a government finance tool, confidently-wrong dollar figures are the worst possible
failure mode. The architecture below exists to eliminate them.

## Question types (each needs a different path)

| Type | Example | Path |
|---|---|---|
| **Narrative** | "What are the City's fiscal policies? Why is the budget balanced?" | Text RAG |
| **Number lookup** | "What's the Public Safety operating budget?" | Structured store |
| **Aggregation / comparison** | "Top 5 departments by spend", "YoY change in sales tax" | Structured store |
| **Forecasting** | "What does the City project for General Fund revenue in 2040?" | Structured store (the 20-yr plan rows) |

## Scope

### In scope

1. **Knowledge Base primitive** — a curated, shared, system-owned collection that any user
   can query (vs. today's per-user ephemeral uploads).
2. **Finance KB offline ingestion** — both tracks:
   - **Narrative track** → text RAG chunks.
   - **Table track** → vision extraction into (a) clean markdown tables and (b) structured
     `BudgetFact` rows.
3. **Reconciliation** — validate extracted numbers against the document's own printed
   subtotals/totals; produce an ingestion review report.
4. **Query router + constrained query tools** — classify a question and route to RAG, the
   structured store, or both; answer with citations.
5. **Chat wiring** — a "Sunnyvale Finance" scope in the existing Search & Ask chat UI.

### Out of scope (this doc)

- Building Code lookup and Council Caption-Notes domains (separate specs).
- Live/agentic URL fetching at query time (rejected — see Appendix B).
- Our-own forecasting **models** (scenario simulation). Retrieving the City's *published*
  20-year projections is in scope; building new predictive models is a later effort.
- Real auth / RBAC changes (use current mock session).
- A third-party document-AI service (Textract / Azure DI / Landing AI) — see Appendix C.

## Architecture

```
                        OFFLINE  (run once per budget release)
  ┌───────────────────────────────────────────────────────────────────────┐
  │  budget PDFs                                                            │
  │      │                                                                  │
  │      ├─ segment by TOC ──► logical sections (msg, summary, fund plans,  │
  │      │                      dept budgets, 20-yr appendix) + page anchors │
  │      │                                                                  │
  │      ├─ classify pages ──► narrative │ table                            │
  │      │                                                                  │
  │      │   narrative ──► pdftotext ──► chunk ──► embed ──┐                 │
  │      │                                                 ▼                 │
  │      │   table ──► render page→image ──► vision LLM ──► (a) markdown ────┤
  │      │              (ROW render-pdf)     (schema)       (b) BudgetFact   │
  │      │                                                 │      rows       │
  │      │                                                 ▼                 │
  │      │                                          reconcile vs printed     │
  │      │                                          totals → review report   │
  │      ▼                                                 │                 │
  │  document_chunks (pgvector, KB-tagged)        budget_facts (Postgres)    │
  └───────────────────────────────────────────────────────────────────────┘

                        ONLINE  (per question, reuses existing chat)
  ┌───────────────────────────────────────────────────────────────────────┐
  │  question ─► router ─┬─ narrative ─► vector RAG ─────────┐              │
  │                      ├─ numeric ───► query tools ─► facts ┤─► Claude ──► │
  │                      └─ hybrid ────► both ───────────────┘   answer +   │
  │                                                              citations  │
  └───────────────────────────────────────────────────────────────────────┘
```

**Reuse vs. new.** Reuses: OpenAI embeddings, pgvector search, `answerQuestion`
(`features/search-ask/service.ts`), ROW's PDF→PNG render + vision pattern
(`lib/usecases/row-appraisal/vision/`), the LLM router (`lib/llm/`). New: KB/collection
scoping, the table→structured extractor, reconciliation, and the query router + tools.

## Component 1 — Knowledge Base primitive

Today documents are scoped by `userId` (+ optional `conversationId`) and uploaded per
session. A curated city corpus needs a **shared, system-owned collection** every user can
query. Minimal change:

- Add a **collection tag** to documents/chunks (e.g. `kb = "sunnyvale-finance"`), or a
  `KnowledgeBase` table with an FK. KB documents are owned by a **system account**, not a
  real user.
- `searchChunks` gains a KB filter (in addition to / instead of `userId`).
- The chat UI gains a **scope chip** so the user picks the KB before asking.

A "Source" in a KB can be a **PDF** (this doc) or, later, a **URL** (council/code domains)
— two ingestion adapters into the same KB. Live-fetching a URL at query time is explicitly
**not** how this works (Appendix B).

## Component 2 — Offline ingestion

1. **Segment by TOC.** The TOC carries page anchors (e.g. *Budget Message p.3, Budget
   Summary p.11, General Fund p.89, Twenty-Year Financial Plans p.405*). Split into logical
   sections; carry section + page metadata through everything for citation.
2. **Classify** each page: narrative vs table-heavy (heuristic on digit/whitespace density,
   refined per section).
3. **Narrative track:** `pdftotext` → `RecursiveCharacterTextSplitter` (existing,
   1000/200) → OpenAI `text-embedding-3-small` (1536-d) → `document_chunks`, tagged
   `{ kb, volume, page, section, fund?, department? }`.
4. **Table track:** render the page to an image (ROW's `vision/render-pdf.ts` + canvas) →
   call a **vision LLM with a strict JSON schema** (the `BudgetFact[]` shape, §below),
   passing TOC context ("this is the General Fund 20-Year Financial Plan, p.405") so the
   model fills dimensions. Emit **both**:
   - a **clean markdown table** → embedded as a RAG chunk (cited display, fixes scramble), and
   - **structured `BudgetFact` rows** → the structured store.

Vision sees the visual row alignment the text extractor loses — this is what fixes the
label↔number scramble.

## Component 3 — Structured data model

The key idea: do **not** model each table shape separately. Every number — a department
line, a fund revenue, a reserve balance, a project — collapses to **one tidy fact row**.
This makes arbitrary aggregation, top-N, YoY, and forecasting all just
`WHERE … GROUP BY … SUM`.

```prisma
model BudgetFact {
  id           String  @id @default(uuid())
  // provenance / citation (non-negotiable for a finance tool)
  volume       Int                  // 1 (Summary/Operating) | 2 (Projects)
  sourcePage   Int     @map("source_page")
  sourceTable  String  @map("source_table")   // "FY2025/26 Budget Summary — Appropriations"
  // dimensions (any may be null depending on the table)
  fund         String?              // "General Fund", "Water Supply & Distribution Fund"
  department   String?              // "Department of Public Safety"
  lineItem     String?  @map("line_item")      // "Police Services", "Sales Tax", "Salaries & Benefits"
  category     String               // revenue | expenditure | reserve | fund_balance | project
  subcategory  String?              // "Taxes", "Capital", "Infrastructure"
  fiscalYear   String   @map("fiscal_year")    // "2025/26"  (multi-year plans → many rows)
  // value
  amount       Decimal  @db.Decimal(18,2)
  // bookkeeping
  isTotal      Boolean  @default(false) @map("is_total")  // roll-up → exclude from SUMs
  parentId     String?  @map("parent_id")                 // hierarchy: division → department

  @@index([fund, fiscalYear])
  @@index([department, fiscalYear])
  @@index([category, fiscalYear])
  @@map("budget_facts")
}
```

`isTotal` is critical: the document prints both line items **and** their subtotals/totals.
We keep the totals (to answer "total operating budget" directly **and** to validate) but
exclude them from any `SUM` so we never double-count. A department appropriations row, a
General Fund financial-plan row, and a Volume 2 project row all become `BudgetFact` rows —
differing only in which dimensions are filled.

## Component 4 — Reconciliation (the trust layer)

This is the difference between a demo and something a city analyst will rely on. Budget
documents are **self-checking**: every section prints subtotals and a grand total.

```
reconcile():
  for each (sourceTable, group):
     computed = SUM(amount where isTotal = false)
     printed  = the row where isTotal = true
     if abs(computed - printed) > $1  → FLAG

  cross-total:  SUM(operating) + SUM(projects) + other  ==  $779,594,768  (printed grand total)
```

Flags go into an **ingestion review report** (`finance/review-report.md`), not silently
trusted. Because ingestion is offline and annual, a human can clear flagged rows. End
state: **every number in the store reconciles to the City's own printed totals.**

## Component 5 — Query layer

A lightweight **router** classifies the question (narrative / numeric / hybrid).

For numeric questions the router exposes a **small set of typed query functions** to Claude
via tool-use — **not** free text-to-SQL (which hallucinates columns and silently-wrong
filters — unacceptable for finance):

```ts
lookup({ department?, fund?, lineItem?, fiscalYear })        // "Public Safety budget?"
aggregate({ groupBy, filter, metric: "sum", topN?, order? }) // "top 5 depts by spend"
compareYears({ entity, fromFY, toFY })                       // "YoY change in sales tax"
series({ entity, metric })                                   // "GF revenue 2025–2045" (forecast)
```

Claude picks the function + args (structured), we run a **safe parameterized query**,
return the rows **+ their source pages**, and Claude composes the answer showing the
figures and **citing the page**. Every answer is traceable to reconciled facts — matching
GovDoc's court-ready audit ethos.

### Worked example

> "How does Public Safety's budget compare to Public Works, and what share of the
> operating budget is that?"

```
router → numeric → Claude calls:
   lookup(department:"Department of Public Safety", fiscalYear:"2025/26") → $114,338,497 (p.31)
   lookup(department:"Department of Public Works",  fiscalYear:"2025/26") → $43,355,986  (p.31)
   lookup(lineItem:"Total Operating Budget",        fiscalYear:"2025/26") → $392,579,300 (p.31)
→ "Public Safety ($114.3M) is ~2.6× Public Works ($43.4M); together they are 40% of the
   $392.6M operating budget."  [cites p.31]
```

Numbers that plain RAG would scramble are now exact, reconciled, and cited.

## Forecasting

The budget **already contains the City's official 20-Year Financial Plans** per fund
(TOC: *General Fund p.405, Housing Fund p.413 …*) and qualitative guidance in the revenue
narrative (e.g. *"grow modestly at about 2% across the twenty-year plan"*).

- **"What does the City project for General Fund revenue in 2040?"** → `series()` over the
  20-year-plan rows (already in `budget_facts` — the appendix is just more `fiscalYear`
  values). **No model — pure retrieval.** In scope.
- **"Forecast it ourselves / scenario analysis"** → a model over the historical+projected
  series. **Out of scope** for now; the structured store makes it a clean future add.

## Implementation phases

### F1 — Grounded Q&A MVP (ship first)
- KB primitive (collection tag + KB-scoped retrieval, system-owned docs).
- Ingest Vol 1 + Vol 2: narrative chunks **+ table-aware markdown** (vision).
- Wire "Sunnyvale Finance" scope into the Search & Ask chat.
- **Delivers:** grounded narrative Q&A + reliable single-number lookups, all cited.

### F2 — Structured store + numeric queries
- `BudgetFact` model + migration.
- Table → `BudgetFact` vision extractor (schema-constrained).
- Reconciliation pass + review report.
- Query router + typed query tools.
- **Delivers:** exact totals, aggregations, comparisons, and retrieval of the City's
  20-year projections.

**Recommended first slice of F2:** prove the extract → reconcile → query loop end-to-end on
**two high-value tables** (department appropriations p.31 + the General Fund financial plan)
before scaling to all funds and Volume 2 projects.

### F3 — (optional, later) Our-own forecasting models
- Trend / scenario modeling over `budget_facts` series.

## External services / dependencies

| Need | How | New vendor? |
|---|---|---|
| Embeddings | OpenAI `text-embedding-3-small` | No (already used) |
| Vector search | Postgres + pgvector | No (already have) |
| Answer generation | Claude API | No (already used) |
| Vision table extraction | Claude or GPT-4o vision (same keys) — **offline, once/year** | No |
| PDF text + render | poppler / pdfjs + canvas (ROW already renders) | No |
| Structured store | Postgres (Prisma) | No |

**No new external service is required.** A dedicated document-AI service is an optional
accuracy upgrade only (Appendix C).

## Open decisions

1. **Vision model for tables** — Claude (single-provider) vs GPT-4o (already wired for ROW).
2. **First F2 slice** — whole budget vs. the two-table proof-of-loop above.
3. **Structured store start** — committed `facts.json` artifact first (fast iteration,
   diffable) then promote into `budget_facts`, vs. straight to the table.
4. **Forecasting** — confirm in-scope = retrieve the City's own 20-yr plans only.

## Appendix A — Why the corpus being static matters

Annual, known, 2-file corpus → ingestion is offline and amortized. We can spend vision
tokens, run reconciliation, and human-QA flagged rows once per release. None of that cost
touches query latency. This is what makes 100%-cited, reconciled answers affordable.

## Appendix B — Why not live URL fetching

The City budget page (`/your-government/governance/city-budget`) 403s bots and merely
links to these same PDFs. Live-fetching a URL at query time cannot search across the
corpus, breaks on PDFs / WAF / JS, and blows token limits. URLs (for other domains) are an
**ingestion seed**, never a query-time call.

## Appendix C — Optional document-AI upgrade

Instead of in-house vision extraction, a managed service (AWS Textract, Azure Document
Intelligence, Landing AI, Reducto) could improve table accuracy and cut build effort, at
the cost of a new vendor + spend. Recommendation: start in-house (zero new vendors, reuses
ROW code); adopt a service only if reconciliation shows accuracy is insufficient.
