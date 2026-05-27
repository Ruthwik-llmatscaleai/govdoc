import { existsSync } from "node:fs";
import { BigQuery } from "@google-cloud/bigquery";

let _client: BigQuery | null = null;

/**
 * Lazy singleton BigQuery client.
 *
 * Credentials resolve via Application Default Credentials:
 *   - Local: `gcloud auth application-default login` writes a token under
 *     %APPDATA%\gcloud\application_default_credentials.json which the SDK
 *     picks up automatically.
 *   - Cloud Run: workload identity / attached service account.
 *
 * No JSON key file lives in the repo.
 *
 * Defensive cleanup: if the dev machine has a stale
 * GOOGLE_APPLICATION_CREDENTIALS env var (very common on Windows after
 * working on other GCP projects) pointing at a key file that no longer
 * exists, the Google auth library would crash with `ENOENT: ... lstat`.
 * Strip the var so the library falls back to the working ADC token.
 */
export function bq(): BigQuery {
  if (_client) return _client;
  const projectId = process.env.BIGQUERY_PROJECT;
  if (!projectId) {
    throw new Error("BIGQUERY_PROJECT env var is required");
  }
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath && credsPath.trim().length > 0 && !existsSync(credsPath)) {
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  _client = new BigQuery({ projectId });
  return _client;
}

export function bqDataset(): string {
  const d = process.env.BIGQUERY_DATASET;
  if (!d) throw new Error("BIGQUERY_DATASET env var is required");
  return d;
}

export function bqTable(envKey: "BIGQUERY_TABLE_CONVERSATIONS" | "BIGQUERY_TABLE_MESSAGES"): string {
  const v = process.env[envKey];
  if (!v) throw new Error(`${envKey} env var is required`);
  return v;
}

/** `project.dataset.table` — used in parameterized SQL. */
export function bqFqn(envKey: "BIGQUERY_TABLE_CONVERSATIONS" | "BIGQUERY_TABLE_MESSAGES"): string {
  const project = process.env.BIGQUERY_PROJECT;
  if (!project) throw new Error("BIGQUERY_PROJECT env var is required");
  return `\`${project}.${bqDataset()}.${bqTable(envKey)}\``;
}
