import type { UseCaseId } from "./types";

export type UseCaseMetadata = {
  id: UseCaseId;
  label: string;
  blurb: string;
  tile: "review";
  exporters: { id: string; label: string }[];
};

const ALL_METADATA: UseCaseMetadata[] = [
  {
    id: "cmgc-pde",
    label: "CMGC / Project Delivery Evaluator V2",
    blurb: "Score project narratives against the 32-category CMGC PDE rubric.",
    tile: "review",
    exporters: [
      { id: "xlsx", label: "Download Excel" },
      { id: "docx", label: "Download DOCX" },
    ],
  },
  {
    id: "cucp-reevals",
    label: "CUCP Re-Evaluations",
    blurb: "Re-evaluate firms under 49 CFR §26.67 against 7 mandatory criteria.",
    tile: "review",
    exporters: [
      { id: "xlsx", label: "Download Excel" },
      { id: "docx", label: "Download DOCX" },
      { id: "json", label: "Download full JSON" },
    ],
  },
  {
    id: "row-appraisal",
    label: "ROW Appraisal Evaluator",
    blurb: "Score Caltrans Right of Way appraisal reports against the 34-category rubric.",
    tile: "review",
    exporters: [
      { id: "xlsx", label: "Download Excel" },
      { id: "docx", label: "Download DOCX" },
    ],
  },
];

export function getUseCaseMetadata(id: string): UseCaseMetadata | undefined {
  return ALL_METADATA.find((u) => u.id === id);
}

export const USE_CASES_METADATA_BY_TILE: Record<"review" | "search" | "draft" | "inbox", UseCaseMetadata[]> = {
  review: ALL_METADATA.filter((u) => u.tile === "review"),
  search: [],
  draft: [],
  inbox: [],
};
