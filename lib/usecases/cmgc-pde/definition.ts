import type { UseCase } from "../types";
import { extractStep } from "./pipeline/extract-step";
import { evaluateStep } from "./pipeline/evaluate-step";
import { scoreStep } from "./pipeline/score-step";
import { validateStep } from "./pipeline/validate-step";
import { xlsxExporter } from "./exporters/xlsx";
import { docxExporter } from "./exporters/docx";

export const cmgcPde: UseCase = {
  id: "cmgc-pde",
  label: "CMGC / Project Delivery Evaluator V2",
  blurb: "Score a Caltrans nomination fact sheet against the 25-question delivery method rubric.",
  tile: "review",
  inputs: [
    {
      kind: "file", id: "factSheet",
      label: "Project nomination fact sheet (DOCX or PDF)",
      accept: [".docx", ".pdf"],
      multiple: true, required: true,
    },
    {
      kind: "text", id: "projectName",
      label: "Project name (optional)",
    },
    {
      kind: "json-upload", id: "districtRatings",
      label: "District pre-filled ratings (JSON, optional)",
      help: 'Object like { "A1": "B", "A2": "C", ... }',
    },
    {
      kind: "model-pick", id: "model",
      label: "AI provider",
      providers: ["openai", "anthropic", "groq"],
    },
  ],
  pipeline: [extractStep, evaluateStep, scoreStep, validateStep],
  exporters: [xlsxExporter, docxExporter],
  resultView: { kind: "wizard" },
};
