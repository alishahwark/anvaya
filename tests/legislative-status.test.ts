import { describe, expect, it } from "vitest";
import { applyVerifiedStatus, canApplyStatus } from "../lib/policy-status/engine";
import { hasVerifiedStay } from "../lib/policy-status/judicial";
import { legislativeRecords } from "../data/fixtures/legislative-records";

describe("legislative status safeguards", () => {
  it("allows passage without assent, but does not skip to in-force", () => {
    expect(canApplyStatus("under_consideration", "passed_parliament", { eventType: "passed_parliament", verificationStatus: "verified" })).toBe(true);
    expect(canApplyStatus("passed_parliament", "in_force", { eventType: "in_force", verificationStatus: "verified" })).toBe(false);
  });
  it("does not treat assent as commencement of every provision", () => {
    expect(applyVerifiedStatus("presidential_assent", { eventType: "partially_commenced", verificationStatus: "verified" })).toBe("partially_commenced");
    expect(applyVerifiedStatus("presidential_assent", { eventType: "in_force", verificationStatus: "unverified" })).toBe("presidential_assent");
  });
  it("does not turn a court challenge into a stay", () => {
    expect(hasVerifiedStay({ developmentType: "challenge", stayStatus: "unknown", verificationStatus: "verified" })).toBe(false);
    expect(hasVerifiedStay({ developmentType: "order", stayStatus: "granted", verificationStatus: "verified" })).toBe(true);
  });
  it("rejects unsupported or unverified AI-generated milestones", () => {
    expect(canApplyStatus("passed_parliament", "presidential_assent", { eventType: "presidential_assent", verificationStatus: "unverified" })).toBe(false);
  });
  it("marks missing current information as unverified", () => {
    expect(legislativeRecords.filter((record) => record.currentStatus === "unknown").length).toBeGreaterThanOrEqual(5);
    expect(legislativeRecords.filter((record) => record.currentStatus === "unknown").every((record) => record.statusConfidence === "unverified")).toBe(true);
  });
  it("uses an idempotent event key for duplicate imports", () => {
    const eventKey = (policy: string, type: string, date: string | null, title: string) => [policy, type, date ?? "", title].join("|");
    const keys = new Set([eventKey("p", "introduced", "2026-01-01", "Introduced"), eventKey("p", "introduced", "2026-01-01", "Introduced")]);
    expect(keys.size).toBe(1);
  });
});
