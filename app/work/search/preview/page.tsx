"use client";
import { Tabs } from "@base-ui/react/tabs";
import { BookOpen } from "lucide-react";
import { WorkBreadcrumbs, WorkPageHeader } from "@/components/work/page-shell";
import { CmgcRubricView } from "@/components/work/rubric/cmgc-rubric-view";
import { CucpRubricView } from "@/components/work/rubric/cucp-rubric-view";
import { RowRubricView } from "@/components/work/rubric/row-rubric-view";

const RUBRICS = [
  { id: "cmgc-pde",     label: "CMGC PDE",                  view: <CmgcRubricView /> },
  { id: "cucp-reevals", label: "CUCP Re-evaluations",       view: <CucpRubricView /> },
  { id: "row-appraisal", label: "ROW Appraisal",            view: <RowRubricView /> },
];

const TAB_TRIGGER =
  "px-4 py-3 text-sm font-semibold tracking-tight text-muted-foreground transition-colors data-[selected=true]:text-foreground data-[selected=true]:border-b-2 data-[selected=true]:border-primary";

function tabRender(props: React.ComponentPropsWithRef<"button">, state: { active: boolean }) {
  return <button {...props} data-selected={state.active ? "true" : undefined} />;
}

export default function PreviewRubricsPage() {
  return (
    <div className="space-y-6">
      <WorkBreadcrumbs
        crumbs={[
          { label: "Landing", href: "/landing" },
          { label: "Search & Ask", href: "/work/search" },
          { label: "Preview Rubrics" },
        ]}
      />

      <WorkPageHeader
        icon={BookOpen}
        eyebrow="Rubric"
        title="Evaluation rubrics"
        blurb="Read-only preview of the criteria the AI applies for each review type."
      />

      <Tabs.Root defaultValue={RUBRICS[0]!.id} className="rounded-2xl border border-border bg-card">
        <Tabs.List className="flex gap-1 overflow-x-auto border-b border-border px-2">
          {RUBRICS.map((r) => (
            <Tabs.Tab key={r.id} value={r.id} className={TAB_TRIGGER} render={tabRender}>
              {r.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {RUBRICS.map((r) => (
          <Tabs.Panel key={r.id} value={r.id} className="p-5">
            {r.view}
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  );
}
