"use client";
import { useState, type FormEvent } from "react";
import { usePipelineStore } from "@/store/use-pipeline";

export function InputsForm() {
  const [districtRatingsJson, setDistrictRatingsJson] = useState("");

  async function onDistrictFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setDistrictRatingsJson(""); return; }
    const text = await file.text();
    setDistrictRatingsJson(text);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    // Replace the districtRatings File entry with the parsed JSON string
    fd.delete("districtRatings");
    if (districtRatingsJson.trim()) fd.append("districtRatings", districtRatingsJson);
    await usePipelineStore.getState().start("cmgc-pde", fd);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="factSheet" className="block text-sm font-medium">
          Project nomination fact sheet (DOCX or PDF) *
        </label>
        <input type="file" id="factSheet" name="factSheet" multiple accept=".docx,.pdf" required />
      </div>
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium">Project name (optional)</label>
        <input type="text" id="projectName" name="projectName" />
      </div>
      <div>
        <label htmlFor="districtRatings" className="block text-sm font-medium">
          District pre-filled ratings (JSON, optional)
        </label>
        <input type="file" id="districtRatings" name="districtRatings" accept=".json" onChange={onDistrictFileChange} />
        <p className="text-xs text-muted-foreground mt-1">
          Object like {"{ \"A1\": \"B\", \"A2\": \"C\", ... }"}
        </p>
      </div>
      <div>
        <label htmlFor="provider" className="block text-sm font-medium">AI provider</label>
        <select id="provider" name="provider" defaultValue="openai">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="groq">Groq</option>
        </select>
      </div>
      <button type="submit">Run evaluation</button>
    </form>
  );
}
