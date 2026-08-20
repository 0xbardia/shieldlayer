import { describe, expect, it } from "vitest";
import { validateEvent } from "../../src/lib/event-schema";

describe("typed oracle inputs", () => {
  it("accepts a well-formed flight", () => {
    const r = validateEvent("flight_delay", {
      flight: "BA249",
      date: "2026-08-01",
      hours: 3,
    });
    expect(r.ok).toBe(true);
  });
  it("rejects injected flight strings", () => {
    const r = validateEvent("flight_delay", {
      flight: "http://evil.test",
      date: "2026-08-01",
      hours: 3,
    });
    expect(r.ok).toBe(false);
  });
  it("rejects unknown companies", () => {
    const r = validateEvent("bankruptcy", { company: "HACK", date: "2026-08-01" });
    expect(r.ok).toBe(false);
  });
});
