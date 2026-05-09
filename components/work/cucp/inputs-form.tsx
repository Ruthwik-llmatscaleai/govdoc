"use client";
import { type FormEvent } from "react";
import { Play } from "lucide-react";
import { usePipelineStore } from "@/store/use-pipeline";
import {
  Field,
  FilePicker,
  PrimaryButton,
  TextField,
} from "@/components/work/form-fields";

export function InputsForm() {
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await usePipelineStore.getState().start("cucp-reevals", fd);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field
        htmlFor="projectId"
        label="Project ID"
        required
        hint="A stable identifier for this project (e.g. applicant ID, firm + contract number). All institutional memory corrections you commit will be scoped to this Project ID."
      >
        <TextField id="projectId" name="projectId" required />
      </Field>

      <Field
        htmlFor="narrative"
        label="Personal Narrative Statement (PDF)"
        required
        hint="The applicant's personal narrative under 49 CFR §26.67. Used for fact extraction and W-5 audit."
      >
        <FilePicker id="narrative" name="narrative" accept=".pdf" required />
      </Field>

      <Field
        htmlFor="revenues"
        label="Firm revenues spreadsheet (XLSX, optional)"
        hint="Upload to enable the small business size threshold check."
      >
        <FilePicker id="revenues" name="revenues" accept=".xlsx" />
      </Field>

      <div className="flex justify-end pt-1">
        <PrimaryButton>
          <Play className="size-4" /> Run re-evaluation
        </PrimaryButton>
      </div>
    </form>
  );
}
