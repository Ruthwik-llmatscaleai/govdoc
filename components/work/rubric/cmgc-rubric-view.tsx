"use client";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import { defaultCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { RubricQuestion } from "@/lib/usecases/cmgc-pde/rubric";
import { RubricShell } from "./shared/rubric-shell";
import { RubricSection } from "./shared/rubric-section";

const SECTION_KEYS = ["A", "B", "C", "D", "E", "F"] as const;

function splitSection(label: string): { key: string; name: string } {
  const m = label.match(/^([A-Z]):\s*(.+)$/);
  if (m && m[1] && m[2]) return { key: m[1], name: m[2] };
  return { key: label.charAt(0), name: label };
}

export function CmgcRubricView({ data }: { data?: CmgcRubricData }) {
  const { questions, weights } = data ?? defaultCmgcRubric();

  const bySection = new Map<string, { name: string; qs: RubricQuestion[] }>();
  for (const q of questions) {
    const { key, name } = splitSection(q.section);
    const cur = bySection.get(key) ?? { name, qs: [] };
    cur.qs.push(q);
    bySection.set(key, cur);
  }
  const sections = SECTION_KEYS.map((k) => ({
    key: k,
    name: bySection.get(k)?.name ?? k,
    qs: bySection.get(k)?.qs ?? [],
    weight: weights[k],
  }));

  const dominantKey = sections.reduce(
    (acc, s) => (s.weight > (acc?.weight ?? -1) ? s : acc),
    sections[0],
  )?.key;

  const intro = (
    <div
      aria-label="Section weights"
      className="flex items-center overflow-hidden border border-[var(--color-line)] bg-[var(--color-paper)]"
    >
      <div className="shrink-0 border-r border-[var(--color-line)] bg-[var(--color-cream)] px-5 py-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)]">
        Section Weights
      </div>
      <div className="flex h-12 flex-1">
        {sections.map((s, i) => {
          const isLast = i === sections.length - 1;
          const isDominant = s.key === dominantKey;
          return (
            <div
              key={s.key}
              style={{ flex: Math.round(s.weight * 100) }}
              className={`flex flex-col items-center justify-center transition-colors hover:bg-[var(--color-cream-soft)] ${
                isLast ? "" : "border-r border-[var(--color-line-soft)]"
              }`}
            >
              <span
                className={`font-mono text-[11px] font-semibold leading-none tracking-[0.08em] ${
                  isDominant ? "text-[var(--color-govdoc-primary)]" : "text-[var(--color-ink)]"
                }`}
              >
                {s.key}
              </span>
              <span
                className={`mt-0.5 font-mono text-[9.5px] leading-none tracking-[0.08em] ${
                  isDominant ? "font-medium text-[var(--color-govdoc-deep)]" : "text-[var(--color-ink-mute)]"
                }`}
              >
                {Math.round(s.weight * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <RubricShell intro={intro}>
      {sections.map((s, i) => (
        <RubricSection
          key={s.key}
          sectionKey={s.key}
          title={s.name}
          count={s.qs.length}
          countLabel="question"
          defaultOpen={i === 0}
        >
          <ol className="flex list-none flex-col gap-4">
            {s.qs.map((q) => (
              <li key={q.id} className="border-b border-[var(--color-line-soft)] py-3 last:border-b-0">
                <div className="grid grid-cols-[auto_1fr] items-baseline gap-3.5 text-[13.5px] leading-[1.5] text-[var(--color-ink-soft)]">
                  <span className="font-mono text-[10.5px] tracking-[0.08em] text-[var(--color-ink-faint)]">
                    {q.id}
                  </span>
                  <span className="font-medium">{q.question}</span>
                </div>
                <dl className="mt-2.5 ml-[42px] flex flex-col gap-1.5">
                  <RatingRow letter="A" text={q.option_a} />
                  <RatingRow letter="B" text={q.option_b} />
                  <RatingRow letter="C" text={q.option_c} />
                </dl>
              </li>
            ))}
          </ol>
        </RubricSection>
      ))}
    </RubricShell>
  );
}

function RatingRow({ letter, text }: { letter: "A" | "B" | "C"; text: string }) {
  return (
    <div className="grid grid-cols-[24px_1fr] items-baseline gap-2.5">
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
        {letter}
      </span>
      <span className="text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">{text}</span>
    </div>
  );
}
