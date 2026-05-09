import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import { defaultCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-data";

const SECTION_KEYS = ["A", "B", "C", "D", "E", "F"] as const;

export function CmgcRubricView({ data }: { data?: CmgcRubricData }) {
  const { questions, weights } = data ?? defaultCmgcRubric();

  const bySection = new Map<string, typeof questions[number][]>();
  for (const q of questions) {
    const arr = bySection.get(q.section) ?? [];
    arr.push(q);
    bySection.set(q.section, arr);
  }
  const sections = Array.from(bySection.entries());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4 text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">
          Section weights
        </span>
        {SECTION_KEYS.map((k) => (
          <span
            key={k}
            className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground"
          >
            {k} {Math.round(weights[k] * 100)}%
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {sections.map(([section, qs], i) => (
          <details
            key={section}
            open={i === 0}
            className="group rounded-2xl border border-border bg-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-base font-semibold text-foreground">
              <span>{section}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {qs.length} question{qs.length === 1 ? "" : "s"}
                <span className="ml-2 text-foreground/60 transition group-open:rotate-180 inline-block">
                  ▾
                </span>
              </span>
            </summary>
            <div className="space-y-5 border-t border-border p-5">
              {qs.map((q) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {q.id}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground">
                      {q.question}
                    </h4>
                  </div>
                  <ul className="space-y-1.5 pl-6">
                    <Option label="A" text={q.option_a} />
                    <Option label="B" text={q.option_b} />
                    <Option label="C" text={q.option_c} />
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function Option({ label, text }: { label: string; text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[oklch(0.94_0.05_280)] text-[10px] font-bold text-[oklch(0.45_0.15_280)]">
        {label}
      </span>
      <span className="break-words text-foreground/85">{text}</span>
    </li>
  );
}
