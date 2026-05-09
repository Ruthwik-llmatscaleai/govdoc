import { BookOpen } from "lucide-react";
import { WorkBreadcrumbs, WorkPageHeader } from "@/components/work/page-shell";
import { PreviewRubricTabs } from "@/components/work/rubric/preview-tabs";
import { loadCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { loadCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { loadRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";

export const dynamic = "force-dynamic";

export default async function PreviewRubricsPage() {
  const [cmgc, cucp, row] = await Promise.all([
    loadCmgcRubric(),
    loadCucpRubric(),
    loadRowRubric(),
  ]);

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
        blurb="Read-only preview of the criteria the AI applies for each review type. Edits made in Edit Rubrics show up here immediately."
      />

      <PreviewRubricTabs cmgc={cmgc} cucp={cucp} row={row} />
    </div>
  );
}
