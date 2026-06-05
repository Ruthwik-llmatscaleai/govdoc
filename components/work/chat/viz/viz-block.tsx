"use client";

import { z } from "zod";
import { CodeBlock } from "../code-block";
import { VizBarChart } from "./bar-chart";
import { VizPieChart } from "./pie-chart";
import { VizStatCards } from "./stat-card";

// Schema for the model-emitted ```govdoc-viz block (Phase 2a). Accepts either a
// single chart spec or a dashboard ({ title, charts: [...] }). Later the same
// shape can be produced from the reconciled BudgetFact store (Phase 2b).
const VizItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  cite: z.string().optional(),
  series: z.string().optional(), // e.g. city name, for grouped comparison charts
});
const SpecSchema = z.object({
  kind: z.enum(["stat", "bar", "pie"]),
  title: z.string().optional(),
  unit: z.string().optional(),
  data: z.array(VizItemSchema).min(1),
});
const DashboardSchema = z.object({
  title: z.string().optional(),
  charts: z.array(SpecSchema).min(1),
});
const VizSchema = z.union([DashboardSchema, SpecSchema]);

export type VizItem = z.infer<typeof VizItemSchema>;
type Spec = z.infer<typeof SpecSchema>;

function OneChart({ spec }: { spec: Spec }) {
  const cites = Array.from(new Set(spec.data.map((d) => d.cite).filter((c): c is string => Boolean(c))));
  return (
    <figure className="rounded-2xl border border-[#d6cfba] bg-[#f7f5ed] p-4">
      {spec.title && (
        <figcaption className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-[#0E1410]" style={{ fontFamily: "var(--font-display)" }}>
          {spec.title}
        </figcaption>
      )}
      {spec.kind === "stat" && <VizStatCards data={spec.data} unit={spec.unit} />}
      {spec.kind === "bar" && <VizBarChart data={spec.data} unit={spec.unit} />}
      {spec.kind === "pie" && <VizPieChart data={spec.data} unit={spec.unit} />}
      {cites.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cites.map((c) => (
            <span key={c} className="rounded-full border border-[#d6cfba] bg-[#FCFAF3] px-2 py-0.5 text-[10px] text-[#556157]" style={{ fontFamily: "var(--font-mono)" }}>
              {c}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}

/**
 * Renders a ```govdoc-viz block: a single chart or a dashboard (stack of charts).
 * Invalid JSON falls back to a JSON code block so nothing is lost and bad data
 * never renders as a "real" chart.
 */
export function VizBlock({ raw }: { raw: string }) {
  const parsed = (() => {
    try {
      return VizSchema.safeParse(JSON.parse(raw));
    } catch {
      return null;
    }
  })();

  if (!parsed || !parsed.success) {
    return <CodeBlock code={raw} language="json" />;
  }

  const spec = parsed.data;
  if ("charts" in spec) {
    return (
      <div className="my-2 space-y-4">
        {spec.title && (
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0E1410]" style={{ fontFamily: "var(--font-display)" }}>
            {spec.title}
          </h3>
        )}
        {spec.charts.map((c, i) => (
          <OneChart key={i} spec={c} />
        ))}
      </div>
    );
  }

  return (
    <div className="my-2">
      <OneChart spec={spec} />
    </div>
  );
}
