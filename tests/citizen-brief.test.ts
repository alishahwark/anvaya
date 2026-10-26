import { describe, expect, it } from "vitest";
import { legislativeRecords } from "../data/fixtures/legislative-records";
import { citizenBriefFor } from "../lib/policies/citizen-brief";

describe("citizen-facing policy briefs", () => {
  it("does not expose the DPDP ingestion summary as the citizen brief", () => {
    const brief = citizenBriefFor(legislativeRecords[0]);
    expect(brief.plainLanguageSummary).toMatch(/framework for how organisations handle digital personal data/);
    expect(brief.plainLanguageSummary).not.toMatch(/imported Act|G\.S\.R\. 843\(E\) establish/);
    expect(brief.startsLater).toMatch(/13 November 2026/);
  });
  it("keeps source-poor records honest", () => {
    const brief = citizenBriefFor(legislativeRecords.find((record) => record.slug === "securities-markets-code-2025")!);
    expect(brief.plainLanguageSummary).toMatch(/not yet have enough authenticated source material/);
    expect(brief.whatChanges).toEqual([]);
  });
});
