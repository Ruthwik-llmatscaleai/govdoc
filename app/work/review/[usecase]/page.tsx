import { notFound } from "next/navigation";
import { getUseCase } from "@/lib/usecases/registry";

export default async function UseCaseRunner({ params }: { params: Promise<{ usecase: string }> }) {
  const { usecase } = await params;
  const uc = getUseCase(usecase);
  if (!uc) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{uc.label}</h1>
      <p className="text-neutral-600">{uc.blurb}</p>
      <div className="p-6 rounded-lg border bg-white text-neutral-600">
        Pipeline runner UI lands when this use case is implemented.
      </div>
    </div>
  );
}
