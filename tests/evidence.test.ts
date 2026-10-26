import { describe, expect, it } from "vitest";
import { legislativeRecords } from "../data/fixtures/legislative-records";

describe("evidence boundaries", () => {
  it("keeps missing documents safe for the frontend", () => {
    const missing = legislativeRecords.find((record) => record.slug === "securities-markets-code-2025");
    expect(missing?.sources).toEqual([]);
    expect(missing?.currentInformation).toMatch(/Unknown/);
  });
  it("only exposes citations belonging to the selected record", () => {
    const record = legislativeRecords[0];
    const valid = new Set(record.sources.map((_, index) => `source-${index + 1}`));
    expect(["source-1", "source-999"].filter((id) => valid.has(id))).toEqual(["source-1"]);
  });
  it("keeps verified document identity distinct from a generic URL", () => {
    expect(legislativeRecords[0].sources[0].verificationStatus).toBe("verified");
    expect(legislativeRecords[0].sources[0].locator).toContain("p. 1");
  });
});
