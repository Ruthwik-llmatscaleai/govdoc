"use client";
import { Tabs } from "@base-ui/react/tabs";
import { CmgcRubricView } from "./cmgc-rubric-view";
import { CucpRubricView } from "./cucp-rubric-view";
import { RowRubricView } from "./row-rubric-view";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { RowRubricData } from "@/lib/usecases/row-appraisal/rubric-data";

const TAB_TRIGGER =
  "px-4 py-3 text-sm font-semibold tracking-tight text-muted-foreground transition-colors data-[selected=true]:text-foreground data-[selected=true]:border-b-2 data-[selected=true]:border-primary";

function tabRender(
  props: React.ComponentPropsWithRef<"button">,
  state: { active: boolean },
) {
  return <button {...props} data-selected={state.active ? "true" : undefined} />;
}

type Props = {
  cmgc: CmgcRubricData;
  cucp: CucpRubricData;
  row: RowRubricData;
};

export function PreviewRubricTabs({ cmgc, cucp, row }: Props) {
  return (
    <Tabs.Root defaultValue="cmgc-pde" className="rounded-2xl border border-border bg-card">
      <Tabs.List className="flex gap-1 overflow-x-auto border-b border-border px-2">
        <Tabs.Tab value="cmgc-pde" className={TAB_TRIGGER} render={tabRender}>
          CMGC PDE
        </Tabs.Tab>
        <Tabs.Tab value="cucp-reevals" className={TAB_TRIGGER} render={tabRender}>
          CUCP Re-evaluations
        </Tabs.Tab>
        <Tabs.Tab value="row-appraisal" className={TAB_TRIGGER} render={tabRender}>
          ROW Appraisal
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="cmgc-pde" className="p-5">
        <CmgcRubricView data={cmgc} />
      </Tabs.Panel>
      <Tabs.Panel value="cucp-reevals" className="p-5">
        <CucpRubricView data={cucp} />
      </Tabs.Panel>
      <Tabs.Panel value="row-appraisal" className="p-5">
        <RowRubricView data={row} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
