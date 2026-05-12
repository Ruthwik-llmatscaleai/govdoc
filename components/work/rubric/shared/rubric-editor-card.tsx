"use client";
import { useState } from "react";

export type EditorField = {
  name: string;
  label: string;
  type: "text" | "textarea";
  required?: boolean;
  placeholder?: string;
};

export type EditorValues = Record<string, string>;

export function RubricEditorCard({
  mode,
  title,
  fields,
  initialValues,
  saveLabel,
  onSave,
  onCancel,
}: {
  mode: "edit" | "create";
  title: string;
  fields: EditorField[];
  initialValues: EditorValues;
  saveLabel?: string;
  onSave: (values: EditorValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<EditorValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSave() {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !values[f.name]?.trim()) {
        next[f.name] = `${f.label} is required`;
      }
    }
    setErrors(next);
    if (Object.keys(next).length === 0) onSave(values);
  }

  return (
    <div
      role="dialog"
      aria-label={title}
      className="sticky bottom-4 z-10 mt-4 space-y-4 rounded-2xl border border-border bg-card/95 p-5 backdrop-blur shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {mode === "edit" ? "Edit" : "Create"}
          </span>
          {title}
        </h3>
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {f.label}
              {f.required && <span className="ml-1 text-destructive">*</span>}
            </span>
            {f.type === "textarea" ? (
              <textarea
                aria-label={f.label}
                value={values[f.name] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                }
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            ) : (
              <input
                aria-label={f.label}
                type="text"
                value={values[f.name] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            )}
            {errors[f.name] && (
              <span className="mt-1 block text-[11px] text-destructive">{errors[f.name]}</span>
            )}
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)]"
        >
          {saveLabel ?? (mode === "edit" ? "Save changes" : "Save")}
        </button>
      </div>
    </div>
  );
}
