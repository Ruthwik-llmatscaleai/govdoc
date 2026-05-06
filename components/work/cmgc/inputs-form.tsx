"use client";
import { useState, type FormEvent } from "react";
import { Play } from "lucide-react";
import { usePipelineStore } from "@/store/use-pipeline";
import {
  Field,
  FilePicker,
  PrimaryButton,
  TextField,
} from "@/components/work/form-fields";

export function InputsForm() {
  const [districtRatingsJson, setDistrictRatingsJson] = useState("");

  async function onDistrictFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setDistrictRatingsJson("");
      return;
    }
    const text = await file.text();
    setDistrictRatingsJson(text);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("districtRatings");
    if (districtRatingsJson.trim()) fd.append("districtRatings", districtRatingsJson);
    await usePipelineStore.getState().start("cmgc-pde", fd);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field
        htmlFor="factSheet"
        label="Project nomination fact sheet (DOCX or PDF)"
        required
        hint="Pass one or more nomination fact sheets. The first will be used as the primary narrative."
      >
        <FilePicker
          id="factSheet"
          name="factSheet"
          accept=".docx,.pdf"
          multiple
          required
        />
      </Field>

      <Field
        htmlFor="projectName"
        label="Project name (optional)"
        hint="Overrides the project name extracted from the fact sheet."
      >
        <TextField
          id="projectName"
          name="projectName"
          placeholder="e.g. SR-99 Widening, Sacramento County"
        />
      </Field>

      <Field
        htmlFor="districtRatings"
        label="District pre-filled ratings (JSON, optional)"
        hint={
          <>
            Object like <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{'{ "A1": "B", "A2": "C", … }'}</code>.
            When present, the district&apos;s ratings are merged into the LLM rating pass.
          </>
        }
      >
        <FilePicker
          id="districtRatings"
          name="districtRatings"
          accept=".json"
          onChange={onDistrictFileChange}
        />
      </Field>

      <div className="flex justify-end pt-1">
        <PrimaryButton>
          <Play className="size-4" /> Run evaluation
        </PrimaryButton>
      </div>
    </form>
  );
}
