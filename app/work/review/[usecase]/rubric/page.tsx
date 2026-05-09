import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getUseCase } from "@/lib/usecases/registry";
import type { UseCaseId } from "@/lib/usecases/types";
import { WorkBreadcrumbs, WorkPageHeader } from "@/components/work/page-shell";
import { RubricView } from "@/components/work/rubric/rubric-view";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);

export default async function RubricPage({
  params,
}: {
  params: Promise<{ usecase: string }>;
}) {
  const { usecase } = await params;
  const uc = getUseCase(usecase);
  if (!uc || !KNOWN_IDS.has(usecase)) notFound();

  return (
    <div className="space-y-6">
      <WorkBreadcrumbs
        crumbs={[
          { label: "Landing", href: "/landing" },
          { label: "Review Documents", href: "/work/review" },
          { label: uc.label, href: `/work/review/${uc.id}` },
          { label: "Rubric" },
        ]}
      />

      <WorkPageHeader
        icon={BookOpen}
        eyebrow="Rubric"
        title={`${uc.label} rubric`}
        blurb="Read-only preview of the evaluation criteria the AI applies. Edits will land in a future release."
      />

      <RubricView usecaseId={usecase as UseCaseId} />
    </div>
  );
}
