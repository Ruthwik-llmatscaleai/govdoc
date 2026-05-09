"use client";
import { Tabs } from "@base-ui/react/tabs";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import { defaultCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { CucpL3Criterion } from "@/lib/usecases/cucp-reevals/rubric";

export function CucpRubricView({ data }: { data?: CucpRubricData }) {
  const { l2, l3 } = data ?? defaultCucpRubric();
  const mandatory = l3.filter((c) => c.s_no <= 3);
  const evaluation = l3.filter((c) => c.s_no >= 4);

  return (
    <Tabs.Root
      defaultValue="l3"
      className="rounded-2xl border border-border bg-card"
    >
      <Tabs.List className="flex gap-1 border-b border-border px-2">
        <Tab value="l3" label="§26.67 SED Rubric" />
        <Tab value="l2" label="Level 2 — Legal Categories" />
      </Tabs.List>

      <Tabs.Panel value="l3" className="space-y-8 p-6">
        <header className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Rubric for Evaluating Social and Economic Disadvantage (SED) Narrative
            (PN); and Personal Net Worth (PNW) (§26.67)
          </h3>
          <p className="text-xs text-muted-foreground">
            Apply Mandatory Eligibility Requirements first. If any are FAIL, stop
            — the firm is not eligible. If all PASS, evaluate the four scored
            criteria below.
          </p>
        </header>

        <section className="space-y-3">
          <SectionHeading>Mandatory Eligibility Requirements</SectionHeading>
          <div className="space-y-3">
            {mandatory.map((c) => (
              <CriterionCard key={c.s_no} criterion={c} />
            ))}
          </div>
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-foreground/85">
            <strong>Gating rule:</strong> If <em>any</em> of the mandatory
            eligibility requirements are marked FAIL, the firm is not eligible
            for certification. STOP. If all are marked PASS, proceed to the
            scored evaluation criteria below. If clarification is needed, the
            firm must be contacted before determination is made.
          </p>
        </section>

        <section className="space-y-3">
          <SectionHeading>Scored Evaluation Criteria</SectionHeading>
          <div className="space-y-3">
            {evaluation.map((c, i) => (
              <CriterionCard key={c.s_no} criterion={c} displayNumber={i + 1} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading>Request Additional Information</SectionHeading>
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-foreground/85">
            If the personal narrative indicates some individualized social and
            economic disadvantage, but lacks clarity, detail, or documentation
            in key areas, then additional evidence, documents, context, or
            clarification must be requested to make a final determination.
          </p>
        </section>

        <section className="space-y-3">
          <SectionHeading>Final Decision</SectionHeading>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs leading-relaxed text-foreground/85">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Pass
              </div>
              <p className="mt-1">
                Meets all requirements of social and economic disadvantage. All
                sections marked PASS; applicant clearly demonstrates Social and
                Economic Disadvantage through individualized narrative and
                current Personal Net Worth form.
              </p>
            </div>
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-relaxed text-foreground/85">
              <div className="text-[11px] font-bold uppercase tracking-wider text-destructive">
                Fail
              </div>
              <p className="mt-1">
                Fails to meet all requirements of social and economic
                disadvantage. Narrative lacks individualized detail, credible
                examples, or connection to economic harm. Applicant provides
                insufficient evidence of disadvantage.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading>Comments</SectionHeading>
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-foreground/85">
            Certifier should use this section to summarize strengths,
            weaknesses, and any notable observations about the personal
            narrative.
          </p>
        </section>
      </Tabs.Panel>

      <Tabs.Panel value="l2" className="p-5">
        <p className="mb-3 text-xs text-muted-foreground">
          Level 2 categories classify each piece of evidence in the narrative.
          They are not part of the §26.67 PASS/FAIL rubric — they support the
          scored evaluation criteria above.
        </p>
        <dl className="space-y-4">
          {l2.map((c) => (
            <div key={c.name}>
              <dt className="text-sm font-semibold text-foreground">{c.name}</dt>
              <dd className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">
                {c.description}
              </dd>
            </div>
          ))}
        </dl>
      </Tabs.Panel>
    </Tabs.Root>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </h4>
  );
}

function CriterionCard({
  criterion: c,
  displayNumber,
}: {
  criterion: CucpL3Criterion;
  displayNumber?: number;
}) {
  const heading = c.title ?? c.name;
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="flex items-baseline gap-2">
        {displayNumber !== undefined && (
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {displayNumber}.
          </span>
        )}
        <h5 className="text-sm font-semibold text-foreground">{heading}</h5>
      </div>
      {c.rule && (
        <p className="mt-1.5 text-xs italic text-muted-foreground">
          <span className="font-semibold not-italic">Rule:</span> {c.rule}
        </p>
      )}
      <dl className="mt-3 space-y-2">
        <PassFailRow label="Pass" tone="pass" text={c.pass} />
        <PassFailRow label="Fail" tone="fail" text={c.fail} />
      </dl>
    </div>
  );
}

function PassFailRow({
  label,
  tone,
  text,
}: {
  label: string;
  tone: "pass" | "fail";
  text: string | undefined;
}) {
  const chipClass =
    tone === "pass"
      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
      : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <div className="flex items-start gap-3">
      <span
        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${chipClass}`}
      >
        {label}
      </span>
      <dd className="flex-1 break-words text-xs leading-relaxed text-foreground/85">
        {text ?? "—"}
      </dd>
    </div>
  );
}

function Tab({ value, label }: { value: string; label: string }) {
  return (
    <Tabs.Tab
      value={value}
      render={(props, state) => (
        <button
          {...props}
          data-selected={state.active ? "true" : undefined}
          className="rounded-t-md px-4 py-3 text-sm font-medium text-muted-foreground transition data-[selected=true]:border-b-2 data-[selected=true]:border-primary data-[selected=true]:text-foreground"
        >
          {label}
        </button>
      )}
    />
  );
}
