import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns 200 with ok=true and the service name", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("govdoc");
    expect(typeof body.uptimeSec).toBe("number");
  });

  it("includes commit when GIT_COMMIT is set", async () => {
    process.env.GIT_COMMIT = "abc1234";
    const res = await GET();
    const body = await res.json();
    expect(body.commit).toBe("abc1234");
    delete process.env.GIT_COMMIT;
  });

  it("omits commit when GIT_COMMIT is unset", async () => {
    delete process.env.GIT_COMMIT;
    const res = await GET();
    const body = await res.json();
    expect(body.commit).toBeUndefined();
  });
});
