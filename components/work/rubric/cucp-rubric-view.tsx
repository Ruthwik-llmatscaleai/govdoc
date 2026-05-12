"use client";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import { defaultCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { CucpL3Criterion } from "@/lib/usecases/cucp-reevals/rubric";
import { RubricShell } from "./shared/rubric-shell";
import { RubricSection } from "./shared/rubric-section";

export function CucpRubricView({ data }: { data?: CucpRubricData }) {
  const { l2, l3 } = data ?? defaultCucpRubric();
  const mandatory = l3.filter((c) => c.s_no <= 3);
  const evaluation = l3.filter((c) => c.s_no >= 4);

  const intro = (
    <header className="space-y-1">
      <h3
        className="text-[17px] font-medium leading-[1.2] tracking-[-0.012em] text-[var(--color-ink)]"
        style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 48' }}
      >
        Rubric for Evaluating Social and Economic Disadvantage (SED) Narrative (PN); and Personal Net Worth (PNW) (§26.67)
      </h3>
      <p className="text-[12.5px] leading-[1.5] text-[var(--color-ink-mute)]">
        Apply Mandatory Eligibility Requirements first. If any are marked NO, stop — the firm is not eligible. If all are marked YES, evaluate the four scored criteria below.
      </p>
    </header>
  );

  return (
    <RubricShell intro={intro}>
      <RubricSection
        sectionKey="§26.67"
        title="SED Rubric — Mandatory & Scored Criteria"
        count={l3.length}
        countLabel="criterion"
        defaultOpen
      >
        <div className="space-y-8">
          <section className="space-y-3">
            <SectionHeading>Mandatory Eligibility Requirements</SectionHeading>
            <div className="space-y-3">
              {mandatory.map((c) => (
                <CriterionCard key={c.s_no} criterion={c} />
              ))}
            </div>
            <p className="border border-[var(--color-govdoc-primary)]/40 bg-[var(--color-accent-soft)] px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">
              <strong className="font-semibold text-[var(--color-govdoc-deep)]">Gating rule:</strong> If <em>any</em> of the mandatory eligibility requirements are marked NO, the firm is not eligible for certification. STOP. If all are marked YES, proceed to the scored evaluation criteria below. If clarification is needed, the firm must be contacted before determination is made.
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
            <p className="border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">
              If the personal narrative indicates some individualized social and economic disadvantage, but lacks clarity, detail, or documentation in key areas, then additional evidence, documents, context, or clarification must be requested to make a final determination.
            </p>
          </section>

          <section className="space-y-3">
            <SectionHeading>Final Determination</SectionHeading>
            <p className="border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">
              Consistent with the current version of 49 CFR part 26, an impartial and independent evaluation of the subject application has been completed. Based on the totality of the circumstances, including those factors set forth above, it has been determined by a preponderance of the evidence that the applicant [has/has not] sufficiently demonstrated social and economic disadvantage (SED) affirmatively based on their own experiences and circumstances within American society, and not based in whole or in part on race or sex.
            </p>
          </section>

          <section className="space-y-3">
            <SectionHeading>Comments</SectionHeading>
            <p className="border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">
              Certifier should use this section to summarize strengths, weaknesses, and any notable observations about the personal narrative.
            </p>
          </section>
        </div>
      </RubricSection>

      <RubricSection title="Level 2 — Legal Categories" count={l2.length} countLabel="category">
        <p className="mb-4 text-[12.5px] leading-[1.5] text-[var(--color-ink-mute)]">
          Level 2 categories classify each piece of evidence in the narrative. They are not part of the §26.67 YES/NO rubric — they support the scored evaluation criteria above.
        </p>
        <dl className="flex flex-col">
          {l2.map((c, i) => (
            <div
              key={c.name}
              className={`grid grid-cols-[200px_1fr] gap-6 py-3.5 ${
                i === l2.length - 1 ? "" : "border-b border-[var(--color-line-soft)]"
              }`}
            >
              <dt className="text-[13.5px] font-semibold text-[var(--color-ink)]">{c.name}</dt>
              <dd className="break-words text-[13px] leading-[1.55] text-[var(--color-ink-mute)]">{c.description}</dd>
            </div>
          ))}
        </dl>
      </RubricSection>
    </RubricShell>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
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
    <div className="border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div className="flex items-baseline gap-2.5">
        {displayNumber !== undefined && (
          <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[var(--color-govdoc-primary)]">
            {displayNumber}.
          </span>
        )}
        <h5 className="text-[13.5px] font-semibold text-[var(--color-ink)]">{heading}</h5>
      </div>
      {c.rule && (
        <p className="mt-2 text-[12px] italic leading-[1.5] text-[var(--color-ink-mute)]">
          <span className="font-semibold not-italic text-[var(--color-ink-soft)]">Rule:</span> {c.rule}
        </p>
      )}
      <dl className="mt-3 space-y-2">
        <YesNoRow label="Yes" tone="yes" text={c.pass} />
        <YesNoRow label="No" tone="no" text={c.fail} />
      </dl>
    </div>
  );
}

function YesNoRow({
  label,
  tone,
  text,
}: {
  label: string;
  tone: "yes" | "no";
  text: string | undefined;
}) {
  const chipClass =
    tone === "yes"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
      : "border-[var(--color-govdoc-primary)]/40 bg-[var(--color-accent-soft)] text-[var(--color-govdoc-deep)]";
  return (
    <div className="flex items-start gap-3">
      <span className={`shrink-0 border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${chipClass}`}>
        {label}
      </span>
      <dd className="flex-1 break-words text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">{text ?? "—"}</dd>
    </div>
  );
}
