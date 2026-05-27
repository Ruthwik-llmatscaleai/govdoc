/**
 * Pull a human-readable message out of a BigQuery / Google-auth error.
 *
 * Two awkward shapes the @google-cloud/bigquery SDK throws:
 *  - PartialFailureError on streaming inserts: top-level `.message` is empty;
 *    detail lives in `.errors[].errors[]` as `{ message, reason, location }`.
 *  - ApiError on queries: `.errors[0].message` + `.code`.
 *  - google-auth errors (e.g. invalid_grant): `.message` short, `.response.data`
 *    sometimes has more detail.
 *
 * Returns the most specific text we can find, defaulting to `fallback`.
 */
export function bqErrorMessage(err: unknown, fallback = "BigQuery request failed"): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  const e = err as Record<string, unknown> & { message?: string };

  // PartialFailureError shape — errors is an array of { errors: [...], row }
  const errs = e.errors as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(errs) && errs.length > 0) {
    const first = errs[0];
    if (first && typeof first === "object") {
      const inner = (first as { errors?: Array<{ message?: string; reason?: string }> }).errors;
      if (Array.isArray(inner) && inner.length > 0 && inner[0]?.message) {
        const reason = inner[0].reason ? ` [${inner[0].reason}]` : "";
        return `${inner[0].message}${reason}`;
      }
      const direct = first as { message?: string; reason?: string };
      if (direct.message) {
        return direct.reason ? `${direct.message} [${direct.reason}]` : direct.message;
      }
    }
  }

  if (typeof e.message === "string" && e.message.trim().length > 0) return e.message;

  // google-auth ApiError sometimes only carries detail under response.data
  const resp = e.response as { data?: unknown } | undefined;
  if (resp?.data) {
    try {
      return JSON.stringify(resp.data);
    } catch {
      /* fall through */
    }
  }
  return fallback;
}

/**
 * Map raw server messages → friendly UI copy. Covers the common BigQuery /
 * auth failure modes so the chat surfaces an actionable hint instead of
 * raw library text.
 */
export function bqFriendlyMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid_grant")) {
    return "Your Google credentials have expired. Run `gcloud auth application-default login` and refresh the page.";
  }
  if (lower.includes("could not load the default credentials")) {
    return "Google credentials are not configured. Run `gcloud auth application-default login` in your terminal.";
  }
  if (lower.includes("not found: dataset") || lower.includes("dataset not found")) {
    return "The BigQuery dataset doesn't exist yet. Create it before chatting.";
  }
  if (lower.includes("not found: table") || lower.includes("table not found")) {
    return "The BigQuery chat tables don't exist yet. Create them before chatting.";
  }
  if (lower.includes("permission") && lower.includes("denied")) {
    return "Your Google account doesn't have permission to write to this BigQuery dataset.";
  }
  if (lower.includes("no such field") || lower.includes("invalid value for")) {
    return "The BigQuery chat tables exist but their schema doesn't match the app. Re-create them with the expected columns.";
  }
  return raw;
}
