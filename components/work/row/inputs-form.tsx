"use client";
import { type FormEvent } from "react";
import { Play } from "lucide-react";
import { usePipelineStore } from "@/store/use-pipeline";
import {
  Field,
  FilePicker,
  PrimaryButton,
} from "@/components/work/form-fields";

const SUPPORTED_FILENAMES = [
  "Appraisal_EA2F590_Parcel_36668.pdf",
  "Appraisal_EA_2F590_Parcel_36674 (1).pdf",
  "Appraisal_EA_0J910,_Parcel_38355.pdf",
  "37857_-_Lee_Appraisal.pdf",
];

export function InputsForm() {
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await usePipelineStore.getState().start("row-appraisal", fd);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field
        htmlFor="pdf"
        label="Appraisal PDF"
        required
        hint={
          <div>
            <p>
              Phase 1 ships with bundled OCR for the four sample filenames below.
              Other filenames will fall back to a default text layer.
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[11px] font-mono text-muted-foreground/85">
              {SUPPORTED_FILENAMES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        }
      >
        <FilePicker id="pdf" name="pdf" accept=".pdf" required />
      </Field>

      <div className="flex justify-end pt-1">
        <PrimaryButton>
          <Play className="size-4" /> Run evaluation
        </PrimaryButton>
      </div>
    </form>
  );
}
