const SECRET_FIELDS = new Set([
  "password",
  "token",
  "apikey",
  "secret",
  "authorization",
  "cookie",
  "session",
  "key",
]);

const LARGE_TEXT_FIELDS = new Set([
  "document_text",
  "extracted_text",
  "pdf_bytes_b64",
  "prompt_text",
  "response_text",
]);

const SECRET_PATTERNS = [
  /^Bearer .*/,
  /^sk-.*/,
  /^gsk_.*/,
  /^AIza.*/,
];

const MAX_STRING_LENGTH = 500;

export function redact(obj: Record<string, unknown>): Record<string, unknown> {
  return redactValue(obj) as Record<string, unknown>;
}

function redactValue(value: unknown, fieldName?: string): unknown {
  if (value === null || value === undefined) return value;

  if (fieldName !== undefined) {
    const normalizedField = fieldName.toLowerCase();
    if (SECRET_FIELDS.has(normalizedField)) return "[REDACTED]";
    if (LARGE_TEXT_FIELDS.has(normalizedField) && typeof value === "string") {
      return `[REDACTED: ${value.length} chars]`;
    }
  }

  if (typeof value === "string") {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(value)) return "[REDACTED]";
    }
    if (value.length > MAX_STRING_LENGTH) {
      return value.slice(0, 100) + `...[truncated ${value.length} chars]`;
    }
    return value;
  }

  if (Array.isArray(value)) return value.map((item) => redactValue(item));

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = redactValue(v, k);
    }
    return result;
  }

  return value;
}
