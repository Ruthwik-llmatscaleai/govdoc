"use client";
import { type FormEvent } from "react";
import { usePipelineStore } from "@/store/use-pipeline";

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
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="pdf" className="block text-sm font-medium">Appraisal PDF *</label>
        <input type="file" id="pdf" name="pdf" accept=".pdf" required />
        <p className="text-xs text-muted-foreground mt-1">
          Phase 1 ships with bundled OCR for these filenames. Other filenames will fall back to a default.
        </p>
        <ul className="text-xs text-muted-foreground mt-1 list-disc pl-5">
          {SUPPORTED_FILENAMES.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>
      <div>
        <label htmlFor="model" className="block text-sm font-medium">AI provider</label>
        <select id="model" name="model" defaultValue="openai">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="groq">Groq</option>
        </select>
      </div>
      <button type="submit">Run evaluation</button>
    </form>
  );
}
