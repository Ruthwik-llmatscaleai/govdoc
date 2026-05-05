import { describe, it, expect } from "vitest";
import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  it("clears session cookie", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("govdoc_session=");
    expect(setCookie).toMatch(/Max-Age=0|Expires=/);
  });
});
