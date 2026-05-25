# Landing Page + Full Workspace UI Implementation

**Date:** 2026-05-25  
**Status:** Approved for implementation  
**Deployment target:** Cloud Run (production)

## Overview

Implement a complete public landing page and comprehensive workspace UI redesign matching the provided reference screenshots. All pages use the existing GovDoc design system (cream/terracotta, Fraunces/Inter Tight/JetBrains Mono). This is **production code** — all data is dynamic, pulled from sessions and BigQuery.

## Scope

### In Scope
1. **Public landing page** (`/`) - marketing page visible to all visitors
2. **Routing changes** - landing at `/`, login at `/login`, workspace at `/workspace`
3. **Workspace home redesign** (`/workspace`) - personalized greeting, 9-capability grid, recent activity
4. **Document analysis view** (`/work/validate`) - 3-panel layout with live document processing
5. **Rubrics management** (`/work/rubrics`) - manage/review rubrics with versioning
6. **Rubrics tools home** (`/work/rubrics/tools`) - two-panel overview
7. **Chat interface updates** (`/work/chat`) - ensure it matches screenshot aesthetic
8. **Playwright E2E tests** - verify all new flows work
9. **Cloud Run deployment** - deploy after tests pass

### Out of Scope
- Backend API changes (use existing endpoints)
- Authentication logic changes (keep current mock session)
- BigQuery schema changes (use existing tables)
- Mobile responsive (desktop-first, but keep current responsive patterns)

## Design System Consistency

All pages share:
- **Colors:** `--color-cream` (#f5efe2), `--color-govdoc-primary` (#b04a2f), `--color-ink` (#0a0a0a)
- **Typography:** 
  - Display: Fraunces (variable opsz), italic for emphasis
  - Body: Inter Tight
  - Labels: JetBrains Mono, uppercase, tracked
- **Spacing:** Consistent padding/margins matching existing login page
- **Borders:** `--color-line` (#d9d3c2) for dividers
- **Patterns:** Subtle grid overlay on cream backgrounds, radial gradient washes

## Page-by-Page Specification

---

## 1. Landing Page (`/`)

**Route:** `/` (replaces current redirect)  
**Access:** Public (no auth required)  
**Reference:** Screenshot 5

### Header (Fixed)
```
[Logo + "LLM at Scale.AI"] [◆] ["Policy Compliance · Agentic AI"]          [Reads. Checks. Decides.]  [v 1.0.0 STABLE]  [REQUEST DEMO]  [SIGN IN →]
```

- Left: Logo (36px), divider, "Policy Compliance · Agentic AI" (mono, 10.5px, uppercase, tracked)
- Center: "Reads. Checks. Decides." tagline
- Right: Version badge, "REQUEST DEMO" link (→ `/login`), "SIGN IN →" button (dark green, → `/login`)
- Background: Cream with subtle grid pattern
- Border-bottom: `--color-line`

### Hero Section
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ◆ POLICY COMPLIANCE EVALUATION · POWERED BY AGENTIC AI ◆

  GovDoc is beyond Microsoft 365
  Copilot.

  Deterministic responses at low cost — built to handle
  any complex document.

  [◆ DOCUMENT INTELLIGENCE · DONE RIGHT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- Title: Fraunces 96opsz, 72-156px fluid, "beyond" in italic terracotta
- Subheading: Fraunces 26-34px, "at low cost" in italic terracotta
- CTA button: Links to `/login`, terracotta background, white text, uppercase mono label

### Process Visualization

Three-stage flow showing:
```
[Document icon] → [GovDoc Agentic Engine box with "Extract Facts", "Apply Rubric", "Issue Verdict"] → [Verdict card showing "Procedural breach" with CCR citation]
```

- INPUT: Document icon with "CASE_47A.PDF · P.3/7" label
- PROCESS: Black box with "AGENTIC ENGINE GovDoc", three green checkmarks for steps, "Did this filing meet the 45-day window?" callout
- OUTPUT: Cream verdict card with "VERDICT :: CITED" header, "Procedural breach." text, Gov Code §11130 + CCR §15.04(b) citations, "RECOMMENDATION: TIER-2 REVIEW"

Label at bottom: "Natural language" → "PROCESS" → "OUTPUT"

### Three-Column Section: Reads. Checks. Decides.

```
┌────────────────┬────────────────┬────────────────┐
│   01 · READS   │  02 · CHECKS   │  03 · DECIDES  │
│   GOVERNMENT   │    AGAINST     │   PASS / FAIL  │
│   DOCUMENTS    │     POLICY     │   WITH AUDIT   │
└────────────────┴────────────────┴────────────────┘
```

Below:
- Paragraph: "An agentic document-intelligence platform that reads complex documents, checks them against your policy, and tells you pass or fail — with the same verdict at the same cost, every time."
- Three badges: ✓ DETERMINISTIC, ✓ FIXED COST, ✓ FULLY AUDITABLE

### Comparison Table: Why Not Copilot

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       WHY NOT COPILOT

  GovDoc is not built on Microsoft 365 Copilot

  M365 COPILOT              │  GOVDOC
  ✗ Non-deterministic      │  ✓ Deterministic verdicts
  ✗ Per-token pricing      │  ✓ Fixed cost
  ✗ Unauditable outputs    │  ✓ Full audit trail
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Footer
```
© 2026 LLMATSCALE.AI       CONFIDENTIAL & PROPRIETARY       AUTHORIZED USE ONLY       🔒 TLS 1.3  ✓ MFA  FedRAMP · CJIS · SOC 2
```

---

## 2. Workspace Home (`/workspace`)

**Route:** `/workspace` (existing, redesign layout)  
**Access:** Authenticated users only  
**Reference:** Screenshot 3

### Header
```
[Logo] [◆ GovDoc]                                                    [J JOTHI] [ADMIN] [↻ SIGN OUT]
```

- Logo + "GovDoc" title (same style as landing)
- Right: User avatar with initials (dynamic from session), username, role badge, sign-out button

### Hero Section
```
━━━ WORKSPACE · TUESDAY, 23 MAY 2026

Welcome back, Jothi.

Pick a capability to run. Each one reads documents, applies policy, and
produces an auditable decision — every step cited and traceable.
```

- Date stamp: Dynamic (current date)
- Greeting: Dynamic first name from session, italicized in terracotta
- Tagline: Body text

### Capability Filter Bar
```
[ALL]  [RUN]  [REVIEW]  [ANALYZE]
```

- Buttons above grid
- "ALL" selected by default (dark background)

### 9-Capability Grid (3×3)

Each card:
```
┌────────────────────────────────┐
│ [Icon]                    01   │
│                                │
│ Rubrics                        │
│ Define and apply scoring       │
│ rubrics. Reusable and          │
│ audit-ready.                   │
└────────────────────────────────┘
```

Cards:
1. **Rubrics** - Define and apply scoring rubrics. Reusable and audit-ready.
2. **Search & Ask** - Plain-language queries across your corpus. Cited answers.
3. **Validate & Comply** - Check documents against policy. Pass/fail with reasoning.
4. **OCR & Extract** - Convert scanned docs into structured data. Tables preserved.
5. **Classify & Tag** - Auto-categorize and route incoming documents.
6. **Detect Risk** - Flag missing signatures, expired refs, and sensitive PII.
7. **Fill Forms** - Pre-populate government forms from source documents.
8. **Audit & Trace** - Full chain of evidence for every decision. Court-ready.
9. **Policy & Standards** - Manage policies and statutes. Version-controlled.

Each card links to `/work/{capability-slug}`

### Right Sidebar: Recent Activity
```
━━━ RECENT ACTIVITY · LAST 24H          [VIEW ALL →]

[PASS]  grievance_2026-04.pdf          2 min ago
[FAIL]  vendor_compliance_q1.pdf       14 min ago
[REVIEW] policy_exception_request.docx  1 hr ago
[PASS]  audit_finding_2025-q4.pdf      3 hr ago
```

- **Data source:** BigQuery `chat_sessions` table filtered by user + last 24h
- Shows badge (PASS/FAIL/REVIEW), document name, relative timestamp
- If no activity: "No recent activity" placeholder

---

## 3. Document Analysis View (`/work/validate`)

**Route:** `/work/validate` (new or redesign existing)  
**Access:** Authenticated users  
**Reference:** Screenshot 1

### Layout: 3-Panel

```
┌─────────────────────────┬─────────────────────────────────────┐
│   DOCUMENT VIEWER       │   ANALYSIS PANEL                    │
│                         │                                     │
│   [Document content]    │   ━━━ 01 · EXTRACTED FACTS          │
│                         │   Complainant: CA Resident          │
│   [Highlighted text]    │   Filed: Jan 22, 2026               │
│                         │   Deadline: Mar 26, 2026            │
│   [Tooltip overlay]     │   Statute: Gov Code §11130          │
│                         │   Cross-ref: CCR §15.04(b)          │
│                         │                                     │
│                         │   ━━━ 02 · REASONING PATH           │
│                         │   01 Identify statutory window      │
│                         │   02 Check timeline                 │
│                         │   03 Detect breach                  │
│                         │                                     │
│                         │   ━━━ 03 · VERDICT                  │
│                         │   [Verdict card]                    │
│                         │   Procedural breach confirmed.      │
│                         │   Recommend Tier-2 review.          │
│                         │   ⚖ CCR §15.04(b)                  │
└─────────────────────────┴─────────────────────────────────────┘
```

### Left Panel: Document Viewer
- File header: "📄 CASE_47A · AGENCY_GRIEVANCE_2026-04.pdf"
- Status badge: "● AGENT ACTIVE · ANALYZING" (green pulsing dot)
- Rendered document content (use existing PDF/DOCX rendering)
- Highlighted excerpts (yellow background for key facts)
- Tooltip overlay: Black box with white text showing cross-reference details

### Right Panel: Analysis
- Three collapsible sections (01, 02, 03)
- Each section uses mono labels (uppercase, tracked)
- Extracted facts: Key-value pairs from document
- Reasoning path: Ordered list of analysis steps
- Verdict card: Cream background, terracotta accent, citation badges

### Streaming Status
- When processing: Show "● AGENT ACTIVE · ANALYZING" with animation
- When complete: Show "✓ ANALYSIS COMPLETE · 2 SOURCES CITED"

---

## 4. Rubrics Management (`/work/rubrics`)

**Route:** `/work/rubrics` (existing, redesign layout)  
**Access:** Admin users  
**Reference:** Screenshot 2

### Header
```
━━━ WORKSPACE / RUBRICS / MANAGE RUBRICS

Manage Rubrics.

Build and refine the scoring rubrics GovDoc applies to each review type. Add
questions, set weights, adjust options — every change is versioned and audit-
logged.
```

### Tabs
```
[Manage Project ●]  [Manage Appraisal +]  [Manage Narrative +]
```

- Tab bar below header
- Active tab has filled circle indicator

### Rubric Management Controls
```
RUBRIC: Manage Project  ˅     [+ New Section]  [⬆ Upload]  [⚙ Compose ˅]
```

- Dropdown to select rubric
- Action buttons on right

### Question List

Each section:
```
━━━ R1    PROJECT SCOPE & CHARACTERISTICS
        Foundational definition of scope and deliverables
                                            [18 QUESTIONS · 38%] [✎ Edit Section] [🗑]

Q1   Where is the Project in the project development process?
     A  Detailed or final engineering stage (60% design or later)
     B  Preliminary design stage (30% design)
     C  Conceptual engineering stage (before PS&E)
                                            [✎ Edit] [🗑]

Q2   What is the size of the Project?
     A  Small project (less than $25 million construction capital cost)
     B  Medium-size project (between $25 to $75 million...)
     C  Large project (greater than $75 million...)
                                            [✎ Edit] [🗑]
```

- Section headers: Mono uppercase label, description, stats badge
- Questions: Numbered (Q1, Q2...), question text, radio options (A/B/C/D)
- Edit/delete icons on hover

### Version History (Bottom)
```
━━━ VERSION HISTORY                    TOTAL VERSIONS: 02    RETENTION: 90 DAYS

v852    09 May 2020 · 11:46 AM    [AUTHOR: JSTKE]
        Updated weights for Section 01 — Project Scope & Characteristics
                                            [☍ Restore]  [🗑]

v851    07 May 2020 · 04:42 PM    [AUTHOR: JSTKE]
        [PATCH NAME → 10 SECTIONS, 29 QUESTIONS ESTABLISHED]
                                            [☍ Restore]  [🗑]
```

---

## 5. Review Rubrics (`/work/rubrics/review`)

**Route:** `/work/rubrics/review` (new or redesign existing)  
**Access:** All authenticated users  
**Reference:** Screenshot 7

### Header
```
━━━ WORKSPACE / RUBRICS / REVIEW RUBRICS         [◆ READ-ONLY]

Review Rubrics.

A read-only view of the rubric GovDoc applies for each review type. For
inspection only — questions, scoring tiers, and section weights cannot be
modified from this screen.
```

### Tabs
```
[Validate Project ●]  [Validate Appraisal +]  [Validate Narrative +]
```

### Rubric Display

```
RUBRIC: VALIDATE PROJECT         SECTIONS: 06    QUESTIONS: 25    WEIGHT: 100%

DELIVERY METHOD: 00
```

### Read-only Question Sections

Same structure as management view, but:
- No edit/delete buttons
- No "New Section" or action buttons
- Greyed-out or locked appearance
- Version badge in top-right: "VERSION 1.0.0  UPDATED: 09 MAY 2026"

### Summary Bar (Bottom)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 [SUMMARY]  Validate Project rubric — inspection view across all sections.

                    SECTIONS: 06    QUESTIONS: 25    WEIGHT: 100%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 6. Rubrics Tools Home (`/work/rubrics/tools`)

**Route:** `/work/rubrics/tools` (new)  
**Access:** Authenticated users  
**Reference:** Screenshot 4

### Header
```
━━━ WORKSPACE / RUBRICS

━━━ 01    RUBRICS

Rubric Tools
```

### Stats Bar
```
12          3             186
ACTIVE      DRAFTS        QUESTIONS
```

### Two-Panel Layout

```
┌──────────────────────────────┬──────────────────────────────┐
│   Review Rubrics             │   Manage Rubrics             │
│   [PRIMARY · READ-ONLY]      │   [ADMIN · GOVERNED]         │
│                              │                              │
│   Browse the production      │   Create, adjust, and        │
│   library. View every        │   version rubrics. Every     │
│   question, scoring weight,  │   change governed and        │
│   and pass criteria —        │   audit-logged.              │
│   versioned and audit-ready. │                              │
│                              │                              │
│   ━━━ RECENT · 4 OF 12       │   ━━━ IN PROGRESS · 3 DRAFTS │
│                              │                              │
│   ● Grievance Evaluation     │   ● Procurement Contract     │
│     Public Records · 24 q    │     v0.3 · 78% complete      │
│     v2.1  2h ago             │                              │
│                              │   ● Whistleblower Intake     │
│   ● Audit Finding Review     │     v0.4 · 35% complete      │
│     Compliance · 18 q        │                              │
│     v3.0  Yesterday          │   ● FOIA Response Review     │
│                              │     v0.1 · 12% complete      │
│   [Browse all rubrics  →]    │   [Open admin console  →]    │
└──────────────────────────────┴──────────────────────────────┘
```

### Left Panel: Review Rubrics
- Badge: "PRIMARY · READ-ONLY"
- Description
- Recent list with version + timestamp
- "Browse all rubrics →" link to `/work/rubrics/review`

### Right Panel: Manage Rubrics
- Badge: "ADMIN · GOVERNED"
- Description
- Drafts list with version + completion %
- "Open admin console →" link to `/work/rubrics`

---

## 7. Chat Interface (`/work/chat`)

**Route:** `/work/chat` (existing, verify aesthetic matches)  
**Access:** Authenticated users  
**Reference:** Screenshot 6

### Layout (already exists, verify design consistency)

```
┌────────────────┬─────────────────────────────────────────┐
│  SIDEBAR       │   CHAT AREA                             │
│                │                                         │
│  [●] Search    │   ━━━ 02 · SEARCH & ASK                 │
│  & Ask    [+]  │   Q3 vendor contract review             │
│                │                                         │
│  [New chat]    │   ● SESSION ACTIVE        [⎘] [⬇] [⊕]  │
│                │                                         │
│  [📁] Projects │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                │                                         │
│  [🔍] Search...│   [User message bubble]                 │
│                │   What are the contractor's response    │
│                │   obligations when a grievance is filed?│
│  TODAY         │                                         │
│  Q3 vendor...  │   [GovDoc response with citations]      │
│  2h ago        │   Under California's standard           │
│                │   procurement contract framework, a     │
│  Summarize...  │   contractor's response obligations...  │
│  5h ago        │                                         │
│                │   ━━━ KEY OBLIGATIONS · 3 FOUND         │
│                │   01  Acknowledge receipt within 10 BD  │
│  YESTERDAY     │   02  Investigate and respond within... │
│  What does...  │   03  Maintain complete audit trail...  │
│  1d ago        │                                         │
│                │   [2 sources cited · audit-logged]      │
│                │                                         │
│  [⚙ Settings]  │   [Input area]                          │
│                │   Ask anything — attach a PDF or DOCX...│
│                │                                         │
│                │   [📎] [🎙] [📄]  [↔] SEND  [++] NEW... │
│                │   [Summarize] [Compare] [Extract] [Find]│
│                │                                         │
│                │   ● CLAUDE OPUS · CITATIONS ON   [↺]    │
└────────────────┴─────────────────────────────────────────┘
```

**Verify:**
- Cream/terracotta color scheme matches
- Typography (Fraunces headings, Inter Tight body, mono labels)
- Citation badges match landing page style
- Status indicators (green pulsing dot, badges)

---

## Technical Implementation

### Routing Changes

**File:** `app/page.tsx`

Before:
```typescript
export default async function Home() {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  redirect(session ? "/workspace" : "/login");
}
```

After:
```typescript
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  return <LandingPage />;
}
```

**Middleware:** `middleware.ts` (create if not exists)
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get("govdoc_session")?.value;
  const path = request.nextUrl.pathname;
  
  // Protect workspace routes
  if (path.startsWith("/workspace") || path.startsWith("/work")) {
    if (!cookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  
  // Redirect authenticated users from login to workspace
  if (path === "/login" && cookie) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Component Structure

```
components/
├── landing/
│   ├── landing-page.tsx         (main landing component)
│   ├── hero-section.tsx
│   ├── process-flow.tsx
│   ├── three-column.tsx
│   └── comparison-table.tsx
├── workspace/
│   ├── workspace-home.tsx       (redesigned workspace)
│   ├── capability-grid.tsx
│   ├── capability-card.tsx
│   └── recent-activity.tsx
├── work/
│   ├── validate/
│   │   ├── document-viewer.tsx
│   │   ├── analysis-panel.tsx
│   │   └── verdict-card.tsx
│   ├── rubrics/
│   │   ├── manage-rubrics.tsx
│   │   ├── review-rubrics.tsx
│   │   ├── rubrics-tools.tsx
│   │   ├── question-list.tsx
│   │   └── version-history.tsx
│   └── chat/
│       └── (verify existing components)
└── shared/
    ├── header.tsx               (reusable header)
    ├── footer.tsx               (reusable footer)
    ├── status-badge.tsx
    └── citation-badge.tsx
```

### Data Flow

**Workspace Home (`/workspace`):**
- Fetch session: `const session = await verifySession(cookie)`
- Greeting: `"Welcome back, ${session.user.firstName}."`
- Avatar: `session.user.firstName[0].toUpperCase()`
- Recent activity: Query BigQuery `chat_sessions` filtered by `user_id` + last 24h
- Date: `new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())`

**Document Analysis (`/work/validate`):**
- Upload document → `/api/validate/upload` (existing)
- Stream analysis → `/api/validate/analyze` (existing or create)
- Display extracted facts, reasoning, verdict in real-time
- Citations link back to document highlights

**Rubrics Management (`/work/rubrics`):**
- Fetch rubrics: `/api/rubrics/list` (existing or create)
- CRUD operations: `/api/rubrics/create`, `/api/rubrics/update`, `/api/rubrics/delete`
- Version control: Store in BigQuery with timestamps

**Chat Interface (`/work/chat`):**
- Already implemented, verify styling matches

### Styling

All components use Tailwind utility classes referencing CSS variables:
- `bg-[var(--color-cream)]`
- `text-[var(--color-ink)]`
- `border-[var(--color-line)]`
- `font-[var(--font-display)]`
- Fraunces: `style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 96' }}`

### Testing

**Playwright tests:** `tests/e2e/landing-workspace.spec.ts`

```typescript
test.describe("Landing and Workspace Flow", () => {
  test("Public landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=GovDoc is beyond Microsoft 365 Copilot")).toBeVisible();
    await expect(page.locator("text=SIGN IN")).toBeVisible();
  });

  test("Sign in redirects to workspace", async ({ page }) => {
    await page.goto("/");
    await page.click("text=SIGN IN");
    await expect(page).toHaveURL("/login");
    
    // Login (use existing test helpers)
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin");
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL("/workspace");
    await expect(page.locator("text=Welcome back,")).toBeVisible();
  });

  test("Workspace shows 9 capabilities", async ({ page, context }) => {
    // Set session cookie
    await context.addCookies([{ name: "govdoc_session", value: "test-session", path: "/", domain: "localhost" }]);
    
    await page.goto("/workspace");
    const cards = page.locator(".capability-card");
    await expect(cards).toHaveCount(9);
    await expect(page.locator("text=Rubrics")).toBeVisible();
    await expect(page.locator("text=Search & Ask")).toBeVisible();
  });

  test("Recent activity shows dynamic data", async ({ page, context }) => {
    await context.addCookies([{ name: "govdoc_session", value: "test-session", path: "/", domain: "localhost" }]);
    
    await page.goto("/workspace");
    const activity = page.locator("[data-testid='recent-activity']");
    await expect(activity).toBeVisible();
    // Verify at least one item or "No recent activity" placeholder
    await expect(activity.locator("text=/PASS|FAIL|REVIEW|No recent activity/")).toBeVisible();
  });

  test("Rubrics tools page loads", async ({ page, context }) => {
    await context.addCookies([{ name: "govdoc_session", value: "test-session", path: "/", domain: "localhost" }]);
    
    await page.goto("/work/rubrics/tools");
    await expect(page.locator("text=Review Rubrics")).toBeVisible();
    await expect(page.locator("text=Manage Rubrics")).toBeVisible();
    await expect(page.locator("text=ACTIVE")).toBeVisible();
  });
});
```

### Deployment

**After implementation:**
1. Run tests: `npm run test:e2e:local`
2. Verify dev server: `npm run dev` → manually check all pages
3. Build: `npm run build`
4. Deploy: `scripts/deploy-cloud-run.sh` (requires user confirmation per CLAUDE.md)
5. Smoke test production URL

## Open Questions

None - scope is clear, reference screenshots provided, production data sources identified.

## Success Criteria

- [ ] Landing page (`/`) loads and matches screenshot 5
- [ ] Login flow unchanged, still works
- [ ] Workspace home shows dynamic greeting with user's name
- [ ] Workspace shows 9 capability cards linking to real routes
- [ ] Recent activity pulls from BigQuery and shows real data
- [ ] Document analysis view (`/work/validate`) matches screenshot 1 layout
- [ ] Rubrics management (`/work/rubrics`) matches screenshot 2
- [ ] Rubrics review (`/work/rubrics/review`) matches screenshot 7
- [ ] Rubrics tools (`/work/rubrics/tools`) matches screenshot 4
- [ ] Chat interface aesthetic verified against screenshot 6
- [ ] All Playwright tests pass
- [ ] Deployed to Cloud Run and smoke tested
- [ ] No console errors, no broken links
- [ ] Typography, colors, spacing match design system

## Timeline Estimate

- Component scaffolding: 45 min
- Landing page: 1 hr
- Workspace redesign: 1.5 hrs
- Document analysis view: 1 hr
- Rubrics pages (3 pages): 2 hrs
- Routing + middleware: 30 min
- Testing: 1 hr
- Deploy + smoke test: 30 min

**Total: ~8 hours**

## Notes

- This is **production code** - all data is dynamic
- Match existing code patterns (server components, Zustand, TanStack Query)
- Reuse existing API endpoints where possible
- Keep login page as-is (already matches aesthetic)
- Add `.superpowers/` to `.gitignore` if not present
