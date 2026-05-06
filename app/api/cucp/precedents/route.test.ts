// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { POST } from "./route";
import { signSession } from "@/lib/auth/mock-session";

const DB_PATH = join(
  process.cwd(),
  "lib/usecases/cucp-reevals/memory/memory-db.json",
);

let snapshot: string;
let token: string;

beforeAll(async () => {
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
  token = await signSession({ user: "tester" });
});

beforeEach(() => {
  snapshot = readFileSync(DB_PATH, "utf8");
});

afterEach(() => {
  writeFileSync(DB_PATH, snapshot, "utf8");
});

function makeReq(body: unknown, opts: { authed?: boolean; raw?: string } = {}) {
  return new Request("http://localhost/api/cucp/precedents", {
    method: "POST",
    body: opts.raw ?? JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...(opts.authed === false ? {} : { cookie: `govdoc_session=${token}` }),
    },
  });
}

describe("POST /api/cucp/precedents", () => {
  it("returns 401 without a session cookie", async () => {
    const res = await POST(makeReq({ level: 1, target: "x", correction: "y", reasoning: "z" }, { authed: false }));
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid JSON body", async () => {
    const res = await POST(makeReq(null, { raw: "not-json" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when level is not 1, 2, or 3", async () => {
    const res = await POST(makeReq({ level: 4, target: "t", correction: "c", reasoning: "r" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when target is empty", async () => {
    const res = await POST(makeReq({ level: 1, target: "  ", correction: "c", reasoning: "r" }));
    expect(res.status).toBe(400);
  });

  it("appends the precedent and returns updated count", async () => {
    const res = await POST(
      makeReq({ level: 2, target: "Test target", correction: "Test correction", reasoning: "Because tests" }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; level: number; count: number };
    expect(body.ok).toBe(true);
    expect(body.level).toBe(2);
    expect(body.count).toBe(1);

    const db = JSON.parse(readFileSync(DB_PATH, "utf8")) as {
      level_2_precedents: { target: string }[];
    };
    expect(db.level_2_precedents.at(-1)?.target).toBe("Test target");
  });
});
