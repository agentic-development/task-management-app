import { describe, it, expect } from "vitest";

import { GET } from "./route";

describe("GET /health", () => {
  it("returns 200 with { status: 'ok' }", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });
});
