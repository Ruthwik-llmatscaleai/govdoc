import type { RowRubricData } from "@/lib/usecases/row-appraisal/rubric-data";
import { defaultRowRubric } from "@/lib/usecases/row-appraisal/rubric-data";
import { STATUS_TONE, statusFromScore } from "@/components/work/row/status-tone";
import { RubricShell } from "./shared/rubric-shell";
import { RubricSection } from "./shared/rubric-section";

const TIERS: ("1" | "2" | "3" | "4" | "5")[] = ["1", "2", "3", "4", "5"];

export function RowRubricView({ data }: { data?: RowRubricData }) {
  const schema = data ?? defaultRowRubric();
  const categories = Object.entries(schema);

  const intro = (
    <p className="text-[12.5px] leading-[1.5] text-[var(--color-ink-mute)]">
      {categories.length} categories. Each is rated on a 1–5 scale; cells without text indicate the tier is not used for that category.
    </p>
  );

  return (
    <RubricShell intro={intro}>
      {categories.map(([category, tiers]) => (
        <RubricSection key={category} title={category} count={TIERS.length} countLabel="tier">
          <dl className="flex flex-col gap-1.5">
            {TIERS.map((tier) => (
              <TierRow key={tier} tier={tier} text={tiers[tier]} />
            ))}
          </dl>
        </RubricSection>
      ))}
    </RubricShell>
  );
}

function TierRow({ tier, text }: { tier: "1" | "2" | "3" | "4" | "5"; text: string }) {
  const tone = STATUS_TONE[statusFromScore(Number(tier))];
  return (
    <div className="grid grid-cols-[24px_1fr] items-baseline gap-2.5">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center font-mono text-[10.5px] font-semibold tracking-[0.08em] ${tone.cell}`}
      >
        {tier}
      </span>
      <span className="text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">{text || "—"}</span>
    </div>
  );
}
