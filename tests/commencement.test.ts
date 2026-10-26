import { describe, expect, it } from "vitest";
import { commencementState, dpdpCommencementGroups } from "../lib/policy-status/commencement";

describe("DPDP provision commencement schedule", () => {
  it("calculates the three dates from 13 November 2025", () => { expect(dpdpCommencementGroups.map((group) => group.calculatedDate)).toEqual(["2025-11-13", "2026-11-13", "2027-05-13"]); });
  it("keeps the published relative rule distinct from verification", () => { expect(dpdpCommencementGroups.every((group) => group.relativeRule.length > 0 && group.sourceStatus === "unverified")).toBe(true); });
  it("does not show unverified schedules as legal effect at the October 25 2026 boundary", () => { expect(commencementState(dpdpCommencementGroups[0], "2026-10-25")).toBe("scheduled_unverified"); expect(commencementState(dpdpCommencementGroups[1], "2026-10-25")).toBe("scheduled_unverified"); expect(commencementState(dpdpCommencementGroups[2], "2026-10-25")).toBe("scheduled_unverified"); });
  it("uses date boundaries only after a source is verified", () => { const group = { ...dpdpCommencementGroups[0], sourceStatus: "verified" as const }; expect(commencementState(group, "2025-11-12")).toBe("future_on_schedule"); expect(commencementState(group, "2025-11-13")).toBe("effective_on_schedule"); });
});
