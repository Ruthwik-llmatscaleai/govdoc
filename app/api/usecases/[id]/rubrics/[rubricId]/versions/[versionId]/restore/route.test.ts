// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POST } from "./route";
import { signSession } from "@/features/auth/mock-session";
import {
  __setRubricsStoreRootForTests,
  loadRubric,
  listVersions,
  saveRubric,
} from "@/features/rubrics/store";

let root: string;

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubric-restore-"));
  __setRubricsStoreRootForTests(root);
});

afterEach(() => {
  __setRubricsStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

async function authedReq(body?: unknown): Promise<Request> {
  const token = await signSession({ user: "test" });
  return new Request("http://x/restore", {
    method: "POST",
    headers: {
      cookie: `govdoc_session=${token}`,
      "content-type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("POST .../versions/[versionId]/restore", () => {
  it("copies the chosen version's content into the live file and creates a new version", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });   // v1
    await saveRubric("cmgc-pde", "default", { v: 2 });   // v1.1

    const req = await authedReq({ note: "rolled back to v1" });
    const res = await POST(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default", versionId: "v1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.newVersionId).toBe("v1.2");

    const live = await loadRubric("cmgc-pde", "default");
    expect(live).toEqual({ v: 1 });

    const versions = await listVersions("cmgc-pde", "default");
    expect(versions[0]!.id).toBe("v1.2");
    expect(versions[0]!.source).toBe("restore");
    expect(versions[0]!.note).toBe("rolled back to v1");
  });

  it("404 for an unknown version", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    const req = await authedReq();
    const res = await POST(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default", versionId: "v999" }),
    });
    expect(res.status).toBe(404);
  });
});
