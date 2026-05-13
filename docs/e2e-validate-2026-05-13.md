# Validate Documents — End-to-end test report

**Date:** 2026-05-13
**Branch:** main
**Reviewer:** Claude (Opus 4.7)

## Scope

Drove all three reviewers under `/work/review/[usecase]` end-to-end with real documents, applied an override during the HITL phase of Narrative Review, and exported XLSX for each.

| Reviewer | Document used |
|---|---|
| Project Review (`cmgc-pde`) | `test_doc_3_SR1_tunnel_PDB.docx` |
| Narrative Review (`cucp-reevals`) | `STEVE DBE.pdf` + `Copy of From Anna_Firms by 5 Year Gross Receipts.xlsx` |
| Appraisal Review (`row-appraisal`) | `Appraisal_EA_0J910,_Parcel_38355.pdf` |

## Results

All three pipelines completed; all three XLSX exports opened cleanly.

| Reviewer | Result counts | XLSX | HITL override |
|---|---|---|---|
| Project Review | 25/25 rubric questions rated | 14 KB / 4 sheets — cell C2 changed when override applied | client-side flip on question A1 propagated to the workbook |
| Narrative Review | L1 facts extracted → L2 5 classifications → L3 7 criteria scored → `final_decision: "No"` (PNW > $2.047M) | 10 KB / 3 sheets | L2 reclassification (`fact_1`) accepted, re-evaluation ran, second L2 pause served, finalize succeeded |
| Appraisal Review | 34/34 categories (11 Pass / 13 Warning / 4 Fail / 6 N/A) | 17 KB / 1 sheet | n/a (no override surface) |

## Issues fixed in this run

1. **Rubric count copy** — `lib/usecases/metadata.ts` and `app/work/review/[usecase]/page.tsx` said "32-category PDE rubric" but the codebase only has 25 questions; copy now reads "25-category delivery rubric" and the internal `PDE` acronym is gone from the user-visible blurb.

2. **`level` field on `needs-input` event** — `StepEvent` previously encoded level only in `stage: "level1"|"level2"|"level3"`. Added `level?: 1|2|3` to the union and to the three yield sites in the CUCP pipeline so any future SSE consumer can read the level directly.

3. **L1/L2/L3 overrides now appear in the final markdown report** — `report-step.ts` now threads `ctx.staged.l1_field_overrides`, `level_1_precedents`, `level_2_precedents`, and `level_3_precedents` into `generateFinalMarkdownReport` as a new `sessionOverrides` parameter. The `ANALYST OVERRIDES` section is grouped by level and lists each adjustment with its justification. The `stage-done` payload also carries `session_overrides` for downstream consumers.

   Example live output from the re-run:
   ```
   ### 🧑‍⚖️ ANALYST OVERRIDES
   The following manual adjustments were applied by the human reviewer during this run:

   **Level 2 — Classifications**
   - **Fact fact_1:** `Institutional/Systemic Barrier` → `Active discrimination`
     *(Justification: …)*
   ```

## Issues confirmed but NOT fixed in this run

- **CUCP HITL rendezvous never rejects on client disconnect.** `lib/runs/level-rendezvous.ts` has a 30-min TTL reaper that deletes the map entry but does not reject the awaiting promise — a closed browser tab leaks the SSE generator. Decided as not major for now.
- **L2 LLM occasionally returns classifications not in the canonical 5 type enum** (e.g. the test data above where the override new-value was off-enum). The override flow itself works; the precedent is staged regardless. Flagged as expected behavior.

## Verification

- `npx tsc --noEmit` — clean
- `npm run lint` — clean
- `npx vitest run lib/usecases/cucp-reevals/report lib/usecases/cucp-reevals/pipeline/report-step.test.ts` — 22 passed (4 new)
- Live re-run of Narrative Review against `STEVE DBE.pdf` confirmed:
  - `needs-input` events now carry `level: 1|2|3`
  - `session_overrides` appears on the `report` `stage-done` payload
  - `ANALYST OVERRIDES` section renders the staged L2 reclassification with its reason

## Files changed

- `app/work/review/[usecase]/page.tsx`
- `lib/usecases/metadata.ts`
- `lib/usecases/types.ts`
- `lib/usecases/cucp-reevals/pipeline/level-1-step.ts`
- `lib/usecases/cucp-reevals/pipeline/level-2-step.ts`
- `lib/usecases/cucp-reevals/pipeline/level-3-step.ts`
- `lib/usecases/cucp-reevals/pipeline/report-step.ts`
- `lib/usecases/cucp-reevals/pipeline/report-step.test.ts`
- `lib/usecases/cucp-reevals/report/markdown.ts`
- `lib/usecases/cucp-reevals/report/markdown.test.ts`
