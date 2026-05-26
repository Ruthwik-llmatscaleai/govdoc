import { describe, it, expect } from "vitest";
import { redact } from "./redact";

describe("redact", () => {
  describe("secret fields", () => {
    it("redacts password field", () => {
      expect(redact({ password: "hunter2" })).toEqual({
        password: "[REDACTED]",
      });
    });

    it("redacts token field", () => {
      expect(redact({ token: "abc123" })).toEqual({ token: "[REDACTED]" });
    });

    it("redacts apiKey field (case-insensitive)", () => {
      expect(redact({ apiKey: "key-value" })).toEqual({
        apiKey: "[REDACTED]",
      });
    });

    it("redacts secret, authorization, cookie, session, key", () => {
      const input = {
        secret: "s",
        authorization: "a",
        cookie: "c",
        session: "sess",
        key: "k",
      };
      const result = redact(input);
      for (const v of Object.values(result)) {
        expect(v).toBe("[REDACTED]");
      }
    });
  });

  describe("large text fields", () => {
    it("redacts document_text with char count", () => {
      const text = "a".repeat(50);
      expect(redact({ document_text: text })).toEqual({
        document_text: "[REDACTED: 50 chars]",
      });
    });

    it("redacts extracted_text, pdf_bytes_b64, prompt_text, response_text", () => {
      const result = redact({
        extracted_text: "hello",
        pdf_bytes_b64: "base64data",
        prompt_text: "prompt",
        response_text: "resp",
      });
      expect(result.extracted_text).toBe("[REDACTED: 5 chars]");
      expect(result.pdf_bytes_b64).toBe("[REDACTED: 10 chars]");
      expect(result.prompt_text).toBe("[REDACTED: 6 chars]");
      expect(result.response_text).toBe("[REDACTED: 4 chars]");
    });
  });

  describe("regex patterns", () => {
    it("redacts Bearer tokens", () => {
      expect(redact({ header: "Bearer eyJhbGciOi..." })).toEqual({
        header: "[REDACTED]",
      });
    });

    it("redacts sk- prefixed keys", () => {
      expect(redact({ openaiKey: "sk-proj-abc123def" })).toEqual({
        openaiKey: "[REDACTED]",
      });
    });

    it("redacts gsk_ prefixed keys", () => {
      expect(redact({ groqKey: "gsk_abc123" })).toEqual({
        groqKey: "[REDACTED]",
      });
    });

    it("redacts AIza prefixed keys", () => {
      expect(redact({ googleKey: "AIzaSyB-something" })).toEqual({
        googleKey: "[REDACTED]",
      });
    });
  });

  describe("long string truncation", () => {
    it("truncates strings over 500 chars", () => {
      const longStr = "x".repeat(600);
      const result = redact({ description: longStr }) as { description: string };
      expect(result.description).toBe("x".repeat(100) + "...[truncated 600 chars]");
    });

    it("preserves strings at or under 500 chars", () => {
      const str = "y".repeat(500);
      expect(redact({ note: str })).toEqual({ note: str });
    });
  });

  describe("nested objects", () => {
    it("redacts fields in nested objects", () => {
      const input = {
        user: { name: "Alice", password: "secret123" },
        meta: { token: "tok" },
      };
      expect(redact(input)).toEqual({
        user: { name: "Alice", password: "[REDACTED]" },
        meta: { token: "[REDACTED]" },
      });
    });

    it("redacts fields in arrays", () => {
      const input = { items: [{ token: "abc" }, { token: "def" }] };
      const result = redact(input) as { items: Array<{ token: string }> };
      expect(result.items[0].token).toBe("[REDACTED]");
      expect(result.items[1].token).toBe("[REDACTED]");
    });
  });

  describe("passthrough", () => {
    it("passes through numbers, booleans, null, undefined", () => {
      expect(redact({ count: 42, active: true, empty: null })).toEqual({
        count: 42,
        active: true,
        empty: null,
      });
    });

    it("passes through safe strings", () => {
      expect(redact({ msg: "hello world" })).toEqual({ msg: "hello world" });
    });
  });
});
