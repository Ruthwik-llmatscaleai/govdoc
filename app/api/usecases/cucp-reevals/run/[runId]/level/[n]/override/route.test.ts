// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import { awaitLevelDecision, __clearLevelRendezvous } from "@/lib/runs/level-rendezvous";

beforeEach(() => {
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
  __clearLevelRendezvous();
});
afterEach(() => __clearLevelRendezvous());

async function authedReq(runId: string, n: string, body: unknown) {
  const token = await signSession({ user: "joe" });
  return new Request(
    `http://localhost/api/usecases/cucp-reevals/run/${runId}/level/${n}/override`,
    {
      method: "POST",
      headers: { cookie: `govdoc_session=${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

describe("POST /api/usecases/cucp-reevals/run/[runId]/level/[n]/override", () => {
  it("returns 401 without a session", async () => {
    const res = await POST(
      new Request("http://localhost/api/usecases/cucp-reevals/run/r/level/2/override", {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ runId: "r", n: "2" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when n is not 2 or 3", async () => {
    const req = await authedReq("r", "4", { override: { fact_id: "f", new_category: "c", reason: "r" } });
    const res = await POST(req, { params: Promise.resolve({ runId: "r", n: "4" }) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/n must be 2 or 3/);
  });

  it("returns 400 on invalid JSON body", async () => {
    const token = await signSession({ user: "joe" });
    const req = new Request(
      "http://localhost/api/usecases/cucp-reevals/run/r/level/2/override",
      {
        method: "POST",
        headers: { cookie: `govdoc_session=${token}`, "content-type": "application/json" },
        body: "{not json",
      },
    );
    const res = await POST(req, { params: Promise.resolve({ runId: "r", n: "2" }) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/Invalid JSON body/);
  });

  it("returns 400 when L2 override payload is missing fields", async () => {
    const req = await authedReq("r", "2", { override: { fact_id: "f" } });
    const res = await POST(req, { params: Promise.resolve({ runId: "r", n: "2" }) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/override payload shape invalid for level 2/);
  });

  it("returns 400 when L3 override has wrong verdict enum", async () => {
    const req = await authedReq("r", "3", {
      override: { s_no: "1", verdict: "Maybe", request_info: "No", reason: "r" },
    });
    const res = await POST(req, { params: Promise.resolve({ runId: "r", n: "3" }) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/override payload shape invalid for level 3/);
  });

  it("returns 400 when override is missing entirely", async () => {
    const req = await authedReq("r", "2", {});
    const res = await POST(req, { params: Promise.resolve({ runId: "r", n: "2" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when no waiter exists for that runId/level", async () => {
    const req = await authedReq("no-waiter", "2", {
      override: { fact_id: "f1", new_category: "Direct Use", reason: "x" },
    });
    const res = await POST(req, { params: Promise.resolve({ runId: "no-waiter", n: "2" }) });
    expect(res.status).toBe(404);
  });

  it("resolves the L2 waiter with override-and-rerun + payload (200)", async () => {
    const runId = "L2-run";
    const waiter = awaitLevelDecision<{ action: string; override: unknown }>(runId, 2);
    const override = { fact_id: "f1", new_category: "Direct Use", reason: "wrong" };
    const req = await authedReq(runId, "2", { override });
    const res = await POST(req, { params: Promise.resolve({ runId, n: "2" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    await expect(waiter).resolves.toEqual({ action: "override-and-rerun", override });
  });

  it("resolves the L3 waiter with override-and-rerun + payload (200)", async () => {
    const runId = "L3-run";
    const waiter = awaitLevelDecision<{ action: string; override: unknown }>(runId, 3);
    const override = { s_no: "2", verdict: "Pass", request_info: "No", reason: "ok" };
    const req = await authedReq(runId, "3", { override });
    const res = await POST(req, { params: Promise.resolve({ runId, n: "3" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    await expect(waiter).resolves.toEqual({ action: "override-and-rerun", override });
  });
});
