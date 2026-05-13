"use client";
import type { FormEvent } from "react";
import { Play } from "lucide-react";
import { usePipelineStore } from "@/store/use-pipeline";
import {
  Field,
  FilePicker,
  PrimaryButton,
} from "@/components/work/form-fields";

export function InputsForm() {
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await usePipelineStore.getState().start("cmgc-pde", fd);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field
        htmlFor="factSheet"
        label="Project nomination fact sheet (DOCX or PDF)"
        required
        hint="Pass one or more nomination fact sheets. The first will be used as the primary narrative; its filename becomes the project name."
      >
        <FilePicker
          id="factSheet"
          name="factSheet"
          accept=".docx,.pdf"
          multiple
          required
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
