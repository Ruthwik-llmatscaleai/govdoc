"use client";
import { type FormEvent } from "react";
import { usePipelineStore } from "@/store/use-pipeline";

export function InputsForm() {
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await usePipelineStore.getState().start("cucp-reevals", fd);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="narrative" className="block text-sm font-medium">
          Personal Narrative Statement (PDF) *
        </label>
        <input type="file" id="narrative" name="narrative" accept=".pdf" required />
      </div>
      <div>
        <label htmlFor="revenues" className="block text-sm font-medium">
          Firm revenues spreadsheet (XLSX, optional)
        </label>
        <input type="file" id="revenues" name="revenues" accept=".xlsx" />
      </div>
      <div>
        <label htmlFor="model" className="block text-sm font-medium">AI provider</label>
        <select id="model" name="model" defaultValue="openai">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="groq">Groq</option>
        </select>
      </div>
      <button type="submit">Run re-evaluation</button>
    </form>
  );
}
