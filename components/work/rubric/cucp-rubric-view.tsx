"use client";
import { Tabs } from "@base-ui/react/tabs";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { defaultCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";

export function CucpRubricView({ data }: { data?: CucpRubricData }) {
  const { l2, l3 } = data ?? defaultCucpRubric();
  return (
    <Tabs.Root
      defaultValue="l2"
      className="rounded-2xl border border-border bg-card"
    >
      <Tabs.List className="flex gap-1 border-b border-border px-2">
        <Tab value="l2" label="Level 2 — Legal Categories" />
        <Tab value="l3" label="Level 3 — 7 Criteria" />
      </Tabs.List>

      <Tabs.Panel value="l2" className="p-5">
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

      <Tabs.Panel value="l3" className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 w-12">#</th>
              <th className="px-5 py-3">Criterion</th>
              <th className="px-5 py-3">Rule</th>
            </tr>
          </thead>
          <tbody>
            {l3.map((c, i) => (
              <tr key={c.s_no} className={i === 0 ? "" : "border-t border-border"}>
                <td className="px-5 py-4 font-mono text-xs font-semibold text-muted-foreground align-top">
                  {c.s_no}
                </td>
                <td className="px-5 py-4 font-medium text-foreground align-top">
                  {c.name}
                </td>
                <td className="px-5 py-4 break-words text-muted-foreground align-top">
                  {c.rule ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tabs.Panel>
    </Tabs.Root>
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
