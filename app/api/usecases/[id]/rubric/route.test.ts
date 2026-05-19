// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET, POST, DELETE } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import { __setRubricStoreRootForTests } from "@/lib/usecases/rubric-store";

let root: string;

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubric-api-"));
  __setRubricStoreRootForTests(root);
});

afterEach(() => {
  __setRubricStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

async function authedReq(url: string, init: RequestInit = {}): Promise<Request> {
  const token = await signSession({ user: "test" });
  const headers = new Headers(init.headers);
  headers.set("cookie", `govdoc_session=${token}`);
  return new Request(url, { ...init, headers });
}

describe("/api/usecases/[id]/rubric", () => {
  it("GET returns the default rubric when nothing is saved", async () => {
    const req = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric");
    const res = await GET(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.questions)).toBe(true);
    expect(body.weights).toBeDefined();
  });

  it("POST persists a rubric and GET round-trips it", async () => {
    const payload = {
      questions: [{ id: "Z1", section: "Z: Custom", question: "q?", option_a: "a", option_b: "b", option_c: "c" }],
      weights: { A: 1, B: 0, C: 0, D: 0, E: 0, F: 0 },
    };
    const postReq = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const postRes = await POST(postReq, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(postRes.status).toBe(200);

    const getReq = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric");
    const getRes = await GET(getReq, { params: Promise.resolve({ id: "cmgc-pde" }) });
    const body = await getRes.json();
    expect(body.questions[0].id).toBe("Z1");
  });

  it("DELETE clears a saved rubric", async () => {
    const postReq = await authedReq("http://localhost/api/usecases/row-appraisal/rubric", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ "X": { "1": "a", "2": "b", "3": "c", "4": "d", "5": "e" } }),
    });
    await POST(postReq, { params: Promise.resolve({ id: "row-appraisal" }) });

    const delReq = await authedReq("http://localhost/api/usecases/row-appraisal/rubric", { method: "DELETE" });
    const delRes = await DELETE(delReq, { params: Promise.resolve({ id: "row-appraisal" }) });
    expect(delRes.status).toBe(200);

    const getReq = await authedReq("http://localhost/api/usecases/row-appraisal/rubric");
    const getRes = await GET(getReq, { params: Promise.resolve({ id: "row-appraisal" }) });
    const body = await getRes.json();
    // Default ROW schema starts with "Title Page"
    expect(Object.keys(body)).toContain("Title Page");
  });

  it("rejects an unknown use case id with 404", async () => {
    const req = await authedReq("http://localhost/api/usecases/not-real/rubric");
    const res = await GET(req, { params: Promise.resolve({ id: "not-real" }) });
    expect(res.status).toBe(404);
  });

  it("requires authentication", async () => {
    const req = new Request("http://localhost/api/usecases/cmgc-pde/rubric");
    const res = await GET(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(401);
  });

  describe("POST query params — mode / bump / versionId", () => {
    const baseBody = {
      questions: [],
      weights: { A: 1, B: 0, C: 0, D: 0, E: 0, F: 0 },
    };

    it("returns the assigned versionId on a default save", async () => {
      const req = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(baseBody),
      });
      const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.versionId).toBe("v1");
    });

    it("threads bump=major to the store", async () => {
      const post1 = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(baseBody),
      });
      await POST(post1, { params: Promise.resolve({ id: "cmgc-pde" }) });

      const post2 = await authedReq(
        "http://localhost/api/usecases/cmgc-pde/rubric?bump=major",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(baseBody),
        },
      );
      const res2 = await POST(post2, { params: Promise.resolve({ id: "cmgc-pde" }) });
      const body2 = await res2.json();
      expect(body2.versionId).toBe("v2");
    });

    it("mode=overwrite rewrites the head version", async () => {
      const post1 = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(baseBody),
      });
      await POST(post1, { params: Promise.resolve({ id: "cmgc-pde" }) });

      const post2 = await authedReq(
        "http://localhost/api/usecases/cmgc-pde/rubric?mode=overwrite",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            questions: [
              { id: "Z1", section: "Z: Custom", question: "q?", option_a: "a", option_b: "b", option_c: "c" },
            ],
            weights: { A: 1, B: 0, C: 0, D: 0, E: 0, F: 0 },
          }),
        },
      );
      const res2 = await POST(post2, { params: Promise.resolve({ id: "cmgc-pde" }) });
      const body2 = await res2.json();
      expect(body2.versionId).toBe("v1");

      const getReq = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric?versionId=v1");
      const getRes = await GET(getReq, { params: Promise.resolve({ id: "cmgc-pde" }) });
      const body = await getRes.json();
      expect(body.questions[0].id).toBe("Z1");
    });

    it("mode=overwrite with no versions returns 400", async () => {
      const post = await authedReq(
        "http://localhost/api/usecases/cmgc-pde/rubric?mode=overwrite",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(baseBody),
        },
      );
      const res = await POST(post, { params: Promise.resolve({ id: "cmgc-pde" }) });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/No version to overwrite/);
    });

    it("custom versionId is written verbatim", async () => {
      const post = await authedReq(
        "http://localhost/api/usecases/cmgc-pde/rubric?versionId=v7.7",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(baseBody),
        },
      );
      const res = await POST(post, { params: Promise.resolve({ id: "cmgc-pde" }) });
      const body = await res.json();
      expect(body.versionId).toBe("v7.7");
    });
  });
});
